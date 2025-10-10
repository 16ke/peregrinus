'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Currency = 'EUR' | 'GBP';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  convertPrice: (priceInEUR: number) => number;
  getCurrencySymbol: () => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

// Real conversion rates (approximate)
const CONVERSION_RATES = {
  EUR: 1,
  GBP: 0.85, // 1 EUR = 0.85 GBP (approx)
};

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrency] = useState<Currency>('EUR');

  useEffect(() => {
    // Load currency preference from localStorage
    const savedCurrency = localStorage.getItem('preferredCurrency') as Currency;
    if (savedCurrency && (savedCurrency === 'EUR' || savedCurrency === 'GBP')) {
      setCurrency(savedCurrency);
    }
  }, []);

  const handleSetCurrency = (newCurrency: Currency) => {
    setCurrency(newCurrency);
    localStorage.setItem('preferredCurrency', newCurrency);
  };

  const convertPrice = (priceInEUR: number): number => {
    if (currency === 'EUR') return priceInEUR;
    return priceInEUR * CONVERSION_RATES.GBP;
  };

  const getCurrencySymbol = (): string => {
    return currency === 'EUR' ? '€' : '£';
  };

  return (
    <CurrencyContext.Provider value={{
      currency,
      setCurrency: handleSetCurrency,
      convertPrice,
      getCurrencySymbol
    }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}