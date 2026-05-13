import {
  Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PakAdminService } from './admin.service';
import { CreateDramaDto } from './dto/create-drama.dto';
import { UpdateDramaDto } from './dto/update-drama.dto';
import { CreateSeasonDto } from './dto/create-season.dto';
import { CreateEpisodeDto } from './dto/create-episode.dto';
import { PakAdminTokenGuard } from '../common/admin-token.guard';

@ApiTags('pak-admin')
@ApiHeader({ name: 'X-Admin-Token', required: true })
@UseGuards(PakAdminTokenGuard)
@Controller('pakistani-serials/admin')
export class PakAdminController {
  constructor(private readonly svc: PakAdminService) {}

  @Get('dramas')
  @ApiOperation({ summary: 'List every drama (no pagination -- dashboard use)' })
  listDramas() {
    return this.svc.listAllDramas();
  }

  @Post('dramas')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a drama' })
  createDrama(@Body() dto: CreateDramaDto) {
    return this.svc.createDrama(dto);
  }

  @Patch('dramas/:id')
  @ApiOperation({ summary: 'Update a drama' })
  updateDrama(@Param('id') id: string, @Body() dto: UpdateDramaDto) {
    return this.svc.updateDrama(id, dto);
  }

  @Delete('dramas/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a drama' })
  deleteDrama(@Param('id') id: string) {
    return this.svc.deleteDrama(id);
  }

  @Post('seasons')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a season' })
  createSeason(@Body() dto: CreateSeasonDto) {
    return this.svc.createSeason(dto);
  }

  @Delete('seasons/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a season (cascades episodes + videos)' })
  deleteSeason(@Param('id') id: string) {
    return this.svc.deleteSeason(id);
  }

  @Post('episodes')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create an episode' })
  createEpisode(@Body() dto: CreateEpisodeDto) {
    return this.svc.createEpisode(dto);
  }

  @Delete('episodes/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an episode (cascades videos)' })
  deleteEpisode(@Param('id') id: string) {
    return this.svc.deleteEpisode(id);
  }
}
