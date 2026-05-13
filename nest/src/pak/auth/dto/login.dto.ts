import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'parmeets834@gmail.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'asd1236547899' })
  @IsString()
  @MinLength(1)
  password!: string;
}
