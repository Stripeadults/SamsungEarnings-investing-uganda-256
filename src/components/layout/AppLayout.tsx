import { ReactNode, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Home, ShoppingBag, Users, User } from 'lucide-react';
import { getCurrentUser, processDailyIncome } from '@/lib/storage';

interface AppLayoutProps {
  children: ReactNode;
}

const NAV_ITEMS = [
  { path: '/home', label: 'Home', Icon: Home },
  { path: '/product', label: 'Product', Icon: ShoppingBag },
  { path: '/team', label: 'Team', Icon: Users },
  { path: '/mine', label: 'Mine', Icon: User },
];

const AppLayout = ({ children }: AppLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      navigate('/login');
      return;
    }
    // Process daily income
    processDailyIncome();
  }, [navigate]);

  return (
    <div className="app-container" style={{ background: '#f3f4f8' }}>
      <div className="pb-20 min-h-screen">{children}</div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-gray-100 z-50">
        <div className="flex items-center justify-around py-2">
          {NAV_ITEMS.map(({ path, label, Icon }) => {
            const active = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`flex flex-col items-center py-2 px-4 rounded-xl transition-colors ${
                  active ? 'text-blue-600' : 'text-gray-400'
                }`}
              >
                <Icon className={`w-6 h-6 ${active ? 'text-blue-600' : 'text-gray-400'}`} />
                <span className={`text-xs mt-0.5 font-medium ${active ? 'text-blue-600' : 'text-gray-400'}`}>
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
