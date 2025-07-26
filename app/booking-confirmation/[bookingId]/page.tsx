'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { CheckCircle, Calendar, MapPin, Car, Users, Clock, ArrowRight, CreditCard, Banknote, Loader2 } from 'lucide-react'

interface BookingDetails {
  id: string
  pickup_address: string
  destination_address: string
  departure_time: string
  total_price: number
  payment_method: 'card' | 'cash'
  status: string
  payment_status: string
  passenger_count: number
  luggage_count: number
  vehicle_types: {
    name: string
    max_passengers: number
    max_luggage: number
  }
  profiles: {
    full_name: string
    phone: string
  }
  notes?: string
  special_requirements?: string
}

export default function BookingConfirmationPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const [booking, setBooking] = useState<BookingDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [bookingId, setBookingId] = useState<string>('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const initializeParams = async () => {
      const resolvedParams = await params
      setBookingId(resolvedParams.bookingId)
    }
    initializeParams()
  }, [params])

  useEffect(() => {
    if (!bookingId) return

    const fetchBooking = async () => {
      try {
        console.log('Fetching booking details for ID:', bookingId)
        
        // Get current user to ensure authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
          console.error('Authentication error:', authError)
          throw new Error('You must be logged in to view booking details')
        }
        
        console.log('User authenticated:', user.id)

        // Fetch booking first
        const { data: booking, error: bookingError } = await supabase
          .from('bookings')
          .select(`
            *,
            vehicle_types (
              name,
              max_passengers,
              max_luggage
            )
          `)
          .eq('id', bookingId)
          .eq('user_id', user.id)
          .single()

        if (bookingError) {
          console.error('Booking fetch error:', bookingError)
          if (bookingError.code === 'PGRST116') {
            throw new Error('Booking not found')
          }
          throw new Error(bookingError.message)
        }

        // Fetch user profile separately
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('full_name, phone')
          .eq('id', user.id)
          .single()

        // Combine the data
        const bookingWithProfile = {
          ...booking,
          profiles: profile || { full_name: 'Unknown', phone: 'Unknown' }
        }

        console.log('Booking fetched successfully:', bookingWithProfile)
        setBooking(bookingWithProfile)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchBooking()
  }, [bookingId])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading booking details...</p>
        </div>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Booking Not Found</h1>
          <p className="mb-4">{error || 'The booking you are looking for could not be found.'}</p>
          <Link href="/dashboard">
            <Button>View My Bookings</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Booking Confirmed!
          </h1>
          <p className="text-lg text-gray-600">
            Your transfer has been successfully booked
          </p>
          <div className="mt-4">
            <Badge variant="outline" className="text-green-700 border-green-300">
              Confirmation #{booking.id.slice(-8).toUpperCase()}
            </Badge>
          </div>
        </div>

        {/* Booking Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Booking Details
            </CardTitle>
            <CardDescription>
              Please save these details for your records
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Route Information */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Route
              </h3>
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="font-medium text-sm">Pickup</div>
                    <div className="text-sm text-muted-foreground">
                      {booking.pickup_address}
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      {new Date(booking.departure_time).toLocaleString()}
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground mt-2" />
                  <div className="flex-1">
                    <div className="font-medium text-sm">Destination</div>
                    <div className="text-sm text-muted-foreground">
                      {booking.destination_address}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Vehicle Information */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Car className="h-4 w-4" />
                Vehicle & Passengers
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Vehicle Type</div>
                  <div className="font-medium">{booking.vehicle_types.name}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Passengers</div>
                  <div className="font-medium">{booking.passenger_count} of {booking.vehicle_types.max_passengers}</div>
                </div>
              </div>
              {booking.luggage_count > 0 && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Luggage: </span>
                  <span className="font-medium">{booking.luggage_count} bag{booking.luggage_count !== 1 ? 's' : ''}</span>
                </div>
              )}
            </div>

            {/* Customer Information */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Users className="h-4 w-4" />
                Customer Information
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Name</div>
                  <div className="font-medium">{booking.profiles.full_name}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Phone</div>
                  <div className="font-medium">{booking.profiles.phone}</div>
                </div>
              </div>
              {booking.notes && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Notes: </span>
                  <span>{booking.notes}</span>
                </div>
              )}
              {booking.special_requirements && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Special Requirements: </span>
                  <span>{booking.special_requirements}</span>
                </div>
              )}
            </div>

            {/* Payment Information */}
            <div className="space-y-3">
              <h3 className="font-semibold">Payment & Total Cost</h3>
              <div className={`p-4 rounded-lg border ${
                booking.payment_method === 'cash' ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'
              }`}>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    {booking.payment_method === 'cash' ? (
                      <>
                        <Banknote className="h-4 w-4 text-amber-600" />
                        <span className="font-medium text-amber-900">Cash Payment</span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-900">Card Payment</span>
                      </>
                    )}
                  </div>
                  <span className={`text-2xl font-bold ${
                    booking.payment_method === 'cash' ? 'text-amber-900' : 'text-blue-900'
                  }`}>
                    €{booking.total_price.toFixed(2)}
                  </span>
                </div>
                <div className={`text-sm ${
                  booking.payment_method === 'cash' ? 'text-amber-700' : 'text-blue-700'
                }`}>
                  {booking.payment_method === 'cash' 
                    ? 'Payment will be collected by the driver at pickup'
                    : booking.payment_status === 'paid' 
                      ? 'Payment completed successfully'
                      : 'Payment will be processed online'
                  }
                </div>
              </div>
            </div>

            {booking.special_requirements && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Special Requirements</h4>
                  <p className="text-sm text-muted-foreground">{booking.special_requirements}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              What Happens Next?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm">
                  1
                </div>
                <div>
                  <div className="font-medium">Driver Assignment</div>
                  <div className="text-sm text-muted-foreground">
                    We'll assign a professional driver and send you their details 2 hours before pickup
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm">
                  2
                </div>
                <div>
                  <div className="font-medium">SMS Updates</div>
                  <div className="text-sm text-muted-foreground">
                    You'll receive SMS updates about your driver's arrival and any changes
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm">
                  3
                </div>
                <div>
                  <div className="font-medium">
                    {booking.payment_method === 'cash' ? 'Pickup & Payment' : 'Pickup & Transfer'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {booking.payment_method === 'cash' 
                      ? `Your driver will arrive at the scheduled time. Have €${booking.total_price.toFixed(2)} ready for payment`
                      : 'Your driver will arrive at the scheduled time for your confirmed transfer'
                    }
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/dashboard" className="flex-1">
            <Button className="w-full">
              View My Bookings
            </Button>
          </Link>
          <Link href="/book" className="flex-1">
            <Button variant="outline" className="w-full">
              Book Another Transfer
            </Button>
          </Link>
        </div>

        {/* Support Information */}
        <div className="mt-8 text-center">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600 mb-2">
              Need help or want to make changes to your booking?
            </div>
            <div className="text-sm font-medium text-gray-900">
              Call us at +371 2000 0000 or email support@baltfer.com
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Free cancellation up to 2 hours before pickup
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}