export interface User {
  id: string;
  phone: string;
  password: string;
  name: string;
  referralCode: string;
  referredBy: string | null;
  balance: number;
  totalEarnings: number;
  totalWithdrawal: number;
  referralEarnings: number;
  dailyEarnings: number;
  registrationBonus: number;
  lastCheckIn: string | null;
  createdAt: string;
  isAdmin?: boolean;
  claimedMissions?: string[];
  frozen?: boolean;
}

export interface InvestmentPackage {
  id: string;
  name: string;
  group: number;
  price: number;
  dailyIncome: number;
  duration: number;
  phone: string;
  image: string;
}

export interface UserProduct {
  id: string;
  userId: string;
  packageId: string;
  packageName: string;
  packagePrice: number;
  dailyIncome: number;
  duration: number;
  buyDate: string;
  expiryDate: string;
  status: 'pending' | 'active' | 'expired';
  lastIncomeDate: string | null;
  totalIncomeEarned: number;
  paymentProof: string;
}

export interface Withdrawal {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  amount: number;
  netAmount: number;
  walletType: 'mtn' | 'airtel';
  walletPhone: string;
  walletName: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  processedAt: string | null;
}

export interface Recharge {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  amount: number;
  network: 'mtn' | 'airtel';
  senderPhone: string;
  senderName: string;
  proof: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  processedAt: string | null;
}

export interface Wallet {
  id: string;
  userId: string;
  type: 'mtn' | 'airtel';
  phone: string;
  name: string;
  createdAt: string;
}

export interface RedeemCode {
  id: string;
  code: string;
  amount: number;
  createdAt: string;
  expiresAt: string;
  usedBy: string[];
  isActive: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'package_approved' | 'package_rejected' | 'withdrawal_approved' | 'withdrawal_rejected' | 'daily_income' | 'referral_bonus';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface AdminUser {
  id: string;
  name: string;
  phone: string;
  password: string;
}
