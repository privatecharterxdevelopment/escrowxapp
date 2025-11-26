import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already accepted cookies
    const hasAccepted = localStorage.getItem('cookies-accepted');
    if (!hasAccepted) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookies-accepted', 'true');
    setIsVisible(false);
  };

  const handleDeny = () => {
    localStorage.setItem('cookies-accepted', 'denied');
    setIsVisible(false);
  };

  const handleClose = () => {
    localStorage.setItem('cookies-accepted', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 sm:bottom-6 sm:left-1/2 sm:-translate-x-1/2 z-50 sm:max-w-4xl w-full animate-fade-in">
      <div className="bg-gray-100/60 backdrop-blur-xl border-t sm:border border-gray-200/50 rounded-none sm:rounded-full shadow-lg px-3 sm:px-6 py-2.5 sm:py-4 mx-0 sm:mx-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-6">
          <p className="text-xs sm:text-sm text-gray-900 flex-1 text-center sm:text-left">
            We use cookies to enhance your escrow experience.{' '}
            <Link to="/privacy" className="text-xs sm:text-sm text-gray-900 hover:text-gray-700 underline transition-colors font-semibold">
              Learn more
            </Link>
          </p>

          <div className="flex items-center justify-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleDeny}
              className="flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 bg-white/30 backdrop-blur-md border border-white/50 text-gray-900 rounded-full text-xs font-medium hover:bg-white/40 transition-all min-w-0"
            >
              Deny
            </button>
            <button
              onClick={handleAccept}
              className="flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-900 text-white rounded-full text-xs font-medium hover:bg-gray-800 transition-colors min-w-0"
            >
              Accept
            </button>
            <button
              onClick={handleClose}
              className="p-1.5 sm:p-2 hover:bg-white/30 rounded-full transition-colors flex-shrink-0"
              aria-label="Close"
            >
              <X className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-gray-700" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
