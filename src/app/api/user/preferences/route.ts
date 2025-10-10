import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken, AuthTokenPayload } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token) as AuthTokenPayload;
    
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get or create user preferences
    let preferences = await prisma.userPreferences.findUnique({
      where: { userId: payload.userId },
    });

    if (!preferences) {
      // Create default preferences if they don't exist
      preferences = await prisma.userPreferences.create({
        data: {
          userId: payload.userId,
          emailNotifications: true,
          inAppNotifications: true,
          currency: 'EUR',
        },
      });
    }

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error('Get preferences error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token) as AuthTokenPayload;
    
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { name, emailNotifications, inAppNotifications, currency } = body;

    // Update user name if provided
    if (name !== undefined) {
      await prisma.user.update({
        where: { id: payload.userId },
        data: { name },
      });
    }

    // Update or create user preferences
    const preferences = await prisma.userPreferences.upsert({
      where: { userId: payload.userId },
      update: {
        ...(emailNotifications !== undefined && { emailNotifications }),
        ...(inAppNotifications !== undefined && { inAppNotifications }),
        ...(currency !== undefined && { currency }),
      },
      create: {
        userId: payload.userId,
        emailNotifications: emailNotifications ?? true,
        inAppNotifications: inAppNotifications ?? true,
        currency: currency ?? 'EUR',
      },
    });

    return NextResponse.json({ 
      success: true, 
      preferences,
      message: 'Preferences saved successfully' 
    });
  } catch (error) {
    console.error('Save preferences error:', error);
    return NextResponse.json(
      { error: 'Failed to save preferences' },
      { status: 500 }
    );
  }
}