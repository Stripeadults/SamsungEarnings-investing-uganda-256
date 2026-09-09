/**
 * daily-income-scheduler - FIXED FINAL
 * - Fixes: 401 secret, status case, user-first update (no lost income)
 * - Safe to run multiple times per day - 1x per day lock
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // AUTH - Allow if no secret set, or if secret matches
  const authHeader = req.headers.get('x-scheduler-secret');
  const schedulerSecret = Deno.env.get('SCHEDULER_SECRET');
  if (schedulerSecret && authHeader !== schedulerSecret) {
    console.error(`[daily-income-scheduler] Unauthorized - expected secret but got ${authHeader ? 'wrong secret' : 'no secret'}`);
    return new Response(JSON.stringify({ error: 'Unauthorized', hint: 'Send x-scheduler-secret header' }), { 
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  
  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: 'Missing env vars' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  console.log(`[daily-income-scheduler] Running at ${now.toISOString()} - today ${todayStr}`);

  let credited = 0;
  let total = 0;
  let skippedToday = 0;
  let skippedHours = 0;
  let expiredCount = 0;
  const errors: string[] = [];

  // Fetch all products
  let allProducts: any[] = [];
  let from = 0;
  const PAGE = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('samsung_products')
      .select('id, user_id, package_name, daily_income, status, expiry_date, last_income_date, total_income_earned')
      .range(from, from + PAGE - 1);
      
    if (error) { 
      console.error(`Fetch error: ${error.message}`);
      errors.push(`Fetch error: ${error.message}`); 
      break; 
    }
    if (!data || data.length === 0) break;
    allProducts = allProducts.concat(data);
    if (data.length < PAGE) break;
    from += PAGE;
  }

  // FIX 1: Case-insensitive status filter
  const activeProducts = allProducts.filter(p => {
    const s = String(p.status || '').toLowerCase();
    return ['active','approved'].includes(s);
  });

  console.log(`[daily-income-scheduler] Total: ${allProducts.length}, Active/Approved: ${activeProducts.length}`);

  for (const product of activeProducts) {
    const dailyIncome = Number(product.daily_income || 0);
    if (!dailyIncome || dailyIncome <= 0) continue;

    // Check expiry
    if (product.expiry_date) {
      const expiry = new Date(product.expiry_date);
      if (!isNaN(expiry.getTime()) && now > expiry) {
        await supabase.from('samsung_products').update({ status: 'expired' }).eq('id', product.id);
        expiredCount++;
        continue;
      }
    }

    // FIX 2: Skip if already paid today - DATE ONLY check
    if (product.last_income_date) {
      const lastStr = new Date(product.last_income_date).toISOString().slice(0, 10);
      if (lastStr === todayStr) {
        skippedToday++;
        continue;
      }
      // FIX 3: 24h check
      const lastIncome = new Date(product.last_income_date);
      const hoursSinceLast = (now.getTime() - lastIncome.getTime()) / (1000 * 60 * 60);
      if (hoursSinceLast < 23.5) { // 23.5h buffer to avoid timezone issues
        skippedHours++;
        continue;
      }
    }

    const { data: userData, error: userErr } = await supabase
      .from('samsung_users')
      .select('id, balance, total_earnings, daily_earnings')
      .eq('id', product.user_id)
      .single();

    if (userErr || !userData) { 
      errors.push(`User ${product.user_id} not found: ${userErr?.message}`); 
      continue; 
    }

    const balance = Number(userData.balance || 0);
    const totalEarnings = Number(userData.total_earnings || 0);
    const userDailyEarnings = Number(userData.daily_earnings || 0);
    const totalIncomeEarned = Number(product.total_income_earned || 0);

    // FIX 4: UPDATE USER FIRST - so we never lose money
    const { error: userUpdateErr } = await supabase
      .from('samsung_users')
      .update({
        balance: balance + dailyIncome,
        total_earnings: totalEarnings + dailyIncome,
        daily_earnings: userDailyEarnings + dailyIncome,
        updated_at: now.toISOString(),
      })
      .eq('id', userData.id);

    if (userUpdateErr) { 
      console.error(`User update failed ${userData.id}: ${userUpdateErr.message}`);
      errors.push(`User ${userData.id}: ${userUpdateErr.message}`); 
      continue; 
    }

    // Then lock product
    const { error: prodErr } = await supabase.from('samsung_products').update({
      last_income_date: now.toISOString(),
      total_income_earned: totalIncomeEarned + dailyIncome,
    }).eq('id', product.id);

    if (prodErr) { 
      // Rollback user if product lock fails
      await supabase.from('samsung_users').update({
        balance: balance,
        total_earnings: totalEarnings,
        daily_earnings: userDailyEarnings,
      }).eq('id', userData.id);
      errors.push(`Product ${product.id} lock failed, rolled back: ${prodErr.message}`); 
      continue; 
    }

    await supabase.from('samsung_notifications').insert({
      user_id: userData.id,
      type: 'daily_income',
      title: 'Daily Income Received',
      message: `You earned UGX ${dailyIncome.toLocaleString()} from ${product.package_name}`,
      is_read: false,
      created_at: now.toISOString(),
    });

    credited++; 
    total += dailyIncome;
  }

  const result = { 
    success: true, 
    timestamp: now.toISOString(), 
    today: todayStr,
    processed_total: allProducts.length,
    processed_active: activeProducts.length,
    credited, 
    total_amount: total,
    skipped: { already_today: skippedToday, less_than_24h: skippedHours, expired: expiredCount },
    errors: errors.slice(0, 20) // only first 20 errors
  };
  
  console.log(`[daily-income-scheduler] DONE`, JSON.stringify(result));
  
  return new Response(JSON.stringify(result), { 
    status: 200, 
    headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
  });
});
