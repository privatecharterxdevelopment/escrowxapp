import { Link } from 'react-router-dom';
import { Twitter, Github, MessageCircle, Shield } from 'lucide-react';

export default function Footer() {
  const categories = [
    { name: 'Aviation', path: '/aviation' },
    { name: 'Yachting', path: '/yachting' },
    { name: 'Watches', path: '/watches' },
    { name: 'Cars', path: '/cars' },
    { name: 'Art', path: '/art' },
    { name: 'Services', path: '/services' },
  ];

  return (
    <footer className="bg-black text-white rounded-t-3xl py-12 sm:py-16 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10 md:gap-12 mb-10 sm:mb-12">
          {/* Brand */}
          <div className="sm:col-span-2 md:col-span-1">
            <div className="flex items-center space-x-3 mb-4">
              <Shield className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
              <span className="text-base sm:text-lg font-semibold text-white">
                PrivateCharterX<span className="font-bold">.Escrow</span>
              </span>
            </div>
            <p className="text-sm sm:text-base text-gray-300 font-normal leading-relaxed">
              Secure decentralized escrow services for luxury assets and high-value transactions.
            </p>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Categories</h4>
            <ul className="space-y-2 sm:space-y-3">
              {categories.map((cat) => (
                <li key={cat.path}>
                  <Link
                    to={cat.path}
                    className="text-gray-300 hover:text-white transition-colors font-medium text-sm sm:text-base"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Resources</h4>
            <ul className="space-y-2 sm:space-y-3">
              <li>
                <Link
                  to="/how-it-works"
                  className="text-gray-300 hover:text-white transition-colors font-medium text-sm sm:text-base"
                >
                  How It Works
                </Link>
              </li>
              <li>
                <Link
                  to="/dashboard"
                  className="text-gray-300 hover:text-white transition-colors font-medium text-sm sm:text-base"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/privatecharterxdevelopment/escrow"
                  className="text-gray-300 hover:text-white transition-colors font-medium text-sm sm:text-base"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Smart Contracts
                </a>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h4 className="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Community</h4>
            <div className="flex space-x-3 sm:space-x-4">
              <a
                href="https://twitter.com/privatecharterx"
                className="w-10 h-10 sm:w-11 sm:h-11 bg-white/10 border-2 border-white/20 rounded-lg flex items-center justify-center hover:bg-white/20 hover:border-white/30 transition-colors text-white"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Twitter className="w-4 h-4 sm:w-5 sm:h-5" />
              </a>
              <a
                href="https://discord.gg/privatecharterx"
                className="w-10 h-10 sm:w-11 sm:h-11 bg-white/10 border-2 border-white/20 rounded-lg flex items-center justify-center hover:bg-white/20 hover:border-white/30 transition-colors text-white"
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              </a>
              <a
                href="https://github.com/privatecharterxdevelopment"
                className="w-10 h-10 sm:w-11 sm:h-11 bg-white/10 border-2 border-white/20 rounded-lg flex items-center justify-center hover:bg-white/20 hover:border-white/30 transition-colors text-white"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="w-4 h-4 sm:w-5 sm:h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t-2 border-white/20 pt-6 sm:pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0">
          <p className="text-gray-300 font-medium text-xs sm:text-sm text-center sm:text-left">
            © 2025 PrivateCharterX Escrow. All rights reserved.
          </p>

          <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
            <Link
              to="/privacy"
              className="text-gray-300 hover:text-white transition-colors text-xs sm:text-sm font-medium whitespace-nowrap"
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms"
              className="text-gray-300 hover:text-white transition-colors text-xs sm:text-sm font-medium whitespace-nowrap"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
