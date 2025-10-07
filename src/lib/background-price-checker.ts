// src/lib/background-price-checker.ts - UPDATED WITH EMAIL INTEGRATION
import { PrismaClient } from '@prisma/client';
import { flightScraperManager } from './flight-scraper-manager';
import { sendGridService, type EmailNotificationData } from './sendgrid';

const prisma = new PrismaClient();

export interface PriceCheckResult {
  flightId: string;
  route: string;
  previousPrice: number | null;
  currentPrice: number;
  priceDrop: number;
  priceDropPercent: number;
  notificationSent: boolean;
  notificationType?: string;
}

export class BackgroundPriceChecker {
  private isRunning = false;

  async runPriceCheck(): Promise<{
    success: boolean;
    checked: number;
    notifications: number;
    results: PriceCheckResult[];
  }> {
    if (this.isRunning) {
      console.log('⏳ Price check already running, skipping...');
      return { success: false, checked: 0, notifications: 0, results: [] };
    }

    this.isRunning = true;
    console.log('🔄 BACKGROUND: Starting automated price check...');

    try {
      const trackedFlights = await prisma.trackedFlight.findMany({
        where: {
          isActive: true,
        },
        include: {
          priceUpdates: {
            orderBy: {
              recordedAt: 'desc',
            },
            take: 1,
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

      console.log(`🔍 BACKGROUND: Checking ${trackedFlights.length} tracked flights`);

      const results: PriceCheckResult[] = [];
      let notificationsSent = 0;

      for (const trackedFlight of trackedFlights) {
        try {
          const result = await this.checkSingleFlight(trackedFlight);
          results.push(result);
          
          if (result.notificationSent) {
            notificationsSent++;
          }

          // Small delay to avoid overwhelming airline websites
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (error) {
          console.error(`❌ BACKGROUND: Error checking ${trackedFlight.origin}→${trackedFlight.destination}:`, error);
          results.push({
            flightId: trackedFlight.id,
            route: `${trackedFlight.origin} → ${trackedFlight.destination}`,
            previousPrice: null,
            currentPrice: 0,
            priceDrop: 0,
            priceDropPercent: 0,
            notificationSent: false,
          });
        }
      }

      console.log(`✅ BACKGROUND: Price check complete - ${results.length} flights checked, ${notificationsSent} notifications sent`);

      return {
        success: true,
        checked: results.length,
        notifications: notificationsSent,
        results,
      };

    } catch (error) {
      console.error('❌ BACKGROUND: Price check failed:', error);
      return {
        success: false,
        checked: 0,
        notifications: 0,
        results: [],
      };
    } finally {
      this.isRunning = false;
    }
  }

  private async checkSingleFlight(trackedFlight: any): Promise<PriceCheckResult> {
    const latestPriceUpdate = trackedFlight.priceUpdates[0];
    const previousPrice = latestPriceUpdate ? Number(latestPriceUpdate.price) : null;
    
    const searchDate = trackedFlight.departureDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0];
    
    const currentFlights = await flightScraperManager.searchAllAirlines(
      trackedFlight.origin,
      trackedFlight.destination,
      searchDate
    );

    const bestCurrentFlight = currentFlights.reduce((best, flight) => {
      return !best || flight.price < best.price ? flight : best;
    }, null as any);

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

    let notificationSent = false;
    let notificationType = '';
    let emailNotificationData: EmailNotificationData | null = null;

    if (currentPrice <= targetPrice) {
      notificationType = 'price_drop_below_target';
      notificationSent = true;
    } else if (previousPrice && currentPrice < previousPrice && priceDropPercent >= 5) {
      notificationType = 'price_drop';
      notificationSent = true;
    } else if (previousPrice && currentPrice > previousPrice && previousPrice <= targetPrice) {
      notificationType = 'price_rise_after_drop';
      notificationSent = true;
    }

    if (notificationSent) {
      // Prepare email notification data
      emailNotificationData = {
        to: trackedFlight.user.email,
        userName: trackedFlight.user.name || 'Traveler',
        notificationType: notificationType as any,
        trackedFlight: {
          origin: trackedFlight.origin,
          destination: trackedFlight.destination,
          targetPrice: targetPrice,
        },
        priceData: {
          oldPrice: previousPrice || undefined,
          newPrice: currentPrice,
          priceDrop: priceDrop > 0 ? priceDrop : undefined,
          priceDropPercent: priceDropPercent > 0 ? priceDropPercent : undefined,
        },
        bookingUrl: bestCurrentFlight?.bookingUrl,
      };

      let message = '';
      switch (notificationType) {
        case 'price_drop_below_target':
          message = `🎉 Price alert! ${trackedFlight.origin} → ${trackedFlight.destination} is now €${currentPrice} (below your target of €${targetPrice})`;
          break;
        case 'price_drop':
          message = `📉 Price dropped! ${trackedFlight.origin} → ${trackedFlight.destination} decreased by ${priceDropPercent.toFixed(1)}% to €${currentPrice}`;
          break;
        case 'price_rise_after_drop':
          message = `📈 Price increased! ${trackedFlight.origin} → ${trackedFlight.destination} rose to €${currentPrice} (was €${previousPrice})`;
          break;
      }

      // Create notification in database
      const notification = await prisma.notification.create({
        data: {
          userId: trackedFlight.user.id,
          trackedFlightId: trackedFlight.id,
          message,
          type: notificationType,
          sentViaInApp: trackedFlight.user.preferences?.inAppNotifications ?? true,
          sentViaEmail: false, // Will update after email attempt
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

      // Send email notification if user has it enabled
      if (trackedFlight.user.preferences?.emailNotifications && emailNotificationData) {
        try {
          const emailSent = await sendGridService.sendNotification(emailNotificationData);
          
          // Update notification record if email was sent
          if (emailSent) {
            await prisma.notification.update({
              where: { id: notification.id },
              data: { sentViaEmail: true },
            });
            console.log(`📧 Email notification sent to ${trackedFlight.user.email}`);
          }
        } catch (emailError) {
          console.error(`❌ Failed to send email to ${trackedFlight.user.email}:`, emailError);
        }
      }
    }

    return {
      flightId: trackedFlight.id,
      route: `${trackedFlight.origin} → ${trackedFlight.destination}`,
      previousPrice,
      currentPrice,
      priceDrop,
      priceDropPercent,
      notificationSent,
      notificationType: notificationSent ? notificationType : undefined,
    };
  }
}

export const backgroundPriceChecker = new BackgroundPriceChecker();