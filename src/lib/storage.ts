import { supabase } from '@/lib/supabase';
import { User, UserProduct, Withdrawal, Recharge, Wallet, RedeemCode, Notification } from '@/types';

// ─── Current User Session (localStorage only — per device session) ────────────
const SESSION_KEY = 'samsang_current_user';
const ADMIN_SESSION_KEY = 'samsang_admin_session';

export const getCurrentUser = (): User | null => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

export const setCurrentUser = (user: User | null): void => {
  if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  else localStorage.removeItem(SESSION_KEY);
};

/**
 * Fetch the latest user data from Supabase and sync the local session.
 * Call this on page load for any page that shows balance or makes purchases.
 * Returns the fresh user or null if not found.
 */
export async function refreshCurrentUser(): Promise<User | null> {
  const cached = getCurrentUser();
  if (!cached) return null;
  const fresh = await getUserById(cached.id);
  if (fresh) setCurrentUser(fresh);
  return fresh;
}

export const getAdminSession = (): boolean =>
  localStorage.getItem(ADMIN_SESSION_KEY) === 'true';
export const setAdminSession = (v: boolean): void =>
  v ? localStorage.setItem(ADMIN_SESSION_KEY, 'true') : localStorage.removeItem(ADMIN_SESSION_KEY);

// ─── Type Mappers (DB snake_case ↔ App camelCase) ─────────────────────────────
function dbToUser(r: Record<string, unknown>): User {
  return {
    id: r.id as string,
    name: r.name as string,
    phone: r.phone as string,
    password: r.password as string,
    balance: Number(r.balance),
    totalEarnings: Number(r.total_earnings),
    dailyEarnings: Number(r.daily_earnings),
    referralEarnings: Number(r.referral_earnings),
    totalWithdrawal: Number(r.total_withdrawal),
    registrationBonus: Number(r.registration_bonus ?? 7000),
    referralCode: r.referral_code as string,
    referredBy: (r.referred_by as string | null) ?? null,
    frozen: Boolean(r.frozen),
    claimedMissions: (r.claimed_missions as string[]) ?? [],
    lastCheckIn: (r.last_check_in as string | null) ?? null,
    createdAt: r.created_at as string,
  };
}

function dbToProduct(r: Record<string, unknown>): UserProduct {
  return {
    id: r.id as string,
    userId: r.user_id as string,
    packageId: r.package_id as string,
    packageName: r.package_name as string,
    packagePrice: Number(r.package_price),
    dailyIncome: Number(r.daily_income),
    duration: Number(r.duration),
    status: r.status as UserProduct['status'],
    buyDate: (r.buy_date as string) ?? new Date().toISOString(),
    expiryDate: (r.expiry_date as string) ?? new Date().toISOString(),
    lastIncomeDate: (r.last_income_date as string | null) ?? null,
    totalIncomeEarned: Number(r.total_income_earned),
    paymentProof: (r.payment_proof as string) ?? '',
  };
}

function dbToWithdrawal(r: Record<string, unknown>): Withdrawal {
  return {
    id: r.id as string,
    userId: r.user_id as string,
    userName: (r.user_name as string) ?? '',
    userPhone: (r.user_phone as string) ?? '',
    amount: Number(r.amount),
    netAmount: Number(r.net_amount),
    walletType: r.wallet_type as Withdrawal['walletType'],
    walletPhone: r.wallet_phone as string,
    walletName: r.wallet_name as string,
    status: r.status as Withdrawal['status'],
    createdAt: r.created_at as string,
    processedAt: (r.processed_at as string | null) ?? null,
  };
}

function dbToRecharge(r: Record<string, unknown>): Recharge {
  return {
    id: r.id as string,
    userId: r.user_id as string,
    userName: (r.user_name as string) ?? '',
    userPhone: (r.user_phone as string) ?? '',
    amount: Number(r.amount),
    network: r.network as Recharge['network'],
    senderPhone: r.sender_phone as string,
    senderName: (r.sender_name as string) ?? '',
    proof: r.proof as string,
    status: r.status as Recharge['status'],
    createdAt: r.created_at as string,
    processedAt: (r.processed_at as string | null) ?? null,
  };
}

function dbToWallet(r: Record<string, unknown>): Wallet {
  return {
    id: r.id as string,
    userId: r.user_id as string,
    type: r.type as Wallet['type'],
    phone: r.phone as string,
    name: r.name as string,
    createdAt: r.created_at as string,
  };
}

