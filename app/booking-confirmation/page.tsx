import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Calendar, MapPin, Car, Users, Clock, ArrowRight } from 'lucide-react'

export default function BookingConfirmationPage() {
  // In a real app, you would get the booking details from the URL params or API
  const bookingDetails = {
    id: 'BK-2024-001',
    pickup: {
      address: 'Baltimore/Washington International Airport',
      time: '2024-01-25 14:30'
    },
    destination: {
      address: '123 Main St, Baltimore, MD 21201'
    },
    vehicle: {
      name: 'Premium Sedan',
      passengers: 4,
      luggage: 3
    },
    passengers: 2,
    totalPrice: 89.50,
    status: 'confirmed'
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
              Confirmation #{bookingDetails.id}
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
                      {bookingDetails.pickup.address}
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      {new Date(bookingDetails.pickup.time).toLocaleString()}
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground mt-2" />
                  <div className="flex-1">
                    <div className="font-medium text-sm">Destination</div>
                    <div className="text-sm text-muted-foreground">
                      {bookingDetails.destination.address}
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
                  <div className="font-medium">{bookingDetails.vehicle.name}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Passengers</div>
                  <div className="font-medium">{bookingDetails.passengers} of {bookingDetails.vehicle.passengers}</div>
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="space-y-3">
              <h3 className="font-semibold">Total Cost</h3>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex justify-between items-center">
                  <span className="text-blue-900 font-medium">Total Amount</span>
                  <span className="text-2xl font-bold text-blue-900">
                    ${bookingDetails.totalPrice.toFixed(2)}
                  </span>
                </div>
                <div className="text-sm text-blue-700 mt-1">
                  Payment will be collected after your trip
                </div>
              </div>
            </div>
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
                    We&apos;ll assign a professional driver and send you their details 2 hours before pickup
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
                    You&apos;ll receive SMS updates about your driver&apos;s arrival and any changes
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm">
                  3
                </div>
                <div>
                  <div className="font-medium">Pickup & Payment</div>
                  <div className="text-sm text-muted-foreground">
                    Your driver will arrive at the scheduled time. Payment is collected after the trip
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
              Call us at (555) 123-4567 or email support@baltfer.com
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