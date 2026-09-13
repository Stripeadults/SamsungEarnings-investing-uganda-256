export const PACKAGES: Record<string, { price: number; daily: number; name: string }> = {
  "galaxy-a05": { name: "Galaxy A05", price: 30000, daily: 3000 },
  "galaxy-a15": { name: "Galaxy A15", price: 70000, daily: 7000 },
  "galaxy-a25": { name: "Galaxy A25", price: 125000, daily: 12500 },
  "galaxy-a35": { name: "Galaxy A35", price: 260000, daily: 26000 },
  "galaxy-a55": { name: "Galaxy A55", price: 400000, daily: 40000 },
  "galaxy-s23-fe": { name: "Galaxy S23 FE", price: 900000, daily: 90000 },
  "galaxy-s24": { name: "Galaxy S24", price: 1600000, daily: 160000 },
  "galaxy-s24-plus": { name: "Galaxy S24+", price: 2802000, daily: 280200 },
  "galaxy-s24-ultra": { name: "Galaxy S24 Ultra", price: 4500000, daily: 450000 },
  "galaxy-z-flip6": { name: "Galaxy Z Flip6", price: 5000000, daily: 500000 },
  "galaxy-z-fold6": { name: "Galaxy Z Fold6", price: 7000000, daily: 700000 },
};

export const PACKAGES_MAP = Object.fromEntries(
  Object.entries(PACKAGES).map(([k, v]) => [k, v.daily])
);
