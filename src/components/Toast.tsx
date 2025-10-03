// src/components/Toast.tsx
'use client';

import { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

export default function Toast({ toast, onRemove }: ToastProps) {
  useEffect(() => {
    if (toast.duration !== 0) {
      const timer = setTimeout(() => {
        onRemove(toast.id);
      }, toast.duration || 5000);

      return () => clearTimeout(timer);
    }
  }, [toast, onRemove]);

  const getToastStyles = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50 dark:bg-green-900/20',
          border: 'border-green-200 dark:border-green-800',
          icon: CheckCircle,
          iconColor: 'text-green-500',
          text: 'text-green-800 dark:text-green-300',
        };
      case 'error':
        return {
          bg: 'bg-red-50 dark:bg-red-900/20',
          border: 'border-red-200 dark:border-red-800',
          icon: AlertCircle,
          iconColor: 'text-red-500',
          text: 'text-red-800 dark:text-red-300',
        };
      case 'warning':
        return {
          bg: 'bg-amber-50 dark:bg-amber-900/20',
          border: 'border-amber-200 dark:border-amber-800',
          icon: AlertTriangle,
          iconColor: 'text-amber-500',
          text: 'text-amber-800 dark:text-amber-300',
        };
      case 'info':
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          border: 'border-blue-200 dark:border-blue-800',
          icon: Info,
          iconColor: 'text-blue-500',
          text: 'text-blue-800 dark:text-blue-300',
        };
      default:
        return {
          bg: 'bg-gray-50 dark:bg-gray-900/20',
          border: 'border-gray-200 dark:border-gray-800',
          icon: Info,
          iconColor: 'text-gray-500',
          text: 'text-gray-800 dark:text-gray-300',
        };
    }
  };

  const styles = getToastStyles(toast.type);
  const Icon = styles.icon;

  return (
    <div className={`
      relative flex items-start space-x-3 p-4 rounded-lg border-2 shadow-lg 
      ${styles.bg} ${styles.border} animate-in slide-in-from-right-full duration-300
    `}>
      <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${styles.iconColor}`} />
      
      <div className="flex-1 min-w-0">
        <h4 className={`roman-body font-semibold ${styles.text}`}>
          {toast.title}
        </h4>
        {toast.message && (
          <p className={`mt-1 text-sm ${styles.text}`}>
            {toast.message}
          </p>
        )}
      </div>

      <button
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 p-1 rounded-lg hover:bg-black hover:bg-opacity-10 transition-colors"
      >
        <X className="h-4 w-4 text-gray-500" />
      </button>
    </div>
  );
}