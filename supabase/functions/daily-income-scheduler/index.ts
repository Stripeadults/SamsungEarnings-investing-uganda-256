/**
 * daily-income-scheduler - FIXED
 * - Fixes 1000 limit bug (pagination)
 * - Pays active + approved
 * - Handles null balances
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const authHeader = req.headers.get('x-scheduler-secret');
  const schedulerSecret = Deno.env.get('SCHEDULER_SECRET');
  if (schedulerSecret && authHeader !== schedulerSecret) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  const now = new Date();
  console.log(`[daily-income-scheduler] Running at ${now.toISOString()}`);

  let credited = 0;
  let total = 0;
  const errors: string[] = [];

  // ── FIX 1: Fetch ALL products with pagination ──
  let allProducts: any[] = [];
  let from = 0;
  const PAGE = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('samsung_products')
      .select('id, user_id, package_name, daily_income, status, expiry_date, last_income_date, total_income_earned')
      .in('status', ['active', 'approved', 'Approved']) // FIX 2: pay both
      .range(from, from + PAGE - 1);

    if (error) { errors.push(`Fetch error: ${error.message}`); break; }
    if (!data || data.length === 0) break;
    allProducts = allProducts.concat(data);
    if (data.length < PAGE) break;
    from += PAGE;
  }

  console.log(`[daily-income-scheduler] Processing ${allProducts.length} products`);

  for (const product of allProducts) {
    if (!product.daily_income) continue;

    // expiry - handle null
    if (product.expiry_date) {
      const expiry = new Date(product.expiry_date);
      if (!isNaN(expiry.getTime()) && now > expiry) {
        await supabase.from('samsung_products').update({ status: 'expired' }).eq('id', product.id);
        continue;
      }
    }

    const lastIncome = product.last_income_date ? new Date(product.last_income_date) : null;
    const hoursSinceLast = lastIncome ? (now.getTime() - lastIncome.getTime()) / (1000 * 60 * 60) : 25;
    if (hoursSinceLast < 24) continue;

    const { data: userData, error: userErr } = await supabase
      .from('samsung_users')
      .select('id, balance, total_earnings, daily_earnings')
      .eq('id', product.user_id)
      .single();

    if (userErr || !userData) { errors.push(`User ${product.user_id} not found`); continue; }

    // FIX 3: handle null with Number() || 0
    const balance = Number(userData.balance || 0);
    const totalEarnings = Number(userData.total_earnings || 0);
    const dailyEarnings = Number(userData.daily_earnings || 0);
    const totalIncomeEarned = Number(product.total_income_earned || 0);

    const { error: userUpdateErr } = await supabase
      .from('samsung_users')
      .update({
        balance: balance + product.daily_income,
        total_earnings: totalEarnings + product.daily_income,
        daily_earnings: dailyEarnings + product.daily_income,
      })
      .eq('id', userData.id);

    if (userUpdateErr) { errors.push(`User ${userData.id}: ${userUpdateErr.message}`); continue; }

    await supabase.from('samsung_products').update({
      last_income_date: now.toISOString(),
      total_income_earned: totalIncomeEarned + product.daily_income,
    }).eq('id', product.id);

    await supabase.from('samsung_notifications').insert({
      user_id: userData.id,
      type: 'daily_income',
      title: 'Daily Income Received',
      message: `You earned UGX ${product.daily_income.toLocaleString()} from ${product.package_name}`,
      is_read: false,
    });

    credited++; total += product.daily_income;
  }

  return new Response(JSON.stringify({ success: true, timestamp: now.toISOString(), processed: allProducts.length, credited, total, errors }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
});
