// ============================================================
// NOTIFICATION BELL - Header Component
// Minimalistic monochromatic bell icon with red badge
// ============================================================

import { useState, useEffect, useRef } from 'react';
import { Bell, X, Check } from 'lucide-react';
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

export function NotificationBell() {
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
    setNotifications(data.slice(0, 10)); // Show only latest 10

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
      setNotifications((prev) => [notification, ...prev].slice(0, 10));
      setUnreadCount((prev) => prev + 1);
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
    <div className="relative" ref={panelRef}>
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-md transition-all"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4 text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50 animate-fade-in">
          {/* Header */}
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full font-medium">
                    {unreadCount}
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mark all as read */}
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="mt-2 text-xs text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1"
              >
                <Check className="w-3 h-3" />
                Mark all as read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full mx-auto mb-2"></div>
                <p className="text-xs text-gray-500">Loading...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No notifications</p>
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
                    className={`block p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      !notification.is_read ? 'bg-blue-50/30' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={`text-xs font-medium text-gray-900 ${
                              !notification.is_read ? 'font-semibold' : ''
                            }`}
                          >
                            {notification.title}
                          </p>
                          {!notification.is_read && (
                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0 mt-1"></div>
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
            <div className="p-2 bg-gray-50 border-t border-gray-200">
              <Link
                to="/dashboard?tab=notifications"
                onClick={() => setIsOpen(false)}
                className="text-xs text-gray-600 hover:text-gray-900 font-medium block text-center py-1"
              >
                View all
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
