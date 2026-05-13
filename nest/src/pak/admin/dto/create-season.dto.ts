import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUrl, Max, MaxLength, Min } from 'class-validator';

export class CreateSeasonDto {
  @ApiProperty()
  @IsString()
  dramaId!: string;

  @ApiProperty({ minimum: 1 })
  @IsInt() @Min(1) @Max(50)
  number!: number;

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(255)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  synopsis?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsUrl()
  posterUrl?: string;
}
