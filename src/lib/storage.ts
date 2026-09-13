import { supabase } from '@/lib/supabase';
import { User, UserProduct, Withdrawal, Recharge, Wallet, RedeemCode, Notification } from '@/types';

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
  let rawProof = (r.payment_proof as string) ?? '';
  let extra: any = {};
  try {
    const parsed = JSON.parse(rawProof);
    if (parsed && typeof parsed === 'object' && parsed.proof !== undefined) {
      extra = parsed;
      rawProof = parsed.proof;
    }
  } catch {}
  const prod: any = {
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
    paymentProof: rawProof,
    payerPhone: extra.payerPhone || '',
    payerName: extra.payerName || '',
    paymentNetwork: extra.network || '',
    paymentTargetNumber: extra.targetNumber || '',
    paymentTargetName: extra.targetName || '',
  };
  return prod;
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
  const { data } = await supabase.from('samsung_users').select('*').ilike('referral_code', code.trim()).single();
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
    claimed_missions: user.claimedMissions ?? [],
    last_check_in: user.lastCheckIn ?? null,
  }).eq('id', user.id);
  const current = getCurrentUser();
  if (current?.id === user.id) {
    const fresh = await getUserById(user.id);
    if (fresh) setCurrentUser(fresh);
  }
}
export async function deleteUserById(id: string): Promise<void> {
  await supabase.from('samsung_users').delete().eq('id', id);
}
export async function getProducts(): Promise<UserProduct[]> {
  const { data } = await supabase.from('samsung_products').select('*').order('created_at', { ascending: false });
  return (data ?? []).map(r => dbToProduct(r as Record<string, unknown>));
}
export async function getUserProducts(userId: string): Promise<UserProduct[]> {
  const { data } = await supabase.from('samsung_products').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  return (data ?? []).map(r => dbToProduct(r as Record<string, unknown>));
}

export async function createProduct(p: any): Promise<void> {
  const fullProof = JSON.stringify({
    proof: p.paymentProof || '',
    payerPhone: p.payerPhone || '',
    payerName: p.payerName || '',
    network: p.paymentNetwork || '',
    targetNumber: p.paymentTargetNumber || '0756406186',
    targetName: p.paymentTargetName || 'Nabakooza Milly',
    amount: p.packagePrice,
  });
  await supabase.from('samsung_products').insert({
    id: p.id,
    user_id: p.userId,
    package_id: p.packageId,
    package_name: p.packageName,
    package_price: p.packagePrice,
    daily_income: p.dailyIncome,
    duration: p.duration,
    status: 'pending',
    buy_date: p.buyDate,
    expiry_date: p.expiryDate,
    last_income_date: p.lastIncomeDate,
    total_income_earned: 0,
    payment_proof: fullProof,
  });
}

// HELPER: find user by ID or referral_code (fixes old data)
async function findUserByRef(ref: string) {
  if (!ref) return null;
  let { data } = await supabase.from('samsung_users').select('*').eq('id', ref).single();
  if (data) return data;
  const { data: byCode } = await supabase.from('samsung_users').select('*').eq('referral_code', ref).single();
  return byCode;
}

