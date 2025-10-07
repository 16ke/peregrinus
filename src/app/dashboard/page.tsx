// src/app/dashboard/page.tsx - COMPLETE UPDATED VERSION
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { flightScraperManager } from '@/lib/flight-scraper-manager';

interface TrackedFlight {
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
  isActive: boolean;
  createdAt: Date;
  priceUpdates: Array<{
    id: string;
    price: number;
    currency: string;
    recordedAt: Date;
    airline?: string;
    flightNumber?: string;
  }>;
  specificFlightDetails?: {
    flightNumber?: string;
    airline?: string;
    departureTime?: Date;
  };
  _count: {
    notifications: number;
  };
}

// Loading Skeleton Component
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="roman-card p-6 animate-pulse">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            {/* Flight Info Skeleton */}
            <div className="flex-1 mb-4 lg:mb-0">
              <div className="flex items-center space-x-4 mb-3">
                <div className="w-12 h-12 bg-amber-200 dark:bg-orange-800 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-6 bg-amber-200 dark:bg-orange-800 rounded w-48"></div>
                  <div className="h-4 bg-amber-200 dark:bg-orange-800 rounded w-64"></div>
                </div>
              </div>
            </div>

            {/* Price Info Skeleton */}
            <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-start sm:items-center lg:items-start xl:items-center space-y-2 sm:space-y-0 sm:space-x-4 lg:space-x-0 lg:space-y-2 xl:space-y-0 xl:space-x-4 mb-4 lg:mb-0">
              <div className="text-center">
                <div className="h-8 bg-amber-200 dark:bg-orange-800 rounded w-20 mx-auto"></div>
                <div className="h-3 bg-amber-200 dark:bg-orange-800 rounded w-12 mx-auto mt-1"></div>
              </div>
              
              <div className="text-center">
                <div className="h-7 bg-amber-200 dark:bg-orange-800 rounded w-16 mx-auto"></div>
                <div className="h-3 bg-amber-200 dark:bg-orange-800 rounded w-10 mx-auto mt-1"></div>
              </div>

              <div className="px-3 py-1 bg-amber-200 dark:bg-orange-800 rounded-lg">
                <div className="h-6 bg-amber-200 dark:bg-orange-800 rounded w-12 mx-auto"></div>
                <div className="h-3 bg-amber-200 dark:bg-orange-800 rounded w-16 mx-auto mt-1"></div>
              </div>
            </div>

            {/* Actions Skeleton */}
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <div className="w-32 h-10 bg-amber-200 dark:bg-orange-800 rounded-lg"></div>
              <div className="w-24 h-10 bg-amber-200 dark:bg-orange-800 rounded-lg"></div>
            </div>
          </div>

          {/* Price History Skeleton */}
          <div className="mt-4 pt-4 border-t-2 border-amber-200 dark:border-orange-800">
            <div className="flex justify-between items-center mb-2">
              <div className="h-4 bg-amber-200 dark:bg-orange-800 rounded w-24"></div>
              <div className="h-3 bg-amber-200 dark:bg-orange-800 rounded w-20"></div>
            </div>
            <div className="flex items-end h-8 space-x-1">
              {Array.from({ length: 8 }).map((_, barIndex) => (
                <div
                  key={barIndex}
                  className="flex-1 bg-amber-200 dark:bg-orange-800 rounded-t"
                  style={{ height: `${30 + (barIndex * 8)}%` }}
                />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();
  const [trackedFlights, setTrackedFlights] = useState<TrackedFlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      fetchTrackedFlights();
    }
  }, [user]);

  const fetchTrackedFlights = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/flights/track', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Fetched tracked flights with specific details:', data.trackedFlights);
        setTrackedFlights(data.trackedFlights || []);
      } else {
        setError('Failed to load tracked flights');
        addToast({
          type: 'error',
          title: 'Load Failed',
          message: 'Unable to load your tracked flights'
        });
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setError('Failed to load tracked flights');
      addToast({
        type: 'error',
        title: 'Network Error',
        message: 'Failed to load tracked flights. Please check your connection.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStopTracking = async (flightId: string, flightRoute: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/flights/track/${flightId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setTrackedFlights(prev => prev.filter(flight => flight.id !== flightId));
        addToast({
          type: 'success',
          title: 'Tracking Stopped',
          message: `No longer tracking ${flightRoute}`
        });
      } else {
        addToast({
          type: 'error',
          title: 'Stop Failed',
          message: 'Unable to stop tracking this flight'
        });
      }
    } catch (error) {
      console.error('Stop tracking error:', error);
      addToast({
        type: 'error',
        title: 'Network Error',
        message: 'Failed to stop tracking. Please check your connection.'
      });
    }
  };

  const handleManualPriceCheck = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/flights/check-prices', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        addToast({
          type: 'success',
          title: 'Price Check Complete',
          message: `Checked ${result.results.length} flights, found ${result.notifications} price changes`
        });
        // Refresh the tracked flights to show updated prices
        fetchTrackedFlights();
      } else {
        addToast({
          type: 'error',
          title: 'Price Check Failed',
          message: 'Unable to check prices at this time'
        });
      }
    } catch (error) {
      console.error('Manual price check error:', error);
      addToast({
        type: 'error',
        title: 'Network Error',
        message: 'Failed to check prices. Please check your connection.'
      });
    }
  };

  const getPriceStatus = (currentPrice: number, targetPrice: number) => {
    if (currentPrice <= targetPrice) {
      return { status: 'below', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900' };
    } else if (currentPrice <= targetPrice * 1.1) {
      return { status: 'close', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900' };
    } else {
      return { status: 'above', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900' };
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="nav-bar rounded-xl shadow-xl p-8 max-w-md text-center">
          <h1 className="text-2xl roman-heading text-amber-800 dark:text-orange-500 mb-4">
            ACCESS REQUIRED
          </h1>
          <p className="roman-body text-amber-700 dark:text-orange-400 mb-6">
            Please log in to view your dashboard
          </p>
          <Link 
            href="/login" 
            className="search-button inline-block text-lg py-3 px-8"
          >
            SIGN IN
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="nav-bar rounded-xl shadow-xl p-8 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl roman-heading text-amber-800 dark:text-orange-500 mb-2 tracking-widest">
              YOUR TRACKED FLIGHTS
            </h1>
            <p className="roman-body text-amber-700 dark:text-orange-400">
              Monitor price changes and get smart alerts
            </p>
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 mt-4 md:mt-0">
            <button
              onClick={handleManualPriceCheck}
              className="px-4 py-2 border-2 border-amber-500 dark:border-orange-500 text-amber-800 dark:text-orange-400 rounded-lg hover:bg-amber-50 dark:hover:bg-orange-900 transition-colors roman-body font-semibold text-center"
            >
              CHECK PRICES NOW
            </button>
            <Link 
              href="/tracking-setup" 
              className="search-button text-lg py-3 px-6 inline-block text-center"
            >
              + TRACK NEW FLIGHT
            </Link>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-100 dark:bg-red-900 border-2 border-red-300 dark:border-red-700 rounded-lg mb-6">
            <p className="roman-body text-red-700 dark:text-red-300 text-center">{error}</p>
          </div>
        )}

        {loading ? (
          <DashboardSkeleton />
        ) : trackedFlights.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">✈️</div>
            <h2 className="text-2xl roman-heading text-amber-800 dark:text-orange-500 mb-4">
              NO TRACKED FLIGHTS YET
            </h2>
            <p className="roman-body text-amber-700 dark:text-orange-400 mb-6">
              Start tracking flight prices to see them here
            </p>
            <Link 
              href="/tracking-setup" 
              className="search-button text-lg py-3 px-8 inline-block"
            >
              SET UP YOUR FIRST TRACKER
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {trackedFlights.map((flight) => {
              const priceStatus = getPriceStatus(flight.currentPrice, flight.targetPrice);
              const priceDifference = ((flight.currentPrice - flight.targetPrice) / flight.targetPrice * 100).toFixed(1);
              
              return (
                <div key={flight.id} className="roman-card p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    {/* Flight Info - ENHANCED WITH SPECIFIC FLIGHT DETAILS */}
                    <div className="flex-1 mb-4 lg:mb-0">
                      <div className="flex items-center space-x-4 mb-3">
                        <div className="w-12 h-12 bg-amber-100 dark:bg-orange-100 rounded-full flex items-center justify-center border-2 border-amber-500 dark:border-orange-400">
                          <span className="text-amber-700 dark:text-orange-600 font-bold text-sm">
                            {flight.specificFlightDetails?.airline 
                              ? flightScraperManager.getAirlineLogo(flight.specificFlightDetails.airline)
                              : `${flight.origin}-${flight.destination}`
                            }
                          </span>
                        </div>
                        <div>
                          <h3 className="text-xl roman-heading text-amber-800 dark:text-orange-500 tracking-wide">
                            {flight.origin} → {flight.destination}
                            {flight.isRoundTrip && ' (Round Trip)'}
                          </h3>
                          <p className="roman-body text-amber-700 dark:text-orange-400">
                            {flight.departureDate ? formatDate(new Date(flight.departureDate)) : 'Flexible dates'}
                            {flight.specificFlightDetails?.flightNumber && ` • ${flight.specificFlightDetails.flightNumber}`}
                            {flight.specificFlightDetails?.departureTime && ` • ${formatTime(new Date(flight.specificFlightDetails.departureTime))}`}
                            {flight.airlineFilter && flight.airlineFilter !== 'ANY' && !flight.specificFlightDetails?.airline && ` • ${flight.airlineFilter}`}
                          </p>
                          {flight.specificFlightDetails?.airline && (
                            <p className="text-sm text-amber-600 dark:text-orange-400 mt-1">
                              {flight.specificFlightDetails.airline} • Tracked since {formatDate(new Date(flight.createdAt))}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Price Info */}
                    <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-start sm:items-center lg:items-start xl:items-center space-y-2 sm:space-y-0 sm:space-x-4 lg:space-x-0 lg:space-y-2 xl:space-y-0 xl:space-x-4 mb-4 lg:mb-0">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-amber-800 dark:text-orange-500">
                          €{flight.currentPrice}
                        </div>
                        <div className="text-sm roman-body text-amber-700 dark:text-orange-400">
                          Current
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-xl font-bold text-amber-800 dark:text-orange-500">
                          €{flight.targetPrice}
                        </div>
                        <div className="text-sm roman-body text-amber-700 dark:text-orange-400">
                          Target
                        </div>
                      </div>

                      <div className={`text-center px-3 py-1 rounded-lg ${priceStatus.bg}`}>
                        <div className={`text-lg font-bold ${priceStatus.color}`}>
                          {priceDifference}%
                        </div>
                        <div className={`text-xs ${priceStatus.color}`}>
                          {priceStatus.status === 'below' ? 'BELOW TARGET' : 
                           priceStatus.status === 'close' ? 'CLOSE TO TARGET' : 'ABOVE TARGET'}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                      <Link
                        href={`/tracked-flight/${flight.id}`}
                        className="px-4 py-2 border-2 border-amber-500 dark:border-orange-500 text-amber-800 dark:text-orange-400 rounded-lg hover:bg-amber-50 dark:hover:bg-orange-900 transition-colors roman-body font-semibold text-center"
                      >
                        VIEW DETAILS
                      </Link>
                      
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to stop tracking this flight?')) {
                            handleStopTracking(flight.id, `${flight.origin} → ${flight.destination}`);
                          }
                        }}
                        className="px-4 py-2 border-2 border-red-500 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900 transition-colors roman-body font-semibold"
                      >
                        STOP TRACKING
                      </button>
                      
                      {flight._count.notifications > 0 && (
                        <div className="px-4 py-2 bg-amber-500 dark:bg-orange-500 text-white rounded-lg text-center roman-body font-semibold">
                          {flight._count.notifications} ALERT{flight._count.notifications !== 1 ? 'S' : ''}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Price History Preview */}
                  {flight.priceUpdates.length > 0 && (
                    <div className="mt-4 pt-4 border-t-2 border-amber-200 dark:border-orange-800">
                      <div className="flex justify-between items-center mb-2">
                        <span className="roman-body text-amber-700 dark:text-orange-400 font-semibold">
                          PRICE HISTORY ({flight.priceUpdates.length} updates)
                        </span>
                        <span className="text-sm roman-body text-amber-600 dark:text-orange-300">
                          Lowest: €{flight.lowestPrice} • Highest: €{flight.highestPrice}
                        </span>
                      </div>
                      <div className="flex items-end h-8 space-x-1">
                        {flight.priceUpdates.slice(-10).map((update, index) => {
                          const maxPrice = flight.highestPrice;
                          const minPrice = flight.lowestPrice;
                          const priceRange = maxPrice - minPrice;
                          const height = priceRange > 0 ? ((update.price - minPrice) / priceRange) * 100 : 50;
                          
                          return (
                            <div
                              key={update.id}
                              className={`flex-1 rounded-t ${
                                update.price <= flight.targetPrice 
                                  ? 'bg-green-500' 
                                  : Math.abs(update.price - flight.currentPrice) < 0.01
                                  ? 'bg-amber-500 dark:bg-orange-500'
                                  : 'bg-amber-300 dark:bg-orange-700'
                              }`}
                              style={{ height: `${Math.max(20, height)}%` }}
                              title={`€${update.price} - ${new Date(update.recordedAt).toLocaleDateString()}`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}