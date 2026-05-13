import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FlightAirportDto {
  @ApiProperty({ example: 'DEL' })
  code: string;

  @ApiProperty({ example: 'Delhi Indira Gandhi International Airport' })
  name: string;

  @ApiProperty({ example: 'Delhi' })
  city: string;

  @ApiProperty({ example: 'IN' })
  country: string;

  @ApiPropertyOptional({ example: 'D6' })
  gate: string | null;

  @ApiPropertyOptional({ example: '1' })
  terminal: string | null;

  @ApiProperty({ example: '11:30' })
  scheduledTime: string;

  @ApiProperty({ example: '11:29' })
  actualTime: string;

  @ApiProperty({ example: 'IST' })
  timezone: string;
}

export class FlightStatusDto {
  @ApiProperty({ example: 'Departed' })
  status: string;

  @ApiProperty({ example: 'On time' })
  statusDescription: string;

  @ApiProperty({ example: 'green' })
  color: string;

  @ApiProperty({ example: 0 })
  departureDelayMinutes: number;

  @ApiProperty({ example: 0 })
  arrivalDelayMinutes: number;

  @ApiProperty({ example: false })
  canceled: boolean;

  @ApiProperty({ example: false })
  diverted: boolean;

  @ApiProperty({ example: 'Climbing' })
  phase: string;
}

export class FlightEquipmentDto {
  @ApiProperty({ example: '32N' })
  iata: string;

  @ApiProperty({ example: 'Airbus A320neo' })
  name: string;
}

export class FlightPositionDto {
  @ApiProperty({ example: 77.897602 })
  longitude: number;

  @ApiProperty({ example: 28.525978 })
  latitude: number;

  @ApiProperty({ example: 270 })
  speedMph: number;

  @ApiProperty({ example: 8703 })
  altitudeFt: number;
}

export class FlightResponseDto {
  @ApiProperty({ example: 1372898012 })
  flightId: number;

  @ApiProperty({ example: 'IndiGo' })
  airline: string;

  @ApiProperty({ example: '6E' })
  airlineCode: string;

  @ApiProperty({ example: '765' })
  flightNumber: string;

  @ApiProperty({ type: FlightStatusDto })
  status: FlightStatusDto;

  @ApiProperty({ type: FlightAirportDto })
  departure: FlightAirportDto;

  @ApiProperty({ type: FlightAirportDto })
  arrival: FlightAirportDto;

  @ApiProperty({ type: FlightEquipmentDto })
  equipment: FlightEquipmentDto;

  @ApiProperty({ example: '2h 30m' })
  duration: string;

  @ApiPropertyOptional({ example: 'VT-IIM' })
  tailNumber: string | null;

  @ApiPropertyOptional({ example: 'IGO765' })
  callsign: string | null;

  @ApiPropertyOptional({ type: FlightPositionDto, description: 'Last known position (if tracking)' })
  lastPosition: FlightPositionDto | null;

  @ApiProperty({ example: '2026-03-20' })
  date: string;
}
