// src/app/notifications/page.tsx - FIXED RESPONSIVE VERSION
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { Bell, BellOff, Plane, TrendingDown, TrendingUp, Info, X, CheckCheck } from 'lucide-react';

interface Notification {
  id: string;
  userId: string;
  trackedFlightId: string;
  message: string;
  type: 'price_drop' | 'price_rise' | 'price_drop_below_target' | 'price_rise_after_drop' | 'alert' | 'info';
  isRead: boolean;
  sentViaEmail: boolean;
  sentViaInApp: boolean;
  metadata?: {
    oldPrice?: number;
    newPrice?: number;
    targetPrice?: number;
    priceDrop?: number;
    priceDropPercent?: number;
    bookingUrl?: string;
    currency?: string;
  };
  createdAt: Date;
  trackedFlight?: {
    id: string;
    origin: string;
    destination: string;
    targetPrice: number;
  };
}

export default function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [showMarkAllConfirm, setShowMarkAllConfirm] = useState(false);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/notifications', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      } else {
        console.error('Failed to fetch notifications');
        // Fallback to empty array
        setNotifications([]);
      }
    } catch (error) {
      console.error('Fetch notifications error:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId ? { ...notif, isRead: true } : notif
          )
        );
      }
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/notifications/read-all', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
        setShowMarkAllConfirm(false);
      }
    } catch (error) {
      console.error('Mark all as read error:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      }
    } catch (error) {
      console.error('Delete notification error:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'price_drop':
      case 'price_drop_below_target':
        return <TrendingDown className="h-6 w-6 text-green-500" />;
      case 'price_rise':
      case 'price_rise_after_drop':
        return <TrendingUp className="h-6 w-6 text-red-500" />;
      case 'alert':
        return <Bell className="h-6 w-6 text-amber-500" />;
      default:
        return <Info className="h-6 w-6 text-blue-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'price_drop':
      case 'price_drop_below_target':
        return 'border-l-4 border-l-green-500 bg-green-50 dark:bg-green-900/20';
      case 'price_rise':
      case 'price_rise_after_drop':
        return 'border-l-4 border-l-red-500 bg-red-50 dark:bg-red-900/20';
      case 'alert':
        return 'border-l-4 border-l-amber-500 bg-amber-50 dark:bg-amber-900/20';
      default:
        return 'border-l-4 border-l-blue-500 bg-blue-50 dark:bg-blue-900/20';
    }
  };

  const filteredNotifications = notifications.filter(notif => 
    filter === 'all' ? true : !notif.isRead
  );

  const unreadCount = notifications.filter(notif => !notif.isRead).length;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="nav-bar rounded-xl shadow-xl p-8 max-w-md text-center">
          <h1 className="text-2xl roman-heading text-amber-800 dark:text-orange-500 mb-4">
            ACCESS REQUIRED
          </h1>
          <p className="roman-body text-amber-700 dark:text-orange-400 mb-6">
            Please log in to view notifications
          </p>
          <Link href="/login" className="search-button inline-block text-lg py-3 px-8">
            SIGN IN
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 pb-24">
      <div className="nav-bar rounded-xl shadow-xl p-4 sm:p-6 md:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 md:mb-8">
          <div className="flex items-center space-x-3 md:space-x-4 mb-4 sm:mb-0">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-amber-100 dark:bg-orange-100 rounded-full flex items-center justify-center border-2 border-amber-500 dark:border-orange-400">
              <Bell className="h-5 w-5 md:h-6 md:w-6 text-amber-700 dark:text-orange-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl roman-heading text-amber-800 dark:text-orange-500 tracking-widest break-words">
                NOTIFICATIONS
              </h1>
              <p className="roman-body text-amber-700 dark:text-orange-400 text-sm sm:text-base">
                Price alerts and flight updates
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
            {/* Filter Buttons */}
            <div className="flex border-2 border-amber-300 dark:border-orange-700 rounded-lg overflow-hidden">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-2 sm:px-4 sm:py-2 roman-body font-semibold transition-colors text-sm sm:text-base ${
                  filter === 'all' 
                    ? 'bg-amber-500 dark:bg-orange-500 text-white' 
                    : 'text-amber-700 dark:text-orange-400 hover:bg-amber-100 dark:hover:bg-orange-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-3 py-2 sm:px-4 sm:py-2 roman-body font-semibold transition-colors flex items-center space-x-1 sm:space-x-2 text-sm sm:text-base ${
                  filter === 'unread' 
                    ? 'bg-amber-500 dark:bg-orange-500 text-white' 
                    : 'text-amber-700 dark:text-orange-400 hover:bg-amber-100 dark:hover:bg-orange-900'
                }`}
              >
                <span>Unread</span>
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 sm:px-2 sm:py-1 min-w-5 sm:min-w-6 text-xs">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>

            {/* Mark All as Read */}
            {unreadCount > 0 && (
              <button
                onClick={() => setShowMarkAllConfirm(true)}
                className="flex items-center justify-center space-x-2 px-3 py-2 sm:px-4 sm:py-2 border-2 border-amber-500 dark:border-orange-500 text-amber-800 dark:text-orange-400 rounded-lg hover:bg-amber-50 dark:hover:bg-orange-900 transition-colors roman-body font-semibold text-sm sm:text-base"
              >
                <CheckCheck className="h-4 w-4" />
                <span className="whitespace-nowrap">Mark All Read</span>
              </button>
            )}
          </div>
        </div>

        {/* Mark All Confirm Dialog */}
        {showMarkAllConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="nav-bar rounded-xl shadow-xl p-6 max-w-md w-full">
              <h3 className="text-xl roman-heading text-amber-800 dark:text-orange-500 mb-4">
                Mark all as read?
              </h3>
              <p className="roman-body text-amber-700 dark:text-orange-400 mb-6">
                This will mark all {unreadCount} unread notifications as read.
              </p>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                <button
                  onClick={() => setShowMarkAllConfirm(false)}
                  className="flex-1 px-4 py-2 border-2 border-amber-500 dark:border-orange-500 text-amber-800 dark:text-orange-400 rounded-lg hover:bg-amber-50 dark:hover:bg-orange-900 transition-colors roman-body font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={markAllAsRead}
                  className="flex-1 px-4 py-2 search-button roman-body font-semibold"
                >
                  Mark All Read
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notifications List */}
        <div className="space-y-3 sm:space-y-4">
          {loading ? (
            // Loading Skeleton
            Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="p-4 rounded-lg border-2 border-amber-200 dark:border-orange-800">
                  <div className="flex space-x-4">
                    <div className="w-10 h-10 bg-amber-200 dark:bg-orange-800 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-amber-200 dark:bg-orange-800 rounded w-3/4"></div>
                      <div className="h-3 bg-amber-200 dark:bg-orange-800 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : filteredNotifications.length === 0 ? (
            // Empty State
            <div className="text-center py-8 sm:py-12">
              <BellOff className="h-12 w-12 sm:h-16 sm:w-16 text-amber-400 dark:text-orange-600 mx-auto mb-4" />
              <h2 className="text-xl sm:text-2xl roman-heading text-amber-800 dark:text-orange-500 mb-2">
                {filter === 'unread' ? 'NO UNREAD NOTIFICATIONS' : 'NO NOTIFICATIONS'}
              </h2>
              <p className="roman-body text-amber-700 dark:text-orange-400 mb-6 text-sm sm:text-base">
                {filter === 'unread' 
                  ? 'You\'re all caught up! New price alerts will appear here.' 
                  : 'You\'ll see price alerts and flight updates here when they come in.'}
              </p>
              <Link href="/tracking-setup" className="search-button inline-block text-lg py-3 px-6 sm:px-8">
                TRACK NEW FLIGHTS
              </Link>
            </div>
          ) : (
            // Notifications List
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 sm:p-4 rounded-lg border-2 border-amber-200 dark:border-orange-800 transition-all ${getNotificationColor(notification.type)} ${
                  !notification.isRead ? 'ring-2 ring-amber-300 dark:ring-orange-700' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex space-x-3 sm:space-x-4 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 mb-2">
                        {notification.trackedFlight && (
                          <Link 
                            href={`/tracked-flight/${notification.trackedFlight.id}`}
                            className="flex items-center space-x-1 text-amber-700 dark:text-orange-400 hover:text-amber-800 dark:hover:text-orange-300 transition-colors w-fit"
                          >
                            <Plane className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="roman-body font-semibold text-xs sm:text-sm whitespace-nowrap">
                              {notification.trackedFlight.origin} → {notification.trackedFlight.destination}
                            </span>
                          </Link>
                        )}
                        {!notification.isRead && (
                          <span className="px-2 py-1 bg-amber-500 dark:bg-orange-500 text-white text-xs rounded roman-body font-semibold w-fit">
                            NEW
                          </span>
                        )}
                      </div>
                      
                      <p className="roman-body text-amber-800 dark:text-orange-500 mb-2 text-sm sm:text-base break-words">
                        {notification.message}
                      </p>

                      {/* Price change details */}
                      {notification.metadata && (
                        <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 text-xs sm:text-sm text-amber-600 dark:text-orange-400 mb-2">
                          {notification.metadata.oldPrice && notification.metadata.newPrice && (
                            <span className="whitespace-nowrap">
                              <span className="line-through">€{notification.metadata.oldPrice}</span> → 
                              <span className="font-semibold"> €{notification.metadata.newPrice}</span>
                            </span>
                          )}
                          {notification.metadata.priceDropPercent && (
                            <span className={`font-semibold whitespace-nowrap ${
                              notification.type.includes('drop') ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {notification.metadata.priceDropPercent > 0 ? '↓' : '↑'}
                              {Math.abs(notification.metadata.priceDropPercent).toFixed(1)}%
                            </span>
                          )}
                        </div>
                      )}
                      
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 text-xs sm:text-sm text-amber-600 dark:text-orange-400">
                        <span className="whitespace-nowrap">{new Date(notification.createdAt).toLocaleDateString()} • {new Date(notification.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        {notification.sentViaEmail && (
                          <span className="flex items-center space-x-1 whitespace-nowrap">
                            <Bell className="h-3 w-3" />
                            <span>Email</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 sm:space-x-2 ml-2 sm:ml-4 flex-shrink-0">
                    {!notification.isRead && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="p-1 text-amber-600 dark:text-orange-400 hover:text-amber-800 dark:hover:text-orange-300 transition-colors"
                        title="Mark as read"
                      >
                        <CheckCheck className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className="p-1 text-amber-600 dark:text-orange-400 hover:text-red-500 transition-colors"
                      title="Delete notification"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}