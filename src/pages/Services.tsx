import { useNavigate } from 'react-router-dom';
import { ArrowRight, Briefcase } from 'lucide-react';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import { useAuth } from '../context/AuthContext';

export default function Services() {
  const navigate = useNavigate();
  const { user, openLogin } = useAuth();

  const handleCreateEscrow = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      openLogin();
    }
  };
  const useCases = [
    'Legal Services',
    'Consulting Projects',
    'Construction Contracts',
    'Real Estate Transactions',
    'Business Acquisitions',
    'Freelance & Contractor Payments',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100">
      <Header />

      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 py-32 sm:py-40 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200 mb-6">
            <Briefcase className="w-8 h-8 text-gray-700" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-4">
            Professional Services Escrow
          </h1>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto mb-8">
            Secure milestone-based payments for professional services
          </p>
          <button
            onClick={handleCreateEscrow}
            className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors group"
          >
            Create Services Escrow
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-5 h-8 border border-gray-300 rounded-full flex items-start justify-center p-1">
            <div className="w-1 h-2 bg-gray-400 rounded-full" />
          </div>
        </div>
      </section>

      <section className="py-16 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-semibold text-gray-900 mb-8 text-center">
            Professional Services Use Cases
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {useCases.map((useCase, index) => (
              <div
                key={index}
                className="bg-white/60 backdrop-blur-sm p-5 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-white/80 transition-all"
              >
                <p className="text-sm font-medium text-gray-900">{useCase}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
