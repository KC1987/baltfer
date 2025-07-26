import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase-server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TestWebhookButton } from '@/components/admin/test-webhook-button'
import { Zap, TestTube } from 'lucide-react'

export default async function TestWebhookPage() {
  const supabase = await createServerClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard')
  }

  // Get most recent booking for preview
  const { data: recentBooking } = await supabase
    .from('bookings')
    .select(`
      id,
      pickup_address,
      destination_address,
      departure_time,
      total_price,
      payment_status,
      status
    `)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Zap className="h-8 w-8 text-sky-500" />
          <h1 className="text-3xl font-bold">Test Webhook SMS</h1>
        </div>
        <p className="text-gray-600">
          Test the Stripe webhook SMS notification with real booking data
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Test Webhook Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              Webhook Simulation
            </CardTitle>
            <CardDescription>
              Test SMS notification using your most recent booking
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentBooking ? (
              <>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm space-y-2">
                    <div><strong>Booking ID:</strong> {recentBooking.id.slice(-8).toUpperCase()}</div>
                    <div><strong>From:</strong> {recentBooking.pickup_address}</div>
                    <div><strong>To:</strong> {recentBooking.destination_address}</div>
                    <div><strong>Total:</strong> €{recentBooking.total_price}</div>
                    <div><strong>Status:</strong> {recentBooking.payment_status} / {recentBooking.status}</div>
                  </div>
                </div>
                
                <TestWebhookButton />
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No bookings found to test with.</p>
                <p className="text-sm mt-2">Create a booking first, then return here to test.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* What This Tests */}
        <Card>
          <CardHeader>
            <CardTitle>What This Tests</CardTitle>
            <CardDescription>
              This simulates exactly what happens when Stripe webhook triggers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm">
                  1
                </div>
                <div>
                  <div className="font-medium">Get Booking Data</div>
                  <div className="text-sm text-gray-600">
                    Fetch booking details from database
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm">
                  2
                </div>
                <div>
                  <div className="font-medium">Get Customer Info</div>
                  <div className="text-sm text-gray-600">
                    Lookup customer name and vehicle type
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm">
                  3
                </div>
                <div>
                  <div className="font-medium">Send SMS</div>
                  <div className="text-sm text-gray-600">
                    Call Edge Function to send notification
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm">
                  4
                </div>
                <div>
                  <div className="font-medium">Log Result</div>
                  <div className="text-sm text-gray-600">
                    Record notification in admin_notifications table
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>Success:</strong> If this works, your webhook integration is fully functional!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}