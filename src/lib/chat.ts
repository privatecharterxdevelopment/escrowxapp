// ============================================================
// CHAT & MESSAGING LIBRARY
// Real-time chat functionality for escrow conversations
// ============================================================

import { supabase } from './supabase';

export interface ChatMessage {
  id: string;
  escrow_id: string;
  sender_address: string;
  message: string;
  attachments?: string[];
  read_by: string[];
  created_at: string;
}

export interface Conversation {
  escrow_id: string;
  escrow_title: string;
  escrow_status: string;
  other_party_address: string;
  other_party_role: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  amount_usd: number;
}

// ============================================================
// SEND MESSAGE
// ============================================================

export async function sendMessage(
  escrowId: string,
  senderAddress: string,
  message: string,
  attachments?: string[]
): Promise<ChatMessage | null> {
  try {
    const { data, error } = await supabase
      .from('escrow_messages')
      .insert({
        escrow_id: escrowId,
        sender_address: senderAddress.toLowerCase(),
        message,
        attachments: attachments || [],
        read_by: [senderAddress.toLowerCase()], // Sender has read their own message
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to send message:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error sending message:', error);
    return null;
  }
}

// ============================================================
// GET MESSAGES FOR ESCROW
// ============================================================

export async function getMessages(escrowId: string): Promise<ChatMessage[]> {
  try {
    const { data, error } = await supabase
      .from('escrow_messages')
      .select('*')
      .eq('escrow_id', escrowId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Failed to get messages:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error getting messages:', error);
    return [];
  }
}

// ============================================================
// MARK MESSAGES AS READ
// ============================================================

export async function markMessagesAsRead(
  escrowId: string,
  userAddress: string
): Promise<boolean> {
  try {
    // Get all messages for this escrow that user hasn't read
    const { data: messages, error: fetchError } = await supabase
      .from('escrow_messages')
      .select('id, read_by')
      .eq('escrow_id', escrowId)
      .not('read_by', 'cs', `{${userAddress.toLowerCase()}}`); // Not read by user

    if (fetchError) {
      console.error('Failed to fetch unread messages:', fetchError);
      return false;
    }

    if (!messages || messages.length === 0) {
      return true; // No unread messages
    }

    // Mark each message as read by adding user to read_by array
    for (const message of messages) {
      const updatedReadBy = [...(message.read_by || []), userAddress.toLowerCase()];

      await supabase
        .from('escrow_messages')
        .update({ read_by: updatedReadBy })
        .eq('id', message.id);
    }

    return true;
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return false;
  }
}

// ============================================================
// GET CONVERSATIONS (FOR DASHBOARD)
// ============================================================

export async function getConversations(
  userAddress: string
): Promise<Conversation[]> {
  try {
    // Get all escrows where user is a participant
    const { data: escrows, error } = await supabase
      .from('escrow_transactions')
      .select('*')
      .or(`creator_address.eq.${userAddress.toLowerCase()},participants.cs.${JSON.stringify([{ wallet: userAddress.toLowerCase() }])}`);

    if (error) {
      console.error('Failed to get conversations:', error);
      return [];
    }

    if (!escrows || escrows.length === 0) {
      return [];
    }

    // Get last message for each escrow
    const conversations: Conversation[] = [];

    for (const escrow of escrows) {
      // Get last message
      const { data: lastMessage } = await supabase
        .from('escrow_messages')
        .select('*')
        .eq('escrow_id', escrow.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Get unread count
      const { data: unreadMessages } = await supabase
        .from('escrow_messages')
        .select('id')
        .eq('escrow_id', escrow.id)
        .not('read_by', 'cs', `{${userAddress.toLowerCase()}}`);

      const unreadCount = unreadMessages?.length || 0;

      // Find other party (buyer or seller)
      const participants = escrow.participants as any[];
      const otherParty = participants.find(
        (p) => p.wallet.toLowerCase() !== userAddress.toLowerCase()
      );

      conversations.push({
        escrow_id: escrow.id,
        escrow_title: escrow.title,
        escrow_status: escrow.status,
        other_party_address: otherParty?.wallet || 'Unknown',
        other_party_role: otherParty?.role || 'participant',
        last_message: lastMessage?.message || 'No messages yet',
        last_message_time: lastMessage?.created_at || escrow.created_at,
        unread_count: unreadCount,
        amount_usd: escrow.amount_usd,
      });
    }

    // Sort by last message time (most recent first)
    conversations.sort((a, b) => {
      return new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime();
    });

    return conversations;
  } catch (error) {
    console.error('Error getting conversations:', error);
    return [];
  }
}

// ============================================================
// SUBSCRIBE TO MESSAGES (REALTIME)
// ============================================================

export function subscribeToMessages(
  escrowId: string,
  callback: (message: ChatMessage) => void
) {
  const channel = supabase
    .channel(`messages:${escrowId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'escrow_messages',
        filter: `escrow_id=eq.${escrowId}`,
      },
      (payload) => {
        callback(payload.new as ChatMessage);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// ============================================================
// GET UNREAD MESSAGE COUNT
// ============================================================

export async function getUnreadMessageCount(
  userAddress: string
): Promise<number> {
  try {
    // Get all escrows where user is a participant
    const { data: escrows } = await supabase
      .from('escrow_transactions')
      .select('id')
      .or(`creator_address.eq.${userAddress.toLowerCase()},participants.cs.${JSON.stringify([{ wallet: userAddress.toLowerCase() }])}`);

    if (!escrows || escrows.length === 0) {
      return 0;
    }

    const escrowIds = escrows.map((e) => e.id);

    // Get unread messages for all user's escrows
    const { data: unreadMessages } = await supabase
      .from('escrow_messages')
      .select('id')
      .in('escrow_id', escrowIds)
      .not('read_by', 'cs', `{${userAddress.toLowerCase()}}`);

    return unreadMessages?.length || 0;
  } catch (error) {
    console.error('Error getting unread message count:', error);
    return 0;
  }
}
