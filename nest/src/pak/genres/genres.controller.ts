import { Controller, Get, Param, UseInterceptors } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PakGenresService } from './genres.service';
import { TransformInterceptor } from '../common/transform.interceptor';

@ApiTags('pak-genres')
@UseInterceptors(TransformInterceptor)
@Controller('pakistani-serials/genres')
export class PakGenresController {
  constructor(private readonly svc: PakGenresService) {}

  @Get()
  @ApiOperation({ summary: 'List all genres (ordered)' })
  list() {
    return this.svc.list();
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get a genre by slug' })
  detail(@Param('slug') slug: string) {
    return this.svc.findBySlug(slug);
  }
}