function dbToRedeemCode(r: Record<string, unknown>): RedeemCode {
  return {
    id: r.id as string,
    code: r.code as string,
    amount: Number(r.amount),
    createdAt: r.created_at as string,
    expiresAt: r.expires_at as string,
    usedBy: (r.used_by as string[]) ?? [],
    isActive: Boolean(r.is_active),
  };
}

function dbToNotification(r: Record<string, unknown>): Notification {
  return {
    id: r.id as string,
    userId: r.user_id as string,
    type: r.type as Notification['type'],
    title: r.title as string,
    message: r.message as string,
    isRead: Boolean(r.is_read),
    createdAt: r.created_at as string,
  };
}

// ─── Users ─────────────────────────────────────────────────────────────────────
export async function getUsers(): Promise<User[]> {
  const { data } = await supabase.from('samsung_users').select('*').order('created_at', { ascending: false });
  return (data ?? []).map(r => dbToUser(r as Record<string, unknown>));
}

export async function getUserByPhone(phone: string): Promise<User | null> {
  const { data } = await supabase.from('samsung_users').select('*').eq('phone', phone).single();
  return data ? dbToUser(data as Record<string, unknown>) : null;
}

export async function getUserById(id: string): Promise<User | null> {
  const { data } = await supabase.from('samsung_users').select('*').eq('id', id).single();
  return data ? dbToUser(data as Record<string, unknown>) : null;
}

export async function getUserByReferralCode(code: string): Promise<User | null> {
  const { data } = await supabase
    .from('samsung_users')
    .select('*')
    .ilike('referral_code', code.trim())
    .single();
  return data ? dbToUser(data as Record<string, unknown>) : null;
}

export async function createUser(user: User): Promise<void> {
  await supabase.from('samsung_users').insert({
    id: user.id,
    name: user.name,
    phone: user.phone,
    password: user.password,
    balance: user.balance,
    total_earnings: user.totalEarnings,
    daily_earnings: user.dailyEarnings,
    referral_earnings: user.referralEarnings,
    total_withdrawal: user.totalWithdrawal,
    registration_bonus: user.registrationBonus,
    referral_code: user.referralCode,
    referred_by: user.referredBy,
    frozen: user.frozen ?? false,
    claimed_missions: user.claimedMissions ?? [],
    last_check_in: user.lastCheckIn ?? null,
  });
}

export async function updateUser(user: User): Promise<void> {
  await supabase.from('samsung_users').update({
    name: user.name,
    phone: user.phone,
    password: user.password,
    balance: user.balance,
    total_earnings: user.totalEarnings,
    daily_earnings: user.dailyEarnings,
    referral_earnings: user.referralEarnings,
    total_withdrawal: user.totalWithdrawal,
    registration_bonus: user.registrationBonus,
    referral_code: user.referralCode,
    referred_by: user.referredBy,
    frozen: user.frozen ?? false,
    claimed_missions: user.claimedMissions ?? [],
    last_check_in: user.lastCheckIn ?? null,
  }).eq('id', user.id);

  // Keep session in sync
  const current = getCurrentUser();
  if (current?.id === user.id) setCurrentUser(user);
}

export async function deleteUserById(id: string): Promise<void> {
  await supabase.from('samsung_users').delete().eq('id', id);
}

// ─── Products ─────────────────────────────────────────────────────────────────
export async function getProducts(): Promise<UserProduct[]> {
  const { data } = await supabase.from('samsung_products').select('*').order('created_at', { ascending: false });
  return (data ?? []).map(r => dbToProduct(r as Record<string, unknown>));
}

export async function getUserProducts(userId: string): Promise<UserProduct[]> {
  const { data } = await supabase.from('samsung_products').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  return (data ?? []).map(r => dbToProduct(r as Record<string, unknown>));
}

export async function createProduct(p: UserProduct): Promise<void> {
  await supabase.from('samsung_products').insert({
    id: p.id,
    user_id: p.userId,
    package_id: p.packageId,
    package_name: p.packageName,
    package_price: p.packagePrice,
    daily_income: p.dailyIncome,
    duration: p.duration,
    status: p.status,
    buy_date: p.buyDate,
    expiry_date: p.expiryDate,
    last_income_date: p.lastIncomeDate,
    total_income_earned: p.totalIncomeEarned,
    payment_proof: p.paymentProof,
  });
}

