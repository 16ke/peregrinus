// src/app/api/flights/check-prices/route.ts - COMPLETE NEW FILE
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { flightScraperManager } from '@/lib/flight-scraper-manager';

const prisma = new PrismaClient();

// POST - Manually check prices for all tracked flights
export async function POST(request: NextRequest) {
  console.log('🔄 POST /api/flights/check-prices - MANUAL PRICE CHECK');
  
  try {
    // Get all active tracked flights
    const trackedFlights = await prisma.trackedFlight.findMany({
      where: {
        isActive: true,
      },
      include: {
        priceUpdates: {
          orderBy: {
            recordedAt: 'desc',
          },
          take: 1, // Get latest price
        },
        user: {
          select: {
            id: true,
            email: true,
            preferences: true,
          },
        },
      },
    });

    console.log(`🔍 Checking prices for ${trackedFlights.length} tracked flights`);

    const results = [];
    let notificationsSent = 0;

    // Check prices for each tracked flight
    for (const trackedFlight of trackedFlights) {
      try {
        console.log(`📊 Checking ${trackedFlight.origin} → ${trackedFlight.destination}`);
        
        // Get the latest price update to compare
        const latestPriceUpdate = trackedFlight.priceUpdates[0];
        const previousPrice = latestPriceUpdate ? Number(latestPriceUpdate.price) : null;
        
        // Search for current flights on this route and date
        const searchDate = trackedFlight.departureDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0];
        const currentFlights = await flightScraperManager.searchAllAirlines(
          trackedFlight.origin,
          trackedFlight.destination,
          searchDate
        );

        // Find the best price (lowest) from current flights
        const bestCurrentFlight = currentFlights.reduce((best, flight) => {
          return !best || flight.price < best.price ? flight : best;
        }, null as any);

        const currentPrice = bestCurrentFlight ? bestCurrentFlight.price : (previousPrice || Number(trackedFlight.targetPrice) * 1.2);
        
        console.log(`💰 ${trackedFlight.origin}→${trackedFlight.destination}: ${previousPrice}€ → ${currentPrice}€`);

        // Store the new price update
        const newPriceUpdate = await prisma.priceUpdate.create({
          data: {
            trackedFlightId: trackedFlight.id,
            price: currentPrice,
            currency: 'EUR',
            airline: bestCurrentFlight?.airline,
            flightNumber: bestCurrentFlight?.flightNumber,
            departureTime: bestCurrentFlight ? new Date(`${searchDate}T${bestCurrentFlight.departureTime}:00`) : null,
          },
        });

        // Check if we should send notifications
        const targetPrice = Number(trackedFlight.targetPrice);
        const priceDrop = previousPrice ? previousPrice - currentPrice : 0;
        const priceDropPercent = previousPrice ? (priceDrop / previousPrice) * 100 : 0;

        let notificationType = null;
        let notificationMessage = '';

        // NOTIFICATION LOGIC
        if (currentPrice <= targetPrice) {
          // Price dropped below target!
          notificationType = 'price_drop_below_target';
          notificationMessage = `🎉 Price alert! ${trackedFlight.origin} → ${trackedFlight.destination} is now €${currentPrice} (below your target of €${targetPrice})`;
        } else if (previousPrice && currentPrice < previousPrice && priceDropPercent >= 5) {
          // Significant price drop (5% or more)
          notificationType = 'price_drop';
          notificationMessage = `📉 Price dropped! ${trackedFlight.origin} → ${trackedFlight.destination} decreased by ${priceDropPercent.toFixed(1)}% to €${currentPrice}`;
        } else if (previousPrice && currentPrice > previousPrice && previousPrice <= targetPrice) {
          // Price increased after being below target
          notificationType = 'price_rise_after_drop';
          notificationMessage = `📈 Price increased! ${trackedFlight.origin} → ${trackedFlight.destination} rose to €${currentPrice} (was €${previousPrice})`;
        }

        // Create notification if needed
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
                targetPrice: targetPrice,
                priceDrop: priceDrop,
                priceDropPercent: priceDropPercent,
                bookingUrl: bestCurrentFlight?.bookingUrl,
              },
            },
          });
          notificationsSent++;
          console.log(`🔔 Created notification: ${notificationMessage}`);
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

    console.log(`✅ Price check complete: ${results.length} flights checked, ${notificationsSent} notifications sent`);

    return NextResponse.json({
      success: true,
      message: `Checked ${results.length} flights, sent ${notificationsSent} notifications`,
      results,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Price check error:', error);
    return NextResponse.json(
      { error: 'Failed to check prices' },
      { status: 500 }
    );
  }
}

// GET - Get price check status/history
export async function GET(request: NextRequest) {
  try {
    const priceUpdates = await prisma.priceUpdate.findMany({
      orderBy: {
        recordedAt: 'desc',
      },
      take: 50,
      include: {
        trackedFlight: {
          select: {
            origin: true,
            destination: true,
            user: {
              select: {
                email: true,
              },
            },
          },
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
    console.error('❌ Get price updates error:', error);
    return NextResponse.json(
      { error: 'Failed to get price updates' },
      { status: 500 }
    );
  }
}