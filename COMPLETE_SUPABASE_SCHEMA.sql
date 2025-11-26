-- ============================================================
-- COMPLETE SUPABASE SCHEMA FOR ESCROW SYSTEM
-- PrivateCharterX Escrow - All Tables, Indexes, and Policies
-- ============================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. USERS TABLE
-- Stores user profiles and wallet information
-- ============================================================

CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE,
  username TEXT UNIQUE,
  wallet_address TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for users table
CREATE INDEX idx_users_wallet ON public.users(wallet_address);
CREATE INDEX idx_users_email ON public.users(email);

-- RLS Policies for users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.users FOR SELECT
  USING (auth.uid()::text = id::text OR wallet_address = auth.jwt() ->> 'wallet_address');

CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  USING (auth.uid()::text = id::text)
  WITH CHECK (auth.uid()::text = id::text);

CREATE POLICY "Anyone can create a user profile"
  ON public.users FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- 2. ESCROW TRANSACTIONS TABLE
-- Main table for all escrow transactions
-- ============================================================

CREATE TABLE public.escrow_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Basic Information
  title TEXT NOT NULL,
  description TEXT,
  asset_type TEXT, -- service, goods, real_estate, vehicle, art, other
  location TEXT,

  -- Financial Details
  amount_usd DECIMAL(18, 2) NOT NULL,
  amount_eth DECIMAL(18, 8),
  platform_fee DECIMAL(18, 2),
  cancellation_fee DECIMAL(18, 2) DEFAULT 99.00,

  -- Contract & Images
  contract_cid TEXT, -- IPFS CID for encrypted contract
  encryption_keys JSONB, -- Encrypted keys for each participant
  image_cids TEXT[] DEFAULT '{}', -- Array of IPFS CIDs for images

  -- Participants (stored as JSONB array)
  -- Format: [{ wallet: '0x...', email: '...', role: 'buyer/seller/agent', verified: true/false }]
  participants JSONB NOT NULL,

  -- Multi-Sig Configuration
  required_signatures INT DEFAULT 2,
  current_signatures INT DEFAULT 0,

  -- Creator & Status
  creator_address TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, active, completed, cancelled, disputed, refunded

  -- Blockchain Details
  chain_id INT DEFAULT 8453, -- Base mainnet
  smart_contract_address TEXT, -- Deployed escrow contract address
  transaction_hash TEXT, -- Transaction hash for escrow creation

  -- Cancellation Details
  cancelled_by TEXT, -- 'buyer' or 'seller'
  cancellation_reason TEXT,
  cancellation_transaction_hash TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ
);

-- Indexes for escrow_transactions
CREATE INDEX idx_escrow_creator ON public.escrow_transactions(creator_address);
CREATE INDEX idx_escrow_status ON public.escrow_transactions(status);
CREATE INDEX idx_escrow_created ON public.escrow_transactions(created_at DESC);
CREATE INDEX idx_escrow_chain ON public.escrow_transactions(chain_id);
CREATE INDEX idx_escrow_participants ON public.escrow_transactions USING GIN(participants);

-- RLS Policies for escrow_transactions
ALTER TABLE public.escrow_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view escrows they're involved in"
  ON public.escrow_transactions FOR SELECT
  USING (
    creator_address = auth.jwt() ->> 'wallet_address'
    OR participants @> jsonb_build_array(jsonb_build_object('wallet', auth.jwt() ->> 'wallet_address'))
  );

CREATE POLICY "Users can create escrows"
  ON public.escrow_transactions FOR INSERT
  WITH CHECK (creator_address = auth.jwt() ->> 'wallet_address');

CREATE POLICY "Participants can update escrows"
  ON public.escrow_transactions FOR UPDATE
  USING (
    creator_address = auth.jwt() ->> 'wallet_address'
    OR participants @> jsonb_build_array(jsonb_build_object('wallet', auth.jwt() ->> 'wallet_address'))
  );

-- ============================================================
-- 3. ESCROW PARTICIPANTS TABLE
-- Normalized table for participants (optional - use if needed)
-- ============================================================

CREATE TABLE public.escrow_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  escrow_id UUID REFERENCES public.escrow_transactions(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  email TEXT,
  role TEXT NOT NULL, -- buyer, seller, agent, mediator
  verified BOOLEAN DEFAULT false,
  signed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for escrow_participants
CREATE INDEX idx_participants_escrow ON public.escrow_participants(escrow_id);
CREATE INDEX idx_participants_wallet ON public.escrow_participants(wallet_address);

-- RLS Policies for escrow_participants
ALTER TABLE public.escrow_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view participants of their escrows"
  ON public.escrow_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.escrow_transactions e
      WHERE e.id = escrow_id
      AND (
        e.creator_address = auth.jwt() ->> 'wallet_address'
        OR e.participants @> jsonb_build_array(jsonb_build_object('wallet', auth.jwt() ->> 'wallet_address'))
      )
    )
  );

