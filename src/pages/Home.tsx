import { Link, useNavigate } from 'react-router-dom';
import { Shield, Lock, FileText, Users, ArrowRight, Plane, Anchor, Watch, Car, Palette, Briefcase, TrendingUp, Clock, CheckCircle, ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import TransactionBoard from '../components/TransactionBoard/TransactionBoard';
import { useAuth } from '../context/AuthContext';

// Mini transaction interface for hero
interface HeroTransaction {
  id: string;
  flag: string;
  info: string;
  wallet: string;
  amount: number;
  category: string;
}

// Generate mini transactions for hero
const generateHeroTransactions = (): HeroTransaction[] => {
  const countries = [
    { flag: '🇺🇸' }, { flag: '🇬🇧' }, { flag: '🇨🇭' }, { flag: '🇸🇬' }, { flag: '🇦🇪' },
    { flag: '🇫🇷' }, { flag: '🇩🇪' }, { flag: '🇮🇹' }, { flag: '🇪🇸' }, { flag: '🇯🇵' }
  ];
  const transactionTypes = [
    { type: 'Emptyleg Charter', category: 'Aviation', minAmount: 2500, maxAmount: 15000 },
    { type: 'Private Jet Charter', category: 'Aviation', minAmount: 45000, maxAmount: 250000 },
    { type: 'Yacht Buy', category: 'Yachting', minAmount: 85000, maxAmount: 250000 },
    { type: 'Jet Cleaning Service', category: 'Aviation', minAmount: 800, maxAmount: 3500 },
    { type: 'Airplane Maintenance', category: 'Aviation', minAmount: 5000, maxAmount: 25000 },
    { type: 'Business Deal', category: 'Business', minAmount: 1000, maxAmount: 50000 },
    { type: 'Luxury Timepiece', category: 'Watches', minAmount: 8000, maxAmount: 75000 },
    { type: 'Unknown', category: 'Other', minAmount: 500, maxAmount: 12000 },
    { type: 'Fine Art', category: 'Art', minAmount: 15000, maxAmount: 95000 }
  ];

  const transactions: HeroTransaction[] = [];
  const now = Date.now();

  for (let i = 0; i < 8; i++) {
    const seed = now + i * 1000;
    const randomCountry = countries[Math.floor(Math.abs(Math.sin(seed * 0.1)) * countries.length)];
    const randomTypeData = transactionTypes[Math.floor(Math.abs(Math.sin(seed * 0.2)) * transactionTypes.length)];
    const amount = randomTypeData.minAmount + Math.floor(Math.abs(Math.sin(seed * 0.3)) * (randomTypeData.maxAmount - randomTypeData.minAmount));

    const hex = '0123456789abcdef';
    let wallet = '0x';
    for (let j = 0; j < 4; j++) {
      wallet += hex[Math.floor(Math.abs(Math.sin(seed * (j + 1))) * 16)];
    }

    transactions.push({
      id: `hero-tx-${i}`,
      flag: randomCountry.flag,
      info: randomTypeData.type,
      wallet,
      amount,
      category: randomTypeData.category,
    });
  }

  return transactions;
};

export default function Home() {
  const navigate = useNavigate();
  const { user, openLogin } = useAuth();
  const [currentWord, setCurrentWord] = useState(0);
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [transactions] = useState<HeroTransaction[]>(generateHeroTransactions());

  const handleGetStarted = () => {
    // Always navigate to dashboard - no authentication required
    // Dashboard will handle showing appropriate CTAs for non-authenticated users
    navigate('/dashboard');
  };

  const words = [
    'aviation transactions',
    'emptyleg deals',
    'yacht deals',
    'watch deals',
    'ownership changes',
    'art acquisitions',
    'luxury transfers',
    'service on Base'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWord((prev) => (prev + 1) % words.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);
  const categories = [
    {
      name: 'Aviation',
      path: '/aviation',
      icon: <Plane className="w-5 h-5" />,
      description: 'Private jets & charters',
      video: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/fucking%20videos/12427495_3840_2160_24fps.mp4',
    },
    {
      name: 'Yachting',
      path: '/yachting',
      icon: <Anchor className="w-5 h-5" />,
      description: 'Luxury yacht transactions',
      video: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/fucking%20videos/4936422-uhd_4096_2160_24fps.mp4',
    },
    {
      name: 'Watches',
      path: '/watches',
      icon: <Watch className="w-5 h-5" />,
      description: 'High-end timepieces',
      video: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/fucking%20videos/3171546-hd_1920_1080_30fps.mp4',
    },
    {
      name: 'Cars',
      path: '/cars',
      icon: <Car className="w-5 h-5" />,
      description: 'Exotic & luxury vehicles',
      video: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/fucking%20videos/8262626-hd_1920_1080_30fps.mp4',
    },
    {
      name: 'Art',
      path: '/art',
      icon: <Palette className="w-5 h-5" />,
      description: 'Fine art & collectibles',
      video: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/fucking%20videos/1970039-hd_1920_1080_30fps.mp4',
    },
    {
      name: 'Services',
      path: '/services',
      icon: <Briefcase className="w-5 h-5" />,
      description: 'Professional services',
      video: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/fucking%20videos/7710488-uhd_2160_4096_25fps.mp4',
    },
  ];

  const features = [
    {
      icon: <Shield className="w-5 h-5" />,
      title: 'Smart Contract Security',
      description: 'FlexibleEscrow.sol with ReentrancyGuard protection and battle-tested code',
    },
    {
      icon: <Lock className="w-5 h-5" />,
      title: 'Progressive Fees',
      description: '2.0% (0-$1M), 1.5% ($1M-$100M), Custom pricing for larger transactions',
    },
    {
      icon: <FileText className="w-5 h-5" />,
      title: 'IPFS Contract Storage',
      description: 'Upload and store encrypted contracts on-chain with immutable proof',
    },
    {
      icon: <Users className="w-5 h-5" />,
      title: 'Multi-Signature Release',
      description: 'Configurable multi-sig support for added security and trust',
    },
  ];

  const howItWorks = [
    {
      step: '1',
      title: 'Create Escrow',
      description: 'Upload contract, set terms, define signers',
    },
    {
      step: '2',
      title: 'Deposit Funds',
      description: 'Buyer deposits funds to smart contract',
    },
    {
      step: '3',
      title: 'Sign Release',
      description: 'Authorized parties sign to release funds',
    },
    {
      step: '4',
      title: 'Complete',
      description: 'Funds released to seller automatically',
    },
  ];

  const statistics = [
    {
      icon: <TrendingUp className="w-5 h-5" />,
      value: '$500M+',
      label: 'Total Value Secured',
    },
    {
      icon: <CheckCircle className="w-5 h-5" />,
      value: '10,000+',
      label: 'Transactions Completed',
    },
    {
      icon: <Clock className="w-5 h-5" />,
      value: '24/7',
      label: 'Smart Contract Monitoring',
    },
    {
      icon: <Shield className="w-5 h-5" />,
      value: '100%',
      label: 'Security Record',
    },
  ];

  const trustIndicators = [
    {
      title: 'Institutional Grade Security',
      description: 'Our smart contracts are audited by leading blockchain security firms and deployed on Base, Coinbase\'s secure Layer 2 solution.',
    },
    {
      title: 'Full Transparency',
      description: 'Every transaction is recorded on-chain with complete visibility. All contract terms, signatures, and fund movements are immutably stored.',
    },
    {
      title: 'Regulatory Compliance',
      description: 'Built with compliance in mind, our escrow services adhere to international financial regulations and KYC/AML requirements.',
    },
    {
      title: 'Dispute Resolution',
      description: 'Multi-signature authorization ensures fair resolution. Configurable arbitration protocols protect both buyers and sellers.',
    },
  ];

  const faqs = [
    {
      question: 'How does blockchain escrow differ from traditional escrow?',
      answer: 'Blockchain escrow eliminates intermediary delays and reduces costs by using smart contracts that automatically execute when conditions are met. Traditional escrow requires manual processing and multiple intermediaries, while our decentralized system provides instant, transparent, and tamper-proof transactions on the Base blockchain.',
    },
    {
      question: 'What are the fees for using PrivateCharterX Escrow?',
      answer: 'We use a progressive fee structure: 2.0% for transactions up to $1M, 1.5% for transactions between $1M-$100M, and custom pricing for larger institutional transactions. All fees are transparent and disclosed upfront before you create an escrow.',
    },
    {
      question: 'How secure are my funds?',
      answer: 'Your funds are secured by audited smart contracts on Base with ReentrancyGuard protection. The contracts are immutable and non-custodial, meaning only authorized parties with valid signatures can release funds. We have a 100% security record with zero breaches since launch.',
    },
    {
      question: 'What happens if there is a dispute?',
      answer: 'Our multi-signature system allows for configurable dispute resolution. You can define arbitrators during escrow creation who can mediate disputes. The smart contract requires a threshold of signatures before releasing funds, ensuring fair outcomes for all parties.',
    },
    {
      question: 'Can I use this for international transactions?',
      answer: 'Yes, blockchain escrow is ideal for international transactions. There are no geographic restrictions, and cryptocurrency payments eliminate currency conversion fees and banking delays. Transactions settle in minutes rather than days.',
    },
    {
      question: 'What types of assets can be secured through escrow?',
      answer: 'We specialize in high-value luxury assets including private aviation, yachts, exotic vehicles, fine art, luxury watches, and professional services. Our platform supports any transaction where secure, transparent fund holding is required.',
    },
    {
      question: 'How long does the escrow process take?',
      answer: 'Creating an escrow takes minutes. Fund deposits are confirmed within seconds on the Base network. Release times depend on your configured signature requirements, but once all parties sign, funds are released instantly by the smart contract.',
    },
    {
      question: 'Do I need cryptocurrency to use this service?',
      answer: 'Currently, our escrow system operates with USDC (USD Coin) on the Base network. You\'ll need a compatible Web3 wallet (like MetaMask or Coinbase Wallet) and USDC to create or fund escrows. We provide detailed onboarding guides for new users.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100">
      <Header />

      {/* Hero Section with Video Background */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-visible pb-0">
        {/* Background Video */}
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover blur-[1px]"
          >
            <source src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/sign/gb/istockphoto-1733442081-640_adpp_is.mp4?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNzUxNzI0Mi0yZTk0LTQxZDctODM3Ny02Yjc0ZDBjNWM2OTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJnYi9pc3RvY2twaG90by0xNzMzNDQyMDgxLTY0MF9hZHBwX2lzLm1wNCIsImlhdCI6MTc1OTUyMDc5MCwiZXhwIjoxNzkxMDU2NzkwfQ.P5Hr5zLzhYdk5sjvXuPs1clfrt4nLZhKDhbF0gvH5Ss" type="video/mp4" />
          </video>
        </div>

        {/* Content - Centered Layout */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-8 pt-32 pb-16 flex-1 flex flex-col items-center justify-center">
          {/* Badge */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-gray-200 px-4 py-2 rounded-full text-sm font-medium">
              <Shield className="w-4 h-4 text-gray-600" />
              <span className="text-gray-600">Secured by Smart Contracts on Base</span>
            </div>
          </div>

          {/* Main Title with Animation */}
          <div className="mb-6 text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold text-gray-900 leading-tight tracking-tight mb-4">
              Decentralized
            </h1>
            <div className="flex items-center justify-center">
              <span className="inline-block relative overflow-hidden" style={{ width: '100%', height: '60px' }}>
                {words.map((word, index) => (
                  <span
                    key={word}
                    className={`absolute left-0 right-0 text-4xl sm:text-5xl lg:text-6xl font-semibold text-gray-600 leading-tight transition-all duration-500 text-center ${
                      index === currentWord
                        ? 'translate-y-0 opacity-100'
                        : index < currentWord
                        ? '-translate-y-full opacity-0'
                        : 'translate-y-full opacity-0'
                    }`}
                  >
                    {word}
                  </span>
                ))}
              </span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-8">
            <button
              onClick={handleGetStarted}
              className="bg-gray-900 text-white px-8 py-3 rounded-lg text-base font-medium hover:bg-gray-800 transition-colors flex items-center gap-2 group"
            >
              Get Started
              <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <Link
              to="/how-it-works"
              className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg text-base font-medium hover:bg-white/80 hover:border-gray-400 transition-colors"
            >
              Learn More
            </Link>
          </div>

          {/* Description */}
          <p className="text-base sm:text-lg text-gray-600 text-center max-w-3xl leading-relaxed">
            Institutional-grade escrow services for discerning clients. Smart contract technology meets
            traditional banking sophistication to secure your most valuable transactions with absolute
            transparency and unwavering reliability.
          </p>
        </div>

        {/* Transaction Board - Half Cut at Bottom */}
        <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-8 pb-0">
          <div className="relative" style={{ height: '250px', overflow: 'hidden' }}>
            <div className="bg-white/90 backdrop-blur-xl rounded-t-2xl border border-gray-200 border-b-0 overflow-hidden shadow-2xl">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium text-gray-700">Live Transactions</span>
                </div>
              </div>
              <div className="divide-y divide-gray-100">
                {transactions.slice(0, 8).map((tx) => (
                  <div
                    key={tx.id}
                    className="px-6 py-4 hover:bg-gray-50/50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className="text-xl flex-shrink-0">{tx.flag}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {tx.info}
                            </div>
                            <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full whitespace-nowrap">
                              {tx.category}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {tx.wallet}...
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm font-semibold text-gray-900">
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          }).format(tx.amount)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Gradient fade at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-8 bg-white border-t border-gray-200">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-light text-gray-900 mb-4">
            Begin Your Secure Transaction
          </h2>
          <p className="text-sm text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Join a select community of professionals and institutions who trust PrivateCharterX Escrow
            for their most critical transactions. Experience the future of secure, transparent value exchange.
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 bg-gray-900 text-white px-8 py-3 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors group shadow-sm"
          >
            Access Dashboard
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
