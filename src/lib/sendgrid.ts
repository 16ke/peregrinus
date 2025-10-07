// src/lib/sendgrid.ts - COMPLETE NEW FILE
import sgMail from '@sendgrid/mail';

// Initialize SendGrid with API key
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
} else {
  console.warn('SENDGRID_API_KEY not found. Email notifications will be disabled.');
}

export interface EmailNotificationData {
  to: string;
  userName: string;
  notificationType: 'price_drop' | 'price_rise' | 'price_drop_below_target' | 'price_rise_after_drop';
  trackedFlight: {
    origin: string;
    destination: string;
    targetPrice: number;
  };
  priceData: {
    oldPrice?: number;
    newPrice: number;
    priceDrop?: number;
    priceDropPercent?: number;
  };
  bookingUrl?: string;
}

export class SendGridService {
  private static instance: SendGridService;

  static getInstance(): SendGridService {
    if (!SendGridService.instance) {
      SendGridService.instance = new SendGridService();
    }
    return SendGridService.instance;
  }

  private getEmailTemplate(data: EmailNotificationData): { subject: string; html: string } {
    const { origin, destination, targetPrice } = data.trackedFlight;
    const { oldPrice, newPrice, priceDrop, priceDropPercent } = data.priceData;
    const route = `${origin} → ${destination}`;

    switch (data.notificationType) {
      case 'price_drop_below_target':
        return {
          subject: `🎉 Price Alert! ${route} is now €${newPrice} (Below your target!)`,
          html: this.generatePriceDropBelowTargetEmail(data)
        };

      case 'price_drop':
        return {
          subject: `📉 Price Drop! ${route} decreased by ${priceDropPercent?.toFixed(1)}%`,
          html: this.generatePriceDropEmail(data)
        };

      case 'price_rise_after_drop':
        return {
          subject: `📈 Price Increase Alert - ${route} rose to €${newPrice}`,
          html: this.generatePriceRiseEmail(data)
        };

      default:
        return {
          subject: `Flight Price Update - ${route}`,
          html: this.generateGenericEmail(data)
        };
    }
  }

  private generatePriceDropBelowTargetEmail(data: EmailNotificationData): string {
    const { origin, destination, targetPrice } = data.trackedFlight;
    const { newPrice, oldPrice } = data.priceData;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
          .price { font-size: 2.5em; font-weight: bold; color: #059669; margin: 20px 0; }
          .target { color: #6b7280; font-size: 1.1em; }
          .button { background: #f59e0b; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 0.9em; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Amazing News!</h1>
            <h2>Your flight price dropped below target!</h2>
          </div>
          <div class="content">
            <h3>${origin} → ${destination}</h3>
            <div class="price">€${newPrice}</div>
            ${oldPrice ? `<p>Was: <span style="text-decoration: line-through; color: #ef4444;">€${oldPrice}</span></p>` : ''}
            <p class="target">Your target price: €${targetPrice}</p>
            <p style="font-size: 1.2em; color: #059669; font-weight: bold;">✓ You're saving €${(targetPrice - newPrice).toFixed(2)} below your target!</p>
            
            ${data.bookingUrl ? `
              <div style="text-align: center;">
                <a href="${data.bookingUrl}" class="button" style="color: white;">Book Now →</a>
              </div>
            ` : ''}
            
            <div class="footer">
              <p>Happy travels!<br>The Peregrinus Team</p>
              <p><small>You're receiving this because you enabled email notifications.</small></p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generatePriceDropEmail(data: EmailNotificationData): string {
    const { origin, destination } = data.trackedFlight;
    const { newPrice, oldPrice, priceDropPercent } = data.priceData;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
          .price { font-size: 2em; font-weight: bold; color: #059669; margin: 20px 0; }
          .savings { color: #059669; font-weight: bold; }
          .button { background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 0.9em; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📉 Price Drop Alert!</h1>
            <h2>Great time to book your flight</h2>
          </div>
          <div class="content">
            <h3>${origin} → ${destination}</h3>
            <div class="price">Now: €${newPrice}</div>
            ${oldPrice ? `
              <p>Was: <span style="text-decoration: line-through; color: #ef4444;">€${oldPrice}</span></p>
              <p class="savings">You're saving ${priceDropPercent?.toFixed(1)}%!</p>
            ` : ''}
            
            ${data.bookingUrl ? `
              <div style="text-align: center;">
                <a href="${data.bookingUrl}" class="button" style="color: white;">Check Price →</a>
              </div>
            ` : ''}
            
            <div class="footer">
              <p>Don't wait too long - prices can change quickly!<br>The Peregrinus Team</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generatePriceRiseEmail(data: EmailNotificationData): string {
    const { origin, destination } = data.trackedFlight;
    const { newPrice, oldPrice } = data.priceData;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
          .price { font-size: 2em; font-weight: bold; color: #dc2626; margin: 20px 0; }
          .button { background: #ef4444; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 0.9em; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📈 Price Increase Alert</h1>
            <h2>Flight price just went up</h2>
          </div>
          <div class="content">
            <h3>${origin} → ${destination}</h3>
            <div class="price">Now: €${newPrice}</div>
            ${oldPrice ? `
              <p>Was: <span style="color: #059669;">€${oldPrice}</span></p>
              <p style="color: #dc2626; font-weight: bold;">Price increased by €${(newPrice - oldPrice).toFixed(2)}</p>
            ` : ''}
            
            <p>We'll continue monitoring and notify you if it drops again.</p>
            
            ${data.bookingUrl ? `
              <div style="text-align: center;">
                <a href="${data.bookingUrl}" class="button" style="color: white;">Check Latest Price →</a>
              </div>
            ` : ''}
            
            <div class="footer">
              <p>We're still watching this route for you!<br>The Peregrinus Team</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateGenericEmail(data: EmailNotificationData): string {
    const { origin, destination } = data.trackedFlight;
    const { newPrice } = data.priceData;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #6366f1, #4f46e5); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
          .price { font-size: 2em; font-weight: bold; color: #4f46e5; margin: 20px 0; }
          .button { background: #6366f1; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 0.9em; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Flight Price Update</h1>
          </div>
          <div class="content">
            <h3>${origin} → ${destination}</h3>
            <div class="price">Current Price: €${newPrice}</div>
            
            ${data.bookingUrl ? `
              <div style="text-align: center;">
                <a href="${data.bookingUrl}" class="button" style="color: white;">View Flight →</a>
              </div>
            ` : ''}
            
            <div class="footer">
              <p>We're monitoring this flight for you!<br>The Peregrinus Team</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async sendNotification(data: EmailNotificationData): Promise<boolean> {
    // Check if SendGrid is configured
    if (!process.env.SENDGRID_API_KEY) {
      console.warn('SendGrid not configured - skipping email notification');
      return false;
    }

    try {
      const template = this.getEmailTemplate(data);
      
      const msg = {
        to: data.to,
        from: {
          email: process.env.SENDGRID_FROM_EMAIL!,
          name: process.env.SENDGRID_FROM_NAME || 'Peregrinus Flight Alerts'
        },
        subject: template.subject,
        html: template.html,
      };

      console.log(`📧 SENDING EMAIL to ${data.to} for ${data.trackedFlight.origin}→${data.trackedFlight.destination}`);
      
      await sgMail.send(msg);
      
      console.log(`✅ EMAIL SENT successfully to ${data.to}`);
      return true;
      
    } catch (error) {
      console.error('❌ FAILED to send email:', error);
      return false;
    }
  }
}

export const sendGridService = SendGridService.getInstance();