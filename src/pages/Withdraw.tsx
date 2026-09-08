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
      const TABLES_TO_TRY = [
        'samsung_user_products','samsung_purchases','samsung_investments',
        'samsung_user_packages','user_products','purchases','investments',
        'user_investments','samsung_orders','orders','samsung_user_investments'
      ];

      console.log("=== CHECKING PACKAGE FOR USER:", u.id, "===");
      let hasAnyPurchase = false;

      for (const tbl of TABLES_TO_TRY) {
        try {
          const { data, error } = await supabase.from(tbl).select('id').eq('user_id', u.id).limit(1);
          if (!error) {
            console.log(`Table ${tbl} exists, found ${data?.length} records`);
            if (data && data.length > 0) { hasAnyPurchase = true; console.log(`✅ FOUND PACKAGE IN ${tbl}`); break; }
          } else {
            // try userId
            const r2 = await supabase.from(tbl).select('id').eq('userId', u.id).limit(1);
            if (!r2.error && r2.data && r2.data.length > 0) { hasAnyPurchase = true; console.log(`✅ FOUND PACKAGE IN ${tbl} (userId)`); break; }
          }
        } catch (e) {}
      }

      // If not found, also check samsung_users total_invested
      if (!hasAnyPurchase) {
        const { data: ud } = await supabase.from('samsung_users').select('*').eq('id', u.id).single();
        console.log("User data:", ud);
        const invested = Number((ud as any)?.total_invested || (ud as any)?.total_investment || 0);
        if (invested > 0) hasAnyPurchase = true;
      }

      console.log("FINAL hasPackage:", hasAnyPurchase);
      setHasPackage(hasAnyPurchase);
    };
    check();
  }, []);

  const handleWithdraw = async () => {
    if (loading) return;
    if (hasPackage === false) {
      toast.error('Please buy a package first');
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

  if (hasPackage === false) {
    return (
      <div className="p-4 pb-20 pt-20 text-center">
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6">
          <div className="font-bold text-red-600">Buy Package First 📦</div>
          <p className="text-sm text-gray-600 mt-2">You have no package in history. New accounts must buy a package to unlock withdrawal.</p>
          <button onClick={()=>navigate('/products')} className="bg-blue-600 text-white p-3 w-full rounded-xl font-bold mt-4">Buy Package Now</button>
        </div>
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
                <div><div className="font-bold">{w.type} - {w.phone}</div><div className="text-xs text-gray-500">{w.name}</div></div>
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedWallet===w.id?'bg-blue-600 border-blue-600':''}`}>{selectedWallet===w.id && <div className="w-2 h-2 bg-white rounded-full"></div>}</div>
              </div>
            ))}
            <button onClick={()=>navigate('/wallet')} className="text-blue-600 text-sm mt-2">+ Add another wallet</button>
          </div>
        )}
      </div>
      <input value={amount} onChange={(e)=>setAmount(e.target.value)} placeholder="Amount" type="number" className="border p-3 w-full rounded" />
      {amount && hasPackage && <div className="text-xs text-gray-500">You will receive: {formatUGX(Number(amount) - Math.round(Number(amount)*0.10))} (10% fee)</div>}
      <button onClick={handleWithdraw} disabled={loading || wallets.length===0 || hasPackage===null} className="bg-blue-600 disabled:bg-gray-400 text-white p-3 w-full rounded font-bold">
        {hasPackage===null ? 'Checking...' : loading ? 'Submitting...' : 'Withdraw'}
      </button>
    </div>
  );
}
