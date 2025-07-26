'use client'

import { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapIcon, Navigation, Clock } from 'lucide-react'
import { mapboxService } from '@/lib/mapbox'

interface LocationData {
  address: string
  latitude: number
  longitude: number
}

interface RouteMapProps {
  pickup: LocationData | null
  destination: LocationData | null
  className?: string
  height?: string
}

export function RouteMap({ pickup, destination, className, height = '300px' }: RouteMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<any>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [routeInfo, setRouteInfo] = useState<{
    distance: number
    duration: number
  } | null>(null)

  useEffect(() => {
    // Check if Mapbox is configured
    if (!mapboxService.isConfigured()) {
      return
    }

    // Initialize map
    const initializeMap = async () => {
      if (!mapContainer.current || map.current) return

      try {
        // Dynamic import to avoid SSR issues
        const mapboxgl = await import('mapbox-gl')
        
        mapboxgl.default.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || ''

        map.current = new mapboxgl.default.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [24.1052, 56.9496], // Baltic region center
          zoom: 6
        })

        map.current.on('load', () => {
          setMapLoaded(true)
        })

        // Add navigation controls
        map.current.addControl(new mapboxgl.default.NavigationControl(), 'top-right')

      } catch (error) {
        console.error('Error initializing map:', error)
      }
    }

    initializeMap()

    // Cleanup
    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!mapLoaded || !map.current || !pickup || !destination) {
      return
    }

    const displayRoute = async () => {
      try {
        // Get route from Mapbox Directions API
        const route = await mapboxService.getDirections(
          { latitude: pickup.latitude, longitude: pickup.longitude },
          { latitude: destination.latitude, longitude: destination.longitude }
        )

        // Update route info
        setRouteInfo({
          distance: route.distance / 1000, // Convert to km
          duration: route.duration / 60    // Convert to minutes
        })

        // Clear existing route
        if (map.current.getSource('route')) {
          map.current.removeLayer('route')
          map.current.removeSource('route')
        }

        // Clear existing markers
        const markers = document.querySelectorAll('.mapboxgl-marker')
        markers.forEach(marker => marker.remove())

        // Add route to map
        map.current.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: route.coordinates
            }
          }
        })

        map.current.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#3b82f6',
            'line-width': 5,
            'line-opacity': 0.8
          }
        })

        // Add markers
        const mapboxgl = await import('mapbox-gl')
        
        // Pickup marker
        const pickupMarker = new mapboxgl.default.Marker({ color: '#22c55e' })
          .setLngLat([pickup.longitude, pickup.latitude])
          .setPopup(new mapboxgl.default.Popup().setHTML(`
            <div class="p-2">
              <strong>Pickup</strong><br/>
              ${pickup.address}
            </div>
          `))
          .addTo(map.current)

        // Destination marker
        const destinationMarker = new mapboxgl.default.Marker({ color: '#ef4444' })
          .setLngLat([destination.longitude, destination.latitude])
          .setPopup(new mapboxgl.default.Popup().setHTML(`
            <div class="p-2">
              <strong>Destination</strong><br/>
              ${destination.address}
            </div>
          `))
          .addTo(map.current)

        // Fit map to route bounds
        const bounds = new mapboxgl.default.LngLatBounds()
        route.coordinates.forEach(coord => bounds.extend(coord))
        map.current.fitBounds(bounds, { padding: 50 })

      } catch (error) {
        console.error('Error displaying route:', error)
      }
    }

    displayRoute()
  }, [mapLoaded, pickup, destination])

  if (!mapboxService.isConfigured()) {
    return (
      <Card className={`bg-white border-slate-200 shadow-lg ${className || ''}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapIcon className="h-5 w-5" />
            Route Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-8">
            <MapIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Map requires Mapbox configuration
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`bg-white border-slate-200 shadow-lg ${className || ''}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapIcon className="h-5 w-5" />
              Route Map
            </CardTitle>
            <CardDescription>
              Visual route overview with distance and time
            </CardDescription>
          </div>
          {routeInfo && (
            <div className="flex gap-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Navigation className="h-3 w-3" />
                {routeInfo.distance.toFixed(1)} km
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {Math.round(routeInfo.duration)} min
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div 
          ref={mapContainer} 
          className="w-full rounded-lg overflow-hidden border"
          style={{ height }}
        />
        
        {pickup && destination && (
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full mt-1 flex-shrink-0"></div>
              <div>
                <div className="font-medium">Pickup</div>
                <div className="text-muted-foreground">
                  {pickup.address.length > 40 ? pickup.address.substring(0, 40) + '...' : pickup.address}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full mt-1 flex-shrink-0"></div>
              <div>
                <div className="font-medium">Destination</div>
                <div className="text-muted-foreground">
                  {destination.address.length > 40 ? destination.address.substring(0, 40) + '...' : destination.address}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}