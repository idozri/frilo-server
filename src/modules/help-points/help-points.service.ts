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
  HelpPoint,
  HelpPointDocument,
  HelpPointStatus,
  Participant,
} from './entities/help-point.entity';
import { CreateHelpPointDto } from './dto/create-help-point.dto';
import { UsersService } from '../users/users.service';
import { S3Service } from '../s3/s3.service';
import { CategoriesService } from '../categories/categories.service';
import { ApiResponse } from 'src/common/interfaces/api-response.interface';
import { AppHelpPoint, HelpPointResponse } from './types/app-help-point';
import { HelpPointsAdapter } from './adapter/help-points.adapter';
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
export class HelpPointsService implements OnModuleInit {
  constructor(
    @InjectModel(HelpPoint.name)
    private helpPointModel: Model<HelpPointDocument>,
    private s3Service: S3Service,
    private categoriesService: CategoriesService,
    private helpPointsAdapter: HelpPointsAdapter,
    private notificationsService: NotificationsService,
    private achievementsService: AchievementsService
  ) {}

  async onModuleInit() {
    try {
      await this.helpPointModel.collection.createIndex({
        location: '2dsphere',
      });
      console.log('Geospatial index created');
    } catch (err) {
      console.error('Error creating geospatial index:', err);
    }
  }

  async create(
    userId: string,
    createHelpPointDto: CreateHelpPointDto
  ): Promise<ApiResponse<HelpPointResponse>> {
    console.log('createHelpPointDto', createHelpPointDto);

    const helpPoint = new this.helpPointModel({
      ...createHelpPointDto,
      categoryId: MongoUtils.toObjectId(createHelpPointDto.categoryId),
      participants: [],
      rating: 0,
      reviewCount: 0,
      visitCount: 0,
      isFavorited: false,
      ownerId: userId,
    });

    try {
      await helpPoint.save();
      const uploadedImages = await this.s3Service.uploadFiles(
        createHelpPointDto.images,
        `helpPoints/attachments/${helpPoint.id}`
      );
      helpPoint.images = uploadedImages;
      await helpPoint.save();

      // Check for helpPoint creation achievements
      const { completedAchievements, newAchievements } =
        await this.achievementsService.checkAchievementsByType(
          userId,
          AchievementType.MARKERS_CREATED
        );

      try {
        this.categoriesService.incrementHelpPointsCount(
          createHelpPointDto.categoryId
        );
      } catch (error) {
        console.error('Error incrementing helpPoints count:', error);
      }

      return {
        isSuccess: true,
        message: 'HelpPoint created successfully',
        data: {
          ...this.helpPointsAdapter.mapHelpPointToAppHelpPoint(helpPoint),
          completedAchievements,
          newAchievements,
        },
      };
    } catch (error) {
      console.error('Error creating help point:', error);
      return {
        isSuccess: false,
        message: 'Error creating help point',
        data: null,
      };
    }
  }

  async findAll(params?: LocationParams): Promise<AppHelpPoint[]> {
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

    const helpPoints = await this.helpPointModel
      .find(query)
      .limit(1)
      .populate('category')
      .populate('owner', 'id name')
      .sort({ createdAt: -1 })
      .exec();
    return this.helpPointsAdapter.mapHelpPointsToAppHelpPoints(helpPoints);
  }

  async findOne(id: string): Promise<HelpPoint> {
    const helpPointId = MongoUtils.toObjectId(id);
    const helpPoint = await this.helpPointModel
      .findById(helpPointId)
      .populate(
        'category',
        'id name icon description color type helpPointsCount'
      )
      .populate('owner', 'id name')
      .exec();
    if (!helpPoint) {
      throw new NotFoundException(`Help point #${id} not found`);
    }
    return helpPoint;
  }

