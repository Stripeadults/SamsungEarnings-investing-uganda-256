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
  const [hasPackage, setHasPackage] = useState<boolean>(true);

  useEffect(() => {
    const u = getCurrentUser();
    if (!u) { navigate('/login'); return; }
    setUser(u);
    getUserWallets(u.id).then(w => {
      setWallets(w);
      if (w.length > 0) setSelectedWallet(w[0].id);
    });

    // check if user has bought any package
    supabase.from('samsung_user_products').select('id').eq('user_id', u.id).limit(1).then(({ data }) => {
      if (data && data.length > 0) setHasPackage(true);
      else {
        // fallback check other possible table
        supabase.from('samsung_purchases').select('id').eq('user_id', u.id).limit(1).then(({ data: d2 }) => {
          setHasPackage(!!(d2 && d2.length > 0));
        });
      }
    });
  }, []);

  const handleWithdraw = async () => {
    if (loading) return;
    if (!hasPackage) {
      toast.error('Please buy a package first to withdraw');
      navigate('/products');
      return;
    }
    const withdrawAmount = Number(amount);
    if (wallets.length === 0) { toast.error('Please add wallet first'); navigate('/wallet'); return; }
    if (!selectedWallet) { toast.error('Select wallet'); return; }
    if (!withdrawAmount || withdrawAmount < MIN_WITHDRAW) { toast.error(`Min ${formatUGX(MIN_WITHDRAW)}`); return; }

    setLoading(true);
    try {
      const { data: freshUser } = await supabase.from('samsung_users').select('balance').eq('id', user.id).single();
      if (withdrawAmount > Number(freshUser?.balance || 0)) {
        toast.error(`Insufficient. You have ${formatUGX(Number(freshUser?.balance||0))}`);
        setLoading(false); return;
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
      });

      toast.success('Withdrawal submitted! Pending admin approval');
      setAmount('');
      navigate('/records');
    } catch (e:any) {
      console.error(e);
      toast.error(e.message || 'Withdrawal failed');
    } finally { setLoading(false); }
  };

  if (hasPackage === false) {
    return (
      <div className="p-4 space-y-4 pb-20 text-center pt-20">
        <div className="text-5xl">📦</div>
        <div className="font-bold text-lg">Buy Package to Withdraw</div>
        <p className="text-gray-500 text-sm">You need to purchase at least one package before you can request withdrawal.</p>
        <button onClick={()=>navigate('/products')} className="bg-blue-600 text-white p-3 w-full rounded font-bold mt-4">
          Buy Package Now
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 pb-20">
      <div className="bg-gray-100 p-3 rounded font-bold">Balance: {formatUGX(Number(user?.balance || 0))}</div>

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
                <div>
                  <div className="font-bold">{w.type} - {w.phone}</div>
                  <div className="text-xs text-gray-500">{w.name}</div>
                </div>
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedWallet===w.id?'bg-blue-600 border-blue-600':''}`}>
                  {selectedWallet===w.id && <div className="w-2 h-2 bg-white rounded-full"></div>}
                </div>
              </div>
            ))}
            <button onClick={()=>navigate('/wallet')} className="text-blue-600 text-sm mt-2">+ Add another wallet</button>
          </div>
        )}
      </div>

      <input value={amount} onChange={(e)=>setAmount(e.target.value)} placeholder="Amount" type="number" className="border p-3 w-full rounded" />
      {amount && <div className="text-xs text-gray-500">You will receive: {formatUGX(Number(amount) - Math.round(Number(amount)*0.10))} (10% fee)</div>}
      
      <button onClick={handleWithdraw} disabled={loading || wallets.length===0} className="bg-blue-600 disabled:bg-gray-400 text-white p-3 w-full rounded font-bold">
        {loading ? 'Submitting...' : 'Withdraw'}
      </button>
    </div>
  );
}
