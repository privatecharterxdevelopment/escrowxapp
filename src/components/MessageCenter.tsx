// ============================================================
// MESSAGE CENTER COMPONENT
// Floating chat icon with notification badge and message panel
// ============================================================

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Check, CheckCheck, Bell, Mail } from 'lucide-react';
import { useAccount } from 'wagmi';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  subscribeToNotifications,
  type Notification,
} from '../lib/notifications';
import { Link } from 'react-router-dom';

export function MessageCenter() {
  const { address } = useAccount();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Load notifications
  const loadNotifications = async () => {
    if (!address) return;

    setLoading(true);
    const data = await getNotifications(address);
    setNotifications(data);

    const count = await getUnreadCount(address);
    setUnreadCount(count);
    setLoading(false);
  };

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!address) return;

    loadNotifications();

    // Subscribe to new notifications
    const unsubscribe = subscribeToNotifications(address, (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);

      // Play notification sound
      playNotificationSound();

      // Show browser notification if permitted
      showBrowserNotification(notification);
    });

    return () => {
      unsubscribe();
    };
  }, [address]);

  // Close panel when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const playNotificationSound = () => {
    const audio = new Audio('/notification.mp3');
    audio.volume = 0.3;
    audio.play().catch(() => {
      // Ignore errors (audio blocked by browser)
    });
  };

  const showBrowserNotification = (notification: Notification) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/logo.png',
        badge: '/logo.png',
      });
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    if (!address) return;

    const success = await markAsRead(notificationId, address);
    if (success) {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!address) return;

    const success = await markAllAsRead(address);
    if (success) {
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message_received':
        return <MessageCircle className="w-4 h-4 text-blue-600" />;
      case 'signature_added':
      case 'signature_requested':
        return <Check className="w-4 h-4 text-green-600" />;
      case 'status_changed':
        return <Bell className="w-4 h-4 text-purple-600" />;
      case 'escrow_created':
        return <Mail className="w-4 h-4 text-gray-600" />;
      default:
        return <Bell className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
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

  if (!address) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50" ref={panelRef}>
      {/* Message Panel */}
      {isOpen && (
        <div className="absolute bottom-20 right-0 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-gray-900 to-gray-700 text-white p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                <h3 className="font-semibold">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mark all as read */}
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="mt-2 text-xs text-white/80 hover:text-white transition-colors flex items-center gap-1"
              >
                <CheckCheck className="w-3 h-3" />
                Mark all as read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-gray-500">
                <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full mx-auto mb-2"></div>
                Loading...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              <div>
                {notifications.map((notification) => (
                  <Link
                    key={notification.id}
                    to={
                      notification.escrow_id
                        ? `/escrow/${notification.escrow_id}`
                        : '/dashboard'
                    }
                    onClick={() => {
                      if (!notification.is_read) {
                        handleMarkAsRead(notification.id);
                      }
                      setIsOpen(false);
                    }}
                    className={`block p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      !notification.is_read ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {getNotificationIcon(notification.notification_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={`text-sm font-medium text-gray-900 ${
                              !notification.is_read ? 'font-semibold' : ''
                            }`}
                          >
                            {notification.title}
                          </p>
                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1"></div>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatTimestamp(notification.created_at)}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 bg-gray-50 border-t border-gray-200">
              <Link
                to="/dashboard?tab=notifications"
                onClick={() => setIsOpen(false)}
                className="text-xs text-gray-600 hover:text-gray-900 font-medium block text-center"
              >
                View all notifications
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gray-900 text-white p-4 rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-110 relative"
      >
        <MessageCircle className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-6 h-6 flex items-center justify-center rounded-full font-semibold animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
    </div>
  );
}
