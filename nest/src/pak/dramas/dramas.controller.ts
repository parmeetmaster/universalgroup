import { Controller, Get, Param, Query, UseInterceptors } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PakDramasService } from './dramas.service';
import { ListDramasDto } from './dto/list-dramas.dto';
import { TransformInterceptor } from '../common/transform.interceptor';

@ApiTags('pak-dramas')
@UseInterceptors(TransformInterceptor)
@Controller('pakistani-serials/dramas')
export class PakDramasController {
  constructor(private readonly svc: PakDramasService) {}

  @Get()
  @ApiOperation({ summary: 'List dramas (paginated, filterable)' })
  list(@Query() dto: ListDramasDto) {
    return this.svc.list(dto);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get a drama by slug' })
  detail(@Param('slug') slug: string) {
    return this.svc.findBySlug(slug);
  }

  @Get(':slug/related')
  @ApiOperation({ summary: 'Related dramas by shared genre' })
  related(@Param('slug') slug: string) {
    return this.svc.related(slug);
  }
}