// FIXED: Now pays L1/L2/L3 on approval
export async function updateProduct(p: UserProduct): Promise<void> {
  const { data: oldProd } = await supabase.from('samsung_products').select('status, user_id, package_price, package_name').eq('id', p.id).single();
  
  await supabase.from('samsung_products').update({
    status: p.status,
    last_income_date: p.lastIncomeDate,
    total_income_earned: p.totalIncomeEarned,
  }).eq('id', p.id);

  // Only pay commission when changing from pending -> active (first approval)
  if (oldProd && oldProd.status === 'pending' && p.status === 'active') {
    const buyerId = oldProd.user_id as string;
    const price = Number(oldProd.package_price);
    const packageName = oldProd.package_name as string;

    const { data: buyerRow } = await supabase.from('samsung_users').select('referred_by').eq('id', buyerId).single();
    const ref = buyerRow?.referred_by as string | null;
    if (!ref) return;

    const l1Row = await findUserByRef(ref);
    if (!l1Row) return;

    const l1Reward = Math.round(price * 0.30);
    await supabase.from('samsung_users').update({
      balance: Number(l1Row.balance) + l1Reward,
      total_earnings: Number(l1Row.total_earnings) + l1Reward,
      referral_earnings: Number(l1Row.referral_earnings) + l1Reward,
    }).eq('id', l1Row.id);

    await supabase.from('samsung_notifications').insert({
      user_id: l1Row.id,
      type: 'referral_bonus',
      title: 'L1 Commission Received',
      message: `You earned UGX ${l1Reward.toLocaleString()} (30%) from ${packageName}`,
      is_read: false,
    });

    if (l1Row.referred_by) {
      const l2Row = await findUserByRef(l1Row.referred_by as string);
      if (l2Row) {
        const l2Reward = Math.round(price * 0.02);
        await supabase.from('samsung_users').update({
          balance: Number(l2Row.balance) + l2Reward,
          total_earnings: Number(l2Row.total_earnings) + l2Reward,
          referral_earnings: Number(l2Row.referral_earnings) + l2Reward,
        }).eq('id', l2Row.id);

        await supabase.from('samsung_notifications').insert({
          user_id: l2Row.id,
          type: 'referral_bonus',
          title: 'L2 Commission Received',
          message: `You earned UGX ${l2Reward.toLocaleString()} (2%) from ${packageName}`,
          is_read: false,
        });

        if (l2Row.referred_by) {
          const l3Row = await findUserByRef(l2Row.referred_by as string);
          if (l3Row) {
            const l3Reward = Math.round(price * 0.01);
            await supabase.from('samsung_users').update({
              balance: Number(l3Row.balance) + l3Reward,
              total_earnings: Number(l3Row.total_earnings) + l3Reward,
              referral_earnings: Number(l3Row.referral_earnings) + l3Reward,
            }).eq('id', l3Row.id);

            await supabase.from('samsung_notifications').insert({
              user_id: l3Row.id,
              type: 'referral_bonus',
              title: 'L3 Commission Received',
              message: `You earned UGX ${l3Reward.toLocaleString()} (1%) from ${packageName}`,
              is_read: false,
            });
          }
        }
      }
    }
  }
}

export async function deleteProduct(id: string): Promise<void> {
  await supabase.from('samsung_products').delete().eq('id', id);
}
export async function getWithdrawals(): Promise<Withdrawal[]> {
  const { data } = await supabase.from('samsung_withdrawals').select('*').order('created_at', { ascending: true });
  return (data ?? []).map(r => dbToWithdrawal(r as Record<string, unknown>));
}
export async function getUserWithdrawals(userId: string): Promise<Withdrawal[]> {
  const { data } = await supabase.from('samsung_withdrawals').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  return (data ?? []).map(r => dbToWithdrawal(r as Record<string, unknown>));
}

export async function createWithdrawal(w: Withdrawal): Promise<void> {
  const activeProducts = await getUserProducts(w.userId);
  const hasActive = activeProducts.some(p => p.status === 'active' && new Date(p.expiryDate) > new Date());
  if (!hasActive) {
    throw new Error("No active package - cannot withdraw");
  }
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
    status: 'pending',
  });
}
export async function updateWithdrawal(w: Withdrawal): Promise<void> {
  await supabase.from('samsung_withdrawals').update({
    status: w.status,
    processed_at: w.processedAt,
  }).eq('id', w.id).eq('status', 'pending');
}
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
    status: 'pending',
  });
}
export async function updateRecharge(r: Recharge): Promise<void> {
  await supabase.from('samsung_recharges').update({
    status: r.status,
    processed_at: r.processedAt,
  }).eq('id', r.id);
}
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
export async function runDailyIncomeWithStats(): Promise<{ credited: number; total: number }> {
  const products = await getProducts();
  const now = new Date();
  let credited = 0;
  let total = 0;

  for (const product of products) {
    if (product.status !== 'active') continue;
    const expiry = new Date(product.expiryDate);
    if (now > expiry) {
      await supabase.from('samsung_products').update({ status: 'expired' }).eq('id', product.id);
      continue;
    }
    const lastIncome = product.lastIncomeDate ? new Date(product.lastIncomeDate) : null;
    const hoursSinceLast = lastIncome ? (now.getTime() - lastIncome.getTime()) / (1000 * 60 * 60) : 25;
    if (hoursSinceLast < 24) continue;

    const { data: fresh } = await supabase.from('samsung_users').select('*').eq('id', product.userId).single();
    if (!fresh) continue;

    const newBalance = Number(fresh.balance) + Number(product.dailyIncome);
    const newTotalEarn = Number(fresh.total_earnings) + Number(product.dailyIncome);
    const newDailyEarn = Number(fresh.daily_earnings) + Number(product.dailyIncome);

    await supabase.from('samsung_users').update({
      balance: newBalance,
      total_earnings: newTotalEarn,
      daily_earnings: newDailyEarn,
    }).eq('id', product.userId);

    await supabase.from('samsung_products').update({
      last_income_date: now.toISOString(),
      total_income_earned: product.totalIncomeEarned + product.dailyIncome,
    }).eq('id', product.id);

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
  return { credited, total };
}
export async function processDailyIncome(): Promise<void> {
  await runDailyIncomeWithStats();
}
