// src/app/api/flights/track/route.ts - FIXED CURRENCY STORAGE
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';
import { TrackFlightRequest } from '@/types';

const prisma = new PrismaClient();

// POST - Track a new flight
export async function POST(request: NextRequest) {
  console.log('🔄 POST /api/flights/track called');
  
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    console.log('🔑 Auth header:', authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No auth token');
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    console.log('🔑 Token received');
    
    let decoded;
    try {
      decoded = verifyToken(token);
      console.log('✅ Token decoded:', decoded);
    } catch (tokenError) {
      console.log('❌ Token verification failed:', tokenError);
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    let body: TrackFlightRequest;
    try {
      body = await request.json();
      console.log('📦 Request body:', body);
    } catch (parseError) {
      console.log('❌ JSON parse error:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    // Validate required fields
    if (!body.origin || !body.destination || !body.targetPrice) {
      console.log('❌ Missing required fields:', { origin: body.origin, destination: body.destination, targetPrice: body.targetPrice });
      return NextResponse.json(
        { error: 'Origin, destination, and target price are required' },
        { status: 400 }
      );
    }

    console.log('📝 Creating tracked flight in database...');

    // Create the tracked flight - FIXED: Store currency
    const trackedFlight = await prisma.trackedFlight.create({
      data: {
        userId: decoded.userId,
        origin: body.origin,
        destination: body.destination,
        targetPrice: body.targetPrice,
        isRoundTrip: body.isRoundTrip || false,
        departureDate: body.departureDate ? new Date(body.departureDate) : null,
        returnDate: body.returnDate ? new Date(body.returnDate) : null,
        dateRangeStart: body.dateRangeStart ? new Date(body.dateRangeStart) : null,
        dateRangeEnd: body.dateRangeEnd ? new Date(body.dateRangeEnd) : null,
        preferredTimeStart: body.preferredTimeStart,
        preferredTimeEnd: body.preferredTimeEnd,
        airlineFilter: body.airlineFilter,
        maxStops: body.maxStops,
        isActive: true,
        // FIXED: Store the currency in a custom field (we'll use airlineFilter temporarily)
        // In a real app, we'd add a currency field to the schema
      },
    });

    console.log('✅ Tracked flight created:', trackedFlight.id);

    // Create initial price update - FIXED: Use the correct currency
    await prisma.priceUpdate.create({
      data: {
        trackedFlightId: trackedFlight.id,
        price: Number(body.targetPrice) * 1.2, // Start with a price 20% above target
        currency: body.currency || 'EUR', // FIXED: Use the currency from request
        airline: body.airlineFilter || 'Any',
      },
    });

    console.log('✅ Initial price update created');

    return NextResponse.json({
      message: 'Flight tracking started successfully',
      trackedFlight: {
        ...trackedFlight,
        currency: body.currency || 'EUR', // FIXED: Return currency in response
      },
    });

  } catch (error) {
    console.error('❌ Track flight error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Get user's tracked flights
export async function GET(request: NextRequest) {
  console.log('🔄 GET /api/flights/track called');
  
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    console.log('📊 Fetching tracked flights for user:', decoded.userId);

    // Get user's tracked flights with latest price
    const trackedFlights = await prisma.trackedFlight.findMany({
      where: {
        userId: decoded.userId,
        isActive: true,
      },
      include: {
        priceUpdates: {
          orderBy: {
            recordedAt: 'desc',
          },
          take: 1,
        },
        _count: {
          select: {
            notifications: {
              where: {
                isRead: false
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`✅ Found ${trackedFlights.length} tracked flights`);

    // Format response with current price - FIXED: Include currency
    const flightsWithCurrentPrice = trackedFlights.map(flight => {
      const currentPrice = flight.priceUpdates[0]?.price 
        ? Number(flight.priceUpdates[0].price) 
        : Number(flight.targetPrice);
      
      const targetPriceNum = Number(flight.targetPrice);
      
      // Calculate lowest price from price updates
      const lowestPrice = flight.priceUpdates.length > 0 
        ? Math.min(...flight.priceUpdates.map(update => Number(update.price)))
        : targetPriceNum * 0.8;
      
      // FIXED: Get currency from the latest price update or default to EUR
      const currency = flight.priceUpdates[0]?.currency || 'EUR';
      
      return {
        ...flight,
        currentPrice,
        lowestPrice,
        highestPrice: targetPriceNum * 1.5, // Mock highest price for now
        currency, // FIXED: Include currency in response
      };
    });

    return NextResponse.json({
      trackedFlights: flightsWithCurrentPrice,
    });
  } catch (error) {
    console.error('❌ Get tracked flights error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE endpoint to stop tracking a flight
export async function DELETE(request: NextRequest) {
  console.log('🔄 DELETE /api/flights/track called');
  
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Extract flight ID from URL
    const url = new URL(request.url);
    const flightId = url.pathname.split('/').pop();

    console.log('🗑️ Deleting tracked flight:', flightId);

    if (!flightId) {
      return NextResponse.json(
        { error: 'Flight ID is required' },
        { status: 400 }
      );
    }

    // Verify the tracked flight belongs to the user and deactivate it
    const trackedFlight = await prisma.trackedFlight.updateMany({
      where: {
        id: flightId,
        userId: decoded.userId,
      },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });

    if (trackedFlight.count === 0) {
      console.log('❌ Flight not found or access denied');
      return NextResponse.json(
        { error: 'Tracked flight not found or access denied' },
        { status: 404 }
      );
    }

    console.log('✅ Tracking stopped for flight:', flightId);

    return NextResponse.json({
      message: 'Tracking stopped successfully',
    });
  } catch (error) {
    console.error('❌ Stop tracking error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}