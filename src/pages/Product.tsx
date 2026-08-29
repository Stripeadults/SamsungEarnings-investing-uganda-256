import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import AppLayout from '@/components/layout/AppLayout';
import { refreshCurrentUser, getCurrentUser, getUsers, createProduct, addNotification, updateUser, getUserById, setCurrentUser, getUserRecharges } from '@/lib/storage';
import { PACKAGES } from '@/constants/packages';
import { formatUGX, generateId, addDays } from '@/lib/utils';
import { UserProduct, User } from '@/types';

const Product = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [buying, setBuying] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingRechargeTotal, setPendingRechargeTotal] = useState(0);

  useEffect(() => {
    const init = async () => {
      const cached = getCurrentUser();
      if (!cached) { navigate('/login'); return; }
      // Always fetch fresh balance from cloud
      const fresh = await refreshCurrentUser();
      if (!fresh) { navigate('/login'); return; }
      setUser(fresh);
      const recharges = await getUserRecharges(fresh.id);
      const pendingTotal = recharges
        .filter((r) => r.status === 'pending')
        .reduce((s, r) => s + r.amount, 0);
      setPendingRechargeTotal(pendingTotal);
      setLoading(false);
    };
    init();
  }, [navigate]);

  const filtered = selectedGroup ? PACKAGES.filter((p) => p.group === selectedGroup) : PACKAGES;

  const handleBuy = async (packageId: string) => {
    if (!user) return navigate('/login');

    if (user.frozen) {
      toast.error('Your account is frozen. Contact support to unfreeze.');
      return;
    }

    const pkg = PACKAGES.find((p) => p.id === packageId);
    if (!pkg) return;

    // Always use fresh balance from cloud before purchase
    const freshUser = await getUserById(user.id);
    if (!freshUser) { toast.error('Could not load account. Please refresh.'); return; }

    if (freshUser.balance < pkg.price) {
      toast.error(`Insufficient balance. You have ${formatUGX(freshUser.balance)} — need ${formatUGX(pkg.price)}. Please recharge first.`);
      setUser(freshUser);
      setCurrentUser(freshUser);
      return;
    }

    setBuying(packageId);

    await updateUser({ ...freshUser, balance: freshUser.balance - pkg.price });

    const product: UserProduct = {
      id: generateId(),
      userId: freshUser.id,
      packageId: pkg.id,
      packageName: pkg.name,
      packagePrice: pkg.price,
      dailyIncome: pkg.dailyIncome,
      duration: pkg.duration,
      buyDate: new Date().toISOString(),
      expiryDate: addDays(new Date(), pkg.duration).toISOString(),
      status: 'pending',
      lastIncomeDate: null,
      totalIncomeEarned: 0,
      paymentProof: 'Balance Payment',
    };

    await createProduct(product);

    await addNotification({
      userId: freshUser.id,
      type: 'package_approved',
      title: 'Package Purchase Submitted',
      message: `Your ${pkg.name} package (${formatUGX(pkg.price)}) is pending admin approval.`,
      isRead: false,
    });

    // Notify referral chain about pending commission
    const allUsers = await getUsers();
    if (freshUser.referredBy) {
      const l1 = allUsers.find((u) => u.id === freshUser.referredBy);
      if (l1) {
        const c1 = Math.round(pkg.price * 0.30);
        await addNotification({
          userId: l1.id,
          type: 'referral_bonus',
          title: '🎉 Referral Investment Pending!',
          message: `${freshUser.name} just purchased ${pkg.name} (${formatUGX(pkg.price)}). You will earn UGX ${c1.toLocaleString()} (30%) once approved by admin.`,
          isRead: false,
        });
        if (l1.referredBy) {
          const l2 = allUsers.find((u) => u.id === l1.referredBy);
          if (l2) {
            const c2 = Math.round(pkg.price * 0.02);
            await addNotification({
              userId: l2.id,
              type: 'referral_bonus',
              title: '📣 L2 Commission Pending',
              message: `Your L2 member ${freshUser.name} purchased ${pkg.name}. You will earn UGX ${c2.toLocaleString()} (2%) on approval.`,
              isRead: false,
            });
            if (l2.referredBy) {
              const l3 = allUsers.find((u) => u.id === l2.referredBy);
              if (l3) {
                const c3 = Math.round(pkg.price * 0.01);
                await addNotification({
                  userId: l3.id,
                  type: 'referral_bonus',
                  title: '📣 L3 Commission Pending',
                  message: `Your L3 member purchased a package. You will earn UGX ${c3.toLocaleString()} (1%) on approval.`,
                  isRead: false,
                });
              }
            }
          }
        }
      }
    }

    // Update local session balance
    const updatedSession = { ...freshUser, balance: freshUser.balance - pkg.price };
    setCurrentUser(updatedSession);
    setUser(updatedSession);

    toast.success(`${pkg.name} purchased! Awaiting admin approval.`);
    setBuying(null);
  };

  if (loading) return (
    <AppLayout>
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Loading...</div>
    </AppLayout>
  );

  return (
    <AppLayout>
      {/* Balance pill */}
      {pendingRechargeTotal > 0 && (
        <div className="mx-4 mt-4 bg-amber-50 border border-amber-300 rounded-2xl px-4 py-3 flex items-start gap-3">
          <span className="text-xl shrink-0 mt-0.5">⏳</span>
          <div>
            <div className="text-amber-800 font-bold text-sm">Recharge Pending Approval</div>
            <div className="text-amber-700 text-xs mt-0.5 leading-relaxed">
              You have a pending recharge of <span className="font-black">{formatUGX(pendingRechargeTotal)}</span> awaiting admin approval — your balance will update once approved.
            </div>
          </div>
        </div>
      )}

      <div className="mx-4 mt-4 mb-2 flex items-center justify-between bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3">
        <div>
          <div className="text-blue-500 text-xs font-medium">Available Balance</div>
          <div className="text-blue-700 font-black text-lg">{user ? formatUGX(user.balance) : '...'}</div>
        </div>
        <div className="text-blue-400 text-xs text-right">
          <div>Use balance to</div>
          <div className="font-semibold">buy packages</div>
        </div>
      </div>

      <div className="px-4 pt-2 pb-2">
        <h1 className="text-gray-900 text-xl font-bold">Samsung Packages</h1>
        <p className="text-gray-500 text-sm mt-1">Invest in Samsung phones, earn daily returns</p>
      </div>

      <div className="px-4 flex gap-2 overflow-x-auto scrollbar-hide pb-2">
        {[null, 1, 2, 3].map((g) => (
          <button key={String(g)} onClick={() => setSelectedGroup(g)} className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${selectedGroup === g ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
            {g === null ? 'All' : `Group ${g}`}
          </button>
        ))}
      </div>

      <div className="px-4 mt-3 space-y-4">
        {filtered.map((pkg) => {
          const canAfford = user ? user.balance >= pkg.price : false;
          return (
            <div key={pkg.id} className="bg-white rounded-2xl overflow-hidden shadow-sm">
              <div className="relative">
                <img src={pkg.image} alt={pkg.name} className="w-full h-44 object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-3 left-4 text-white">
                  <div className="text-lg font-bold">{pkg.name}</div>
                  <div className="text-xs text-gray-200">Group {pkg.group} • {pkg.duration} Days</div>
                </div>
                <div className="absolute top-3 right-3 bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-semibold">G{pkg.group}</div>
                {!canAfford && (
                  <div className="absolute top-3 left-3 bg-red-500/90 text-white text-[10px] px-2 py-1 rounded-full font-bold">
                    Need {formatUGX(pkg.price - (user?.balance ?? 0))} more
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center">
                    <div className={`font-bold text-sm ${canAfford ? 'text-blue-600' : 'text-red-500'}`}>{formatUGX(pkg.price)}</div>
                    <div className="text-gray-400 text-xs">Investment</div>
                  </div>
                  <div className="text-center">
                    <div className="text-green-600 font-bold text-sm">{formatUGX(pkg.dailyIncome)}</div>
                    <div className="text-gray-400 text-xs">Daily</div>
                  </div>
                  <div className="text-center">
                    <div className="text-amber-600 font-bold text-sm">{pkg.duration}d</div>
                    <div className="text-gray-400 text-xs">Duration</div>
                  </div>
                </div>
                <div className="bg-blue-50 rounded-xl p-3 mb-3">
                  <div className="text-xs text-blue-700 font-medium">Total Returns: {formatUGX(pkg.dailyIncome * pkg.duration)}</div>
                  <div className="text-xs text-blue-500 mt-0.5">ROI: {(((pkg.dailyIncome * pkg.duration) / pkg.price) * 100).toFixed(0)}%</div>
                </div>
                <button
                  onClick={() => handleBuy(pkg.id)}
                  disabled={buying === pkg.id || !canAfford || !!user?.frozen}
                  className={`w-full py-3 rounded-xl text-white font-bold text-sm transition-all active:scale-95 disabled:opacity-60 ${!canAfford ? 'bg-gray-400' : ''}`}
                  style={canAfford && !user?.frozen ? { background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)' } : {}}
                >
                  {buying === pkg.id
                    ? 'Processing...'
                    : !canAfford
                    ? `Recharge ${formatUGX(pkg.price - (user?.balance ?? 0))} more`
                    : `Buy Now — ${formatUGX(pkg.price)}`}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </AppLayout>
  );
};

export default Product;
