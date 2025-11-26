import { useNavigate } from 'react-router-dom';
import { Shield, Clock, FileCheck, Plus, X } from 'lucide-react';
import { useState } from 'react';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import { useAuth } from '../context/AuthContext';

export default function Aviation() {
  const navigate = useNavigate();
  const { user, openLogin } = useAuth();
  const [expandedService, setExpandedService] = useState<number | null>(null);

  const handleCreateEscrow = (serviceType?: string) => {
    if (user) {
      navigate('/dashboard', { state: { category: 'aviation', serviceType } });
    } else {
      openLogin();
    }
  };

  const services = [
    {
      title: 'Private Jet Purchases',
      description: 'Complete acquisition protection for aircraft valued $2M-$100M+',
      value: 'Typical: $15M-45M',
      details: 'Secure multi-party escrow for new and pre-owned aircraft acquisitions. Includes pre-purchase inspection holdbacks, registration transfers, and title verification.',
      categories: ['New Aircraft', 'Pre-Owned Jets', 'Fractional Ownership'],
    },
    {
      title: 'Charter Service Bookings',
      description: 'Secure advance payments for private charter agreements',
      value: 'Typical: $25K-250K',
      details: 'Protection for charter deposits and advance bookings. Funds released upon flight completion or held for future flight credits.',
      categories: ['On-Demand Charters', 'Block Hours', 'Jet Cards'],
    },
    {
      title: 'Aircraft Leasing',
      description: 'Long-term lease agreements with milestone-based releases',
      value: 'Typical: $500K-5M annually',
      details: 'Escrow for operating leases and finance lease agreements with structured payment releases tied to delivery and condition milestones.',
      categories: ['Dry Lease', 'Wet Lease', 'Sale-Leaseback'],
    },
    {
      title: 'Maintenance Contracts',
      description: 'Scheduled maintenance and major overhaul agreements',
      value: 'Typical: $100K-2M',
      details: 'Secure payment for scheduled maintenance, major overhauls, and AOG situations with release upon completion certification.',
      categories: ['Scheduled Maintenance', 'Major Overhaul', 'AOG Service'],
    },
    {
      title: 'Pilot Services',
      description: 'Crew contracts and professional aviation services',
      value: 'Typical: $50K-500K',
      details: 'Contract escrow for pilot hiring, training programs, and crew management agreements.',
      categories: ['Pilot Contracts', 'Training Programs', 'Crew Management'],
    },
    {
      title: 'Hangar Rentals',
      description: 'Premium hangar space and FBO service agreements',
      value: 'Typical: $10K-100K',
      details: 'Secure deposits for long-term hangar leases and FBO service agreements at premium locations.',
      categories: ['Private Hangars', 'Shared Space', 'FBO Services'],
    },
  ];

  const benefits = [
    {
      icon: <Shield className="w-5 h-5" />,
      title: 'Secure Transactions',
      description: 'Multi-signature escrow protection for high-value aviation deals',
    },
    {
      icon: <Clock className="w-5 h-5" />,
      title: 'Fast Settlement',
      description: 'Automated release upon fulfillment of contract conditions',
    },
    {
      icon: <FileCheck className="w-5 h-5" />,
      title: 'Contract Storage',
      description: 'IPFS-backed immutable storage for purchase agreements',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden" style={{ height: '65vh', minHeight: '500px' }}>
        {/* Background Video */}
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/fucking%20videos/12427495_3840_2160_24fps.mp4" type="video/mp4" />
          </video>
          {/* Dark gradient overlay for sophistication */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
        </div>

        {/* Content - Left Aligned */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-12 h-full flex items-center">
          <div className="max-w-2xl">
            <h1 className="text-4xl sm:text-5xl font-light text-white mb-6 leading-tight">
              Aviation Escrow Services
            </h1>
            <p className="text-base text-white/90 mb-4 leading-relaxed max-w-xl">
              Institutional-grade escrow solutions for private jet acquisitions, charter agreements, and aviation services.
            </p>
            <p className="text-sm text-white/70 mb-8">
              Transactions from $25,000 to $100M+ • Smart contract secured • IPFS documented
            </p>
            <button
              onClick={() => handleCreateEscrow()}
              className="inline-flex items-center gap-2 bg-white text-gray-900 px-8 py-3 rounded-sm text-sm font-medium hover:bg-gray-100 transition-all group"
            >
              Initiate Escrow
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 px-6 sm:px-12 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Services</p>
            <h2 className="text-3xl font-light text-gray-900 mb-2">
              Select Your Aviation Service
            </h2>
            <p className="text-sm text-gray-600">
              Click any service to begin secure escrow creation
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 hover:border-gray-300 transition-all"
              >
                <button
                  onClick={() => setExpandedService(expandedService === index ? null : index)}
                  className="w-full p-6 text-left"
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-base font-medium text-gray-900 pr-2">
                      {service.title}
                    </h3>
                    <div className="flex-shrink-0 ml-2">
                      {expandedService === index ? (
                        <X className="w-4 h-4 text-gray-900 transition-transform duration-200" />
                      ) : (
                        <Plus className="w-4 h-4 text-gray-400 hover:text-gray-900 transition-all duration-200" />
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                    {service.description}
                  </p>
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500">Transaction Range</p>
                    <p className="text-sm font-medium text-gray-900 mt-1">{service.value}</p>
                  </div>
                </button>

                {expandedService === index && (
                  <div className="px-6 pb-6 border-t border-gray-100 pt-4 animate-in slide-in-from-top duration-200">
                    <p className="text-sm text-gray-700 mb-4 leading-relaxed">
                      {service.details}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {service.categories.map((category, idx) => (
                        <span
                          key={idx}
                          className="inline-block px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                    <button
                      onClick={() => handleCreateEscrow(service.title)}
                      className="w-full bg-gray-900 text-white py-2.5 text-sm font-medium hover:bg-gray-800 transition-colors"
                    >
                      Continue with {service.title}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Features */}
      <section className="py-20 px-6 sm:px-12 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Platform Security</p>
              <h2 className="text-3xl font-light text-gray-900 mb-6">
                Aviation-Grade Protection
              </h2>
              <p className="text-base text-gray-600 mb-8 leading-relaxed">
                Every transaction is secured by battle-tested smart contracts on Base blockchain, with multi-signature release mechanisms and immutable contract storage via IPFS.
              </p>

              <div className="space-y-6">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="w-10 h-10 bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 text-gray-900">
                      {benefit.icon}
                    </div>
                    <div>
                      <h3 className="text-base font-medium text-gray-900 mb-1">{benefit.title}</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-gray-200 p-8">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Transaction Overview</h3>
              <dl className="space-y-4">
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <dt className="text-sm text-gray-600">Platform Fee</dt>
                  <dd className="text-sm font-medium text-gray-900">2.0% (0-$1M)</dd>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <dt className="text-sm text-gray-600">Enterprise Tier</dt>
                  <dd className="text-sm font-medium text-gray-900">1.5% ($1M-$100M)</dd>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <dt className="text-sm text-gray-600">Settlement Time</dt>
                  <dd className="text-sm font-medium text-gray-900">Automated on approval</dd>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <dt className="text-sm text-gray-600">Supported Assets</dt>
                  <dd className="text-sm font-medium text-gray-900">USDC, USDT, ETH</dd>
                </div>
                <div className="flex justify-between py-3">
                  <dt className="text-sm text-gray-600">Contract Storage</dt>
                  <dd className="text-sm font-medium text-gray-900">IPFS (Immutable)</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
