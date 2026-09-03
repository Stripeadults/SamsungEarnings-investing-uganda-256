
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import AppLayout from '@/components/layout/AppLayout';
import { refreshCurrentUser, getCurrentUser, createProduct, addNotification, getUserRecharges } from '@/lib/storage';
import { PACKAGES } from '@/constants/packages';
import { formatUGX, generateId, addDays } from '@/lib/utils';
import { User } from '@/types';

const PAYMENT_DETAILS = {
  MTN: { number: "0756406186", name: "Nabakooza Milly", code: "*165#" },
  AIRTEL: { number: "0756406186", name: "Nabakooza Milly", code: "*185#" }
};

const Product = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [buying, setBuying] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState<any>(null);
  const [network, setNetwork] = useState<'MTN' | 'AIRTEL'>('MTN');
  const [payerPhone, setPayerPhone] = useState('');
  const [payerName, setPayerName] = useState('');
  const [enteredAmount, setEnteredAmount] = useState('');
  const [smsProof, setSmsProof] = useState('');

  useEffect(() => {
    const init = async () => {
      const cached = getCurrentUser();
      if (!cached) { navigate('/login'); return; }
      const fresh = await refreshCurrentUser();
      if (!fresh) { navigate('/login'); return; }
      setUser(fresh);
      setLoading(false);
    };
    init();
  }, [navigate]);

  const filtered = selectedGroup? PACKAGES.filter((p) => p.group === selectedGroup) : PACKAGES;

  const openPayModal = (packageId: string) => {
    const pkg = PACKAGES.find((p) => p.id === packageId);
    if (!pkg) return;
    setSelectedPkg(pkg);
    setEnteredAmount(pkg.price.toString());
    setNetwork('MTN');
    setPayerPhone('');
    setPayerName('');
    setSmsProof('');
    setShowPayModal(true);
  };

  const confirmPayment = async () => {
    if (!selectedPkg ||!user) return;

    if (Number(enteredAmount)!== selectedPkg.price) {
      toast.error(`Wrong amount! This package is ${formatUGX(selectedPkg.price)}. You entered ${formatUGX(Number(enteredAmount)||0)}`);
      return;
    }
    if (!payerPhone || payerPhone.length < 10) {
      toast.error('Enter your phone number');
      return;
    }
    if (!payerName.trim() || payerName.trim().length < 3) {
      toast.error('Enter names on your phone');
      return;
    }
    if (!smsProof.trim() || smsProof.length < 15) {
      toast.error('Paste MTN/Airtel SMS confirmation');
      return;
    }

    setBuying(selectedPkg.id);

    const product: any = {
      id: generateId(),
      userId: user.id,
      packageId: selectedPkg.id,
      packageName: selectedPkg.name,
      packagePrice: selectedPkg.price,
      dailyIncome: selectedPkg.dailyIncome,
      duration: selectedPkg.duration,
      buyDate: new Date().toISOString(),
      expiryDate: addDays(new Date(), selectedPkg.duration).toISOString(),
      status: 'pending',
      lastIncomeDate: null,
      totalIncomeEarned: 0,
      paymentNetwork: network,
      paymentTargetNumber: PAYMENT_DETAILS[network].number,
      paymentTargetName: PAYMENT_DETAILS[network].name,
      payerPhone,
      payerName,
      paymentAmount: selectedPkg.price,
      paymentProof: smsProof.trim(),
    };

    await createProduct(product);
    await addNotification({
      userId: user.id,
      type: 'package_approved',
      title: 'Payment Submitted',
      message: `Your ${formatUGX(selectedPkg.price)} for ${selectedPkg.name} via ${network} to ${PAYMENT_DETAILS[network].number} is awaiting approval.`,
      isRead: false,
    });

    setShowPayModal(false);
    toast.success('Proof sent to admin! Wait approval.');
    setBuying(null);
    navigate('/my-product');
  };

  if (loading) return <AppLayout><div className="flex items-center justify-center h-64 text-gray-400 text-sm">Loading...</div></AppLayout>;

  return (
    <AppLayout>
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-gray-900 text-xl font-bold">Samsung Packages</h1>
        <p className="text-gray-500 text-sm mt-1">Select network & pay exact amount</p>
      </div>

      <div className="px-4 flex gap-2 overflow-x-auto pb-2">
        {[null, 1, 2, 3].map((g) => (
          <button key={String(g)} onClick={() => setSelectedGroup(g)} className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium ${selectedGroup === g? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
            {g === null? 'All' : `Group ${g}`}
          </button>
        ))}
      </div>

      <div className="px-4 mt-3 space-y-4 pb-20">
        {filtered.map((pkg) => (
          <div key={pkg.id} className="bg-white rounded-2xl overflow-hidden shadow-sm">
            <div className="relative">
              <img src={pkg.image} alt={pkg.name} className="w-full h-44 object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-3 left-4 text-white">
                <div className="text-lg font-bold">{pkg.name}</div>
                <div className="text-xs text-gray-200">{pkg.duration} Days • {formatUGX(pkg.dailyIncome)}/day</div>
              </div>
            </div>
            <div className="p-4">
              <div className="bg-blue-50 rounded-xl p-3 mb-3 text-center">
                <div className="text-blue-700 font-black text-lg">{formatUGX(pkg.price)}</div>
                <div className="text-blue-500 text-xs">Exact Amount To Pay</div>
              </div>
              <button onClick={() => openPayModal(pkg.id)} className="w-full py-3 rounded-xl text-white font-bold text-sm" style={{ background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)' }}>
                Buy Now — {formatUGX(pkg.price)}
              </button>
            </div>
          </div>
        ))}
      </div>

      {showPayModal && selectedPkg && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-5 max-h-[95vh] overflow-y-auto">
            <h3 className="font-bold text-lg">Pay {formatUGX(selectedPkg.price)}</h3>
            <p className="text-sm text-gray-500">{selectedPkg.name}</p>

            <div className="bg-blue-600 text-white rounded-xl p-3 mt-3 text-center">
              <div className="text-xs opacity-80">MUST PAY EXACTLY</div>
              <div className="text-2xl font-black">{formatUGX(selectedPkg.price)}</div>
            </div>

            <label className="text-xs font-bold mt-4 block">1. Select Network *</label>
            <div className="flex gap-2 mt-1">
              <button onClick={()=>setNetwork('MTN')} className={`flex-1 py-3 rounded-xl font-bold border-2 ${network==='MTN'? 'bg-yellow-400 border-yellow-500' : 'bg-gray-100'}`}>MTN</button>
              <button onClick={()=>setNetwork('AIRTEL')} className={`flex-1 py-3 rounded-xl font-bold border-2 ${network==='AIRTEL'? 'bg-red-500 border-red-600 text-white' : 'bg-gray-100'}`}>Airtel</button>
            </div>

            <div className="bg-gray-50 border rounded-xl p-3 mt-3">
              <div className="text-xs text-gray-500">Pay To:</div>
              <div className="font-bold">{PAYMENT_DETAILS[network].number}</div>
              <div className="text-xs font-medium">{PAYMENT_DETAILS[network].name}</div>
              <div className="text-[11px] text-gray-500">Dial {PAYMENT_DETAILS[network].code} → Send Money</div>
            </div>

            <label className="text-xs font-bold mt-4 block">2. Your Phone Number *</label>
            <input type="tel" value={payerPhone} onChange={(e)=>setPayerPhone(e.target.value)} placeholder="0770..." className="w-full mt-1 border-2 rounded-xl px-3 py-3" />

            <label className="text-xs font-bold mt-3 block">3. Your Names *</label>
            <input type="text" value={payerName} onChange={(e)=>setPayerName(e.target.value)} placeholder="Names on your line" className="w-full mt-1 border-2 rounded-xl px-3 py-3" />

            <label className="text-xs font-bold mt-3 block">4. Amount (auto) *</label>
            <input type="number" value={enteredAmount} onChange={(e)=>setEnteredAmount(e.target.value)} className="w-full mt-1 border-2 rounded-xl px-3 py-3 font-bold" />
            {Number(enteredAmount)!== selectedPkg.price && <div className="text-red-500 text-xs mt-1">Must be exactly {formatUGX(selectedPkg.price)}</div>}

            <label className="text-xs font-bold mt-3 block">5. Paste MTN/Airtel SMS Proof *</label>
            <textarea value={smsProof} onChange={(e)=>setSmsProof(e.target.value)} placeholder="You have sent UGX 30,000 to Nabakooza Milly 0756406186..." className="w-full mt-1 border-2 rounded-xl px-3 py-3 h-24 text-sm" />

            <div className="flex gap-2 mt-5">
              <button onClick={()=>setShowPayModal(false)} className="flex-1 py-3 rounded-xl bg-gray-100 font-bold">Cancel</button>
              <button onClick={confirmPayment} className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold">Submit to Admin</button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default Product;
