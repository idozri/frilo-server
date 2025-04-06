import { AppMarker } from '../types/app.marker';
import { Marker } from '../entities/marker.entity';

export class MarkersAdapter {
  mapMarkerToAppMarker(marker: Marker): AppMarker {
    const markerResponse: AppMarker = {
      id: marker._id.toString(),
      title: marker.title,
      description: marker.description,
      category: {
        _id: marker.categoryId,
        name: marker.category?.name || '',
        icon: marker.category?.icon || '',
        description: marker.category?.description || '',
        color: marker.category?.color || '',
        type: marker.category?.type || '',
        markersCount: marker.category?.markersCount || 0,
      },
      owner: {
        id: marker.ownerId,
        name: marker.owner?.name || '',
      },
      priority: marker.priority,
      status: marker.status,
      participants: marker.participants,
      images: marker.images,
      rating: marker.rating,
      reviewCount: marker.reviewCount,
      visitCount: marker.visitCount,
      isFavorited: marker.isFavorited,
      isActive: marker.isActive,
      verified: marker.verified,
      contactPhone: marker.contactPhone,
      location: {
        latitude: marker.location.coordinates[1],
        longitude: marker.location.coordinates[0],
        address: marker.address,
        description: marker.locationDescription,
      },
      createdAt: marker.createdAt,
      updatedAt: marker.updatedAt,
    };

    return markerResponse;
  }

  mapMarkersToAppMarkers(markers: Marker[]): AppMarker[] {
    return markers.map((marker) => this.mapMarkerToAppMarker(marker));
  }
}
