
// Locked package definitions - DO NOT CHANGE dailyIncome, these are used by backend scheduler
export const PACKAGES = [
  { id: 'galaxy-a05', name: 'Galaxy A05', price: 30000, dailyIncome: 3000 },
  { id: 'galaxy-a15', name: 'Galaxy A15', price: 70000, dailyIncome: 7000 },
  { id: 'galaxy-a25', name: 'Galaxy A25', price: 125000, dailyIncome: 12500 },
  { id: 'galaxy-a35', name: 'Galaxy A35', price: 260000, dailyIncome: 26000 },
  { id: 'galaxy-a55', name: 'Galaxy A55', price: 400000, dailyIncome: 40000 },
  { id: 'galaxy-s23-fe', name: 'Galaxy S23 FE', price: 900000, dailyIncome: 90000 },
  { id: 'galaxy-s24', name: 'Galaxy S24', price: 1600000, dailyIncome: 160000 },
  { id: 'galaxy-s24-plus', name: 'Galaxy S24+', price: 2802000, dailyIncome: 280200 },
  { id: 'galaxy-s24-ultra', name: 'Galaxy S24 Ultra', price: 4500000, dailyIncome: 450000 },
  { id: 'galaxy-z-flip6', name: 'Galaxy Z Flip6', price: 5000000, dailyIncome: 500000 },
  { id: 'galaxy-z-fold6', name: 'Galaxy Z Fold6 VIP', price: 7000000, dailyIncome: 700000 },
];

export type Package = typeof PACKAGES[number];

// ---- OLD EXPORTS NEEDED FOR BUILD ----
// These were deleted before, causing build fails
export const REGISTRATION_BONUS = 3000;
export const REFERRAL_BONUS = 2000;
export const MIN_WITHDRAWAL = 10000;
export const TELEGRAM_OFFICIAL = "https://t.me/samsung_ug_official";
export const TELEGRAM_CHANNEL = "https://t.me/samsung_ug_official";
export const TELEGRAM_SUPPORT = "https://t.me/samsung_ug_official";
export const WHATSAPP_SUPPORT = "https://wa.me/256700000000";
export const SUPPORT_EMAIL = "support@samsungearnings.ug";
