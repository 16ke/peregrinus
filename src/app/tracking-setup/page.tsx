// src/app/tracking-setup/page.tsx - CLEAN VERSION WITH ONLY PASSENGER SELECTION
'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const CITIES = [
  { code: 'LGW', name: 'London Gatwick' },
  { code: 'STN', name: 'London Stansted' },
  { code: 'TIA', name: 'Tirana' },
  { code: 'VCE', name: 'Venezia Marco Polo' },
  { code: 'TSF', name: 'Venezia Treviso' },
  { code: 'VLC', name: 'Valencia' },
  { code: 'VOA', name: 'Vlore' },
].sort((a, b) => a.name.localeCompare(b.name));

const AIRLINES = [
  { code: 'ANY', name: 'Any Airline' },
  { code: 'RYR', name: 'Ryanair' },
  { code: 'EZY', name: 'EasyJet' },
  { code: 'WZZ', name: 'Wizz Air' },
  { code: 'V7', name: 'Volotea' },
];

export default function TrackingSetup() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    isRoundTrip: false,
    departureDate: '',
    returnDate: '',
    airlineFilter: 'ANY',
    maxStops: 0,
    targetPrice: '',
    emailNotifications: true,
    inAppNotifications: true,
    // Passenger information ONLY
    adults: 1,
    children: 0,
    infants: 0,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassengerPopup, setShowPassengerPopup] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      addToast({
        type: 'error',
        title: 'Login Required',
        message: 'Please log in to set up price tracking'
      });
      router.push('/login');
      return;
    }

    if (!formData.origin || !formData.destination || !formData.targetPrice || !formData.departureDate) {
      setError('Please fill in all required fields');
      addToast({
        type: 'warning',
        title: 'Missing Information',
        message: 'Please fill in all required fields'
      });
      return;
    }

    if (formData.isRoundTrip && !formData.returnDate) {
      setError('Return date is required for round trips');
      addToast({
        type: 'warning',
        title: 'Return Date Required',
        message: 'Please select a return date for round trips'
      });
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/flights/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          origin: formData.origin,
          destination: formData.destination,
          targetPrice: Number(formData.targetPrice),
          isRoundTrip: formData.isRoundTrip,
          departureDate: formData.departureDate,
          returnDate: formData.returnDate || undefined,
          airlineFilter: formData.airlineFilter === 'ANY' ? undefined : formData.airlineFilter,
          maxStops: formData.maxStops,
          // Passenger information ONLY - for booking URLs
          adults: formData.adults,
          children: formData.children,
          infants: formData.infants,
        }),
      });

      if (response.ok) {
        addToast({
          type: 'success',
          title: 'Tracking Started!',
          message: `Now tracking ${formData.origin} → ${formData.destination} for ${getPassengerSummary()} below €${formData.targetPrice}`
        });
        router.push('/dashboard');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to setup tracking');
        addToast({
          type: 'error',
          title: 'Setup Failed',
          message: errorData.error || 'Unable to setup flight tracking'
        });
      }
    } catch (error) {
      console.error('Tracking setup error:', error);
      setError('Failed to setup tracking');
      addToast({
        type: 'error',
        title: 'Network Error',
        message: 'Failed to setup tracking. Please check your connection.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const updatePassengerCount = (type: 'adults' | 'children' | 'infants', delta: number) => {
    setFormData(prev => {
      const current = prev[type] || 0;
      const newValue = Math.max(0, current + delta);
      
      // Ensure at least 1 adult
      if (type === 'adults' && newValue < 1) return prev;
      
      return {
        ...prev,
        [type]: newValue
      };
    });
  };

  const getPassengerSummary = () => {
    const parts = [];
    if (formData.adults) parts.push(`${formData.adults} Adult${formData.adults !== 1 ? 's' : ''}`);
    if (formData.children) parts.push(`${formData.children} Child${formData.children !== 1 ? 'ren' : ''}`);
    if (formData.infants) parts.push(`${formData.infants} Infant${formData.infants !== 1 ? 's' : ''}`);
    return parts.join(', ');
  };

  const getTotalPassengers = () => {
    return formData.adults + formData.children + formData.infants;
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="nav-bar rounded-xl shadow-xl p-8 max-w-md text-center">
          <h1 className="text-2xl roman-heading text-amber-800 dark:text-orange-500 mb-4">
            ACCESS REQUIRED
          </h1>
          <p className="roman-body text-amber-700 dark:text-orange-400 mb-6">
            Please log in to set up price tracking
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
    <div className="max-w-4xl mx-auto p-6">
      <div className="nav-bar rounded-xl shadow-xl p-8 mb-8">
        <h1 className="text-3xl roman-heading text-amber-800 dark:text-orange-500 mb-2 text-center tracking-widest">
          TRACK FLIGHT PRICES
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="p-4 bg-red-100 dark:bg-red-900 border-2 border-red-300 dark:border-red-700 rounded-lg">
              <p className="roman-body text-red-700 dark:text-red-300 text-center">{error}</p>
            </div>
          )}

          {/* Route Section */}
          <div className="roman-card p-6">
            <h2 className="text-2xl roman-heading text-amber-800 dark:text-orange-500 mb-4 tracking-widest">
              FLIGHT ROUTE
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-lg roman-body text-amber-800 dark:text-orange-500 mb-2 font-semibold">
                  FROM *
                </label>
                <select
                  value={formData.origin}
                  onChange={(e) => handleInputChange('origin', e.target.value)}
                  className="roman-input w-full"
                  required
                >
                  <option value="">Select departure city</option>
                  {CITIES.map((city) => (
                    <option key={city.code} value={city.code}>
                      {city.name} ({city.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-lg roman-body text-amber-800 dark:text-orange-500 mb-2 font-semibold">
                  TO *
                </label>
                <select
                  value={formData.destination}
                  onChange={(e) => handleInputChange('destination', e.target.value)}
                  className="roman-input w-full"
                  required
                >
                  <option value="">Select destination city</option>
                  {CITIES.map((city) => (
                    <option key={city.code} value={city.code}>
                      {city.name} ({city.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.isRoundTrip}
                  onChange={(e) => handleInputChange('isRoundTrip', e.target.checked)}
                  className="w-5 h-5 text-amber-600 dark:text-orange-500 bg-gray-100 border-gray-300 rounded focus:ring-amber-500 dark:focus:ring-orange-500"
                />
                <span className="roman-body text-amber-800 dark:text-orange-500 font-semibold">
                  Round trip
                </span>
              </label>
            </div>
          </div>

          {/* Dates Section */}
          <div className="roman-card p-6">
            <h2 className="text-2xl roman-heading text-amber-800 dark:text-orange-500 mb-4 tracking-widest">
              TRAVEL DATES
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-lg roman-body text-amber-800 dark:text-orange-500 mb-2 font-semibold">
                  DEPARTURE DATE *
                </label>
                <input
                  type="date"
                  value={formData.departureDate}
                  onChange={(e) => handleInputChange('departureDate', e.target.value)}
                  className="roman-input w-full dark:bg-black dark:text-white"
                  onClick={(e) => (e.target as HTMLInputElement).showPicker()}
                  required
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              {formData.isRoundTrip && (
                <div>
                  <label className="block text-lg roman-body text-amber-800 dark:text-orange-500 mb-2 font-semibold">
                    RETURN DATE *
                  </label>
                  <input
                    type="date"
                    value={formData.returnDate}
                    onChange={(e) => handleInputChange('returnDate', e.target.value)}
                    className="roman-input w-full dark:bg-black dark:text-white"
                    onClick={(e) => (e.target as HTMLInputElement).showPicker()}
                    required
                    min={formData.departureDate || new Date().toISOString().split('T')[0]}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Passenger Section ONLY - No Currency */}
          <div className="roman-card p-6">
            <h2 className="text-2xl roman-heading text-amber-800 dark:text-orange-500 mb-4 tracking-widest">
              PASSENGERS
            </h2>
            
            <div>
              <label className="block text-lg roman-body text-amber-800 dark:text-orange-500 mb-2 font-semibold">
                PASSENGERS
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowPassengerPopup(!showPassengerPopup)}
                  className="roman-input w-full text-left flex justify-between items-center"
                >
                  <span>{getPassengerSummary()}</span>
                  <span>▼</span>
                </button>

                {showPassengerPopup && (
                  <div className="absolute z-10 mt-1 w-full nav-bar rounded-xl shadow-xl p-4 border-2 border-amber-300 dark:border-orange-700">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="roman-body font-semibold text-amber-800 dark:text-orange-500">Adults</div>
                          <div className="text-sm text-amber-600 dark:text-orange-400">16+ years</div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <button
                            type="button"
                            onClick={() => updatePassengerCount('adults', -1)}
                            disabled={formData.adults === 1}
                            className="w-8 h-8 rounded-full border-2 border-amber-500 dark:border-orange-500 text-amber-700 dark:text-orange-400 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            -
                          </button>
                          <span className="roman-body font-semibold w-8 text-center">{formData.adults}</span>
                          <button
                            type="button"
                            onClick={() => updatePassengerCount('adults', 1)}
                            className="w-8 h-8 rounded-full border-2 border-amber-500 dark:border-orange-500 text-amber-700 dark:text-orange-400"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <div>
                          <div className="roman-body font-semibold text-amber-800 dark:text-orange-500">Children</div>
                          <div className="text-sm text-amber-600 dark:text-orange-400">2-15 years</div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <button
                            type="button"
                            onClick={() => updatePassengerCount('children', -1)}
                            disabled={formData.children === 0}
                            className="w-8 h-8 rounded-full border-2 border-amber-500 dark:border-orange-500 text-amber-700 dark:text-orange-400 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            -
                          </button>
                          <span className="roman-body font-semibold w-8 text-center">{formData.children}</span>
                          <button
                            type="button"
                            onClick={() => updatePassengerCount('children', 1)}
                            className="w-8 h-8 rounded-full border-2 border-amber-500 dark:border-orange-500 text-amber-700 dark:text-orange-400"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <div>
                          <div className="roman-body font-semibold text-amber-800 dark:text-orange-500">Infants</div>
                          <div className="text-sm text-amber-600 dark:text-orange-400">Under 2 years</div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <button
                            type="button"
                            onClick={() => updatePassengerCount('infants', -1)}
                            disabled={formData.infants === 0}
                            className="w-8 h-8 rounded-full border-2 border-amber-500 dark:border-orange-500 text-amber-700 dark:text-orange-400 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            -
                          </button>
                          <span className="roman-body font-semibold w-8 text-center">{formData.infants}</span>
                          <button
                            type="button"
                            onClick={() => updatePassengerCount('infants', 1)}
                            className="w-8 h-8 rounded-full border-2 border-amber-500 dark:border-orange-500 text-amber-700 dark:text-orange-400"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowPassengerPopup(false)}
                        className="w-full search-button py-2"
                      >
                        DONE
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="roman-card p-6">
            <h2 className="text-2xl roman-heading text-amber-800 dark:text-orange-500 mb-4 tracking-widest">
              FLIGHT PREFERENCES
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-lg roman-body text-amber-800 dark:text-orange-500 mb-2 font-semibold">
                  PREFERRED AIRLINE
                </label>
                <select
                  value={formData.airlineFilter}
                  onChange={(e) => handleInputChange('airlineFilter', e.target.value)}
                  className="roman-input w-full"
                >
                  {AIRLINES.map((airline) => (
                    <option key={airline.code} value={airline.code}>
                      {airline.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-lg roman-body text-amber-800 dark:text-orange-500 mb-2 font-semibold">
                  MAXIMUM STOPS
                </label>
                <select
                  value={formData.maxStops}
                  onChange={(e) => handleInputChange('maxStops', Number(e.target.value))}
                  className="roman-input w-full"
                >
                  <option value={0}>Direct flights only</option>
                  <option value={1}>Up to 1 stop</option>
                  <option value={2}>Up to 2 stops</option>
                  <option value={3}>Any number of stops</option>
                </select>
              </div>
            </div>
          </div>

          {/* Price & Notifications */}
          <div className="roman-card p-6">
            <h2 className="text-2xl roman-heading text-amber-800 dark:text-orange-500 mb-4 tracking-widest">
              PRICE ALERTS
            </h2>
            
            <div className="mb-6">
              <label className="block text-lg roman-body text-amber-800 dark:text-orange-500 mb-2 font-semibold">
                TARGET PRICE (€) *
              </label>
              <input
                type="number"
                placeholder="Enter target price in euros"
                value={formData.targetPrice}
                onChange={(e) => handleInputChange('targetPrice', e.target.value)}
                className="roman-input w-full"
                min="0"
                step="0.01"
                required
              />
              <p className="text-sm text-amber-600 dark:text-orange-400 mt-2">
                We'll notify you when flight prices drop below €{formData.targetPrice} for {getPassengerSummary()}
              </p>
            </div>

            <div className="space-y-4">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.emailNotifications}
                  onChange={(e) => handleInputChange('emailNotifications', e.target.checked)}
                  className="w-5 h-5 text-amber-600 dark:text-orange-500 bg-gray-100 border-gray-300 rounded focus:ring-amber-500 dark:focus:ring-orange-500"
                />
                <span className="roman-body text-amber-800 dark:text-orange-500 font-semibold">
                  Email notifications
                </span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.inAppNotifications}
                  onChange={(e) => handleInputChange('inAppNotifications', e.target.checked)}
                  className="w-5 h-5 text-amber-600 dark:text-orange-500 bg-gray-100 border-gray-300 rounded focus:ring-amber-500 dark:focus:ring-orange-500"
                />
                <span className="roman-body text-amber-800 dark:text-orange-500 font-semibold">
                  In-app notifications
                </span>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="text-center">
            <button
              type="submit"
              disabled={loading}
              className="search-button text-xl py-4 px-16 disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>SETTING UP TRACKING...</span>
                </div>
              ) : (
                'START TRACKING FLIGHTS'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}