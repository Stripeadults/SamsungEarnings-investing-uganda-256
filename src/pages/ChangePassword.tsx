import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getCurrentUser, updateUser, setCurrentUser } from '@/lib/storage';
import { User } from '@/types';

const ChangePassword = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const u = getCurrentUser();
    if (!u) { navigate('/login'); return; }
    setUser(u);
  }, [navigate]);

  const getStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 10) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const strength = getStrength(newPwd);
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'][strength] || '';
  const strengthColor = ['', 'bg-red-500', 'bg-orange-400', 'bg-yellow-400', 'bg-blue-500', 'bg-green-500'][strength] || 'bg-gray-200';

  const handleSubmit = async () => {
    if (!user) return;
    if (!currentPwd || !newPwd || !confirmPwd) { toast.error('Please fill all fields'); return; }
    if (currentPwd !== user.password) { toast.error('Current password is incorrect'); return; }
    if (newPwd.length < 6) { toast.error('New password must be at least 6 characters'); return; }
    if (newPwd === currentPwd) { toast.error('New password must be different from current password'); return; }
    if (newPwd !== confirmPwd) { toast.error('Passwords do not match'); return; }

    setLoading(true);
    const updated = { ...user, password: newPwd };
    await updateUser(updated);
    setCurrentUser(updated);
    setUser(updated);
    setSuccess(true);
    setCurrentPwd('');
    setNewPwd('');
    setConfirmPwd('');
    setLoading(false);
    toast.success('Password changed successfully!');
  };

  return (
    <div className="app-container min-h-screen bg-gray-50">
      <div className="flex items-center px-4 py-4" style={{ background: 'linear-gradient(135deg, #0a0f2e, #1d4ed8)' }}>
        <button onClick={() => navigate(-1)} className="mr-3 w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-white font-bold text-lg">Change Password</h1>
      </div>

      <div className="px-4 py-5 space-y-4">
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-500 shrink-0" />
            <div>
              <div className="text-green-700 font-semibold text-sm">Password Updated</div>
              <div className="text-green-600 text-xs mt-0.5">Your password has been changed successfully.</div>
            </div>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
          <p className="text-blue-700 text-sm font-medium">Security Tips</p>
          <ul className="text-blue-600 text-xs mt-1 space-y-0.5">
            <li>• Use at least 6 characters</li>
            <li>• Mix letters, numbers, and symbols</li>
            <li>• Never share your password</li>
          </ul>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-600 mb-1.5 block">Current Password</label>
          <div className={`flex items-center border-2 rounded-xl px-4 py-3 bg-white transition-colors ${currentPwd && user && currentPwd !== user.password ? 'border-red-300' : 'border-gray-200 focus-within:border-blue-400'}`}>
            <Lock className="w-5 h-5 text-blue-500 mr-3 shrink-0" />
            <input type={showCurrent ? 'text' : 'password'} value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} placeholder="Enter current password" className="flex-1 bg-transparent text-gray-800 outline-none text-base" />
            <button onClick={() => setShowCurrent(!showCurrent)} className="ml-2">{showCurrent ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}</button>
          </div>
          {currentPwd && user && currentPwd !== user.password && <p className="text-red-500 text-xs mt-1 ml-1">Incorrect password</p>}
        </div>

        <div>
          <label className="text-sm font-medium text-gray-600 mb-1.5 block">New Password</label>
          <div className="flex items-center border-2 border-gray-200 focus-within:border-blue-400 rounded-xl px-4 py-3 bg-white transition-colors">
            <Lock className="w-5 h-5 text-blue-500 mr-3 shrink-0" />
            <input type={showNew ? 'text' : 'password'} value={newPwd} onChange={(e) => setNewPwd(e.target.value)} placeholder="Enter new password" className="flex-1 bg-transparent text-gray-800 outline-none text-base" />
            <button onClick={() => setShowNew(!showNew)} className="ml-2">{showNew ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}</button>
          </div>
          {newPwd.length > 0 && (
            <div className="mt-2 px-1">
              <div className="flex gap-1 mb-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className={`flex-1 h-1.5 rounded-full transition-all ${i <= strength ? strengthColor : 'bg-gray-200'}`} />
                ))}
              </div>
              <span className={`text-xs font-medium ${strength <= 1 ? 'text-red-500' : strength === 2 ? 'text-orange-500' : strength === 3 ? 'text-yellow-600' : strength === 4 ? 'text-blue-600' : 'text-green-600'}`}>{strengthLabel}</span>
            </div>
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-gray-600 mb-1.5 block">Confirm New Password</label>
          <div className={`flex items-center border-2 rounded-xl px-4 py-3 bg-white transition-colors ${confirmPwd && confirmPwd !== newPwd ? 'border-red-300' : confirmPwd && confirmPwd === newPwd ? 'border-green-400' : 'border-gray-200 focus-within:border-blue-400'}`}>
            <Lock className="w-5 h-5 text-blue-500 mr-3 shrink-0" />
            <input type={showConfirm ? 'text' : 'password'} value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} placeholder="Repeat new password" className="flex-1 bg-transparent text-gray-800 outline-none text-base" />
            <button onClick={() => setShowConfirm(!showConfirm)} className="ml-2">{showConfirm ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}</button>
          </div>
          {confirmPwd && confirmPwd !== newPwd && <p className="text-red-500 text-xs mt-1 ml-1">Passwords do not match</p>}
          {confirmPwd && confirmPwd === newPwd && <p className="text-green-600 text-xs mt-1 ml-1 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Passwords match</p>}
        </div>

        <button onClick={handleSubmit} disabled={loading} className="w-full py-4 rounded-xl text-white font-bold text-base transition-all active:scale-95 disabled:opacity-60 mt-2" style={{ background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)' }}>
          {loading ? 'Updating...' : 'Change Password'}
        </button>
        <button onClick={() => navigate('/mine')} className="w-full py-3 rounded-xl border border-gray-200 text-gray-500 text-sm font-medium">Cancel</button>
      </div>
    </div>
  );
};

export default ChangePassword;
