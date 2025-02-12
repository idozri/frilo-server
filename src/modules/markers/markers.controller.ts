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

@ApiTags('markers')
@Controller('markers')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MarkersController {
  constructor(private readonly markersService: MarkersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new marker' })
  @ApiResponse({ status: 201, description: 'Marker created successfully.' })
  async create(@Body() createMarkerDto: CreateMarkerDto, @Request() req) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('User ID is required');
    }
    return this.markersService.create(userId, createMarkerDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all markers' })
  @ApiResponse({ status: 200, description: 'Returns all markers.' })
  async findAll(@Query() query: FindAllParams) {
    return this.markersService.findAll(query);
  }

  @Get('user')
  @ApiOperation({ summary: 'Get user markers' })
  @ApiResponse({ status: 200, description: 'Returns user markers.' })
  async getUserMarkers(@Request() req) {
    return this.markersService.getUserMarkers(req.user.userId);
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
    @Request() req,
    @Param('id') id: string,
    @Body() updateData: Partial<Marker>
  ) {
    return this.markersService.update(id, req.user.userId, updateData);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update a marker status' })
  @ApiResponse({
    status: 200,
    description: 'Marker status updated successfully.',
  })
  async changeStatus(
    @Param('id') id: string,
    @Body('status') status: MarkerStatus
  ) {
    return this.markersService.changeStatus(id, status);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a marker' })
  @ApiResponse({ status: 200, description: 'Marker deleted successfully.' })
  async remove(@Request() req, @Param('id') id: string) {
    return this.markersService.remove(id, req.user.userId);
  }

  @Post(':id/apply')
  @ApiOperation({ summary: 'Apply to help with a marker' })
  @ApiResponse({ status: 200, description: 'Applied successfully.' })
  async applyForHelp(@Request() req, @Param('id') id: string) {
    return this.markersService.applyForHelp(id, req.user.userId);
  }

  @Delete(':id/apply')
  @ApiOperation({ summary: 'Remove application to help' })
  @ApiResponse({
    status: 200,
    description: 'Application removed successfully.',
  })
  async removeFromHelp(@Request() req, @Param('id') id: string) {
    return this.markersService.removeFromHelp(id, req.user.userId);
  }

  @Put(':id/participants/:participantId')
  @ApiOperation({ summary: 'Update participant status' })
  @ApiResponse({
    status: 200,
    description: 'Participant status updated successfully.',
  })
  async updateParticipantStatus(
    @Request() req,
    @Param('id') id: string,
    @Param('participantId') participantId: string,
    @Body('status') status: 'accepted' | 'rejected'
  ) {
    return this.markersService.updateParticipantStatus(
      id,
      participantId,
      status,
      req.user.userId
    );
  }

  @Get('count')
  @ApiOperation({ summary: 'Get user markers count' })
  @ApiResponse({
    status: 200,
    description: 'Returns the count of user markers.',
  })
  async getMarkersCount(@Request() req) {
    return this.markersService.getMarkersCount(req.user.userId);
  }
}
