// src/components/FlightSearch.tsx
'use client';

import { useState } from 'react';
import { FlightSearch as FlightSearchType, Flight } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

const CITIES = [
  { code: 'STN', name: 'London Stansted' },
  { code: 'LGW', name: 'London Gatwick' },
  { code: 'VCE', name: 'Venezia Marco Polo' },
  { code: 'TSF', name: 'Venezia Treviso' },
  { code: 'VLC', name: 'Valencia' },
  { code: 'TIA', name: 'Tirana' },
  { code: 'VOA', name: 'Vlore' },
];

const CURRENCIES = [
  { code: 'EUR', symbol: '€', name: 'EUR' },
  { code: 'GBP', symbol: '£', name: 'GBP' },
];

export default function FlightSearch() {
  const { user } = useAuth();
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

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

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
    } finally {
      setLoading(false);
    }
  };

  const handleTrackFlight = async (flight: Flight) => {
    if (!user) {
      alert('Please log in to track flights');
      return;
    }

    if (!trackingPrice || trackingPrice <= 0) {
      alert('Please set a target price');
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
        alert('Flight tracking started!');
        setTrackingPrice(0);
      } else {
        const error = await response.json();
        alert(error.error);
      }
    } catch (error) {
      console.error('Tracking error:', error);
      alert('Failed to track flight');
    }
  };

  const getCurrencySymbol = () => {
    return CURRENCIES.find(c => c.code === selectedCurrency)?.symbol || '€';
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="nav-bar rounded-xl shadow-xl p-8 mb-8">
        <h1 className="text-3xl roman-heading text-amber-800 dark:text-orange-500 mb-8 text-center tracking-widest">
          FIND YOUR PERFECT FLIGHT
        </h1>
        
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
                  className="roman-input !w-32" // !important to override CSS, shows "€ EUR" / "£ GBP"
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
                  className="roman-input flex-1 min-w-0" // Takes most space
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
                {loading ? 'SEARCHING...' : 'SEARCH FLIGHTS'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {flights.length > 0 && (
        <div className="nav-bar rounded-xl shadow-xl">
          <div className="p-6 border-b-2 border-amber-500 dark:border-orange-800">
            <h2 className="text-2xl roman-heading text-amber-800 dark:text-orange-500 tracking-widest">
              AVAILABLE FLIGHTS
            </h2>
          </div>
          
          <div className="p-6">
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
                          className="roman-input !w-24" // !important to override CSS
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
  );
}