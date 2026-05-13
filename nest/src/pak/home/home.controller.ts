import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PakHomeService } from './home.service';
import { TransformInterceptor } from '../common/transform.interceptor';

@ApiTags('pak-home')
@UseInterceptors(TransformInterceptor)
@Controller('pakistani-serials/home')
export class PakHomeController {
  constructor(private readonly svc: PakHomeService) {}

  @Get()
  @ApiOperation({ summary: 'Composed home feed (hero + rails)' })
  get() {
    return this.svc.getHome();
  }
}
