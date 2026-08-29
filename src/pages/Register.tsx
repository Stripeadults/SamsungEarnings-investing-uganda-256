import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Eye, EyeOff, Phone, Lock, User, Smartphone } from 'lucide-react';
import {
  getUserByPhone, createUser, setCurrentUser,
  getUserByReferralCode, addNotification
} from '@/lib/storage';
import { generateId, generateReferralCode } from '@/lib/utils';
import { REGISTRATION_BONUS } from '@/constants/packages';
import { User as UserType } from '@/types';

const Register = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const autoRef = params.get('ref') || '';
  const [refCode, setRefCode] = useState(autoRef.toUpperCase());
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !phone || !password || !confirm) {
      toast.error('Please fill all fields');
      return;
    }
    if (password !== confirm) {
      toast.error('Passwords do not match');
      return;
    }
    if (phone.length < 10) {
      toast.error('Enter a valid phone number');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    const existing = await getUserByPhone(phone);
    if (existing) {
      toast.error('Phone number already registered');
      setLoading(false);
      return;
    }

    // Referral code is optional — look up referrer but never block registration
    let referrer: UserType | null = null;
    if (refCode.trim()) {
      referrer = await getUserByReferralCode(refCode.trim());
      if (!referrer) {
        toast.info('Referral code not found — registering without referral.');
      }
    }

    const newUser: UserType = {
      id: generateId(),
      phone,
      password,
      name,
      referralCode: generateReferralCode(),
      referredBy: referrer?.id || null,
      balance: REGISTRATION_BONUS,
      totalEarnings: REGISTRATION_BONUS,
      totalWithdrawal: 0,
      referralEarnings: 0,
      dailyEarnings: 0,
      registrationBonus: REGISTRATION_BONUS,
      lastCheckIn: null,
      createdAt: new Date().toISOString(),
    };

    await createUser(newUser);
    setCurrentUser(newUser);

    await addNotification({
      userId: newUser.id,
      type: 'referral_bonus',
      title: 'Welcome Bonus!',
      message: 'Welcome to Samsung Earnings! You have received UGX 7,000 registration bonus.',
      isRead: false,
    });

    toast.success('Account created! You earned UGX 7,000 bonus!');
    navigate('/home');
    setLoading(false);
  };

  return (
    <div className="app-container min-h-screen flex flex-col relative" style={{ background: 'linear-gradient(160deg, #0a0f2e 0%, #1a2f6e 50%, #0a0f2e 100%)' }}>
      {/* Flower Admin Access — top-left */}
      <button
        onClick={() => navigate('/admin')}
        className="absolute top-4 left-4 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur border border-white/20 hover:bg-white/20 transition-colors"
        title="Admin Access"
      >
        <svg viewBox="0 0 36 36" className="w-6 h-6" fill="none">
          <ellipse cx="18" cy="9" rx="5" ry="8" fill="#fbbf24" opacity="0.9"/>
          <ellipse cx="27" cy="14" rx="5" ry="8" fill="#f59e0b" opacity="0.85" transform="rotate(60 27 14)"/>
          <ellipse cx="27" cy="26" rx="5" ry="8" fill="#fcd34d" opacity="0.85" transform="rotate(120 27 26)"/>
          <ellipse cx="18" cy="29" rx="5" ry="8" fill="#fbbf24" opacity="0.9" transform="rotate(180 18 29)"/>
          <ellipse cx="9" cy="26" rx="5" ry="8" fill="#f59e0b" opacity="0.85" transform="rotate(240 9 26)"/>
          <ellipse cx="9" cy="14" rx="5" ry="8" fill="#fcd34d" opacity="0.85" transform="rotate(300 9 14)"/>
          <circle cx="18" cy="18" r="6" fill="#fff" opacity="0.95"/>
          <circle cx="18" cy="18" r="3.5" fill="#d97706"/>
        </svg>
      </button>

      <div className="flex flex-col items-center pt-12 pb-6 px-6">
        <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center mb-3 shadow-lg shadow-blue-500/30">
          <Smartphone className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-white text-xl font-bold">Samsung Earnings</h1>
        <p className="text-blue-300 text-xs mt-1">Get UGX 7,000 Registration Bonus!</p>
      </div>

      <div className="flex-1 bg-white rounded-t-3xl px-6 pt-6 pb-6 overflow-y-auto">
        <h2 className="text-gray-800 text-xl font-bold mb-5">Create Account</h2>

        {autoRef && (
          <div className="mb-4 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-400 flex items-center justify-center shrink-0">
              <span className="text-white font-black text-base">#</span>
            </div>
            <div>
              <div className="text-amber-800 font-bold text-xs">Referral Code Applied!</div>
              <div className="text-amber-600 text-xs mt-0.5">You were invited with code <span className="font-black tracking-widest">{autoRef.toUpperCase()}</span></div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">Full Name</label>
            <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3 bg-gray-50">
              <User className="w-5 h-5 text-blue-500 mr-3 shrink-0" />
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" className="flex-1 bg-transparent text-gray-800 outline-none text-base" />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">Phone Number</label>
            <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3 bg-gray-50">
              <Phone className="w-5 h-5 text-blue-500 mr-3 shrink-0" />
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07XXXXXXXX" className="flex-1 bg-transparent text-gray-800 outline-none text-base" />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">Password</label>
            <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3 bg-gray-50">
              <Lock className="w-5 h-5 text-blue-500 mr-3 shrink-0" />
              <input type={showPass ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" className="flex-1 bg-transparent text-gray-800 outline-none text-base" />
              <button onClick={() => setShowPass(!showPass)}>
                {showPass ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">Confirm Password</label>
            <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3 bg-gray-50">
              <Lock className="w-5 h-5 text-blue-500 mr-3 shrink-0" />
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat password" className="flex-1 bg-transparent text-gray-800 outline-none text-base" />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">Referral Code <span className="text-gray-400 font-normal">(Optional)</span></label>
            <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3 bg-gray-50">
              <span className="text-amber-500 mr-3 text-lg font-bold">#</span>
              <input type="text" value={refCode} onChange={(e) => setRefCode(e.target.value.toUpperCase())} placeholder="Enter referral code e.g. SAM1234" className="flex-1 bg-transparent text-gray-800 outline-none text-base uppercase tracking-wider" />
            </div>
            <p className="text-xs text-gray-400 mt-1 ml-1">Optional — enter a referral code if you were invited by someone.</p>
          </div>
        </div>

        <button
          onClick={handleRegister}
          disabled={loading}
          className="w-full mt-5 py-4 rounded-xl text-white font-bold text-base transition-all duration-200 active:scale-95 disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)' }}
        >
          {loading ? 'Creating...' : 'Create Account & Earn UGX 7,000'}
        </button>

        <div className="flex items-center justify-center mt-4 gap-1">
          <span className="text-gray-500 text-sm">Already have an account?</span>
          <Link to="/login" className="text-blue-600 font-semibold text-sm">Sign In</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
