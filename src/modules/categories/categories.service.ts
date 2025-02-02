/** @format */

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category, CategoryDocument } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const category = new this.categoryModel(createCategoryDto);
    return category.save();
  }

  async findAll(): Promise<Category[]> {
    return this.categoryModel.find({ isActive: true }).sort({ name: 1 }).exec();
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoryModel.findById(id).exec();
    if (!category) {
      throw new NotFoundException(`Category #${id} not found`);
    }
    return category;
  }

  async update(id: string, updateData: Partial<Category>): Promise<Category> {
    const category = await this.categoryModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
    if (!category) {
      throw new NotFoundException(`Category #${id} not found`);
    }
    return category;
  }

  async remove(id: string): Promise<void> {
    const result = await this.categoryModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Category #${id} not found`);
    }
  }

  async incrementMarkersCount(id: string): Promise<void> {
    await this.categoryModel
      .findByIdAndUpdate(id, { $inc: { markersCount: 1 } })
      .exec();
  }

  async decrementMarkersCount(id: string): Promise<void> {
    await this.categoryModel
      .findByIdAndUpdate(id, { $inc: { markersCount: -1 } })
      .exec();
  }

  async initializeDefaultCategories(): Promise<void> {
    const defaultCategories = [
      {
        name: 'Moving Help',
        icon: 'truck',
        color: '#FF5733',
        type: 'moving',
        description: 'Help with moving and transportation',
      },
      {
        name: 'Elderly Care',
        icon: 'heart',
        color: '#33FF57',
        type: 'care',
        description: 'Assistance for elderly people',
      },
      {
        name: 'Pet Care',
        icon: 'paw',
        color: '#3357FF',
        type: 'pets',
        description: 'Help with pets and animal care',
      },
      {
        name: 'Home Repair',
        icon: 'tools',
        color: '#FF33F6',
        type: 'repair',
        description: 'Assistance with home repairs and maintenance',
      },
      {
        name: 'Education',
        icon: 'book',
        color: '#33FFF6',
        type: 'education',
        description: 'Educational support and tutoring',
      },
    ];

    await this.categoryModel.deleteMany({});
    await this.categoryModel.insertMany(defaultCategories);
  }
}
