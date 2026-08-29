/**
 * One-time data migration from the old localStorage-based system
 * to the new Supabase cloud database.
 *
 * Old localStorage keys (from the pre-cloud version):
 *   - samsung_users        → array of User objects
 *   - samsung_products     → array of UserProduct objects
 *   - samsung_withdrawals  → array of Withdrawal objects
 *   - samsung_recharges    → array of Recharge objects
 *   - samsung_wallets      → array of Wallet objects
 *   - samsung_redeem_codes → array of RedeemCode objects
 *   - samsung_notifications→ array of Notification objects
 *
 * After successful migration all old keys are removed and a
 * migration-complete flag is written so the process never runs again.
 */

import { supabase } from '@/lib/supabase';
import { User, UserProduct, Withdrawal, Recharge, Wallet, RedeemCode, Notification } from '@/types';

const LEGACY_KEYS = {
  users: 'samsung_users',
  products: 'samsung_products',
  withdrawals: 'samsung_withdrawals',
  recharges: 'samsung_recharges',
  wallets: 'samsung_wallets',
  redeemCodes: 'samsung_redeem_codes',
  notifications: 'samsung_notifications',
};

const MIGRATION_FLAG = 'samsung_cloud_migrated_v1';

export function hasPendingMigration(): boolean {
  if (localStorage.getItem(MIGRATION_FLAG) === 'done') return false;
  // Check if any legacy data exists
  return Object.values(LEGACY_KEYS).some((key) => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return false;
      const arr = JSON.parse(raw);
      return Array.isArray(arr) && arr.length > 0;
    } catch {
      return false;
    }
  });
}

function readLegacy<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export interface MigrationStats {
  users: number;
  products: number;
  withdrawals: number;
  recharges: number;
  wallets: number;
  redeemCodes: number;
  notifications: number;
  errors: string[];
}

async function upsertBatch<T extends Record<string, unknown>>(
  table: string,
  rows: T[],
  errors: string[],
): Promise<number> {
  if (rows.length === 0) return 0;
  // Insert in chunks of 50 to stay well under the 1 MB request limit
  const CHUNK = 50;
  let migrated = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const { error } = await supabase.from(table).upsert(chunk as object[], { onConflict: 'id' });
    if (error) {
      errors.push(`${table}: ${error.message}`);
    } else {
      migrated += chunk.length;
    }
  }
  return migrated;
}

