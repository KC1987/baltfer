// Mapbox utilities for geocoding and mapping services

interface Coordinates {
  latitude: number
  longitude: number
}

interface GeocodeResult {
  place_name: string
  center: [number, number] // [longitude, latitude]
  bbox?: [number, number, number, number] // [minX, minY, maxX, maxY]
  context?: Array<{
    id: string
    short_code?: string
    wikidata?: string
    text: string
  }>
}

interface MapboxGeocodingResponse {
  features: GeocodeResult[]
  query: string[]
}

interface RouteResponse {
  routes: Array<{
    distance: number // meters
    duration: number // seconds
    geometry: {
      coordinates: Array<[number, number]>
    }
  }>
}

class MapboxService {
  private accessToken: string

  constructor() {
    this.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || ''
    if (!this.accessToken) {
      console.warn('Mapbox access token not found. Some features may not work.')
    }
  }

  /**
   * Geocode a text query to get coordinates and place information
   */
  async geocode(query: string, options?: {
    country?: string
    bbox?: [number, number, number, number]
    proximity?: [number, number]
    types?: string[]
    limit?: number
  }): Promise<GeocodeResult[]> {
    if (!this.accessToken) {
      throw new Error('Mapbox access token is required')
    }

    const params = new URLSearchParams({
      access_token: this.accessToken,
      limit: (options?.limit || 5).toString(),
      ...(options?.country && { country: options.country }),
      ...(options?.bbox && { bbox: options.bbox.join(',') }),
      ...(options?.proximity && { proximity: options.proximity.join(',') }),
      ...(options?.types && { types: options.types.join(',') })
    })

    const encodedQuery = encodeURIComponent(query)
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json?${params}`

    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Mapbox geocoding failed: ${response.statusText}`)
      }

      const data: MapboxGeocodingResponse = await response.json()
      return data.features
    } catch (error) {
      console.error('Geocoding error:', error)
      throw error
    }
  }

  /**
   * Reverse geocode coordinates to get place information
   */
  async reverseGeocode(longitude: number, latitude: number, options?: {
    types?: string[]
    limit?: number
  }): Promise<GeocodeResult[]> {
    if (!this.accessToken) {
      throw new Error('Mapbox access token is required')
    }

    const params = new URLSearchParams({
      access_token: this.accessToken,
      limit: (options?.limit || 1).toString(),
      ...(options?.types && { types: options.types.join(',') })
    })

    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?${params}`

    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Mapbox reverse geocoding failed: ${response.statusText}`)
      }

      const data: MapboxGeocodingResponse = await response.json()
      return data.features
    } catch (error) {
      console.error('Reverse geocoding error:', error)
      throw error
    }
  }

  /**
   * Get driving directions between two points
   */
  async getDirections(
    start: Coordinates,
    end: Coordinates,
    options?: {
      profile?: 'driving' | 'walking' | 'cycling' | 'driving-traffic'
      alternatives?: boolean
      steps?: boolean
      geometries?: 'geojson' | 'polyline' | 'polyline6'
    }
  ): Promise<{
    distance: number // meters
    duration: number // seconds
    coordinates: Array<[number, number]>
  }> {
    if (!this.accessToken) {
      throw new Error('Mapbox access token is required')
    }

    const profile = options?.profile || 'driving'
    const coordinates = `${start.longitude},${start.latitude};${end.longitude},${end.latitude}`
    
    const params = new URLSearchParams({
      access_token: this.accessToken,
      alternatives: (options?.alternatives || false).toString(),
      steps: (options?.steps || false).toString(),
      geometries: options?.geometries || 'geojson'
    })

    const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${coordinates}?${params}`

    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Mapbox directions failed: ${response.statusText}`)
      }

      const data: RouteResponse = await response.json()
      
      if (!data.routes || data.routes.length === 0) {
        throw new Error('No routes found')
      }

      const route = data.routes[0]
      return {
        distance: route.distance,
        duration: route.duration,
        coordinates: route.geometry.coordinates
      }
    } catch (error) {
      console.error('Directions error:', error)
      throw error
    }
  }

  /**
   * Get distance between two points using Haversine formula (fallback)
   */
  getHaversineDistance(start: Coordinates, end: Coordinates): number {
    const R = 6371 // Earth's radius in kilometers
    const dLat = this.toRadians(end.latitude - start.latitude)
    const dLon = this.toRadians(end.longitude - start.longitude)
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(start.latitude)) * Math.cos(this.toRadians(end.latitude)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c // Distance in kilometers
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }

  /**
   * Format coordinates for display
   */
  formatCoordinates(coordinates: Coordinates, precision: number = 6): string {
    return `${coordinates.latitude.toFixed(precision)}, ${coordinates.longitude.toFixed(precision)}`
  }

  /**
   * Check if Mapbox is properly configured
   */
  isConfigured(): boolean {
    return !!this.accessToken
  }
}

// Create singleton instance
export const mapboxService = new MapboxService()

// Export types for use in components
export type { Coordinates, GeocodeResult }
export default mapboxService