/** @format */

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  Put,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FindAllParams, HelpPointsService } from './help-points.service';
import { CreateHelpPointDto } from './dto/create-help-point.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { HelpPoint, HelpPointStatus } from './entities/help-point.entity';
import { User } from '../auth/decorators/user.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiResponse as CommonApiResponse } from 'src/common/interfaces/api-response.interface';
import { HelpPointResponse } from './types/app-help-point';

@ApiTags('helpPoints')
@Controller('helpPoints')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class HelpPointsController {
  constructor(private readonly helpPointsService: HelpPointsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new helpPoint' })
  @ApiResponse({ status: 201, description: 'HelpPoint created successfully.' })
  async create(
    @Body() createHelpPointDto: CreateHelpPointDto,
    @CurrentUser('userId') userId: string
  ): Promise<CommonApiResponse<HelpPointResponse>> {
    return this.helpPointsService.create(userId, createHelpPointDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all helpPoints' })
  @ApiResponse({ status: 200, description: 'Returns all helpPoints.' })
  async findAll(
    @Query('latitude') latitude?: number,
    @Query('longitude') longitude?: number,
    @Query('radius') radius?: number
  ) {
    return this.helpPointsService.findAll(
      latitude && longitude
        ? {
            latitude,
            longitude,
            radius,
          }
        : undefined
    );
  }

  @Get('user')
  @ApiOperation({ summary: 'Get user helpPoints' })
  @ApiResponse({ status: 200, description: 'Returns user helpPoints.' })
  async getUserHelpPoints(@CurrentUser('userId') userId: string) {
    return this.helpPointsService.getUserHelpPoints(userId);
  }

  @Get('count')
  @ApiOperation({ summary: 'Get user helpPoints count' })
  @ApiResponse({
    status: 200,
    description: 'Returns the count of user helpPoints.',
  })
  async getHelpPointsCount(@CurrentUser('userId') userId: string) {
    const count = await this.helpPointsService.getHelpPointsCount(userId);
    return { count };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a helpPoint by id' })
  @ApiResponse({ status: 200, description: 'Returns the helpPoint.' })
  async findOne(@Param('id') id: string) {
    return this.helpPointsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a helpPoint' })
  @ApiResponse({ status: 200, description: 'HelpPoint updated successfully.' })
  async update(
    @Param('id') id: string,
    @Body() updateHelpPointDto: any,
    @CurrentUser('userId') userId: string
  ) {
    return this.helpPointsService.update(id, userId, updateHelpPointDto);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update a helpPoint status' })
  @ApiResponse({
    status: 200,
    description: 'HelpPoint status updated successfully.',
  })
  async changeStatus(
    @Param('id') id: string,
    @Body('status') status: HelpPointStatus,
    @CurrentUser('userId') userId: string
  ) {
    await this.helpPointsService.changeStatus(id, status, userId);
    return { success: true };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a helpPoint' })
  @ApiResponse({ status: 200, description: 'HelpPoint deleted successfully.' })
  async remove(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    await this.helpPointsService.remove(id, userId);
    return { success: true };
  }

  @Post(':id/apply')
  @ApiOperation({ summary: 'Apply to help with a helpPoint' })
  @ApiResponse({ status: 200, description: 'Applied successfully.' })
  async applyForHelp(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string
  ) {
    await this.helpPointsService.applyForHelp(id, userId);
    return { success: true };
  }

  @Delete(':id/apply')
  @ApiOperation({ summary: 'Remove application to help' })
  @ApiResponse({
    status: 200,
    description: 'Application removed successfully.',
  })
  async removeFromHelp(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string
  ) {
    await this.helpPointsService.removeFromHelp(id, userId);
    return { success: true };
  }

  @Put(':id/participants/:participantId')
  @ApiOperation({ summary: 'Update participant status' })
  @ApiResponse({
    status: 200,
    description: 'Participant status updated successfully.',
  })
  async updateParticipantStatus(
    @Param('id') id: string,
    @Param('participantId') participantId: string,
    @Body('status') status: 'accepted' | 'rejected'
  ) {
    await this.helpPointsService.updateParticipantStatus(
      id,
      participantId,
      status
    );
    return { success: true };
  }
}