CREATE POLICY "Escrow creators can add participants"
  ON public.escrow_participants FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.escrow_transactions e
      WHERE e.id = escrow_id
      AND e.creator_address = auth.jwt() ->> 'wallet_address'
    )
  );

-- ============================================================
-- 4. ESCROW SIGNATURES TABLE
-- Track signatures for multi-sig escrows
-- ============================================================

CREATE TABLE public.escrow_signatures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  escrow_id UUID REFERENCES public.escrow_transactions(id) ON DELETE CASCADE,
  signer_address TEXT NOT NULL,
  signature TEXT NOT NULL, -- On-chain signature
  signature_type TEXT DEFAULT 'release', -- release, refund, cancel, dispute
  transaction_hash TEXT, -- Transaction hash of the signature
  signed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for escrow_signatures
CREATE INDEX idx_signatures_escrow ON public.escrow_signatures(escrow_id);
CREATE INDEX idx_signatures_signer ON public.escrow_signatures(signer_address);
CREATE UNIQUE INDEX idx_unique_signature ON public.escrow_signatures(escrow_id, signer_address, signature_type);

-- RLS Policies for escrow_signatures
ALTER TABLE public.escrow_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view signatures for their escrows"
  ON public.escrow_signatures FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.escrow_transactions e
      WHERE e.id = escrow_id
      AND (
        e.creator_address = auth.jwt() ->> 'wallet_address'
        OR e.participants @> jsonb_build_array(jsonb_build_object('wallet', auth.jwt() ->> 'wallet_address'))
      )
    )
  );

CREATE POLICY "Participants can add signatures"
  ON public.escrow_signatures FOR INSERT
  WITH CHECK (
    signer_address = auth.jwt() ->> 'wallet_address'
    AND EXISTS (
      SELECT 1 FROM public.escrow_transactions e
      WHERE e.id = escrow_id
      AND e.participants @> jsonb_build_array(jsonb_build_object('wallet', signer_address))
    )
  );

-- ============================================================
-- 5. ESCROW ACTIVITY LOG TABLE
-- Track all activities and state changes
-- ============================================================

CREATE TABLE public.escrow_activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  escrow_id UUID REFERENCES public.escrow_transactions(id) ON DELETE CASCADE,
  actor_address TEXT, -- Wallet address of who performed the action
  action_type TEXT NOT NULL, -- created, signed, cancelled, completed, disputed, refunded, etc.
  description TEXT,
  metadata JSONB, -- Additional data about the action
  transaction_hash TEXT, -- On-chain transaction hash if applicable
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for escrow_activity_log
CREATE INDEX idx_activity_escrow ON public.escrow_activity_log(escrow_id);
CREATE INDEX idx_activity_actor ON public.escrow_activity_log(actor_address);
CREATE INDEX idx_activity_type ON public.escrow_activity_log(action_type);
CREATE INDEX idx_activity_created ON public.escrow_activity_log(created_at DESC);

-- RLS Policies for escrow_activity_log
ALTER TABLE public.escrow_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view activity for their escrows"
  ON public.escrow_activity_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.escrow_transactions e
      WHERE e.id = escrow_id
      AND (
        e.creator_address = auth.jwt() ->> 'wallet_address'
        OR e.participants @> jsonb_build_array(jsonb_build_object('wallet', auth.jwt() ->> 'wallet_address'))
      )
    )
  );

CREATE POLICY "System can add activity logs"
  ON public.escrow_activity_log FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- 6. ESCROW DISPUTES TABLE
-- Handle dispute resolution
-- ============================================================

CREATE TABLE public.escrow_disputes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  escrow_id UUID REFERENCES public.escrow_transactions(id) ON DELETE CASCADE,
  raised_by TEXT NOT NULL, -- Wallet address
  reason TEXT NOT NULL,
  description TEXT,
  evidence_urls TEXT[], -- IPFS CIDs or URLs to evidence
  status TEXT DEFAULT 'open', -- open, investigating, resolved, rejected
  resolution TEXT,
  resolved_by TEXT, -- Mediator wallet address
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for escrow_disputes
CREATE INDEX idx_disputes_escrow ON public.escrow_disputes(escrow_id);
CREATE INDEX idx_disputes_status ON public.escrow_disputes(status);
CREATE INDEX idx_disputes_raised_by ON public.escrow_disputes(raised_by);

-- RLS Policies for escrow_disputes
ALTER TABLE public.escrow_disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view disputes for their escrows"
  ON public.escrow_disputes FOR SELECT
  USING (
    raised_by = auth.jwt() ->> 'wallet_address'
    OR EXISTS (
      SELECT 1 FROM public.escrow_transactions e
      WHERE e.id = escrow_id
      AND (
        e.creator_address = auth.jwt() ->> 'wallet_address'
        OR e.participants @> jsonb_build_array(jsonb_build_object('wallet', auth.jwt() ->> 'wallet_address'))
      )
    )
  );

