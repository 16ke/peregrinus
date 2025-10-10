'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { register } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      addToast({
        type: 'warning',
        title: 'Password Mismatch',
        message: 'Please make sure your passwords match'
      });
      setLoading(false);
      return;
    }

    try {
      await register(email, password, name);
      addToast({
        type: 'success',
        title: 'Welcome to Peregrinus!',
        message: 'Your account has been created successfully'
      });
      router.push('/');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      setError(errorMessage);
      addToast({
        type: 'error',
        title: 'Registration Failed',
        message: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="nav-bar rounded-xl shadow-xl p-8 w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <Logo size="xxl" showText={false} />
          </div>
          <h1 className="text-3xl roman-heading text-amber-800 dark:text-orange-500 tracking-widest mb-2">
            JOIN PEREGRINVS
          </h1>
          <p className="roman-body text-amber-700 dark:text-orange-400">
            Create your account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-lg">
              <p className="roman-body text-red-700 dark:text-red-300 text-center">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-lg roman-body text-amber-800 dark:text-orange-500 mb-2 font-semibold">
              FULL NAME
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="roman-input w-full"
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <label className="block text-lg roman-body text-amber-800 dark:text-orange-500 mb-2 font-semibold">
              EMAIL
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="roman-input w-full"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label className="block text-lg roman-body text-amber-800 dark:text-orange-500 mb-2 font-semibold">
              PASSWORD
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="roman-input w-full"
              placeholder="Create a password"
              required
            />
          </div>

          <div>
            <label className="block text-lg roman-body text-amber-800 dark:text-orange-500 mb-2 font-semibold">
              CONFIRM PASSWORD
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="roman-input w-full"
              placeholder="Confirm your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="search-button w-full text-xl py-4 disabled:opacity-50"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>CREATING ACCOUNT...</span>
              </div>
            ) : (
              'CREATE ACCOUNT'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="roman-body text-amber-700 dark:text-orange-400">
            Already have an account?{' '}
            <Link 
              href="/login" 
              className="text-amber-800 dark:text-orange-500 font-semibold hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}