'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { mapboxService, type GeocodeResult, type Coordinates } from '@/lib/mapbox'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Navigation, Search, Loader2, MapIcon } from 'lucide-react'

interface UserLocation {
  id: string
  name: string
  address: string
  latitude: number
  longitude: number
  location_type: string
  usage_count: number
  last_used_at: string
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
  onDistanceCalculated?: (distance: number, duration: number) => void
  showValidation?: boolean
  validationErrors?: string[]
}

export function LocationSelectorMapbox({ 
  pickup, 
  destination, 
  onPickupChange, 
  onDestinationChange,
  onDistanceCalculated,
  showValidation = false,
  validationErrors = []
}: LocationSelectorProps) {
  const [userLocations, setUserLocations] = useState<UserLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [pickupInput, setPickupInput] = useState(pickup?.address || '')
  const [destinationInput, setDestinationInput] = useState(destination?.address || '')
  const [pickupSuggestions, setPickupSuggestions] = useState<GeocodeResult[]>([])
  const [destinationSuggestions, setDestinationSuggestions] = useState<GeocodeResult[]>([])
  const [pickupLoading, setPickupLoading] = useState(false)
  const [destinationLoading, setDestinationLoading] = useState(false)
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false)
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false)
  const [routeDistance, setRouteDistance] = useState<number | null>(null)
  const [routeDuration, setRouteDuration] = useState<number | null>(null)
  const [getCurrentLocationLoading, setGetCurrentLocationLoading] = useState(false)
  
  const pickupTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const destinationTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const supabase = createClient()

  const fetchUserLocations = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('user_locations')
        .select('*')
        .order('usage_count', { ascending: false })
        .order('last_used_at', { ascending: false })
        .limit(8)

      if (error) {
        // If table doesn't exist yet, fail silently
        if (error.code === '42P01') {
          console.warn('user_locations table not found. Please run the database schema.')
          setUserLocations([])
          return
        }
        throw error
      }
      
      setUserLocations(data || [])
    } catch (error) {
      console.error('Error fetching user locations:', error)
      setUserLocations([])
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const saveUserLocation = useCallback(async (locationData: LocationData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Check if location already exists for this user
      const { data: existingLocation, error: fetchError } = await supabase
        .from('user_locations')
        .select('*')
        .eq('user_id', user.id)
        .eq('address', locationData.address)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        // If table doesn't exist, skip saving silently
        if (fetchError.code === '42P01') {
          return
        }
        throw fetchError
      }

      if (existingLocation) {
        // Update usage count and last used time
        const { error: updateError } = await supabase
          .from('user_locations')
          .update({
            usage_count: existingLocation.usage_count + 1,
            last_used_at: new Date().toISOString()
          })
          .eq('id', existingLocation.id)

        if (updateError) throw updateError
      } else {
        // Create new user location
        const { error: insertError } = await supabase
          .from('user_locations')
          .insert({
            user_id: user.id,
            name: locationData.address.split(',')[0] || locationData.address,
            address: locationData.address,
            latitude: locationData.latitude,
            longitude: locationData.longitude,
            location_type: 'both',
            usage_count: 1,
            last_used_at: new Date().toISOString()
          })

        if (insertError) {
          // If table doesn't exist, skip saving silently
          if (insertError.code === '42P01') {
            return
          }
          throw insertError
        }
      }

      // Refresh the locations list
      fetchUserLocations()
    } catch (error) {
      console.error('Error saving user location:', error)
    }
  }, [supabase, fetchUserLocations])

  const calculateRoute = useCallback(async () => {
    if (!pickup || !destination) return

    try {
      const route = await mapboxService.getDirections(
        { latitude: pickup.latitude, longitude: pickup.longitude },
        { latitude: destination.latitude, longitude: destination.longitude },
        { profile: 'driving' }
      )
      
      const distanceKm = route.distance / 1000 // Convert meters to kilometers
      const durationMinutes = route.duration / 60 // Convert seconds to minutes
      
      setRouteDistance(distanceKm)
      setRouteDuration(durationMinutes)
      
      // Notify parent component of distance calculation
      onDistanceCalculated?.(distanceKm, durationMinutes)
    } catch (error) {
      console.error('Error calculating route:', error)
      // Fallback to Haversine distance
      const fallbackDistance = mapboxService.getHaversineDistance(
        { latitude: pickup.latitude, longitude: pickup.longitude },
        { latitude: destination.latitude, longitude: destination.longitude }
      )
      setRouteDistance(fallbackDistance)
      setRouteDuration(fallbackDistance * 2) // Rough estimate: 2 minutes per km
      onDistanceCalculated?.(fallbackDistance, fallbackDistance * 2)
    }
  }, [pickup, destination, onDistanceCalculated])

  const handleInputChange = useCallback(async (value: string, type: 'pickup' | 'destination') => {
    const setInput = type === 'pickup' ? setPickupInput : setDestinationInput
    const timeoutRef = type === 'pickup' ? pickupTimeoutRef : destinationTimeoutRef
    const setLoading = type === 'pickup' ? setPickupLoading : setDestinationLoading
    const setSuggestions = type === 'pickup' ? setPickupSuggestions : setDestinationSuggestions
    const setShowSuggestions = type === 'pickup' ? setShowPickupSuggestions : setShowDestinationSuggestions

    setInput(value)

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    if (value.length < 3) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    timeoutRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const suggestions = await mapboxService.geocode(value, {
          limit: 5
        })
        setSuggestions(suggestions)
        setShowSuggestions(true)
      } catch (error) {
        console.error('Error fetching suggestions:', error)
        setSuggestions([])
        setShowSuggestions(false)
      } finally {
        setLoading(false)
      }
    }, 300)
  }, [])

  const handleSuggestionSelect = (suggestion: GeocodeResult, type: 'pickup' | 'destination') => {
    const locationData: LocationData = {
      address: suggestion.place_name,
      latitude: suggestion.center[1],
      longitude: suggestion.center[0]
    }

    // Save location to user's favorites
    saveUserLocation(locationData)

    if (type === 'pickup') {
      setPickupInput(suggestion.place_name)
      setShowPickupSuggestions(false)
      onPickupChange(locationData)
    } else {
      setDestinationInput(suggestion.place_name)
      setShowDestinationSuggestions(false)
      onDestinationChange(locationData)
    }
  }

  const handleUserLocationSelect = (location: UserLocation, type: 'pickup' | 'destination') => {
    const locationData: LocationData = {
      address: location.address,
      latitude: location.latitude,
      longitude: location.longitude,
      locationId: location.id
    }

    // Update usage count for this location
    saveUserLocation(locationData)

    if (type === 'pickup') {
      setPickupInput(location.address)
      onPickupChange(locationData)
    } else {
      setDestinationInput(location.address)
      onDestinationChange(locationData)
    }
  }

  const swapLocations = () => {
    if (!pickup || !destination) return

    const tempPickup = pickup
    const tempPickupInput = pickupInput
    const tempDestination = destination
    const tempDestinationInput = destinationInput

    setPickupInput(tempDestinationInput)
    setDestinationInput(tempPickupInput)
    onPickupChange(tempDestination)
    onDestinationChange(tempPickup)
  }

  useEffect(() => {
    fetchUserLocations()
  }, [fetchUserLocations])

  useEffect(() => {
    // Calculate route when both locations are selected
    if (pickup && destination) {
      calculateRoute()
    }
  }, [pickup, destination, calculateRoute])

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (pickupTimeoutRef.current) {
        clearTimeout(pickupTimeoutRef.current)
      }
      if (destinationTimeoutRef.current) {
        clearTimeout(destinationTimeoutRef.current)
      }
    }
  }, [])

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser')
      return
    }

    setGetCurrentLocationLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords
          const results = await mapboxService.reverseGeocode(longitude, latitude)
          
          if (results.length > 0) {
            const locationData: LocationData = {
              address: results[0].place_name,
              latitude,
              longitude
            }
            setPickupInput(results[0].place_name)
            onPickupChange(locationData)
          }
        } catch (error) {
          console.error('Error getting current location:', error)
        } finally {
          setGetCurrentLocationLoading(false)
        }
      },
      (error) => {
        console.error('Error getting location:', error)
        setGetCurrentLocationLoading(false)
        alert('Unable to get your current location')
      }
    )
  }, [onPickupChange])

  // Check if Mapbox is configured
  if (!mapboxService.isConfigured()) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Select Locations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-8">
            <MapIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Mapbox Configuration Required</h3>
            <p className="text-muted-foreground">
              Please add your Mapbox access token to enable location services.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white border-slate-200 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Select Locations
        </CardTitle>
        <CardDescription>
          Choose your pickup and destination points across Latvia, Estonia, and Lithuania
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Pickup and Destination Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pickup Location */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="pickup" className="text-sm font-medium">
                Pickup Location
              </Label>
              <Button
                variant="outline"
                size="sm"
                onClick={getCurrentLocation}
                disabled={getCurrentLocationLoading}
              >
                {getCurrentLocationLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Navigation className="h-4 w-4" />
                )}
                <span className="ml-2">Current Location</span>
              </Button>
            </div>
            
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="pickup"
                  placeholder="Search pickup address..."
                  value={pickupInput}
                  onChange={(e) => handleInputChange(e.target.value, 'pickup')}
                  className={`pl-10 ${
                    showValidation && validationErrors.includes('pickup location') && !pickup
                      ? 'border-orange-300 focus:border-orange-500' 
                      : ''
                  }`}
                />
                {pickupLoading && (
                  <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin" />
                )}
              </div>
              
              {showPickupSuggestions && pickupSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                  {pickupSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 border-b last:border-b-0"
                      onClick={() => handleSuggestionSelect(suggestion, 'pickup')}
                    >
                      <div className="font-medium text-sm">{suggestion.place_name}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Recent Pickup Locations:</Label>
              <div className="grid grid-cols-1 gap-2">
                {loading ? (
                  <div className="animate-pulse space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-8 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                ) : userLocations.length > 0 ? (
                  userLocations.map((location) => (
                    <Button
                      key={location.id}
                      variant="outline"
                      size="sm"
                      className="justify-start min-h-[4rem] h-auto p-3 items-start"
                      onClick={() => handleUserLocationSelect(location, 'pickup')}
                    >
                      <div className="text-left">
                        <div className="font-medium text-sm">{location.name}</div>
                        <div className="text-xs text-muted-foreground">{location.address}</div>
                        <div className="text-xs text-sky-600">Used {location.usage_count} times</div>
                      </div>
                    </Button>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground p-2">No saved locations yet</p>
                )}
              </div>
            </div>
          </div>

          {/* Destination Location */}
          <div className="space-y-3">
            <Label htmlFor="destination" className="text-sm font-medium">
              Destination
            </Label>
            
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="destination"
                  placeholder="Search destination address..."
                  value={destinationInput}
                  onChange={(e) => handleInputChange(e.target.value, 'destination')}
                  className={`pl-10 ${
                    showValidation && validationErrors.includes('destination') && !destination
                      ? 'border-orange-300 focus:border-orange-500' 
                      : ''
                  }`}
                />
                {destinationLoading && (
                  <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin" />
                )}
              </div>
              
              {showDestinationSuggestions && destinationSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                  {destinationSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 border-b last:border-b-0"
                      onClick={() => handleSuggestionSelect(suggestion, 'destination')}
                    >
                      <div className="font-medium text-sm">{suggestion.place_name}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Recent Destinations:</Label>
              <div className="grid grid-cols-1 gap-2">
                {loading ? (
                  <div className="animate-pulse space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-8 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                ) : userLocations.length > 0 ? (
                  userLocations.map((location) => (
                    <Button
                      key={location.id}
                      variant="outline"
                      size="sm"
                      className="justify-start min-h-[4rem] h-auto p-3 items-start"
                      onClick={() => handleUserLocationSelect(location, 'destination')}
                    >
                      <div className="text-left">
                        <div className="font-medium text-sm">{location.name}</div>
                        <div className="text-xs text-muted-foreground">{location.address}</div>
                        <div className="text-xs text-sky-600">Used {location.usage_count} times</div>
                      </div>
                    </Button>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground p-2">No saved locations yet</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Swap Button */}
        {pickup && destination && (
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={swapLocations}
              className="flex items-center gap-2"
            >
              <Navigation className="h-4 w-4" />
              Swap Locations
            </Button>
          </div>
        )}

        {/* Route Summary */}
        {pickup && destination && (
          <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MapIcon className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">Route Summary</span>
              </div>
              
              <div className="text-sm space-y-1">
                <div className="text-muted-foreground">
                  <strong>From:</strong> {pickup.address.length > 50 ? pickup.address.substring(0, 50) + '...' : pickup.address}
                </div>
                <div className="text-muted-foreground">
                  <strong>To:</strong> {destination.address.length > 50 ? destination.address.substring(0, 50) + '...' : destination.address}
                </div>
              </div>
              
              {routeDistance && routeDuration && (
                <div className="flex items-center gap-4 pt-2 border-t">
                  <Badge variant="secondary">
                    {routeDistance.toFixed(1)} km
                  </Badge>
                  <Badge variant="secondary">
                    ~{Math.round(routeDuration)} min
                  </Badge>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}