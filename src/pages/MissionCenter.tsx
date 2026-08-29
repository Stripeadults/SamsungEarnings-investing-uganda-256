import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Clock, Users, Package, TrendingUp, Gift } from 'lucide-react';
import { toast } from 'sonner';
import { getCurrentUser, getUserProducts, getUsers, updateUser, addNotification, setCurrentUser } from '@/lib/storage';
import { formatUGX } from '@/lib/utils';
import { PACKAGES } from '@/constants/packages';
import { User, UserProduct } from '@/types';

interface MissionTask {
  id: string;
  category: 'referral' | 'purchase' | 'team';
  title: string;
  description: string;
  reward: number;
  target: number;
  unit: string;
  packageId?: string;
}

const MISSIONS: MissionTask[] = [
  { id: 'ref_5', category: 'referral', title: 'Task 1', description: 'Invite 5 Level 1 investors', reward: 8000, target: 5, unit: 'investors' },
  { id: 'ref_15', category: 'referral', title: 'Task 2', description: 'Invite 15 Level 1 investors', reward: 20000, target: 15, unit: 'investors' },
  { id: 'ref_50', category: 'referral', title: 'Task 3', description: 'Invite 50 Level 1 investors', reward: 50000, target: 50, unit: 'investors' },
  { id: 'buy_galaxy-a15', category: 'purchase', title: 'Task 4', description: 'Purchase Galaxy A15', reward: 200, target: 1, unit: 'purchase', packageId: 'galaxy-a15' },
  { id: 'buy_galaxy-a25', category: 'purchase', title: 'Task 5', description: 'Purchase Galaxy A25', reward: 1000, target: 1, unit: 'purchase', packageId: 'galaxy-a25' },
  { id: 'buy_galaxy-a35', category: 'purchase', title: 'Task 6', description: 'Purchase Galaxy A35', reward: 2000, target: 1, unit: 'purchase', packageId: 'galaxy-a35' },
  { id: 'buy_galaxy-a55', category: 'purchase', title: 'Task 7', description: 'Purchase Galaxy A55', reward: 4000, target: 1, unit: 'purchase', packageId: 'galaxy-a55' },
  { id: 'buy_galaxy-s23-fe', category: 'purchase', title: 'Task 8', description: 'Purchase Galaxy S23 FE', reward: 8000, target: 1, unit: 'purchase', packageId: 'galaxy-s23-fe' },
  { id: 'buy_galaxy-s24', category: 'purchase', title: 'Task 9', description: 'Purchase Galaxy S24', reward: 15000, target: 1, unit: 'purchase', packageId: 'galaxy-s24' },
  { id: 'buy_galaxy-s24-plus', category: 'purchase', title: 'Task 10', description: 'Purchase Galaxy S24+', reward: 35000, target: 1, unit: 'purchase', packageId: 'galaxy-s24-plus' },
  { id: 'buy_galaxy-z-flip6', category: 'purchase', title: 'Task 11', description: 'Purchase Galaxy Z Flip6', reward: 70000, target: 1, unit: 'purchase', packageId: 'galaxy-z-flip6' },
  { id: 'team_500k', category: 'team', title: 'Task 12', description: 'Team invest UGX 500,000 total', reward: 1000, target: 500000, unit: 'UGX' },
  { id: 'team_1500k', category: 'team', title: 'Task 12b', description: 'Team invest UGX 1,500,000 total', reward: 1500, target: 1500000, unit: 'UGX' },
  { id: 'team_5m', category: 'team', title: 'Task 13', description: 'Team invest UGX 5,000,000 total', reward: 5000, target: 5000000, unit: 'UGX' },
  { id: 'team_15m', category: 'team', title: 'Task 14', description: 'Team invest UGX 15,000,000 total', reward: 15000, target: 15000000, unit: 'UGX' },
  { id: 'team_30m', category: 'team', title: 'Task 15', description: 'Team invest UGX 30,000,000 total', reward: 30000, target: 30000000, unit: 'UGX' },
];

