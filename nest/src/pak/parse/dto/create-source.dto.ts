import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt, IsObject, IsOptional, IsString, IsUrl,
  Max, MaxLength, Min, MinLength,
} from 'class-validator';

export class CreateSourceDto {
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(120)
  name!: string;

  @ApiProperty() @IsString() @MinLength(1) @MaxLength(120)
  slug!: string;

  @ApiProperty() @IsUrl() @MaxLength(500)
  baseUrl!: string;

  @ApiProperty({ description: 'Parser driver slug (genericHls, hum_tv, etc.)' })
  @IsString() @MaxLength(64)
  driver!: string;

  @ApiPropertyOptional({ description: 'Free-form JSON driver config' })
  @IsOptional() @IsObject()
  config?: Record<string, any>;

  @ApiPropertyOptional({ default: 100 })
  @IsOptional() @IsInt() @Min(0) @Max(1000)
  priority?: number;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional() @IsInt() @Min(0) @Max(1)
  isActive?: number;
}
