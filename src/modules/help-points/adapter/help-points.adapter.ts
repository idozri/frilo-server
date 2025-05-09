import { AppHelpPoint } from '../types/app-help-point';
import { HelpPoint } from '../entities/help-point.entity';

export class HelpPointsAdapter {
  mapHelpPointToAppHelpPoint(helpPoint: HelpPoint): AppHelpPoint {
    const helpPointResponse: AppHelpPoint = {
      id: helpPoint._id.toString(),
      title: helpPoint.title,
      description: helpPoint.description,
      category: {
        _id: helpPoint.categoryId,
        name: helpPoint.category?.name || '',
        icon: helpPoint.category?.icon || '',
        description: helpPoint.category?.description || '',
        color: helpPoint.category?.color || '',
        type: helpPoint.category?.type || '',
        helpPointsCount: helpPoint.category?.helpPointsCount || 0,
      },
      owner: {
        id: helpPoint.ownerId,
        name: helpPoint.owner?.name || '',
      },
      priority: helpPoint.priority,
      status: helpPoint.status,
      participants: helpPoint.participants,
      images: helpPoint.images,
      rating: helpPoint.rating,
      reviewCount: helpPoint.reviewCount,
      visitCount: helpPoint.visitCount,
      isFavorited: helpPoint.isFavorited,
      isActive: helpPoint.isActive,
      verified: helpPoint.verified,
      contactPhone: helpPoint.contactPhone,
      location: {
        latitude: helpPoint.location.coordinates[1],
        longitude: helpPoint.location.coordinates[0],
        address: helpPoint.address,
        description: helpPoint.locationDescription,
      },
      createdAt: helpPoint.createdAt,
      updatedAt: helpPoint.updatedAt,
    };

    return helpPointResponse;
  }

  mapHelpPointsToAppHelpPoints(helpPoints: HelpPoint[]): AppHelpPoint[] {
    return helpPoints.map((helpPoint) =>
      this.mapHelpPointToAppHelpPoint(helpPoint)
    );
  }
}
