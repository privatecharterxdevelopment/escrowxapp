import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { WagmiProvider } from './lib/wagmi';
import { AuthProvider } from './context/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import CookieBanner from './components/CookieBanner';

// Pages
import Home from './pages/Home';
import Aviation from './pages/Aviation';
import Yachting from './pages/Yachting';
import Watches from './pages/Watches';
import Cars from './pages/Cars';
import Art from './pages/Art';
import Services from './pages/Services';
import HowItWorks from './pages/HowItWorks';
import Dashboard from './pages/Dashboard';
import CreateEscrow from './pages/CreateEscrow';
import EscrowDetail from './pages/EscrowDetail';
import AuthCallback from './pages/AuthCallback';

const queryClient = new QueryClient();

function App() {
  return (
    <WagmiProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <Toaster
              position="top-center"
              toastOptions={{
                duration: 3000,
                style: {
                  background: '#fff',
                  color: '#1f2937',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  padding: '12px 16px',
                  fontSize: '14px',
                  fontWeight: '500',
                },
                success: {
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#fff',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/aviation" element={<Aviation />} />
              <Route path="/yachting" element={<Yachting />} />
              <Route path="/watches" element={<Watches />} />
              <Route path="/cars" element={<Cars />} />
              <Route path="/art" element={<Art />} />
              <Route path="/services" element={<Services />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/create-escrow" element={<CreateEscrow />} />
              <Route path="/escrow/:id" element={<EscrowDetail />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
            </Routes>
            <CookieBanner />
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
