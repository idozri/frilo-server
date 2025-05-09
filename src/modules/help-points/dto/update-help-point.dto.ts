/** @format */

import { PartialType } from '@nestjs/swagger';
import { CreateHelpPointDto } from './create-help-point.dto';

export class UpdateHelpPointDto extends PartialType(CreateHelpPointDto) {}
