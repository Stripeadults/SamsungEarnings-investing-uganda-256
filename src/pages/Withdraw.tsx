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
  const [pendingAmount, setPendingAmount] = useState(0);
  const [hasBought] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const w = await getUserWallets(user.id);
      setWallets(w);
      if (w.length > 0) setSelectedWallet(w[0].id);

      const { data: pendings } = await supabase
        .from('samsung_withdrawals')
        .select('amount')
        .eq('user_id', user.id)
        .eq('status', 'pending');

      if (pendings) {
        const total = pendings.reduce((s: number, a: any) => s + Number(a.amount), 0);
        setPendingAmount(total);
      }
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
        setUser((prev: any) => ({ ...prev, balance: realBalance }));
        setLoading(false);
        return;
      }

      const wallet = wallets.find((w: any) => w.id === selectedWallet);
      if (!wallet) { toast.error('Wallet not found'); setLoading(false); return; }
      
      const tax = Math.round(withdrawAmount * 0.10);
      const net = withdrawAmount - tax;

      // FLOW B: NO DEDUCT HERE - only create pending record
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

      toast.success(`Withdrawal submitted! ${formatUGX(withdrawAmount)} pending approval. Balance will deduct after admin approves.`);
      setAmount('');
      setPendingAmount(prev => prev + withdrawAmount);
      navigate('/records');

    } catch (e) {
      console.log(e);
      toast.error('Withdrawal failed');
    } finally {
      setLoading(false);
    }
  };

  const currentBalance = Number(user?.balance || 0);
  const withdrawValue = Number(amount || 0);
  const remainingAfter = currentBalance - pendingAmount - withdrawValue;

  return (
    <div className="p-4 space-y-4">
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Available Balance:</span>
          <span className="font-bold text-blue-600">{formatUGX(currentBalance)}</span>
        </div>
        {pendingAmount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Pending Withdrawal:</span>
            <span className="font-bold text-amber-600">{formatUGX(pendingAmount)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm pt-2 border-t border-blue-100">
          <span className="text-gray-500">Will remain after approval:</span>
          <span className={`font-bold ${remainingAfter < 0 ? 'text-red-500' : 'text-green-600'}`}>{formatUGX(remainingAfter)}</span>
        </div>
      </div>

      <input 
        value={amount} 
        onChange={(e)=>setAmount(e.target.value)} 
        placeholder="Enter amount" 
        type="number" 
        className="border border-gray-200 p-3 w-full rounded-xl outline-none" 
      />
      
      {wallets.length > 0 && (
        <select value={selectedWallet} onChange={(e)=>setSelectedWallet(e.target.value)} className="border border-gray-200 p-3 w-full rounded-xl outline-none bg-white">
          {wallets.map((w:any)=>(
            <option key={w.id} value={w.id}>{w.type.toUpperCase()} - {w.phone} ({w.name})</option>
          ))}
        </select>
      )}

      <button onClick={handleWithdraw} disabled={loading} className="bg-blue-600 text-white p-3 w-full rounded-xl font-bold disabled:opacity-50">
        {loading ? 'Submitting...' : 'Withdraw'}
      </button>

      {pendingAmount > 0 && (
        <div className="text-center text-xs text-amber-600 bg-amber-50 p-2 rounded-xl">
          You have {formatUGX(pendingAmount)} pending withdrawal awaiting admin approval
        </div>
      )}
    </div>
  );
}
