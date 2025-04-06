/** @format */

import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Marker,
  MarkerDocument,
  MarkerStatus,
  Participant,
} from './entities/marker.entity';
import { CreateMarkerDto } from './dto/create-marker.dto';
import { UsersService } from '../users/users.service';
import { S3Service } from '../s3/s3.service';
import { CategoriesService } from '../categories/categories.service';
import { ApiResponse } from 'src/common/interfaces/api-response.interface';
import { AppMarker, MarkerResponse } from './types/app.marker';
import { MarkersAdapter } from './adapter/markers.adapter';
import { MongoUtils } from 'src/utils/mongodb.utils';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import { AchievementsService } from '../achievements/achievements.service';
import { AchievementType } from '../achievements/types/achievement.types';
import { Achievement } from '../achievements/entities/achievement.entity';

export interface FindAllParams {
  categoryId?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
}

interface LocationParams {
  latitude: number;
  longitude: number;
  radius?: number;
}

@Injectable()
export class MarkersService implements OnModuleInit {
  constructor(
    @InjectModel(Marker.name) private markerModel: Model<MarkerDocument>,
    private s3Service: S3Service,
    private categoriesService: CategoriesService,
    private markersAdapter: MarkersAdapter,
    private notificationsService: NotificationsService,
    private achievementsService: AchievementsService
  ) {}

  async onModuleInit() {
    try {
      await this.markerModel.collection.createIndex({ location: '2dsphere' });
      console.log('Geospatial index created');
    } catch (err) {
      console.error('Error creating geospatial index:', err);
    }
  }

  async create(
    userId: string,
    createMarkerDto: CreateMarkerDto
  ): Promise<ApiResponse<MarkerResponse>> {
    console.log('createMarkerDto', createMarkerDto);

    const marker = new this.markerModel({
      ...createMarkerDto,
      categoryId: MongoUtils.toObjectId(createMarkerDto.categoryId),
      participants: [],
      rating: 0,
      reviewCount: 0,
      visitCount: 0,
      isFavorited: false,
      ownerId: userId,
    });

    try {
      await marker.save();
      const uploadedImages = await this.s3Service.uploadFiles(
        createMarkerDto.images,
        `markers/attachments/${marker.id}`
      );
      marker.images = uploadedImages;
      await marker.save();

      // Check for marker creation achievements
      const { completedAchievements, newAchievements } =
        await this.achievementsService.checkAchievementsByType(
          userId,
          AchievementType.MARKERS_CREATED
        );

      try {
        this.categoriesService.incrementMarkersCount(
          createMarkerDto.categoryId
        );
      } catch (error) {
        console.error('Error incrementing markers count:', error);
      }

      return {
        isSuccess: true,
        message: 'Marker created successfully',
        data: {
          ...this.markersAdapter.mapMarkerToAppMarker(marker),
          completedAchievements,
          newAchievements,
        },
      };
    } catch (error) {
      console.error('Error creating marker:', error);
      return {
        isSuccess: false,
        message: 'Error creating marker',
        data: null,
      };
    }
  }

