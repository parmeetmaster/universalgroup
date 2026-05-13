import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { FlightScraper } from '../scrapers/flight.scraper';

@ApiTags('Flight Tracker')
@Controller('aviation-news/flight')
export class FlightController {
  constructor(private readonly flightScraper: FlightScraper) {}

  @Get()
  @ApiOperation({
    summary: 'Get flight status',
    description:
      'Returns real-time flight status. Supports two formats:\n' +
      '1. Combined: `?number=6E765&date=2026-03-20`\n' +
      '2. Separate: `?airline=6E&flight=765&date=2026-03-20`',
  })
  @ApiQuery({ name: 'number', required: false, description: 'Combined flight number (e.g. 6E765, AZV2955, AI101)', example: '6E765' })
  @ApiQuery({ name: 'airline', required: false, description: 'Airline IATA/ICAO code (e.g. 6E, AI, AZV)', example: '6E' })
  @ApiQuery({ name: 'flight', required: false, description: 'Flight number (e.g. 765)', example: '765' })
  @ApiQuery({ name: 'date', required: true, description: 'Date in YYYY-MM-DD format', example: '2026-03-20' })
  @ApiResponse({ status: 200, description: 'Flight data retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid parameters' })
  async getFlight(
    @Query('number') number: string,
    @Query('airline') airline: string,
    @Query('flight') flight: string,
    @Query('date') date: string,
  ) {
    if (!date) {
      throw new BadRequestException('date is required (YYYY-MM-DD)');
    }

    let airlineCode: string;
    let flightNum: string;

    if (number) {
      // Parse combined format: "6E765", "AZV2955", "AI101", "EK524"
      // IATA codes: 2 chars (e.g. 6E, AI, EK, 9W) — try first
      // ICAO codes: 3 letters (e.g. IGO, AZV, UAE) — fallback
      const upper = number.toUpperCase();
      const parsed =
        upper.match(/^([A-Z\d]{2})(\d+)$/) ||    // 2-char IATA: 6E765, AI101
        upper.match(/^([A-Z]{3})(\d+)$/);          // 3-char ICAO: AZV2955, IGO765
      if (!parsed) {
        throw new BadRequestException(
          'Invalid flight number format. Use airline code + number (e.g. 6E765, AZV2955, AI101)',
        );
      }
      airlineCode = parsed[1];
      flightNum = parsed[2];
    } else if (airline && flight) {
      airlineCode = airline.toUpperCase();
      flightNum = flight;
    } else {
      throw new BadRequestException(
        'Provide either "number" (e.g. 6E765) or both "airline" and "flight" params',
      );
    }

    const [yearStr, monthStr, dayStr] = date.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const day = parseInt(dayStr, 10);

    if (isNaN(year) || isNaN(month) || isNaN(day)) {
      throw new BadRequestException('date must be in YYYY-MM-DD format');
    }

    return this.flightScraper.searchFlights(airlineCode, flightNum, year, month, day);
  }
}
