// src/app/login/page.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password);
      addToast({
        type: 'success',
        title: 'Welcome Back!',
        message: 'Successfully signed in to your account'
      });
      router.push('/');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      addToast({
        type: 'error',
        title: 'Sign In Failed',
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
            WELCOME BACK
          </h1>
          <p className="roman-body text-amber-700 dark:text-orange-400">
            Sign in to your account
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
              placeholder="Enter your password"
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
                <span>SIGNING IN...</span>
              </div>
            ) : (
              'SIGN IN'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="roman-body text-amber-700 dark:text-orange-400">
            Don&apos;t have an account?{' '}
            <Link 
              href="/register" 
              className="text-amber-800 dark:text-orange-500 font-semibold hover:underline"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}