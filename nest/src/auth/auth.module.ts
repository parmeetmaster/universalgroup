import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserCredentialsEntity } from './user-credentials.entity';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      name: 'auth',
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get('ANIMEKILL_APP_DB_HOST', '127.0.0.1'),
        port: parseInt(config.get('ANIMEKILL_APP_DB_PORT', '3306'), 10),
        username: config.get('ANIMEKILL_APP_DB_USER', 'animekill_app'),
        password: config.get('ANIMEKILL_APP_DB_PASS', ''),
        database: config.get('ANIMEKILL_APP_DB_NAME', 'animekill_app'),
        entities: [UserCredentialsEntity],
        synchronize: false,
      }),
    }),
    TypeOrmModule.forFeature([UserCredentialsEntity], 'auth'),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
