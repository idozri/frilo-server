/** @format */

import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AppDataService } from './app-data.service';
import { User } from '../auth/decorators/user.decorator';

@ApiTags('app-data')
@Controller('app-data')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AppDataController {
  constructor(private readonly appDataService: AppDataService) {}

  @Get('initial')
  @ApiOperation({ summary: 'Get all initial app data' })
  @ApiResponse({
    status: 200,
    description: 'Returns all necessary data for app initialization.',
  })
  getInitialData(@User() user: any) {
    return this.appDataService.getInitialData(user.userId);
  }
}
