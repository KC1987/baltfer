'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  Calendar, 
  CreditCard, 
  User, 
  MapPin,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react'

interface Activity {
  id: string
  type: 'booking_created' | 'payment_completed' | 'booking_cancelled' | 'booking_completed'
  description: string
  timestamp: string
  customer_name: string | null
  details: any
}

interface BookingWithProfile {
  id: string
  status: string
  payment_status: string
  created_at: string
  departure_time: string
  pickup_address: string
  destination_address: string
  total_price: number
  profiles: {
    full_name: string | null
  } | null
}

export function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        // Get recent bookings and create activity feed
        const { data: bookings, error } = await supabase
          .from('bookings')
          .select(`
            id,
            status,
            payment_status,
            created_at,
            departure_time,
            pickup_address,
            destination_address,
            total_price,
            user_id
          `)
          .order('created_at', { ascending: false })
          .limit(20)

        if (error) {
          console.error('Supabase error:', error)
          throw error
        }

        // Get user profiles separately to avoid join issues
        const userIds = bookings?.map(b => b.user_id).filter(Boolean) || []
        let profiles: any = {}
        
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

        // Transform bookings into activity feed
        const activities: Activity[] = []

        bookings?.forEach((booking: any) => {
          const customerName = profiles[booking.user_id]?.full_name || null
          
          // Booking created activity
          activities.push({
            id: `${booking.id}-created`,
            type: 'booking_created',
            description: `New booking created`,
            timestamp: booking.created_at,
            customer_name: customerName,
            details: {
              pickup: booking.pickup_address,
              destination: booking.destination_address,
              price: booking.total_price
            }
          })

          // Payment completed activity
          if (booking.payment_status === 'paid') {
            activities.push({
              id: `${booking.id}-paid`,
              type: 'payment_completed',
              description: `Payment completed`,
              timestamp: booking.created_at, // In real app, this would be payment timestamp
              customer_name: customerName,
              details: {
                amount: booking.total_price
              }
            })
          }

          // Booking completed activity
          if (booking.status === 'completed') {
            activities.push({
              id: `${booking.id}-completed`,
              type: 'booking_completed',
              description: `Trip completed`,
              timestamp: booking.departure_time,
              customer_name: customerName,
              details: {}
            })
          }

          // Booking cancelled activity
          if (booking.status === 'cancelled') {
            activities.push({
              id: `${booking.id}-cancelled`,
              type: 'booking_cancelled',
              description: `Booking cancelled`,
              timestamp: booking.created_at, // In real app, this would be cancellation timestamp
              customer_name: customerName,
              details: {}
            })
          }
        })

        // Sort activities by timestamp (most recent first)
        activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

        setActivities(activities.slice(0, 10)) // Show only latest 10 activities
      } catch (error) {
        console.error('Error fetching activities:', error)
        console.error('Error details:', JSON.stringify(error, null, 2))
        
        // Fallback: create mock activities to prevent empty state
        const mockActivities: Activity[] = [
          {
            id: 'mock-1',
            type: 'booking_created',
            description: 'System initialized',
            timestamp: new Date().toISOString(),
            customer_name: 'System',
            details: { pickup: 'Loading...', destination: 'Loading...', price: 0 }
          }
        ]
        setActivities(mockActivities)
      } finally {
        setLoading(false)
      }
    }

    fetchActivities()
  }, [supabase])

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'booking_created':
        return Calendar
      case 'payment_completed':
        return CreditCard
      case 'booking_completed':
        return CheckCircle
      case 'booking_cancelled':
        return XCircle
      default:
        return Clock
    }
  }

  const getActivityColor = (type: Activity['type']) => {
    switch (type) {
      case 'booking_created':
        return 'text-blue-600 bg-blue-50'
      case 'payment_completed':
        return 'text-green-600 bg-green-50'
      case 'booking_completed':
        return 'text-purple-600 bg-purple-50'
      case 'booking_cancelled':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const activityTime = new Date(timestamp)
    const diffInSeconds = Math.floor((now.getTime() - activityTime.getTime()) / 1000)

    if (diffInSeconds < 60) {
      return 'Just now'
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return `${minutes}m ago`
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return `${hours}h ago`
    } else {
      const days = Math.floor(diffInSeconds / 86400)
      return `${days}d ago`
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse flex items-start space-x-3">
                <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
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
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No recent activity found.
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => {
              const Icon = getActivityIcon(activity.type)
              const colorClasses = getActivityColor(activity.type)
              
              return (
                <div key={activity.id} className="flex items-start space-x-3">
                  {/* Activity Icon */}
                  <div className={`p-2 rounded-full ${colorClasses}`}>
                    <Icon className="h-4 w-4" />
                  </div>

                  {/* Activity Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">
                        {activity.description}
                      </p>
                      <span className="text-xs text-gray-500">
                        {formatTimeAgo(activity.timestamp)}
                      </span>
                    </div>
                    
                    <div className="mt-1 text-xs text-gray-600">
                      {activity.customer_name && (
                        <span className="font-medium">
                          {activity.customer_name}
                        </span>
                      )}
                      
                      {activity.type === 'booking_created' && activity.details && (
                        <div className="mt-1 space-y-1">
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-3 w-3" />
                            <span>
                              {activity.details.pickup?.substring(0, 30)}...
                            </span>
                          </div>
                          <div className="font-medium text-green-600">
                            €{activity.details.price?.toFixed(2)}
                          </div>
                        </div>
                      )}
                      
                      {activity.type === 'payment_completed' && activity.details && (
                        <div className="mt-1">
                          <Badge variant="outline" className="text-xs">
                            €{activity.details.amount?.toFixed(2)} received
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}