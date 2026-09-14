export const PACKAGES = [
  { id: 'galaxy-a03', name: 'Galaxy A03 Starter', price: 15000, dailyIncome: 1500, duration: 30, image: 'https://fdn2.gsmarena.com/vv/pics/apple/apple-iphone-15-pro-max-1.jpg' },
  { id: 'galaxy-a05', name: 'Galaxy A05', price: 30000, dailyIncome: 3000, duration: 45, image: 'https://images.samsung.com/is/image/samsung/p6pim/in/sm-a055gzkginu/gallery/in-galaxy-a05-sm-a055-sm-a055gzkginu-538353348?$650_519_PNG$' },
  { id: 'galaxy-a15', name: 'Galaxy A15', price: 70000, dailyIncome: 7000, duration: 60, image: 'https://images.samsung.com/is/image/samsung/p6pim/ae/sm-a155fzkdmea/gallery/ae-galaxy-a15-sm-a155-sm-a155fzkdmea-539465032?$650_519_PNG$' },
  { id: 'galaxy-a25', name: 'Galaxy A25', price: 125000, dailyIncome: 12500, duration: 60, image: 'https://images.samsung.com/is/image/samsung/p6pim/ae/sm-a256elbhmea/gallery/ae-galaxy-a25-5g-sm-a256-sm-a256elbhmea-539464420?$650_519_PNG$' },
  { id: 'galaxy-a35', name: 'Galaxy A35', price: 260000, dailyIncome: 26000, duration: 60, image: 'https://images.samsung.com/is/image/samsung/p6pim/ae/sm-a356elbgmea/gallery/ae-galaxy-a35-5g-sm-a356-sm-a356elbgmea-540555813?$650_519_PNG$' },
  { id: 'galaxy-a55', name: 'Galaxy A55', price: 400000, dailyIncome: 40000, duration: 60, image: 'https://images.samsung.com/is/image/samsung/p6pim/ae/sm-a556elbhmea/gallery/ae-galaxy-a55-5g-sm-a556-sm-a556elbhmea-540555534?$650_519_PNG$' },
  { id: 'galaxy-s23-fe', name: 'Galaxy S23 FE', price: 900000, dailyIncome: 90000, duration: 90, image: 'https://images.samsung.com/is/image/samsung/p6pim/ae/sm-s711bzgdmea/gallery/ae-galaxy-s23-fe-s711-sm-s711bzgdmea-538357126?$650_519_PNG$' },
  { id: 'galaxy-s24', name: 'Galaxy S24', price: 1600000, dailyIncome: 160000, duration: 90, image: 'https://images.samsung.com/is/image/samsung/p6pim/ae/sm-s921bzgdmea/gallery/ae-galaxy-s24-s921-sm-s921bzgdmea-539421915?$650_519_PNG$' },
  { id: 'galaxy-s24-plus', name: 'Galaxy S24+', price: 2802000, dailyIncome: 280200, duration: 120, image: 'https://images.samsung.com/is/image/samsung/p6pim/ae/sm-s926bzgdmea/gallery/ae-galaxy-s24-plus-sm-s926-sm-s926bzgdmea-539422068?$650_519_PNG$' },
  { id: 'galaxy-s24-ultra', name: 'Galaxy S24 Ultra', price: 4500000, dailyIncome: 450000, duration: 120, image: 'https://images.samsung.com/is/image/samsung/p6pim/ae/sm-s928bztgmea/gallery/ae-galaxy-s24-ultra-sm-s928-sm-s928bztgmea-539421606?$650_519_PNG$' },
  { id: 'galaxy-z-flip6', name: 'Galaxy Z Flip6', price: 5000000, dailyIncome: 500000, duration: 120, image: 'https://images.samsung.com/is/image/samsung/p6pim/ae/sm-f741bzgdmea/gallery/ae-galaxy-z-flip6-f741-sm-f741bzgdmea-542353997?$650_519_PNG$' },
  { id: 'galaxy-z-fold6', name: 'Galaxy Z Fold6 VIP', price: 7000000, dailyIncome: 700000, duration: 180, image: 'https://images.samsung.com/is/image/samsung/p6pim/ae/sm-f956bdbamea/gallery/ae-galaxy-z-fold6-f956-sm-f956bdbamea-542353148?$650_519_PNG$' },
];
export type Package = typeof PACKAGES[number];

// === BONUS / LIMITS ===
export const REGISTRATION_BONUS = 7000;
export const REFERRAL_BONUS = 2000;
export const MIN_WITHDRAWAL = 7000;
export const MIN_DEPOSIT = 15000;
export const DAILY_CHECKIN_REWARD = 500;
export const CHECKIN_REWARD = 500;
export const DAILY_CHECKIN = 500;

// === CONTACTS ===
export const TELEGRAM_OFFICIAL = "https://t.me/samsung_ug_official";
export const TELEGRAM_CHANNEL = "https://t.me/samsung_ug_official";
export const TELEGRAM_SUPPORT = "https://t.me/samsung_ug_official";
export const TELEGRAM_LINK = "https://t.me/samsung_ug_official";
export const WHATSAPP_SUPPORT = "https://wa.me/256700000000";
export const WHATSAPP_OFFICIAL = "https://wa.me/256700000000";
export const SUPPORT_EMAIL = "support@samsungearnings.ug";
export const OFFICIAL_WEBSITE = "https://samsungearnings.ug";

// === EXACT EXPORTS NEEDED BY Recharge.tsx ===
export const MTN_NUMBER = "0780000000";
export const MTN_NAME = "Samsung Earnings UG";
export const AIRTEL_NUMBER = "0700000000";
export const AIRTEL_NAME = "Samsung Earnings UG";
