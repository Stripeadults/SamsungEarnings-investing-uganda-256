import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Eye, EyeOff, Phone, Lock, Smartphone } from 'lucide-react';
import { getUserByPhone, setCurrentUser } from '@/lib/storage';

const Login = () => {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!phone || !password) {
      toast.error('Please fill all fields');
      return;
    }
    setLoading(true);

    const user = await getUserByPhone(phone);
    if (!user) {
      toast.error('Phone number not registered');
      setLoading(false);
      return;
    }
    if (user.password !== password) {
      toast.error('Incorrect password');
      setLoading(false);
      return;
    }
    setCurrentUser(user);
    toast.success('Login successful!');
    navigate('/home');
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLogin();
  };

  return (
    <div className="app-container min-h-screen flex flex-col" style={{ background: 'linear-gradient(160deg, #0a0f2e 0%, #1a2f6e 50%, #0a0f2e 100%)' }}>
      <div className="flex flex-col items-center pt-16 pb-8 px-6">
        <div className="w-20 h-20 rounded-2xl bg-blue-600 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30">
          <Smartphone className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-white text-2xl font-bold tracking-wide">Samsung Earnings</h1>
        <p className="text-blue-300 text-sm mt-1">Uganda's #1 Investment Platform</p>
      </div>

      <div className="flex-1 bg-white rounded-t-3xl px-6 pt-8 pb-6">
        <h2 className="text-gray-800 text-xl font-bold mb-6">Sign In</h2>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">Phone Number</label>
            <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3 bg-gray-50">
              <Phone className="w-5 h-5 text-blue-500 mr-3 shrink-0" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="07XXXXXXXX"
                className="flex-1 bg-transparent text-gray-800 outline-none text-base"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">Password</label>
            <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3 bg-gray-50">
              <Lock className="w-5 h-5 text-blue-500 mr-3 shrink-0" />
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter password"
                className="flex-1 bg-transparent text-gray-800 outline-none text-base"
              />
              <button onClick={() => setShowPass(!showPass)} className="ml-2">
                {showPass ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full mt-6 py-4 rounded-xl text-white font-bold text-base transition-all duration-200 active:scale-95 disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)' }}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>

        <div className="flex items-center justify-center mt-6 gap-1">
          <span className="text-gray-500 text-sm">New to Samsung Earnings?</span>
          <Link to="/register" className="text-blue-600 font-semibold text-sm">Create Account</Link>
        </div>

        <div className="mt-8 flex justify-center">
          <button
            onClick={() => navigate('/admin')}
            className="text-gray-200 text-lg opacity-30 hover:opacity-60 transition-opacity select-none"
            title=""
            aria-label=""
          >
            🌸
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
