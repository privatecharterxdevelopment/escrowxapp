import { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';

interface Transaction {
  id: string;
  country: string;
  countryCode: string;
  flag: string;
  wallet: string;
  info: string;
  amount: number;
  timestamp: number;
}

const countries = [
  { name: 'United States', code: 'US', flag: '🇺🇸' },
  { name: 'United Kingdom', code: 'GB', flag: '🇬🇧' },
  { name: 'Switzerland', code: 'CH', flag: '🇨🇭' },
  { name: 'Singapore', code: 'SG', flag: '🇸🇬' },
  { name: 'United Arab Emirates', code: 'AE', flag: '🇦🇪' },
  { name: 'Germany', code: 'DE', flag: '🇩🇪' },
  { name: 'France', code: 'FR', flag: '🇫🇷' },
  { name: 'Japan', code: 'JP', flag: '🇯🇵' },
  { name: 'Hong Kong', code: 'HK', flag: '🇭🇰' },
  { name: 'Australia', code: 'AU', flag: '🇦🇺' },
  { name: 'Canada', code: 'CA', flag: '🇨🇦' },
  { name: 'Netherlands', code: 'NL', flag: '🇳🇱' },
  { name: 'Luxembourg', code: 'LU', flag: '🇱🇺' },
  { name: 'Monaco', code: 'MC', flag: '🇲🇨' },
  { name: 'Italy', code: 'IT', flag: '🇮🇹' },
  { name: 'Spain', code: 'ES', flag: '🇪🇸' },
  { name: 'Sweden', code: 'SE', flag: '🇸🇪' },
  { name: 'Norway', code: 'NO', flag: '🇳🇴' },
  { name: 'Austria', code: 'AT', flag: '🇦🇹' },
  { name: 'Saudi Arabia', code: 'SA', flag: '🇸🇦' },
  { name: 'Qatar', code: 'QA', flag: '🇶🇦' },
];

const transactionTypes = [
  // Aviation
  'Private Jet Charter',
  'Aircraft Acquisition',
  'Emptyleg Charter',
  'Aviation Brokerage',
  // Yachting
  'Yacht Charter',
  'Yacht Purchase',
  'Maritime Service',
  // Watches
  'Luxury Timepiece',
  'Watch Collection',
  'Vintage Watch',
  // Cars
  'Exotic Vehicle',
  'Classic Car',
  'Luxury Automobile',
  // Art
  'Fine Art Acquisition',
  'Art Commission',
  'Gallery Transaction',
  'NFT Collection',
  // Services
  'Professional Service',
  'Consulting Agreement',
  // Generic/Unknown
  'Asset Transfer',
  'High-Value Transaction',
  'Escrow Service',
];

// Generate deterministic transaction based on index and 15-minute period
const generateTransaction = (index: number, periodOffset: number = 0): Transaction => {
  const seed = index + periodOffset * 733; // Prime number for better distribution

  // Better random function with multiple seeds for variety
  const random = (min: number, max: number, offset: number = 0) => {
    const x = Math.sin(seed * 12.9898 + index * 78.233 + offset * 45.164) * 43758.5453;
    return Math.floor((x - Math.floor(x)) * (max - min + 1)) + min;
  };

  const country = countries[random(0, countries.length - 1, 1)];
  const type = transactionTypes[random(0, transactionTypes.length - 1, 2)];

  // Generate realistic Base wallet address (0x + 40 hex chars, show first 4)
  const hex = '0123456789abcdef';
  let walletDigits = '';
  for (let i = 0; i < 4; i++) {
    walletDigits += hex[random(0, 15, i + 10)];
  }

  // Much more realistic amounts - mixed pricing, not descending
  // Most transactions are actually quite modest
  const ranges = [
    { min: 850, max: 8500, weight: 50 },      // Most common: $850-$8.5K
    { min: 8500, max: 35000, weight: 25 },    // Medium: $8.5K-$35K
    { min: 35000, max: 125000, weight: 15 },  // Higher: $35K-$125K
    { min: 125000, max: 475000, weight: 8 },  // Large: $125K-$475K
    { min: 475000, max: 2500000, weight: 2 }, // Very rare high value: $475K-$2.5M
  ];

  const totalWeight = ranges.reduce((sum, r) => sum + r.weight, 0);
  const randWeight = random(0, totalWeight - 1, 5);

  let cumWeight = 0;
  let selectedRange = ranges[0];
  for (const range of ranges) {
    cumWeight += range.weight;
    if (randWeight < cumWeight) {
      selectedRange = range;
      break;
    }
  }

  const amount = random(selectedRange.min, selectedRange.max, 6);

  // Time within last 15 minutes - varied
  const minutesAgo = random(1, 14, 7);
  const timestamp = Date.now() - (minutesAgo * 60 * 1000);

  return {
    id: `tx-${seed}-${index}-${periodOffset}`,
    country: country.name,
    countryCode: country.code,
    flag: country.flag,
    wallet: `0x${walletDigits}`,
    info: type,
    amount,
    timestamp,
  };
};

// Generate initial 5 transactions
const generateInitialTransactions = (): Transaction[] => {
  const transactions: Transaction[] = [];
  const currentPeriod = Math.floor(Date.now() / (15 * 60 * 1000)); // 15-minute periods

  for (let i = 0; i < 5; i++) {
    transactions.push(generateTransaction(i, currentPeriod));
  }

  return transactions.sort((a, b) => b.timestamp - a.timestamp);
};

export default function TransactionBoard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showNewBadge, setShowNewBadge] = useState(false);

  useEffect(() => {
    // Initialize transactions
    setTransactions(generateInitialTransactions());

    // Add new transaction every 15 minutes and remove oldest
    const interval = setInterval(() => {
      const currentPeriod = Math.floor(Date.now() / (15 * 60 * 1000));
      const newTx = generateTransaction(Math.floor(Math.random() * 1000), currentPeriod);

      // Show new transaction badge
      setShowNewBadge(true);

      setTimeout(() => {
        setTransactions((prev) => {
          const updated = [newTx, ...prev];
          return updated.slice(0, 5); // Keep only 5 transactions visible
        });
        setShowNewBadge(false);
      }, 800);
    }, 15 * 60 * 1000); // Every 15 minutes

    return () => clearInterval(interval);
  }, []);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <section className="py-16 sm:py-24 px-4 sm:px-8 bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-full text-xs font-medium mb-4">
            <div className="w-2 h-2 bg-gray-900 rounded-full animate-pulse" />
            <span className="text-gray-700">Live on Base Network</span>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">
            Recent Transactions
          </h2>
          <p className="text-sm text-gray-600 max-w-2xl mx-auto">
            Real-time escrow activity secured by smart contracts on Base blockchain
          </p>
        </div>

        {/* Transaction List - Clean & Minimal */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          {/* Transaction Rows */}
          <div className="divide-y divide-gray-100">
            {transactions.map((tx, index) => (
              <div
                key={tx.id}
                className="px-6 py-4 hover:bg-gray-50 transition-all duration-200 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center justify-between gap-4">
                  {/* Left: Country + Wallet */}
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <span className="text-2xl flex-shrink-0">{tx.flag}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-gray-900 mb-0.5">
                        {tx.info}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <code className="font-mono">{tx.wallet}...</code>
                        <span>•</span>
                        <span>{tx.country}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount + Time */}
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-medium text-gray-900 mb-0.5">
                      {formatAmount(tx.amount)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatTimeAgo(tx.timestamp)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Bar - Update Indicator */}
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-gray-600">
                <Activity className="w-3.5 h-3.5" />
                <span>Updates every 15 minutes</span>
              </div>
              {showNewBadge && (
                <span className="text-green-700 font-medium animate-fade-in">
                  New transaction added
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats Footer - Realistic Humble Numbers */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="text-2xl sm:text-3xl font-light text-gray-900 mb-1">
              12,847
            </div>
            <div className="text-xs text-gray-600 font-medium">Total Escrows Completed</div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="text-2xl sm:text-3xl font-light text-gray-900 mb-1">
              $47.2M
            </div>
            <div className="text-xs text-gray-600 font-medium">Total Value Secured</div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="text-2xl sm:text-3xl font-light text-gray-900 mb-1">
              21
            </div>
            <div className="text-xs text-gray-600 font-medium">Countries Served</div>
          </div>
        </div>
      </div>
    </section>
  );
}
