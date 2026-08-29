/**
 * daily-income-scheduler
 *
 * Runs the daily income engine for all active Samsung packages.
 * - Can be triggered via HTTP POST (e.g., from admin or cron services)
 * - Designed to be safe to call multiple times per day (24-hr guard built-in)
 *
 * Cron: every day at 21:00 UTC = midnight Uganda time (EAT = UTC+3)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface Product {
  id: string;
  user_id: string;
  package_name: string;
  daily_income: number;
  status: string;
  expiry_date: string;
  last_income_date: string | null;
  total_income_earned: number;
}

interface User {
  id: string;
  balance: number;
  total_earnings: number;
  daily_earnings: number;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Optional secret key check to prevent unauthorized triggers
  const authHeader = req.headers.get('x-scheduler-secret');
  const schedulerSecret = Deno.env.get('SCHEDULER_SECRET');
  if (schedulerSecret && authHeader !== schedulerSecret) {
    console.error('Unauthorized scheduler call — invalid secret');
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  const now = new Date();
  console.log(`[daily-income-scheduler] Running at ${now.toISOString()} (Uganda midnight EAT)`);

  let credited = 0;
  let total = 0;
  const errors: string[] = [];

  // ── Fetch all active products ──────────────────────────────────────────────
  const { data: products, error: prodErr } = await supabase
    .from('samsung_products')
    .select('id, user_id, package_name, daily_income, status, expiry_date, last_income_date, total_income_earned')
    .eq('status', 'active');

  if (prodErr) {
    console.error('Failed to fetch products:', prodErr.message);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch products', details: prodErr.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  console.log(`[daily-income-scheduler] Processing ${(products ?? []).length} active products`);

  for (const product of (products ?? []) as Product[]) {
    // ── Check expiry ──────────────────────────────────────────────────────────
    const expiry = new Date(product.expiry_date);
    if (now > expiry) {
      const { error } = await supabase
        .from('samsung_products')
        .update({ status: 'expired' })
        .eq('id', product.id);
      if (error) errors.push(`Expire ${product.id}: ${error.message}`);
      else console.log(`[daily-income-scheduler] Expired product ${product.id}`);
      continue;
    }

    // ── 24-hour guard ─────────────────────────────────────────────────────────
    const lastIncome = product.last_income_date ? new Date(product.last_income_date) : null;
    const hoursSinceLast = lastIncome
      ? (now.getTime() - lastIncome.getTime()) / (1000 * 60 * 60)
      : 25; // First time — always eligible

    if (hoursSinceLast < 24) {
      console.log(`[daily-income-scheduler] Skipping product ${product.id} — only ${hoursSinceLast.toFixed(1)}h since last income`);
      continue;
    }

    // ── Fetch the user ────────────────────────────────────────────────────────
    const { data: userData, error: userErr } = await supabase
      .from('samsung_users')
      .select('id, balance, total_earnings, daily_earnings')
      .eq('id', product.user_id)
      .single();

    if (userErr || !userData) {
      errors.push(`User ${product.user_id} not found: ${userErr?.message ?? 'null'}`);
      continue;
    }

    const user = userData as User;

    // ── Credit income to user ─────────────────────────────────────────────────
    const { error: userUpdateErr } = await supabase
      .from('samsung_users')
      .update({
        balance: user.balance + product.daily_income,
        total_earnings: user.total_earnings + product.daily_income,
        daily_earnings: user.daily_earnings + product.daily_income,
      })
      .eq('id', user.id);

    if (userUpdateErr) {
      errors.push(`Update user ${user.id}: ${userUpdateErr.message}`);
      continue;
    }

    // ── Update product's last income date ─────────────────────────────────────
    const { error: productUpdateErr } = await supabase
      .from('samsung_products')
      .update({
        last_income_date: now.toISOString(),
        total_income_earned: product.total_income_earned + product.daily_income,
      })
      .eq('id', product.id);

    if (productUpdateErr) {
      errors.push(`Update product ${product.id}: ${productUpdateErr.message}`);
      continue;
    }

    // ── Send notification to user ─────────────────────────────────────────────
    const { error: notifErr } = await supabase
      .from('samsung_notifications')
      .insert({
        user_id: user.id,
        type: 'daily_income',
        title: 'Daily Income Received',
        message: `You earned UGX ${product.daily_income.toLocaleString()} from ${product.package_name}`,
        is_read: false,
      });

    if (notifErr) {
      console.warn(`Notification for user ${user.id} failed: ${notifErr.message}`);
      // Non-fatal — don't add to errors
    }

    credited += 1;
    total += product.daily_income;
    console.log(`[daily-income-scheduler] Credited UGX ${product.daily_income} to user ${user.id} for product ${product.id}`);
  }

  const result = {
    success: true,
    timestamp: now.toISOString(),
    credited,
    total,
    errors: errors.length > 0 ? errors : undefined,
  };

  console.log(`[daily-income-scheduler] Done — credited: ${credited}, total: UGX ${total}, errors: ${errors.length}`);

  return new Response(
    JSON.stringify(result),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
});
