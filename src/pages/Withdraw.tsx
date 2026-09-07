import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { getCurrentUser, getUserWallets, createWithdrawal } from '@/lib/storage';

const MIN_WITHDRAW = 7000;
const formatUGX = (n: number) => `UGX ${Number(n).toLocaleString()}`;

export default function Withdraw() {
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState('');
  const [wallets, setWallets] = useState<any[]>([]);
  const [user, setUser] = useState<any>(getCurrentUser());

  useEffect(() => {
    const load = async () => {
      const u = getCurrentUser();
      if (!u) { navigate('/login'); return; }
      setUser(u);
      const w = await getUserWallets(u.id);
      setWallets(w);
      if (w.length > 0) setSelectedWallet(w[0].id);
    };
    load();
  }, []);

  const handleWithdraw = async () => {
    if (loading) return;
    const withdrawAmount = Number(amount);
    if (!selectedWallet && wallets.length === 0) { toast.error('Add wallet first'); navigate('/wallet'); return; }
    if (!withdrawAmount || withdrawAmount < MIN_WITHDRAW) { toast.error(`Min is ${formatUGX(MIN_WITHDRAW)}`); return; }

    setLoading(true);
    try {
      const { data: freshUser, error: fetchErr } = await supabase.from('samsung_users').select('balance, total_withdrawal').eq('id', user.id).single();
      if (fetchErr) throw fetchErr;

      if (withdrawAmount > Number(freshUser.balance)) {
        toast.error(`Insufficient. You have ${formatUGX(freshUser.balance)}`);
        setLoading(false); return;
      }

      const wallet = wallets.find((w:any) => w.id === selectedWallet);
      const tax = Math.round(withdrawAmount * 0.10);
      const net = withdrawAmount - tax;

      // USE YOUR STORAGE FUNCTION - it has correct column names
      await createWithdrawal({
        userId: user.id,
        userName: user.name,
        userPhone: user.phone,
        amount: withdrawAmount,
        netAmount: net,
        walletType: wallet?.type || 'MTN',
        walletPhone: wallet?.phone || user.phone,
        walletName: wallet?.name || user.name,
        status: 'pending',
      });

      toast.success('Submitted! Awaiting admin approval');
      setAmount('');
      navigate('/records');

    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Withdrawal failed - check Supabase RLS');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <div className="mb-4 text-sm">Balance: {formatUGX(Number(user?.balance || 0))}</div>
      <div className="mb-4 text-sm">Wallets: {wallets.length} {wallets.length===0 && '- Add one in Wallet page'}</div>
      <input value={amount} onChange={(e)=>setAmount(e.target.value)} placeholder="Amount" type="number" className="border p-2 w-full rounded" />
      <button onClick={handleWithdraw} disabled={loading} className="bg-blue-600 text-white p-3 w-full mt-3 rounded">
        {loading ? 'Submitting...' : 'Withdraw'}
      </button>
    </div>
  );
}
