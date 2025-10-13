// src/types/amadeus.d.ts - FIXED VERSION
declare module 'amadeus' {
  interface AmadeusConfig {
    clientId: string;
    clientSecret: string;
  }

  interface FlightOffersSearchParams {
    originLocationCode: string;
    destinationLocationCode: string;
    departureDate: string;
    adults?: number;
    children?: number;
    infants?: number;
    currencyCode?: string;
  }

  interface FlightOffer {
    // Add proper flight offer interface if needed
    [key: string]: unknown;
  }

  const Amadeus: {
    new (config: AmadeusConfig): {
      shopping: {
        flightOffersSearch: {
          get: (params: FlightOffersSearchParams) => Promise<{ data: FlightOffer[] }>;
        };
      };
    };
  };
  export default Amadeus;
}