'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LocationSelectorMapbox } from '@/components/booking/location-selector-mapbox'
import { RouteMap } from '@/components/booking/route-map'
import { VehicleSelector } from '@/components/booking/vehicle-selector'
import { DateTimeSelector } from '@/components/booking/datetime-selector'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Users, Luggage, Clock, MapPin, CreditCard, AlertCircle, Banknote } from 'lucide-react'

interface LocationData {
  address: string
  latitude: number
  longitude: number
  locationId?: string
}

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

export default function BookingPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [pickup, setPickup] = useState<LocationData | null>(null)
  const [destination, setDestination] = useState<LocationData | null>(null)
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType | null>(null)
  const [selectedDateTime, setSelectedDateTime] = useState<Date | null>(null)
  const [passengerCount, setPassengerCount] = useState(1)
  const [luggageCount, setLuggageCount] = useState(1)
  const [specialRequirements, setSpecialRequirements] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash'>('card')
  const [loading, setLoading] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [showValidation, setShowValidation] = useState(false)
  
  const router = useRouter()

  // Distance will be calculated by Mapbox in the location selector
  const [estimatedDistance, setEstimatedDistance] = useState(0)
  const [estimatedDuration, setEstimatedDuration] = useState(0)

  const handleDistanceCalculated = (distance: number, duration: number) => {
    setEstimatedDistance(Math.round(distance))
    setEstimatedDuration(Math.round(duration))
  }

  // Helper function to detect cross-border trips
  const isCrossBorderTrip = () => {
    if (!pickup || !destination) return false
    
    // Simple check based on address containing different country indicators
    const pickupCountry = pickup.address.includes('Latvia') || pickup.address.includes('LV-') ? 'LV' :
                         pickup.address.includes('Estonia') || pickup.address.includes('Estonia') ? 'EE' :
                         pickup.address.includes('Lithuania') || pickup.address.includes('Lithuania') ? 'LT' : null
    
    const destCountry = destination.address.includes('Latvia') || destination.address.includes('LV-') ? 'LV' :
                       destination.address.includes('Estonia') || destination.address.includes('Estonia') ? 'EE' :
                       destination.address.includes('Lithuania') || destination.address.includes('Lithuania') ? 'LT' : null
    
    return pickupCountry && destCountry && pickupCountry !== destCountry
  }

  // Calculate pricing with surcharges
  const calculateTotalPrice = () => {
    if (!selectedVehicle || !selectedDateTime) return 0

    let basePrice = selectedVehicle.base_price + (estimatedDistance * selectedVehicle.price_per_km)
    
    // Apply only cross-border and night surcharges (no peak hours)
    const hour = selectedDateTime.getHours()
    const isCrossBorder = isCrossBorderTrip()
    
    // Only night surcharge (10 PM - 6 AM)
    if (hour >= 22 || hour < 6) {
      basePrice *= 1.30 // Night surcharge
    }
    
    // Cross-border surcharges
    if (isCrossBorder) {
      basePrice *= 1.20 // Base cross-border fee
      if (estimatedDistance > 250) {
        basePrice *= 1.15 // Long distance cross-border
      }
    }
    
    return basePrice
  }

  const totalPrice = calculateTotalPrice()

  const validateCurrentStep = () => {
    const errors: string[] = []
    
    switch (currentStep) {
      case 1:
        if (!pickup) errors.push('pickup location')
        if (!destination) errors.push('destination')
        break
      case 2:
        if (!selectedVehicle) errors.push('vehicle selection')
        break
      case 3:
        if (!selectedDateTime) errors.push('date and time')
        if (!customerName.trim()) errors.push('full name')
        if (!customerPhone.trim()) errors.push('phone number')
        if (passengerCount <= 0) errors.push('number of passengers')
        if (luggageCount < 0) errors.push('number of bags')
        break
      case 4:
        if (!paymentMethod) errors.push('payment method')
        break
      case 5:
        // Final validation - should not reach here with errors
        break
    }
    
    setValidationErrors(errors)
    return errors.length === 0
  }

  const handleNext = () => {
    const isValid = validateCurrentStep()
    
    if (isValid) {
      setShowValidation(false)
      if (currentStep < 5) {
        setCurrentStep(currentStep + 1)
      } else {
        handleBookingSubmit()
      }
    } else {
      setShowValidation(true)
    }
  }

  const handleBookingSubmit = async () => {
    if (!pickup || !destination || !selectedVehicle || !selectedDateTime) {
      console.error('Missing required booking data:', { pickup, destination, selectedVehicle, selectedDateTime })
      alert('Please complete all required fields before booking.')
      return
    }

    console.log('Starting booking submission with data:', {
      pickup: pickup.address,
      destination: destination.address,
      vehicle: selectedVehicle.name,
      dateTime: selectedDateTime.toISOString(),
      passengers: passengerCount,
      luggage: luggageCount,
      totalPrice
    })

    setLoading(true)
    try {
      const bookingData = {
        pickup,
        destination,
        vehicle_type_id: selectedVehicle.id,
        departure_time: selectedDateTime.toISOString(),
        passenger_count: passengerCount,
        luggage_count: luggageCount,
        special_requirements: specialRequirements || null,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        notes: notes.trim() || null,
        distance_km: estimatedDistance,
        duration_minutes: Math.round(estimatedDistance * 2), // Rough estimate
        total_price: totalPrice,
        payment_method: paymentMethod
      }

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bookingData)
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('API Error:', error)
        console.error('Response status:', response.status, response.statusText)
        
        const errorMessage = error.error || error.message || 'Failed to create booking'
        const errorDetails = error.details ? ` Details: ${error.details}` : ''
        const errorHint = error.hint ? ` Hint: ${error.hint}` : ''
        
        throw new Error(`${errorMessage}${errorDetails}${errorHint}`)
      }

      const { booking } = await response.json()
      console.log('Booking created successfully:', booking)
      
      // Redirect based on payment method
      if (paymentMethod === 'cash') {
        router.push(`/booking-confirmation/${booking.id}`)
      } else {
        router.push(`/payment/${booking.id}`)
      }
    } catch (error: any) {
      console.error('Booking error:', error)
      alert(`Booking failed: ${error.message || 'Please try again.'}`)
    } finally {
      setLoading(false)
    }
  }

  const steps = [
    { number: 1, title: 'Locations', icon: MapPin },
    { number: 2, title: 'Vehicle', icon: Users },
    { number: 3, title: 'Details & Schedule', icon: Clock },
    { number: 4, title: 'Payment Method', icon: CreditCard },
    { number: 5, title: 'Confirm', icon: CheckCircle },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-sky-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isActive = currentStep === step.number
              const isCompleted = currentStep > step.number
              
              return (
                <div key={step.number} className="flex items-center">
                  <div className={`
                    flex items-center justify-center w-10 h-10 rounded-full border-2 
                    ${isActive 
                      ? 'border-sky-500 bg-sky-500 text-white' 
                      : isCompleted 
                        ? 'border-sky-600 bg-sky-600 text-white'
                        : 'border-slate-300 bg-white text-slate-600'
                    }
                  `}>
                    {isCompleted ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  <div className="ml-2 hidden sm:block">
                    <div className="text-sm font-medium">{step.title}</div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="flex-1 mx-4 h-0.5 bg-slate-200"></div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {currentStep === 1 && (
              <div className="space-y-6">
                <LocationSelectorMapbox
                  pickup={pickup}
                  destination={destination}
                  onPickupChange={setPickup}
                  onDestinationChange={setDestination}
                  onDistanceCalculated={handleDistanceCalculated}
                  showValidation={showValidation}
                  validationErrors={validationErrors}
                />
                {pickup && destination && (
                  <RouteMap
                    pickup={pickup}
                    destination={destination}
                    height="250px"
                  />
                )}
              </div>
            )}

            {currentStep === 2 && (
              <VehicleSelector
                selectedVehicle={selectedVehicle}
                onVehicleSelect={setSelectedVehicle}
                distance={estimatedDistance}
                showValidation={showValidation}
                validationErrors={validationErrors}
              />
            )}

            {currentStep === 3 && (
              <DateTimeSelector
                selectedDateTime={selectedDateTime}
                onDateTimeChange={setSelectedDateTime}
                customerName={customerName}
                customerPhone={customerPhone}
                onCustomerNameChange={setCustomerName}
                onCustomerPhoneChange={setCustomerPhone}
                passengerCount={passengerCount}
                luggageCount={luggageCount}
                onPassengerCountChange={setPassengerCount}
                onLuggageCountChange={setLuggageCount}
                specialRequirements={specialRequirements}
                notes={notes}
                onSpecialRequirementsChange={setSpecialRequirements}
                onNotesChange={setNotes}
                selectedVehicle={selectedVehicle}
                showValidation={showValidation}
                validationErrors={validationErrors}
              />
            )}

            {currentStep === 4 && (
              <Card className="bg-white border-slate-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Choose Payment Method
                  </CardTitle>
                  <CardDescription>
                    Select how you would like to pay for your transfer
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div 
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        paymentMethod === 'card' 
                          ? 'border-sky-500 bg-sky-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setPaymentMethod('card')}
                    >
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-6 w-6 text-sky-600" />
                        <div>
                          <h3 className="font-semibold">Card Payment</h3>
                          <p className="text-sm text-muted-foreground">Pay online with credit/debit card</p>
                          <p className="text-xs text-green-600 mt-1">✓ Instant confirmation</p>
                        </div>
                      </div>
                    </div>

                    <div 
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        paymentMethod === 'cash' 
                          ? 'border-sky-500 bg-sky-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setPaymentMethod('cash')}
                    >
                      <div className="flex items-center gap-3">
                        <Banknote className="h-6 w-6 text-green-600" />
                        <div>
                          <h3 className="font-semibold">Cash Payment</h3>
                          <p className="text-sm text-muted-foreground">Pay cash to the driver</p>
                          <p className="text-xs text-blue-600 mt-1">✓ No fees</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {paymentMethod === 'cash' && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                        <div className="text-sm">
                          <h4 className="font-semibold text-amber-800 mb-1">Cash Payment Instructions</h4>
                          <ul className="text-amber-700 space-y-1">
                            <li>• Payment due in full to the driver at pickup</li>
                            <li>• Exact change recommended (EUR {totalPrice.toFixed(2)})</li>
                            <li>• Booking will be confirmed pending driver assignment</li>
                            <li>• Free cancellation up to 2 hours before pickup</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {showValidation && validationErrors.includes('payment method') && (
                    <div className="text-sm text-red-600">Please select a payment method</div>
                  )}
                </CardContent>
              </Card>
            )}

            {currentStep === 5 && (
              <Card className="bg-white border-slate-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Confirm Your Booking
                  </CardTitle>
                  <CardDescription>
                    Review your booking details before confirmation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Route</h4>
                      <div className="text-sm text-muted-foreground">
                        <div>From: {pickup?.address}</div>
                        <div>To: {destination?.address}</div>
                        <div>Distance: ~{estimatedDistance} km</div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h4 className="font-semibold mb-2">Vehicle & Schedule</h4>
                      <div className="text-sm text-muted-foreground">
                        <div>Vehicle: {selectedVehicle?.name}</div>
                        <div>Date: {selectedDateTime?.toLocaleDateString()}</div>
                        <div>Time: {selectedDateTime?.toLocaleTimeString()}</div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h4 className="font-semibold mb-2">Payment Method</h4>
                      <div className="flex items-center gap-2">
                        {paymentMethod === 'card' ? (
                          <>
                            <CreditCard className="h-4 w-4 text-sky-600" />
                            <span className="text-sm">Credit/Debit Card</span>
                            <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">Online Payment</Badge>
                          </>
                        ) : (
                          <>
                            <Banknote className="h-4 w-4 text-green-600" />
                            <span className="text-sm">Cash Payment</span>
                            <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700">Pay Driver</Badge>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h4 className="font-semibold mb-2">Customer Information</h4>
                      <div className="text-sm text-muted-foreground">
                        <div>Name: {customerName}</div>
                        <div>Phone: {customerPhone}</div>
                        {notes && (
                          <div>Notes: {notes}</div>
                        )}
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h4 className="font-semibold mb-2">Passengers & Luggage</h4>
                      <div className="text-sm text-muted-foreground">
                        <div>{passengerCount} passenger{passengerCount !== 1 ? 's' : ''}</div>
                        <div>{luggageCount} bag{luggageCount !== 1 ? 's' : ''}</div>
                        {specialRequirements && (
                          <div>Special requirements: {specialRequirements}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Booking Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8 bg-white border-slate-200 shadow-lg">
              <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {pickup && destination && (
                  <div className="text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Route</span>
                      {isCrossBorderTrip() && (
                        <Badge variant="secondary" className="text-xs bg-sky-100 text-sky-700 border-sky-200">
                          Cross-Border
                        </Badge>
                      )}
                    </div>
                    <div className="text-muted-foreground">
                      {pickup.address.substring(0, 30)}...
                    </div>
                    <div className="text-muted-foreground">
                      ↓ {estimatedDistance} km
                    </div>
                    <div className="text-muted-foreground">
                      {destination.address.substring(0, 30)}...
                    </div>
                  </div>
                )}

                {selectedVehicle && (
                  <div className="text-sm">
                    <div className="font-medium">Vehicle</div>
                    <div className="text-muted-foreground">{selectedVehicle.name}</div>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {selectedVehicle.max_passengers} seats
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {selectedVehicle.max_luggage} bags
                      </Badge>
                    </div>
                  </div>
                )}

                {selectedDateTime && (
                  <div className="text-sm">
                    <div className="font-medium">Schedule</div>
                    <div className="text-muted-foreground">
                      {selectedDateTime.toLocaleDateString()}
                    </div>
                    <div className="text-muted-foreground">
                      {selectedDateTime.toLocaleTimeString()}
                    </div>
                  </div>
                )}

                {totalPrice > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Base fare:</span>
                        <span>€{selectedVehicle?.base_price.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Distance ({estimatedDistance}km):</span>
                        <span>€{(estimatedDistance * (selectedVehicle?.price_per_km || 0)).toFixed(2)}</span>
                      </div>
                      {isCrossBorderTrip() && (
                        <div className="flex justify-between text-sm text-sky-600">
                          <span>Cross-border fee:</span>
                          <span>+20%</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold">
                        <span>Total:</span>
                        <span>€{totalPrice.toFixed(2)}</span>
                      </div>
                    </div>
                  </>
                )}

                <div className="pt-4">
                  {currentStep > 1 && (
                    <Button
                      variant="outline"
                      onClick={() => setCurrentStep(currentStep - 1)}
                      className="w-full mb-2"
                    >
                      Back
                    </Button>
                  )}
                  
                  <Button
                    onClick={handleNext}
                    disabled={loading}
                    className="w-full bg-sky-500 hover:bg-sky-600 text-white disabled:bg-gray-300 disabled:text-gray-500"
                  >
                    {loading ? 'Processing...' : 
                     currentStep === 5 ? 'Confirm Booking' : 'Continue'}
                  </Button>
                  
                  {/* Validation message - only shown after Continue is pressed */}
                  {showValidation && validationErrors.length > 0 && (
                    <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-md">
                      <div className="flex items-center gap-2 text-orange-700">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">Please complete the following required fields:</span>
                      </div>
                      <p className="text-sm text-orange-600 mt-1">
                        {validationErrors.join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}