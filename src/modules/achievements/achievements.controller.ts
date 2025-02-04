/** @format */

import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { AchievementsService } from './achievements.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../auth/decorators/user.decorator';

@Controller('achievements')
@UseGuards(JwtAuthGuard)
export class AchievementsController {
  constructor(private readonly achievementsService: AchievementsService) {}

  @Get()
  getAchievements() {
    return this.achievementsService.getAchievements();
  }

  @Get('user')
  getUserAchievements(@User('id') userId: string) {
    return this.achievementsService.getUserAchievements(userId);
  }

  @Get('user/summary')
  getUserAchievementsSummary(@User('id') userId: string) {
    return this.achievementsService.getUserAchievementsSummary(userId);
  }

  @Post(':achievementId/progress')
  updateProgress(
    @User('id') userId: string,
    @Param('achievementId') achievementId: string,
    @Body('progress') progress: number
  ) {
    return this.achievementsService.updateAchievementProgress(
      userId,
      achievementId,
      progress
    );
  }

  @Post('check')
  checkAchievements(@User('id') userId: string) {
    return this.achievementsService.checkAchievementProgress(userId);
  }
}
