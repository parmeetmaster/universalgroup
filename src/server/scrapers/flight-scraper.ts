const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const MAX_RETRIES = 2;

// --------------- interfaces ---------------

export interface Airport {
  code: string;
  name: string;
  city: string;
  gate?: string;
  terminal?: string;
  scheduledTime?: string;
  actualTime?: string;
  estimatedTime?: string;
}

export interface FlightPosition {
  lat: number;
  lon: number;
  speed?: number;
  altitude?: number;
  heading?: number;
  timestamp?: string;
}

export interface FlightStatus {
  airline: string;
  airlineCode: string;
  flightNumber: string;
  status: string;
  departure: Airport;
  arrival: Airport;
  equipment?: string;
  duration?: string;
  tailNumber?: string;
  lastPosition?: FlightPosition;
}

// --------------- helpers ---------------

function extractNextData(html: string): Record<string, unknown> | null {
  const marker = "__NEXT_DATA__ = ";
  const idx = html.indexOf(marker);
  if (idx === -1) return null;

  const start = html.indexOf("{", idx);
  if (start === -1) return null;

  let depth = 0;
  let end = start;
  for (let i = start; i < html.length; i++) {
    if (html[i] === "{") depth++;
    else if (html[i] === "}") depth--;
    if (depth === 0) {
      end = i + 1;
      break;
    }
  }

  try {
    return JSON.parse(html.slice(start, end));
  } catch {
    return null;
  }
}

function mapAirport(raw: Record<string, unknown> | undefined): Airport {
  if (!raw) return { code: "", name: "", city: "" };
  return {
    code: String(raw.iata || raw.icao || raw.fs || ""),
    name: String(raw.name || raw.airportName || ""),
    city: String(raw.city || ""),
    gate: raw.gate ? String(raw.gate) : undefined,
    terminal: raw.terminal ? String(raw.terminal) : undefined,
    scheduledTime: raw.scheduledTime ? String(raw.scheduledTime) : undefined,
    actualTime: raw.actualTime ? String(raw.actualTime) : undefined,
    estimatedTime: raw.estimatedTime ? String(raw.estimatedTime) : undefined,
  };
}

function mapPosition(raw: Record<string, unknown> | undefined): FlightPosition | undefined {
  if (!raw) return undefined;
  const lat = Number(raw.lat || raw.latitude || 0);
  const lon = Number(raw.lon || raw.lng || raw.longitude || 0);
  if (!lat && !lon) return undefined;
  return {
    lat,
    lon,
    speed: raw.speed != null ? Number(raw.speed) : undefined,
    altitude: raw.altitude != null ? Number(raw.altitude) : undefined,
    heading: raw.heading != null ? Number(raw.heading) : undefined,
    timestamp: raw.timestamp ? String(raw.timestamp) : undefined,
  };
}

// --------------- public ---------------

export async function searchFlights(
  airlineCode: string,
  flightNumber: string,
  year: number,
  month: number,
  day: number
): Promise<FlightStatus[]> {
  const url =
    `https://www.flightstats.com/v2/flight-tracker/${airlineCode}/${flightNumber}` +
    `?year=${year}&month=${month}&date=${day}`;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "text/html,application/xhtml+xml,*/*",
        },
        signal: AbortSignal.timeout(20_000),
      });

      if (!res.ok) {
        if (attempt < MAX_RETRIES) continue;
        throw new Error(`FlightStats returned HTTP ${res.status}`);
      }

      const html = await res.text();
      const nextData = extractNextData(html);
      if (!nextData) {
        if (attempt < MAX_RETRIES) continue;
        throw new Error("Could not extract __NEXT_DATA__ from FlightStats");
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const props = (nextData as any)?.props?.pageProps;
      if (!props) return [];

      const flightData = props.flightData || props.flight || props;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const flights: any[] = Array.isArray(flightData)
        ? flightData
        : flightData?.flights || (flightData ? [flightData] : []);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return flights.map((f: any) => {
        const dep = f.departure || f.departureAirport || {};
        const arr = f.arrival || f.arrivalAirport || {};
        const pos = f.lastPosition || f.position || f.track;

        return {
          airline: String(f.airlineName || f.carrier?.name || f.airline || ""),
          airlineCode: String(f.carrierCode || f.carrier?.fs || airlineCode),
          flightNumber: String(f.flightNumber || flightNumber),
          status: String(f.status || f.statusDescription || ""),
          departure: mapAirport(dep),
          arrival: mapAirport(arr),
          equipment: f.equipment?.name || f.aircraft || undefined,
          duration: f.duration || f.flightDuration || undefined,
          tailNumber: f.tailNumber || f.registration || undefined,
          lastPosition: mapPosition(pos),
        };
      });
    } catch (err) {
      lastError = err as Error;
      if (attempt < MAX_RETRIES) continue;
    }
  }

  throw lastError || new Error("searchFlights failed after retries");
}
