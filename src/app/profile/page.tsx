// src/app/profile/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Bell, Mail, Globe, LogOut, Save, X } from 'lucide-react';

interface UserPreferences {
  id: string;
  userId: string;
  emailNotifications: boolean;
  inAppNotifications: boolean;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

export default function Profile() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  const [preferences, setPreferences] = useState<UserPreferences>({
    id: '',
    userId: '',
    emailNotifications: true,
    inAppNotifications: true,
    currency: 'EUR',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    emailNotifications: true,
    inAppNotifications: true,
    currency: 'EUR',
  });

  useEffect(() => {
    if (user) {
      // Load user data and preferences
      setFormData({
        name: user.name || '',
        email: user.email,
        emailNotifications: true,
        inAppNotifications: true,
        currency: 'EUR',
      });
    }
  }, [user]);

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // TODO: Save preferences to API
      console.log('Saving preferences:', formData);
      
      alert('Preferences saved successfully!');
    } catch (error) {
      console.error('Save preferences error:', error);
      alert('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    setShowLogoutConfirm(false);
    router.push('/login');
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
            Please log in to view your profile
          </p>
          <Link href="/login" className="search-button inline-block text-lg py-3 px-8">
            SIGN IN
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 pb-24">
      <div className="nav-bar rounded-xl shadow-xl p-6 md:p-8">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <div className="w-16 h-16 bg-amber-100 dark:bg-orange-100 rounded-full flex items-center justify-center border-2 border-amber-500 dark:border-orange-400">
            <User className="h-8 w-8 text-amber-700 dark:text-orange-600" />
          </div>
          <div>
            <h1 className="text-3xl roman-heading text-amber-800 dark:text-orange-500 tracking-widest">
              PROFILE
            </h1>
            <p className="roman-body text-amber-700 dark:text-orange-400">
              Manage your account and preferences
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Account Information */}
            <div className="roman-card p-6">
              <h2 className="text-2xl roman-heading text-amber-800 dark:text-orange-500 mb-4 tracking-widest flex items-center space-x-2">
                <User className="h-6 w-6" />
                <span>ACCOUNT INFORMATION</span>
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-lg roman-body text-amber-800 dark:text-orange-500 mb-2 font-semibold">
                    FULL NAME
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="roman-input w-full"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="block text-lg roman-body text-amber-800 dark:text-orange-500 mb-2 font-semibold">
                    EMAIL ADDRESS
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="roman-input w-full"
                    placeholder="Enter your email"
                    disabled
                  />
                  <p className="text-sm text-amber-600 dark:text-orange-400 mt-1">
                    Contact support to change your email address
                  </p>
                </div>

                <div>
                  <label className="block text-lg roman-body text-amber-800 dark:text-orange-500 mb-2 font-semibold">
                    MEMBER SINCE
                  </label>
                  <div className="roman-input w-full bg-amber-50 dark:bg-orange-950 text-amber-700 dark:text-orange-400">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    }) : 'Recently'}
                  </div>
                </div>
              </div>
            </div>

            {/* Notification Preferences */}
            <div className="roman-card p-6">
              <h2 className="text-2xl roman-heading text-amber-800 dark:text-orange-500 mb-4 tracking-widest flex items-center space-x-2">
                <Bell className="h-6 w-6" />
                <span>NOTIFICATION PREFERENCES</span>
              </h2>
              
              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 border-2 border-amber-200 dark:border-orange-800 rounded-lg hover:border-amber-500 dark:hover:border-orange-500 transition-colors cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-amber-600 dark:text-orange-400" />
                    <div>
                      <div className="roman-body font-semibold text-amber-800 dark:text-orange-500">
                        Email Notifications
                      </div>
                      <div className="text-sm text-amber-600 dark:text-orange-400">
                        Receive price alerts via email
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.emailNotifications}
                    onChange={(e) => handleInputChange('emailNotifications', e.target.checked)}
                    className="w-5 h-5 text-amber-600 dark:text-orange-500 bg-gray-100 border-gray-300 rounded focus:ring-amber-500 dark:focus:ring-orange-500"
                  />
                </label>

                <label className="flex items-center justify-between p-4 border-2 border-amber-200 dark:border-orange-800 rounded-lg hover:border-amber-500 dark:hover:border-orange-500 transition-colors cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <Bell className="h-5 w-5 text-amber-600 dark:text-orange-400" />
                    <div>
                      <div className="roman-body font-semibold text-amber-800 dark:text-orange-500">
                        In-App Notifications
                      </div>
                      <div className="text-sm text-amber-600 dark:text-orange-400">
                        Show alerts within the app
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.inAppNotifications}
                    onChange={(e) => handleInputChange('inAppNotifications', e.target.checked)}
                    className="w-5 h-5 text-amber-600 dark:text-orange-500 bg-gray-100 border-gray-300 rounded focus:ring-amber-500 dark:focus:ring-orange-500"
                  />
                </label>
              </div>
            </div>

            {/* Currency Preferences */}
            <div className="roman-card p-6">
              <h2 className="text-2xl roman-heading text-amber-800 dark:text-orange-500 mb-4 tracking-widest flex items-center space-x-2">
                <Globe className="h-6 w-6" />
                <span>CURRENCY PREFERENCES</span>
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-lg roman-body text-amber-800 dark:text-orange-500 mb-2 font-semibold">
                    DEFAULT CURRENCY
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => handleInputChange('currency', e.target.value)}
                    className="roman-input w-full"
                  >
                    <option value="EUR">Euro (€)</option>
                    <option value="GBP">British Pound (£)</option>
                    <option value="USD">US Dollar ($)</option>
                  </select>
                  <p className="text-sm text-amber-600 dark:text-orange-400 mt-1">
                    This will be used for all price displays
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Actions & Stats */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="roman-card p-6">
              <h3 className="text-xl roman-heading text-amber-800 dark:text-orange-500 mb-4 tracking-wide">
                QUICK ACTIONS
              </h3>
              
              <div className="space-y-3">
                <Link 
                  href="/tracking-setup" 
                  className="w-full search-button text-center block py-3 px-4 text-lg"
                >
                  TRACK NEW FLIGHT
                </Link>
                
                <Link 
                  href="/notifications" 
                  className="w-full px-4 py-3 border-2 border-amber-500 dark:border-orange-500 text-amber-800 dark:text-orange-400 rounded-lg hover:bg-amber-50 dark:hover:bg-orange-900 transition-colors text-center block roman-body font-semibold"
                >
                  VIEW NOTIFICATIONS
                </Link>

                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className="w-full px-4 py-3 border-2 border-red-500 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900 transition-colors roman-body font-semibold flex items-center justify-center space-x-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span>LOGOUT</span>
                </button>
              </div>
            </div>

            {/* Save Button for Mobile */}
            <div className="lg:hidden">
              <button
                onClick={handleSavePreferences}
                disabled={saving}
                className="w-full search-button text-xl py-4 disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {saving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>SAVING...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5" />
                    <span>SAVE CHANGES</span>
                  </>
                )}
              </button>
            </div>

            {/* App Information */}
            <div className="roman-card p-6">
              <h3 className="text-xl roman-heading text-amber-800 dark:text-orange-500 mb-4 tracking-wide">
                APP INFORMATION
              </h3>
              
              <div className="space-y-3 text-amber-700 dark:text-orange-400">
                <div className="flex justify-between">
                  <span className="roman-body">Version</span>
                  <span className="roman-body font-semibold">1.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="roman-body">Last Updated</span>
                  <span className="roman-body font-semibold">Jan 2024</span>
                </div>
                <div className="pt-3 border-t-2 border-amber-200 dark:border-orange-800">
                  <Link href="/privacy" className="roman-body text-amber-600 dark:text-orange-400 hover:text-amber-800 dark:hover:text-orange-300 transition-colors">
                    Privacy Policy
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button for Desktop */}
        <div className="hidden lg:flex justify-end space-x-4 mt-8 pt-8 border-t-2 border-amber-200 dark:border-orange-800">
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 border-2 border-amber-500 dark:border-orange-500 text-amber-800 dark:text-orange-400 rounded-lg hover:bg-amber-50 dark:hover:bg-orange-900 transition-colors roman-body font-semibold flex items-center space-x-2"
          >
            <X className="h-4 w-4" />
            <span>CANCEL</span>
          </button>
          
          <button
            onClick={handleSavePreferences}
            disabled={saving}
            className="search-button text-lg py-3 px-8 disabled:opacity-50 flex items-center space-x-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>SAVING...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>SAVE CHANGES</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Logout Confirmation Dialog */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="nav-bar rounded-xl shadow-xl p-6 max-w-md w-full">
            <h3 className="text-xl roman-heading text-amber-800 dark:text-orange-500 mb-4">
              LOGOUT CONFIRMATION
            </h3>
            <p className="roman-body text-amber-700 dark:text-orange-400 mb-6">
              Are you sure you want to logout? You'll need to sign in again to access your tracked flights.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 px-4 py-2 border-2 border-amber-500 dark:border-orange-500 text-amber-800 dark:text-orange-400 rounded-lg hover:bg-amber-50 dark:hover:bg-orange-900 transition-colors roman-body font-semibold"
              >
                CANCEL
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors roman-body font-semibold flex items-center justify-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>LOGOUT</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}