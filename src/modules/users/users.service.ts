/** @format */

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { S3Service } from '../s3/s3.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly s3Service: S3Service
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const createdUser = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
    });
    return createdUser.save();
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userModel.findById(id).exec();
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
      .findByIdAndUpdate(id, updateUserDto, { new: true })
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
    const result = await this.userModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.findByEmail(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      return user;
    }
    return null;
  }

  private extractKeyFromUrl(url: string): string {
    const urlParts = url.split('/');
    return urlParts.slice(3).join('/'); // Remove protocol and bucket name
  }

  async findOrCreate(userData: {
    id: string;
    email: string;
    displayName?: string;
  }) {
    let user = await this.userModel.findOne({ _id: userData.id });

    if (!user) {
      user = await this.userModel.create({
        _id: userData.id,
        // email: userData.email,
        displayName: userData.displayName,
      });
    }

    return user;
  }

  async findOrCreateByPhone(
    phoneNumber: string,
    userData?: {
      name?: string;
      agreedToTerms?: boolean;
    }
  ): Promise<User> {
    let user = await this.userModel.findOne({ phoneNumber });

    if (!user) {
      user = await this.userModel.create({
        _id: new Date().getTime().toString(), // Generate a unique ID
        phoneNumber,
        name: userData?.name,
        isPhoneVerified: true,
        agreedToTerms: userData?.agreedToTerms || false,
        onboardingProgress: {
          welcomeScreenSeen: false,
          phoneVerified: true,
          safetyGuidelinesAccepted: userData?.agreedToTerms || false,
          tutorialCompleted: false,
        },
      });
    } else {
      // Update user data if provided
      if (userData) {
        user.name = userData.name || user.name;
        user.agreedToTerms = userData.agreedToTerms || user.agreedToTerms;
        user.onboardingProgress = {
          ...user.onboardingProgress,
          safetyGuidelinesAccepted:
            userData.agreedToTerms ||
            user.onboardingProgress.safetyGuidelinesAccepted,
        };
        await user.save();
      }
    }

    return user;
  }
}
