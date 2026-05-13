import { ApiProperty } from '@nestjs/swagger';

export class AqiLocationDto {
  @ApiProperty({ example: 'Ghaziabad' })
  city: string;

  @ApiProperty({ example: 'Uttar Pradesh' })
  state: string;

  @ApiProperty({ example: 'India' })
  country: string;

  @ApiProperty({ example: 'Nasbandi Colony, Ghaziabad, Uttar Pradesh, India' })
  station: string;

  @ApiProperty({ example: 28.67 })
  latitude: number;

  @ApiProperty({ example: 77.42 })
  longitude: number;

  @ApiProperty({ example: 'india/uttar-pradesh/ghaziabad' })
  slug: string;
}

export class AqiDataDto {
  @ApiProperty({ example: 177, description: 'AQI (US standard)', nullable: true })
  aqiUS: number | null;

  @ApiProperty({ example: 215, description: 'AQI (India standard)', nullable: true })
  aqiIN: number | null;

  @ApiProperty({ example: 96, description: 'PM2.5 in µg/m³', nullable: true })
  pm25: number | null;

  @ApiProperty({ example: 120, description: 'PM10 in µg/m³', nullable: true })
  pm10: number | null;

  @ApiProperty({ example: 20, description: 'Ozone in ppb', nullable: true })
  o3: number | null;

  @ApiProperty({ example: 40, description: 'NO2 in ppb', nullable: true })
  no2: number | null;

  @ApiProperty({ example: 9, description: 'SO2 in ppb', nullable: true })
  so2: number | null;

  @ApiProperty({ example: 222, description: 'CO in ppb', nullable: true })
  co: number | null;
}

export class WeatherConditionDto {
  @ApiProperty({ example: 'Patchy light rain with thunder' })
  text: string;

  @ApiProperty({ example: 'https://apiserver.aqi.in/uploads/weather-icons/7.svg' })
  icon: string;

  @ApiProperty({ example: 1273, nullable: true })
  code: number | null;
}

export class WeatherDataDto {
  @ApiProperty({ example: 18.3, description: 'Temperature in °C', nullable: true })
  temperature: number | null;

  @ApiProperty({ example: 18.3, description: 'Feels like temperature in °C', nullable: true })
  feelsLike: number | null;

  @ApiProperty({ example: 94, description: 'Humidity percentage', nullable: true })
  humidity: number | null;

  @ApiProperty({ example: 6.1, description: 'Wind speed in km/h', nullable: true })
  windSpeed: number | null;

  @ApiProperty({ example: 'ESE', description: 'Wind direction' })
  windDirection: string;

  @ApiProperty({ example: 1014, description: 'Pressure in mb', nullable: true })
  pressure: number | null;

  @ApiProperty({ example: 1.3, description: 'Visibility in km', nullable: true })
  visibility: number | null;

  @ApiProperty({ example: 0.9, description: 'UV index', nullable: true })
  uvIndex: number | null;

  @ApiProperty({ example: 'Low', description: 'UV condition text' })
  uvCondition: string;

  @ApiProperty({ example: 100, description: 'Cloud cover percentage', nullable: true })
  cloud: number | null;

  @ApiProperty({ example: 0.12, description: 'Precipitation in mm', nullable: true })
  precipitation: number | null;

  @ApiProperty({ type: WeatherConditionDto })
  condition: WeatherConditionDto;
}

export class AqiResponseDto {
  @ApiProperty({ type: AqiLocationDto })
  location: AqiLocationDto;

  @ApiProperty({ type: AqiDataDto })
  aqi: AqiDataDto;

  @ApiProperty({ type: WeatherDataDto })
  weather: WeatherDataDto;

  @ApiProperty({ example: '2026-03-20T11:31:00.000Z' })
  updatedAt: string;

  @ApiProperty({ example: true })
  isOnline: boolean;
}
