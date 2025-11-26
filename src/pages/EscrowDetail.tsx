import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Shield, Clock, CheckCircle, FileText, Users } from 'lucide-react';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

export default function EscrowDetail() {
  const { id } = useParams<{ id: string }>();
  const { isConnected } = useAuth();
  const [escrow, setEscrow] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch escrow details from smart contract
    // const fetchEscrow = async () => {
    //   const contract = await getEscrowContract();
    //   const data = await contract.getEscrow(id);
    //   setEscrow(data);
    //   setLoading(false);
    // };
    // fetchEscrow();

    // Placeholder
    setEscrow({
      id,
      buyer: '0x1234...5678',
      seller: '0x8765...4321',
      amount: '10.5',
      platformFee: '0.21',
      totalDeposit: '10.71',
      status: 'Active',
      description: 'Private Jet Charter Payment',
      contractCID: 'Qm...',
      signers: ['0x1111...1111', '0x2222...2222'],
      requiredSigs: 2,
      signCount: 1,
      createdAt: Date.now() / 1000,
    });
    setLoading(false);
  }, [id]);

  const handleSign = async () => {
    try {
      toast.success('Signature added successfully');
      // TODO: Call smart contract signRelease function
    } catch (error) {
      toast.error('Failed to sign escrow');
    }
  };

  const handleRefund = async () => {
    try {
      toast.success('Refund initiated');
      // TODO: Call smart contract refund function
    } catch (error) {
      toast.error('Failed to refund escrow');
    }
  };

  const handleDispute = async () => {
    try {
      toast.success('Dispute raised');
      // TODO: Call smart contract raiseDispute function
    } catch (error) {
      toast.error('Failed to raise dispute');
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="pt-24 pb-16 px-4 sm:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Connect Your Wallet</h1>
            <p className="text-sm text-gray-600">Connect your wallet to view escrow details</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (loading || !escrow) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="pt-24 pb-16 px-4 sm:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4 animate-spin" />
            <p className="text-sm text-gray-600">Loading escrow details...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="pt-24 pb-16 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          {/* Escrow Header */}
          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h1 className="text-xl font-semibold text-gray-900">{escrow.description}</h1>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  escrow.status === 'Active'
                    ? 'bg-blue-100 text-blue-800'
                    : escrow.status === 'Released'
                    ? 'bg-green-100 text-green-800'
                    : escrow.status === 'Refunded'
                    ? 'bg-gray-100 text-gray-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {escrow.status}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-4">Escrow #{escrow.id}</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-600 mb-1">Escrow Amount</p>
                <p className="text-lg font-semibold text-gray-900">{escrow.amount} ETH</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Platform Fee (2%)</p>
                <p className="text-lg font-semibold text-gray-900">{escrow.platformFee} ETH</p>
              </div>
            </div>
          </div>

          {/* Parties */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Parties
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-600 mb-1">Buyer</p>
                <p className="font-mono text-sm text-gray-900">{escrow.buyer}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Seller</p>
                <p className="font-mono text-sm text-gray-900">{escrow.seller}</p>
              </div>
            </div>
          </div>

          {/* Multi-Sig Progress */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Signature Progress
            </h2>
            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-600 mb-2">
                <span>
                  {escrow.signCount} of {escrow.requiredSigs} signatures
                </span>
                <span>{Math.round((escrow.signCount / escrow.requiredSigs) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${(escrow.signCount / escrow.requiredSigs) * 100}%` }}
                />
              </div>
            </div>
            <div className="space-y-2">
              {escrow.signers.map((signer: string, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg"
                >
                  <span className="font-mono text-xs text-gray-900">{signer}</span>
                  <span className="text-xs text-gray-600">
                    {index < escrow.signCount ? '✓ Signed' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Contract Document */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Contract Document
            </h2>
            <p className="text-xs text-gray-600 mb-3">IPFS CID: {escrow.contractCID}</p>
            <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              View on IPFS →
            </button>
          </div>

          {/* Actions */}
          {escrow.status === 'Active' && (
            <div className="bg-gray-50 rounded-xl p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Actions</h2>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleSign}
                  className="bg-gray-900 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  Sign Release
                </button>
                <button
                  onClick={handleRefund}
                  className="border-2 border-gray-900 text-gray-900 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-900 hover:text-white transition-colors"
                >
                  Refund
                </button>
                <button
                  onClick={handleDispute}
                  className="border-2 border-red-600 text-red-600 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-red-600 hover:text-white transition-colors"
                >
                  Raise Dispute
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
