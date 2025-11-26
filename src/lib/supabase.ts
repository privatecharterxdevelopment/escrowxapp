import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'privatecharterx-escrow-auth-token',
    storage: window.localStorage,
  },
});

// Database types for Escrow
export interface User {
  id: string;
  wallet_address: string;
  username: string | null;
  email: string | null;
  profile_image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Escrow {
  id: string;
  escrow_number: string;

  // Parties
  buyer_wallet: string;
  seller_wallet: string;
  arbitrator_wallet: string | null;

  // Escrow Details
  category: 'aviation' | 'yachting' | 'watches' | 'cars' | 'art' | 'services';
  title: string;
  description: string;

  // Financial
  amount: number;
  currency: string;
  fee_percentage: number;
  fee_amount: number;

  // Smart Contract
  contract_address: string | null;
  chain_id: number;

  // Status
  status: 'draft' | 'pending_approval' | 'active' | 'in_dispute' | 'completed' | 'cancelled' | 'refunded';

  // Documents
  contract_ipfs_hash: string | null;
  documents: Record<string, any>[] | null;

  // Milestones
  milestones: Record<string, any>[] | null;
  current_milestone: number | null;

  // Dispute
  dispute_reason: string | null;
  dispute_initiated_by: string | null;
  dispute_initiated_at: string | null;
  dispute_resolved_at: string | null;

  // Timestamps
  created_at: string;
  updated_at: string;
  approved_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
}

export interface EscrowTransaction {
  id: string;
  escrow_id: string;
  wallet_address: string;
  amount: number;
  tx_hash: string;
  block_number: number | null;
  status: 'pending' | 'confirmed' | 'failed';
  type: 'deposit' | 'release' | 'refund' | 'fee_payment' | 'dispute_deposit';
  created_at: string;
  confirmed_at: string | null;
}

export interface EscrowMessage {
  id: string;
  escrow_id: string;
  sender_wallet: string;
  message: string;
  is_system: boolean;
  created_at: string;
}

// Storage helpers
export const uploadEscrowDocument = async (
  file: File,
  escrowId: string,
  documentType: string
) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${escrowId}-${documentType}-${Date.now()}.${fileExt}`;
  const filePath = `${escrowId}/${fileName}`;

  const { data, error } = await supabase.storage
    .from('escrow-documents')
    .upload(filePath, file);

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from('escrow-documents')
    .getPublicUrl(filePath);

  return publicUrl;
};

export const uploadProfileImage = async (file: File, walletAddress: string) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${walletAddress}-${Date.now()}.${fileExt}`;
  const filePath = fileName;

  const { data, error } = await supabase.storage
    .from('user-profiles')
    .upload(filePath, file);

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from('user-profiles')
    .getPublicUrl(filePath);

  return publicUrl;
};