export async function updateProduct(p: UserProduct): Promise<void> {
  await supabase.from('samsung_products').update({
    package_id: p.packageId,
    package_name: p.packageName,
    package_price: p.packagePrice,
    daily_income: p.dailyIncome,
    duration: p.duration,
    status: p.status,
    buy_date: p.buyDate,
    expiry_date: p.expiryDate,
    last_income_date: p.lastIncomeDate,
    total_income_earned: p.totalIncomeEarned,
    payment_proof: p.paymentProof,
  }).eq('id', p.id);
}

export async function deleteProduct(id: string): Promise<void> {
  await supabase.from('samsung_products').delete().eq('id', id);
}

// ─── Withdrawals ──────────────────────────────────────────────────────────────
export async function getWithdrawals(): Promise<Withdrawal[]> {
  const { data } = await supabase.from('samsung_withdrawals').select('*').order('created_at', { ascending: true });
  return (data ?? []).map(r => dbToWithdrawal(r as Record<string, unknown>));
}

export async function getUserWithdrawals(userId: string): Promise<Withdrawal[]> {
  const { data } = await supabase.from('samsung_withdrawals').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  return (data ?? []).map(r => dbToWithdrawal(r as Record<string, unknown>));
}

export async function createWithdrawal(w: Withdrawal): Promise<void> {
  await supabase.from('samsung_withdrawals').insert({
    id: w.id,
    user_id: w.userId,
    user_name: w.userName,
    user_phone: w.userPhone,
    amount: w.amount,
    net_amount: w.netAmount,
    wallet_type: w.walletType,
    wallet_phone: w.walletPhone,
    wallet_name: w.walletName,
    status: w.status,
  });
}

export async function updateWithdrawal(w: Withdrawal): Promise<void> {
  await supabase.from('samsung_withdrawals').update({
    status: w.status,
    processed_at: w.processedAt,
  }).eq('id', w.id);
}

// ─── Recharges ────────────────────────────────────────────────────────────────
export async function getRecharges(): Promise<Recharge[]> {
  const { data } = await supabase.from('samsung_recharges').select('*').order('created_at', { ascending: true });
  return (data ?? []).map(r => dbToRecharge(r as Record<string, unknown>));
}

export async function getUserRecharges(userId: string): Promise<Recharge[]> {
  const { data } = await supabase.from('samsung_recharges').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  return (data ?? []).map(r => dbToRecharge(r as Record<string, unknown>));
}

export async function createRecharge(r: Recharge): Promise<void> {
  await supabase.from('samsung_recharges').insert({
    id: r.id,
    user_id: r.userId,
    user_name: r.userName,
    user_phone: r.userPhone,
    amount: r.amount,
    network: r.network,
    sender_phone: r.senderPhone,
    sender_name: r.senderName,
    proof: r.proof,
    status: r.status,
  });
}

export async function updateRecharge(r: Recharge): Promise<void> {
  await supabase.from('samsung_recharges').update({
    status: r.status,
    processed_at: r.processedAt,
  }).eq('id', r.id);
}

// ─── Wallets ──────────────────────────────────────────────────────────────────
export async function getWallets(): Promise<Wallet[]> {
  const { data } = await supabase.from('samsung_wallets').select('*');
  return (data ?? []).map(r => dbToWallet(r as Record<string, unknown>));
}

export async function getUserWallets(userId: string): Promise<Wallet[]> {
  const { data } = await supabase.from('samsung_wallets').select('*').eq('user_id', userId);
  return (data ?? []).map(r => dbToWallet(r as Record<string, unknown>));
}

export async function saveWallet(w: Wallet): Promise<void> {
  await supabase.from('samsung_wallets').upsert({
    id: w.id,
    user_id: w.userId,
    type: w.type,
    phone: w.phone,
    name: w.name,
  });
}

export async function deleteWalletsByUser(userId: string): Promise<void> {
  await supabase.from('samsung_wallets').delete().eq('user_id', userId);
}

// ─── Redeem Codes ─────────────────────────────────────────────────────────────
export async function getRedeemCodes(): Promise<RedeemCode[]> {
  const { data } = await supabase.from('samsung_redeem_codes').select('*').order('created_at', { ascending: false });
  return (data ?? []).map(r => dbToRedeemCode(r as Record<string, unknown>));
}

export async function createRedeemCode(c: RedeemCode): Promise<void> {
  await supabase.from('samsung_redeem_codes').insert({
    id: c.id,
    code: c.code,
    amount: c.amount,
    expires_at: c.expiresAt,
    used_by: c.usedBy,
    is_active: c.isActive,
  });
}

