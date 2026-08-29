import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Info } from 'lucide-react';
import { PACKAGES } from '@/constants/packages';
import { formatUGX } from '@/lib/utils';

const groupColors: Record<number, { bg: string; text: string; border: string; badge: string }> = {
  1: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', badge: 'bg-blue-600' },
  2: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', badge: 'bg-purple-600' },
  3: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', badge: 'bg-amber-500' },
};

const Regulation = () => {
  const navigate = useNavigate();

  const groups = [1, 2, 3];

  return (
    <div className="app-container min-h-screen bg-gray-50">
      {/* Header */}
      <div
        className="flex items-center px-4 py-4"
        style={{ background: 'linear-gradient(135deg, #0a0f2e, #1d4ed8)' }}
      >
        <button
          onClick={() => navigate(-1)}
          className="mr-3 w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-white font-bold text-lg">Regulation</h1>
      </div>

      {/* Platform Banner */}
      <div
        className="px-5 py-6 text-white"
        style={{ background: 'linear-gradient(135deg, #0a0f2e 0%, #1d4ed8 100%)' }}
      >
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">📱</span>
          <div>
            <h2 className="font-bold text-lg">Samsung Earnings</h2>
            <p className="text-blue-200 text-xs">Invest Smart, Earn Daily</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-1">
          {[
            { icon: '📊', label: 'Daily Income Guaranteed' },
            { icon: '⚡', label: '24/7 Automatic Earnings' },
            { icon: '🔒', label: 'Secure & Reliable' },
            { icon: '💰', label: 'Up to 210 Days Returns' },
          ].map(({ icon, label }) => (
            <div key={label} className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2">
              <span className="text-base">{icon}</span>
              <span className="text-white/80 text-xs font-medium">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 py-5 space-y-5">

        {/* Package Tables by Group */}
        {groups.map((group) => {
          const pkgs = PACKAGES.filter((p) => p.group === group);
          const c = groupColors[group];
          const groupDuration = pkgs[0]?.duration || 0;
          return (
            <div key={group} className={`rounded-2xl overflow-hidden border ${c.border}`}>
              {/* Group Header */}
              <div className={`px-4 py-3 flex items-center justify-between ${c.bg}`}>
                <div className="flex items-center gap-2">
                  <span className={`${c.badge} text-white text-xs font-bold px-2.5 py-0.5 rounded-full`}>
                    Group {group}
                  </span>
                  <span className={`${c.text} text-sm font-semibold`}>{groupDuration}-Day Plans</span>
                </div>
                <span className={`${c.text} text-xs font-medium`}>{pkgs.length} packages</span>
              </div>

              {/* Table Header */}
              <div className="bg-gray-800 grid grid-cols-4 text-center">
                {['PRODUCT', 'PRICE', 'DAILY', 'TOTAL'].map((h) => (
                  <div key={h} className="py-2 px-1">
                    <span className="text-amber-400 text-[10px] font-bold">{h}</span>
                  </div>
                ))}
              </div>

              {/* Package Rows */}
              {pkgs.map((pkg, i) => {
                const totalRevenue = pkg.dailyIncome * pkg.duration;
                return (
                  <div
                    key={pkg.id}
                    className={`grid grid-cols-4 text-center border-b border-gray-100 last:border-0 ${
                      i % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    }`}
                  >
                    <div className="py-3 px-1 flex flex-col items-center justify-center">
                      <img src={pkg.image} alt={pkg.name} className="w-8 h-8 object-contain mb-1" />
                      <span className="text-gray-700 text-[9px] font-medium leading-tight text-center">
                        {pkg.name.replace('Samsung ', '').replace('Galaxy ', '')}
                      </span>
                    </div>
                    <div className="py-3 px-1 flex items-center justify-center">
                      <span className="text-gray-800 text-xs font-semibold">{formatUGX(pkg.price)}</span>
                    </div>
                    <div className="py-3 px-1 flex items-center justify-center">
                      <span className="text-green-600 text-xs font-bold">{formatUGX(pkg.dailyIncome)}</span>
                    </div>
                    <div className="py-3 px-1 flex items-center justify-center">
                      <span className="text-blue-600 text-xs font-bold">{formatUGX(totalRevenue)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* Platform Rules */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h3 className="font-bold text-gray-800 text-base mb-4">Platform Rules</h3>
          <div className="space-y-3">
            {[
              { num: '1', text: 'Invest UGX 15,000, withdraw UGX 7,000 immediately.' },
              { num: '2', text: 'Registration reward: UGX 7,000 credited to new accounts.' },
              { num: '3', text: 'Daily check-in reward: UGX 100 per day.' },
              { num: '4', text: 'Daily return rate: varies by package group (20%–30%).' },
              {
                num: '5',
                text: 'Invite friends to invest and immediately earn 30% cash commission. L2 earns 2%, L3 earns 1%.',
              },
              { num: '6', text: 'Product income is automatically deposited daily, 24/7, and can be withdrawn at any time.' },
              { num: '7', text: 'Minimum withdrawal: UGX 7,000. Tax: 18%. Max 2 withdrawals per day.' },
              { num: '8', text: 'Balance is only deducted after admin approves your withdrawal request.' },
              {
                num: '9',
                text: '1 account per person. Fake accounts, fake payment proof, or fake referrals = permanent ban.',
              },
              {
                num: '10',
                text: 'Join our Telegram group to receive exclusive gift codes and stay updated.',
              },
            ].map(({ num, text }) => (
              <div key={num} className="flex items-start gap-3">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5"
                  style={{ background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)' }}
                >
                  {num}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Referral Commission */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
          <div
            className="px-4 py-3 text-white font-semibold text-sm"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #a78bfa)' }}
          >
            Referral Commission Structure
          </div>
          <div className="divide-y divide-gray-100">
            {[
              { level: 'L1 — Direct Referral', rate: '30%', desc: 'Friend you invite signs up and invests', color: 'text-amber-600 bg-amber-50' },
              { level: 'L2 — Second Level', rate: '2%', desc: 'When your L1 referrals invite others who invest', color: 'text-purple-600 bg-purple-50' },
              { level: 'L3 — Third Level', rate: '1%', desc: 'When your L2 members invite others who invest', color: 'text-teal-600 bg-teal-50' },
            ].map(({ level, rate, desc, color }) => (
              <div key={level} className="px-4 py-3 flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${color}`}>
                  {rate}
                </div>
                <div>
                  <div className="text-gray-800 font-semibold text-sm">{level}</div>
                  <div className="text-gray-500 text-xs mt-0.5">{desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="px-4 py-3 bg-purple-50 border-t border-purple-100">
            <p className="text-purple-700 text-xs leading-relaxed">
              Commissions are credited instantly once admin approves the team member's package.
              You can withdraw referral earnings immediately with no minimum hold period.
            </p>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-amber-700 text-xs leading-relaxed">
            All investment packages are subject to admin approval. Daily earnings begin only after your package
            is activated. Past performance does not guarantee future results. Invest responsibly.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Regulation;
