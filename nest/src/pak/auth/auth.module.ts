import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminUser } from '../entities/admin-user.entity';
import { PakAuthController } from './auth.controller';
import { PakAuthService } from './auth.service';
import { PakAdminTokenGuard } from '../common/admin-token.guard';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([AdminUser], 'pak')],
  controllers: [PakAuthController],
  providers: [PakAuthService, PakAdminTokenGuard],
  exports: [PakAuthService],
})
export class PakAuthModule {}
