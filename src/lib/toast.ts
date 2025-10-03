// src/lib/toast.ts
import { Toast, ToastType } from '@/components/Toast';

// This will be used by components that can't use useToast hook
let toastAddFunction: ((toast: Omit<Toast, 'id'>) => void) | null = null;

export const setToastFunction = (fn: (toast: Omit<Toast, 'id'>) => void) => {
  toastAddFunction = fn;
};

export const showToast = (toast: Omit<Toast, 'id'>) => {
  if (toastAddFunction) {
    toastAddFunction(toast);
  } else {
    console.warn('Toast function not set');
  }
};

// Convenience functions
export const toast = {
  success: (title: string, message?: string) => 
    showToast({ type: 'success' as ToastType, title, message }),
  
  error: (title: string, message?: string) => 
    showToast({ type: 'error' as ToastType, title, message }),
  
  warning: (title: string, message?: string) => 
    showToast({ type: 'warning' as ToastType, title, message }),
  
  info: (title: string, message?: string) => 
    showToast({ type: 'info' as ToastType, title, message }),
};