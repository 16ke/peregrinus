// src/app/api/flights/track/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';

const prisma = new PrismaClient();

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const flightId = params.id;

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
      return NextResponse.json(
        { error: 'Tracked flight not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Tracking stopped successfully',
    });
  } catch (error) {
    console.error('Stop tracking error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}