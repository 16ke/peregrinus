// src/components/FlightSearch.tsx
'use client';

import { useState } from 'react';
import { FlightSearch as FlightSearchType, Flight } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';

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
  const [selectedCurrency, setSelectedCurrency] = useState('EUR');
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(false);
  const [trackingPrice, setTrackingPrice] = useState<number>(0);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setHasSearched(true);

    try {
      const response = await fetch(
        `/api/flights/search?origin=${searchParams.origin}&destination=${searchParams.destination}`
      );
      const data = await response.json();
      
      // Filter by max price if set
      let filteredFlights = data.flights || [];
      if (searchParams.maxPrice) {
        filteredFlights = filteredFlights.filter((flight: Flight) => 
          flight.price <= Number(searchParams.maxPrice)
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
      const token = localStorage.getItem('token');
      const response = await fetch('/api/flights/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          origin: flight.origin,
          destination: flight.destination,
          targetPrice: trackingPrice,
          currency: selectedCurrency,
        }),
      });

      if (response.ok) {
        addToast({
          type: 'success',
          title: 'Tracking Started!',
          message: `Now tracking ${flight.origin} → ${flight.destination} below ${selectedCurrency}${trackingPrice}`
        });
        setTrackingPrice(0);
      } else {
        const error = await response.json();
        addToast({
          type: 'error',
          title: 'Tracking Failed',
          message: error.error || 'Unable to track this flight'
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

  const getCurrencySymbol = () => {
    return CURRENCIES.find(c => c.code === selectedCurrency)?.symbol || '€';
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Search Form - Always visible */}
      <div className={`nav-bar rounded-xl shadow-xl p-8 mb-6 ${hasSearched ? 'sticky top-4 z-10' : ''}`}>
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
                  value={selectedCurrency}
                  onChange={(e) => setSelectedCurrency(e.target.value)}
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
                  {flights.map((flight) => (
                    <div
                      key={flight.id}
                      className="flight-card flex flex-col md:flex-row md:items-center justify-between p-6 rounded-xl shadow-lg"
                    >
                      <div className="flex-1 mb-4 md:mb-0">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-amber-100 dark:bg-orange-100 rounded-full flex items-center justify-center border-2 border-amber-500 dark:border-orange-400">
                            <span className="text-amber-700 dark:text-orange-600 font-bold text-sm">
                              {flight.airline.substring(0, 2)}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900 dark:text-white roman-body text-lg">
                              {flight.airline} - {flight.flightNumber}
                            </h3>
                            <p className="text-sm text-amber-700 dark:text-orange-400">
                              {flight.origin} → {flight.destination}
                            </p>
                            <p className="text-sm text-amber-600 dark:text-orange-300">
                              {new Date(flight.departure).toLocaleDateString()} • {new Date(flight.departure).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="text-right mb-4 md:mb-0">
                        <p className="text-3xl font-bold text-amber-800 dark:text-orange-500">
                          {getCurrencySymbol()}{flight.price}
                        </p>
                        <p className="text-sm text-amber-600 dark:text-orange-400">{selectedCurrency}</p>
                      </div>

                      {user && (
                        <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-3">
                          <div className="flex space-x-2">
                            <select
                              value={selectedCurrency}
                              onChange={(e) => setSelectedCurrency(e.target.value)}
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
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}