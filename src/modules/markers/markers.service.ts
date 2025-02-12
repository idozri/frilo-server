/** @format */

import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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
import { AppMarker } from './types/app.marker';
import { MarkersAdapter } from './adapter/markers.adapter';
import { MongoUtils } from 'src/utils/mongodb.utils';

export interface FindAllParams {
  categoryId?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
}

@Injectable()
export class MarkersService {
  constructor(
    @InjectModel(Marker.name) private markerModel: Model<MarkerDocument>,
    private s3Service: S3Service,
    private categoriesService: CategoriesService,
    private markersAdapter: MarkersAdapter
  ) {
    // Ensure indexes are created
    this.markerModel.collection
      .createIndex({ location: '2dsphere' })
      .then(() => console.log('Geospatial index created'))
      .catch((err) => console.error('Error creating geospatial index:', err));
  }

  async create(
    userId: string,
    createMarkerDto: CreateMarkerDto
  ): Promise<ApiResponse<AppMarker>> {
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
    } catch (error) {
      console.error('Error creating marker:', error);
      return {
        isSuccess: false,
        message: 'Error creating marker',
        data: null,
      };
    }

    try {
      this.categoriesService.incrementMarkersCount(createMarkerDto.categoryId);
    } catch (error) {
      console.error('Error incrementing markers count:', error);
    }

    return {
      isSuccess: true,
      message: 'Marker created successfully',
      data: this.markersAdapter.mapMarkerToAppMarker(marker),
    };
  }

  async findAll(params?: FindAllParams): Promise<AppMarker[]> {
    const { categoryId, latitude, longitude, radius = 25000 } = params || {};

    let query: any = {};

    if (categoryId) {
      query.category = categoryId;
    }

    let aggregationPipeline: any[] = [];

    if (!latitude || !longitude) {
      return this.markersAdapter.mapMarkersToAppMarkers(
        await this.markerModel
          .find(query)
          .sort({ createdAt: -1 })
          .populate('category')
          .populate('owner')
          .exec()
      );
    }

    // Add geoNear stage for distance-based sorting
    aggregationPipeline.push({
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [Number(longitude), Number(latitude)],
        },
        distanceField: 'coordinates',
        spherical: true,
        maxDistance: Number(radius),
        query: query,
      },
    });

    // Add sort by date after distance
    aggregationPipeline.push({
      $sort: {
        distance: 1,
        createdAt: -1,
      },
    });

    // Add category population
    aggregationPipeline.push({
      $lookup: {
        from: 'categories',
        localField: 'categoryId',
        foreignField: '_id',
        as: 'category',
      },
    });

    // Unwind the category array
    aggregationPipeline.push({
      $unwind: {
        path: '$category',
        preserveNullAndEmptyArrays: true,
      },
    });

    // Add owner population
    aggregationPipeline.push({
      $lookup: {
        from: 'users',
        localField: 'ownerId',
        foreignField: '_id',
        as: 'owner',
      },
    });

    // Unwind the owner array
    aggregationPipeline.push({
      $unwind: {
        path: '$owner',
        preserveNullAndEmptyArrays: true,
      },
    });

    const markers = await this.markerModel
      .aggregate(aggregationPipeline)
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

  async changeStatus(markerId: string, status: MarkerStatus): Promise<void> {
    const marker = await this.markerModel.findById(markerId);

    if (status === MarkerStatus.ACTIVE) {
      this.categoriesService.incrementMarkersCount(marker.categoryId);
    }
    if (
      status === MarkerStatus.CANCELLED ||
      status === MarkerStatus.COMPLETED ||
      status === MarkerStatus.PENDING
    ) {
      this.categoriesService.decrementMarkersCount(marker.categoryId);
    }
    marker.status = status;

    await marker.save();
  }

  async applyForHelp(markerId: string, userId: string): Promise<void> {
    const marker = await this.findOne(markerId);

    const isAlreadyParticipant = marker.participants.some(
      (p) => p.userId === userId
    );

    if (isAlreadyParticipant) {
      throw new UnauthorizedException('User is already a participant');
    }

    const participant: Participant = {
      userId,
      status: 'pending',
      joinedAt: new Date().toISOString(),
    };

    await this.markerModel
      .findByIdAndUpdate(markerId, {
        $push: { participants: participant },
      })
      .exec();
  }

  async removeFromHelp(markerId: string, userId: string): Promise<void> {
    const marker = await this.findOne(markerId);

    const isParticipant = marker.participants.some((p) => p.userId === userId);

    if (!isParticipant) {
      throw new UnauthorizedException('User is not a participant');
    }

    await this.markerModel
      .findByIdAndUpdate(markerId, {
        $pull: { participants: { userId } },
      })
      .exec();
  }

  async updateParticipantStatus(
    markerId: string,
    participantId: string,
    status: 'accepted' | 'rejected',
    userId: string
  ): Promise<void> {
    const marker = await this.findOne(markerId);

    if (marker.ownerId.toString() !== userId) {
      throw new UnauthorizedException(
        'Only the owner can update participant status'
      );
    }

    await this.markerModel
      .updateOne(
        { _id: markerId, 'participants.userId': participantId },
        { $set: { 'participants.$.status': status } }
      )
      .exec();
  }

  async getMarkersCount(userId: string): Promise<number> {
    return this.markerModel.countDocuments({ ownerId: userId }).exec();
  }
}
