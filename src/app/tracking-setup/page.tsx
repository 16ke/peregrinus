// src/app/tracking-setup/page.tsx - NO BULLSHIT VERSION
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
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
        }),
      });

      if (response.ok) {
        addToast({
          type: 'success',
          title: 'Tracking Started!',
          message: `Now tracking ${formData.origin} → ${formData.destination} for flights below €${formData.targetPrice}`
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

          {/* Price & Notifications - SIMPLIFIED: No currency selection */}
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
                We'll notify you when flight prices drop below €{formData.targetPrice}
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