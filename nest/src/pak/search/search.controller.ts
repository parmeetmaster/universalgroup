import { Controller, Get, Query, UseInterceptors } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { PakSearchService } from './search.service';
import { TransformInterceptor } from '../common/transform.interceptor';

@ApiTags('pak-search')
@UseInterceptors(TransformInterceptor)
@Controller('pakistani-serials/search')
export class PakSearchController {
  constructor(private readonly svc: PakSearchService) {}

  @Get()
  @ApiOperation({ summary: 'Search across dramas, episodes, and cast' })
  @ApiQuery({ name: 'q', required: true })
  search(@Query('q') q: string) {
    return this.svc.search(q);
  }
}
