import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { getCurrentUser, getUserProducts, getUserWallets, getUserById } from '@/lib/storage';
import { formatUGX, generateId } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

const MIN_WITHDRAW = 7000; // keep your minimum

const Withdraw = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [wallets, setWallets] = useState<any[]>([]);
  const [selectedWallet, setSelectedWallet] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const init = async () => {
      const u = getCurrentUser();
      if (!u) { navigate('/login'); return; }
      const fresh = await getUserById(u.id);
      setUser(fresh || u);

      const [prods, wals] = await Promise.all([
        getUserProducts(u.id),
        getUserWallets(u.id)
      ]);
      setProducts(prods);
      setWallets(wals);
      if (wals.length > 0) setSelectedWallet(wals[0].id);
    };
    init();
  }, [navigate]);

  const activeProducts = products.filter(p => p.status === 'active' || p.status === 'approved');
  const hasBought = activeProducts.length > 0;

  const handleWithdraw = async () => {
    const withdrawAmount = Number(amount);

    if (!hasBought) {
      toast.error('You must buy a package first to withdraw');
      return;
    }
    if (!selectedWallet) {
      toast.error('Please add a wallet first');
      navigate('/wallet');
      return;
    }
    if (!withdrawAmount || withdrawAmount < MIN_WITHDRAW) {
      toast.error(`Minimum withdraw is ${formatUGX(MIN_WITHDRAW)}`);
      return;
    }
    if (withdrawAmount > (user?.balance || 0)) {
      toast.error('Insufficient balance');
      return;
    }

    setLoading(true);
    try {
      
      const wallet = wallets.find((w:any) => w.id === selectedWallet);
      if (!wallet) { toast.error('Wallet not found'); return; }

      const tax = Math.round(withdrawAmount * 0.10);
      const net = withdrawAmount - tax;
      await supabase.from('samsung_users').update({
        balance: user.balance - withdrawAmount,
        totalWithdrawal: (user.totalWithdrawal || 0) + withdrawAmount
      }).eq('id', user.id);

      await supabase.from('samsung_withdrawals').insert([{
      await supabase.from('samsung_withdrawals').insert([{
        id: generateId(),
        userId: user.id,
        userName: user.name,
        userPhone: user.phone,
        amount: withdrawAmount,
        netAmount: net,
        walletType: wallet.type,
        walletPhone: wallet.phone,
        walletName: wallet.name,
        status: 'pending',
        createdAt: new Date().toISOString()
      }]);
      toast.success('Withdrawal request submitted!');
      setAmount('');
      navigate('/records');
    } catch (e) {
      toast.error('Withdrawal failed, try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container min-h-screen bg-gray-50">
      <div className="flex items-center px-4 py-4 bg-white border-b">
        <button onClick={() => navigate(-1)} className="mr-3"><ArrowLeft className="w-6 h-6" /></button>
        <h1 className="font-bold text-lg">Withdraw</h1>
      </div>

      <div className="px-4 py-5 space-y-4">
        <div className="bg-white rounded-2xl p-4">
          <div className="text-gray-500 text-xs">Available Balance</div>
          <div className="text-2xl font-bold text-blue-600">{user? formatUGX(user.balance) : '...'}</div>
        </div>

        {!hasBought && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
            <div className="text-red-600 font-bold text-sm">🔒 Withdraw Locked</div>
            <div className="text-red-500 text-xs mt-1">You must buy at least 1 Samsung Package to unlock withdrawals</div>
            <button onClick={() => navigate('/product')} className="mt-3 bg-red-600 text-white px-5 py-2 rounded-xl text-sm font-bold">Buy Package Now</button>
          </div>
        )}

        {hasBought && (
          <>
            <div className="bg-white rounded-2xl p-4">
              <label className="text-sm font-medium">Select Wallet</label>
              <select value={selectedWallet} onChange={(e) => setSelectedWallet(e.target.value)} className="w-full mt-2 border rounded-xl px-3 py-3 text-sm">
                {wallets.map(w => (
                  <option key={w.id} value={w.id}>{w.type.toUpperCase()} - {w.phone}</option>
                ))}
              </select>
              {wallets.length === 0 && <button onClick={() => navigate('/wallet')} className="text-blue-600 text-xs mt-2">+ Add Wallet</button>}
            </div>

            <div className="bg-white rounded-2xl p-4">
              <label className="text-sm font-medium">Amount (Min {formatUGX(MIN_WITHDRAW)})</label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Enter amount" className="w-full mt-2 border rounded-xl px-4 py-3 text-sm outline-none" />
            </div>

            <button onClick={handleWithdraw} disabled={loading ||!hasBought} className="w-full py-4 rounded-xl text-white font-bold bg-blue-600 disabled:bg-gray-300">
              {loading? 'Processing...' : 'Submit Withdrawal'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Withdraw;
