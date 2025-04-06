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
import { FindAllParams, MarkersService } from './markers.service';
import { CreateMarkerDto } from './dto/create-marker.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Marker, MarkerStatus } from './entities/marker.entity';
import { User } from '../auth/decorators/user.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiResponse as CommonApiResponse } from 'src/common/interfaces/api-response.interface';
import { MarkerResponse } from './types/app.marker';

@ApiTags('markers')
@Controller('markers')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MarkersController {
  constructor(private readonly markersService: MarkersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new marker' })
  @ApiResponse({ status: 201, description: 'Marker created successfully.' })
  async create(
    @Body() createMarkerDto: CreateMarkerDto,
    @CurrentUser('userId') userId: string
  ): Promise<CommonApiResponse<MarkerResponse>> {
    return this.markersService.create(userId, createMarkerDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all markers' })
  @ApiResponse({ status: 200, description: 'Returns all markers.' })
  async findAll(
    @Query('latitude') latitude?: number,
    @Query('longitude') longitude?: number,
    @Query('radius') radius?: number
  ) {
    return this.markersService.findAll(
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
  @ApiOperation({ summary: 'Get user markers' })
  @ApiResponse({ status: 200, description: 'Returns user markers.' })
  async getUserMarkers(@CurrentUser('userId') userId: string) {
    return this.markersService.getUserMarkers(userId);
  }

  @Get('count')
  @ApiOperation({ summary: 'Get user markers count' })
  @ApiResponse({
    status: 200,
    description: 'Returns the count of user markers.',
  })
  async getMarkersCount(@CurrentUser('userId') userId: string) {
    const count = await this.markersService.getMarkersCount(userId);
    return { count };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a marker by id' })
  @ApiResponse({ status: 200, description: 'Returns the marker.' })
  async findOne(@Param('id') id: string) {
    return this.markersService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a marker' })
  @ApiResponse({ status: 200, description: 'Marker updated successfully.' })
  async update(
    @Param('id') id: string,
    @Body() updateMarkerDto: any,
    @CurrentUser('userId') userId: string
  ) {
    return this.markersService.update(id, userId, updateMarkerDto);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update a marker status' })
  @ApiResponse({
    status: 200,
    description: 'Marker status updated successfully.',
  })
  async changeStatus(
    @Param('id') id: string,
    @Body('status') status: MarkerStatus,
    @CurrentUser('userId') userId: string
  ) {
    await this.markersService.changeStatus(id, status, userId);
    return { success: true };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a marker' })
  @ApiResponse({ status: 200, description: 'Marker deleted successfully.' })
  async remove(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    await this.markersService.remove(id, userId);
    return { success: true };
  }

  @Post(':id/apply')
  @ApiOperation({ summary: 'Apply to help with a marker' })
  @ApiResponse({ status: 200, description: 'Applied successfully.' })
  async applyForHelp(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string
  ) {
    await this.markersService.applyForHelp(id, userId);
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
    await this.markersService.removeFromHelp(id, userId);
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
    await this.markersService.updateParticipantStatus(
      id,
      participantId,
      status
    );
    return { success: true };
  }
}
