import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { getCurrentUser, getUserWallets } from '@/lib/storage';

const MIN_WITHDRAW = 7000;
const formatUGX = (n: number) => `UGX ${Number(n).toLocaleString()}`;
const generateId = () => Math.random().toString(36).substring(2, 15);

export default function Withdraw() {
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<string>('');
  const [wallets, setWallets] = useState<any[]>([]);
  const [user, setUser] = useState<any>(getCurrentUser());
  const [hasBought, setHasBought] = useState(true); // set your logic

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const w = await getUserWallets(user.id);
      setWallets(w);
      if (w.length > 0) setSelectedWallet(w[0].id);
    };
    load();
  }, []);

  const handleWithdraw = async () => {
    if (loading) return;
    const withdrawAmount = Number(amount);
    if (!hasBought) { toast.error('You must buy a package first to withdraw'); return; }
    if (!selectedWallet) { toast.error('Please add a wallet'); navigate('/wallet'); return; }
    if (!withdrawAmount || withdrawAmount < MIN_WITHDRAW) { toast.error(`Minimum withdraw is ${formatUGX(MIN_WITHDRAW)}`); return; }

    setLoading(true);
    try {
      const { data: freshUser } = await supabase.from('samsung_users').select('balance').eq('id', user.id).single();
      const realBalance = Number(freshUser?.balance || 0);

      if (withdrawAmount > realBalance) {
        toast.error(`Insufficient balance. You have ${formatUGX(realBalance)}`);
        setUser((prev:any) => ({...prev, balance: realBalance}));
        setLoading(false);
        return;
      }

      const wallet = wallets.find((w:any) => w.id === selectedWallet);
      if (!wallet) { toast.error('Wallet not found'); setLoading(false); return; }
      
      const tax = Math.round(withdrawAmount * 0.10);
      const net = withdrawAmount - tax;

      // SAFE: No deduct here - balance stays 10,000
      const { error } = await supabase.from('samsung_withdrawals').insert([{
        id: generateId(),
        user_id: user.id,
        user_name: user.name,
        user_phone: user.phone,
        amount: withdrawAmount,
        net_amount: net,
        wallet_type: wallet.type,
        wallet_phone: wallet.phone,
        wallet_name: wallet.name,
        status: 'pending',
        created_at: new Date().toISOString()
      }]);

      if (error) throw error;

      toast.success('Withdrawal submitted! Balance will deduct after admin approval');
      setAmount('');
      navigate('/records');

    } catch (e) {
      console.log(e);
      toast.error('Withdrawal failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      {/* Keep your existing JSX here - input, wallet select, button */}
      <input value={amount} onChange={(e)=>setAmount(e.target.value)} placeholder="Amount" type="number" className="border p-2 w-full" />
      <button onClick={handleWithdraw} disabled={loading} className="bg-blue-600 text-white p-3 w-full mt-3">
        {loading ? 'Submitting...' : 'Withdraw'}
      </button>
    </div>
  );
}
