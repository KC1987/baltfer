'use client'

import { useState, useEffect, useCallback } from 'react'
import { format, addDays, isAfter, isBefore, startOfDay, addHours } from 'date-fns'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Clock, Calendar as CalendarIcon, AlertCircle, User, Users, Luggage } from 'lucide-react'

interface DateTimeSelectorProps {
  selectedDateTime: Date | null
  onDateTimeChange: (dateTime: Date) => void
  customerName: string
  customerPhone: string
  onCustomerNameChange: (name: string) => void
  onCustomerPhoneChange: (phone: string) => void
  passengerCount: number
  luggageCount: number
  onPassengerCountChange: (count: number) => void
  onLuggageCountChange: (count: number) => void
  specialRequirements: string
  notes: string
  onSpecialRequirementsChange: (requirements: string) => void
  onNotesChange: (notes: string) => void
  selectedVehicle: any
  showValidation?: boolean
  validationErrors?: string[]
}

export function DateTimeSelector({ 
  selectedDateTime, 
  onDateTimeChange,
  customerName,
  customerPhone,
  onCustomerNameChange,
  onCustomerPhoneChange,
  passengerCount,
  luggageCount,
  onPassengerCountChange,
  onLuggageCountChange,
  specialRequirements,
  notes,
  onSpecialRequirementsChange,
  onNotesChange,
  selectedVehicle,
  showValidation = false,
  validationErrors = []
}: DateTimeSelectorProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    selectedDateTime || undefined
  )
  const [selectedTime, setSelectedTime] = useState<string>(
    selectedDateTime ? format(selectedDateTime, 'HH:mm') : ''
  )
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([])

  const generateTimeSlots = useCallback((date: Date) => {
    const slots: string[] = []
    const now = new Date()
    const isToday = format(date, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd')
    const currentHour = now.getHours()
    const currentMinutes = now.getMinutes()

    // Generate slots from 6 AM to 11 PM (every 30 minutes)
    for (let hour = 6; hour <= 23; hour++) {
      for (let minutes = 0; minutes < 60; minutes += 30) {
        // Skip past times for today
        if (isToday) {
          if (hour < currentHour || (hour === currentHour && minutes <= currentMinutes + 60)) {
            continue
          }
        }
        
        const timeString = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
        slots.push(timeString)
      }
    }

    setAvailableTimeSlots(slots)
    
    // Reset selected time if it's no longer available
    if (selectedTime && !slots.includes(selectedTime)) {
      setSelectedTime('')
    }
  }, [selectedTime])

  useEffect(() => {
    if (selectedDate) {
      generateTimeSlots(selectedDate)
    }
  }, [selectedDate, generateTimeSlots])

  useEffect(() => {
    if (selectedDate && selectedTime) {
      const [hours, minutes] = selectedTime.split(':').map(Number)
      const dateTime = new Date(selectedDate)
      dateTime.setHours(hours, minutes, 0, 0)
      onDateTimeChange(dateTime)
    }
  }, [selectedDate, selectedTime, onDateTimeChange])

  const isDateDisabled = (date: Date) => {
    const today = startOfDay(new Date())
    const maxDate = addDays(today, 90) // Allow booking up to 90 days in advance
    
    return isBefore(date, today) || isAfter(date, maxDate)
  }

  const getTimeBadge = (time: string) => {
    const hour = parseInt(time.split(':')[0])
    
    if (hour >= 6 && hour < 9) {
      return <Badge variant="secondary" className="text-xs">Morning</Badge>
    } else if (hour >= 17 && hour < 20) {
      return <Badge variant="secondary" className="text-xs">Peak Hours</Badge>
    } else if (hour >= 22 || hour < 6) {
      return <Badge variant="outline" className="text-xs">Night (+30%)</Badge>
    }
    return null
  }

  const isPeakTime = (time: string) => {
    const hour = parseInt(time.split(':')[0])
    return (hour >= 7 && hour < 9) || (hour >= 17 && hour < 19)
  }

  const isNightTime = (time: string) => {
    const hour = parseInt(time.split(':')[0])
    return hour >= 22 || hour < 6
  }

  return (
    <Card className="bg-white border-slate-200 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Select Date & Time
        </CardTitle>
        <CardDescription>
          Choose when you need to be picked up
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Date Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            Departure Date
          </Label>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            disabled={isDateDisabled}
            className="rounded-md border"
          />
          
          {selectedDate && (
            <div className="bg-muted p-3 rounded-lg">
              <div className="text-sm font-medium">
                Selected Date: {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </div>
            </div>
          )}
        </div>

        {/* Time Selection */}
        {selectedDate && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Pickup Time
            </Label>
            
            {availableTimeSlots.length === 0 ? (
              <div className="flex items-center gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-yellow-800">
                  No available time slots for this date. Please select another date.
                </span>
              </div>
            ) : (
              <>
                <Select value={selectedTime} onValueChange={setSelectedTime}>
                  <SelectTrigger className={`bg-white text-slate-900 ${
                    showValidation && validationErrors.includes('date and time') && !selectedDateTime
                      ? 'border-orange-300 focus:border-orange-500' 
                      : 'border-slate-300'
                  }`}>
                    <SelectValue placeholder="Select pickup time" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-300 shadow-lg">
                    {availableTimeSlots.map((time) => (
                      <SelectItem key={time} value={time} className="bg-white hover:bg-sky-50 text-slate-900">
                        <div className="flex items-center justify-between w-full">
                          <span>{time}</span>
                          <div className="flex gap-1 ml-2">
                            {isNightTime(time) && (
                              <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                                Night +30%
                              </Badge>
                            )}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedTime && (
                  <div className="bg-sky-50 border border-sky-200 p-3 rounded-lg space-y-2">
                    <div className="text-sm">
                      <div className="font-medium">
                        Pickup Time: {selectedTime}
                      </div>
                      <div className="text-muted-foreground">
                        {format(new Date(`2024-01-01 ${selectedTime}`), 'HH:mm')}
                      </div>
                    </div>
                    
                    {isNightTime(selectedTime) && (
                      <div className="flex items-center gap-2 text-sm">
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                        <span className="text-amber-800">
                          Night surcharge applies (+30%)
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Customer Details */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <User className="h-4 w-4" />
            Customer Information
          </Label>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customer-name">Full Name *</Label>
              <Input
                id="customer-name"
                type="text"
                placeholder="Enter your full name"
                value={customerName}
                onChange={(e) => onCustomerNameChange(e.target.value)}
                required
                className={
                  showValidation && validationErrors.includes('full name') && !customerName.trim()
                    ? "border-orange-300 focus:border-orange-500" 
                    : ""
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-phone">Phone Number *</Label>
              <Input
                id="customer-phone"
                type="tel"
                placeholder="+371 12345678"
                value={customerPhone}
                onChange={(e) => onCustomerPhoneChange(e.target.value)}
                required
                className={
                  showValidation && validationErrors.includes('phone number') && !customerPhone.trim()
                    ? "border-orange-300 focus:border-orange-500" 
                    : ""
                }
              />
            </div>
          </div>
        </div>

        {/* Passenger and Luggage Details */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Users className="h-4 w-4" />
            Passenger & Luggage Details
          </Label>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="passengers">Number of Passengers *</Label>
              <Input
                id="passengers"
                type="number"
                min="1"
                max={selectedVehicle?.max_passengers || 8}
                value={passengerCount}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 1
                  onPassengerCountChange(Math.max(1, value))
                }}
                className={
                  showValidation && validationErrors.includes('number of passengers') && passengerCount <= 0
                    ? "border-orange-300 focus:border-orange-500" 
                    : ""
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="luggage">Number of Bags *</Label>
              <Input
                id="luggage"
                type="number"
                min="0"
                max={selectedVehicle?.max_luggage || 10}
                value={luggageCount}
                onChange={(e) => {
                  const value = parseInt(e.target.value)
                  onLuggageCountChange(isNaN(value) ? 0 : Math.max(0, value))
                }}
                className={
                  showValidation && validationErrors.includes('number of bags') && luggageCount < 0
                    ? "border-orange-300 focus:border-orange-500" 
                    : ""
                }
              />
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Luggage className="h-4 w-4" />
            Additional Information
          </Label>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any additional instructions or information for the driver..."
                value={notes}
                onChange={(e) => onNotesChange(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="requirements">Special Requirements (Optional)</Label>
              <Textarea
                id="requirements"
                placeholder="Child seat, wheelchair access, pet transport, etc."
                value={specialRequirements}
                onChange={(e) => onSpecialRequirementsChange(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Booking Notice */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <div className="font-medium mb-1">Booking Guidelines:</div>
              <ul className="space-y-1 text-xs">
                <li>• Bookings must be made at least 1 hour in advance</li>
                <li>• Night bookings (10 PM - 6 AM) have a 30% surcharge</li>
                <li>• Cross-border trips (100km+) include border crossing fee</li>
                <li>• Free cancellation up to 2 hours before pickup</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}