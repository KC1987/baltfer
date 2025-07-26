'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  DollarSign, 
  Calendar, 
  Users, 
  TrendingUp,
  Clock,
  CheckCircle
} from 'lucide-react'

interface Metrics {
  totalRevenue: number
  totalBookings: number
  activeCustomers: number
  pendingBookings: number
  completedToday: number
  revenueGrowth: number
}

export function DashboardMetrics() {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const today = new Date()
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
        const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1)
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0)

        // Get total revenue
        const { data: revenueData } = await supabase
          .from('bookings')
          .select('total_price')
          .eq('payment_status', 'paid')

        const totalRevenue = revenueData?.reduce((sum, booking) => sum + booking.total_price, 0) || 0

        // Get this month's revenue
        const { data: thisMonthRevenue } = await supabase
          .from('bookings')
          .select('total_price')
          .eq('payment_status', 'paid')
          .gte('created_at', monthStart.toISOString())

        const thisMonthTotal = thisMonthRevenue?.reduce((sum, booking) => sum + booking.total_price, 0) || 0

        // Get last month's revenue
        const { data: lastMonthRevenue } = await supabase
          .from('bookings')
          .select('total_price')
          .eq('payment_status', 'paid')
          .gte('created_at', lastMonthStart.toISOString())
          .lte('created_at', lastMonthEnd.toISOString())

        const lastMonthTotal = lastMonthRevenue?.reduce((sum, booking) => sum + booking.total_price, 0) || 0

        // Calculate revenue growth
        const revenueGrowth = lastMonthTotal > 0 
          ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 
          : 0

        // Get total bookings
        const { count: totalBookings } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })

        // Get active customers (customers with bookings in last 30 days)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        const { data: activeCustomersData } = await supabase
          .from('bookings')
          .select('user_id')
          .gte('created_at', thirtyDaysAgo.toISOString())

        const uniqueCustomers = new Set(activeCustomersData?.map(b => b.user_id))
        const activeCustomers = uniqueCustomers.size

        // Get pending bookings
        const { count: pendingBookings } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending')

        // Get completed bookings today
        const { count: completedToday } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'completed')
          .gte('departure_time', todayStart.toISOString())

        setMetrics({
          totalRevenue,
          totalBookings: totalBookings || 0,
          activeCustomers,
          pendingBookings: pendingBookings || 0,
          completedToday: completedToday || 0,
          revenueGrowth
        })
      } catch (error) {
        console.error('Error fetching metrics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
  }, [supabase])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const metricCards = [
    {
      title: 'Total Revenue',
      value: `€${metrics?.totalRevenue.toLocaleString() || 0}`,
      icon: DollarSign,
      change: metrics?.revenueGrowth,
      changeLabel: 'from last month',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Total Bookings',
      value: metrics?.totalBookings.toLocaleString() || '0',
      icon: Calendar,
      change: null,
      changeLabel: 'all time',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Active Customers',
      value: metrics?.activeCustomers.toLocaleString() || '0',
      icon: Users,
      change: null,
      changeLabel: 'last 30 days',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Pending Bookings',
      value: metrics?.pendingBookings.toLocaleString() || '0',
      icon: Clock,
      change: null,
      changeLabel: 'require attention',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'Completed Today',
      value: metrics?.completedToday.toLocaleString() || '0',
      icon: CheckCircle,
      change: null,
      changeLabel: 'today',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Growth Rate',
      value: `${metrics?.revenueGrowth.toFixed(1) || 0}%`,
      icon: TrendingUp,
      change: metrics?.revenueGrowth,
      changeLabel: 'revenue growth',
      color: (metrics?.revenueGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor: (metrics?.revenueGrowth || 0) >= 0 ? 'bg-green-50' : 'bg-red-50'
    }
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
      {metricCards.map((metric, index) => {
        const Icon = metric.icon
        return (
          <Card 
            key={index} 
            className="hover:shadow-lg transition-all duration-200 border-0 shadow-sm bg-white/80 backdrop-blur-sm"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-4 lg:px-6 pt-3 sm:pt-4 lg:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600 leading-tight">
                {metric.title}
              </CardTitle>
              <div className={`p-1.5 sm:p-2 rounded-lg ${metric.bgColor} shadow-sm`}>
                <Icon className={`h-3 w-3 sm:h-4 sm:w-4 ${metric.color}`} />
              </div>
            </CardHeader>
            <CardContent className="px-3 sm:px-4 lg:px-6 pb-3 sm:pb-4 lg:pb-6">
              <div className="space-y-1">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 leading-tight">
                  {metric.value}
                </div>
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  {metric.change !== null && metric.change !== undefined && (
                    <Badge 
                      variant={metric.change >= 0 ? "default" : "destructive"}
                      className="text-xs px-1.5 py-0.5 font-medium"
                    >
                      {metric.change >= 0 ? '+' : ''}{metric.change.toFixed(1)}%
                    </Badge>
                  )}
                  <span className="text-xs leading-tight">{metric.changeLabel}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}