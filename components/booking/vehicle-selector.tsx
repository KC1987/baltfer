'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Luggage, Car } from 'lucide-react'

interface VehicleType {
  id: string
  name: string
  base_price: number
  price_per_km: number
  max_passengers: number
  max_luggage: number
  description: string | null
  image_url: string | null
  is_active: boolean
}

interface VehicleSelectorProps {
  selectedVehicle: VehicleType | null
  onVehicleSelect: (vehicle: VehicleType) => void
  distance?: number
  showValidation?: boolean
  validationErrors?: string[]
}

export function VehicleSelector({ 
  selectedVehicle, 
  onVehicleSelect, 
  distance = 0,
  showValidation = false,
  validationErrors = []
}: VehicleSelectorProps) {
  const [vehicles, setVehicles] = useState<VehicleType[]>([])
  const [loading, setLoading] = useState(true)
  
  const supabase = createClient()

  useEffect(() => {
    let isMounted = true

    const fetchVehicleTypes = async () => {
      try {
        const { data, error } = await supabase
          .from('vehicle_types')
          .select('*')
          .eq('is_active', true)
          .order('base_price')

        if (error) throw error
        
        if (isMounted) {
          setVehicles(data || [])
        }
      } catch (error) {
        console.error('Error fetching vehicle types:', error)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchVehicleTypes()

    return () => {
      isMounted = false
    }
  }, [supabase])

  const calculatePrice = (vehicle: VehicleType) => {
    const basePrice = vehicle.base_price
    const distancePrice = distance * vehicle.price_per_km
    return basePrice + distancePrice
  }

  const getVehicleIcon = (name: string) => {
    const lowerName = name.toLowerCase()
    if (lowerName.includes('van')) {
      return '🚐'
    } else if (lowerName.includes('premium') || lowerName.includes('executive')) {
      return '🚗'
    } else {
      return '🚙'
    }
  }

  if (loading) {
    return (
      <Card className="bg-white border-slate-200 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Select Vehicle
          </CardTitle>
          <CardDescription>Choose your preferred vehicle type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-32 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white border-slate-200 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Car className="h-5 w-5" />
          Select Vehicle
        </CardTitle>
        <CardDescription>
          Choose your preferred vehicle type
          {distance > 0 && ` (${distance}km journey)`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vehicles.map((vehicle) => {
            const isSelected = selectedVehicle?.id === vehicle.id
            const totalPrice = calculatePrice(vehicle)
            
            return (
              <div
                key={vehicle.id}
                className={`
                  relative cursor-pointer rounded-lg border-2 p-4 transition-all
                  ${isSelected 
                    ? 'border-primary bg-primary/5' 
                    : showValidation && validationErrors.includes('vehicle selection') && !selectedVehicle
                      ? 'border-orange-300 hover:border-orange-500'
                      : 'border-muted hover:border-primary/50'
                  }
                `}
                onClick={() => onVehicleSelect(vehicle)}
              >
                {isSelected && (
                  <div className="absolute -top-2 -right-2">
                    <Badge className="bg-primary">Selected</Badge>
                  </div>
                )}
                
                <div className="space-y-3">
                  {/* Vehicle Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getVehicleIcon(vehicle.name)}</span>
                      <div>
                        <h3 className="font-semibold text-lg">{vehicle.name}</h3>
                        {vehicle.description && (
                          <p className="text-sm text-muted-foreground">
                            {vehicle.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Vehicle Details */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{vehicle.max_passengers} passengers</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Luggage className="h-4 w-4" />
                      <span>{vehicle.max_luggage} bags</span>
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Base fare:</span>
                      <span className="text-sm">€{vehicle.base_price.toFixed(2)}</span>
                    </div>
                    {distance > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          Distance ({distance}km × €{vehicle.price_per_km}/km):
                        </span>
                        <span className="text-sm">
                          €{(distance * vehicle.price_per_km).toFixed(2)}
                        </span>
                      </div>
                    )}
                    <hr className="my-2" />
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Total:</span>
                      <span className="font-bold text-lg">
                        €{totalPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="secondary" className="text-xs">
                      Professional Driver
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      Air Conditioning
                    </Badge>
                    {vehicle.name.toLowerCase().includes('premium') && (
                      <Badge variant="secondary" className="text-xs">
                        Luxury Interior
                      </Badge>
                    )}
                    {vehicle.name.toLowerCase().includes('van') && (
                      <Badge variant="secondary" className="text-xs">
                        Extra Space
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {vehicles.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No vehicles available at the moment.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}