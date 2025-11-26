/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_PINATA_JWT: string
  readonly VITE_RESEND_API_KEY: string
  readonly VITE_FROM_EMAIL: string
  readonly VITE_APP_URL: string
  readonly VITE_WALLETCONNECT_PROJECT_ID: string
  readonly VITE_DEV_MODE: string
  readonly VITE_ETH_PRICE_API: string
  readonly VITE_BASE_RPC_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
