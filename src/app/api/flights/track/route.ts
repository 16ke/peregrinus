// src/app/api/flights/track/route.ts - COMPLETE UPDATED VERSION
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';

const prisma = new PrismaClient();

// POST - Track a specific flight (UPDATED)
export async function POST(request: NextRequest) {
  console.log('🔄 POST /api/flights/track called - SPECIFIC FLIGHT TRACKING');
  
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

    const body = await request.json();
    console.log('📦 Tracking specific flight:', body);

    // VALIDATE SPECIFIC FLIGHT DATA
    if (!body.origin || !body.destination || !body.targetPrice || !body.departureDate) {
      return NextResponse.json(
        { error: 'Origin, destination, target price, and departure date are required for specific flight tracking' },
        { status: 400 }
      );
    }

    // Check if we're tracking a specific flight or a route
    const isSpecificFlight = body.flightNumber && body.departureTime;

    console.log('📝 Creating tracked flight in database...', {
      isSpecificFlight,
      flightNumber: body.flightNumber,
      departureTime: body.departureTime
    });

    // Create the tracked flight - NOW WITH SPECIFIC FLIGHT DATA
    const trackedFlight = await prisma.trackedFlight.create({
      data: {
        userId: decoded.userId,
        origin: body.origin,
        destination: body.destination,
        targetPrice: body.targetPrice,
        departureDate: new Date(body.departureDate),
        isRoundTrip: body.isRoundTrip || false,
        returnDate: body.returnDate ? new Date(body.returnDate) : null,
        dateRangeStart: body.dateRangeStart ? new Date(body.dateRangeStart) : null,
        dateRangeEnd: body.dateRangeEnd ? new Date(body.dateRangeEnd) : null,
        preferredTimeStart: body.preferredTimeStart,
        preferredTimeEnd: body.preferredTimeEnd,
        airlineFilter: body.airlineFilter || (body.airline ? body.airline : 'ANY'),
        maxStops: body.maxStops || 0,
        bookingUrl: body.bookingUrl, // Store the actual booking URL
        isActive: true,
      },
    });

    console.log('✅ Tracked flight created:', trackedFlight.id);

    // Create initial price update - WITH SPECIFIC FLIGHT DATA
    await prisma.priceUpdate.create({
      data: {
        trackedFlightId: trackedFlight.id,
        price: body.currentPrice || Number(body.targetPrice) * 1.2, // Use actual price or estimate
        currency: body.currency || 'EUR',
        airline: body.airline, // Specific airline
        flightNumber: body.flightNumber, // Specific flight number
        departureTime: body.departureTime ? new Date(`${body.departureDate}T${body.departureTime}:00`) : null, // Specific departure time
      },
    });

    console.log('✅ Initial price update created with flight details');

    return NextResponse.json({
      message: isSpecificFlight 
        ? `Now tracking ${body.airline} ${body.flightNumber} on ${body.departureDate}`
        : `Now tracking ${body.origin} → ${body.destination} for flights below €${body.targetPrice}`,
      trackedFlight: {
        ...trackedFlight,
        currency: body.currency || 'EUR',
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

// GET - Get user's tracked flights (ENHANCED)
export async function GET(request: NextRequest) {
  console.log('🔄 GET /api/flights/track called');
  
  try {
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

    // Get user's tracked flights with latest price AND flight details
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
          take: 10, // Get more price updates for history
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

    // Format response with enhanced data
    const flightsWithEnhancedData = trackedFlights.map(flight => {
      const latestPriceUpdate = flight.priceUpdates[0];
      const currentPrice = latestPriceUpdate?.price 
        ? Number(latestPriceUpdate.price) 
        : Number(flight.targetPrice) * 1.2;
      
      const targetPriceNum = Number(flight.targetPrice);
      
      // Calculate price stats from all updates
      const priceValues = flight.priceUpdates.map(update => Number(update.price));
      const lowestPrice = priceValues.length > 0 
        ? Math.min(...priceValues)
        : targetPriceNum * 0.8;
      
      const highestPrice = priceValues.length > 0
        ? Math.max(...priceValues)
        : targetPriceNum * 1.5;

      // Get specific flight details from latest price update
      const specificFlightDetails = latestPriceUpdate ? {
        flightNumber: latestPriceUpdate.flightNumber,
        airline: latestPriceUpdate.airline,
        departureTime: latestPriceUpdate.departureTime,
      } : null;
      
      return {
        ...flight,
        currentPrice,
        lowestPrice,
        highestPrice,
        specificFlightDetails,
        priceUpdates: flight.priceUpdates, // Include all price updates
      };
    });

    return NextResponse.json({
      trackedFlights: flightsWithEnhancedData,
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