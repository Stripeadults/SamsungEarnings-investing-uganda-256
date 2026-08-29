import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { TELEGRAM_OFFICIAL } from '@/constants/packages';

interface NotifyModalProps {
  onClose: () => void;
}

const NotifyModal = ({ onClose }: NotifyModalProps) => {
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="relative py-6 text-center" style={{ background: 'linear-gradient(135deg, #1a1a4e, #1d4ed8)' }}>
          <div className="text-white text-4xl font-black tracking-widest">NOTIFY</div>
          <div className="text-blue-300 text-sm mt-1">Samsung Earnings — Uganda</div>
        </div>

        {/* Content */}
        <div className="bg-white px-5 py-4 space-y-2.5">
          <p className="text-gray-800 text-sm leading-relaxed">
            📱 Samsung Earnings officially launched in Uganda!
          </p>
          <p className="text-gray-800 text-sm leading-relaxed">
            💰 Invest UGX 15,000 and withdraw UGX 7,000 instantly!
          </p>
          <p className="text-gray-800 text-sm leading-relaxed">
            🎁 Register now and receive UGX 7,000 bonus!
          </p>
          <p className="text-gray-800 text-sm leading-relaxed">
            📅 Daily check-in rewards UGX 100!
          </p>
          <p className="text-gray-800 text-sm leading-relaxed">
            👥 Invite friends to invest and earn 30% commission!
          </p>
          <p className="text-gray-800 text-sm leading-relaxed">
            ⚡ Earnings distributed 24/7, withdraw anytime!
          </p>
          <p className="text-gray-800 text-sm leading-relaxed">
            📈 Daily return rate varies by package level
          </p>
          <p className="text-gray-800 text-sm leading-relaxed">
            🚀 Join now and start earning daily!
          </p>

          <button
            onClick={() => window.open(TELEGRAM_OFFICIAL, '_blank')}
            className="w-full mt-3 py-3 rounded-full text-white text-sm font-semibold flex items-center justify-center gap-2"
            style={{ background: '#0088cc' }}
          >
            <span>✈️</span>
            Click to join our official Telegram channel
          </button>

          <button
            onClick={onClose}
            className="w-full py-3 rounded-full bg-gray-900 text-white text-sm font-bold"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotifyModal;
