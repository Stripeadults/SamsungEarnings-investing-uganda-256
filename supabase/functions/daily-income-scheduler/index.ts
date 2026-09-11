/**
 * daily-income-scheduler - FIXED - Package-locked earnings
 * Ensures daily earnings = exactly package definition, not product field
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });

  const authHeader = req.headers.get('x-scheduler-secret');
  const schedulerSecret = Deno.env.get('SCHEDULER_SECRET');
  if (schedulerSecret && authHeader !== schedulerSecret) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const supabase = createClient(supabaseUrl, serviceKey);

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  // 1. FETCH MASTER PACKAGES - CHANGE TABLE NAME IF NEEDED
  // Try 3 common names
  let packagesMap = new Map<string, number>();
  for (const tbl of ['samsung_packages', 'packages', 'investment_packages']) {
    const { data } = await supabase.from(tbl).select('name, daily_income, package_name, daily_profit');
    if (data && data.length > 0) {
      data.forEach((p: any) => {
        const name = String(p.name || p.package_name || '').toLowerCase().trim();
        const income = Number(p.daily_income || p.daily_profit || 0);
        if (name) packagesMap.set(name, income);
      });
      console.log(`[FIX] Loaded ${data.length} packages from ${tbl}`);
      break;
    }
  }

  if (packagesMap.size === 0) {
    console.warn('[FIX] No packages table found, falling back to product.daily_income');
  }

  let allProducts: any[] = [];
  let from = 0; const PAGE = 1000;
  while (true) {
    const { data } = await supabase.from('samsung_products').select('id, user_id, package_name, daily_income, status, expiry_date, last_income_date, total_income_earned').range(from, from + PAGE - 1);
    if (!data || data.length === 0) break;
    allProducts = allProducts.concat(data);
    if (data.length < PAGE) break;
    from += PAGE;
  }

  const activeProducts = allProducts.filter(p => ['active','approved'].includes(String(p.status || '').toLowerCase()));
  
  let credited = 0, total = 0, fixedCount = 0, errors: string[] = [];

  for (const product of activeProducts) {
    if (product.expiry_date && now > new Date(product.expiry_date)) {
      await supabase.from('samsung_products').update({ status: 'expired' }).eq('id', product.id);
      continue;
    }
    if (product.last_income_date) {
      const lastStr = new Date(product.last_income_date).toISOString().slice(0, 10);
      if (lastStr === todayStr) continue;
      if ((now.getTime() - new Date(product.last_income_date).getTime()) / (1000*60*60) < 23.5) continue;
    }

    // 2. LOCKED DAILY INCOME LOGIC
    let dailyIncome = Number(product.daily_income || 0);
    const pkgKey = String(product.package_name || '').toLowerCase().trim();
    const correctIncome = packagesMap.get(pkgKey);

    if (correctIncome !== undefined && correctIncome > 0 && correctIncome !== dailyIncome) {
      console.log(`[FIX] Product ${product.id} (${product.package_name}) had ${dailyIncome}, correcting to ${correctIncome}`);
      dailyIncome = correctIncome;
      fixedCount++;
      // Fix the product row permanently
      await supabase.from('samsung_products').update({ daily_income: correctIncome }).eq('id', product.id);
    }

    if (!dailyIncome || dailyIncome <= 0) continue;

    const { data: userData } = await supabase.from('samsung_users').select('id, balance, total_earnings').eq('id', product.user_id).single();
    if (!userData) continue;

    // User first update
    const { error: userErr } = await supabase.from('samsung_users').update({
      balance: Number(userData.balance || 0) + dailyIncome,
      total_earnings: Number(userData.total_earnings || 0) + dailyIncome,
      updated_at: now.toISOString(),
    }).eq('id', userData.id);

    if (userErr) { errors.push(userErr.message); continue; }

    const { error: prodErr } = await supabase.from('samsung_products').update({
      last_income_date: now.toISOString(),
      total_income_earned: Number(product.total_income_earned || 0) + dailyIncome,
    }).eq('id', product.id);

    if (prodErr) {
      // rollback
      await supabase.from('samsung_users').update({ balance: userData.balance, total_earnings: userData.total_earnings }).eq('id', userData.id);
      continue;
    }

    credited++; total += dailyIncome;
  }

  return new Response(JSON.stringify({ success: true, today: todayStr, credited, total_amount: total, fixed_wrong_packages: fixedCount, errors: errors.slice(0,10) }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
});
