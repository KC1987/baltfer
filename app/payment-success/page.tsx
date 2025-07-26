import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase-server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import { CheckCircle, Calendar, MapPin, Car, CreditCard, ArrowRight } from 'lucide-react'
import { formatCurrency, calculateVATFromTotal } from '@/lib/stripe'
import { DownloadReceiptButton } from '@/components/booking/download-receipt-button'

interface PaymentSuccessPageProps {
  searchParams: Promise<{
    booking_id?: string
    payment_intent?: string
  }>
}

export default async function PaymentSuccessPage({ searchParams }: PaymentSuccessPageProps) {
  const resolvedSearchParams = await searchParams
  if (!resolvedSearchParams.booking_id) {
    redirect('/dashboard')
  }

  const supabase = await createServerClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Get booking details
  const { data: booking, error } = await supabase
    .from('bookings')
    .select(`
      *,
      vehicle_types (
        name,
        max_passengers,
        max_luggage
      )
    `)
    .eq('id', resolvedSearchParams.booking_id)
    .eq('user_id', user.id)
    .single()

  if (error || !booking) {
    redirect('/dashboard')
  }

  // Calculate VAT breakdown
  const vatBreakdown = calculateVATFromTotal(booking.total_price)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Payment Successful!
          </h1>
          <p className="text-lg text-gray-600">
            Your transfer has been booked and payment confirmed
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Badge variant="outline" className="text-green-700 border-green-300">
              Booking #{booking.id.slice(-8).toUpperCase()}
            </Badge>
            {resolvedSearchParams.payment_intent && (
              <Badge variant="secondary">
                Payment #{resolvedSearchParams.payment_intent.slice(-8).toUpperCase()}
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Booking Details */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Booking Details
                </CardTitle>
                <CardDescription>
                  Your confirmed transfer information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Route Information */}
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Route
                  </h3>
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="space-y-2">
                      <div>
                        <div className="font-medium text-sm">Pickup</div>
                        <div className="text-sm text-muted-foreground">
                          {booking.pickup_address}
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium text-sm">Destination</div>
                        <div className="text-sm text-muted-foreground">
                          {booking.destination_address}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Vehicle & Schedule */}
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Car className="h-4 w-4" />
                    Vehicle & Schedule
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Vehicle Type</div>
                      <div className="font-medium">{booking.vehicle_types.name}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Passengers</div>
                      <div className="font-medium">{booking.passenger_count}</div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-muted-foreground">Departure Time</div>
                      <div className="font-medium">
                        {new Date(booking.departure_time).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Information */}
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Payment
                  </h3>
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-green-700">Subtotal</span>
                      <span className="text-green-700">{formatCurrency(vatBreakdown.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-green-700">VAT (21%)</span>
                      <span className="text-green-700">{formatCurrency(vatBreakdown.vatAmount)}</span>
                    </div>
                    <Separator className="bg-green-200" />
                    <div className="flex justify-between items-center">
                      <span className="text-green-900 font-medium">Total Paid</span>
                      <span className="text-2xl font-bold text-green-900">
                        {formatCurrency(booking.total_price)}
                      </span>
                    </div>
                    <div className="text-sm text-green-700 mt-1">
                      Payment Status: {booking.payment_status === 'paid' ? 'Completed' : 'Processing'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Next Steps */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
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
                        We&apos;ll assign a professional driver and send you their details 2 hours before pickup
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm">
                      2
                    </div>
                    <div>
                      <div className="font-medium">Confirmation Email</div>
                      <div className="text-sm text-muted-foreground">
                        Check your email for booking confirmation and receipt
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm">
                      3
                    </div>
                    <div>
                      <div className="font-medium">SMS Updates</div>
                      <div className="text-sm text-muted-foreground">
                        You&apos;ll receive SMS updates about your driver&apos;s arrival
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm">
                      4
                    </div>
                    <div>
                      <div className="font-medium">Day of Travel</div>
                      <div className="text-sm text-muted-foreground">
                        Your driver will arrive at the scheduled time for pickup
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-4">
              <Link href={`/bookings/${booking.id}`} className="block">
                <Button className="w-full" size="lg">
                  View Booking Details
                </Button>
              </Link>
              
              <div className="grid grid-cols-2 gap-4">
                <Link href="/dashboard">
                  <Button variant="outline" className="w-full">
                    My Dashboard
                  </Button>
                </Link>
                <Link href="/book">
                  <Button variant="outline" className="w-full">
                    Book Another
                  </Button>
                </Link>
              </div>

              <DownloadReceiptButton bookingId={booking.id} />
            </div>
          </div>
        </div>

        {/* Support Information */}
        <div className="mt-8">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-2">
                  Need help or want to make changes to your booking?
                </div>
                <div className="text-sm font-medium text-gray-900">
                  Call us at (555) 123-4567 or email support@baltfer.com
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Free cancellation up to 2 hours before pickup
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}