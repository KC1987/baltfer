import { createServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Eye, Download } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createServerClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select(`
      *,
      vehicle_types (
        name,
        max_passengers
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  if (bookingsError) {
    console.error('Error fetching bookings:', bookingsError)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Welcome back, {profile?.full_name || user.email}</h1>
        <p className="text-gray-600 mt-2">Manage your transfers and bookings</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Book your next transfer</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/book">
              <Button className="w-full">Book New Transfer</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Bookings</CardTitle>
            <CardDescription>All time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookings?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Status</CardTitle>
            <CardDescription>Your membership</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Active</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Bookings</CardTitle>
              <CardDescription>Your latest transfer bookings</CardDescription>
            </div>
            {bookings && bookings.length > 0 && (
              <Link href="/dashboard/bookings">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {bookings && bookings.length > 0 ? (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-semibold">
                      {booking.pickup_address} → {booking.destination_address}
                    </div>
                    <div className="text-sm text-gray-600">
                      {new Date(booking.departure_time).toLocaleDateString()} at{' '}
                      {new Date(booking.departure_time).toLocaleTimeString()}
                    </div>
                    <div className="text-sm text-gray-600">
                      Vehicle: {booking.vehicle_types?.name} • Status: {booking.status}
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    <div className="font-semibold">€{booking.total_price.toFixed(2)}</div>
                    <div className="flex gap-1 justify-end">
                      <Badge variant={
                        booking.payment_status === 'paid' ? 'default' : 
                        booking.payment_status === 'pending' ? 'secondary' : 'destructive'
                      } className="text-xs">
                        {booking.payment_status === 'paid' ? 'Paid' : 
                         booking.payment_status === 'pending' ? 'Pending' : 'Failed'}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {booking.status}
                      </Badge>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Link href={`/dashboard/booking/${booking.id}`}>
                        <Button size="sm" variant="outline" className="text-xs">
                          <Eye className="h-3 w-3 mr-1" />
                          Details
                        </Button>
                      </Link>
                      {booking.payment_status === 'paid' && (
                        <a href={`/api/receipt/${booking.id}`} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="outline" className="text-xs">
                            <Download className="h-3 w-3 mr-1" />
                            Receipt
                          </Button>
                        </a>
                      )}
                      {booking.payment_status !== 'paid' && booking.status !== 'cancelled' && (
                        <Link href={`/payment/${booking.id}`}>
                          <Button size="sm" className="text-xs">
                            Pay Now
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">No bookings yet</p>
              <Link href="/book">
                <Button>Book Your First Transfer</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}