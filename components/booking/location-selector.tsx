'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MapPin, Navigation } from 'lucide-react'

interface Location {
  id: string
  name: string
  address: string
  latitude: number
  longitude: number
  type: string
}

interface LocationData {
  address: string
  latitude: number
  longitude: number
  locationId?: string
}

interface LocationSelectorProps {
  pickup: LocationData | null
  destination: LocationData | null
  onPickupChange: (location: LocationData) => void
  onDestinationChange: (location: LocationData) => void
}

export function LocationSelector({ 
  pickup, 
  destination, 
  onPickupChange, 
  onDestinationChange 
}: LocationSelectorProps) {
  const [popularLocations, setPopularLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [pickupInput, setPickupInput] = useState(pickup?.address || '')
  const [destinationInput, setDestinationInput] = useState(destination?.address || '')
  
  const supabase = createClient()

  const fetchPopularLocations = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setPopularLocations(data || [])
    } catch (error) {
      console.error('Error fetching locations:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const handlePopularLocationSelect = (location: Location, type: 'pickup' | 'destination') => {
    const locationData: LocationData = {
      address: location.address,
      latitude: location.latitude,
      longitude: location.longitude,
      locationId: location.id
    }

    if (type === 'pickup') {
      setPickupInput(location.address)
      onPickupChange(locationData)
    } else {
      setDestinationInput(location.address)
      onDestinationChange(locationData)
    }
  }

  const handleAddressInput = (address: string, type: 'pickup' | 'destination') => {
    if (type === 'pickup') {
      setPickupInput(address)
      // For now, we'll use a simple geocoding simulation
      // In a real app, you'd integrate with Google Places API
      if (address.trim()) {
        onPickupChange({
          address,
          latitude: 39.2904, // Baltimore default
          longitude: -76.6122
        })
      }
    } else {
      setDestinationInput(address)
      if (address.trim()) {
        onDestinationChange({
          address,
          latitude: 39.2904,
          longitude: -76.6122
        })
      }
    }
  }

  const swapLocations = () => {
    const tempPickup = pickup
    const tempDestination = destination
    const tempPickupInput = pickupInput
    const tempDestinationInput = destinationInput

    if (tempDestination) {
      setPickupInput(tempDestinationInput)
      onPickupChange(tempDestination)
    }
    
    if (tempPickup) {
      setDestinationInput(tempPickupInput)
      onDestinationChange(tempPickup)
    }
  }

  useEffect(() => {
    fetchPopularLocations()
  }, [fetchPopularLocations])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Select Locations
        </CardTitle>
        <CardDescription>
          Choose your pickup and destination points
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Pickup Location */}
        <div className="space-y-3">
          <Label htmlFor="pickup" className="text-sm font-medium">
            Pickup Location
          </Label>
          <Input
            id="pickup"
            placeholder="Enter pickup address"
            value={pickupInput}
            onChange={(e) => handleAddressInput(e.target.value, 'pickup')}
          />
          
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Popular Pickup Locations:</Label>
            <div className="grid grid-cols-1 gap-2">
              {loading ? (
                <div className="animate-pulse space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-8 bg-gray-200 rounded"></div>
                  ))}
                </div>
              ) : (
                popularLocations.map((location) => (
                  <Button
                    key={location.id}
                    variant="outline"
                    size="sm"
                    className="justify-start h-auto p-3"
                    onClick={() => handlePopularLocationSelect(location, 'pickup')}
                  >
                    <div className="text-left">
                      <div className="font-medium text-sm">{location.name}</div>
                      <div className="text-xs text-muted-foreground">{location.address}</div>
                    </div>
                  </Button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={swapLocations}
            disabled={!pickup || !destination}
          >
            <Navigation className="h-4 w-4 mr-2" />
            Swap
          </Button>
        </div>

        {/* Destination Location */}
        <div className="space-y-3">
          <Label htmlFor="destination" className="text-sm font-medium">
            Destination
          </Label>
          <Input
            id="destination"
            placeholder="Enter destination address"
            value={destinationInput}
            onChange={(e) => handleAddressInput(e.target.value, 'destination')}
          />
          
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Popular Destinations:</Label>
            <div className="grid grid-cols-1 gap-2">
              {loading ? (
                <div className="animate-pulse space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-8 bg-gray-200 rounded"></div>
                  ))}
                </div>
              ) : (
                popularLocations.map((location) => (
                  <Button
                    key={location.id}
                    variant="outline"
                    size="sm"
                    className="justify-start h-auto p-3"
                    onClick={() => handlePopularLocationSelect(location, 'destination')}
                  >
                    <div className="text-left">
                      <div className="font-medium text-sm">{location.name}</div>
                      <div className="text-xs text-muted-foreground">{location.address}</div>
                    </div>
                  </Button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Distance Display */}
        {pickup && destination && (
          <div className="bg-muted p-3 rounded-lg">
            <div className="text-sm">
              <div className="font-medium">Route Summary:</div>
              <div className="text-muted-foreground">
                From: {pickup.address}
              </div>
              <div className="text-muted-foreground">
                To: {destination.address}
              </div>
              <div className="text-sm mt-2 font-medium">
                Estimated Distance: ~{Math.round(Math.random() * 30 + 10)} km
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}