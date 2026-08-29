import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import {
  getCurrentUser, getUserWallets, getWithdrawals, createWithdrawal, addNotification,
  getUserRecharges, getUserProducts
} from '@/lib/storage';
import { generateId, formatUGX } from '@/lib/utils';
import { MIN_WITHDRAWAL, MAX_WITHDRAWALS_PER_DAY, WITHDRAWAL_TAX } from '@/constants/packages';
import { Withdrawal as WithdrawalType, Wallet } from '@/types';

const Withdraw = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [selectedWallet, setSelectedWallet] = useState('');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [hasRecharge, setHasRecharge] = useState(false);
  const [hasProduct, setHasProduct] = useState(false);
  const [todayWithdrawals, setTodayWithdrawals] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = getCurrentUser();
    if (!u) { navigate('/login'); return; }
    setUser(u);

    const loadData = async () => {
      const [ws, recharges, prods, allWithdrawals] = await Promise.all([
        getUserWallets(u.id),
        getUserRecharges(u.id),
        getUserProducts(u.id),
        getWithdrawals(),
      ]);
      setWallets(ws);
      setHasRecharge(recharges.some((r) => r.status === 'approved'));
      setHasProduct(prods.length > 0);

      const today = new Date();
      const count = allWithdrawals.filter((w) => {
        const wDate = new Date(w.createdAt);
        return w.userId === u.id && wDate.toDateString() === today.toDateString() && w.status !== 'rejected';
      }).length;
      setTodayWithdrawals(count);
      setLoading(false);
    };
    loadData();
  }, [navigate]);

  const taxAmount = amount ? Math.round(parseInt(amount) * WITHDRAWAL_TAX) : 0;
  const netAmount = amount ? parseInt(amount) - taxAmount : 0;

  const handleWithdraw = async () => {
    if (!selectedWallet) { toast.error('Please select a wallet'); return; }
    if (!amount || parseInt(amount) < MIN_WITHDRAWAL) { toast.error(`Minimum withdrawal is ${formatUGX(MIN_WITHDRAWAL)}`); return; }
    if (parseInt(amount) > user.balance) { toast.error('Insufficient balance'); return; }
    if (todayWithdrawals >= MAX_WITHDRAWALS_PER_DAY) { toast.error(`Maximum ${MAX_WITHDRAWALS_PER_DAY} withdrawals per day`); return; }

    const wallet = wallets.find((w) => w.id === selectedWallet);
    if (!wallet) { toast.error('Wallet not found'); return; }

    setSubmitting(true);

    const withdrawal: WithdrawalType = {
      id: generateId(),
      userId: user.id,
      userName: user.name,
      userPhone: user.phone,
      amount: parseInt(amount),
      netAmount,
      walletType: wallet.type,
      walletPhone: wallet.phone,
      walletName: wallet.name,
      status: 'pending',
      createdAt: new Date().toISOString(),
      processedAt: null,
    };

    await createWithdrawal(withdrawal);
    await addNotification({
      userId: user.id,
      type: 'withdrawal_approved',
      title: 'Withdrawal Requested',
      message: `Your withdrawal of ${formatUGX(parseInt(amount))} is pending. You'll receive ${formatUGX(netAmount)} after 18% tax.`,
      isRead: false,
    });

    toast.success('Withdrawal request submitted! Admin will process within 24hrs.');
    navigate('/records');
    setSubmitting(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>;

  return (
    <div className="app-container min-h-screen bg-gray-50">
      <div className="flex items-center px-4 py-4 bg-white border-b border-gray-100">
        <button onClick={() => navigate(-1)} className="mr-3"><ArrowLeft className="w-6 h-6 text-gray-700" /></button>
        <h1 className="text-gray-800 font-bold text-lg">Withdraw</h1>
      </div>

      <div className="px-4 py-5 space-y-4">
        <div className="rounded-2xl p-4 text-white" style={{ background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)' }}>
          <div className="text-blue-200 text-sm">Available Balance</div>
          <div className="text-white text-2xl font-bold mt-1">{user ? formatUGX(user.balance) : '...'}</div>
          <div className="text-blue-200 text-xs mt-2">Today&apos;s withdrawals: {todayWithdrawals}/{MAX_WITHDRAWALS_PER_DAY}</div>
        </div>

        {user?.frozen && (
          <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1"><span className="text-xl">🔒</span><div className="text-red-700 font-bold text-sm">Account Frozen</div></div>
            <p className="text-red-600 text-sm">Your account has been frozen by the admin. Withdrawals are not available. Please contact support.</p>
          </div>
        )}

        {(!hasRecharge || !hasProduct) && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
            <div className="text-red-700 font-bold text-sm mb-2">⚠️ Withdrawal Not Available Yet</div>
            <p className="text-red-600 text-sm mb-3">To withdraw, you must first recharge your account and purchase a Samsung investment package.</p>
            <div className="space-y-2">
              <div className={`flex items-center gap-2 text-sm font-medium ${hasRecharge ? 'text-green-600' : 'text-red-500'}`}>
                <span>{hasRecharge ? '✅' : '❌'}</span>
                <span>Recharge account (min UGX 15,000)</span>
                {!hasRecharge && <button onClick={() => navigate('/recharge')} className="ml-auto bg-blue-600 text-white text-xs px-3 py-1 rounded-lg font-semibold">Recharge</button>}
              </div>
              <div className={`flex items-center gap-2 text-sm font-medium ${hasProduct ? 'text-green-600' : 'text-red-500'}`}>
                <span>{hasProduct ? '✅' : '❌'}</span>
                <span>Buy a Samsung investment package</span>
                {!hasProduct && <button onClick={() => navigate('/product')} className="ml-auto bg-blue-600 text-white text-xs px-3 py-1 rounded-lg font-semibold">Buy Now</button>}
              </div>
            </div>
          </div>
        )}

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-700 space-y-1">
          <p>• Minimum withdrawal: <strong>{formatUGX(MIN_WITHDRAWAL)}</strong></p>
          <p>• 18% tax applied to all withdrawals</p>
          <p>• Max 2 withdrawals per day</p>
          <p>• Balance deducted only after admin approval</p>
        </div>

        {wallets.length === 0 ? (
          <div className="bg-white rounded-2xl p-5 text-center">
            <p className="text-gray-500 text-sm mb-3">No wallet added yet</p>
            <button onClick={() => navigate('/wallet')} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold">Add Wallet</button>
          </div>
        ) : (
          <div>
            <label className="text-sm font-medium text-gray-600 mb-2 block">Select Wallet</label>
            <div className="space-y-2">
              {wallets.map((w) => (
                <button key={w.id} onClick={() => setSelectedWallet(w.id)} className={`w-full p-3 rounded-xl border-2 flex items-center gap-3 transition-colors text-left ${selectedWallet === w.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}>
                  <span className="text-2xl">{w.type === 'mtn' ? '📲' : '📱'}</span>
                  <div>
                    <div className="text-gray-800 font-medium text-sm">{w.name}</div>
                    <div className="text-gray-500 text-xs">{w.phone} • {w.type === 'mtn' ? 'MTN MoMo' : 'Airtel Money'}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="text-sm font-medium text-gray-600 mb-2 block">Amount (UGX)</label>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Enter amount (min 7,000)" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 outline-none text-base bg-white" />
          {amount && parseInt(amount) >= MIN_WITHDRAWAL && (
            <div className="mt-2 bg-gray-50 rounded-xl p-3">
              <div className="flex justify-between text-sm text-gray-500"><span>Amount:</span><span>{formatUGX(parseInt(amount))}</span></div>
              <div className="flex justify-between text-sm text-red-500 mt-1"><span>Tax (18%):</span><span>-{formatUGX(taxAmount)}</span></div>
              <div className="flex justify-between text-sm font-bold text-green-600 mt-1 pt-1 border-t border-gray-200"><span>You receive:</span><span>{formatUGX(netAmount)}</span></div>
            </div>
          )}
        </div>

        <button
          onClick={handleWithdraw}
          disabled={submitting || wallets.length === 0 || !hasRecharge || !hasProduct || !!user?.frozen}
          className="w-full py-4 rounded-xl text-white font-bold text-base transition-all active:scale-95 disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)' }}
        >
          {submitting ? 'Processing...' : user?.frozen ? '🔒 Account Frozen' : (!hasRecharge || !hasProduct) ? 'Complete Prerequisites First' : 'Withdraw Now'}
        </button>
      </div>
    </div>
  );
};

export default Withdraw;
