// ============================================================
// NOTIFICATION & EMAIL SERVICE
// Handles real-time notifications and email sending via Resend
// ============================================================

import { supabase } from './supabase';
import { Resend } from 'resend';

// Initialize Resend (only if API key is available)
const resendApiKey = import.meta.env.VITE_RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

const FROM_EMAIL = import.meta.env.VITE_FROM_EMAIL || 'PrivateCharterX <notifications@privatecharterx.com>';
const APP_URL = import.meta.env.VITE_APP_URL || 'http://localhost:5173';

// ============================================================
// NOTIFICATION TYPES
// ============================================================

export type NotificationType =
  | 'escrow_created'
  | 'message_received'
  | 'signature_added'
  | 'signature_requested'
  | 'status_changed'
  | 'dispute_raised'
  | 'escrow_completed'
  | 'escrow_cancelled';

export interface Notification {
  id: string;
  user_wallet: string;
  escrow_id?: string;
  notification_type: NotificationType;
  title: string;
  message: string;
  metadata?: any;
  is_read: boolean;
  is_emailed: boolean;
  read_at?: string;
  created_at: string;
}

// ============================================================
// CREATE NOTIFICATION
// ============================================================

export async function createNotification(
  userWallet: string,
  type: NotificationType,
  title: string,
  message: string,
  escrowId?: string,
  metadata?: any
): Promise<Notification | null> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_wallet: userWallet.toLowerCase(),
        escrow_id: escrowId,
        notification_type: type,
        title,
        message,
        metadata,
        is_read: false,
        is_emailed: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create notification:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
}

// ============================================================
// GET NOTIFICATIONS
// ============================================================

