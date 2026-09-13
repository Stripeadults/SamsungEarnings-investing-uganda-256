/**
 * daily-income-scheduler - PACKAGE-LOCKED FINAL FIX
 * Ensures daily earnings = exactly PACKAGES constant
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const PACKAGES_MAP: Record<string, number> = {
  'galaxy-a05': 3000,
  'galaxy-a15': 7000,
  'galaxy-a25': 12500,
  'galaxy-a35': 26000,
  'galaxy-a55': 40000,
  'galaxy-s23-fe': 90000,
  'galaxy-s24': 160000,
  'galaxy-s24-plus': 280200,
  'galaxy-s24-ultra': 450000,
  'galaxy-z-flip6': 500000,
  'galaxy-z-fold6': 700000,
};

// Also map by name for old records
const PACKAGES_BY_NAME: Record<string, number> = {
  'galaxy a05': 3000, 'galaxy a15': 7000, 'galaxy a25': 12500,
  'galaxy a35': 26000, 'galaxy a55': 40000, 'galaxy s23 fe': 90000,
  'galaxy s24': 160000, 'galaxy s24+': 280200, 'galaxy s24 plus': 280200,
  'galaxy s24 ultra': 450000, 'galaxy z flip6': 500000, 'galaxy z fold6 vip': 700000, 'galaxy z fold6': 700000,
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });

  const authHeader = req.headers.get('x-scheduler-secret');
  const schedulerSecret = Deno.env.get('SCHEDULER_SECRET');
  if (schedulerSecret && authHeader!== schedulerSecret) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: {...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  let allProducts: any[] = [];
  let from = 0;
  while (true) {
    const { data } = await supabase.from('samsung_products')
     .select('id, user_id, package_id, package_name, daily_income, status, expiry_date, last_income_date, total_income_earned')
     .range(from, from + 999);
    if (!data || data.length === 0) break;
    allProducts = allProducts.concat(data);
    if (data.length < 1000) break;
    from += 1000;
  }

  const active = allProducts.filter(p => ['active','approved'].includes(String(p.status).toLowerCase()));
  let credited = 0, total = 0, fixed = 0;

  for (const product of active) {
    if (product.expiry_date && now > new Date(product.expiry_date)) {
      await supabase.from('samsung_products').update({ status: 'expired' }).eq('id', product.id);
      continue;
    }
    if (product.last_income_date) {
      const lastStr = new Date(product.last_income_date).toISOString().slice(0,10);
      if (lastStr === todayStr) continue;
    }

    // GET CORRECT INCOME - LOCKED TO PACKAGE
    const pid = String(product.package_id || '').toLowerCase();
    const pname = String(product.package_name || '').toLowerCase().trim();
    let correctIncome = PACKAGES_MAP[pid] || PACKAGES_BY_NAME[pname] || 0;

    if (!correctIncome) correctIncome = Number(product.daily_income || 0);
    if (!correctIncome) continue;

    // Fix wrong row permanently
    if (Number(product.daily_income)!== correctIncome) {
      await supabase.from('samsung_products').update({ daily_income: correctIncome }).eq('id', product.id);
      fixed++;
    }

    const { data: userData } = await supabase.from('samsung_users').select('id, balance, total_earnings').eq('id', product.user_id).single();
    if (!userData) continue;

    const { error } = await supabase.from('samsung_users').update({
      balance: Number(userData.balance||0) + correctIncome,
      total_earnings: Number(userData.total_earnings||0) + correctIncome,
      updated_at: now.toISOString(),
    }).eq('id', userData.id);
    if (error) continue;

    await supabase.from('samsung_products').update({
      last_income_date: now.toISOString(),
      total_income_earned: Number(product.total_income_earned||0) + correctIncome,
    }).eq('id', product.id);

    credited++; total += correctIncome;
  }

  return new Response(JSON.stringify({ success: true, today: todayStr, processed: active.length, credited, total, fixed_wrong_rows: fixed }),
    { headers: {...corsHeaders, 'Content-Type': 'application/json' } });
});
