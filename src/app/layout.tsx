'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { CurrencyProvider } from '@/contexts/CurrencyContext';
import Navigation from '@/components/Navigation';
import BottomNavigation from '@/components/BottomNavigation';
import ThemeProvider from '@/components/ThemeProvider';
import { usePathname } from 'next/navigation';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/register';

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Peregrinus - Flight Price Tracker</title>
        <meta name="description" content="Track flight prices and get notified when they drop" />
        <meta name="keywords" content="flights, price tracker, travel, deals" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/peregrinvs-logo.svg" type="image/svg+xml" />
      </head>
      <body className="min-h-screen transition-colors duration-300">
        <AuthProvider>
          <ToastProvider>
            <CurrencyProvider>
              <div className="min-h-screen flex flex-col">
                {/* Only show Navigation on non-auth pages */}
                {!isAuthPage && <Navigation />}
                
                <ThemeProvider>
                  {/* Main content area with padding for bottom nav */}
                  <main className={`flex-1 ${!isAuthPage ? 'pb-20 md:pb-0' : ''}`}>
                    {children}
                  </main>
                </ThemeProvider>

                {/* Bottom Navigation - hidden on auth pages */}
                {!isAuthPage && <BottomNavigation />}
              </div>
            </CurrencyProvider>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}