// src/app/login/page.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password);
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="nav-bar rounded-xl shadow-xl p-8 w-full max-w-md">
        {/* PEREGRINVS Header for auth pages */}
        <div className="text-center mb-8">
          <h1 className="roman-heading text-3xl md:text-4xl tracking-widest nav-title-light dark:nav-title-dark mb-6">
            PEREGRINVS
          </h1>
          <h2 className="text-2xl roman-heading text-amber-800 dark:text-orange-500 tracking-widest mb-2">
            WELCOME BACK
          </h2>
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
            {loading ? 'SIGNING IN...' : 'SIGN IN'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="roman-body text-amber-700 dark:text-orange-400">
            Don't have an account?{' '}
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