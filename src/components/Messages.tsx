// ============================================================
// MESSAGES COMPONENT
// Dashboard messages with conversations list and chat
// ============================================================

import { useState, useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';
import { MessageCircle, Send, CheckCheck, Circle, X } from 'lucide-react';
import {
  getConversations,
  getMessages,
  sendMessage,
  markMessagesAsRead,
  subscribeToMessages,
  type Conversation,
  type ChatMessage,
} from '../lib/chat';
import { Link } from 'react-router-dom';

export function Messages() {
  const { address } = useAccount();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations
  const loadConversations = async () => {
    if (!address) return;

    setLoading(true);
    const data = await getConversations(address);
    setConversations(data);
    setLoading(false);
  };

  // Load messages for selected conversation
  const loadMessages = async (escrowId: string) => {
    const data = await getMessages(escrowId);
    setMessages(data);

    // Mark messages as read
    if (address) {
      await markMessagesAsRead(escrowId, address);
      // Reload conversations to update unread count
      loadConversations();
    }
  };

  // Send message
  const handleSendMessage = async () => {
    if (!address || !selectedConversation || !newMessage.trim()) return;

    setSending(true);
    const message = await sendMessage(
      selectedConversation.escrow_id,
      address,
      newMessage.trim()
    );

    if (message) {
      setMessages((prev) => [...prev, message]);
      setNewMessage('');
      loadConversations(); // Update last message in conversations
    }

    setSending(false);
  };

  // Select conversation
  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    loadMessages(conversation.escrow_id);
  };

  // Subscribe to real-time messages
  useEffect(() => {
    if (!selectedConversation) return;

    const unsubscribe = subscribeToMessages(
      selectedConversation.escrow_id,
      (message) => {
        setMessages((prev) => [...prev, message]);
        // Mark as read if not from current user
        if (address && message.sender_address.toLowerCase() !== address.toLowerCase()) {
          markMessagesAsRead(selectedConversation.escrow_id, address);
        }
        loadConversations(); // Update conversations list
      }
    );

    return () => {
      unsubscribe();
    };
  }, [selectedConversation, address]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, [address]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600';
      case 'completed':
        return 'text-blue-600';
      case 'cancelled':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (!address) {
    return (
      <div className="text-center py-20">
        <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Connect Wallet</h3>
        <p className="text-sm text-gray-600">
          Connect your wallet to view messages
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-[600px] bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Conversations List */}
      <div className="w-80 border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-900">Messages</h3>
          <p className="text-xs text-gray-600 mt-0.5">
            {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full mx-auto mb-2"></div>
              <p className="text-xs text-gray-500">Loading...</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center">
              <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No conversations yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Create an escrow to start chatting
              </p>
            </div>
          ) : (
            conversations.map((conversation) => (
              <button
                key={conversation.escrow_id}
                onClick={() => handleSelectConversation(conversation)}
                className={`w-full p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors text-left ${
                  selectedConversation?.escrow_id === conversation.escrow_id
                    ? 'bg-gray-50'
                    : ''
                }`}
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {conversation.escrow_title}
                      </p>
                      {conversation.unread_count > 0 && (
                        <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full font-medium">
                          {conversation.unread_count}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Circle
                        className={`w-1.5 h-1.5 ${
                          conversation.escrow_status === 'completed' ||
                          conversation.escrow_status === 'cancelled'
                            ? 'fill-gray-400 text-gray-400'
                            : 'fill-green-500 text-green-500'
                        }`}
                      />
                      <p className={`text-xs capitalize ${getStatusColor(conversation.escrow_status)}`}>
                        {conversation.escrow_status}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 flex-shrink-0">
                    {formatTime(conversation.last_message_time)}
                  </p>
                </div>
                <p className="text-xs text-gray-600 line-clamp-2">
                  {conversation.last_message}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-gray-500">
                    {conversation.other_party_role === 'buyer' ? 'Buyer' : 'Seller'}:{' '}
                    {conversation.other_party_address.slice(0, 6)}...
                    {conversation.other_party_address.slice(-4)}
                  </p>
                  <p className="text-xs font-medium text-gray-700">
                    ${conversation.amount_usd.toLocaleString()}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-gray-900 truncate">
                    {selectedConversation.escrow_title}
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                      selectedConversation.escrow_status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : selectedConversation.escrow_status === 'completed'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {selectedConversation.escrow_status}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-0.5">
                  Chatting with {selectedConversation.other_party_role}
                </p>
              </div>
              <Link
                to={`/escrow/${selectedConversation.escrow_id}`}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                View Escrow →
              </Link>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="text-center py-20">
                  <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No messages yet</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Send a message to start the conversation
                  </p>
                </div>
              ) : (
                messages.map((message) => {
                  const isOwn = message.sender_address.toLowerCase() === address?.toLowerCase();
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs px-4 py-2 rounded-lg ${
                          isOwn
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{message.message}</p>
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <p className={`text-xs ${isOwn ? 'text-gray-300' : 'text-gray-500'}`}>
                            {new Date(message.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                          {isOwn && message.read_by.length > 1 && (
                            <CheckCheck className="w-3 h-3 text-blue-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200">
              {selectedConversation.escrow_status === 'completed' ||
              selectedConversation.escrow_status === 'cancelled' ? (
                <div className="text-center py-2">
                  <p className="text-xs text-gray-500">
                    This conversation is closed. You can still read messages.
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={sending || !newMessage.trim()}
                    className="bg-gray-900 text-white p-2 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center p-8">
            <div>
              <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a conversation</h3>
              <p className="text-sm text-gray-600">
                Choose a conversation from the list to start chatting
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
