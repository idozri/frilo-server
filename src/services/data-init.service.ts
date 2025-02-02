/** @format */

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category } from '../modules/categories/entities/category.entity';
import {
  Achievement,
  Badge,
} from '../modules/achievements/entities/achievement.entity';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DataInitService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<Category>,
    @InjectModel(Achievement.name) private achievementModel: Model<Achievement>,
    @InjectModel(Badge.name) private badgeModel: Model<Badge>
  ) {}

  async initializeData() {
    const shouldInitCategories = process.env.INITIALIZE_CATEGORIES === 'true';
    const shouldInitAchievements =
      process.env.INITIALIZE_ACHIEVEMENTS === 'true';
    const shouldInitBadges = process.env.INITIALIZE_BADGES === 'true';

    if (shouldInitCategories) {
      await this.initializeCategories();
    }

    if (shouldInitAchievements) {
      await this.initializeAchievements();
    }

    if (shouldInitBadges) {
      await this.initializeBadges();
    }
  }

  private async initializeCategories() {
    try {
      console.log('Initializing categories');
      const categoriesData = JSON.parse(
        fs.readFileSync(
          path.resolve(process.cwd(), 'src/assetes/categories.json'),
          'utf8'
        )
      );

      // Drop the collection to remove any indexes
      await this.categoryModel.collection.drop().catch(() => {
        // Ignore error if collection doesn't exist
        console.log('Collection does not exist, proceeding with creation');
      });

      // Create the collection with proper schema
      await this.categoryModel.createCollection();

      // Insert the categories
      await this.categoryModel.insertMany(
        categoriesData.categories.map((category: any) => ({
          name: category.name,
          icon: category.icon,
          color: category.color,
          description: category.description,
          type: category.type,
          markersCount: 0,
          isActive: true,
        }))
      );

      console.log('Categories initialized successfully');
    } catch (error) {
      console.error('Error initializing categories:', error);
    }
  }

  private async initializeAchievements() {
    try {
      console.log('Initializing achievements');
      const achievementsData = JSON.parse(
        fs.readFileSync(
          path.resolve(process.cwd(), 'src/assetes/achievements.json'),
          'utf8'
        )
      );

      await this.achievementModel.deleteMany({}); // Clear existing achievements
      const createdAchievements = await this.achievementModel.insertMany(
        achievementsData.achievements
      );
      console.log('Achievements initialized successfully');
      return createdAchievements;
    } catch (error) {
      console.error('Error initializing achievements:', error);
      return [];
    }
  }

  private async initializeBadges() {
    try {
      console.log('Initializing badges');
      const badgesData = JSON.parse(
        fs.readFileSync(
          path.resolve(process.cwd(), 'src/assetes/badges.json'),
          'utf8'
        )
      );
      const achievements = await this.achievementModel.find().exec();
      const achievementsData = achievements.map((achievement) => ({
        name: achievement.name,
        id: achievement._id,
      }));

      // Map achievement names to their IDs
      const achievementMap = new Map(
        achievements.map((achievement) => [achievement.name, achievement._id])
      );

      // Add achievementId to each badge
      const badgesWithAchievements = badgesData.badges.map((badge) => {
        const achievementId = achievementMap.get(
          badge.name.replace(' Badge', '')
        );
        if (!achievementId) {
          console.error(`Achievement not found for badge: ${badge.name}`);
          return null;
        }
        return {
          ...badge,
          achievementId: achievementId,
        };
      });

      await this.badgeModel.deleteMany({}); // Clear existing badges
      await this.badgeModel.insertMany(badgesWithAchievements);
      console.log('Badges initialized successfully');
    } catch (error) {
      console.error('Error initializing badges:', error);
    }
  }
}
