import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div
      className="min-h-screen flex items-center justify-center flex-col px-6"
      style={{ background: 'linear-gradient(160deg, #0a0f2e 0%, #1a2f6e 100%)' }}
    >
      <div className="text-8xl font-black text-white/10">404</div>
      <div className="text-white text-xl font-bold mt-4">Page Not Found</div>
      <p className="text-blue-300 text-sm mt-2 text-center">The page you're looking for doesn't exist</p>
      <button
        onClick={() => navigate('/home')}
        className="mt-6 bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold"
      >
        Go Home
      </button>
    </div>
  );
};

export default NotFound;
