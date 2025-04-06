import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import { join } from 'path';
import * as fs from 'fs';

// Load environment variables from .env file
dotenv.config({ path: join(__dirname, '../../.env') });

async function initializeAchievements() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  // Read achievements data
  const achievementsData = JSON.parse(
    fs.readFileSync(
      join(__dirname, '../../../client/assets/data/achievements.json'),
      'utf-8'
    )
  );

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db();
    const achievementsCollection = db.collection('achievements');
    const badgesCollection = db.collection('badges');

    // Initialize achievements
    for (const achievement of achievementsData.achievements) {
      const achievementDoc = {
        name: achievement.name,
        description: achievement.description,
        icon: achievement.icon,
        color: achievement.color,
        total: achievement.total,
        isHidden: false,
        code: achievement.id, // Using id as code
        type: achievement.type,
        rewards: achievement.rewards,
      };

      // Upsert the achievement
      await achievementsCollection.updateOne(
        { code: achievementDoc.code },
        { $set: achievementDoc },
        { upsert: true }
      );
    }

    // Initialize badges
    for (const badge of achievementsData.badges) {
      const badgeDoc = {
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        color: badge.color,
        code: badge.id,
        achievementId: badge.achievementId,
      };

      // Upsert the badge
      await badgesCollection.updateOne(
        { code: badgeDoc.code },
        { $set: badgeDoc },
        { upsert: true }
      );
    }

    console.log('Achievements and badges initialized successfully');
  } catch (error) {
    console.error('Error initializing achievements:', error);
  } finally {
    await client.close();
  }
}

initializeAchievements();
