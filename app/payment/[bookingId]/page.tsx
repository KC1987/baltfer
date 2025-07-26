import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase-server'
import { PaymentPageClient } from '@/components/payment/payment-page-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, AlertTriangle } from 'lucide-react'

interface PaymentPageProps {
  params: Promise<{
    bookingId: string
  }>
}

export default async function PaymentPage({ params }: PaymentPageProps) {
  const resolvedParams = await params
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
    .eq('id', resolvedParams.bookingId)
    .eq('user_id', user.id)
    .single()

  if (error || !booking) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Booking Not Found
              </CardTitle>
              <CardDescription>
                The booking you&apos;re trying to pay for could not be found.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  This booking may not exist, may not belong to your account, or may have already been paid for.
                </p>
                <div className="flex gap-4">
                  <Link href="/dashboard">
                    <Button>
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Dashboard
                    </Button>
                  </Link>
                  <Link href="/book">
                    <Button variant="outline">
                      Book New Transfer
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Check if booking is already paid
  if (booking.payment_status === 'paid') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Payment Already Completed
              </CardTitle>
              <CardDescription>
                This booking has already been paid for.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Your payment for this transfer booking has already been processed successfully.
                </p>
                <div className="flex gap-4">
                  <Link href="/dashboard">
                    <Button>
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      View Booking Details
                    </Button>
                  </Link>
                  <Link href="/book">
                    <Button variant="outline">
                      Book Another Transfer
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Check if booking is cancelled
  if (booking.status === 'cancelled') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Booking Cancelled
              </CardTitle>
              <CardDescription>
                This booking has been cancelled and cannot be paid for.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  If you cancelled this booking by mistake, please create a new booking.
                </p>
                <div className="flex gap-4">
                  <Link href="/dashboard">
                    <Button>
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Dashboard
                    </Button>
                  </Link>
                  <Link href="/book">
                    <Button variant="outline">
                      Book New Transfer
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return <PaymentPageClient booking={booking} />
}