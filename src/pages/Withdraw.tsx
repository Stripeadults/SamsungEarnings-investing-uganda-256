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
  const [hasPackage, setHasPackage] = useState<boolean | null>(null);

  useEffect(() => {
    const u = getCurrentUser();
    if (!u) { navigate('/login'); return; }
    setUser(u);
    getUserWallets(u.id).then(w => {
      setWallets(w);
      if (w.length > 0) setSelectedWallet(w[0].id);
    });

    const check = async () => {
      try {
        // SECURE: Only active + not expired packages from server
        const { data, error } = await supabase
          .from('samsung_products')
          .select('id')
          .eq('user_id', u.id)
          .eq('status', 'active')
          .gt('expiry_date', new Date().toISOString())
          .limit(1);

        if (error) {
          console.error(error);
          setHasPackage(false);
          return;
        }

        if (data && data.length > 0) {
          setHasPackage(true);
        } else {
          setHasPackage(false);
        }
      } catch {
        setHasPackage(false);
      }
    };
    check();
  }, []);

  const handleWithdraw = async () => {
    if (loading) return;
    if (hasPackage === false) {
      toast.error('Please buy a package first - you have no active package');
      return;
    }
    const withdrawAmount = Number(amount);
    if (wallets.length === 0) { toast.error('Please add wallet first'); navigate('/wallet'); return; }
    if (!selectedWallet) { toast.error('Select wallet'); return; }
    if (!withdrawAmount || withdrawAmount < MIN_WITHDRAW) { toast.error(`Min ${formatUGX(MIN_WITHDRAW)}`); return; }

    setLoading(true);
    try {
      // SECURE: Fresh balance from server, not localStorage
      const { data: freshUser } = await supabase.from('samsung_users').select('balance').eq('id', user.id).single();
      if (!freshUser) {
        toast.error('User not found');
        setLoading(false); return;
      }
      if (withdrawAmount > Number(freshUser.balance || 0)) {
        toast.error(`Insufficient. You have ${formatUGX(Number(freshUser.balance||0))}`);
        setLoading(false); return;
      }

      // SECURE: Re-check active package server-side before withdraw (double protection)
      const { data: activeCheck } = await supabase
        .from('samsung_products')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .gt('expiry_date', new Date().toISOString())
        .limit(1);

      if (!activeCheck || activeCheck.length === 0) {
        toast.error('No active package found - cannot withdraw');
        setHasPackage(false);
        setLoading(false);
        return;
      }

      const wallet = wallets.find((w:any) => w.id === selectedWallet);
      const net = withdrawAmount - Math.round(withdrawAmount*0.10);
      await createWithdrawal({
        userId: user.id, 
        userName: user.name, 
        userPhone: user.phone,
        amount: withdrawAmount, 
        netAmount: net,
        walletType: wallet.type, 
        walletPhone: wallet.phone, 
        walletName: wallet.name,
        status: 'pending',
      } as any);
      toast.success('Withdrawal submitted! Waiting admin approval');
      setAmount(''); 
      navigate('/records');
    } catch (e:any) { 
      toast.error(e.message || 'Withdrawal failed - no active package'); 
    }
    finally { setLoading(false); }
  };

  if (hasPackage === false) {
    return (
      <div className="p-6 pb-20 pt-24 text-center">
        <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-6">
          <div className="text-4xl mb-2">📦</div>
          <h2 className="font-bold text-red-600 text-lg">Buy Package First</h2>
          <p className="text-sm text-gray-600 mt-3">System detected you have no ACTIVE package. Pending packages cannot withdraw until admin approves your payment. New accounts without active package cannot withdraw.</p>
          <button onClick={()=>navigate('/products')} className="bg-blue-600 text-white w-full p-3 rounded-xl font-bold mt-6">Buy Package Now</button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 pb-20">
      <div className="bg-gray-100 p-3 rounded font-bold">Balance: {formatUGX(Number(user?.balance || 0))} {hasPackage===null?' (checking...)':'(Active package ✓)'}</div>
      <div>
        <h3 className="font-bold mb-2">Select Wallet ({wallets.length})</h3>
        {wallets.length === 0 ? (
          <div className="border-2 border-dashed p-6 rounded text-center">
            <p className="mb-3 text-gray-600">You don't have any wallet</p>
            <button onClick={()=>navigate('/wallet')} className="bg-yellow-500 text-black px-4 py-2 rounded font-bold">+ Add Wallet</button>
          </div>
        ) : (
          <div className="space-y-2">
            {wallets.map((w:any)=>(
              <div key={w.id} onClick={()=>setSelectedWallet(w.id)} className={`border p-3 rounded flex justify-between items-center cursor-pointer ${selectedWallet===w.id?'border-blue-600 bg-blue-50':'border-gray-300'}`}>
                <div><div className="font-bold">{w.type} - {w.phone}</div><div className="text-xs text-gray-500">{w.name}</div></div>
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedWallet===w.id?'bg-blue-600 border-blue-600':''}`}>{selectedWallet===w.id && <div className="w-2 h-2 bg-white rounded-full"></div>}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      <input value={amount} onChange={(e)=>setAmount(e.target.value)} placeholder="Amount" type="number" className="border p-3 w-full rounded" />
      {amount && hasPackage && <div className="text-xs text-gray-500">You will receive: {formatUGX(Number(amount) - Math.round(Number(amount)*0.10))} (10% fee)</div>}
      <button onClick={handleWithdraw} disabled={loading || wallets.length===0 || hasPackage!==true} className="bg-blue-600 disabled:bg-gray-400 text-white p-3 w-full rounded font-bold">
        {hasPackage===null ? 'Checking package...' : loading ? 'Submitting...' : 'Withdraw'}
      </button>
    </div>
  );
}
