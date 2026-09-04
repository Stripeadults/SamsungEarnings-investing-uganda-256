import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Bell, RefreshCw, X, CheckCheck, Package, DollarSign, CreditCard, Gift, ChevronRight, Copy, Users } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import NotifyModal from '@/components/features/NotifyModal';
import {
  getCurrentUser, refreshCurrentUser, getUserProducts, getUserNotifications,
  markNotificationRead, updateUser, processDailyIncome, getUserRecharges, getUserById
} from '@/lib/storage';
import { formatUGX, formatDateTime, getReferralLink } from '@/lib/utils';
import { PACKAGES } from '@/constants/packages';
import { User, Notification, UserProduct } from '@/types';
import heroBanner from '@/assets/hero-banner.jpg';

const Home = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [showNotify, setShowNotify] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showBell, setShowBell] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [products, setProducts] = useState<UserProduct[]>([]);
  const [pendingRecharges, setPendingRecharges] = useState(0);
  const drawerRef = useRef<HTMLDivElement>(null);
  const [recentActivity] = useState([
    '0782****407 Recharge 15,000',
    '0746****840 Recharge 50,000',
    '0701****123 Recharge 150,000',
    '0782****999 Recharge 300,000',
    '0746****555 Recharge 100,000',
  ]);

  const loadData = async (userId: string) => {
    const [notifs, prods, recharges] = await Promise.all([
      getUserNotifications(userId),
      getUserProducts(userId),
      getUserRecharges(userId),
    ]);
    setUnreadCount(notifs.filter((n) => !n.isRead).length);
    setNotifications([...notifs].reverse());
    setProducts(prods);
    setPendingRecharges(recharges.filter((r) => r.status === 'pending').length);
  };

  useEffect(() => {
    const init = async () => {
      const cached = getCurrentUser();
      if (!cached) { navigate('/login'); return; }
      // Sync session with latest cloud data (picks up approved recharges from admin)
      const fresh = await refreshCurrentUser();
      if (!fresh) { navigate('/login'); return; }
      setUser(fresh);
      loadData(fresh.id);
      // Run daily income in background and refresh again
      processDailyIncome().then(() => {
        getUserById(fresh.id).then((latest) => { if (latest) setUser(latest); });
      });
    };
    init();

    const shown = sessionStorage.getItem('notify_shown');
    if (!shown) {
      setShowNotify(true);
      sessionStorage.setItem('notify_shown', '1');
    }
  }, [navigate]);

  const openBell = async () => {
    const u = getCurrentUser();
    if (!u) return;
    const notifs = await getUserNotifications(u.id);
    setNotifications([...notifs].reverse());
    setUnreadCount(notifs.filter((n) => !n.isRead).length);
    setShowBell(true);
  };

  const handleMarkRead = async (id: string) => {
    await markNotificationRead(id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const handleMarkAllRead = async () => {
    const u = getCurrentUser();
    if (!u) return;
    const notifs = await getUserNotifications(u.id);
    await Promise.all(notifs.filter(n => !n.isRead).map(n => markNotificationRead(n.id)));
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const refreshBalance = async () => {
    const u = getCurrentUser();
    if (!u) return;
    await processDailyIncome();
    const fresh = await getUserById(u.id);
    if (fresh) setUser(fresh);
    await loadData(u.id);
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'package_approved': return <Package className="w-4 h-4 text-green-500" />;
      case 'package_rejected': return <Package className="w-4 h-4 text-red-400" />;
      case 'daily_income': return <DollarSign className="w-4 h-4 text-amber-500" />;
      case 'withdrawal_approved': return <CreditCard className="w-4 h-4 text-blue-500" />;
      case 'withdrawal_rejected': return <CreditCard className="w-4 h-4 text-red-400" />;
      case 'referral_bonus': return <Gift className="w-4 h-4 text-purple-500" />;
      default: return <Bell className="w-4 h-4 text-gray-400" />;
    }
  };

  const getNotifColor = (type: string) => {
    switch (type) {
      case 'package_approved': return 'bg-green-50';
      case 'package_rejected': return 'bg-red-50';
      case 'daily_income': return 'bg-amber-50';
      case 'withdrawal_approved': return 'bg-blue-50';
      case 'withdrawal_rejected': return 'bg-red-50';
      case 'referral_bonus': return 'bg-purple-50';
      default: return 'bg-gray-50';
    }
  };

  const activeProducts = products.filter((p) => p.status === 'active');

  return (
    <AppLayout>
      {showNotify && <NotifyModal onClose={() => setShowNotify(false)} />}

      {/* Header */}
      <div className="relative">
        <img src={heroBanner} alt="Samsung Earnings" className="w-full h-48 object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <div>
            <div className="text-white/80 text-xs">Samsung Earnings</div>
            <div className="text-white font-bold text-base">{user?.name || 'Loading...'}</div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={refreshBalance} className="w-9 h-9 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
              <RefreshCw className="w-4 h-4 text-white" />
            </button>
            <button onClick={openBell} className="relative w-9 h-9 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
              <Bell className="w-4 h-4 text-white" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] flex items-center justify-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>
        <div className="absolute bottom-3 left-4 text-white text-sm font-semibold">
          🚀 Galaxy Z Fold6 VIP — Earn UGX 700,000/day
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mx-4 -mt-4 bg-white rounded-2xl shadow-sm p-4 z-10 relative">
        <div className="grid grid-cols-3 gap-2">
          {[
          
             { icon: '💸', label: 'Withdraw', path: '/withdraw' },
            { icon: '🎯', label: 'Missions', path: '/mission' },
            { icon: '📅', label: 'Check-in', path: '/mine' },
          ].map(({ icon, label, path }) => (
            <button key={label} onClick={() => navigate(path)} className="flex flex-col items-center py-3 rounded-xl bg-gray-50 hover:bg-blue-50 transition-colors">
              <span className="text-2xl">{icon}</span>
              <span className="text-xs text-gray-600 mt-1 font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Referral Banner Widget */}
      {user && (
        <div className="mx-4 mt-3 rounded-2xl overflow-hidden shadow-sm" style={{ background: 'linear-gradient(135deg, #0a0f2e 0%, #1d4ed8 60%, #7c3aed 100%)' }}>
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <div className="text-white/70 text-[10px] uppercase tracking-widest">Your Referral Code</div>
                <div className="text-amber-300 font-black text-lg tracking-widest leading-tight">{user.referralCode}</div>
                <div className="text-blue-200 text-[10px] mt-0.5">Earn 30% on every invite</div>
              </div>
            </div>
            <div className="flex flex-col gap-2 items-end">
              <button
                onClick={() => { navigator.clipboard.writeText(getReferralLink(user.referralCode)); toast.success('Referral link copied!'); }}
                className="flex items-center gap-1.5 bg-amber-400 text-white text-xs font-bold px-3 py-1.5 rounded-xl active:scale-95 transition-transform"
              >
                <Copy className="w-3.5 h-3.5" /> Copy Link
              </button>
              <button onClick={() => navigate('/team')} className="flex items-center gap-1 bg-white/15 text-white text-xs font-semibold px-3 py-1.5 rounded-xl active:scale-95 transition-transform">
                View Team <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Balance Cards */}
      <div className="mx-4 mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-2xl p-4 text-white" style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)' }}>
          <div className="text-xs text-blue-200 mb-1">Account Balance</div>
          <div className="text-xl font-bold">{user ? formatUGX(user.balance) : '...'}</div>
        </div>
        <div className="rounded-2xl p-4 text-white" style={{ background: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)' }}>
          <div className="text-xs text-amber-200 mb-1">Cumulative Income</div>
          <div className="text-xl font-bold">{user ? formatUGX(user.totalEarnings) : '...'}</div>
        </div>
        <div className="rounded-2xl p-4 text-white" style={{ background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)' }}>
          <div className="text-xs text-teal-200 mb-1">Total Withdrawn</div>
          <div className="text-xl font-bold">{user ? formatUGX(user.totalWithdrawal) : '...'}</div>
        </div>
        <div className="rounded-2xl p-4 text-white" style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)' }}>
          <div className="text-xs text-purple-200 mb-1">Referral Earnings</div>
          <div className="text-xl font-bold">{user ? formatUGX(user.referralEarnings) : '...'}</div>
        </div>
      </div>

      {/* Frozen Account Banner */}
      {user?.frozen && (
        <div className="mx-4 mt-3 bg-red-50 border-2 border-red-400 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0"><span className="text-xl">🔒</span></div>
            <div className="flex-1">
              <div className="text-red-700 font-bold text-sm">Account Frozen</div>
              <p className="text-red-600 text-xs mt-1 leading-relaxed">Your account has been frozen by the administrator. Withdrawals and package purchases are currently disabled.</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-1 rounded-full">❌ Withdrawals Blocked</span>
                <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-1 rounded-full">❌ Purchases Blocked</span>
              </div>
              <a href="https://t.me/+adk1usHyKF4yYzQ0" target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-xl">📞 Contact Support</a>
            </div>
          </div>
        </div>
      )}

      {/* Pending Recharge Banner */}
      {pendingRecharges > 0 && (
        <div className="mx-4 mt-3 bg-amber-50 border border-amber-300 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">⏳</span>
              <div>
                <div className="text-amber-700 font-semibold text-sm">Recharge Pending</div>
                <div className="text-amber-600 text-xs mt-0.5">{pendingRecharges} recharge{pendingRecharges > 1 ? 's' : ''} awaiting admin approval</div>
              </div>
            </div>
            <button onClick={() => navigate('/records')} className="bg-amber-500 text-white text-xs px-3 py-1.5 rounded-full font-semibold shrink-0">Track</button>
          </div>
        </div>
      )}

      {/* Active Investment Banner */}
      {activeProducts.length > 0 && (
        <div className="mx-4 mt-3 bg-green-50 border border-green-200 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-green-700 font-semibold text-sm">Active Investments</div>
              <div className="text-green-600 text-xs mt-0.5">{activeProducts.length} package(s) earning daily</div>
            </div>
            <button onClick={() => navigate('/my-product')} className="bg-green-600 text-white text-xs px-3 py-1.5 rounded-full font-medium">View</button>
          </div>
        </div>
      )}

      {/* Scrolling Activity */}
      <div className="mx-4 mt-3 bg-blue-50 rounded-xl py-2 px-4 overflow-hidden">
        <div className="marquee-text text-blue-700 text-xs font-medium">
          🔔 {recentActivity.join('   •   ')}   •   UGX 7,000 Registration Bonus waiting for you!
        </div>
      </div>

      {/* Featured Products */}
      <div className="mx-4 mt-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-gray-800 font-bold text-base">Samsung Packages</h3>
          <button onClick={() => navigate('/product')} className="text-blue-600 text-sm font-medium">View All</button>
        </div>
        <div className="space-y-3">
          {PACKAGES.slice(0, 4).map((pkg) => (
            <div key={pkg.id} className="bg-white rounded-2xl overflow-hidden flex items-center shadow-sm">
              <img src={pkg.image} alt={pkg.name} className="w-24 h-20 object-cover" />
              <div className="flex-1 px-3 py-2">
                <div className="text-gray-800 font-semibold text-sm">{pkg.name}</div>
                <div className="text-blue-600 font-bold text-sm">{formatUGX(pkg.dailyIncome)}/day</div>
                <div className="text-gray-400 text-xs">{pkg.duration} days • {formatUGX(pkg.price)}</div>
              </div>
              <button onClick={() => navigate('/product')} className="mr-3 bg-blue-600 text-white text-xs px-3 py-1.5 rounded-full font-medium">Buy</button>
            </div>
          ))}
        </div>
      </div>

      {/* Notification Drawer */}
      {showBell && (
        <div className="fixed inset-0 z-50" style={{ background: 'rgba(0,0,0,0.45)' }} onClick={() => setShowBell(false)}>
          <div
            ref={drawerRef}
            className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white rounded-b-3xl shadow-2xl"
            style={{ maxHeight: '82vh', display: 'flex', flexDirection: 'column' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 pt-5 pb-4 flex items-center justify-between border-b border-gray-100" style={{ background: 'linear-gradient(135deg, #0a0f2e, #1d4ed8)' }}>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Bell className="w-5 h-5 text-white" />
                  {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] flex items-center justify-center font-bold">{unreadCount}</span>}
                </div>
                <span className="text-white font-bold text-base">Notifications</span>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button onClick={handleMarkAllRead} className="flex items-center gap-1 bg-white/20 text-white/90 text-xs px-3 py-1.5 rounded-full">
                    <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                  </button>
                )}
                <button onClick={() => setShowBell(false)} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
            <div className="overflow-y-auto flex-1 py-2">
              {notifications.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="text-5xl mb-3">🔔</div>
                  <div className="text-gray-500 font-medium">No notifications yet</div>
                </div>
              ) : (
                notifications.map((notif) => (
                  <button key={notif.id} onClick={() => handleMarkRead(notif.id)} className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors border-b border-gray-50 last:border-0 ${notif.isRead ? 'bg-white' : 'bg-blue-50/60'}`}>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${getNotifColor(notif.type)}`}>{getNotifIcon(notif.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-sm font-semibold truncate ${notif.isRead ? 'text-gray-700' : 'text-gray-900'}`}>{notif.title}</span>
                        {!notif.isRead && <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0" />}
                      </div>
                      <p className={`text-xs mt-0.5 leading-relaxed ${notif.isRead ? 'text-gray-400' : 'text-gray-600'}`}>{notif.message}</p>
                      <span className="text-gray-300 text-[10px] mt-1 block">{formatDateTime(notif.createdAt)}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
            <div className="py-3 flex justify-center border-t border-gray-100">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default Home;
