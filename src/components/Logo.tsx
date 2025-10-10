'use client';

import Image from 'next/image';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  className?: string;
  showText?: boolean;
}

export default function Logo({ size = 'md', className = '', showText = true }: LogoProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12', 
    lg: 'w-16 h-16',
    xl: 'w-20 h-20',
    xxl: 'w-24 h-24'
  };

  const textSizes = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-4xl',
    xl: 'text-5xl',
    xxl: 'text-6xl'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="flex items-center space-x-3 md:space-x-4">
        <div className={`relative ${sizeClasses[size]} flex-shrink-0`}>
          <Image
            src="/peregrinvs-logo.svg"
            alt="Peregrinus Logo"
            fill
            className="object-contain"
            priority
          />
        </div>
        {showText && (
          <h1 className={`roman-heading tracking-widest text-amber-800 dark:text-orange-400 ${textSizes[size]}`}>
            PEREGRINVS
          </h1>
        )}
      </div>
    </div>
  );
}