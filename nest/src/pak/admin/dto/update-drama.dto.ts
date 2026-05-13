import { PartialType } from '@nestjs/swagger';
import { CreateDramaDto } from './create-drama.dto';

export class UpdateDramaDto extends PartialType(CreateDramaDto) {}
