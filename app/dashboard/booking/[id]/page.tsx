import { createServerClient } from '@/lib/supabase-server'
import { redirect, notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, MapPin, Calendar, Clock, Users, Luggage, CreditCard, Phone, User } from 'lucide-react'
import Link from 'next/link'
import { DownloadReceiptButton } from '@/components/booking/download-receipt-button'

interface BookingDetailsPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function BookingDetailsPage({ params }: BookingDetailsPageProps) {
  const { id } = await params
  const supabase = await createServerClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Fetch booking details with related data
  const { data: booking, error } = await supabase
    .from('bookings')
    .select(`
      *,
      vehicle_types (
        id,
        name,
        description,
        max_passengers,
        max_luggage,
        base_price,
        price_per_km
      )
    `)
    .eq('id', id)
    .eq('user_id', user.id) // Ensure user can only view their own bookings
    .single()

  // Fetch user profile separately
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, phone')
    .eq('id', user.id)
    .single()

  // Fetch driver assignments separately if needed
  const { data: driverAssignments } = await supabase
    .from('driver_assignments')
    .select(`
      id,
      assigned_at,
      status,
      drivers (
        user_id,
        license_number
      )
    `)
    .eq('booking_id', id)

  if (error || !booking) {
    notFound()
  }

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime)
    return {
      date: date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      })
    }
  }

  const getStatusBadge = (status: string, paymentStatus: string) => {
    if (paymentStatus === 'paid' && status === 'confirmed') {
      return <Badge className="bg-green-500 text-white">Confirmed</Badge>
    } else if (status === 'completed') {
      return <Badge className="bg-blue-500 text-white">Completed</Badge>
    } else if (status === 'in_progress') {
      return <Badge className="bg-purple-500 text-white">In Progress</Badge>
    } else if (status === 'cancelled') {
      return <Badge variant="destructive">Cancelled</Badge>
    } else {
      return <Badge variant="outline">Pending</Badge>
    }
  }

  const getPaymentBadge = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'paid':
        return <Badge className="bg-green-500 text-white">Paid</Badge>
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>
      case 'refunded':
        return <Badge className="bg-orange-500 text-white">Refunded</Badge>
      default:
        return <Badge variant="outline">Pending</Badge>
    }
  }

  const datetime = formatDateTime(booking.departure_time)
  const assignedDriver = driverAssignments?.[0]

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Link href="/dashboard" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Booking Details</h1>
            <p className="text-gray-600">Booking ID: {booking.id.substring(0, 8)}...</p>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(booking.status, booking.payment_status)}
            {getPaymentBadge(booking.payment_status)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Route Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Route Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-3 w-3 rounded-full bg-green-500 mt-1 flex-shrink-0"></div>
                  <div>
                    <div className="font-medium">Pickup Location</div>
                    <div className="text-sm text-gray-600">{booking.pickup_address}</div>
                  </div>
                </div>
                <div className="ml-6 border-l-2 border-dashed border-gray-300 h-6"></div>
                <div className="flex items-start gap-3">
                  <div className="h-3 w-3 rounded-full bg-red-500 mt-1 flex-shrink-0"></div>
                  <div>
                    <div className="font-medium">Destination</div>
                    <div className="text-sm text-gray-600">{booking.destination_address}</div>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Distance:</span>
                  <span className="ml-2 font-medium">{booking.distance_km} km</span>
                </div>
                <div>
                  <span className="text-gray-600">Duration:</span>
                  <span className="ml-2 font-medium">{booking.duration_minutes} min</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Schedule Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="font-medium">{datetime.date}</div>
                    <div className="text-sm text-gray-600">Departure Date</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="font-medium">{datetime.time}</div>
                    <div className="text-sm text-gray-600">Departure Time</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vehicle & Passenger Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Booking Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="font-medium">Vehicle Type</div>
                  <div className="text-sm text-gray-600">{booking.vehicle_types?.name}</div>
                  {booking.vehicle_types?.description && (
                    <div className="text-xs text-gray-500 mt-1">{booking.vehicle_types.description}</div>
                  )}
                </div>
                <div>
                  <div className="font-medium">Capacity</div>
                  <div className="text-sm text-gray-600">
                    Up to {booking.vehicle_types?.max_passengers} passengers
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="font-medium">{booking.passenger_count}</div>
                    <div className="text-gray-600">Passengers</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Luggage className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="font-medium">{booking.luggage_count}</div>
                    <div className="text-gray-600">Bags</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="font-medium">€{booking.total_price.toFixed(2)}</div>
                    <div className="text-gray-600">Total</div>
                  </div>
                </div>
              </div>

              {booking.special_requirements && (
                <>
                  <Separator />
                  <div>
                    <div className="font-medium mb-2">Special Requirements</div>
                    <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                      {booking.special_requirements}
                    </div>
                  </div>
                </>
              )}

              {booking.notes && (
                <>
                  <Separator />
                  <div>
                    <div className="font-medium mb-2">Additional Notes</div>
                    <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                      {booking.notes}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="font-medium">{profile?.full_name || 'N/A'}</div>
                <div className="text-sm text-gray-600">{user.email}</div>
              </div>
              {profile?.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{profile.phone}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Driver Information */}
          {assignedDriver ? (
            <Card>
              <CardHeader>
                <CardTitle>Assigned Driver</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="font-medium">
                    Driver Assigned
                  </div>
                  <div className="text-sm text-gray-600">
                    License: N/A
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  Assigned: {new Date(assignedDriver.assigned_at).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Driver Assignment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <div className="text-gray-500 mb-2">No driver assigned yet</div>
                  <div className="text-xs text-gray-400">
                    A driver will be assigned closer to your departure time
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {booking.payment_status === 'paid' && (
                <DownloadReceiptButton 
                  bookingId={booking.id} 
                  variant="outline"
                  size="default"
                />
              )}
              
              {booking.payment_status !== 'paid' && booking.status !== 'cancelled' && (
                <Link href={`/payment/${booking.id}`} className="block">
                  <Button className="w-full">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Complete Payment
                  </Button>
                </Link>
              )}
              
              {booking.status === 'pending' && booking.payment_status !== 'paid' && (
                <Button variant="outline" className="w-full text-red-600 hover:text-red-700">
                  Cancel Booking
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Booking Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <div>
                    <div className="font-medium">Booking Created</div>
                    <div className="text-gray-600">
                      {new Date(booking.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                
                {booking.payment_status === 'paid' && (
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                    <div>
                      <div className="font-medium">Payment Completed</div>
                      <div className="text-gray-600">Paid</div>
                    </div>
                  </div>
                )}
                
                {assignedDriver && (
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                    <div>
                      <div className="font-medium">Driver Assigned</div>
                      <div className="text-gray-600">
                        {new Date(assignedDriver.assigned_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-gray-300"></div>
                  <div>
                    <div className="font-medium">Transfer Date</div>
                    <div className="text-gray-600">{datetime.date}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}