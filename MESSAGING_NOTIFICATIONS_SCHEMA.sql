-- ============================================================
-- MESSAGING & NOTIFICATIONS SCHEMA
-- Add to existing escrow database for real-time chat and notifications
-- ============================================================

-- ============================================================
-- 1. NOTIFICATIONS TABLE
-- Store all notifications for users
-- ============================================================

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_wallet TEXT NOT NULL, -- Recipient wallet address
  escrow_id UUID REFERENCES public.escrow_transactions(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL, -- escrow_created, message_received, signature_requested, status_changed, dispute_raised, etc.
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB, -- Additional data (escrow details, sender info, etc.)
  is_read BOOLEAN DEFAULT false,
  is_emailed BOOLEAN DEFAULT false, -- Track if email was sent
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for notifications
CREATE INDEX idx_notifications_user ON public.notifications(user_wallet);
CREATE INDEX idx_notifications_escrow ON public.notifications(escrow_id);
CREATE INDEX idx_notifications_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_type ON public.notifications(notification_type);
CREATE INDEX idx_notifications_created ON public.notifications(created_at DESC);

-- RLS Policies for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (user_wallet = auth.jwt() ->> 'wallet_address');

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (user_wallet = auth.jwt() ->> 'wallet_address')
  WITH CHECK (user_wallet = auth.jwt() ->> 'wallet_address');

CREATE POLICY "System can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- 2. CHAT MESSAGES TABLE (Enhanced)
-- Already exists in main schema, but add indexes if needed
-- ============================================================

-- Additional indexes for better performance (if not already added)
CREATE INDEX IF NOT EXISTS idx_messages_unread ON public.escrow_messages((cardinality(read_by)));

-- ============================================================
-- 3. EMAIL QUEUE TABLE
-- Queue emails to be sent via Resend
-- ============================================================

CREATE TABLE public.email_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_email TEXT NOT NULL,
  recipient_wallet TEXT,
  template_type TEXT NOT NULL, -- escrow_created, message_received, signature_request, etc.
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  metadata JSONB, -- Escrow details, links, etc.
  status TEXT DEFAULT 'pending', -- pending, sent, failed
  resend_message_id TEXT, -- Resend API response ID
  error_message TEXT,
  attempts INT DEFAULT 0,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for email_queue
CREATE INDEX idx_email_queue_status ON public.email_queue(status);
CREATE INDEX idx_email_queue_recipient ON public.email_queue(recipient_email);
CREATE INDEX idx_email_queue_created ON public.email_queue(created_at DESC);

-- RLS Policies for email_queue
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System can manage email queue"
  ON public.email_queue FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- 4. HELPER FUNCTIONS FOR NOTIFICATIONS
-- ============================================================

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(wallet_addr TEXT)
RETURNS BIGINT AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM public.notifications
    WHERE user_wallet = wallet_addr
    AND is_read = false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(notification_id UUID, wallet_addr TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.notifications
  SET is_read = true, read_at = NOW()
  WHERE id = notification_id
  AND user_wallet = wallet_addr;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark all notifications as read
CREATE OR REPLACE FUNCTION mark_all_notifications_read(wallet_addr TEXT)
RETURNS BIGINT AS $$
DECLARE
  updated_count BIGINT;
BEGIN
  UPDATE public.notifications
  SET is_read = true, read_at = NOW()
  WHERE user_wallet = wallet_addr
  AND is_read = false;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 5. TRIGGER FUNCTIONS FOR AUTO-NOTIFICATIONS
-- ============================================================

-- Trigger function to create notification when escrow is created
CREATE OR REPLACE FUNCTION notify_escrow_created()
RETURNS TRIGGER AS $$
DECLARE
  participant JSONB;
BEGIN
  -- Notify all participants except creator
  FOR participant IN SELECT * FROM jsonb_array_elements(NEW.participants)
  LOOP
    IF (participant->>'wallet')::TEXT != NEW.creator_address THEN
      INSERT INTO public.notifications (
        user_wallet,
        escrow_id,
        notification_type,
        title,
        message,
        metadata
      ) VALUES (
        (participant->>'wallet')::TEXT,
        NEW.id,
        'escrow_created',
        'New Escrow Agreement',
        'You have been invited to participate in a new escrow: ' || NEW.title,
        jsonb_build_object(
          'escrow_id', NEW.id,
          'escrow_title', NEW.title,
          'amount_usd', NEW.amount_usd,
          'creator', NEW.creator_address,
          'role', participant->>'role'
        )
      );
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to create notification when message is sent
CREATE OR REPLACE FUNCTION notify_message_received()
RETURNS TRIGGER AS $$
DECLARE
  participant JSONB;
  escrow_row public.escrow_transactions%ROWTYPE;
BEGIN
  -- Get escrow details
  SELECT * INTO escrow_row FROM public.escrow_transactions WHERE id = NEW.escrow_id;

  -- Notify all participants except sender
  FOR participant IN SELECT * FROM jsonb_array_elements(escrow_row.participants)
  LOOP
    IF (participant->>'wallet')::TEXT != NEW.sender_address THEN
      INSERT INTO public.notifications (
        user_wallet,
        escrow_id,
        notification_type,
        title,
        message,
        metadata
      ) VALUES (
        (participant->>'wallet')::TEXT,
        NEW.escrow_id,
        'message_received',
        'New Message',
        'You have a new message in escrow: ' || escrow_row.title,
        jsonb_build_object(
          'escrow_id', NEW.escrow_id,
          'escrow_title', escrow_row.title,
          'sender', NEW.sender_address,
          'message_preview', LEFT(NEW.message, 50)
        )
      );
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to notify when signature is added
CREATE OR REPLACE FUNCTION notify_signature_added()
RETURNS TRIGGER AS $$
DECLARE
  participant JSONB;
  escrow_row public.escrow_transactions%ROWTYPE;
BEGIN
  -- Get escrow details
  SELECT * INTO escrow_row FROM public.escrow_transactions WHERE id = NEW.escrow_id;

  -- Notify all participants except signer
  FOR participant IN SELECT * FROM jsonb_array_elements(escrow_row.participants)
  LOOP
    IF (participant->>'wallet')::TEXT != NEW.signer_address THEN
      INSERT INTO public.notifications (
        user_wallet,
        escrow_id,
        notification_type,
        title,
        message,
        metadata
      ) VALUES (
        (participant->>'wallet')::TEXT,
        NEW.escrow_id,
        'signature_added',
        'Signature Added',
        'A participant signed the escrow: ' || escrow_row.title,
        jsonb_build_object(
          'escrow_id', NEW.escrow_id,
          'escrow_title', escrow_row.title,
          'signer', NEW.signer_address,
          'signature_type', NEW.signature_type,
          'current_signatures', escrow_row.current_signatures + 1,
          'required_signatures', escrow_row.required_signatures
        )
      );
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to notify when escrow status changes
CREATE OR REPLACE FUNCTION notify_status_changed()
RETURNS TRIGGER AS $$
DECLARE
  participant JSONB;
BEGIN
  -- Only trigger if status actually changed
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    -- Notify all participants
    FOR participant IN SELECT * FROM jsonb_array_elements(NEW.participants)
    LOOP
      INSERT INTO public.notifications (
        user_wallet,
        escrow_id,
        notification_type,
        title,
        message,
        metadata
      ) VALUES (
        (participant->>'wallet')::TEXT,
        NEW.id,
        'status_changed',
        'Escrow Status Updated',
        'Escrow status changed to ' || NEW.status || ' for: ' || NEW.title,
        jsonb_build_object(
          'escrow_id', NEW.id,
          'escrow_title', NEW.title,
          'old_status', OLD.status,
          'new_status', NEW.status
        )
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 6. CREATE TRIGGERS
-- ============================================================

-- Trigger for new escrow creation
CREATE TRIGGER trigger_notify_escrow_created
  AFTER INSERT ON public.escrow_transactions
  FOR EACH ROW
  EXECUTE FUNCTION notify_escrow_created();

-- Trigger for new messages
CREATE TRIGGER trigger_notify_message_received
  AFTER INSERT ON public.escrow_messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_message_received();

-- Trigger for signatures
CREATE TRIGGER trigger_notify_signature_added
  AFTER INSERT ON public.escrow_signatures
  FOR EACH ROW
  EXECUTE FUNCTION notify_signature_added();

-- Trigger for status changes
CREATE TRIGGER trigger_notify_status_changed
  AFTER UPDATE ON public.escrow_transactions
  FOR EACH ROW
  EXECUTE FUNCTION notify_status_changed();

-- ============================================================
-- 7. REALTIME PUBLICATION
-- Enable Realtime for notifications and messages
-- ============================================================

-- Enable realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Enable realtime for messages table (if not already enabled)
ALTER PUBLICATION supabase_realtime ADD TABLE public.escrow_messages;

-- ============================================================
-- SCHEMA COMPLETE
-- ============================================================

-- Grant permissions
GRANT ALL ON public.notifications TO anon, authenticated;
GRANT ALL ON public.email_queue TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_unread_notification_count(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION mark_notification_read(UUID, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION mark_all_notifications_read(TEXT) TO anon, authenticated;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
