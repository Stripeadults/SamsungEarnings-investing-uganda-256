import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Users, TrendingUp, Clock, Star, Phone } from 'lucide-react';

const AboutUs = () => {
  const navigate = useNavigate();

  return (
    <div className="app-container min-h-screen bg-gray-50">
      {/* Header */}
      <div
        className="flex items-center px-4 py-4"
        style={{ background: 'linear-gradient(135deg, #0a0f2e, #1d4ed8)' }}
      >
        <button
          onClick={() => navigate(-1)}
          className="mr-3 w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-white font-bold text-lg">About Us</h1>
      </div>

      {/* Hero Banner */}
      <div
        className="px-5 py-8 text-white text-center"
        style={{ background: 'linear-gradient(135deg, #0a0f2e 0%, #1d4ed8 60%, #3b82f6 100%)' }}
      >
        <div className="w-20 h-20 rounded-3xl bg-white/20 flex items-center justify-center mx-auto mb-4 border border-white/30">
          <span className="text-4xl">📱</span>
        </div>
        <h2 className="text-2xl font-bold mb-2">Samsung Earnings</h2>
        <p className="text-blue-200 text-sm leading-relaxed max-w-xs mx-auto">
          Uganda's most trusted Samsung investment platform — earn daily returns with premium Galaxy packages.
        </p>
        <div className="flex items-center justify-center gap-1 mt-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
          ))}
          <span className="text-blue-200 text-xs ml-2">Trusted by thousands</span>
        </div>
      </div>

      <div className="px-4 py-5 space-y-4">

        {/* Mission */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-bold text-gray-800 text-base">Our Mission</h3>
          </div>
          <p className="text-gray-600 text-sm leading-relaxed">
            Samsung Earnings was founded with a single mission: to make passive income accessible to every Ugandan.
            We connect everyday people with high-quality Samsung investment packages that generate consistent daily returns,
            so you can build wealth without needing financial expertise.
          </p>
        </div>

        {/* Who We Are */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="font-bold text-gray-800 text-base">Who We Are</h3>
          </div>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            We are a team of financial technology professionals and investment specialists based in Uganda.
            Our platform is designed specifically for the East African market, supporting MTN Mobile Money
            and Airtel Money for seamless deposits and withdrawals.
          </p>
          <div className="grid grid-cols-3 gap-3 mt-2">
            {[
              { value: '10,000+', label: 'Members' },
              { value: 'UGX 1B+', label: 'Paid Out' },
              { value: '24/7', label: 'Support' },
            ].map(({ value, label }) => (
              <div key={label} className="bg-blue-50 rounded-xl p-3 text-center">
                <div className="text-blue-700 font-bold text-base">{value}</div>
                <div className="text-blue-500 text-xs mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Why Choose Us */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Shield className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="font-bold text-gray-800 text-base">Why Choose Us</h3>
          </div>
          <div className="space-y-3">
            {[
              { icon: '🎁', title: 'Registration Bonus', desc: 'New members receive UGX 7,000 instantly upon registration.' },
              { icon: '💸', title: 'Daily Auto-Earnings', desc: 'Your package income is credited automatically every 24 hours.' },
              { icon: '⚡', title: 'Instant Referral Pay', desc: 'Earn 30% commission the moment your referral invests.' },
              { icon: '🔒', title: 'Secure Platform', desc: 'Strict 1-account-per-person policy to protect all members.' },
              { icon: '📲', title: 'Mobile Money', desc: 'Full MTN MoMo & Airtel Money support for Uganda.' },
              { icon: '📅', title: 'Daily Check-In', desc: 'Earn extra UGX 100 every day just for logging in.' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <span className="text-xl shrink-0 mt-0.5">{icon}</span>
                <div>
                  <div className="text-gray-800 font-semibold text-sm">{title}</div>
                  <div className="text-gray-500 text-xs mt-0.5 leading-relaxed">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works Summary */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="font-bold text-gray-800 text-base">How It Works</h3>
          </div>
          <div className="space-y-3">
            {[
              { step: '1', text: 'Register with your phone number and get UGX 7,000 bonus.' },
              { step: '2', text: 'Recharge your account using MTN MoMo or Airtel Money.' },
              { step: '3', text: 'Purchase any Samsung Galaxy investment package of your choice.' },
              { step: '4', text: 'Earn daily income automatically — deposited every 24 hours.' },
              { step: '5', text: 'Invite friends and earn 30% of their investment instantly.' },
              { step: '6', text: 'Withdraw anytime — minimum UGX 7,000, processed within 24hrs.' },
            ].map(({ step, text }) => (
              <div key={step} className="flex items-start gap-3">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                  style={{ background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)' }}
                >
                  {step}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact / Support */}
        <div
          className="rounded-2xl p-5 text-white"
          style={{ background: 'linear-gradient(135deg, #0a0f2e, #1d4ed8)' }}
        >
          <div className="flex items-center gap-3 mb-3">
            <Phone className="w-5 h-5 text-blue-300" />
            <h3 className="font-bold text-base">Contact & Support</h3>
          </div>
          <p className="text-blue-200 text-sm leading-relaxed mb-4">
            Our support team is available 24/7 through our official Telegram channels.
            Never share your password or personal details outside official channels.
          </p>
          <div className="space-y-2">
            <a
              href="https://t.me/+adk1usHyKF4yYzQ0"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center gap-3 bg-[#2AABEE] rounded-xl px-4 py-3"
            >
              <span className="text-xl">✈️</span>
              <div>
                <div className="font-semibold text-sm">Official Support Channel</div>
                <div className="text-blue-100 text-xs">For help, complaints & announcements</div>
              </div>
            </a>
            <a
              href="https://t.me/+kH7QuzE6dp0xZmVk"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center gap-3 bg-white/10 border border-white/20 rounded-xl px-4 py-3"
            >
              <span className="text-xl">👥</span>
              <div>
                <div className="font-semibold text-sm">Community Group Chat</div>
                <div className="text-blue-200 text-xs">Connect with fellow investors</div>
              </div>
            </a>
          </div>
        </div>

        {/* Legal */}
        <div className="bg-gray-100 rounded-2xl p-4 text-center">
          <p className="text-gray-500 text-xs leading-relaxed">
            Samsung Earnings is an independent investment platform operating in Uganda.
            The Samsung Galaxy branding is used to represent investment tiers only.
            All investments carry risk. Only invest what you can afford.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
