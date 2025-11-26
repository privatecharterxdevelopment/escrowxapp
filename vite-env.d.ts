/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_ESCROW_CONTRACT_ADDRESS: string;
  readonly VITE_ESCROW_NETWORK: string;
  readonly VITE_WALLETCONNECT_PROJECT_ID: string;
  readonly VITE_BASE_RPC_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  ethereum?: any;
}
