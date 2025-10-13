// src/app/api/flights/track/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization token required' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const trackedFlight = await prisma.trackedFlight.findFirst({
      where: {
        id: id,
        userId: decoded.userId,
        isActive: true,
      },
      include: {
        priceUpdates: {
          orderBy: { recordedAt: 'desc' },
        },
        notifications: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!trackedFlight) {
      return NextResponse.json({ error: 'Tracked flight not found' }, { status: 404 });
    }

    // Calculate current price (latest price update)
    const currentPrice = trackedFlight.priceUpdates[0]?.price 
      ? Number(trackedFlight.priceUpdates[0].price)
      : Number(trackedFlight.targetPrice) * 1.2; // Default if no updates

    // Calculate lowest price
    const lowestPrice = trackedFlight.priceUpdates.length > 0
      ? Math.min(...trackedFlight.priceUpdates.map(update => Number(update.price)))
      : Number(trackedFlight.targetPrice) * 0.8;

    // Calculate highest price  
    const highestPrice = trackedFlight.priceUpdates.length > 0
      ? Math.max(...trackedFlight.priceUpdates.map(update => Number(update.price)))
      : Number(trackedFlight.targetPrice) * 1.5;

    return NextResponse.json({
      trackedFlight: {
        ...trackedFlight,
        currentPrice,
        lowestPrice,
        highestPrice,
      },
    });
  } catch (error) {
    console.error('Get tracked flight error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization token required' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    // Set isActive to false instead of deleting
    const updatedFlight = await prisma.trackedFlight.update({
      where: {
        id: id,
      },
      data: {
        isActive: false,
      },
    });

    return NextResponse.json({ 
      success: true,
      message: 'Flight tracking stopped successfully'
    });

  } catch (error) {
    console.error('Delete tracked flight error:', error);
    return NextResponse.json({ 
      error: 'Internal server error'
    }, { status: 500 });
  }
}