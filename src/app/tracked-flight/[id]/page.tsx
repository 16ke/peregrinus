// src/app/tracked-flight/[id]/page.tsx - REAL DATA VERSION
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, Clock, Plane, AlertCircle, TrendingDown, TrendingUp } from 'lucide-react';

interface TrackedFlightDetail {
  id: string;
  origin: string;
  destination: string;
  targetPrice: number;
  currentPrice: number;
  lowestPrice: number;
  highestPrice: number;
  isRoundTrip: boolean;
  dateRangeStart?: Date;
  dateRangeEnd?: Date;
  departureDate?: Date;
  preferredTimeStart?: string;
  preferredTimeEnd?: string;
  airlineFilter?: string;
  maxStops?: number;
  isActive: boolean;
  createdAt: Date;
  priceUpdates: Array<{
    id: string;
    price: number;
    currency: string;
    recordedAt: Date;
    airline?: string;
  }>;
  notifications: Array<{
    id: string;
    message: string;
    type: string;
    createdAt: Date;
    isRead: boolean;
  }>;
}

export default function TrackedFlightDetail() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const [flight, setFlight] = useState<TrackedFlightDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && params.id) {
      fetchTrackedFlight();
    }
  }, [user, params.id]);

  const fetchTrackedFlight = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/flights/track/${params.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFlight(data.trackedFlight);
      } else {
        setError('Failed to load flight details');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setError('Failed to load flight details');
    } finally {
      setLoading(false);
    }
  };

  const handleStopTracking = async () => {
    if (!flight || !confirm('Are you sure you want to stop tracking this flight?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/flights/track/${flight.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        router.push('/dashboard');
      } else {
        alert('Failed to stop tracking');
      }
    } catch (error) {
      console.error('Stop tracking error:', error);
      alert('Failed to stop tracking');
    }
  };

  const handleFindFlights = () => {
    // Redirect to search page with pre-filled route
    if (flight) {
      router.push(`/?origin=${flight.origin}&destination=${flight.destination}`);
    }
  };

  const getPriceStatus = (current: number, target: number) => {
    if (current <= target) return { status: 'below', color: 'text-green-600', bg: 'bg-green-100', icon: TrendingDown };
    if (current <= target * 1.1) return { status: 'close', color: 'text-yellow-600', bg: 'bg-yellow-100', icon: AlertCircle };
    return { status: 'above', color: 'text-red-600', bg: 'bg-red-100', icon: TrendingUp };
  };

  const formatDate = (date: Date) => new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  const formatDateTime = (date: Date) => new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="nav-bar rounded-xl shadow-xl p-8 max-w-md text-center">
          <h1 className="text-2xl roman-heading text-amber-800 dark:text-orange-500 mb-4">ACCESS REQUIRED</h1>
          <p className="roman-body text-amber-700 dark:text-orange-400 mb-6">Please log in to view flight details</p>
          <Link href="/login" className="search-button inline-block text-lg py-3 px-8">SIGN IN</Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="roman-heading text-2xl text-amber-800 dark:text-orange-500 mb-4">LOADING FLIGHT DETAILS...</div>
        </div>
      </div>
    );
  }

  if (error || !flight) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="nav-bar rounded-xl shadow-xl p-8 max-w-md text-center">
          <h1 className="text-2xl roman-heading text-amber-800 dark:text-orange-500 mb-4">ERROR</h1>
          <p className="roman-body text-amber-700 dark:text-orange-400 mb-6">{error || 'Flight not found'}</p>
          <Link href="/dashboard" className="search-button inline-block text-lg py-3 px-8">BACK TO DASHBOARD</Link>
        </div>
      </div>
    );
  }

  const priceStatus = getPriceStatus(flight.currentPrice, flight.targetPrice);
  const StatusIcon = priceStatus.icon;

  return (
    <div className="max-w-6xl mx-auto p-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link href="/dashboard" className="flex items-center space-x-2 text-amber-700 dark:text-orange-400 hover:text-amber-800 dark:hover:text-orange-300 transition-colors">
          <ArrowLeft className="h-5 w-5" />
          <span className="roman-body font-semibold">BACK TO DASHBOARD</span>
        </Link>
        
        <button
          onClick={handleStopTracking}
          className="px-4 py-2 border-2 border-red-500 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900 transition-colors roman-body font-semibold"
        >
          STOP TRACKING
        </button>
      </div>

      <div className="space-y-6">
        {/* Flight Overview Card */}
        <div className="nav-bar rounded-xl shadow-xl p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1 mb-4 lg:mb-0">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-amber-100 dark:bg-orange-100 rounded-full flex items-center justify-center border-2 border-amber-500 dark:border-orange-400">
                  <Plane className="h-8 w-8 text-amber-700 dark:text-orange-600" />
                </div>
                <div>
                  <h1 className="text-3xl roman-heading text-amber-800 dark:text-orange-500 tracking-wide">
                    {flight.origin} → {flight.destination}
                    {flight.isRoundTrip && ' (Round Trip)'}
                  </h1>
                  <div className="flex flex-wrap gap-4 mt-2">
                    <div className="flex items-center space-x-1 text-amber-700 dark:text-orange-400">
                      <Calendar className="h-4 w-4" />
                      <span className="roman-body">
                        {flight.departureDate ? formatDate(new Date(flight.departureDate)) : 'Flexible dates'}
                      </span>
                    </div>
                    {flight.preferredTimeStart && (
                      <div className="flex items-center space-x-1 text-amber-700 dark:text-orange-400">
                        <Clock className="h-4 w-4" />
                        <span className="roman-body">{flight.preferredTimeStart} - {flight.preferredTimeEnd}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Price Overview */}
            <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-start sm:items-center lg:items-start xl:items-center space-y-3 sm:space-y-0 sm:space-x-6 lg:space-x-0 lg:space-y-3 xl:space-y-0 xl:space-x-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-amber-800 dark:text-orange-500">€{flight.currentPrice}</div>
                <div className="text-sm roman-body text-amber-700 dark:text-orange-400">Current</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-800 dark:text-orange-500">€{flight.targetPrice}</div>
                <div className="text-sm roman-body text-amber-700 dark:text-orange-400">Target</div>
              </div>

              <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${priceStatus.bg} ${priceStatus.color}`}>
                <StatusIcon className="h-5 w-5" />
                <span className="roman-body font-semibold">
                  {priceStatus.status === 'below' ? 'BELOW TARGET' : 
                   priceStatus.status === 'close' ? 'CLOSE TO TARGET' : 'ABOVE TARGET'}
                </span>
              </div>
            </div>
          </div>

          {/* Price Range */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t-2 border-amber-200 dark:border-orange-800">
            <div className="text-center">
              <div className="text-lg font-bold text-green-600 dark:text-green-400">€{flight.lowestPrice}</div>
              <div className="text-sm roman-body text-amber-700 dark:text-orange-400">Lowest</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-red-600 dark:text-red-400">€{flight.highestPrice}</div>
              <div className="text-sm roman-body text-amber-700 dark:text-orange-400">Highest</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-amber-800 dark:text-orange-500">
                {flight.priceUpdates.length}
              </div>
              <div className="text-sm roman-body text-amber-700 dark:text-orange-400">Price Checks</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-amber-800 dark:text-orange-500">
                {flight.notifications.filter(n => !n.isRead).length}
              </div>
              <div className="text-sm roman-body text-amber-700 dark:text-orange-400">New Alerts</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Price History Chart */}
          <div className="nav-bar rounded-xl shadow-xl p-6">
            <h2 className="text-2xl roman-heading text-amber-800 dark:text-orange-500 mb-4 tracking-widest">
              PRICE HISTORY
            </h2>
            
            <div className="space-y-3">
              {flight.priceUpdates.length === 0 ? (
                <div className="text-center py-8">
                  <p className="roman-body text-amber-700 dark:text-orange-400">No price data yet. Checking for prices...</p>
                </div>
              ) : (
                flight.priceUpdates.slice().reverse().map((update, index) => {
                  const isLowest = update.price === flight.lowestPrice;
                  const isHighest = update.price === flight.highestPrice;
                  const isCurrent = index === 0;
                  
                  return (
                    <div key={update.id} className="flex items-center justify-between p-3 rounded-lg border-2 border-amber-200 dark:border-orange-800">
                      <div className="flex items-center space-x-3">
                        <div className={`
                          w-3 h-3 rounded-full
                          ${isLowest ? 'bg-green-500' : 
                            isHighest ? 'bg-red-500' : 
                            isCurrent ? 'bg-amber-500' : 'bg-amber-300'}
                        `} />
                        <div>
                          <div className="roman-body font-semibold text-amber-800 dark:text-orange-500">
                            €{update.price}
                          </div>
                          <div className="text-sm text-amber-600 dark:text-orange-400">
                            {update.airline || 'Multiple'} • {formatDateTime(update.recordedAt)}
                          </div>
                        </div>
                      </div>
                      {isLowest && <TrendingDown className="h-5 w-5 text-green-500" />}
                      {isHighest && <TrendingUp className="h-5 w-5 text-red-500" />}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Notifications */}
          <div className="nav-bar rounded-xl shadow-xl p-6">
            <h2 className="text-2xl roman-heading text-amber-800 dark:text-orange-500 mb-4 tracking-widest">
              ALERTS & NOTIFICATIONS
            </h2>
            
            <div className="space-y-3">
              {flight.notifications.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-amber-400 dark:text-orange-600 mx-auto mb-3" />
                  <p className="roman-body text-amber-700 dark:text-orange-400">No notifications yet</p>
                </div>
              ) : (
                flight.notifications.map((notification) => (
                  <div key={notification.id} className={`
                    p-4 rounded-lg border-2 transition-all
                    ${notification.isRead 
                      ? 'border-amber-200 dark:border-orange-800 bg-amber-50 dark:bg-orange-950' 
                      : 'border-amber-400 dark:border-orange-500 bg-amber-100 dark:bg-orange-900'
                    }
                  `}>
                    <div className="flex justify-between items-start mb-2">
                      <span className={`
                        roman-body font-semibold
                        ${notification.type === 'price_drop' ? 'text-green-600 dark:text-green-400' : 
                          notification.type === 'price_rise' ? 'text-red-600 dark:text-red-400' : 
                          'text-amber-700 dark:text-orange-400'}
                      `}>
                        {notification.type === 'price_drop' ? 'PRICE DROP!' : 
                         notification.type === 'price_rise' ? 'PRICE INCREASE' : 'ALERT'}
                      </span>
                      {!notification.isRead && (
                        <span className="px-2 py-1 bg-amber-500 dark:bg-orange-500 text-white text-xs rounded">NEW</span>
                      )}
                    </div>
                    <p className="roman-body text-amber-800 dark:text-orange-500 mb-2">
                      {notification.message}
                    </p>
                    <div className="text-sm text-amber-600 dark:text-orange-400">
                      {formatDateTime(notification.createdAt)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="nav-bar rounded-xl shadow-xl p-6">
          <h2 className="text-2xl roman-heading text-amber-800 dark:text-orange-500 mb-4 tracking-widest text-center">
            {flight.currentPrice <= flight.targetPrice ? '🎉 PRICE IS GOOD! TIME TO BOOK' : 'FIND CURRENT FLIGHTS'}
          </h2>
          <div className="text-center">
            <button 
              onClick={handleFindFlights}
              className="search-button text-xl py-4 px-12"
            >
              {flight.currentPrice <= flight.targetPrice ? 'BOOK FLIGHTS NOW' : 'CHECK CURRENT PRICES'}
            </button>
            <p className="roman-body text-amber-700 dark:text-orange-400 mt-3">
              {flight.currentPrice <= flight.targetPrice 
                ? `Current price (€${flight.currentPrice}) is below your target (€${flight.targetPrice})`
                : `Search for current flights on ${flight.origin} → ${flight.destination}`
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}