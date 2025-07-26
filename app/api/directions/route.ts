import { NextRequest, NextResponse } from 'next/server'
import { mapboxService } from '@/lib/mapbox'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { pickup, destination } = body

    if (!pickup || !destination) {
      return NextResponse.json(
        { error: 'Pickup and destination coordinates are required' },
        { status: 400 }
      )
    }

    if (!pickup.latitude || !pickup.longitude || !destination.latitude || !destination.longitude) {
      return NextResponse.json(
        { error: 'Invalid coordinates provided' },
        { status: 400 }
      )
    }

    // Get directions from Mapbox
    const route = await mapboxService.getDirections(
      { latitude: pickup.latitude, longitude: pickup.longitude },
      { latitude: destination.latitude, longitude: destination.longitude },
      { profile: 'driving' }
    )

    return NextResponse.json({
      distance: route.distance, // meters
      duration: route.duration, // seconds
      distance_km: route.distance / 1000, // kilometers
      duration_minutes: route.duration / 60, // minutes
      coordinates: route.coordinates
    })
  } catch (error: any) {
    console.error('Error calculating route:', error)
    
    // If Mapbox fails, try to calculate Haversine distance as fallback
    try {
      const body = await request.json()
      const { pickup, destination } = body
      
      const fallbackDistance = mapboxService.getHaversineDistance(
        { latitude: pickup.latitude, longitude: pickup.longitude },
        { latitude: destination.latitude, longitude: destination.longitude }
      )
      
      return NextResponse.json({
        distance: fallbackDistance * 1000, // Convert km to meters
        duration: fallbackDistance * 120, // Rough estimate: 2 minutes per km
        distance_km: fallbackDistance,
        duration_minutes: fallbackDistance * 2,
        coordinates: [
          [pickup.longitude, pickup.latitude],
          [destination.longitude, destination.latitude]
        ],
        fallback: true
      })
    } catch (fallbackError) {
      return NextResponse.json(
        { error: 'Failed to calculate route distance' },
        { status: 500 }
      )
    }
  }
}