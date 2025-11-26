import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { User, ChevronDown, LogOut, MessageCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import SplitAuthModal from '../Auth/SplitAuthModal';
import { NotificationBell } from '../NotificationBell';

export default function Header() {
  const { address, isConnected } = useAccount();
  const { open } = useAppKit();
  const { user, logout, showAuth, authMode, openLogin, closeAuth } = useAuth();
  const location = useLocation();
  const [showMenu, setShowMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Debug wallet state
  useEffect(() => {
    console.log('[Header] Wallet State:', { isConnected, address });
  }, [isConnected, address]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActivePage = (path: string) => {
    return location.pathname === path;
  };

  const categories = [
    { name: 'Aviation', path: '/aviation' },
    { name: 'Yachting', path: '/yachting' },
    { name: 'Watches', path: '/watches' },
    { name: 'Cars', path: '/cars' },
    { name: 'Art', path: '/art' },
    { name: 'Services', path: '/services' },
  ];

  return (
    <>
      {/* Promo Banner */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gray-100 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-1.5">
          <p className="text-center text-xs text-gray-600 font-medium">
            🔒 Secure Escrow Services • 2% Fee (0-$1M) • Multi-Signature Protection
          </p>
        </div>
      </div>

      {/* Header with glassmorphic background on scroll */}
      <div
        className={`fixed left-0 right-0 z-50 transition-all duration-300 pointer-events-none ${
          scrolled
            ? 'bg-white/80 backdrop-blur-2xl border-b border-gray-200/50 shadow-sm'
            : ''
        }`}
        style={{ top: '30px' }}
      >
        <header className="px-4 sm:px-8 py-3 max-w-7xl mx-auto pointer-events-auto">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <span className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                escrowx.app
              </span>
            </Link>

            {/* Right Side - Navigation + Plus Menu Toggle + Buttons */}
            <div className="flex items-center space-x-3">
              {/* Inline Navigation Menu */}
              {showMenu && (
                <div className="flex flex-wrap items-center gap-2 animate-fade-in">
                  {categories.map((cat) => (
                    <Link
                      key={cat.path}
                      to={cat.path}
                      onClick={() => setShowMenu(false)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        isActivePage(cat.path)
                          ? 'text-gray-900 bg-gray-100'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      {cat.name}
                    </Link>
                  ))}
                  <Link
                    to="/how-it-works"
                    onClick={() => setShowMenu(false)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      isActivePage('/how-it-works')
                        ? 'text-gray-900 bg-gray-100'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    How It Works
                  </Link>
                </div>
              )}

              {/* Plus Menu Toggle */}
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-md transition-all"
                aria-label="Toggle menu"
              >
                <div
                  className={`relative w-5 h-5 transition-transform duration-300 ${
                    showMenu ? 'rotate-45' : 'rotate-0'
                  }`}
                >
                  <span className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-900 -translate-y-1/2" />
                  <span className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-gray-900 -translate-x-1/2" />
                </div>
              </button>

              {/* Messages Bell Icon */}
              {user && (
                <Link
                  to="/dashboard?tab=messages"
                  className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-md transition-all relative"
                  aria-label="Messages"
                >
                  <MessageCircle className="w-4 h-4 text-gray-700" />
                </Link>
              )}

              {/* Notification Bell */}
              {user && <NotificationBell />}

              {/* Thin Separator */}
              <div className="h-6 w-px bg-gray-300" />

              {/* User Dropdown or Get Started Button */}
              {!user ? (
                <button
                  onClick={openLogin}
                  className="bg-gray-900 text-white px-4 py-1.5 rounded-md text-xs font-medium hover:bg-gray-800 transition-colors"
                >
                  Get Started
                </button>
              ) : (
                <>
                  <div className="relative">
                    <button
                      onClick={() => setShowUserDropdown(!showUserDropdown)}
                      className="border border-gray-300 text-gray-700 px-3 py-1.5 rounded-md text-xs font-medium hover:bg-gray-50 hover:border-gray-400 transition-colors flex items-center gap-1"
                    >
                      <User className="w-3 h-3" />
                      <span className="hidden sm:inline">
                        {user.email ? user.username : `${user.wallet_address.slice(0, 6)}...${user.wallet_address.slice(-4)}`}
                      </span>
                      <ChevronDown
                        className={`w-3 h-3 transition-transform ${
                          showUserDropdown ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {showUserDropdown && (
                      <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 animate-fade-in">
                        <Link
                          to="/dashboard"
                          onClick={() => setShowUserDropdown(false)}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                        >
                          <User className="w-4 h-4" />
                          Dashboard
                        </Link>
                        <div className="border-t border-gray-200 my-1" />
                        <button
                          onClick={() => {
                            logout();
                            setShowUserDropdown(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                        >
                          <LogOut className="w-4 h-4" />
                          Logout
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Connect Wallet button - only show if wallet not connected */}
                  {(!isConnected || !address) && (
                    <button
                      onClick={() => open()}
                      className="border border-gray-300 text-gray-700 px-3 py-1.5 rounded-md text-xs font-medium hover:bg-gray-50 hover:border-gray-400 transition-colors"
                    >
                      Connect Wallet
                    </button>
                  )}

                  {/* Wallet Address - show when connected */}
                  {isConnected && address && (
                    <button
                      onClick={() => open()}
                      className="border border-green-300 bg-green-50 text-green-700 px-3 py-1.5 rounded-md text-xs font-medium hover:bg-green-100 hover:border-green-400 transition-colors"
                    >
                      {address.slice(0, 6)}...{address.slice(-4)}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </header>
      </div>

      {/* Auth Modal */}
      <SplitAuthModal
        isOpen={showAuth}
        onClose={closeAuth}
        defaultMode={authMode}
      />
    </>
  );
}
