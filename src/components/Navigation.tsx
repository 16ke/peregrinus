// src/components/Navigation.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

export default function Navigation() {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="nav-bar">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center h-24 relative">
          {/* Logo/Title - ALWAYS visible, perfectly centered */}
          <div className="flex-1 flex justify-center">
            <Link href="/" className="no-underline">
              <h1 className="roman-heading text-4xl md:text-6xl tracking-widest nav-title-light dark:nav-title-dark">
                PEREGRINVS
              </h1>
            </Link>
          </div>

          {/* Desktop Navigation - Only show when user is logged in */}
          {user && (
            <div className="hidden md:flex md:items-center md:space-x-6 absolute right-4">
              {/* Future navigation links will go here */}
              
              {/* Logout button */}
              <button
                onClick={logout}
                className="nav-bar roman-heading text-xl text-amber-800 dark:text-orange-400 border-2 border-amber-500 dark:border-orange-500 px-6 py-2 rounded-lg shadow-lg hover:scale-105 transition-transform"
              >
                LOGOUT
              </button>
            </div>
          )}
        </div>

        {/* Mobile Menu - Only show when user is logged in AND menu is open */}
        {user && isMobileMenuOpen && (
          <div className="md:hidden absolute top-24 left-0 right-0 z-50 nav-bar border-t-4 border-amber-500 dark:border-orange-500 shadow-xl">
            <div className="px-4 py-6 space-y-4">
              {/* Future navigation links will be added here above the logout */}
              
              {/* Logout button - Will move to bottom when we add more items */}
              <button
                onClick={handleLogout}
                className="w-full text-left roman-heading text-xl text-amber-800 dark:text-orange-400 border-2 border-amber-500 dark:border-orange-500 px-6 py-3 rounded-lg shadow-lg hover:scale-105 transition-transform nav-bar text-center"
              >
                LOGOUT
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile menu button - Only show when user is logged in */}
      {user && (
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden fixed top-20 right-4 z-50 p-3 border-2 border-amber-500 dark:border-orange-500 rounded-lg shadow-lg hover:scale-110 transition-transform nav-bar"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? (
            <X className="h-7 w-7 text-amber-800 dark:text-orange-400" />
          ) : (
            <Menu className="h-7 w-7 text-amber-800 dark:text-orange-400" />
          )}
        </button>
      )}
    </nav>
  );
}