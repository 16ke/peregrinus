import { ryanairScraper, RyanairFlight } from './ryanair-scraper';
import { easyJetScraper, EasyJetFlight } from './easyjet-scraper';
import { wizzAirScraper, WizzAirFlight } from './wizzair-scraper';

export type FlightData = RyanairFlight | EasyJetFlight | WizzAirFlight;

export class FlightScraperManager {
  private airlineRoutes = {
    RYANAIR: [
      { from: 'STN', to: 'VLC' },
      { from: 'STN', to: 'VCE' },
      { from: 'STN', to: 'TSF' },
      { from: 'VLC', to: 'STN' },
      { from: 'VCE', to: 'STN' },
      { from: 'TSF', to: 'STN' },
    ],
    EASYJET: [
      { from: 'LGW', to: 'VLC' },
      { from: 'LGW', to: 'VCE' },
      { from: 'VLC', to: 'LGW' },
      { from: 'VCE', to: 'LGW' },
    ],
    WIZZAIR: [
      { from: 'LGW', to: 'TIA' },
      { from: 'STN', to: 'TIA' },
      { from: 'TIA', to: 'LGW' },
      { from: 'TIA', to: 'STN' },
    ],
  };

  async searchAllAirlines(
    from: string, 
    to: string, 
    date: string, 
    returnDate?: string,
    adults: number = 1,
    children: number = 0,
    infants: number = 0
  ): Promise<FlightData[]> {
    const allFlights: FlightData[] = [];
    
    const operatingAirlines = this.getOperatingAirlines(from, to);
    
    console.log(`🛫 Searching ${operatingAirlines.join(', ')} for ${from} → ${to} on ${date}${returnDate ? ` returning ${returnDate}` : ''}`);
    console.log(`👥 Passengers: ${adults} adults, ${children} children, ${infants} infants`);

    const searchPromises = operatingAirlines.map(airline => {
      switch (airline) {
        case 'RYANAIR':
          return ryanairScraper.searchFlights(from, to, date, returnDate, adults, children, infants);
        case 'EASYJET':
          return easyJetScraper.searchFlights(from, to, date, returnDate, adults, children, infants);
        case 'WIZZAIR':
          return wizzAirScraper.searchFlights(from, to, date, returnDate, adults, children, infants);
        default:
          return Promise.resolve([]);
      }
    });

    try {
      const results = await Promise.allSettled(searchPromises);
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          allFlights.push(...result.value);
          console.log(`✅ ${operatingAirlines[index]}: ${result.value.length} flights`);
        } else {
          console.error(`❌ ${operatingAirlines[index]} failed:`, result.reason);
        }
      });
    } catch (error) {
      console.error('Error in parallel airline search:', error);
    }

    return allFlights;
  }

  private getOperatingAirlines(from: string, to: string): ('RYANAIR' | 'EASYJET' | 'WIZZAIR')[] {
    const airlines: ('RYANAIR' | 'EASYJET' | 'WIZZAIR')[] = [];
    
    if (this.airlineRoutes.RYANAIR.some(route => route.from === from && route.to === to)) {
      airlines.push('RYANAIR');
    }
    
    if (this.airlineRoutes.EASYJET.some(route => route.from === from && route.to === to)) {
      airlines.push('EASYJET');
    }
    
    if (this.airlineRoutes.WIZZAIR.some(route => route.from === from && route.to === to)) {
      airlines.push('WIZZAIR');
    }
    
    return airlines;
  }

  getAirlineLogo(airline: string): string {
    const logos = {
      RYANAIR: '🔵',
      EASYJET: '🟠',
      WIZZAIR: '🟣',
    };
    return logos[airline as keyof typeof logos] || '✈️';
  }

  getAirlineColor(airline: string): string {
    const colors = {
      RYANAIR: 'text-blue-600 dark:text-blue-400',
      EASYJET: 'text-orange-600 dark:text-orange-400', 
      WIZZAIR: 'text-purple-600 dark:text-purple-400',
    };
    return colors[airline as keyof typeof colors] || 'text-gray-600';
  }
}

export const flightScraperManager = new FlightScraperManager();