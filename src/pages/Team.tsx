import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, Share2, Users, ChevronDown, ChevronUp, TrendingUp, History } from 'lucide-react';
import { toast } from 'sonner';
import AppLayout from '@/components/layout/AppLayout';
import { getCurrentUser, getUsers, getUserProducts, getProducts } from '@/lib/storage';
import { getReferralLink, generateQRDataURL, formatUGX, formatDateTime } from '@/lib/utils';
import { User } from '@/types';

interface CommissionEntry {
  inviteeName: string;
  inviteePhone: string;
  packageName: string;
  packagePrice: number;
  commissionAmount: number;
  level: 1 | 2 | 3;
  date: string;
}

interface TeamMember {
  user: User;
  level: number;
  totalInvested: number;
}

const Team = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [teamData, setTeamData] = useState<{ l1: TeamMember[]; l2: TeamMember[]; l3: TeamMember[] }>({ l1: [], l2: [], l3: [] });
  const [showQR, setShowQR] = useState(false);
  const [expandedLevel, setExpandedLevel] = useState<number | null>(1);
  const [commissionHistory, setCommissionHistory] = useState<CommissionEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'team' | 'history'>('team');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = getCurrentUser();
    if (!u) { navigate('/login'); return; }
    setUser(u);

    const loadTeam = async () => {
      const allUsers = await getUsers();

      const l1Users = allUsers.filter((au) => au.referredBy === u.id);
      const l1: TeamMember[] = await Promise.all(l1Users.map(async (au) => ({
        user: au,
        level: 1,
        totalInvested: (await getUserProducts(au.id)).reduce((s, p) => s + p.packagePrice, 0),
      })));

      const l1Ids = l1Users.map((x) => x.id);
      const l2Users = allUsers.filter((au) => au.referredBy && l1Ids.includes(au.referredBy));
      const l2: TeamMember[] = await Promise.all(l2Users.map(async (au) => ({
        user: au,
        level: 2,
        totalInvested: (await getUserProducts(au.id)).reduce((s, p) => s + p.packagePrice, 0),
      })));

      const l2Ids = l2Users.map((x) => x.id);
      const l3Users = allUsers.filter((au) => au.referredBy && l2Ids.includes(au.referredBy));
      const l3: TeamMember[] = await Promise.all(l3Users.map(async (au) => ({
        user: au,
        level: 3,
        totalInvested: (await getUserProducts(au.id)).reduce((s, p) => s + p.packagePrice, 0),
      })));

      setTeamData({ l1, l2, l3 });

      // Build commission history from approved/active packages
      const allProducts = await getProducts();
      const approvedProducts = allProducts.filter((p) => p.status === 'active' || p.status === 'expired');

      const entries: CommissionEntry[] = [];

      // L1 commissions (30%)
      for (const member of l1Users) {
        const memberProds = approvedProducts.filter((p) => p.userId === member.id);
        for (const prod of memberProds) {
          entries.push({
            inviteeName: member.name,
            inviteePhone: member.phone,
            packageName: prod.packageName,
            packagePrice: prod.packagePrice,
            commissionAmount: Math.round(prod.packagePrice * 0.30),
            level: 1,
            date: prod.buyDate,
          });
        }
      }

      // L2 commissions (2%)
      for (const member of l2Users) {
        const memberProds = approvedProducts.filter((p) => p.userId === member.id);
        for (const prod of memberProds) {
          entries.push({
            inviteeName: member.name,
            inviteePhone: member.phone,
            packageName: prod.packageName,
            packagePrice: prod.packagePrice,
            commissionAmount: Math.round(prod.packagePrice * 0.02),
            level: 2,
            date: prod.buyDate,
          });
        }
      }

      // L3 commissions (1%)
      for (const member of l3Users) {
        const memberProds = approvedProducts.filter((p) => p.userId === member.id);
        for (const prod of memberProds) {
          entries.push({
            inviteeName: member.name,
            inviteePhone: member.phone,
            packageName: prod.packageName,
            packagePrice: prod.packagePrice,
            commissionAmount: Math.round(prod.packagePrice * 0.01),
            level: 3,
            date: prod.buyDate,
          });
        }
      }

      // Sort newest first
      entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setCommissionHistory(entries);
      setLoading(false);
    };

    loadTeam();
  }, [navigate]);

  if (!user) return null;

  const refLink = getReferralLink(user.referralCode);
  const qrUrl = generateQRDataURL(refLink);

  const copyCode = () => { navigator.clipboard.writeText(user.referralCode); toast.success('Referral code copied!'); };
  const copyLink = () => { navigator.clipboard.writeText(refLink); toast.success('Referral link copied!'); };

  const shareWhatsApp = () => {
    const msg = `Join Samsung Earnings and earn daily! Use my referral code: ${user.referralCode}\n\nRegister here: ${refLink}\n\n🎁 Get UGX 7,000 registration bonus!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const shareTelegram = () => {
    const msg = `🚀 Join Samsung Earnings — Uganda's top investment platform!\n\n💰 Earn daily income from Samsung packages\n🎁 Get UGX 7,000 registration bonus\n👥 Earn 30% commission on referrals\n\nUse my referral code: *${user.referralCode}*\n\nRegister here: ${refLink}`;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent(msg)}`, '_blank');
  };

  const levelStats = [
    { level: 1, commission: '30%', data: teamData.l1, color: '#d97706', bg: '#fef3c7' },
    { level: 2, commission: '2%', data: teamData.l2, color: '#7c3aed', bg: '#ede9fe' },
    { level: 3, commission: '1%', data: teamData.l3, color: '#0f766e', bg: '#ccfbf1' },
  ];

  const LEVEL_CONFIG = {
    1: { label: 'L1', textColor: 'text-amber-700', bgColor: 'bg-amber-100', rate: '30%' },
    2: { label: 'L2', textColor: 'text-purple-700', bgColor: 'bg-purple-100', rate: '2%' },
    3: { label: 'L3', textColor: 'text-teal-700', bgColor: 'bg-teal-100', rate: '1%' },
  } as const;

  const totalEarned = commissionHistory.reduce((s, e) => s + e.commissionAmount, 0);
  const l1Earned = commissionHistory.filter(e => e.level === 1).reduce((s, e) => s + e.commissionAmount, 0);
  const l2l3Earned = commissionHistory.filter(e => e.level > 1).reduce((s, e) => s + e.commissionAmount, 0);

  return (
    <AppLayout>
      {/* Header */}
      <div className="relative flex flex-col justify-end px-4 pt-6 pb-5" style={{ background: 'linear-gradient(135deg, #0a0f2e, #1d4ed8)' }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `url(https://images.unsplash.com/photo-1556656793-08538906a9f8?w=800)`, backgroundSize: 'cover' }} />

        <div className="relative mb-4 flex flex-col items-center">
          <div className="text-white/70 text-xs uppercase tracking-widest mb-1">Your Referral Code</div>
          <button onClick={copyCode} className="flex items-center gap-3 bg-white/10 border-2 border-amber-400 rounded-2xl px-6 py-3 backdrop-blur">
            <span className="text-amber-300 text-2xl font-black tracking-widest">{user.referralCode}</span>
            <div className="flex items-center gap-1 bg-amber-400 rounded-xl px-3 py-1.5">
              <Copy className="w-4 h-4 text-white" />
              <span className="text-white text-xs font-bold">COPY</span>
            </div>
          </button>
          <div className="text-blue-200 text-xs mt-2">Share this code with friends to earn 30% commission</div>
        </div>

        <div className="relative space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button onClick={copyCode} className="bg-black/50 backdrop-blur rounded-2xl p-3 flex flex-col items-center border border-white/20">
              <span className="text-white/60 text-xs">Invite Code</span>
              <span className="text-amber-300 font-bold text-base mt-1 tracking-wider">{user.referralCode}</span>
              <span className="text-blue-300 text-xs mt-1 flex items-center gap-1"><Copy className="w-3 h-3" /> COPY CODE</span>
            </button>
            <button onClick={copyLink} className="bg-white/90 rounded-2xl p-3 flex flex-col items-center border border-white/20">
              <span className="text-gray-500 text-xs">Invite Link</span>
              <span className="text-gray-800 font-bold text-[10px] mt-1 text-center break-all w-full leading-tight">...register?ref={user.referralCode}</span>
              <span className="text-blue-600 text-xs mt-1 flex items-center gap-1"><Copy className="w-3 h-3" /> COPY LINK</span>
            </button>
          </div>

          <div className="bg-white/10 border border-white/20 backdrop-blur rounded-2xl px-4 py-3">
            <div className="text-white/60 text-[10px] uppercase tracking-widest mb-1.5">Full Referral Link</div>
            <div className="text-white/90 text-xs break-all leading-relaxed mb-2">
              {window.location.origin}{import.meta.env.BASE_URL}register?ref=<span className="text-amber-300 font-bold">{user.referralCode}</span>
            </div>
            <button onClick={copyLink} className="w-full py-2 rounded-xl bg-amber-400 text-white text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform">
              <Copy className="w-3.5 h-3.5" /> Copy Full Link
            </button>
          </div>
        </div>
      </div>

      {/* Share Buttons */}
      <div className="mx-4 mt-3">
        <div className="flex gap-2">
          <button onClick={shareWhatsApp} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-500 text-white text-sm font-semibold active:scale-95 transition-all">
            <Share2 className="w-4 h-4" /> WhatsApp
          </button>
          <button onClick={shareTelegram} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-semibold active:scale-95 transition-all" style={{ background: '#0088cc' }}>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.17 13.662l-2.946-.924c-.64-.203-.652-.64.135-.954l11.57-4.461c.537-.194 1.006.131.965.898z" />
            </svg>
            Telegram
          </button>
          <button onClick={() => setShowQR(!showQR)} className="px-4 py-2.5 rounded-xl bg-blue-100 text-blue-700 text-sm font-semibold">QR</button>
        </div>
      </div>

      {showQR && (
        <div className="mx-4 mt-3 bg-white rounded-2xl p-4 flex flex-col items-center">
          <p className="text-gray-600 text-sm mb-3">Scan to join with your referral link</p>
          <img src={qrUrl} alt="QR Code" className="w-40 h-40 rounded-xl" />
          <p className="text-gray-400 text-xs mt-2">{user.referralCode}</p>
        </div>
      )}

      {/* Tab Switch */}
      <div className="mx-4 mt-3 bg-gray-100 rounded-2xl p-1 flex gap-1">
        <button
          onClick={() => setActiveTab('team')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === 'team' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500'
          }`}
        >
          <Users className="w-4 h-4" /> Team
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === 'history' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500'
          }`}
        >
          <History className="w-4 h-4" /> Earnings History
          {commissionHistory.length > 0 && (
            <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-0.5">
              {commissionHistory.length}
            </span>
          )}
        </button>
      </div>

      {loading && (
        <div className="mx-4 mt-4 text-center text-gray-400 text-sm py-4">Loading team data…</div>
      )}

      {/* ── Team Tab ── */}
      {!loading && activeTab === 'team' && (
        <div className="mx-4 mt-3 space-y-3">
          {levelStats.map(({ level, commission, data, color, bg }) => {
            const isOpen = expandedLevel === level;
            const totalRewards = data.reduce((s, m) => s + m.totalInvested * parseFloat(commission) / 100, 0);
            return (
              <div key={level} className="bg-white rounded-2xl overflow-hidden shadow-sm">
                <button className="w-full p-4" onClick={() => setExpandedLevel(isOpen ? null : level)}>
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mr-3" style={{ background: bg, color }}>
                      L{level}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-4">
                        <div><div className="text-xs text-gray-400">Commission</div><div className="font-bold text-sm" style={{ color }}>{commission}</div></div>
                        <div><div className="text-xs text-gray-400">Members</div><div className="font-bold text-sm text-gray-800">{data.length}</div></div>
                        <div><div className="text-xs text-gray-400">Rewards</div><div className="font-bold text-sm" style={{ color }}>{formatUGX(Math.round(totalRewards))}</div></div>
                      </div>
                    </div>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </button>
                {isOpen && data.length > 0 && (
                  <div className="border-t border-gray-100 px-4 py-2 space-y-2">
                    {data.map((m) => (
                      <div key={m.user.id} className="flex items-center py-2">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mr-3 text-white" style={{ background: color }}>
                          {m.user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="text-gray-800 text-sm font-medium">{m.user.name}</div>
                          <div className="text-gray-400 text-xs">{m.user.phone}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-400">Invested</div>
                          <div className="text-sm font-semibold text-gray-700">{formatUGX(m.totalInvested)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {isOpen && data.length === 0 && (
                  <div className="border-t border-gray-100 px-4 py-6 text-center">
                    <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">No Level {level} members yet</p>
                    <p className="text-gray-300 text-xs mt-1">Share your link to invite friends</p>
                  </div>
                )}
              </div>
            );
          })}

          <div className="bg-blue-50 rounded-2xl p-4">
            <div className="text-blue-800 font-semibold text-sm mb-2">How Referral Works</div>
            <div className="space-y-1.5 text-sm text-blue-700">
              <p>• L1: Earn <strong>30%</strong> when your direct referral invests</p>
              <p>• L2: Earn <strong>2%</strong> when their referrals invest</p>
              <p>• L3: Earn <strong>1%</strong> when L2&apos;s referrals invest</p>
              <p>• Commissions are credited instantly to your balance</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Earnings History Tab ── */}
      {!loading && activeTab === 'history' && (
        <div className="mx-4 mt-3 space-y-3 pb-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-green-50 border border-green-100 rounded-2xl p-3 text-center">
              <div className="text-green-600 font-bold text-sm">{formatUGX(totalEarned)}</div>
              <div className="text-gray-500 text-[10px] mt-0.5">Total Earned</div>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3 text-center">
              <div className="text-amber-600 font-bold text-sm">{formatUGX(l1Earned)}</div>
              <div className="text-gray-500 text-[10px] mt-0.5">L1 (30%)</div>
            </div>
            <div className="bg-purple-50 border border-purple-100 rounded-2xl p-3 text-center">
              <div className="text-purple-600 font-bold text-sm">{formatUGX(l2l3Earned)}</div>
              <div className="text-gray-500 text-[10px] mt-0.5">L2 + L3</div>
            </div>
          </div>

          {commissionHistory.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 shadow-sm text-center">
              <TrendingUp className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <div className="text-gray-500 font-semibold text-sm">No commissions yet</div>
              <div className="text-gray-400 text-xs mt-1 leading-relaxed">
                Invite friends and earn when<br />they purchase packages
              </div>
            </div>
          ) : (
            commissionHistory.map((entry, idx) => {
              const cfg = LEVEL_CONFIG[entry.level];
              return (
                <div key={idx} className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-base shrink-0">
                        {entry.inviteeName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-gray-800 text-sm font-semibold">{entry.inviteeName}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${cfg.bgColor} ${cfg.textColor}`}>
                            {cfg.label} · {cfg.rate}
                          </span>
                        </div>
                        <div className="text-gray-400 text-xs">{entry.inviteePhone}</div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-green-600 font-bold text-lg leading-tight">+{formatUGX(entry.commissionAmount)}</div>
                      <div className="text-gray-300 text-[10px]">commission</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-gray-400 text-xs shrink-0">Package:</span>
                      <span className="text-gray-700 text-xs font-semibold truncate">{entry.packageName}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <span className="text-gray-500 text-xs font-medium">{formatUGX(entry.packagePrice)}</span>
                      <span className="text-gray-300 text-xs">·</span>
                      <span className="text-gray-400 text-[10px]">{formatDateTime(entry.date)}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </AppLayout>
  );
};

export default Team;
