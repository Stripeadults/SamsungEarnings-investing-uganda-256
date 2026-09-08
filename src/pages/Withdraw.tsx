import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { getCurrentUser, getUserWallets, createWithdrawal } from '@/lib/storage';
import * as Storage from '@/lib/storage';

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
        const funcNames = ['getUserProducts','getUserInvestments','getUserPackages','getUserOrders','getMyProducts','getMyInvestments','getInvestments','getProducts'];
        for (const fn of funcNames) {
          const f = (Storage as any)[fn];
          if (typeof f === 'function') {
            try {
              const res = await f(u.id);
              if (Array.isArray(res) && res.length > 0) { setHasPackage(true); return; }
            } catch {}
          }
        }
        const { data: ud } = await supabase.from('samsung_users').select('*').eq('id', u.id).single();
        if (ud) {
          const invested = Number((ud as any).total_invested || (ud as any).total_investment || 0);
          if (invested > 0) { setHasPackage(true); return; }
        }
        setHasPackage(false);
      } catch { setHasPackage(false); }
    };
    check();
  }, []);

  const handleWithdraw = async () => {
    if (loading || hasPackage === false) return; // HARD BLOCK
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
        userId: user.id, userName: user.name, userPhone: user.phone,
        amount: withdrawAmount, netAmount: net,
        walletType: wallet.type, walletPhone: wallet.phone, walletName: wallet.name,
        status: 'pending',
      });
      toast.success('Withdrawal submitted!');
      setAmount(''); navigate('/records');
    } catch (e:any) { toast.error(e.message || 'Withdrawal failed'); }
    finally { setLoading(false); }
  };

  // === HARD BLOCK: NO PACKAGE = NO WITHDRAW FORM ===
  if (hasPackage === false) {
    return (
      <div className="p-6 pb-20 pt-24 text-center">
        <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-8">
          <div className="text-5xl mb-3">🔒</div>
          <h2 className="font-bold text-red-600 text-lg">Withdrawal Blocked</h2>
          <p className="text-sm text-gray-700 mt-3">You have no package bought in history or current. You cannot request withdrawal.</p>
          <p className="text-xs text-gray-500 mt-2">Buy at least 1 package to unlock.</p>
          <button onClick={()=>navigate('/products')} className="bg-blue-600 text-white w-full p-3 rounded-xl font-bold mt-6">Buy Package Now</button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 pb-20">
      <div className="bg-gray-100 p-3 rounded font-bold">Balance: {formatUGX(Number(user?.balance || 0))} {hasPackage===null?' (checking...)':''}</div>
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
      {amount && hasPackage && <div className="text-xs text-gray-500">You will receive: {formatUGX(Number(amount) - Math.round(Number(amount)*0.10))}</div>}
      <button onClick={handleWithdraw} disabled={loading || wallets.length===0 || hasPackage!==true} className="bg-blue-600 disabled:bg-gray-400 text-white p-3 w-full rounded font-bold">
        {hasPackage===null ? 'Checking...' : loading ? 'Submitting...' : 'Withdraw'}
      </button>
    </div>
  );
}
