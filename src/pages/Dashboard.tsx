import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Shield, Clock, CheckCircle, XCircle, AlertCircle, Wallet, Lock, ArrowRight, Info, ExternalLink, MessageCircle } from 'lucide-react';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import { useAuth } from '../context/AuthContext';
import { useAccount } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { Messages } from '../components/Messages';

// This would connect to your actual escrow smart contract
// For now, it's a placeholder structure
interface Escrow {
  id: number;
  buyer: string;
  seller: string;
  amount: string;
  status: 'Active' | 'Released' | 'Refunded' | 'Disputed' | 'Cancelled';
  description: string;
  createdAt: number;
  signCount: number;
  requiredSigs: number;
  cancellationFee?: number;
  transactionHash?: string;
  cancelledBy?: 'buyer' | 'seller';
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, openLogin, isLoading } = useAuth();
  const { address, isConnected } = useAccount();
  const { open } = useAppKit();
  const [escrows] = useState<Escrow[]>([]);
  const [cancelledEscrows] = useState<Escrow[]>([
    // Example cancelled escrow - this would come from smart contract
    {
      id: 999,
      buyer: '0x1234567890123456789012345678901234567890', // Fixed address instead of current user
      seller: '0x0987654321098765432109876543210987654321',
      amount: '2800',
      status: 'Cancelled' as const,
      description: 'Used Tesla Model S Purchase',
      createdAt: Date.now() - 86400000,
      signCount: 0,
      requiredSigs: 2,
      cancellationFee: 99,
      transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      cancelledBy: 'buyer' as const
    }
  ]);
  const [filter, setFilter] = useState<'all' | 'buyer' | 'seller' | 'cancelled' | 'messages'>('all');

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/');
    }
  }, [user, isLoading, navigate]);

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Get display name (username or shortened wallet address)
  const getDisplayName = () => {
    if (user?.username) return user.username;
    if (user?.email) return user.email.split('@')[0];
    if (address) return `${address.slice(0, 6)}...${address.slice(-4)}`;
    return 'Guest';
  };

  // TODO: Fetch escrows from smart contract
  useEffect(() => {
    if (isConnected && address) {
      // Placeholder - would fetch from contract
      // const fetchEscrows = async () => {
      //   const contract = await getEscrowContract();
      //   const count = await contract.escrowCounter();
      //   // ... fetch escrows
      // };
      // fetchEscrows();
    }
  }, [isConnected, address]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Active':
        return <Clock className="w-5 h-5 text-blue-600" />;
      case 'Released':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'Refunded':
        return <XCircle className="w-5 h-5 text-gray-600" />;
      case 'Disputed':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'Cancelled':
        return <XCircle className="w-5 h-5 text-amber-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-blue-100 text-blue-800';
      case 'Released':
        return 'bg-green-100 text-green-800';
      case 'Refunded':
        return 'bg-gray-100 text-gray-800';
      case 'Disputed':
        return 'bg-red-100 text-red-800';
      case 'Cancelled':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredEscrows = escrows.filter((escrow) => {
    // Never show cancelled escrows in regular tabs
    if (escrow.status === 'Cancelled') return false;

    if (filter === 'cancelled') return false; // Cancelled tab shows different data
    if (filter === 'buyer') return escrow.buyer.toLowerCase() === address?.toLowerCase();
    if (filter === 'seller') return escrow.seller.toLowerCase() === address?.toLowerCase();
    if (filter === 'all') return true; // Show all non-cancelled escrows
    return true;
  });

  const filteredCancelledEscrows = cancelledEscrows.filter((escrow) => {
    if (filter !== 'cancelled') return false; // Only show when cancelled tab is selected

    // For cancelled tab, show cancelled escrows where user is buyer OR seller
    if (!address) return false;
    const userAddress = address.toLowerCase();
    return escrow.buyer.toLowerCase() === userAddress || escrow.seller.toLowerCase() === userAddress;
  });

  const handleCreateEscrow = () => {
    // Only check if user is authenticated - wallet check happens on create-escrow page
    if (!user) {
      openLogin();
      return;
    }
    navigate('/create-escrow');
  };

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100">
        <Header />
        <div className="pt-32 pb-20 px-4 sm:px-8">
          <div className="max-w-7xl mx-auto flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-gray-300 border-t-gray-900 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100">
      <Header />

      <div className="pt-32 pb-20 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto">

          {/* Wallet Connection Banner */}
          {(!isConnected || !address) ? (
            <div className="mb-8 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 rounded-xl p-6 border border-gray-600 shadow-lg">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Wallet className="w-5 h-5 text-gray-300 flex-shrink-0" />
                  <p className="text-sm text-gray-200">
                    Connect your wallet to create and manage escrow transactions
                  </p>
                </div>
                <button
                  onClick={() => open()}
                  className="bg-white text-gray-900 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors whitespace-nowrap"
                >
                  Connect Wallet
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-8 bg-gradient-to-r from-green-700 via-green-600 to-green-700 rounded-xl p-6 border border-green-500 shadow-lg">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-300 rounded-full animate-pulse flex-shrink-0" />
                  <div>
                    <p className="text-sm text-green-100 font-semibold">Wallet Connected</p>
                    <code className="text-xs text-green-200 font-mono">
                      {address?.slice(0, 6)}...{address?.slice(-4)}
                    </code>
                  </div>
                </div>
                <button
                  onClick={() => open()}
                  className="bg-white text-gray-900 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors whitespace-nowrap"
                >
                  Change Wallet
                </button>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 mb-2">
                {getGreeting()}, <span className="text-gray-500">{getDisplayName()}</span>
              </h1>
              <p className="text-sm text-gray-600">
                {isConnected && address
                  ? 'Manage your escrow transactions'
                  : 'Connect your wallet to start securing your transactions'
                }
              </p>
            </div>
            <button
              onClick={handleCreateEscrow}
              className="flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors shadow-sm"
            >
              <Plus className="w-5 h-5" />
              Create Escrow
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-8 border-b border-gray-200">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 font-medium transition-colors text-sm ${
                filter === 'all'
                  ? 'text-gray-900 border-b-2 border-gray-900'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All Escrows
            </button>
            <button
              onClick={() => setFilter('buyer')}
              disabled={!isConnected}
              className={`px-4 py-2 font-medium transition-colors text-sm ${
                filter === 'buyer'
                  ? 'text-gray-900 border-b-2 border-gray-900'
                  : 'text-gray-600 hover:text-gray-900'
              } ${!isConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              As Buyer
            </button>
            <button
              onClick={() => setFilter('seller')}
              disabled={!isConnected}
              className={`px-4 py-2 font-medium transition-colors text-sm ${
                filter === 'seller'
                  ? 'text-gray-900 border-b-2 border-gray-900'
                  : 'text-gray-600 hover:text-gray-900'
              } ${!isConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              As Seller
            </button>
            <button
              onClick={() => setFilter('cancelled')}
              disabled={!isConnected}
              className={`px-4 py-2 font-medium transition-colors text-sm ${
                filter === 'cancelled'
                  ? 'text-gray-900 border-b-2 border-gray-900'
                  : 'text-gray-600 hover:text-gray-900'
              } ${!isConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Cancelled
            </button>
            <button
              onClick={() => setFilter('messages')}
              disabled={!isConnected}
              className={`px-4 py-2 font-medium transition-colors text-sm flex items-center gap-1.5 ${
                filter === 'messages'
                  ? 'text-gray-900 border-b-2 border-gray-900'
                  : 'text-gray-600 hover:text-gray-900'
              } ${!isConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <MessageCircle className="w-4 h-4" />
              Messages
            </button>
          </div>

          {/* Messages Tab */}
          {filter === 'messages' ? (
            <Messages />
          ) : null}

          {/* Escrows List */}
          {filter !== 'messages' && filter === 'cancelled' && filteredCancelledEscrows.length === 0 ? (
            <div className="text-center py-20 bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-200">
              <XCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No cancelled escrows</h3>
              <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
                You don't have any cancelled escrow transactions
              </p>
            </div>
          ) : filter === 'cancelled' ? (
            <div className="grid grid-cols-1 gap-4">
              {filteredCancelledEscrows.map((escrow) => (
                <Link
                  key={escrow.id}
                  to={`/escrow/${escrow.id}`}
                  className="bg-white/60 backdrop-blur-sm border-2 border-gray-200 rounded-xl p-6 hover:border-gray-900 transition-all hover:shadow-lg"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(escrow.status)}
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(escrow.status)}`}>
                          {escrow.status}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                          Cancelled by {escrow.cancelledBy}
                        </span>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-1">
                        {escrow.description}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        Escrow #{escrow.id}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-semibold text-gray-900">
                        ${parseFloat(escrow.amount).toLocaleString()}
                      </p>
                      <p className="text-sm font-semibold text-red-600">
                        Fee: ${escrow.cancellationFee} USDC
                      </p>
                    </div>
                  </div>

                  {/* Transaction Hash */}
                  {escrow.transactionHash && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Cancellation Transaction</p>
                          <p className="font-mono text-sm text-gray-900">
                            {escrow.transactionHash.slice(0, 10)}...{escrow.transactionHash.slice(-8)}
                          </p>
                        </div>
                        <a
                          href={`https://basescan.org/tx/${escrow.transactionHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
                        >
                          View on BaseScan
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-between text-sm border-t border-gray-200 pt-4">
                    <div className="flex gap-4">
                      <div>
                        <span className="text-gray-600">Buyer: </span>
                        <span className="font-mono text-gray-900">
                          {escrow.buyer.slice(0, 6)}...{escrow.buyer.slice(-4)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Seller: </span>
                        <span className="font-mono text-gray-900">
                          {escrow.seller.slice(0, 6)}...{escrow.seller.slice(-4)}
                        </span>
                      </div>
                    </div>
                    <span className="text-gray-600">
                      {new Date(escrow.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : filter !== 'messages' && filteredEscrows.length === 0 ? (
            <div className="text-center py-20 bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-200">
              <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {isConnected && address ? 'No escrows found' : 'Ready to Secure Your First Transaction?'}
              </h3>
              <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
                {isConnected && address
                  ? 'Create your first escrow to get started securing high-value transactions'
                  : 'Connect your wallet to create secure escrow agreements for luxury assets and high-value deals'
                }
              </p>
              <button
                onClick={handleCreateEscrow}
                className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors shadow-sm"
              >
                <Plus className="w-5 h-5" />
                {isConnected && address ? 'Create Escrow' : 'Connect Wallet'}
              </button>

              {/* Info Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12 max-w-4xl mx-auto">
                <div className="bg-white p-6 rounded-xl border border-gray-200 text-left">
                  <Shield className="w-8 h-8 text-gray-900 mb-3" />
                  <h4 className="font-semibold text-gray-900 mb-2 text-sm">Smart Contract Security</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Funds secured by audited smart contracts on Base blockchain with multi-signature protection
                  </p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 text-left">
                  <Clock className="w-8 h-8 text-gray-900 mb-3" />
                  <h4 className="font-semibold text-gray-900 mb-2 text-sm">Instant Settlements</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Automated fund release upon condition fulfillment - no delays, no manual processing
                  </p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 text-left">
                  <Info className="w-8 h-8 text-gray-900 mb-3" />
                  <h4 className="font-semibold text-gray-900 mb-2 text-sm">Full Transparency</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    All transactions recorded on-chain with complete visibility and immutable audit trail
                  </p>
                </div>
              </div>
            </div>
          ) : filter !== 'messages' ? (
            <div className="grid grid-cols-1 gap-4">
              {filteredEscrows.map((escrow) => (
                <Link
                  key={escrow.id}
                  to={`/escrow/${escrow.id}`}
                  className="bg-white/60 backdrop-blur-sm border-2 border-gray-200 rounded-xl p-6 hover:border-gray-900 transition-all hover:shadow-lg"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(escrow.status)}
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                            escrow.status
                          )}`}
                        >
                          {escrow.status}
                        </span>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-1">
                        {escrow.description}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        Escrow #{escrow.id}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-semibold text-gray-900">
                        {escrow.amount} ETH
                      </p>
                      <p className="text-sm text-gray-600">
                        {escrow.signCount}/{escrow.requiredSigs} signatures
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex gap-4">
                      <div>
                        <span className="text-gray-600">Buyer: </span>
                        <span className="font-mono text-gray-900">
                          {escrow.buyer.slice(0, 6)}...{escrow.buyer.slice(-4)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Seller: </span>
                        <span className="font-mono text-gray-900">
                          {escrow.seller.slice(0, 6)}...{escrow.seller.slice(-4)}
                        </span>
                      </div>
                    </div>
                    <span className="text-gray-600">
                      {new Date(escrow.createdAt * 1000).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : null}

        </div>
      </div>

      <Footer />
    </div>
  );
}
