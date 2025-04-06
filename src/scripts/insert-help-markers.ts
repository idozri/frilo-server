import { connect, disconnect, model } from 'mongoose';
import { config } from 'dotenv';
import { faker } from '@faker-js/faker';
import {
  Marker,
  MarkerSchema,
  MarkerStatus,
  MarkerPriority,
} from '../modules/markers/entities/marker.entity';
import {
  Category,
  CategorySchema,
} from '../modules/categories/entities/category.entity';
import { Document } from 'mongoose';

// Load environment variables
config();

const OWNER_ID = '67b3897ab07dd2ac35f41f6a';
const TOTAL_MARKERS = 100;

const generateMarker = (categories: (Category & Document)[]) => {
  // Generate random coordinates centered around Tel Aviv within a reasonable radius
  // Tel Aviv coordinates: 32.0677246, 34.8060577
  const radius = 0.15; // Approximately 15km radius
  const lat = faker.location.latitude({
    min: 32.0677246 - radius,
    max: 32.0677246 + radius,
  });
  const lng = faker.location.longitude({
    min: 34.8060577 - radius,
    max: 34.8060577 + radius,
  });

  const helpCategories = categories.filter((cat) =>
    [
      'food',
      'shelter',
      'medical',
      'transport',
      'companionship',
      'education',
    ].includes(cat.type)
  );

  return {
    title:
      faker.helpers.arrayElement([
        'Need help with groceries',
        'Elder care assistance needed',
        'Looking for volunteers',
        'Community support required',
        'Emergency assistance needed',
        'Help with home maintenance',
        'Medical transport needed',
        'Food delivery assistance',
        'Cleaning help needed',
        'Moving assistance required',
      ]) +
      ' ' +
      faker.location.streetAddress(),
    description: faker.lorem.paragraph(),
    participants: [],
    images: [],
    location: {
      type: 'Point',
      coordinates: [lng, lat], // MongoDB uses [longitude, latitude]
    },
    address: faker.location.streetAddress(true),
    locationDescription: faker.lorem.sentence(),
    categoryId: faker.helpers.arrayElement(helpCategories).id,
    ownerId: OWNER_ID,
    priority: faker.helpers.arrayElement(Object.values(MarkerPriority)),
    rating: 0,
    reviewCount: 0,
    status: MarkerStatus.ACTIVE,
    isFavorited: false,
    verified: false,
    contactPhone: faker.phone.number({ style: 'international' }),
    visitCount: 0,
    isActive: true,
    createdAt: faker.date.recent({ days: 30 }),
    updatedAt: faker.date.recent({ days: 30 }),
  };
};

async function insertMarkers() {
  try {
    // Connect to MongoDB
    await connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get categories from database
    const CategoryModel = model<Category>('Category', CategorySchema);
    const categories = await CategoryModel.find({ isActive: true });

    if (categories.length === 0) {
      throw new Error('No categories found in database');
    }

    console.log(`Found ${categories.length} categories`);

    const MarkerModel = model<Marker>('Marker', MarkerSchema);
    const markers = Array.from({ length: TOTAL_MARKERS }, () =>
      generateMarker(categories)
    );

    // Insert markers in batches of 100
    const batchSize = 100;
    for (let i = 0; i < markers.length; i += batchSize) {
      const batch = markers.slice(i, i + batchSize);
      await MarkerModel.create(batch);
      console.log(
        `Inserted markers ${i + 1} to ${Math.min(i + batchSize, TOTAL_MARKERS)}`
      );
    }

    console.log(`Successfully inserted ${TOTAL_MARKERS} markers`);
  } catch (error) {
    console.error('Error inserting markers:', error);
  } finally {
    await disconnect();
    console.log('Disconnected from MongoDB');
  }
}

insertMarkers();
