/** @format */

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { S3Service } from '../s3/s3.service';
import { MongoUtils } from '../../utils/mongodb.utils';
import { AchievementsService } from '../achievements/achievements.service';
import { UserAchievement } from '../achievements/entities/achievement.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly s3Service: S3Service,
    private readonly achievementsService: AchievementsService
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    if (createUserDto.password) {
      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
      createUserDto.password = hashedPassword;
    }
    const createdUser = new this.userModel({
      ...createUserDto,
    });

    const user = await createdUser.save();

    // Create default achievements for the new user
    const achievements: UserAchievement[] = [];
    try {
      achievements.push(
        await this.achievementsService.updateAchievementProgress(
          user.id,
          'first_help_created',
          0
        )
      );
      achievements.push(
        await this.achievementsService.updateAchievementProgress(
          user.id,
          'first_help_done',
          0
        )
      );
    } catch (error) {
      console.error('Error creating default achievements:', error);
    }

    user.achievementIds = achievements.map((achievement) => achievement._id);
    return await user.save();
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userModel
      .findById(MongoUtils.toObjectId(id))
      .exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User> {
    return this.userModel.findOne({ email }).exec();
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    if (updateUserDto.avatarUrl && user.avatarUrl) {
      const oldAvatarKey = this.extractKeyFromUrl(user.avatarUrl);
      await this.s3Service.deleteFile(oldAvatarKey);
    }

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    const updatedUser = await this.userModel
      .findByIdAndUpdate(MongoUtils.toObjectId(id), updateUserDto, {
        new: true,
      })
      .exec();

    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return updatedUser;
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    if (user.avatarUrl) {
      const avatarKey = this.extractKeyFromUrl(user.avatarUrl);
      await this.s3Service.deleteFile(avatarKey);
    }
    const result = await this.userModel
      .deleteOne({ _id: MongoUtils.toObjectId(id) })
      .exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }

  async findByPhoneNumber(phoneNumber: string): Promise<User | null> {
    const user = await this.userModel
      .findOne({ phoneNumber })
      // .populate('achievements')
      .populate('badges');
    if (user) {
      return user;
    }
    return null;
  }

  private extractKeyFromUrl(url: string): string {
    const urlParts = url.split('/');
    return urlParts.slice(3).join('/'); // Remove protocol and bucket name
  }

  async findOrCreate(userData: { id: string; email: string; name?: string }) {
    let user = await this.userModel.findOne({ _id: userData.id });

    if (!user) {
      user = await this.userModel.create({
        _id: userData.id,
        // email: userData.email,
        name: userData.name,
      });
    }

    return user;
  }

  async findOrCreateByPhone(
    phoneNumber: string,
    userData?: {
      name?: string;
      agreedToTerms?: boolean;
      email?: string;
    }
  ): Promise<User> {
    // Remove any non-digit characters and ensure consistent format
    const normalizedPhoneNumber = phoneNumber.replace(/\D/g, '');

    let user = await this.findByPhoneNumber(normalizedPhoneNumber);

    if (!user) {
      user = await this.create({
        phoneNumber: normalizedPhoneNumber,
        name: userData.name,
        agreedToTerms: userData?.agreedToTerms || false,
      });
    } else {
      // Update user data if provided
      if (userData) {
        user.name = userData.name || user.name;
        user.agreedToTerms = userData.agreedToTerms || user.agreedToTerms;
        user.email = userData.email || user.email;
        user = await this.update(user._id.toString(), user);
      }
    }

    return user;
  }
}