  async findAll(params?: LocationParams): Promise<AppMarker[]> {
    const query: any = {};

    if (params) {
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [params.longitude, params.latitude],
          },
          $maxDistance: params.radius || 5000, // Default 5km radius
        },
      };
    }

    const markers = await this.markerModel
      .find(query)
      .limit(1)
      .populate('category')
      .populate('owner', 'id name')
      .sort({ createdAt: -1 })
      .exec();
    return this.markersAdapter.mapMarkersToAppMarkers(markers);
  }

  async findOne(id: string): Promise<Marker> {
    const markerId = MongoUtils.toObjectId(id);
    const marker = await this.markerModel
      .findById(markerId)
      .populate('category', 'id name icon description color type markersCount')
      .populate('owner', 'id name')
      .exec();
    if (!marker) {
      throw new NotFoundException(`Marker #${id} not found`);
    }
    return marker;
  }

  async update(
    id: string,
    userId: string,
    updateData: Partial<Marker>
  ): Promise<ApiResponse<AppMarker>> {
    try {
      const marker = await this.findOne(id);

      if (marker.ownerId.toString() !== userId) {
        throw new UnauthorizedException(
          'Only the owner can update this marker'
        );
      }

      // Delete old images folder
      const folderPath = `markers/attachments/${id}`;
      await this.s3Service.deleteFolder(folderPath);

      // Upload new images if any
      if (updateData.images?.length > 0) {
        const uploadedImages = await this.s3Service.uploadFiles(
          updateData.images,
          folderPath
        );
        updateData.images = uploadedImages;
      }

      const markerId = MongoUtils.toObjectId(id);
      const updatedMarker = await this.markerModel
        .findByIdAndUpdate(markerId, updateData, { new: true })
        .populate(
          'category',
          'id name icon description color type markersCount'
        )
        .populate('owner', 'id name')
        .exec();

      if (updateData.categoryId !== MongoUtils.toString(marker.categoryId)) {
        try {
          this.categoriesService.incrementMarkersCount(updateData.categoryId);
          this.categoriesService.decrementMarkersCount(marker.categoryId);
        } catch (error) {
          console.error('Error incrementing markers count:', error);
        }
      }

      return {
        isSuccess: true,
        message: 'Marker updated successfully',
        data: this.markersAdapter.mapMarkerToAppMarker(updatedMarker),
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      if (error.name === 'BSONError') {
        throw new NotFoundException(`Invalid marker ID format: ${id}`);
      }
      throw error;
    }
  }

  async remove(id: string, userId: string): Promise<void> {
    const marker = await this.findOne(id);

    if (marker.ownerId.toString() !== userId) {
      throw new UnauthorizedException('Only the owner can delete this marker');
    }

    // Delete marker folder from S3
    const folderPath = `markers/attachments/${id}`;
    await this.s3Service.deleteFolder(folderPath);

    await this.markerModel.findByIdAndDelete(id).exec();
  }

  private extractKeyFromUrl(url: string): string {
    const urlParts = url.split('/');
    return urlParts.slice(3).join('/'); // Remove protocol and bucket name
  }

  async getUserMarkers(userId: string): Promise<AppMarker[]> {
    const markers = await this.markerModel
      .find({ ownerId: userId })
      .sort({ createdAt: -1 })
      .populate('category', 'id name icon description color type markersCount')
      .populate('owner', 'id name')
      .exec();
    return this.markersAdapter.mapMarkersToAppMarkers(markers);
  }

  async changeStatus(
    markerId: string,
    status: MarkerStatus,
    userId: string
  ): Promise<void> {
    const marker = await this.markerModel.findById(markerId);

    marker.status = status;

    await marker.save();

    const isCompleted = status === MarkerStatus.COMPLETED;
    if (isCompleted && marker.ownerId.toString() !== userId) {
      await this.notificationsService.addNotification({
        userIds: [marker.ownerId],
        title: 'Marker Completed',
        message: `Your marker: ${marker.title} has been completed`,
        type: NotificationType.MARKER_COMPLETED,
        action: {
          type: 'marker',
          id: markerId,
        },
      });
    }

    const shouldIncrement = status === MarkerStatus.ACTIVE;
    if (shouldIncrement) {
      this.categoriesService.incrementMarkersCount(marker.categoryId);
    }

    if (
      status === MarkerStatus.CANCELLED ||
      status === MarkerStatus.COMPLETED ||
      status === MarkerStatus.PENDING
    ) {
      this.categoriesService.decrementMarkersCount(marker.categoryId);
    }
  }

  async applyForHelp(markerId: string, userId: string): Promise<void> {
    try {
      const marker = await this.findOne(markerId);

      const isAlreadyParticipant = marker.participants.some(
        (p) => p.userId === userId
      );

      if (isAlreadyParticipant) {
        throw new UnauthorizedException('User is already a participant');
      }

      const participant: Participant = {
        userId,
        status: 'Pending',
        joinedAt: new Date().toISOString(),
      };

      await this.markerModel
        .findByIdAndUpdate(markerId, {
          $push: { participants: participant },
        })
        .exec();

      // Send notification to marker owner
      await this.notificationsService.addNotification({
        userIds: [marker.ownerId],
        title: 'New Helper Application',
        message: `Someone wants to help with your marker: ${marker.title}`,
        type: NotificationType.MARKER_APPLICATION,
        action: {
          type: 'marker',
          id: markerId,
        },
      });
    } catch (error) {
      console.error('Error applying for help:', error);
      throw error;
    }
  }

  async removeFromHelp(markerId: string, userId: string): Promise<void> {
    try {
      const marker = await this.findOne(markerId);

      const isParticipant = marker.participants.some(
        (p) => p.userId === userId
      );

      if (!isParticipant) {
        throw new UnauthorizedException('User is not a participant');
      }

      await this.markerModel
        .findByIdAndUpdate(markerId, {
          $pull: { participants: { userId } },
        })
        .exec();
    } catch (error) {
      console.error('Error removing from help:', error);
      throw error;
    }
  }

  async updateParticipantStatus(
    markerId: string,
    participantId: string,
    status: 'accepted' | 'rejected'
  ): Promise<void> {
    const marker = await this.findOne(markerId);

    await this.markerModel
      .updateOne(
        { _id: markerId, 'participants.userId': participantId },
        { $set: { 'participants.$.status': status } }
      )
      .exec();

    // Send notification to participant
    await this.notificationsService.addNotification({
      userIds: [participantId],
      title:
        status === 'accepted' ? 'Application Accepted' : 'Application Rejected',
      message: `Your application to help with "${marker.title}" has been ${status}`,
      type: NotificationType.MARKER_STATUS_UPDATE,
      action: {
        type: 'marker',
        id: markerId,
      },
    });
  }

  async getMarkersCount(userId: string): Promise<number> {
    return this.markerModel.countDocuments({ ownerId: userId }).exec();
  }
}