const MissionCenter = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [userProducts, setUserProducts] = useState<UserProduct[]>([]);
  const [allProducts, setAllProducts] = useState<UserProduct[]>([]);
  const [activeTab, setActiveTab] = useState<'referral' | 'purchase' | 'team'>('referral');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = getCurrentUser();
    if (!u) { navigate('/login'); return; }
    setUser(u);

    Promise.all([getUsers(), getUserProducts(u.id)]).then(([users, prods]) => {
      setAllUsers(users);
      setUserProducts(prods);
      // Collect all products for team calc
      Promise.all(users.map(usr => getUserProducts(usr.id))).then(allProds => {
        setAllProducts(allProds.flat());
        setLoading(false);
      });
    });
  }, [navigate]);

  const getProductsForUser = (uid: string) => allProducts.filter(p => p.userId === uid);

  const getProgress = (mission: MissionTask): number => {
    if (!user) return 0;

    if (mission.category === 'referral') {
      const directReferrals = allUsers.filter((u) => u.referredBy === user.id);
      const activeReferrals = directReferrals.filter((ref) => {
        const prods = getProductsForUser(ref.id);
        return prods.some((p) => p.status === 'active' || p.status === 'expired');
      });
      return Math.min(activeReferrals.length, mission.target);
    }

    if (mission.category === 'purchase') {
      const purchased = userProducts.some((p) => p.packageId === mission.packageId && (p.status === 'active' || p.status === 'expired'));
      return purchased ? 1 : 0;
    }

    if (mission.category === 'team') {
      const l1Refs = allUsers.filter((u) => u.referredBy === user.id);
      const teamInvested = l1Refs.reduce((sum, ref) => {
        return sum + getProductsForUser(ref.id).filter((p) => p.status === 'active' || p.status === 'expired').reduce((s, p) => s + p.packagePrice, 0);
      }, 0);
      return Math.min(teamInvested, mission.target);
    }

    return 0;
  };

  const isCompleted = (mission: MissionTask) => getProgress(mission) >= mission.target;
  const isClaimed = (mission: MissionTask) => user?.claimedMissions?.includes(mission.id) || false;

  const handleClaim = async (mission: MissionTask) => {
    if (!user) return;
    if (!isCompleted(mission)) { toast.error('Mission not completed yet'); return; }
    if (isClaimed(mission)) { toast.info('Already claimed'); return; }

    const updated: User = {
      ...user,
      balance: user.balance + mission.reward,
      totalEarnings: user.totalEarnings + mission.reward,
      claimedMissions: [...(user.claimedMissions || []), mission.id],
    };
    await updateUser(updated);
    setCurrentUser(updated);
    setUser(updated);
    await addNotification({
      userId: user.id,
      type: 'referral_bonus',
      title: 'Mission Reward Claimed!',
      message: `You claimed ${formatUGX(mission.reward)} from "${mission.description}"`,
      isRead: false,
    });
    toast.success(`Claimed ${formatUGX(mission.reward)}!`);
  };

  if (!user || loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>;

  const totalPeople = allUsers.filter((u) => u.referredBy === user.id).length;
  const totalTeamRewards = MISSIONS.filter((m) => isClaimed(m)).reduce((s, m) => s + m.reward, 0);
  const filtered = MISSIONS.filter((m) => m.category === activeTab);

  return (
    <div className="app-container min-h-screen bg-gray-50 pb-6">
      <div style={{ background: 'linear-gradient(135deg, #0a0f2e, #1d4ed8)' }}>
        <div className="flex items-center px-4 py-4">
          <button onClick={() => navigate('/home')} className="mr-3 w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-white font-bold text-lg">Mission Center</h1>
        </div>
        <div className="px-5 pb-5 grid grid-cols-2 gap-3">
          <div className="bg-white/10 rounded-2xl p-4 border border-white/20">
            <div className="text-white/70 text-xs mb-1">Total People</div>
            <div className="text-white font-bold text-2xl">{totalPeople}</div>
            <div className="text-blue-200 text-xs mt-0.5">in your team</div>
          </div>
          <div className="bg-white/10 rounded-2xl p-4 border border-white/20">
            <div className="text-white/70 text-xs mb-1">Total Rewards</div>
            <div className="text-amber-300 font-bold text-xl">{formatUGX(totalTeamRewards)}</div>
            <div className="text-blue-200 text-xs mt-0.5">missions claimed</div>
          </div>
        </div>
      </div>

      <div className="px-4 py-3 flex gap-2">
        {([{ key: 'referral', label: 'Referral' }, { key: 'purchase', label: 'Purchase' }, { key: 'team', label: 'Team Invest' }] as const).map(({ key, label }) => (
          <button key={key} onClick={() => setActiveTab(key)} className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${activeTab === key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>{label}</button>
        ))}
      </div>

      <div className="px-4 space-y-3">
        {filtered.map((mission) => {
          const progress = getProgress(mission);
          const completed = isCompleted(mission);
          const claimed = isClaimed(mission);
          const pct = Math.min(100, Math.round((progress / mission.target) * 100));
          const pkg = mission.packageId ? PACKAGES.find((p) => p.id === mission.packageId) : null;

          return (
            <div key={mission.id} className={`bg-white rounded-2xl p-4 shadow-sm border ${claimed ? 'border-green-200' : completed ? 'border-blue-200' : 'border-gray-100'}`}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${claimed ? 'bg-green-100 text-green-600' : completed ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                    {claimed ? <CheckCircle className="w-5 h-5" /> : mission.category === 'referral' ? <Users className="w-4 h-4" /> : mission.category === 'purchase' ? <Package className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-800 text-sm">{mission.title}</div>
                    <div className="text-gray-500 text-xs mt-0.5 leading-relaxed">{mission.description}</div>
                    {pkg && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <img src={pkg.image} alt={pkg.name} className="w-5 h-5 rounded object-cover" />
                        <span className="text-blue-600 text-xs font-medium">{formatUGX(pkg.price)}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-green-600 font-bold text-sm">{formatUGX(mission.reward)}</div>
                  <div className="text-gray-400 text-[10px]">reward</div>
                </div>
              </div>

              <div className="mb-3">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-gray-500 font-medium">
                    {mission.category === 'team' ? `${formatUGX(progress)} / ${formatUGX(mission.target)}` : mission.category === 'purchase' ? `${progress} / ${mission.target} purchase` : `${progress} / ${mission.target} investors`}
                  </span>
                  <span className={`font-bold ${completed ? 'text-green-600' : 'text-blue-600'}`}>{pct}%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${claimed ? 'bg-green-400' : completed ? 'bg-blue-500' : 'bg-blue-300'}`} style={{ width: `${pct}%` }} />
                </div>
              </div>

              {claimed ? (
                <div className="w-full py-2.5 rounded-xl bg-green-50 border border-green-200 text-green-600 text-sm font-semibold flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Claimed
                </div>
              ) : completed ? (
                <button onClick={() => handleClaim(mission)} className="w-full py-2.5 rounded-xl text-white text-sm font-semibold active:scale-95 transition-all flex items-center justify-center gap-2" style={{ background: 'linear-gradient(135deg, #16a34a, #22c55e)' }}>
                  <Gift className="w-4 h-4" /> Claim {formatUGX(mission.reward)}
                </button>
              ) : (
                <div className="w-full py-2.5 rounded-xl bg-gray-100 text-gray-400 text-sm font-semibold flex items-center justify-center gap-2">
                  <Clock className="w-4 h-4" /> In Progress
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MissionCenter;
