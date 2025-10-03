// src/types/index.ts

export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: Date;
}

export interface FlightSearch {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  maxPrice?: string; 
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
}

export interface TrackedFlight {
  id: string;
  userId: string;
  origin: string;
  destination: string;
  targetPrice: number;
  currentPrice: number;
  lowestPrice: number;
  createdAt: Date;
}

export interface PriceUpdate {
  id: string;
  trackedFlightId: string;
  price: number;
  currency: string;
  recordedAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  trackedFlightId: string;
  message: string;
  type: 'price_drop' | 'alert' | 'info';
  isRead: boolean;
  createdAt: Date;
}