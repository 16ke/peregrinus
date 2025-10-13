import { NextRequest, NextResponse } from 'next/server';
import { Flight } from '@/types';
import { flightScraperManager } from '@/lib/flight-scraper-manager';

const SUPPORTED_ROUTES = [
  { from: 'STN', to: 'VLC' },
  { from: 'LGW', to: 'VLC' },
  { from: 'VLC', to: 'STN' },
  { from: 'VLC', to: 'LGW' },
  { from: 'LGW', to: 'TIA' },
  { from: 'STN', to: 'TIA' },
  { from: 'TIA', to: 'LGW' },
  { from: 'TIA', to: 'STN' },
  { from: 'STN', to: 'VCE' },
  { from: 'STN', to: 'TSF' },
  { from: 'LGW', to: 'VCE' },
  { from: 'LGW', to: 'TSF' },
];

function calculateDuration(departureTime: string, arrivalTime: string): number {
  const [depHours, depMinutes] = departureTime.split(':').map(Number);
  const [arrHours, arrMinutes] = arrivalTime.split(':').map(Number);
  
  let duration = (arrHours - depHours) * 60 + (arrMinutes - depMinutes);
  
  if (duration < 0) {
    duration += 24 * 60;
  }
  
  return duration;
}

function getRealisticFutureDate(): string {
  const date = new Date();
  date.setMonth(date.getMonth() + 2);
  return date.toISOString().split('T')[0];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const origin = searchParams.get('origin');
    const destination = searchParams.get('destination');
    const date = searchParams.get('date');
    const returnDate = searchParams.get('returnDate');
    const adults = parseInt(searchParams.get('adults') || '1');
    const children = parseInt(searchParams.get('children') || '0');
    const infants = parseInt(searchParams.get('infants') || '0');

    if (!origin || !destination) {
      return NextResponse.json(
        { error: 'Origin and destination are required' },
        { status: 400 }
      );
    }

    const isValidRoute = SUPPORTED_ROUTES.some(
      route => route.from === origin && route.to === destination
    );

    if (!isValidRoute) {
      return NextResponse.json(
        { error: 'This route is not currently supported. Supported routes: London-Valencia, London-Tirana, London-Venice' },
        { status: 400 }
      );
    }

    const searchDate = date || getRealisticFutureDate();
    
    console.log(`🔍 Searching real flights: ${origin} → ${destination} on ${searchDate}${returnDate ? ` returning ${returnDate}` : ''}`);
    console.log(`👥 Passengers: ${adults} adults, ${children} children, ${infants} infants`);

    const realFlights = await flightScraperManager.searchAllAirlines(
      origin, 
      destination, 
      searchDate, 
      returnDate || undefined,
      adults,
      children,
      infants
    );

    const flights: Flight[] = realFlights.map((flight, index) => ({
      id: `${flight.airline.toLowerCase()}-${flight.flightNumber}-${index}`,
      airline: flight.airline,
      flightNumber: flight.flightNumber,
      origin: flight.departureAirport,
      destination: flight.arrivalAirport,
      departure: new Date(`${searchDate}T${flight.departureTime}:00`),
      arrival: new Date(`${searchDate}T${flight.arrivalTime}:00`),
      price: flight.price,
      currency: flight.currency,
      stops: 0,
      duration: calculateDuration(flight.departureTime, flight.arrivalTime),
      bookingUrl: flight.bookingUrl,
    }));

    flights.sort((a, b) => a.price - b.price);

    console.log(`✅ Found ${flights.length} real flights from ${realFlights.length} airlines`);

    return NextResponse.json({ 
      flights,
      search: {
        origin,
        destination,
        date: searchDate,
        returnDate: returnDate || null,
        passengers: { adults, children, infants },
        totalResults: flights.length,
        source: 'Real Airline Data',
        airlines: [...new Set(realFlights.map(f => f.airline))],
      }
    });

  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}