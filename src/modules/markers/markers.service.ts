/** @format */

import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Marker, MarkerDocument, Participant } from './entities/marker.entity';
import { CreateMarkerDto } from './dto/create-marker.dto';
import { UpdateMarkerDto } from './dto/update-marker.dto';
import { UsersService } from '../users/users.service';
import { S3Service } from '../s3/s3.service';
import { CategoriesService } from '../categories/categories.service';

@Injectable()
export class MarkersService {
  constructor(
    @InjectModel(Marker.name) private markerModel: Model<MarkerDocument>,
    private usersService: UsersService,
    private s3Service: S3Service,
    private categoriesService: CategoriesService
  ) {}

  async create(
    userId: string,
    createMarkerDto: CreateMarkerDto
  ): Promise<Marker> {
    console.log('createMarkerDto', createMarkerDto);

    const marker = new this.markerModel({
      ...createMarkerDto,
      category: createMarkerDto.categoryId,
      ownerId: userId,
      participants: [],
      rating: 0,
      reviewCount: 0,
      visitCount: 0,
      isFavorited: false,
    });

    let populatedMarker: Marker;
    try {
      await marker.save();
      populatedMarker = await marker.populate('category');
    } catch (error) {
      console.error('Error creating marker:', error);
    }
    try {
      await this.categoriesService.incrementMarkersCount(
        createMarkerDto.categoryId
      );
    } catch (error) {
      console.error('Error incrementing markers count:', error);
    }

    return populatedMarker;
  }

  async findAll(categoryId?: string): Promise<Marker[]> {
    const query = categoryId ? { category: categoryId } : {};

    const markers = await this.markerModel
      .find(query)
      .populate('category')
      .exec();

    console.log(
      'Markers with populated category:',
      JSON.stringify(markers, null, 2)
    );
    return markers;
  }

  async findOne(id: string): Promise<Marker> {
    const marker = await this.markerModel
      .findById(id)
      .populate('category')
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
  ): Promise<Marker> {
    const marker = await this.findOne(id);

    if (marker.ownerId !== userId) {
      throw new UnauthorizedException('Only the owner can update this marker');
    }

    return this.markerModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
  }

  async remove(id: string, userId: string): Promise<void> {
    const marker = await this.findOne(id);

    if (marker.ownerId !== userId) {
      throw new UnauthorizedException('Only the owner can delete this marker');
    }

    if (marker.imageUrl) {
      const key = this.extractKeyFromUrl(marker.imageUrl);
      await this.s3Service.deleteFile(key);
    }

    await this.markerModel.findByIdAndDelete(id).exec();
  }

  private extractKeyFromUrl(url: string): string {
    const urlParts = url.split('/');
    return urlParts.slice(3).join('/'); // Remove protocol and bucket name
  }

  async getUserMarkers(userId: string): Promise<Marker[]> {
    return this.markerModel
      .find({ ownerId: userId })
      .sort({ createdAt: -1 })
      .exec();
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

    if (marker.ownerId !== userId) {
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
