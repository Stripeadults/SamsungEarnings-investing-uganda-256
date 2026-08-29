import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { getCurrentUser, getUserWallets, saveWallet, deleteWalletsByUser } from '@/lib/storage';
import { generateId } from '@/lib/utils';
import { Wallet as WalletType } from '@/types';
import { supabase } from '@/lib/supabase';

const WalletPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [wallets, setWallets] = useState<WalletType[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [walletType, setWalletType] = useState<'mtn' | 'airtel'>('mtn');
  const [walletPhone, setWalletPhone] = useState('');
  const [walletName, setWalletName] = useState('');

  useEffect(() => {
    const u = getCurrentUser();
    if (!u) { navigate('/login'); return; }
    setUser(u);
    getUserWallets(u.id).then(setWallets);
  }, [navigate]);

  const handleAdd = async () => {
    if (!walletPhone || !walletName) { toast.error('Please fill all fields'); return; }
    if (walletPhone.length < 10) { toast.error('Enter a valid phone number'); return; }

    const newWallet: WalletType = {
      id: generateId(),
      userId: user.id,
      type: walletType,
      phone: walletPhone,
      name: walletName,
      createdAt: new Date().toISOString(),
    };

    await saveWallet(newWallet);
    setWallets((prev) => [...prev, newWallet]);
    setWalletPhone('');
    setWalletName('');
    setShowAdd(false);
    toast.success('Wallet added successfully!');
  };

  const handleDelete = async (id: string) => {
    await supabase.from('samsung_wallets').delete().eq('id', id);
    setWallets((prev) => prev.filter((w) => w.id !== id));
    toast.success('Wallet removed');
  };

  return (
    <div className="app-container min-h-screen bg-gray-50">
      <div className="flex items-center justify-between px-4 py-4 bg-white border-b border-gray-100">
        <div className="flex items-center">
          <button onClick={() => navigate(-1)} className="mr-3"><ArrowLeft className="w-6 h-6 text-gray-700" /></button>
          <h1 className="text-gray-800 font-bold text-lg">My Wallets</h1>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="px-4 py-5">
        {wallets.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">💳</div>
            <div className="text-gray-500 font-medium">No wallets yet</div>
            <div className="text-gray-400 text-sm mt-1">Add MTN or Airtel wallet to withdraw</div>
            <button onClick={() => setShowAdd(true)} className="mt-4 bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold">Add Wallet</button>
          </div>
        ) : (
          <div className="space-y-3">
            {wallets.map((w) => (
              <div key={w.id} className="bg-white rounded-2xl p-4 flex items-center shadow-sm">
                <span className="text-3xl mr-3">{w.type === 'mtn' ? '📲' : '📱'}</span>
                <div className="flex-1">
                  <div className="text-gray-800 font-semibold text-sm">{w.name}</div>
                  <div className="text-gray-500 text-xs">{w.phone}</div>
                  <div className="text-gray-400 text-xs">{w.type === 'mtn' ? 'MTN Mobile Money' : 'Airtel Money'}</div>
                </div>
                <button onClick={() => handleDelete(w.id)} className="text-red-400 p-2"><Trash2 className="w-5 h-5" /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="w-full max-w-[430px] mx-auto bg-white rounded-t-3xl px-5 py-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-gray-800 font-bold text-base">Add Wallet</h3>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 text-lg">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600 mb-2 block">Network Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['mtn', 'airtel'] as const).map((n) => (
                    <button key={n} onClick={() => setWalletType(n)} className={`py-3 rounded-xl border-2 font-semibold text-sm ${walletType === n ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600'}`}>
                      {n === 'mtn' ? '📲 MTN MoMo' : '📱 Airtel Money'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">Account Holder Name</label>
                <input type="text" value={walletName} onChange={(e) => setWalletName(e.target.value)} placeholder="Full name on the account" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 outline-none text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">Phone Number</label>
                <input type="tel" value={walletPhone} onChange={(e) => setWalletPhone(e.target.value)} placeholder="07XXXXXXXX" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 outline-none text-sm" />
              </div>
              <button onClick={handleAdd} className="w-full py-4 rounded-xl text-white font-bold text-sm" style={{ background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)' }}>Add Wallet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletPage;
