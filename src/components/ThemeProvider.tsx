// src/components/ThemeProvider.tsx
'use client';

import { useState, useEffect } from 'react';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    
    if (newDarkMode) {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      localStorage.setItem('theme', 'light');
    }
  };

  // Prevent flash of unstyled content
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <>
      <button
        onClick={toggleTheme}
        className="fixed top-20 right-20 md:right-24 z-50 p-3 border-2 border-amber-500 dark:border-orange-500 rounded-lg shadow-lg hover:scale-110 transition-transform nav-bar"
        aria-label="Toggle theme"
      >
        {isDarkMode ? (
          <span className="text-xl" title="Switch to light mode">☀️</span>
        ) : (
          <span className="text-xl" title="Switch to dark mode">🌙</span>
        )}
      </button>
      {children}
    </>
  );
}