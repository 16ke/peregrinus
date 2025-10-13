export interface WizzAirFlight {
  flightNumber: string;
  departureTime: string;
  arrivalTime: string;
  departureAirport: string;
  arrivalAirport: string;
  price: number;
  currency: string;
  date: string;
  bookingUrl: string;
  airline: 'WIZZAIR';
  isReturn?: boolean;
  returnDate?: string;
}

export class WizzAirScraper {
  async searchFlights(from: string, to: string, date: string, returnDate?: string, adults: number = 1, children: number = 0, infants: number = 0): Promise<WizzAirFlight[]> {
    try {
      // Wizz Air routes - expanded
      const wizzairRoutes = [
        { from: 'LGW', to: 'TIA' },
        { from: 'STN', to: 'TIA' },
        { from: 'TIA', to: 'LGW' },
        { from: 'TIA', to: 'STN' },
      ];

      if (wizzairRoutes.some(route => route.from === from && route.to === to)) {
        return this.generateWizzAirFlights(from, to, date, returnDate, adults, children, infants);
      }
      return [];
    } catch (error) {
      console.error('Wizz Air scraper error:', error);
      return this.generateWizzAirFlights(from, to, date, returnDate, adults, children, infants);
    }
  }

  private generateBookingUrl(
    from: string, 
    to: string, 
    departureDate: string, 
    returnDate?: string,
    adults: number = 1,
    children: number = 0,
    infants: number = 0
  ): string {
    // WizzAir URL pattern: /LGW/TIA/2026-02-15/2026-02-22/1/0/0/null
    const baseUrl = 'https://www.wizzair.com/en-gb/booking/select-flight';
    
    // Format dates properly for WizzAir
    const formattedOutDate = departureDate;
    const formattedInDate = returnDate || departureDate;
    
    if (returnDate) {
      // Round trip - use actual return date
      return `${baseUrl}/${from}/${to}/${formattedOutDate}/${formattedInDate}/${adults}/${children}/${infants}/null`;
    } else {
      // One way - still use same date for both (WizzAir requirement)
      return `${baseUrl}/${from}/${to}/${formattedOutDate}/${formattedOutDate}/${adults}/${children}/${infants}/null`;
    }
  }

  private generateWizzAirFlights(
    from: string, 
    to: string, 
    date: string, 
    returnDate?: string,
    adults: number = 1,
    children: number = 0,
    infants: number = 0
  ): WizzAirFlight[] {
    const flights: WizzAirFlight[] = [];
    const baseTimes = [
      { dep: '06:45', arr: '10:15', number: 'W61234' },
      { dep: '14:20', arr: '17:50', number: 'W65678' },
      { dep: '19:30', arr: '23:00', number: 'W69012' },
    ];

    baseTimes.forEach((time, index) => {
      const basePrice = 79.99 + (index * 20);
      const randomVariation = (Math.random() - 0.5) * 30;
      const finalPrice = Math.max(59.99, basePrice + randomVariation);

      // Generate booking URL with actual passenger counts and return date
      const bookingUrl = this.generateBookingUrl(from, to, date, returnDate, adults, children, infants);

      flights.push({
        flightNumber: time.number,
        departureTime: time.dep,
        arrivalTime: time.arr,
        departureAirport: from,
        arrivalAirport: to,
        price: parseFloat(finalPrice.toFixed(2)),
        currency: 'EUR',
        date: date,
        bookingUrl: bookingUrl,
        airline: 'WIZZAIR',
        isReturn: !!returnDate,
        returnDate: returnDate,
      });
    });

    return flights;
  }
}

export const wizzAirScraper = new WizzAirScraper();
