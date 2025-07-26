import { createServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Eye, Download, MapPin, Calendar, Users, CreditCard } from 'lucide-react'
import Link from 'next/link'

interface BookingsPageProps {
  searchParams: Promise<{
    status?: string
    payment_status?: string
    search?: string
  }>
}

export default async function BookingsPage({ searchParams }: BookingsPageProps) {
  const supabase = await createServerClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { status, payment_status, search } = await searchParams

  // Build query with filters
  let query = supabase
    .from('bookings')
    .select(`
      *,
      vehicle_types (
        name,
        max_passengers,
        max_luggage
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Apply filters
  if (status && status !== 'all') {
    query = query.eq('status', status)
  }
  
  if (payment_status && payment_status !== 'all') {
    query = query.eq('payment_status', payment_status)
  }

  if (search) {
    query = query.or(`pickup_address.ilike.%${search}%,destination_address.ilike.%${search}%`)
  }

  const { data: bookings, error } = await query

  if (error) {
    console.error('Error fetching bookings:', error)
  }

  const getStatusBadge = (status: string, paymentStatus: string) => {
    if (paymentStatus === 'paid' && status === 'confirmed') {
      return <Badge className="bg-green-500 text-white text-xs">Confirmed</Badge>
    } else if (status === 'completed') {
      return <Badge className="bg-blue-500 text-white text-xs">Completed</Badge>
    } else if (status === 'in_progress') {
      return <Badge className="bg-purple-500 text-white text-xs">In Progress</Badge>
    } else if (status === 'cancelled') {
      return <Badge variant="destructive" className="text-xs">Cancelled</Badge>
    } else {
      return <Badge variant="outline" className="text-xs">Pending</Badge>
    }
  }

  const getPaymentBadge = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'paid':
        return <Badge className="bg-green-500 text-white text-xs">Paid</Badge>
      case 'failed':
        return <Badge variant="destructive" className="text-xs">Failed</Badge>
      case 'refunded':
        return <Badge className="bg-orange-500 text-white text-xs">Refunded</Badge>
      default:
        return <Badge variant="outline" className="text-xs">Pending</Badge>
    }
  }

  const formatAddress = (address: string, maxLength = 35) => {
    return address.length > maxLength ? `${address.substring(0, maxLength)}...` : address
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link href="/dashboard" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">My Bookings</h1>
            <p className="text-gray-600">View and manage all your transfer bookings</p>
          </div>
          <Link href="/book">
            <Button>
              <CreditCard className="h-4 w-4 mr-2" />
              New Booking
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Filter Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Input
                placeholder="Search locations..."
                defaultValue={search}
                name="search"
              />
            </div>
            <div>
              <Select defaultValue={status || 'all'} name="status">
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select defaultValue={payment_status || 'all'} name="payment_status">
                <SelectTrigger>
                  <SelectValue placeholder="All Payments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Button type="submit" className="w-full">
                Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bookings List */}
      <div className="space-y-4">
        {bookings && bookings.length > 0 ? (
          bookings.map((booking) => {
            const departureDate = new Date(booking.departure_time)
            return (
              <Card key={booking.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Route and Date Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium">
                          {formatAddress(booking.pickup_address)}
                        </span>
                        <span className="text-gray-400">→</span>
                        <MapPin className="h-4 w-4 text-red-500" />
                        <span className="text-sm font-medium">
                          {formatAddress(booking.destination_address)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{departureDate.toLocaleDateString()}</span>
                          <span>{departureDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{booking.passenger_count} passengers</span>
                        </div>
                        <span>{booking.vehicle_types?.name}</span>
                      </div>
                    </div>

                    {/* Status and Price */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <div className="flex gap-2">
                        {getStatusBadge(booking.status, booking.payment_status)}
                        {getPaymentBadge(booking.payment_status)}
                      </div>
                      
                      <div className="text-right">
                        <div className="font-semibold text-lg">€{booking.total_price.toFixed(2)}</div>
                        <div className="text-xs text-gray-500">
                          {booking.distance_km} km • {booking.duration_minutes} min
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Link href={`/dashboard/booking/${booking.id}`}>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-1" />
                          Details
                        </Button>
                      </Link>
                      
                      {booking.payment_status === 'paid' && (
                        <a href={`/api/receipt/${booking.id}`} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="outline">
                            <Download className="h-4 w-4 mr-1" />
                            Receipt
                          </Button>
                        </a>
                      )}
                      
                      {booking.payment_status !== 'paid' && booking.status !== 'cancelled' && (
                        <Link href={`/payment/${booking.id}`}>
                          <Button size="sm">
                            Pay Now
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-gray-500 mb-4">
                {search || status !== 'all' || payment_status !== 'all' 
                  ? 'No bookings match your filters' 
                  : 'No bookings yet'
                }
              </div>
              <div className="space-y-2">
                {search || status !== 'all' || payment_status !== 'all' ? (
                  <Link href="/dashboard/bookings">
                    <Button variant="outline">Clear Filters</Button>
                  </Link>
                ) : (
                  <Link href="/book">
                    <Button>Book Your First Transfer</Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Summary Stats */}
      {bookings && bookings.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg">Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{bookings.length}</div>
                <div className="text-sm text-gray-600">Total Bookings</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {bookings.filter(b => b.payment_status === 'paid').length}
                </div>
                <div className="text-sm text-gray-600">Paid</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {bookings.filter(b => b.status === 'completed').length}
                </div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  €{bookings.filter(b => b.payment_status === 'paid')
                    .reduce((sum, b) => sum + b.total_price, 0).toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">Total Spent</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}