CREATE POLICY "Participants can raise disputes"
  ON public.escrow_disputes FOR INSERT
  WITH CHECK (
    raised_by = auth.jwt() ->> 'wallet_address'
    AND EXISTS (
      SELECT 1 FROM public.escrow_transactions e
      WHERE e.id = escrow_id
      AND e.participants @> jsonb_build_array(jsonb_build_object('wallet', raised_by))
    )
  );

-- ============================================================
-- 7. ESCROW MESSAGES TABLE
-- Communication between participants
-- ============================================================

CREATE TABLE public.escrow_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  escrow_id UUID REFERENCES public.escrow_transactions(id) ON DELETE CASCADE,
  sender_address TEXT NOT NULL,
  message TEXT NOT NULL,
  attachments TEXT[], -- IPFS CIDs
  read_by TEXT[] DEFAULT '{}', -- Array of wallet addresses who read the message
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for escrow_messages
CREATE INDEX idx_messages_escrow ON public.escrow_messages(escrow_id);
CREATE INDEX idx_messages_sender ON public.escrow_messages(sender_address);
CREATE INDEX idx_messages_created ON public.escrow_messages(created_at DESC);

-- RLS Policies for escrow_messages
ALTER TABLE public.escrow_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view messages for their escrows"
  ON public.escrow_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.escrow_transactions e
      WHERE e.id = escrow_id
      AND (
        e.creator_address = auth.jwt() ->> 'wallet_address'
        OR e.participants @> jsonb_build_array(jsonb_build_object('wallet', auth.jwt() ->> 'wallet_address'))
      )
    )
  );

CREATE POLICY "Participants can send messages"
  ON public.escrow_messages FOR INSERT
  WITH CHECK (
    sender_address = auth.jwt() ->> 'wallet_address'
    AND EXISTS (
      SELECT 1 FROM public.escrow_transactions e
      WHERE e.id = escrow_id
      AND e.participants @> jsonb_build_array(jsonb_build_object('wallet', sender_address))
    )
  );

-- ============================================================
-- 8. UPDATED_AT TRIGGER FUNCTION
-- Automatically update updated_at timestamp
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to relevant tables
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_escrow_transactions_updated_at
  BEFORE UPDATE ON public.escrow_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_escrow_disputes_updated_at
  BEFORE UPDATE ON public.escrow_disputes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 9. HELPER FUNCTIONS
-- Useful functions for querying escrows
-- ============================================================

-- Function to get all escrows for a wallet address
CREATE OR REPLACE FUNCTION get_user_escrows(wallet_addr TEXT)
RETURNS SETOF public.escrow_transactions AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.escrow_transactions
  WHERE creator_address = wallet_addr
     OR participants @> jsonb_build_array(jsonb_build_object('wallet', wallet_addr));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get escrow statistics
CREATE OR REPLACE FUNCTION get_escrow_stats(wallet_addr TEXT)
RETURNS TABLE(
  total_escrows BIGINT,
  active_escrows BIGINT,
  completed_escrows BIGINT,
  cancelled_escrows BIGINT,
  disputed_escrows BIGINT,
  total_volume_usd DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_escrows,
    COUNT(*) FILTER (WHERE status = 'active')::BIGINT as active_escrows,
    COUNT(*) FILTER (WHERE status = 'completed')::BIGINT as completed_escrows,
    COUNT(*) FILTER (WHERE status = 'cancelled')::BIGINT as cancelled_escrows,
    COUNT(*) FILTER (WHERE status = 'disputed')::BIGINT as disputed_escrows,
    COALESCE(SUM(amount_usd), 0) as total_volume_usd
  FROM public.escrow_transactions
  WHERE creator_address = wallet_addr
     OR participants @> jsonb_build_array(jsonb_build_object('wallet', wallet_addr));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 10. SAMPLE DATA (OPTIONAL - FOR TESTING)
-- Remove this section for production deployment
-- ============================================================

/*
-- Insert sample user
INSERT INTO public.users (wallet_address, username, email)
VALUES
  ('0x1234567890123456789012345678901234567890', 'demo_user', 'demo@privatecharterx.com');

-- Insert sample escrow
INSERT INTO public.escrow_transactions (
  title,
  description,
  asset_type,
  location,
  amount_usd,
  amount_eth,
  participants,
  creator_address,
  status
) VALUES (
  'Private Jet Charter - Miami to Monaco',
  'Gulfstream G650 charter for business travel',
  'service',
  'Miami, FL to Monaco',
  125000.00,
  41.67,
  '[
    {"wallet": "0x1234567890123456789012345678901234567890", "email": "buyer@example.com", "role": "buyer", "verified": true},
    {"wallet": "0x0987654321098765432109876543210987654321", "email": "seller@example.com", "role": "seller", "verified": false}
  ]'::jsonb,
  '0x1234567890123456789012345678901234567890',
  'active'
);
*/

-- ============================================================
-- SCHEMA COMPLETE
-- ============================================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
