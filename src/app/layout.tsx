// src/app/layout.tsx
'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import Navigation from '@/components/Navigation';
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
      </head>
      <body className="min-h-screen transition-colors duration-300">
        <AuthProvider>
          <div className="min-h-screen">
            {/* Only show Navigation on non-auth pages */}
            {!isAuthPage && <Navigation />}
            <ThemeProvider>
              <main>{children}</main>
            </ThemeProvider>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}