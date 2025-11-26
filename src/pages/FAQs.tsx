import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';

export default function FAQs() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

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

      <section className="pt-32 pb-16 sm:pb-24 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-semibold text-gray-900 mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-base text-gray-600 max-w-2xl mx-auto">
              Everything you need to know about using PrivateCharterX Escrow
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white/60 backdrop-blur-sm border border-gray-200 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-white/80 transition-colors"
                >
                  <span className="text-sm font-medium text-gray-900 pr-4">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-600 flex-shrink-0 transition-transform duration-200 ${
                      openFAQ === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-200 ${
                    openFAQ === index ? 'max-h-96' : 'max-h-0'
                  }`}
                >
                  <div className="px-6 pb-4 text-sm text-gray-600 leading-relaxed">
                    {faq.answer}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