  async update(
    id: string,
    userId: string,
    updateData: Partial<HelpPoint>
  ): Promise<ApiResponse<AppHelpPoint>> {
    try {
      const helpPoint = await this.findOne(id);

      if (helpPoint.ownerId.toString() !== userId) {
        throw new UnauthorizedException(
          'Only the owner can update this help point'
        );
      }

      // Delete old images folder
      const folderPath = `helpPoints/attachments/${id}`;
      await this.s3Service.deleteFolder(folderPath);

      // Upload new images if any
      if (updateData.images?.length > 0) {
        const uploadedImages = await this.s3Service.uploadFiles(
          updateData.images,
          folderPath
        );
        updateData.images = uploadedImages;
      }

      const helpPointId = MongoUtils.toObjectId(id);
      const updatedHelpPoint = await this.helpPointModel
        .findByIdAndUpdate(helpPointId, updateData, { new: true })
        .populate(
          'category',
          'id name icon description color type helpPointsCount'
        )
        .populate('owner', 'id name')
        .exec();

      if (updateData.categoryId !== MongoUtils.toString(helpPoint.categoryId)) {
        try {
          this.categoriesService.incrementHelpPointsCount(
            updateData.categoryId
          );
          this.categoriesService.decrementHelpPointsCount(helpPoint.categoryId);
        } catch (error) {
          console.error('Error incrementing helpPoints count:', error);
        }
      }

      return {
        isSuccess: true,
        message: 'HelpPoint updated successfully',
        data: this.helpPointsAdapter.mapHelpPointToAppHelpPoint(
          updatedHelpPoint
        ),
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      if (error.name === 'BSONError') {
        throw new NotFoundException(`Invalid help point ID format: ${id}`);
      }
      throw error;
    }
  }

  async remove(id: string, userId: string): Promise<void> {
    const helpPoint = await this.findOne(id);

    if (helpPoint.ownerId.toString() !== userId) {
      throw new UnauthorizedException(
        'Only the owner can delete this help point'
      );
    }

    // Delete helpPoint folder from S3
    const folderPath = `helpPoints/attachments/${id}`;
    await this.s3Service.deleteFolder(folderPath);

    await this.helpPointModel.findByIdAndDelete(id).exec();
  }

  private extractKeyFromUrl(url: string): string {
    const urlParts = url.split('/');
    return urlParts.slice(3).join('/'); // Remove protocol and bucket name
  }

  async getUserHelpPoints(userId: string): Promise<AppHelpPoint[]> {
    const helpPoints = await this.helpPointModel
      .find({ ownerId: userId })
      .sort({ createdAt: -1 })
      .populate(
        'category',
        'id name icon description color type helpPointsCount'
      )
      .populate('owner', 'id name')
      .exec();
    return this.helpPointsAdapter.mapHelpPointsToAppHelpPoints(helpPoints);
  }

  async changeStatus(
    helpPointId: string,
    status: HelpPointStatus,
    userId: string
  ): Promise<void> {
    const helpPoint = await this.helpPointModel.findById(helpPointId);

    helpPoint.status = status;

    await helpPoint.save();

    const isCompleted = status === HelpPointStatus.COMPLETED;
    if (isCompleted && helpPoint.ownerId.toString() !== userId) {
      await this.notificationsService.addNotification({
        userIds: [helpPoint.ownerId],
        title: 'Help Point Completed',
        message: `Your help point: ${helpPoint.title} has been completed`,
        type: NotificationType.MARKER_COMPLETED,
        action: {
          type: 'helpPoint',
          id: helpPointId,
        },
      });
    }

    const shouldIncrement = status === HelpPointStatus.ACTIVE;
    if (shouldIncrement) {
      this.categoriesService.incrementHelpPointsCount(helpPoint.categoryId);
    }

    if (
      status === HelpPointStatus.CANCELLED ||
      status === HelpPointStatus.COMPLETED ||
      status === HelpPointStatus.PENDING
    ) {
      this.categoriesService.decrementHelpPointsCount(helpPoint.categoryId);
    }
  }

  async applyForHelp(helpPointId: string, userId: string): Promise<void> {
    try {
      const helpPoint = await this.findOne(helpPointId);

      const isAlreadyParticipant = helpPoint.participants.some(
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

      await this.helpPointModel
        .findByIdAndUpdate(helpPointId, {
          $push: { participants: participant },
        })
        .exec();

      // Send notification to helpPoint owner
      await this.notificationsService.addNotification({
        userIds: [helpPoint.ownerId],
        title: 'New Helper Application',
        message: `Someone wants to help with your help point: ${helpPoint.title}`,
        type: NotificationType.MARKER_APPLICATION,
        action: {
          type: 'helpPoint',
          id: helpPointId,
        },
      });
    } catch (error) {
      console.error('Error applying for help:', error);
      throw error;
    }
  }

  async removeFromHelp(helpPointId: string, userId: string): Promise<void> {
    try {
      const helpPoint = await this.findOne(helpPointId);

      const isParticipant = helpPoint.participants.some(
        (p) => p.userId === userId
      );

      if (!isParticipant) {
        throw new UnauthorizedException('User is not a participant');
      }

      await this.helpPointModel
        .findByIdAndUpdate(helpPointId, {
          $pull: { participants: { userId } },
        })
        .exec();
    } catch (error) {
      console.error('Error removing from help:', error);
      throw error;
    }
  }

  async updateParticipantStatus(
    helpPointId: string,
    participantId: string,
    status: 'accepted' | 'rejected'
  ): Promise<void> {
    const helpPoint = await this.findOne(helpPointId);

    await this.helpPointModel
      .updateOne(
        { _id: helpPointId, 'participants.userId': participantId },
        { $set: { 'participants.$.status': status } }
      )
      .exec();

    // Send notification to participant
    await this.notificationsService.addNotification({
      userIds: [participantId],
      title:
        status === 'accepted' ? 'Application Accepted' : 'Application Rejected',
      message: `Your application to help with "${helpPoint.title}" has been ${status}`,
      type: NotificationType.MARKER_STATUS_UPDATE,
      action: {
        type: 'helpPoint',
        id: helpPointId,
      },
    });
  }

  async getHelpPointsCount(userId: string): Promise<number> {
    return this.helpPointModel.countDocuments({ ownerId: userId }).exec();
  }
}
