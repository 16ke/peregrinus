// src/contexts/ToastContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import Toast, { Toast as ToastInterface } from '@/components/Toast';
import { setToastFunction } from '@/lib/toast';

interface ToastContextType {
  toasts: ToastInterface[];
  addToast: (toast: Omit<ToastInterface, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastInterface[]>([]);

  const addToast = (toast: Omit<ToastInterface, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { ...toast, id }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const clearToasts = () => {
    setToasts([]);
  };

  // Register the toast function for utility usage
  useEffect(() => {
    setToastFunction(addToast);
    return () => setToastFunction(null!);
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearToasts }}>
      {children}
      
      {/* Toast Container */}
      {toasts.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm w-full">
          {toasts.map(toast => (
            <Toast
              key={toast.id}
              toast={toast}
              onRemove={removeToast}
            />
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}