export async function updateRedeemCode(c: RedeemCode): Promise<void> {
  await supabase.from('samsung_redeem_codes').update({
    used_by: c.usedBy,
    is_active: c.isActive,
  }).eq('id', c.id);
}

export async function deleteRedeemCodeById(id: string): Promise<void> {
  await supabase.from('samsung_redeem_codes').delete().eq('id', id);
}

// ─── Notifications ────────────────────────────────────────────────────────────
export async function getNotifications(): Promise<Notification[]> {
  const { data } = await supabase.from('samsung_notifications').select('*').order('created_at', { ascending: false });
  return (data ?? []).map(r => dbToNotification(r as Record<string, unknown>));
}

export async function getUserNotifications(userId: string): Promise<Notification[]> {
  const { data } = await supabase.from('samsung_notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  return (data ?? []).map(r => dbToNotification(r as Record<string, unknown>));
}

export async function addNotification(notif: Omit<Notification, 'id' | 'createdAt'>): Promise<void> {
  await supabase.from('samsung_notifications').insert({
    user_id: notif.userId,
    type: notif.type,
    title: notif.title,
    message: notif.message,
    is_read: notif.isRead ?? false,
  });
}

export async function markNotificationRead(id: string): Promise<void> {
  await supabase.from('samsung_notifications').update({ is_read: true }).eq('id', id);
}

export async function deleteNotificationsByUser(userId: string): Promise<void> {
  await supabase.from('samsung_notifications').delete().eq('user_id', userId);
}

// ─── Daily Income Engine ──────────────────────────────────────────────────────
export async function runDailyIncomeWithStats(): Promise<{ credited: number; total: number }> {
  const products = await getProducts();
  const now = new Date();
  let credited = 0;
  let total = 0;

  for (const product of products) {
    if (product.status !== 'active') continue;

    const expiry = new Date(product.expiryDate);
    if (now > expiry) {
      await updateProduct({ ...product, status: 'expired' });
      continue;
    }

    const lastIncome = product.lastIncomeDate ? new Date(product.lastIncomeDate) : null;
    const hoursSinceLast = lastIncome
      ? (now.getTime() - lastIncome.getTime()) / (1000 * 60 * 60)
      : 25;

    if (hoursSinceLast >= 24) {
      const user = await getUserById(product.userId);
      if (!user) continue;

      await updateUser({
        ...user,
        balance: user.balance + product.dailyIncome,
        totalEarnings: user.totalEarnings + product.dailyIncome,
        dailyEarnings: user.dailyEarnings + product.dailyIncome,
      });
      await updateProduct({
        ...product,
        lastIncomeDate: now.toISOString(),
        totalIncomeEarned: product.totalIncomeEarned + product.dailyIncome,
      });
      await addNotification({
        userId: product.userId,
        type: 'daily_income',
        title: 'Daily Income Received',
        message: `You earned UGX ${product.dailyIncome.toLocaleString()} from ${product.packageName}`,
        isRead: false,
      });
      credited += 1;
      total += product.dailyIncome;
    }
  }

  return { credited, total };
}

export async function processDailyIncome(): Promise<void> {
  const products = await getProducts();
  const now = new Date();

  for (const product of products) {
    if (product.status !== 'active') continue;

    const expiry = new Date(product.expiryDate);
    if (now > expiry) {
      await updateProduct({ ...product, status: 'expired' });
      continue;
    }

    const lastIncome = product.lastIncomeDate ? new Date(product.lastIncomeDate) : null;
    const hoursSinceLast = lastIncome
      ? (now.getTime() - lastIncome.getTime()) / (1000 * 60 * 60)
      : 25;

    if (hoursSinceLast >= 24) {
      const user = await getUserById(product.userId);
      if (!user) continue;

      await updateUser({
        ...user,
        balance: user.balance + product.dailyIncome,
        totalEarnings: user.totalEarnings + product.dailyIncome,
        dailyEarnings: user.dailyEarnings + product.dailyIncome,
      });
      await updateProduct({
        ...product,
        lastIncomeDate: now.toISOString(),
        totalIncomeEarned: product.totalIncomeEarned + product.dailyIncome,
      });
      await addNotification({
        userId: product.userId,
        type: 'daily_income',
        title: 'Daily Income Received',
        message: `You earned UGX ${product.dailyIncome.toLocaleString()} from ${product.packageName}`,
        isRead: false,
      });
    }
  }
}