export async function getNotifications(
  userWallet: string,
  unreadOnly = false
): Promise<Notification[]> {
  try {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_wallet', userWallet.toLowerCase())
      .order('created_at', { ascending: false });

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch notifications:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
}

// ============================================================
// GET UNREAD COUNT
// ============================================================

export async function getUnreadCount(userWallet: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .rpc('get_unread_notification_count', {
        wallet_addr: userWallet.toLowerCase(),
      });

    if (error) {
      console.error('Failed to get unread count:', error);
      return 0;
    }

    return data || 0;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
}

// ============================================================
// MARK AS READ
// ============================================================

export async function markAsRead(
  notificationId: string,
  userWallet: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId)
      .eq('user_wallet', userWallet.toLowerCase());

    if (error) {
      console.error('Failed to mark notification as read:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
}

// ============================================================
// MARK ALL AS READ
// ============================================================

export async function markAllAsRead(userWallet: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_wallet', userWallet.toLowerCase())
      .eq('is_read', false);

    if (error) {
      console.error('Failed to mark all as read:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error marking all as read:', error);
    return false;
  }
}

// ============================================================
// EMAIL TEMPLATES
// ============================================================

function getEmailTemplate(
  type: NotificationType,
  data: any
): { subject: string; html: string } {
  const baseUrl = APP_URL;

  switch (type) {
    case 'escrow_created':
      return {
        subject: `New Escrow Agreement - ${data.escrow_title}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #111827 0%, #374151 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                .button { display: inline-block; background: #111827; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
                .details { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
                .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🤝 New Escrow Agreement</h1>
                </div>
                <div class="content">
                  <p>Hi there,</p>
                  <p>You have been invited to participate in a new escrow agreement:</p>

                  <div class="details">
                    <h3>${data.escrow_title}</h3>
                    <p><strong>Amount:</strong> $${data.amount_usd?.toLocaleString()} USD</p>
                    <p><strong>Your Role:</strong> ${data.role}</p>
                    <p><strong>Creator:</strong> ${data.creator?.slice(0, 10)}...${data.creator?.slice(-8)}</p>
                  </div>

                  <p>Please review the escrow details and sign the agreement to proceed.</p>

                  <a href="${baseUrl}/escrow/${data.escrow_id}" class="button">View Escrow Details</a>

                  <div class="footer">
                    <p>PrivateCharterX Escrow - Secure Transactions</p>
                    <p>If you did not expect this email, please ignore it.</p>
                  </div>
                </div>
              </div>
            </body>
          </html>
        `,
      };

    case 'message_received':
      return {
        subject: `New Message - ${data.escrow_title}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #111827 0%, #374151 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                .button { display: inline-block; background: #111827; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
                .message-box { background: white; padding: 20px; border-left: 4px solid #111827; margin: 20px 0; border-radius: 6px; }
                .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>💬 New Message</h1>
                </div>
                <div class="content">
                  <p>Hi there,</p>
                  <p>You have received a new message in your escrow:</p>

                  <h3>${data.escrow_title}</h3>

                  <div class="message-box">
                    <p><strong>From:</strong> ${data.sender?.slice(0, 10)}...${data.sender?.slice(-8)}</p>
                    <p>${data.message_preview}...</p>
                  </div>

                  <a href="${baseUrl}/escrow/${data.escrow_id}?tab=messages" class="button">View Full Message</a>

                  <div class="footer">
                    <p>PrivateCharterX Escrow - Secure Transactions</p>
                    <p>Reply to this message via the escrow platform.</p>
                  </div>
                </div>
              </div>
            </body>
          </html>
        `,
      };

    case 'signature_added':
      return {
        subject: `Signature Added - ${data.escrow_title}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #111827 0%, #374151 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                .button { display: inline-block; background: #111827; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
                .progress { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
                .progress-bar { background: #e5e7eb; height: 10px; border-radius: 5px; overflow: hidden; }
                .progress-fill { background: #10b981; height: 100%; transition: width 0.3s; }
                .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>✍️ Signature Added</h1>
                </div>
                <div class="content">
                  <p>Hi there,</p>
                  <p>A participant has signed your escrow agreement:</p>

                  <h3>${data.escrow_title}</h3>

                  <div class="progress">
                    <p><strong>Signer:</strong> ${data.signer?.slice(0, 10)}...${data.signer?.slice(-8)}</p>
                    <p><strong>Signature Type:</strong> ${data.signature_type}</p>

                    <p style="margin-top: 20px;"><strong>Progress: ${data.current_signatures}/${data.required_signatures} signatures</strong></p>
                    <div class="progress-bar">
                      <div class="progress-fill" style="width: ${(data.current_signatures / data.required_signatures) * 100}%"></div>
                    </div>
                  </div>

                  <a href="${baseUrl}/escrow/${data.escrow_id}" class="button">View Escrow</a>

                  <div class="footer">
                    <p>PrivateCharterX Escrow - Secure Transactions</p>
                  </div>
                </div>
              </div>
            </body>
          </html>
        `,
      };

    case 'status_changed':
      return {
        subject: `Escrow Status Updated - ${data.escrow_title}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #111827 0%, #374151 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                .button { display: inline-block; background: #111827; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
                .status-change { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; text-align: center; }
                .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: 600; margin: 5px; }
                .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>📊 Status Update</h1>
                </div>
                <div class="content">
                  <p>Hi there,</p>
                  <p>The status of your escrow has been updated:</p>

                  <h3>${data.escrow_title}</h3>

                  <div class="status-change">
                    <p><strong>Status Changed</strong></p>
                    <div>
                      <span class="status-badge" style="background: #fef3c7; color: #92400e;">${data.old_status}</span>
                      <span style="font-size: 20px;">→</span>
                      <span class="status-badge" style="background: #d1fae5; color: #065f46;">${data.new_status}</span>
                    </div>
                  </div>

                  <a href="${baseUrl}/escrow/${data.escrow_id}" class="button">View Escrow Details</a>

                  <div class="footer">
                    <p>PrivateCharterX Escrow - Secure Transactions</p>
                  </div>
                </div>
              </div>
            </body>
          </html>
        `,
      };

    default:
      return {
        subject: `Notification from PrivateCharterX Escrow`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #111827 0%, #374151 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                .button { display: inline-block; background: #111827; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
                .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🔔 Notification</h1>
                </div>
                <div class="content">
                  <p>Hi there,</p>
                  <p>You have a new notification from PrivateCharterX Escrow.</p>

                  <a href="${baseUrl}/dashboard" class="button">View Dashboard</a>

                  <div class="footer">
                    <p>PrivateCharterX Escrow - Secure Transactions</p>
                  </div>
                </div>
              </div>
            </body>
          </html>
        `,
      };
  }
}

// ============================================================
// SEND EMAIL NOTIFICATION
// ============================================================

export async function sendEmailNotification(
  recipientEmail: string,
  recipientWallet: string,
  type: NotificationType,
  metadata: any
): Promise<boolean> {
  if (!resend) {
    console.warn('Resend not configured. Skipping email notification.');
    return false;
  }

  try {
    const { subject, html } = getEmailTemplate(type, metadata);

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: recipientEmail,
      subject,
      html,
    });

    if (error) {
      console.error('Failed to send email:', error);

      // Queue email for retry
      await supabase.from('email_queue').insert({
        recipient_email: recipientEmail,
        recipient_wallet: recipientWallet.toLowerCase(),
        template_type: type,
        subject,
        html_content: html,
        metadata,
        status: 'failed',
        error_message: error.message,
        attempts: 1,
      });

      return false;
    }

    // Log successful email
    await supabase.from('email_queue').insert({
      recipient_email: recipientEmail,
      recipient_wallet: recipientWallet.toLowerCase(),
      template_type: type,
      subject,
      html_content: html,
      metadata,
      status: 'sent',
      resend_message_id: data?.id,
      sent_at: new Date().toISOString(),
    });

    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

// ============================================================
// NOTIFY PARTICIPANTS (WITH EMAIL)
// ============================================================

export async function notifyParticipants(
  escrowId: string,
  type: NotificationType,
  title: string,
  message: string,
  metadata: any,
  excludeWallet?: string
): Promise<void> {
  try {
    // Get escrow with participants
    const { data: escrow, error } = await supabase
      .from('escrow_transactions')
      .select('participants')
      .eq('id', escrowId)
      .single();

    if (error || !escrow) {
      console.error('Failed to fetch escrow:', error);
      return;
    }

    const participants = escrow.participants as any[];

    // Notify each participant
    for (const participant of participants) {
      const wallet = participant.wallet?.toLowerCase();

      // Skip if this is the excluded wallet
      if (excludeWallet && wallet === excludeWallet.toLowerCase()) {
        continue;
      }

      // Create in-app notification
      await createNotification(wallet, type, title, message, escrowId, metadata);

      // Send email if participant has email
      if (participant.email) {
        await sendEmailNotification(participant.email, wallet, type, {
          ...metadata,
          escrow_id: escrowId,
        });
      }
    }
  } catch (error) {
    console.error('Error notifying participants:', error);
  }
}

// ============================================================
// SUBSCRIBE TO NOTIFICATIONS (REALTIME)
// ============================================================

export function subscribeToNotifications(
  userWallet: string,
  callback: (notification: Notification) => void
) {
  const channel = supabase
    .channel('notifications')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_wallet=eq.${userWallet.toLowerCase()}`,
      },
      (payload) => {
        callback(payload.new as Notification);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
