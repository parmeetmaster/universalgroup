import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { FlightResponseDto } from '../dto/flight-response.dto';

const BASE_URL = 'https://www.flightstats.com';
const MAX_RETRIES = 2;

@Injectable()
export class FlightScraper {
  private readonly logger = new Logger(FlightScraper.name);

  async getFlightStatus(
    airlineCode: string,
    flightNumber: string,
    year: number,
    month: number,
    date: number,
  ): Promise<FlightResponseDto> {
    return this.withRetry(async () => {
      const url = `${BASE_URL}/v2/flight-tracker/${airlineCode}/${flightNumber}?year=${year}&month=${month}&date=${date}`;

      const html = await this.fetchFlightPage(url);
      const nextData = this.extractNextData(html);
      const flight = nextData?.props?.initialState?.flightTracker?.flight;

      if (!flight) {
        throw new Error('No flight data found');
      }

      return this.mapFlightData(flight, year, month, date);
    }, 'getFlightStatus');
  }

  async searchFlights(
    airlineCode: string,
    flightNumber: string,
    year: number,
    month: number,
    date: number,
  ): Promise<FlightResponseDto[]> {
    return this.withRetry(async () => {
      const url = `${BASE_URL}/v2/flight-tracker/${airlineCode}/${flightNumber}?year=${year}&month=${month}&date=${date}`;

      const html = await this.fetchFlightPage(url);
      this.logger.log(`Fetched ${html.length} bytes from ${url}`);
      const nextData = this.extractNextData(html);
      const state = nextData?.props?.initialState?.flightTracker;

      this.logger.log(`flightTracker keys: ${Object.keys(state || {}).join(', ')}`);

      // Single flight result
      if (state?.flight) {
        return [this.mapFlightData(state.flight, year, month, date)];
      }

      // Multiple flights (same flight number, different routes/times)
      if (state?.flights?.length) {
        return state.flights.map((f: any) => this.mapFlightData(f, year, month, date));
      }

      throw new Error('No flight data found. State keys: ' + Object.keys(state || {}).join(', '));
    }, 'searchFlights');
  }

  private async fetchFlightPage(url: string): Promise<string> {
    const { data, status } = await axios.get<string>(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      timeout: 15000,
      maxRedirects: 5,
      validateStatus: () => true,
    });

    if (typeof data !== 'string' || !data.includes('__NEXT_DATA__')) {
      this.logger.warn(`FlightStats returned status ${status}, no NEXT_DATA (length: ${String(data).length})`);
      throw new Error('FlightStats returned invalid response');
    }

    return data;
  }

  private mapFlightData(flight: any, year: number, month: number, date: number): FlightResponseDto {
    const dep = flight.departureAirport || {};
    const arr = flight.arrivalAirport || {};
    const status = flight.status || {};
    const note = flight.flightNote || {};
    const header = flight.resultHeader || {};
    const equipment = flight.additionalFlightInfo?.equipment || {};
    const positional = flight.positional?.flexTrack;
    const positions = positional?.positions || [];
    const lastPos = positions.length > 0 ? positions[positions.length - 1] : null;

    return {
      flightId: flight.flightId,
      airline: header.carrier?.name || '',
      airlineCode: header.carrier?.fs || '',
      flightNumber: header.flightNumber || '',
      status: {
        status: status.status || '',
        statusDescription: status.statusDescription || '',
        color: status.color || '',
        departureDelayMinutes: status.delay?.departure?.minutes ?? 0,
        arrivalDelayMinutes: status.delay?.arrival?.minutes ?? 0,
        canceled: note.canceled ?? false,
        diverted: status.diverted ?? false,
        phase: note.phase || '',
      },
      departure: {
        code: dep.iata || dep.fs || '',
        name: dep.name || '',
        city: dep.city || '',
        country: dep.country || '',
        gate: dep.gate || null,
        terminal: dep.terminal || null,
        scheduledTime: dep.times?.scheduled?.time24 || '',
        actualTime: dep.times?.estimatedActual?.time24 || '',
        timezone: dep.times?.scheduled?.timezone || '',
      },
      arrival: {
        code: arr.iata || arr.fs || '',
        name: arr.name || '',
        city: arr.city || '',
        country: arr.country || '',
        gate: arr.gate || null,
        terminal: arr.terminal || null,
        scheduledTime: arr.times?.scheduled?.time24 || '',
        actualTime: arr.times?.estimatedActual?.time24 || '',
        timezone: arr.times?.scheduled?.timezone || '',
      },
      equipment: {
        iata: equipment.iata || '',
        name: equipment.name || '',
      },
      duration: flight.additionalFlightInfo?.flightDuration || '',
      tailNumber: positional?.tailNumber || null,
      callsign: positional?.callsign || null,
      lastPosition: lastPos
        ? {
            longitude: lastPos.lon,
            latitude: lastPos.lat,
            speedMph: lastPos.speedMph ?? 0,
            altitudeFt: lastPos.altitudeFt ?? 0,
          }
        : null,
      date: `${year}-${String(month).padStart(2, '0')}-${String(date).padStart(2, '0')}`,
    };
  }

  private extractNextData(html: string): any {
    const marker = '__NEXT_DATA__ = ';
    const start = html.indexOf(marker);
    if (start === -1) {
      throw new Error('Failed to parse flight data from FlightStats');
    }

    const jsonStart = start + marker.length;
    // Find the matching closing brace by counting braces
    let depth = 0;
    let end = jsonStart;
    for (let i = jsonStart; i < html.length; i++) {
      if (html[i] === '{') depth++;
      else if (html[i] === '}') {
        depth--;
        if (depth === 0) {
          end = i + 1;
          break;
        }
      }
    }

    if (depth !== 0) {
      throw new Error('Failed to parse flight data JSON');
    }

    return JSON.parse(html.slice(jsonStart, end));
  }

  private async withRetry<T>(fn: () => Promise<T>, context: string): Promise<T> {
    let lastError: Error | undefined;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        this.logger.warn(`${context} attempt ${attempt + 1} failed: ${lastError.message}`);
        if (attempt < MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        }
      }
    }
    throw lastError;
  }
}
