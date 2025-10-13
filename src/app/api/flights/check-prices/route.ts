// src/app/api/flights/check-prices/route.ts - FIXED VERSION
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { flightScraperManager } from '@/lib/flight-scraper-manager';
import { sendGridService } from '@/lib/sendgrid';

const prisma = new PrismaClient();

interface FlightResult {
  price: number;
  airline?: string;
  flightNumber?: string;
  departureTime?: string;
  bookingUrl?: string;
}

export async function POST(request: NextRequest) {
  console.log('🔄 POST /api/flights/check-prices - MANUAL PRICE CHECK');
  
  try {
    const trackedFlights = await prisma.trackedFlight.findMany({
      where: { isActive: true },
      include: {
        priceUpdates: { orderBy: { recordedAt: 'desc' }, take: 1 },
        user: { select: { id: true, email: true, preferences: true } },
      },
    });

    console.log(`🔍 Checking prices for ${trackedFlights.length} tracked flights`);

    const results = [];
    let notificationsSent = 0;

    for (const trackedFlight of trackedFlights) {
      try {
        const latestPriceUpdate = trackedFlight.priceUpdates[0];
        const previousPrice = latestPriceUpdate ? Number(latestPriceUpdate.price) : null;
        
        const searchDate = trackedFlight.departureDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0];
        const currentFlights = await flightScraperManager.searchAllAirlines(
          trackedFlight.origin,
          trackedFlight.destination,
          searchDate
        );

        const bestCurrentFlight = currentFlights.reduce((best: FlightResult | null, flight: FlightResult) => {
          return !best || flight.price < best.price ? flight : best;
        }, null);

        const currentPrice = bestCurrentFlight ? bestCurrentFlight.price : (previousPrice || Number(trackedFlight.targetPrice) * 1.2);
        
        // Store new price
        await prisma.priceUpdate.create({
          data: {
            trackedFlightId: trackedFlight.id,
            price: currentPrice,
            currency: 'EUR',
            airline: bestCurrentFlight?.airline,
            flightNumber: bestCurrentFlight?.flightNumber,
            departureTime: bestCurrentFlight ? new Date(`${searchDate}T${bestCurrentFlight.departureTime}:00`) : null,
          },
        });

        // Notification logic
        const targetPrice = Number(trackedFlight.targetPrice);
        const priceDrop = previousPrice ? previousPrice - currentPrice : 0;
        const priceDropPercent = previousPrice ? (priceDrop / previousPrice) * 100 : 0;

        let notificationType = null;
        let notificationMessage = '';

        if (currentPrice <= targetPrice) {
          notificationType = 'price_drop_below_target';
          notificationMessage = `🎉 Price alert! ${trackedFlight.origin} → ${trackedFlight.destination} is now €${currentPrice} (below your target of €${targetPrice})`;
        } else if (previousPrice && currentPrice < previousPrice && priceDropPercent >= 5) {
          notificationType = 'price_drop';
          notificationMessage = `📉 Price dropped! ${trackedFlight.origin} → ${trackedFlight.destination} decreased by ${priceDropPercent.toFixed(1)}% to €${currentPrice}`;
        } else if (previousPrice && currentPrice > previousPrice && previousPrice <= targetPrice) {
          notificationType = 'price_rise_after_drop';
          notificationMessage = `📈 Price increased! ${trackedFlight.origin} → ${trackedFlight.destination} rose to €${currentPrice} (was €${previousPrice})`;
        }

        if (notificationType && trackedFlight.user.preferences?.inAppNotifications) {
          await prisma.notification.create({
            data: {
              userId: trackedFlight.user.id,
              trackedFlightId: trackedFlight.id,
              message: notificationMessage,
              type: notificationType,
              sentViaInApp: true,
              metadata: {
                oldPrice: previousPrice,
                newPrice: currentPrice,
                targetPrice,
                priceDrop,
                priceDropPercent,
                bookingUrl: bestCurrentFlight?.bookingUrl,
              },
            },
          });
          notificationsSent++;
        }

        results.push({
          flight: `${trackedFlight.origin} → ${trackedFlight.destination}`,
          previousPrice,
          currentPrice,
          priceDrop,
          priceDropPercent: priceDropPercent.toFixed(1),
          notification: notificationType,
        });

      } catch (flightError) {
        console.error(`❌ Error checking ${trackedFlight.origin}→${trackedFlight.destination}:`, flightError);
        results.push({
          flight: `${trackedFlight.origin} → ${trackedFlight.destination}`,
          error: 'Failed to check prices',
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Checked ${results.length} flights, sent ${notificationsSent} notifications`,
      results,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Price check error:', error);
    return NextResponse.json({ error: 'Failed to check prices' }, { status: 500 });
  }
}

// GET - For checking price update history (optional)
export async function GET(request: NextRequest) {
  try {
    const priceUpdates = await prisma.priceUpdate.findMany({
      orderBy: { recordedAt: 'desc' },
      take: 50,
      include: {
        trackedFlight: {
          select: { origin: true, destination: true, user: { select: { email: true } } },
        },
      },
    });

    return NextResponse.json({
      priceUpdates: priceUpdates.map(update => ({
        id: update.id,
        route: `${update.trackedFlight.origin} → ${update.trackedFlight.destination}`,
        price: update.price,
        currency: update.currency,
        airline: update.airline,
        flightNumber: update.flightNumber,
        recordedAt: update.recordedAt,
        user: update.trackedFlight.user.email,
      })),
      total: priceUpdates.length,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get price updates' }, { status: 500 });
  }
}