export async function runMigration(
  onProgress?: (step: string, pct: number) => void,
): Promise<MigrationStats> {
  const stats: MigrationStats = {
    users: 0, products: 0, withdrawals: 0,
    recharges: 0, wallets: 0, redeemCodes: 0,
    notifications: 0, errors: [],
  };

  const report = (step: string, pct: number) => onProgress?.(step, pct);

  // ── 1. Users ──────────────────────────────────────────────────────────────
  report('Migrating users…', 5);
  const oldUsers = readLegacy<User>(LEGACY_KEYS.users);
  const userRows = oldUsers.map((u) => ({
    id: u.id,
    name: u.name,
    phone: u.phone,
    password: u.password,
    balance: u.balance ?? 0,
    total_earnings: u.totalEarnings ?? 0,
    daily_earnings: u.dailyEarnings ?? 0,
    referral_earnings: u.referralEarnings ?? 0,
    total_withdrawal: u.totalWithdrawal ?? 0,
    registration_bonus: u.registrationBonus ?? 7000,
    referral_code: u.referralCode,
    referred_by: u.referredBy ?? null,
    frozen: u.frozen ?? false,
    claimed_missions: u.claimedMissions ?? [],
    last_check_in: u.lastCheckIn ?? null,
    created_at: u.createdAt ?? new Date().toISOString(),
  }));
  stats.users = await upsertBatch('samsung_users', userRows, stats.errors);

  // ── 2. Products ───────────────────────────────────────────────────────────
  report('Migrating products…', 20);
  const oldProducts = readLegacy<UserProduct>(LEGACY_KEYS.products);
  const productRows = oldProducts.map((p) => ({
    id: p.id,
    user_id: p.userId,
    package_id: p.packageId,
    package_name: p.packageName,
    package_price: p.packagePrice,
    daily_income: p.dailyIncome,
    duration: p.duration,
    status: p.status,
    buy_date: p.buyDate ?? null,
    expiry_date: p.expiryDate ?? null,
    last_income_date: p.lastIncomeDate ?? null,
    total_income_earned: p.totalIncomeEarned ?? 0,
    payment_proof: p.paymentProof ?? '',
    created_at: new Date().toISOString(),
  }));
  stats.products = await upsertBatch('samsung_products', productRows, stats.errors);

  // ── 3. Withdrawals ────────────────────────────────────────────────────────
  report('Migrating withdrawals…', 35);
  const oldWithdrawals = readLegacy<Withdrawal>(LEGACY_KEYS.withdrawals);
  const withdrawalRows = oldWithdrawals.map((w) => ({
    id: w.id,
    user_id: w.userId,
    user_name: w.userName ?? '',
    user_phone: w.userPhone ?? '',
    amount: w.amount,
    net_amount: w.netAmount,
    wallet_type: w.walletType,
    wallet_phone: w.walletPhone,
    wallet_name: w.walletName,
    status: w.status,
    created_at: w.createdAt ?? new Date().toISOString(),
    processed_at: w.processedAt ?? null,
  }));
  stats.withdrawals = await upsertBatch('samsung_withdrawals', withdrawalRows, stats.errors);

  // ── 4. Recharges ──────────────────────────────────────────────────────────
  report('Migrating recharges…', 50);
  const oldRecharges = readLegacy<Recharge>(LEGACY_KEYS.recharges);
  const rechargeRows = oldRecharges.map((r) => ({
    id: r.id,
    user_id: r.userId,
    user_name: r.userName ?? '',
    user_phone: r.userPhone ?? '',
    amount: r.amount,
    network: r.network,
    sender_phone: r.senderPhone,
    sender_name: r.senderName ?? '',
    proof: r.proof,
    status: r.status,
    created_at: r.createdAt ?? new Date().toISOString(),
    processed_at: r.processedAt ?? null,
  }));
  stats.recharges = await upsertBatch('samsung_recharges', rechargeRows, stats.errors);

  // ── 5. Wallets ────────────────────────────────────────────────────────────
  report('Migrating wallets…', 62);
  const oldWallets = readLegacy<Wallet>(LEGACY_KEYS.wallets);
  const walletRows = oldWallets.map((w) => ({
    id: w.id,
    user_id: w.userId,
    type: w.type,
    phone: w.phone,
    name: w.name,
    created_at: w.createdAt ?? new Date().toISOString(),
  }));
  stats.wallets = await upsertBatch('samsung_wallets', walletRows, stats.errors);

  // ── 6. Redeem Codes ───────────────────────────────────────────────────────
  report('Migrating redeem codes…', 75);
  const oldCodes = readLegacy<RedeemCode>(LEGACY_KEYS.redeemCodes);
  const codeRows = oldCodes.map((c) => ({
    id: c.id,
    code: c.code,
    amount: c.amount,
    created_at: c.createdAt ?? new Date().toISOString(),
    expires_at: c.expiresAt,
    used_by: c.usedBy ?? [],
    is_active: c.isActive ?? true,
  }));
  stats.redeemCodes = await upsertBatch('samsung_redeem_codes', codeRows, stats.errors);

  // ── 7. Notifications ──────────────────────────────────────────────────────
  report('Migrating notifications…', 88);
  const oldNotifs = readLegacy<Notification>(LEGACY_KEYS.notifications);
  const notifRows = oldNotifs.map((n) => ({
    id: n.id,
    user_id: n.userId,
    type: n.type,
    title: n.title,
    message: n.message,
    is_read: n.isRead ?? false,
    created_at: n.createdAt ?? new Date().toISOString(),
  }));
  stats.notifications = await upsertBatch('samsung_notifications', notifRows, stats.errors);

  // ── 8. Clean up localStorage ──────────────────────────────────────────────
  report('Cleaning up old data…', 96);
  if (stats.errors.length === 0) {
    Object.values(LEGACY_KEYS).forEach((key) => localStorage.removeItem(key));
    localStorage.setItem(MIGRATION_FLAG, 'done');
  }

  report('Migration complete!', 100);
  return stats;
}

/** Mark migration as done without running it (e.g. for fresh installs) */
export function skipMigration(): void {
  localStorage.setItem(MIGRATION_FLAG, 'done');
}
