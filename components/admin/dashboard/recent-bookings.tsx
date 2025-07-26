'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  Calendar, 
  MapPin, 
  Users, 
  ArrowRight,
  Eye,
  MoreHorizontal
} from 'lucide-react'
import Link from 'next/link'

interface RecentBooking {
  id: string
  pickup_address: string
  destination_address: string
  departure_time: string
  passenger_count: number
  total_price: number
  status: string
  payment_status: string
  profiles: {
    full_name: string | null
  } | null
  vehicle_types: {
    name: string
  } | null
}

export function RecentBookings() {
  const [bookings, setBookings] = useState<RecentBooking[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchRecentBookings = async () => {
      try {
        const { data: bookingsData, error } = await supabase
          .from('bookings')
          .select(`
            id,
            pickup_address,
            destination_address,
            departure_time,
            passenger_count,
            total_price,
            status,
            payment_status,
            user_id,
            vehicle_type_id
          `)
          .order('created_at', { ascending: false })
          .limit(8)

        if (error) {
          console.error('Supabase bookings error:', error)
          throw error
        }

        if (!bookingsData || bookingsData.length === 0) {
          setBookings([])
          return
        }

        // Get user profiles separately
        const userIds = bookingsData.map(b => b.user_id).filter(Boolean)
        const vehicleTypeIds = bookingsData.map(b => b.vehicle_type_id).filter(Boolean)
        
        let profiles: any = {}
        let vehicleTypes: any = {}

        // Fetch profiles
        if (userIds.length > 0) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', userIds)
          
          if (profileData) {
            profiles = profileData.reduce((acc: any, profile: any) => {
              acc[profile.id] = profile
              return acc
            }, {})
          }
        }

        // Fetch vehicle types
        if (vehicleTypeIds.length > 0) {
          const { data: vehicleData } = await supabase
            .from('vehicle_types')
            .select('id, name')
            .in('id', vehicleTypeIds)
          
          if (vehicleData) {
            vehicleTypes = vehicleData.reduce((acc: any, vehicle: any) => {
              acc[vehicle.id] = vehicle
              return acc
            }, {})
          }
        }

        // Combine the data
        const enrichedBookings = bookingsData.map((booking: any) => ({
          ...booking,
          profiles: profiles[booking.user_id] || null,
          vehicle_types: vehicleTypes[booking.vehicle_type_id] || null
        }))

        setBookings(enrichedBookings)
      } catch (error) {
        console.error('Error fetching recent bookings:', error)
        console.error('Error details:', JSON.stringify(error, null, 2))
        setBookings([]) // Set empty array on error
      } finally {
        setLoading(false)
      }
    }

    fetchRecentBookings()
  }, [supabase])

  const getStatusBadge = (status: string, paymentStatus: string) => {
    if (paymentStatus === 'paid' && status === 'confirmed') {
      return <Badge className="bg-green-100 text-green-800">Confirmed</Badge>
    } else if (status === 'completed') {
      return <Badge className="bg-blue-100 text-blue-800">Completed</Badge>
    } else if (status === 'in_progress') {
      return <Badge className="bg-purple-100 text-purple-800">In Progress</Badge>
    } else if (status === 'cancelled') {
      return <Badge variant="destructive">Cancelled</Badge>
    } else {
      return <Badge variant="outline">Pending</Badge>
    }
  }

  const formatAddress = (address: string) => {
    return address.length > 40 ? `${address.substring(0, 40)}...` : address
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-4">
                  <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Bookings</CardTitle>
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/bookings">
            View All
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {bookings.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No recent bookings found.
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div 
                key={booking.id} 
                className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                {/* Customer Avatar */}
                <Avatar>
                  <AvatarFallback>
                    {booking.profiles?.full_name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                  </AvatarFallback>
                </Avatar>

                {/* Booking Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm">
                      {booking.profiles?.full_name || 'Unknown Customer'}
                    </h4>
                    {getStatusBadge(booking.status, booking.payment_status)}
                  </div>
                  
                  <div className="space-y-1 text-xs text-gray-600">
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-3 w-3" />
                      <span>{formatAddress(booking.pickup_address)}</span>
                      <ArrowRight className="h-3 w-3" />
                      <span>{formatAddress(booking.destination_address)}</span>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {new Date(booking.departure_time).toLocaleDateString()} at{' '}
                          {new Date(booking.departure_time).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <Users className="h-3 w-3" />
                        <span>{booking.passenger_count} passenger{booking.passenger_count !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">
                        {booking.vehicle_types?.name || 'Unknown Vehicle'}
                      </span>
                      <span className="font-medium text-green-600">
                        €{booking.total_price.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/admin/bookings/${booking.id}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}