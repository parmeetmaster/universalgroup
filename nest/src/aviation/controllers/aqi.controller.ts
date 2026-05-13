import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { AqiScraper } from '../scrapers/aqi.scraper';

@ApiTags('AQI & Weather')
@Controller('aviation-news/aqi')
export class AqiController {
  constructor(private readonly aqiScraper: AqiScraper) {}

  @Get()
  @ApiOperation({
    summary: 'Get AQI and weather by lat/lng',
    description: 'Returns real-time AQI (US & India), pollutant levels (PM2.5, PM10, O3, NO2, SO2, CO), and weather data for the nearest station to the given coordinates.',
  })
  @ApiQuery({ name: 'lat', required: true, description: 'Latitude', example: '28.6692' })
  @ApiQuery({ name: 'lng', required: true, description: 'Longitude', example: '77.4538' })
  @ApiResponse({ status: 200, description: 'AQI and weather data retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or missing coordinates' })
  async getAqi(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
  ) {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      throw new BadRequestException('Valid lat and lng query parameters are required');
    }

    return this.aqiScraper.getAqiByLocation(latitude, longitude);
  }
}
