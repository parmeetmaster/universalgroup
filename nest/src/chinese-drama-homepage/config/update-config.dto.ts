import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CdUpdateConfigDto {
  @ApiPropertyOptional({ example: '1.0.0' }) @IsOptional() @IsString() @MaxLength(20)
  minBuildVersion?: string;

  @ApiPropertyOptional({ example: '1.0.0' }) @IsOptional() @IsString() @MaxLength(20)
  latestBuildVersion?: string;

  @ApiPropertyOptional({ example: false }) @IsOptional() @IsBoolean()
  forceUpdate?: boolean;

  @ApiPropertyOptional({ example: false }) @IsOptional() @IsBoolean()
  maintenanceMode?: boolean;

  @ApiPropertyOptional() @IsOptional() @IsString()
  maintenanceMessage?: string | null;

  @ApiPropertyOptional() @IsOptional() @IsString()
  announcement?: string | null;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500)
  playStoreUrl?: string | null;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(255)
  supportEmail?: string | null;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500)
  privacyUrl?: string | null;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500)
  termsUrl?: string | null;

  @ApiPropertyOptional({ example: true }) @IsOptional() @IsBoolean()
  updateViaLink?: boolean;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500)
  appUpdateLink?: string | null;
}
