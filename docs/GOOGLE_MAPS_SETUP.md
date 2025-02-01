<!-- @format -->

# Google Maps Integration Guide

## Overview

The Google Maps integration provides essential location-based features:

- Geocoding (address to coordinates)
- Reverse geocoding (coordinates to address)
- Place autocomplete
- Place details
- Distance calculations

## Setup Steps

1. **Create Google Cloud Project**

   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable the following APIs:
     - Maps JavaScript API
     - Places API
     - Geocoding API
     - Distance Matrix API

2. **Get API Key**

   - In Google Cloud Console, go to "Credentials"
   - Click "Create Credentials" > "API Key"
   - Restrict the key to your domains and required APIs
   - Copy the API key

3. **Configure Environment Variables**
   ```env
   GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   ```

## Usage Examples

### Geocoding

```typescript
// Convert address to coordinates
const results = await googleMapsService.geocode(
  '1600 Amphitheatre Parkway, Mountain View, CA'
);
const { lat, lng } = results[0].geometry.location;

// Convert coordinates to address
const address = await googleMapsService.reverseGeocode(
  37.4224764,
  -122.0842499
);
```

### Place Autocomplete

```typescript
// Get place suggestions
const predictions =
  await googleMapsService.getPlaceAutocomplete('Amphitheatre Park');

// Get detailed place information
const placeDetails = await googleMapsService.getPlaceDetails(
  predictions[0].place_id
);
```

### Distance Calculation

```typescript
// Calculate distance between two points
const distance = googleMapsService.calculateDistance(
  37.4224764, // lat1
  -122.0842499, // lng1
  37.4219999, // lat2
  -122.0840575 // lng2
);
```

## API Reference

### `geocode(address: string)`

Converts a text address into geographic coordinates.

**Parameters:**

- `address`: Full or partial address string

**Returns:**

- Array of matching locations with coordinates and metadata

### `reverseGeocode(lat: number, lng: number)`

Converts geographic coordinates into a human-readable address.

**Parameters:**

- `lat`: Latitude
- `lng`: Longitude

**Returns:**

- Array of matching addresses with metadata

### `getPlaceAutocomplete(input: string)`

Provides place suggestions as user types.

**Parameters:**

- `input`: Partial place name or address

**Returns:**

- Array of place predictions with IDs and descriptions

### `getPlaceDetails(placeId: string)`

Gets detailed information about a specific place.

**Parameters:**

- `placeId`: Google Place ID

**Returns:**

- Detailed place information including address, coordinates, etc.

### `calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number)`

Calculates the distance between two points using the Haversine formula.

**Parameters:**

- `lat1`, `lon1`: Coordinates of first point
- `lat2`, `lon2`: Coordinates of second point

**Returns:**

- Distance in kilometers

## Security Considerations

1. **API Key Protection**

   - Restrict API key by IP/domain
   - Set usage quotas
   - Monitor usage in Google Cloud Console
   - Never expose key in client-side code

2. **Request Validation**
   - Validate coordinates before API calls
   - Implement rate limiting
   - Handle API errors gracefully

## Best Practices

1. **Performance**

   - Cache frequently requested places
   - Implement debouncing for autocomplete
   - Use bounds to limit search area

2. **Error Handling**

   - Handle API quotas and limits
   - Provide fallback for failed requests
   - Log API errors for monitoring

3. **User Experience**
   - Implement progressive loading
   - Show loading states during API calls
   - Provide clear error messages

## Troubleshooting

1. **Invalid API Key**

   - Verify key in environment variables
   - Check API restrictions
   - Ensure APIs are enabled

2. **No Results**

   - Check input format
   - Verify coordinate ranges
   - Check API quotas

3. **Rate Limiting**
   - Implement caching
   - Add request queuing
   - Optimize API usage
