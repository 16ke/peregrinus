// src/types/index.ts - UPDATED VERSION
export interface User {
  id: string;
  email: string;
  name?: string;
  preferences?: UserPreferences;
  createdAt: Date;
}

export interface UserPreferences {
  id: string;
  userId: string;
  emailNotifications: boolean;
  inAppNotifications: boolean;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FlightSearch {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  maxPrice?: string;
  // Passenger information
  adults?: number;
  children?: number;
  infants?: number;
  // New advanced filters
  dateRangeStart?: string;
  dateRangeEnd?: string;
  preferredTimeStart?: string;
  preferredTimeEnd?: string;
  isRoundTrip?: boolean;
  airlineFilter?: string;
  maxStops?: number;
}

export interface Flight {
  id: string;
  airline: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departure: Date;
  arrival: Date;
  price: number;
  currency: string;
  stops?: number;
  duration?: number;
  bookingUrl?: string;
}

export interface TrackedFlight {
  id: string;
  userId: string;
  origin: string;
  destination: string;
  targetPrice: number;
  currentPrice: number;
  lowestPrice: number;
  // Enhanced fields
  departureDate?: Date;
  returnDate?: Date;
  dateRangeStart?: Date;
  dateRangeEnd?: Date;
  preferredTimeStart?: string;
  preferredTimeEnd?: string;
  isRoundTrip: boolean;
  airlineFilter?: string;
  maxStops?: number;
  bookingUrl?: string;
  isActive: boolean;
  // Passenger information for booking
  adults?: number;
  children?: number;
  infants?: number;
  // Smart notification tracking
  lastNotifiedPrice?: number;
  lastNotificationType?: 'price_drop' | 'price_rise';
  createdAt: Date;
  updatedAt: Date;
}

export interface PriceUpdate {
  id: string;
  trackedFlightId: string;
  price: number;
  currency: string;
  recordedAt: Date;
  airline?: string;
  flightNumber?: string;
  departureTime?: Date;
}

export interface Notification {
  id: string;
  userId: string;
  trackedFlightId: string;
  message: string;
  type: 'price_drop' | 'price_rise' | 'alert' | 'info';
  isRead: boolean;
  sentViaEmail: boolean;
  sentViaInApp: boolean;
  metadata?: {
    oldPrice?: number;
    newPrice?: number;
    currency?: string;
  };
  createdAt: Date;
}

// New types for enhanced functionality
export interface TrackFlightRequest {
  origin: string;
  destination: string;
  targetPrice: number;
  currency: string;
  // Passenger information
  adults?: number;
  children?: number;
  infants?: number;
  // Enhanced options
  departureDate?: string;
  returnDate?: string;
  dateRangeStart?: string;
  dateRangeEnd?: string;
  preferredTimeStart?: string;
  preferredTimeEnd?: string;
  isRoundTrip?: boolean;
  airlineFilter?: string;
  maxStops?: number;
}

export interface NotificationPreferences {
  emailNotifications: boolean;
  inAppNotifications: boolean;
}

// Passenger information interface
export interface PassengerInfo {
  adults: number;
  children: number;
  infants: number;
}