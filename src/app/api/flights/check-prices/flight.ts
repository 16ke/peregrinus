// src/app/api/flights/check-prices/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// This will be called by our background job to check all tracked flight prices
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting price check for all tracked flights...');

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
      },
    });

    console.log(`📊 Checking prices for ${trackedFlights.length} tracked flights`);

    let checkedCount = 0;
    let priceDropCount = 0;

    // Check each tracked flight
    for (const trackedFlight of trackedFlights) {
      try {
        // Get current price from Amadeus API
        const currentPrice = await getCurrentFlightPrice(
          trackedFlight.origin,
          trackedFlight.destination
        );

        if (currentPrice) {
          const latestPrice = trackedFlight.priceUpdates[0]?.price 
            ? Number(trackedFlight.priceUpdates[0].price)
            : Number(trackedFlight.targetPrice) * 1.2; // Fallback

          // Store new price
          await prisma.priceUpdate.create({
            data: {
              trackedFlightId: trackedFlight.id,
              price: currentPrice,
              currency: 'EUR', // Amadeus returns EUR
              airline: 'Auto-check', // We'll improve this later
            },
          });

          checkedCount++;

          // Check for significant price changes (10% threshold)
          const priceChange = ((currentPrice - latestPrice) / latestPrice) * 100;
          
          if (priceChange <= -10) { // Price dropped 10% or more
            console.log(`💰 Price drop detected: ${trackedFlight.origin} → ${trackedFlight.destination}: €${latestPrice} → €${currentPrice} (${priceChange.toFixed(1)}%)`);
            priceDropCount++;

            // Create notification for price drop
            await prisma.notification.create({
              data: {
                userId: trackedFlight.userId,
                trackedFlightId: trackedFlight.id,
                message: `Price dropped! ${trackedFlight.origin} → ${trackedFlight.destination}: €${latestPrice} → €${currentPrice}`,
                type: 'price_drop',
                sentViaInApp: true,
                metadata: {
                  oldPrice: latestPrice,
                  newPrice: currentPrice,
                  changePercent: priceChange,
                  currency: 'EUR'
                },
              },
            });

            // Update last notified price
            await prisma.trackedFlight.update({
              where: { id: trackedFlight.id },
              data: {
                lastNotifiedPrice: currentPrice,
                lastNotificationType: 'price_drop',
              },
            });
          }
        }
      } catch (flightError) {
        console.error(`Error checking flight ${trackedFlight.origin} → ${trackedFlight.destination}:`, flightError);
      }
    }

    console.log(`✅ Price check complete: ${checkedCount} flights checked, ${priceDropCount} price drops found`);

    return NextResponse.json({
      message: 'Price check completed',
      checked: checkedCount,
      priceDrops: priceDropCount,
    });

  } catch (error) {
    console.error('Price check error:', error);
    return NextResponse.json(
      { error: 'Failed to check prices' },
      { status: 500 }
    );
  }
}

// Helper function to get current flight price from Amadeus
async function getCurrentFlightPrice(origin: string, destination: string): Promise<number | null> {
  try {
    // For now, we'll simulate price changes based on realistic patterns
    // In production, this would call the Amadeus API
    
    const basePrices: Record<string, number> = {
      'STN-VLC': 45,
      'LGW-VLC': 85,
      'VLC-STN': 50,
      'VLC-LGW': 90,
      'TIA-VCE': 55,
      'VCE-TIA': 60,
    };

    const routeKey = `${origin}-${destination}`;
    const basePrice = basePrices[routeKey] || 70;
    
    // Simulate realistic price fluctuations (±30%)
    const fluctuation = 0.7 + (Math.random() * 0.6); // 0.7 to 1.3
    const currentPrice = Math.floor(basePrice * fluctuation);
    
    console.log(`✈️ ${origin} → ${destination}: €${currentPrice} (simulated)`);
    
    return currentPrice;
  } catch (error) {
    console.error('Error getting flight price:', error);
    return null;
  }
}