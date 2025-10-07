// src/components/FlightSearch.tsx - COMPLETE UPDATED VERSION
'use client';

import { useState } from 'react';
import { FlightSearch as FlightSearchType, Flight } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { flightScraperManager } from '@/lib/flight-scraper-manager';

const CITIES = [
  { code: 'LGW', name: 'London Gatwick' },
  { code: 'STN', name: 'London Stansted' },
  { code: 'TIA', name: 'Tirana' },
  { code: 'VCE', name: 'Venezia Marco Polo' },
  { code: 'TSF', name: 'Venezia Treviso' },
  { code: 'VLC', name: 'Valencia' },
  { code: 'VOA', name: 'Vlore' },
].sort((a, b) => a.name.localeCompare(b.name));

const CURRENCIES = [
  { code: 'EUR', symbol: '€', name: 'EUR' },
  { code: 'GBP', symbol: '£', name: 'GBP' },
];

// Real conversion rates (approximate)
const CONVERSION_RATES = {
  EUR: 1,
  GBP: 1.18, // 1 EUR = 1.18 GBP (approx)
};

export default function FlightSearch() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [searchParams, setSearchParams] = useState<FlightSearchType>({
    origin: '',
    destination: '',
    departureDate: '',
    returnDate: '',
    maxPrice: '',
  });
  const [searchCurrency, setSearchCurrency] = useState('EUR'); // Currency for search/max price
  const [trackingCurrency, setTrackingCurrency] = useState('EUR'); // Currency for target price only
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(false);
  const [trackingPrice, setTrackingPrice] = useState<number>(0);
  const [hasSearched, setHasSearched] = useState(false);

  // Get default date (2 months from now)
  const getDefaultDate = () => {
    const date = new Date();
    date.setMonth(date.getMonth() + 2);
    return date.toISOString().split('T')[0];
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setHasSearched(true);

    try {
      // Use the departure date from search params, or default to 2 months from now
      const searchDate = searchParams.departureDate || getDefaultDate();
      
      const response = await fetch(
        `/api/flights/search?origin=${searchParams.origin}&destination=${searchParams.destination}&date=${searchDate}`
      );
      const data = await response.json();
      
      // Filter by max price if set (convert max price to EUR for comparison)
      let filteredFlights = data.flights || [];
      if (searchParams.maxPrice) {
        const maxPriceInEUR = searchCurrency === 'GBP' 
          ? Number(searchParams.maxPrice) / CONVERSION_RATES.GBP
          : Number(searchParams.maxPrice);
        
        filteredFlights = filteredFlights.filter((flight: Flight) => 
          flight.price <= maxPriceInEUR
        );
      }
      
      setFlights(filteredFlights);
    } catch (error) {
      console.error('Search error:', error);
      setFlights([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTrackFlight = async (flight: Flight) => {
    if (!user) {
      addToast({
        type: 'error',
        title: 'Login Required',
        message: 'Please log in to track flights'
      });
      return;
    }

    if (!trackingPrice || trackingPrice <= 0) {
      addToast({
        type: 'warning',
        title: 'Target Price Required',
        message: 'Please set a target price to track this flight'
      });
      return;
    }

    try {
      let token;
      if (typeof window !== 'undefined') {
        token = localStorage.getItem('token');
      }

      if (!token) {
        addToast({
          type: 'error',
          title: 'Authentication Error',
          message: 'Please log in again'
        });
        return;
      }

      console.log('Sending SPECIFIC flight tracking request:', {
        flightNumber: flight.flightNumber,
        airline: flight.airline,
        departureTime: flight.departure
      });

      // UPDATED: Send specific flight data instead of just route
      const response = await fetch('/api/flights/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          // Specific flight data
          origin: flight.origin,
          destination: flight.destination,
          flightNumber: flight.flightNumber,
          airline: flight.airline,
          departureDate: flight.departure.toISOString().split('T')[0],
          departureTime: flight.departure.toTimeString().split(' ')[0].substring(0, 5), // "HH:MM" format
          currentPrice: flight.price, // Actual current price
          targetPrice: trackingPrice,
          currency: trackingCurrency,
          bookingUrl: flight.bookingUrl, // Store the actual booking URL
        }),
      });

      const responseData = await response.json();

      if (response.ok) {
        addToast({
          type: 'success',
          title: 'Flight Tracking Started!',
          message: `Now tracking ${flight.airline} ${flight.flightNumber} on ${flight.departure.toLocaleDateString()}`
        });
        setTrackingPrice(0);
      } else {
        console.log('Tracking failed response:', responseData);
        addToast({
          type: 'error',
          title: 'Tracking Failed',
          message: responseData.error || 'Unable to track this flight'
        });
      }
    } catch (error) {
      console.error('Tracking error:', error);
      addToast({
        type: 'error',
        title: 'Network Error',
        message: 'Failed to track flight. Please check your connection.'
      });
    }
  };

  const handleRefineSearch = () => {
    setHasSearched(false);
    setFlights([]);
  };

  const getSearchCurrencySymbol = () => {
    return CURRENCIES.find(c => c.code === searchCurrency)?.symbol || '€';
  };

  const getTrackingCurrencySymbol = () => {
    return CURRENCIES.find(c => c.code === trackingCurrency)?.symbol || '€';
  };

  // Convert flight price to selected search currency for display
  const getDisplayPrice = (flight: Flight) => {
    if (searchCurrency === 'GBP') {
      return (flight.price * CONVERSION_RATES.GBP).toFixed(0);
    }
    return flight.price.toFixed(0);
  };

  // Check if this is a real booking link (not placeholder)
  const isRealBookingLink = (bookingUrl: string | undefined): boolean => {
    return !!bookingUrl && !bookingUrl.includes('example.com');
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Search Form - FIXED: Removed sticky class */}
      <div className="nav-bar rounded-xl shadow-xl p-8 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl roman-heading text-amber-800 dark:text-orange-500 tracking-widest">
            FIND YOUR PERFECT FLIGHT
          </h1>
          {hasSearched && (
            <button
              onClick={handleRefineSearch}
              className="px-4 py-2 border-2 border-amber-500 dark:border-orange-500 text-amber-800 dark:text-orange-400 rounded-lg hover:bg-amber-50 dark:hover:bg-orange-900 transition-colors roman-body font-semibold"
            >
              REFINE SEARCH
            </button>
          )}
        </div>
        
        <form onSubmit={handleSearch} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="block text-lg roman-body text-amber-800 dark:text-orange-500 mb-2 font-semibold">
                FROM
              </label>
              <select
                value={searchParams.origin}
                onChange={(e) =>
                  setSearchParams({ ...searchParams, origin: e.target.value })
                }
                className="roman-input w-full"
                required
              >
                <option value="">Select origin</option>
                {CITIES.map((city) => (
                  <option key={city.code} value={city.code}>
                    {city.name} ({city.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-lg roman-body text-amber-800 dark:text-orange-500 mb-2 font-semibold">
                TO
              </label>
              <select
                value={searchParams.destination}
                onChange={(e) =>
                  setSearchParams({ ...searchParams, destination: e.target.value })
                }
                className="roman-input w-full"
                required
              >
                <option value="">Select destination</option>
                {CITIES.map((city) => (
                  <option key={city.code} value={city.code}>
                    {city.name} ({city.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-lg roman-body text-amber-800 dark:text-orange-500 mb-2 font-semibold">
                DEPARTURE
              </label>
              <input
                type="date"
                value={searchParams.departureDate}
                onChange={(e) =>
                  setSearchParams({ ...searchParams, departureDate: e.target.value })
                }
                className="roman-input w-full dark:bg-black dark:text-white"
                required
                onClick={(e) => (e.target as HTMLInputElement).showPicker()}
                min={getDefaultDate()}
              />
            </div>

            <div>
              <label className="block text-lg roman-body text-amber-800 dark:text-orange-500 mb-2 font-semibold">
                RETURN
              </label>
              <input
                type="date"
                value={searchParams.returnDate || ''}
                onChange={(e) =>
                  setSearchParams({ ...searchParams, returnDate: e.target.value })
                }
                className="roman-input w-full dark:bg-black dark:text-white"
                onClick={(e) => (e.target as HTMLInputElement).showPicker()}
                min={searchParams.departureDate || getDefaultDate()}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-2">
              <label className="block text-lg roman-body text-amber-800 dark:text-orange-500 mb-2 font-semibold">
                MAX PRICE
              </label>
              <div className="flex space-x-3">
                <select
                  value={searchCurrency}
                  onChange={(e) => setSearchCurrency(e.target.value)}
                  className="roman-input !w-32"
                >
                  {CURRENCIES.map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {currency.symbol} {currency.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Enter maximum price"
                  value={searchParams.maxPrice || ''}
                  onChange={(e) =>
                    setSearchParams({ ...searchParams, maxPrice: e.target.value })
                  }
                  className="roman-input flex-1 min-w-0"
                  min="0"
                />
              </div>
            </div>
            
            <div className="lg:col-span-2 flex items-end justify-end">
              <button
                type="submit"
                disabled={loading}
                className="search-button w-full lg:w-auto text-xl py-4 px-12 disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>SEARCHING...</span>
                  </div>
                ) : (
                  'SEARCH FLIGHTS'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Results Area */}
      {hasSearched && (
        <div className="space-y-6">
          {/* Loading State */}
          {loading && (
            <div className="nav-bar rounded-xl shadow-xl p-8 text-center">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-12 h-12 border-4 border-amber-500 dark:border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                <div className="roman-heading text-xl text-amber-800 dark:text-orange-500">
                  SEARCHING FOR FLIGHTS...
                </div>
                <p className="roman-body text-amber-700 dark:text-orange-400">
                  Checking airlines for the best prices
                </p>
              </div>
            </div>
          )}

          {/* No Results State */}
          {!loading && flights.length === 0 && (
            <div className="nav-bar rounded-xl shadow-xl p-12 text-center">
              <div className="text-6xl mb-4">✈️</div>
              <h2 className="text-2xl roman-heading text-amber-800 dark:text-orange-500 mb-4">
                NO FLIGHTS FOUND
              </h2>
              <p className="roman-body text-amber-700 dark:text-orange-400 mb-6">
                Try adjusting your search criteria or increasing your maximum price
              </p>
              <button
                onClick={handleRefineSearch}
                className="search-button text-lg py-3 px-8"
              >
                MODIFY SEARCH
              </button>
            </div>
          )}

          {/* Results */}
          {!loading && flights.length > 0 && (
            <div className="nav-bar rounded-xl shadow-xl">
              <div className="p-6 border-b-2 border-amber-500 dark:border-orange-800">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-2xl roman-heading text-amber-800 dark:text-orange-500 tracking-widest">
                    AVAILABLE FLIGHTS
                  </h2>
                  <div className="roman-body text-amber-700 dark:text-orange-400 mt-2 sm:mt-0">
                    Found {flights.length} flight{flights.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
              
              <div className="p-6 max-h-96 overflow-y-auto">
                <div className="space-y-6">
                  {flights.map((flight) => {
                    const airlineLogo = flightScraperManager.getAirlineLogo(flight.airline);
                    const airlineColor = flightScraperManager.getAirlineColor(flight.airline);
                    
                    return (
                      <div
                        key={flight.id}
                        className="flight-card flex flex-col md:flex-row md:items-center justify-between p-6 rounded-xl shadow-lg"
                      >
                        <div className="flex-1 mb-4 md:mb-0">
                          <div className="flex items-center space-x-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${airlineColor} bg-opacity-10`}>
                              <span className={`font-bold text-sm ${airlineColor}`}>
                                {airlineLogo}
                              </span>
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900 dark:text-white roman-body text-lg">
                                <span className={airlineColor}>{flight.airline}</span> - {flight.flightNumber}
                              </h3>
                              <p className="text-sm text-amber-700 dark:text-orange-400">
                                {flight.origin} → {flight.destination}
                              </p>
                              <p className="text-sm text-amber-600 dark:text-orange-300">
                                {new Date(flight.departure).toLocaleDateString()} • {new Date(flight.departure).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </p>
                              {/* Show real booking indicator */}
                              {isRealBookingLink(flight.bookingUrl) && (
                                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                  🛒 Real {flight.airline} booking available
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right mb-4 md:mb-0">
                          <p className="text-3xl font-bold text-amber-800 dark:text-orange-500">
                            {getSearchCurrencySymbol()}{getDisplayPrice(flight)}
                          </p>
                          <p className="text-sm text-amber-600 dark:text-orange-400">{searchCurrency}</p>
                          {/* Real booking button */}
                          {isRealBookingLink(flight.bookingUrl) && (
                            <a
                              href={flight.bookingUrl!}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block mt-2 px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                            >
                              Book on {flight.airline}
                            </a>
                          )}
                        </div>

                        {user && (
                          <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-3">
                            <div className="flex space-x-2">
                              <select
                                value={trackingCurrency}
                                onChange={(e) => setTrackingCurrency(e.target.value)}
                                className="roman-input !w-24"
                              >
                                {CURRENCIES.map((currency) => (
                                  <option key={currency.code} value={currency.code}>
                                    {currency.symbol} {currency.name}
                                  </option>
                                ))}
                              </select>
                              <input
                                type="number"
                                placeholder="Target price"
                                value={trackingPrice || ''}
                                onChange={(e) => setTrackingPrice(Number(e.target.value))}
                                className="roman-input w-32"
                                min="0"
                              />
                            </div>
                            <button
                              onClick={() => handleTrackFlight(flight)}
                              className="search-button text-lg py-2 px-6"
                            >
                              Track
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}