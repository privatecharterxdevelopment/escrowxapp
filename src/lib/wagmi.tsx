import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { WagmiProvider as Wagmi } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '';

if (!projectId) {
  console.warn('Missing VITE_WALLETCONNECT_PROJECT_ID');
}

// AppKit metadata
const metadata = {
  name: 'PrivateCharterX Escrow',
  description: 'Decentralized Escrow as a Service for luxury assets and high-value transactions',
  url: 'https://escrow.privatecharterx.com',
  icons: ['https://escrow.privatecharterx.com/logo.svg'],
};

// Use both mainnet and testnet
const networks = [base, baseSepolia];

// Create Wagmi Adapter
export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
});

// Export wagmi config for use in other files
export const wagmiConfig = wagmiAdapter.wagmiConfig;

// Create AppKit
createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks,
  metadata,
  features: {
    analytics: true,
  },
});

const queryClient = new QueryClient();

export function WagmiProvider({ children }: { children: React.ReactNode }) {
  return (
    <Wagmi config={wagmiConfig as any}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </Wagmi>
  );
}
