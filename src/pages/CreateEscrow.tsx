import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, FileText, Shield, AlertCircle, CheckCircle,
  Users, DollarSign, Info, ArrowLeft, ArrowRight, Lock,
  Mail, CheckCircle2, Loader, Plus, X, Image
} from 'lucide-react';
import { useAccount, useSignMessage } from 'wagmi';
import { parseEther, formatEther } from 'ethers';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import { calculateCustomEscrowFee, formatFeeInfo } from '../lib/feeCalculator';
import { uploadEncryptedToIPFS, encryptKeyForWallet, isIPFSConfigured, uploadMultipleImagesToIPFS, ImageUploadResult } from '../lib/ipfs';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function CreateEscrow() {
  const navigate = useNavigate();
  const { user, isConnected, openLogin } = useAuth();
  const { address, chain } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const [step, setStep] = useState(1);
  const totalSteps = 5;

  const [formData, setFormData] = useState({
    // Step 1: Asset/Transfer Details
    title: '',
    description: '',
    assetType: 'service', // service, goods, real_estate, vehicle, other
    location: '',
    amountUSD: '',
    assetImages: [] as File[], // Up to 5 images

    // Step 2: Participants
    participants: [], // { wallet: '', email: '', role: 'buyer'/'seller'/'agent', verified: false }

    // Step 3: Contract Upload
    contractFile: null,
    contractText: '',

    // Step 4: Multi-Sig & Signatures
    requiredSigs: 2,
    signatures: [], // { address: '', signature: '', timestamp: '' }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [contractCID, setContractCID] = useState('');
  const [encryptionKeys, setEncryptionKeys] = useState({});
  const [imageCIDs, setImageCIDs] = useState<ImageUploadResult[]>([]);
  const [feeInfo, setFeeInfo] = useState(null);
  const [ethPrice, setEthPrice] = useState(3000); // Default ETH price
  const [newParticipant, setNewParticipant] = useState({ wallet: '', email: '', role: 'seller' });

  // Check authentication on mount only - don't repeatedly show modal
  useEffect(() => {
    if (!user && !isConnected) {
      openLogin();
    }
  }, []); // Empty deps - only run on mount

  // Calculate fees directly on USD amount
  useEffect(() => {
    if (formData.amountUSD && parseFloat(formData.amountUSD) > 0) {
      const amountUSD = parseFloat(formData.amountUSD);

      // Calculate fee percentage based on USD amount
      let feePercentage: number;
      let percentageString: string;

      if (amountUSD <= 1000000) {
        // Up to $1M: 2.0% fee
        feePercentage = 2.0;
        percentageString = '2.0%';
      } else if (amountUSD <= 100000000) {
        // $1M to $100M: 1.5% fee
        feePercentage = 1.5;
        percentageString = '1.5%';
      } else {
        // Over $100M: Custom pricing
        feePercentage = 0;
        percentageString = 'Custom';
      }

      const feeAmount = (amountUSD * feePercentage) / 100;

      setFeeInfo({
        fee: feeAmount,
        percentage: percentageString,
        tier: feePercentage === 2.0 ? 'Standard' : feePercentage === 1.5 ? 'Premium' : 'Enterprise',
        tierBps: feePercentage * 100,
        sellerAmount: amountUSD - feeAmount,
        totalRequired: amountUSD
      });
    } else {
      setFeeInfo(null);
    }
  }, [formData.amountUSD]);

  // Auto-add current user as buyer
  useEffect(() => {
    if (address && formData.participants.length === 0) {
      setFormData(prev => ({
        ...prev,
        participants: [{
          wallet: address.toLowerCase(),
          email: user?.email || '',
          role: 'buyer',
          verified: true
        }]
      }));
    }
  }, [address, user]);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('File too large. Max size: 10 MB');
        return;
      }

      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
      if (!allowedTypes.includes(file.type)) {
        setError('Invalid file type. Please upload PDF, DOC, DOCX, or TXT');
        return;
      }

      setFormData(prev => ({ ...prev, contractFile: file }));
      setError('');
    }
  };

  const removeContractFile = () => {
    setFormData(prev => ({ ...prev, contractFile: null }));
    setContractCID('');
    setEncryptionKeys({});
    setUploadProgress(0);
    setError('');
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setError('');

    if (formData.assetImages.length + files.length > 5) {
      setError('Maximum 5 images allowed');
      return;
    }

    const validImages = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        setError('Each image must be less than 5 MB');
        return false;
      }
      if (!file.type.startsWith('image/')) {
        setError('Only image files are allowed');
        return false;
      }
      return true;
    });

    setFormData(prev => ({
      ...prev,
      assetImages: [...prev.assetImages, ...validImages].slice(0, 5)
    }));
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      assetImages: prev.assetImages.filter((_, i) => i !== index)
    }));
  };

  const addParticipant = () => {
    setError('');

    if (!newParticipant.wallet || !newParticipant.email) {
      setError('Please fill in wallet address and email');
      return;
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(newParticipant.wallet)) {
      setError('Invalid wallet address');
      return;
    }

    setFormData(prev => ({
      ...prev,
      participants: [...prev.participants, { ...newParticipant, verified: false }]
    }));

    setNewParticipant({ wallet: '', email: '', role: 'seller' });
  };

  const removeParticipant = (index) => {
    setFormData(prev => ({
      ...prev,
      participants: prev.participants.filter((_, i) => i !== index)
    }));
  };

  const uploadContract = async () => {
    if (!formData.contractFile) {
      setError('Please select a contract file');
      return false;
    }

    setLoading(true);
    setUploadProgress(0);

    try {
      // Check if IPFS is configured
      const ipfsConfigured = isIPFSConfigured();
      const devMode = import.meta.env.VITE_DEV_MODE === 'true';

      if (!ipfsConfigured && !devMode) {
        setError(
          'IPFS not configured. Please add VITE_PINATA_JWT to your .env file, or set VITE_DEV_MODE=true to skip IPFS upload during development.'
        );
        setLoading(false);
        return false;
      }

      if (devMode && !ipfsConfigured) {
        // Development mode: Skip IPFS upload and use mock CID
        console.log('Development mode: Skipping IPFS upload');
        setContractCID('bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi'); // Mock CID
        setUploadProgress(100);
        setEncryptionKeys({
          [address?.toLowerCase() || '']: 'dev_mock_encryption_key'
        });
        setLoading(false);
        return true;
      }

      // Production mode: Upload to IPFS
      const result = await uploadEncryptedToIPFS(formData.contractFile);
      setContractCID(result.cid);
      setUploadProgress(100);

      // Encrypt the AES key for each participant
      const keys = {};
      for (const participant of formData.participants) {
        if (participant.wallet === address?.toLowerCase()) {
          const encryptedKey = await encryptKeyForWallet(
            result.encryptionKey,
            participant.wallet,
            signMessageAsync
          );
          keys[participant.wallet] = encryptedKey;
        }
      }
      setEncryptionKeys(keys);

      setLoading(false);
      return true;
    } catch (err) {
      console.error('Upload failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';

      if (errorMessage.includes('Pinata JWT not configured')) {
        setError(
          'IPFS upload requires Pinata JWT. Please:\n1. Get a FREE account at https://pinata.cloud\n2. Create API key at https://app.pinata.cloud/developers/api-keys\n3. Add VITE_PINATA_JWT to your .env file\n\nOr set VITE_DEV_MODE=true to skip upload during development.'
        );
      } else {
        setError(`Failed to upload contract to IPFS: ${errorMessage}`);
      }

      setLoading(false);
      return false;
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      // Step 1: Upload contract to IPFS first
      const uploaded = await uploadContract();
      if (!uploaded) {
        setLoading(false);
        return;
      }

      // Step 2: Upload images to IPFS (if any)
      let uploadedImages: ImageUploadResult[] = [];
      if (formData.assetImages.length > 0) {
        try {
          setUploadProgress(10);
          uploadedImages = await uploadMultipleImagesToIPFS(formData.assetImages);
          setImageCIDs(uploadedImages);
          setUploadProgress(50);
        } catch (imgError) {
          console.error('Image upload failed:', imgError);
          // Continue without images if upload fails
          setError('Warning: Image upload failed. Continuing without images.');
        }
      }

      // Step 3: Create escrow record in database
      const { data, error: dbError } = await supabase
        .from('escrows')
        .insert({
          title: formData.title,
          description: formData.description,
          asset_type: formData.assetType,
          location: formData.location,
          amount_usd: parseFloat(formData.amountUSD),
          amount_eth: parseFloat(formData.amountUSD) / ethPrice, // Convert USD to ETH
          contract_cid: contractCID,
          encryption_keys: encryptionKeys,
          image_cids: uploadedImages.map(img => img.cid), // Store image CIDs
          participants: formData.participants,
          required_signatures: formData.requiredSigs,
          creator_address: address?.toLowerCase(),
          status: 'pending',
          chain_id: chain?.id || 8453, // Base mainnet
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Navigate to escrow detail page
      navigate(`/escrow/${data.id}`);
    } catch (err) {
      console.error('Failed to create escrow:', err);
      setError('Failed to create escrow. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = async () => {
    setError('');

    if (step === 1) {
      if (!formData.title || !formData.description || !formData.amountUSD) {
        setError('Please fill in all required fields');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (formData.participants.length < 2) {
        setError('Please add at least one seller or counterparty');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      // Just validate file is selected, don't upload yet
      if (!formData.contractFile) {
        setError('Please select a contract file');
        return;
      }
      setStep(4);
    } else if (step === 4) {
      setStep(5);
    }
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Header />

      {/* Progress Steps */}
      <div className="bg-white border-b border-gray-200 pt-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-6">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4, 5].map((s, index) => (
              <div key={s} className="flex items-center flex-1">
                <div className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                      s <= step
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    {s}
                  </div>
                  <div className="ml-3 hidden sm:block">
                    <div className={`text-xs font-medium ${s <= step ? 'text-gray-900' : 'text-gray-400'}`}>
                      {s === 1 && 'Details'}
                      {s === 2 && 'Participants'}
                      {s === 3 && 'Contract'}
                      {s === 4 && 'Multi-Sig'}
                      {s === 5 && 'Review'}
                    </div>
                  </div>
                </div>
                {index < 4 && (
                  <div className={`flex-1 h-px mx-4 ${s < step ? 'bg-gray-900' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Form */}
          <div className="lg:col-span-2">
            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

        {/* Step 1: Asset Details */}
        {step === 1 && (
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Transaction Details</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Private Jet Charter - Miami to Monaco"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Detailed description of the transaction..."
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Asset Type
                  </label>
                  <select
                    value={formData.assetType}
                    onChange={(e) => setFormData(prev => ({ ...prev, assetType: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  >
                    <option value="service">Service</option>
                    <option value="goods">Goods</option>
                    <option value="vehicle">Vehicle</option>
                    <option value="real_estate">Real Estate</option>
                    <option value="art">Art & Collectibles</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Amount (USD) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      value={formData.amountUSD}
                      onChange={(e) => setFormData(prev => ({ ...prev, amountUSD: e.target.value }))}
                      placeholder="0.00"
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Location (Optional)
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="e.g., Monaco, France"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>

              {/* Asset Images Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Asset Images (Optional - Max 5)
                </label>
                <p className="text-xs text-gray-600 mb-3">
                  Upload images of the asset/service (max 5 MB each). Images will be publicly visible on IPFS.
                </p>

                <div className="space-y-3">
                  {/* Upload Button */}
                  {formData.assetImages.length < 5 && (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <input
                        type="file"
                        id="image-upload"
                        multiple
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                      <label
                        htmlFor="image-upload"
                        className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors cursor-pointer"
                      >
                        <Image className="w-4 h-4" />
                        Select Images ({formData.assetImages.length}/5)
                      </label>
                    </div>
                  )}

                  {/* Image Preview Grid */}
                  {formData.assetImages.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                      {formData.assetImages.map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={URL.createObjectURL(image)}
                            alt={`Asset ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border border-gray-200"
                          />
                          <button
                            onClick={() => removeImage(index)}
                            className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <p className="text-xs text-gray-600 mt-1 truncate">
                            {image.name}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Fee Preview */}
              {feeInfo && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Fee Estimate</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Escrow Amount:</span>
                      <span className="font-medium text-gray-900">${parseFloat(formData.amountUSD).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Platform Fee ({feeInfo.percentage}):</span>
                      <span className="font-medium text-gray-900">${feeInfo.fee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cancellation Insurance:</span>
                      <span className="font-medium text-gray-900">$99.00</span>
                    </div>
                    <div className="pt-2 border-t border-gray-200 flex justify-between">
                      <span className="font-medium text-gray-900">Total Required:</span>
                      <span className="font-semibold text-gray-900">${(feeInfo.totalRequired + 99).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs text-amber-800">
                      <strong>Cancellation Policy:</strong> If you cancel after funding, a $99 fee applies. Full refund before funding or if seller cancels.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Participants */}
        {step === 2 && (
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Add Participants</h2>

            {/* Current Participants */}
            <div className="space-y-3 mb-6">
              {formData.participants.map((participant, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900">{participant.role.toUpperCase()}</span>
                      {participant.verified && (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                    <div className="text-xs text-gray-600 font-mono">{participant.wallet}</div>
                    {participant.email && (
                      <div className="text-xs text-gray-500 mt-1">{participant.email}</div>
                    )}
                  </div>
                  {!participant.verified && (
                    <button
                      onClick={() => removeParticipant(index)}
                      className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4 text-gray-600" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add New Participant */}
            <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-4">Add Counterparty</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                  <select
                    value={newParticipant.role}
                    onChange={(e) => setNewParticipant(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  >
                    <option value="seller">Seller</option>
                    <option value="agent">Agent/Broker</option>
                    <option value="arbitrator">Arbitrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Wallet Address</label>
                  <input
                    type="text"
                    value={newParticipant.wallet}
                    onChange={(e) => setNewParticipant(prev => ({ ...prev, wallet: e.target.value.toLowerCase() }))}
                    placeholder="0x..."
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email (Optional)</label>
                  <input
                    type="email"
                    value={newParticipant.email}
                    onChange={(e) => setNewParticipant(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="email@example.com"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>

                <button
                  onClick={addParticipant}
                  className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Participant
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Contract Upload */}
        {step === 3 && (
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Upload Contract</h2>
              {import.meta.env.VITE_DEV_MODE === 'true' && (
                <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded-full border border-amber-200">
                  DEV MODE - IPFS Upload Skipped
                </span>
              )}
            </div>

            <div className="space-y-6">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <input
                  type="file"
                  id="contract-upload"
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.txt"
                  className="hidden"
                />
                <label
                  htmlFor="contract-upload"
                  className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  Select Contract File
                </label>
                <p className="text-xs text-gray-500 mt-3">PDF, DOC, or TXT (Max 10 MB)</p>
              </div>

              {formData.contractFile && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-green-900">{formData.contractFile.name}</p>
                        <p className="text-xs text-green-700">
                          {(formData.contractFile.size / 1024 / 1024).toFixed(2)} MB - Ready to upload
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={removeContractFile}
                      className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors border border-red-200"
                    >
                      <X className="w-4 h-4" />
                      Remove
                    </button>
                  </div>
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-800">
                      <strong>Note:</strong> File will be encrypted and uploaded to IPFS when you create the escrow in the final step.
                    </p>
                  </div>
                </div>
              )}

              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Uploading to IPFS...</span>
                    <span className="font-medium text-gray-900">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gray-900 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {contractCID && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Lock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900 mb-1">Contract Encrypted & Stored</p>
                      <p className="text-xs text-blue-700 font-mono break-all">CID: {contractCID}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-600">
                    <p className="font-medium text-gray-900 mb-1">How It Works</p>
                    <ul className="list-disc list-inside space-y-1 mt-2">
                      <li>Select your contract file (PDF, DOC, DOCX, or TXT)</li>
                      <li>Review all details in the final step</li>
                      <li>File will be encrypted with AES-256 during final submission</li>
                      <li>Encrypted file stored on IPFS (Pinata)</li>
                      <li>Only authorized participants can decrypt and view</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Multi-Signature Setup */}
        {step === 4 && (
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Multi-Signature Configuration</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Required Signatures to Release Funds
                </label>
                <select
                  value={formData.requiredSigs}
                  onChange={(e) => setFormData(prev => ({ ...prev, requiredSigs: parseInt(e.target.value) }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                >
                  {Array.from({ length: formData.participants.length }, (_, i) => i + 1).map(num => (
                    <option key={num} value={num}>
                      {num} of {formData.participants.length} signatures
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Authorized Signers</h3>
                <div className="space-y-2">
                  {formData.participants.map((participant, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-gray-600" />
                        <span className="text-gray-900 font-medium">{participant.role.toUpperCase()}</span>
                      </div>
                      <span className="text-gray-600 font-mono text-xs">{participant.wallet}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-700">
                    <p className="font-medium text-blue-900 mb-1">How Multi-Signature Works</p>
                    <p>The smart contract requires {formData.requiredSigs} signature(s) from the {formData.participants.length} authorized participants before funds can be released. This ensures security and mutual agreement.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Review & Submit */}
        {step === 5 && (
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Review & Submit</h2>

            <div className="space-y-6">
              {/* Transaction Summary */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Transaction Summary</h3>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Title:</span>
                    <span className="font-medium text-gray-900">{formData.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-medium text-gray-900">${parseFloat(formData.amountUSD).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Asset Type:</span>
                    <span className="font-medium text-gray-900 capitalize">{formData.assetType.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Participants:</span>
                    <span className="font-medium text-gray-900">{formData.participants.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Required Signatures:</span>
                    <span className="font-medium text-gray-900">{formData.requiredSigs} of {formData.participants.length}</span>
                  </div>
                </div>
              </div>

              {/* Fee Breakdown */}
              {feeInfo && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Fee Breakdown</h3>
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Escrow Amount:</span>
                      <span className="font-medium text-gray-900">${parseFloat(formData.amountUSD).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Platform Fee ({feeInfo.percentage}):</span>
                      <span className="font-medium text-gray-900">${feeInfo.fee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cancellation Insurance:</span>
                      <span className="font-medium text-gray-900">$99.00</span>
                    </div>
                    <div className="pt-2 border-t border-gray-200 flex justify-between">
                      <span className="font-medium text-gray-900">Total Required:</span>
                      <span className="font-semibold text-gray-900">${(feeInfo.totalRequired + 99).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Contract Info */}
              {formData.contractFile && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Contract File</h3>
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-gray-600 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{formData.contractFile.name}</p>
                          <p className="text-xs text-gray-600">
                            {(formData.contractFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded">
                        Pending Upload
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-700">
                    <p className="font-medium text-blue-900 mb-1">What Happens When You Click "Create Escrow"</p>
                    <ol className="list-decimal list-inside space-y-1 mt-2">
                      <li>Contract file will be encrypted with AES-256</li>
                      <li>Encrypted file uploaded to IPFS (Pinata)</li>
                      <li>Escrow record created in database</li>
                      <li>You'll be directed to fund the smart contract</li>
                      <li>All participants will be notified</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={prevStep}
            disabled={step === 1}
            className="flex items-center gap-2 px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </button>

          {step < totalSteps ? (
            <button
              onClick={nextStep}
              disabled={loading}
              className="flex items-center gap-2 bg-gray-900 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 bg-gray-900 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  {uploadProgress > 0 && uploadProgress < 100 ? 'Uploading to IPFS...' : 'Creating Escrow...'}
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Create Escrow & Upload Contract
                </>
              )}
            </button>
          )}
        </div>
          </div>

          {/* Right Column: Live Preview - Sticky */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border border-gray-700 p-6 text-white shadow-2xl">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Info className="w-5 h-5" />
                  Live Preview
                </h3>

                {/* Transaction Details */}
                <div className="space-y-4">
                  <div>
                    <div className="text-xs text-gray-400 mb-1">Transaction Title</div>
                    <div className="text-sm font-medium">
                      {formData.title || <span className="text-gray-500 italic">Not set</span>}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-400 mb-1">Description</div>
                    <div className="text-sm">
                      {formData.description ? (
                        <span className="line-clamp-3">{formData.description}</span>
                      ) : (
                        <span className="text-gray-500 italic">Not set</span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-gray-400 mb-1">Amount</div>
                      <div className="text-lg font-bold">
                        {formData.amountUSD ? `$${parseFloat(formData.amountUSD).toLocaleString()}` : <span className="text-gray-500 text-sm italic">$0</span>}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 mb-1">Asset Type</div>
                      <div className="text-sm capitalize">
                        {formData.assetType.replace('_', ' ')}
                      </div>
                    </div>
                  </div>

                  {formData.location && (
                    <div>
                      <div className="text-xs text-gray-400 mb-1">Location</div>
                      <div className="text-sm">{formData.location}</div>
                    </div>
                  )}

                  {/* Participants Preview */}
                  {formData.participants.length > 0 && (
                    <div>
                      <div className="text-xs text-gray-400 mb-2">Participants ({formData.participants.length})</div>
                      <div className="space-y-2">
                        {formData.participants.map((p, i) => (
                          <div key={i} className="text-xs bg-gray-800 rounded px-2 py-1.5 flex items-center justify-between">
                            <span className="font-medium uppercase text-gray-300">{p.role}</span>
                            <span className="font-mono text-gray-400">{p.wallet.slice(0, 6)}...{p.wallet.slice(-4)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Contract File Preview */}
                  {formData.contractFile && (
                    <div>
                      <div className="text-xs text-gray-400 mb-1">Contract File</div>
                      <div className="text-xs bg-green-900/30 border border-green-500/30 rounded px-2 py-1.5 flex items-center gap-2">
                        <CheckCircle className="w-3 h-3 text-green-400" />
                        <span className="text-green-200 truncate">{formData.contractFile.name}</span>
                      </div>
                    </div>
                  )}

                  {/* Multi-Sig Preview */}
                  {step >= 4 && (
                    <div>
                      <div className="text-xs text-gray-400 mb-1">Multi-Signature</div>
                      <div className="text-sm">
                        <span className="font-bold">{formData.requiredSigs}</span> of <span className="font-bold">{formData.participants.length}</span> signatures required
                      </div>
                    </div>
                  )}

                  {/* Fee Preview */}
                  {feeInfo && formData.amountUSD && (
                    <div className="pt-4 border-t border-gray-700">
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Escrow Amount:</span>
                          <span className="font-medium">${parseFloat(formData.amountUSD).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Platform Fee ({feeInfo.percentage}):</span>
                          <span className="font-medium">${feeInfo.fee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Cancellation Insurance:</span>
                          <span className="font-medium">$99.00</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-gray-700">
                          <span className="font-semibold text-white">Total Required:</span>
                          <span className="font-bold text-lg text-white">${(feeInfo.totalRequired + 99).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step Indicator */}
                  <div className="pt-4 border-t border-gray-700">
                    <div className="text-xs text-gray-400 mb-2">Progress</div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-700 rounded-full h-1.5">
                        <div
                          className="bg-white h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${(step / totalSteps) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium">{step}/{totalSteps}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
