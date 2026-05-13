import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateAppConfigDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(20)
  minAppVersion?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(20)
  latestAppVersion?: string;

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  forceUpdate?: boolean;

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
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
}
