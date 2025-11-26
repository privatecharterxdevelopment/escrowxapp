import { Shield, Upload, Users, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import { Link } from 'react-router-dom';

export default function HowItWorks() {
  const steps = [
    {
      icon: <Upload className="w-6 h-6" />,
      title: 'Create Escrow',
      description: 'Upload your contract to IPFS, define escrow terms, set the amount, and select authorized signers',
      details: [
        'Upload encrypted contract documents',
        'Define buyer and seller addresses',
        'Set escrow amount in ETH',
        'Configure multi-sig requirements',
      ],
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Deposit Funds',
      description: 'Buyer deposits funds to the smart contract. Funds are locked until release conditions are met',
      details: [
        'Platform fee automatically calculated',
        'Funds secured in smart contract',
        'Transparent on-chain record',
        'No intermediary custody',
      ],
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Multi-Sig Approval',
      description: 'Authorized signers review and approve the transaction according to pre-defined conditions',
      details: [
        'Configurable signature threshold',
        'Real-time signature tracking',
        'Notification for all parties',
        'Dispute mechanism available',
      ],
    },
    {
      icon: <CheckCircle className="w-6 h-6" />,
      title: 'Automatic Release',
      description: 'Once signature threshold is met, funds are automatically released to seller minus platform fee',
      details: [
        'Instant settlement',
        'Transparent fee deduction',
        'On-chain transaction record',
        'Email & on-chain notifications',
      ],
    },
  ];

  const features = [
    {
      icon: <Shield className="w-5 h-5" />,
      title: 'Progressive Fees',
      description: '2.0% for 0-$1M, 1.5% for $1M-$100M, Custom for >$100M',
    },
    {
      icon: <AlertCircle className="w-5 h-5" />,
      title: 'Dispute Resolution',
      description: 'Built-in dispute mechanism with admin review process',
    },
    {
      icon: <RefreshCw className="w-5 h-5" />,
      title: 'Emergency Timeout',
      description: '180-day safety mechanism for disputed or stale escrows',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-16 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-4">
            How It Works
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Simple, secure, and transparent escrow process powered by smart contracts
          </p>
        </div>
      </section>

      {/* Process Steps */}
      <section className="py-16 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="space-y-12">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`flex flex-col ${
                  index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                } gap-8 items-center`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center text-base font-semibold">
                      {index + 1}
                    </div>
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600">
                      {step.icon}
                    </div>
                  </div>
                  <h3 className="text-xl font-medium text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-sm text-gray-600 mb-4">{step.description}</p>
                  <ul className="space-y-2">
                    {step.details.map((detail, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <span className="text-xs text-gray-600">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex-1 bg-white/40 backdrop-blur-sm rounded-xl h-48 flex items-center justify-center border border-gray-200">
                  <div className="text-gray-300">{step.icon}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="py-16 px-4 sm:px-8 bg-white/40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-semibold text-gray-900 mb-8 text-center">
            Key Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {features.map((feature, index) => (
              <div key={index} className="bg-white/60 backdrop-blur-sm p-6 rounded-xl border border-gray-200">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mb-3 text-gray-600">
                  {feature.icon}
                </div>
                <h3 className="text-base font-medium text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-xs text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-16 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
            Battle-Tested Security
          </h2>
          <div className="bg-white/60 backdrop-blur-sm p-6 rounded-xl border border-gray-200">
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <strong className="text-sm text-gray-900">ReentrancyGuard Protection:</strong>
                  <span className="text-xs text-gray-600"> Prevents malicious contract calls</span>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <strong className="text-sm text-gray-900">OpenZeppelin Standards:</strong>
                  <span className="text-xs text-gray-600"> Built on industry-standard security libraries</span>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <strong className="text-sm text-gray-900">Immutable Contract Storage:</strong>
                  <span className="text-xs text-gray-600"> IPFS ensures permanent document records</span>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <strong className="text-sm text-gray-900">On-Chain Fee Enforcement:</strong>
                  <span className="text-xs text-gray-600"> Fees calculated and enforced by smart contract</span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 sm:px-8 bg-white/40 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Ready to get started?
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            Create your first escrow in minutes
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Create Escrow Now
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
