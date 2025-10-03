// src/components/BottomNavigation.tsx
'use client';

import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Bell, BarChart3, User } from 'lucide-react';

export default function BottomNavigation() {
  const { user } = useAuth();
  const pathname = usePathname();

  // Don't show bottom nav on auth pages or if user not logged in
  if (!user || pathname === '/login' || pathname === '/register') {
    return null;
  }

  const navItems = [
    {
      href: '/',
      icon: Search,
      label: 'Search',
      active: pathname === '/',
    },
    {
      href: '/tracking-setup',
      icon: Bell,
      label: 'Track',
      active: pathname === '/tracking-setup',
    },
    {
      href: '/dashboard',
      icon: BarChart3,
      label: 'Dashboard',
      active: pathname === '/dashboard',
    },
    {
      href: '/notifications',
      icon: Bell,
      label: 'Alerts',
      active: pathname === '/notifications',
    },
    {
      href: '/profile',
      icon: User,
      label: 'Profile',
      active: pathname === '/profile',
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:relative md:bottom-auto">
      {/* Background with Roman styling */}
      <div className="nav-bar border-t-4 border-amber-500 dark:border-orange-500 md:border-t-0 md:border-b-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-around items-center py-3 md:py-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center space-y-1 transition-all duration-200 ${
                    item.active
                      ? 'text-amber-800 dark:text-orange-400 scale-110'
                      : 'text-amber-600 dark:text-orange-300 hover:text-amber-800 dark:hover:text-orange-400'
                  }`}
                >
                  {/* Icon container with Roman styling */}
                  <div className={`
                    p-2 rounded-lg border-2 transition-all duration-200
                    ${item.active 
                      ? 'bg-amber-100 dark:bg-orange-900 border-amber-500 dark:border-orange-500 shadow-lg' 
                      : 'bg-transparent border-amber-300 dark:border-orange-700 hover:border-amber-500 dark:hover:border-orange-500'
                    }
                  `}>
                    <Icon className="h-5 w-5 md:h-6 md:w-6" />
                  </div>
                  
                  {/* Label - hidden on mobile, shown on desktop */}
                  <span className="text-xs md:text-sm roman-body font-semibold hidden md:block tracking-wide">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}