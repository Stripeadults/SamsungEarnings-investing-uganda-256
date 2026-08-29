import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  User, Wallet, LogOut, ChevronRight, Gift, Bell,
  BookOpen, HelpCircle, Shield, Calendar, FileText, Lock
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import {
  getCurrentUser, setCurrentUser, refreshCurrentUser, getUserNotifications,
  markNotificationRead, updateUser, getRedeemCodes, updateRedeemCode
} from '@/lib/storage';
import { formatUGX, isToday, formatDateTime } from '@/lib/utils';
import { DAILY_CHECKIN_REWARD, TELEGRAM_OFFICIAL } from '@/constants/packages';
import { User as UserType, Notification } from '@/types';

const Mine = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserType | null>(null);
  const [tab, setTab] = useState<'main' | 'notifications'>('main');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [redeemInput, setRedeemInput] = useState('');
  const [showRedeem, setShowRedeem] = useState(false);


  useEffect(() => {
    const init = async () => {
      const cached = getCurrentUser();
      if (!cached) { navigate('/login'); return; }
      // Sync with cloud to get latest balance / status
      const fresh = await refreshCurrentUser();
      const u = fresh || cached;
      setUser(u);
      getUserNotifications(u.id).then((notifs) => setNotifications([...notifs].reverse()));
    };
    init();
  }, [navigate]);

  const handleCheckIn = async () => {
    if (!user) return;
    if (user.lastCheckIn && isToday(user.lastCheckIn)) {
      toast.info('Already checked in today. Come back tomorrow!');
      return;
    }
    const updated = {
      ...user,
      balance: user.balance + DAILY_CHECKIN_REWARD,
      totalEarnings: user.totalEarnings + DAILY_CHECKIN_REWARD,
      lastCheckIn: new Date().toISOString(),
    };
    await updateUser(updated);
    setCurrentUser(updated);
    setUser(updated);
    toast.success(`Check-in successful! +UGX ${DAILY_CHECKIN_REWARD}`);
  };

  const handleRedeem = async () => {
    if (!user || !redeemInput.trim()) return;
    const codes = await getRedeemCodes();
    const code = codes.find((c) => c.code === redeemInput.trim().toUpperCase() && c.isActive);

    if (!code) { toast.error('Invalid or expired redeem code'); return; }
    if (new Date(code.expiresAt) < new Date()) { toast.error('This code has expired (valid for 15 minutes only)'); return; }
    if (code.usedBy.includes(user.id)) { toast.error('You have already used this code'); return; }

    const updated = { ...user, balance: user.balance + code.amount, totalEarnings: user.totalEarnings + code.amount };
    await updateUser(updated);
    setCurrentUser(updated);
    setUser(updated);
    await updateRedeemCode({ ...code, usedBy: [...code.usedBy, user.id] });
    setRedeemInput('');
    setShowRedeem(false);
    toast.success(`Redeemed ${formatUGX(code.amount)}!`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('notify_shown');
    navigate('/login');
    toast.success('Logged out successfully');
  };

  if (!user) return null;

  const checkedInToday = user.lastCheckIn && isToday(user.lastCheckIn);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <AppLayout>
      <div className="relative px-5 pt-8 pb-6" style={{ background: 'linear-gradient(135deg, #0a0f2e, #1d4ed8)' }}>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-blue-400 flex items-center justify-center text-2xl font-bold text-white">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-white font-bold text-base">{user.name}</div>
            <div className="text-blue-200 text-sm">{user.phone}</div>
            <div className="inline-block bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full mt-1">Lv1 Member</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-white/10 rounded-xl p-3">
            <div className="text-white/70 text-xs">Account Balance</div>
            <div className="text-white font-bold text-base mt-0.5">{formatUGX(user.balance)}</div>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <div className="text-white/70 text-xs">Cumulative Income</div>
            <div className="text-white font-bold text-base mt-0.5">{formatUGX(user.totalEarnings)}</div>
          </div>
        </div>

        {user.frozen && (
          <div className="mt-4 bg-red-500/20 border border-red-400/60 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🔒</span>
              <div className="text-red-200 font-bold text-sm">Account Frozen</div>
              <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">RESTRICTED</span>
            </div>
            <p className="text-red-200 text-xs leading-relaxed mb-3">Your account has been frozen by the administrator. Withdrawals and package purchases are currently disabled.</p>
            <a href="https://t.me/+adk1usHyKF4yYzQ0" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-red-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl w-full justify-center">📞 Contact Support to Unfreeze</a>
          </div>
        )}

        <button onClick={() => { navigator.clipboard.writeText(user.referralCode); toast.success('Referral code copied!'); }} className="mt-3 w-full flex items-center justify-between bg-amber-500/20 border border-amber-400/50 rounded-2xl px-4 py-3">
          <div>
            <div className="text-amber-200 text-xs">Your Referral Code</div>
            <div className="text-amber-300 font-black text-xl tracking-widest mt-0.5">{user.referralCode}</div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="bg-amber-400 rounded-xl px-3 py-1.5"><span className="text-white text-xs font-bold">COPY CODE</span></div>
            <span className="text-amber-200 text-[10px]">Tap to copy</span>
          </div>
        </button>
      </div>

      <div className="mx-4 -mt-3 bg-white rounded-2xl shadow-sm p-4 z-10 relative grid grid-cols-3 gap-2">
        <button onClick={() => navigate('/recharge')} className="flex flex-col items-center py-2 rounded-xl bg-blue-50"><span className="text-xl">💰</span><span className="text-xs text-gray-600 font-medium mt-1">Recharge</span></button>
        <button onClick={() => navigate('/withdraw')} className="flex flex-col items-center py-2 rounded-xl bg-green-50"><span className="text-xl">💸</span><span className="text-xs text-gray-600 font-medium mt-1">Withdraw</span></button>
        <button onClick={() => navigate('/records')} className="flex flex-col items-center py-2 rounded-xl bg-amber-50"><span className="text-xl">📋</span><span className="text-xs text-gray-600 font-medium mt-1">Records</span></button>
      </div>

      <div className="mx-4 mt-3">
        <button onClick={handleCheckIn} className={`w-full py-4 rounded-2xl font-bold text-sm transition-all active:scale-95 flex items-center justify-between px-5 ${checkedInToday ? 'bg-gray-100 text-gray-400' : 'text-white'}`} style={!checkedInToday ? { background: 'linear-gradient(135deg, #d97706, #f59e0b)' } : {}}>
          <div className="flex items-center gap-2"><Calendar className={`w-5 h-5 ${checkedInToday ? 'text-gray-400' : 'text-white'}`} /><span>Daily Check-In</span></div>
          <span>{checkedInToday ? 'Completed ✓' : `+UGX ${DAILY_CHECKIN_REWARD}`}</span>
        </button>
      </div>

      <div className="mx-4 mt-3">
        <button onClick={() => setShowRedeem(!showRedeem)} className="w-full py-4 rounded-2xl bg-purple-600 text-white font-bold text-sm flex items-center justify-between px-5">
          <div className="flex items-center gap-2"><Gift className="w-5 h-5" /><span>Redeem Gift Code</span></div>
          <span className="text-purple-200 text-xs">Telegram Only • 15min</span>
        </button>
        {showRedeem && (
          <div className="mt-2 bg-white rounded-2xl p-4 shadow-sm">
            <input type="text" value={redeemInput} onChange={(e) => setRedeemInput(e.target.value.toUpperCase())} placeholder="Enter code (e.g. GIFT123)" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 outline-none text-sm uppercase" />
            <button onClick={handleRedeem} className="w-full mt-2 py-3 bg-purple-600 text-white rounded-xl text-sm font-semibold">Redeem</button>
          </div>
        )}
      </div>

      <div className="mx-4 mt-3 bg-white rounded-2xl overflow-hidden shadow-sm">
        {[
          { icon: <Wallet className="w-5 h-5 text-blue-500" />, label: 'My Wallets', path: '/wallet' },
          { icon: <FileText className="w-5 h-5 text-green-500" />, label: 'My Products', path: '/my-product' },
          { icon: <BookOpen className="w-5 h-5 text-amber-500" />, label: 'Transaction Records', path: '/records' },
          { icon: <Bell className="w-5 h-5 text-purple-500" />, label: 'Notifications', badge: unreadCount > 0 ? unreadCount : undefined, action: () => setTab(tab === 'notifications' ? 'main' : 'notifications') },
          { icon: <Lock className="w-5 h-5 text-indigo-500" />, label: 'Change Password', path: '/change-password' },
          { icon: <HelpCircle className="w-5 h-5 text-teal-500" />, label: 'Customer Support', external: TELEGRAM_OFFICIAL },
          { icon: <Shield className="w-5 h-5 text-gray-500" />, label: 'Regulation', path: '/regulation' },
          { icon: <BookOpen className="w-5 h-5 text-blue-500" />, label: 'About Us', path: '/about-us' },
        ].map(({ icon, label, path, external, action, badge }: any) => (
          <button key={label} onClick={() => { if (action) action(); else if (external) window.open(external, '_blank'); else if (path) navigate(path); }} className="w-full flex items-center px-4 py-3.5 border-b border-gray-50 hover:bg-gray-50">
            {icon}
            <span className="flex-1 ml-3 text-gray-700 text-sm font-medium text-left">{label}</span>
            {badge && <span className="bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center mr-2 font-bold">{badge}</span>}
            <ChevronRight className="w-4 h-4 text-gray-300" />
          </button>
        ))}
      </div>

      {tab === 'notifications' && (
        <div className="mx-4 mt-3 bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <span className="font-semibold text-gray-800">Notifications</span>
            <button onClick={() => setTab('main')} className="text-blue-600 text-xs">Close</button>
          </div>
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-gray-400 text-sm">No notifications yet</div>
          ) : (
            notifications.map((n) => (
              <button key={n.id} onClick={async () => { await markNotificationRead(n.id); setNotifications((prev) => prev.map((p) => p.id === n.id ? { ...p, isRead: true } : p)); }} className={`w-full px-4 py-3 border-b border-gray-50 text-left ${!n.isRead ? 'bg-blue-50' : ''}`}>
                <div className="text-gray-800 text-sm font-medium">{n.title}</div>
                <div className="text-gray-500 text-xs mt-0.5">{n.message}</div>
                <div className="text-gray-300 text-xs mt-1">{formatDateTime(n.createdAt)}</div>
              </button>
            ))
          )}
        </div>
      )}

      <div className="mx-4 mt-3 mb-2">
        <button onClick={handleLogout} className="w-full py-4 rounded-2xl border border-red-200 text-red-500 font-semibold text-sm flex items-center justify-center gap-2">
          <LogOut className="w-5 h-5" /> Log Out
        </button>
      </div>

      <div className="pb-6 flex flex-col items-center gap-1">
        <span className="text-gray-300 text-xs select-none">Samsung Earnings v1.0</span>
      </div>
    </AppLayout>
  );
};

export default Mine;
