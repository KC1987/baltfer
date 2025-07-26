'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface ChartData {
  date: string
  bookings: number
  revenue: number
}

export function AnalyticsChart() {
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState<'week' | 'month'>('week')
  const supabase = createClient()

  useEffect(() => {
    let isMounted = true

    const fetchChartData = async () => {
      try {
        const now = new Date()
        const days = timeframe === 'week' ? 7 : 30
        const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

        const { data, error } = await supabase
          .from('bookings')
          .select('created_at, total_price, payment_status')
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: true })

        if (error) throw error
        if (!isMounted) return

        // Group data by date
        const groupedData: { [key: string]: { bookings: number; revenue: number } } = {}
        
        // Initialize all dates with zero values
        for (let i = 0; i < days; i++) {
          const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
          const dateKey = date.toISOString().split('T')[0]
          groupedData[dateKey] = { bookings: 0, revenue: 0 }
        }

        // Populate with actual data
        data?.forEach(booking => {
          const date = new Date(booking.created_at).toISOString().split('T')[0]
          if (groupedData[date]) {
            groupedData[date].bookings += 1
            if (booking.payment_status === 'paid') {
              groupedData[date].revenue += booking.total_price
            }
          }
        })

        const chartData = Object.entries(groupedData).map(([date, values]) => ({
          date,
          bookings: values.bookings,
          revenue: values.revenue
        }))

        if (isMounted) {
          setChartData(chartData)
        }
      } catch (error) {
        console.error('Error fetching chart data:', error)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchChartData()

    return () => {
      isMounted = false
    }
  }, [timeframe, supabase])

  const maxBookings = Math.max(...chartData.map(d => d.bookings), 1)
  const maxRevenue = Math.max(...chartData.map(d => d.revenue), 1)
  const totalBookings = chartData.reduce((sum, d) => sum + d.bookings, 0)
  const totalRevenue = chartData.reduce((sum, d) => sum + d.revenue, 0)

  // Calculate trends (comparing first half vs second half)
  const mid = Math.floor(chartData.length / 2)
  const firstHalfBookings = chartData.slice(0, mid).reduce((sum, d) => sum + d.bookings, 0)
  const secondHalfBookings = chartData.slice(mid).reduce((sum, d) => sum + d.bookings, 0)
  const bookingsTrend = firstHalfBookings > 0 
    ? ((secondHalfBookings - firstHalfBookings) / firstHalfBookings) * 100 
    : 0

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analytics Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-48 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Analytics Overview</CardTitle>
        <div className="flex space-x-2">
          <button
            onClick={() => setTimeframe('week')}
            className={`px-3 py-1 text-xs rounded ${
              timeframe === 'week' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            7 Days
          </button>
          <button
            onClick={() => setTimeframe('month')}
            className={`px-3 py-1 text-xs rounded ${
              timeframe === 'month' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            30 Days
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="text-2xl font-bold">{totalBookings}</div>
              <div className="flex items-center space-x-1 text-sm text-gray-600">
                <span>Total Bookings</span>
                {bookingsTrend !== 0 && (
                  <Badge 
                    variant={bookingsTrend > 0 ? "default" : "destructive"}
                    className="text-xs"
                  >
                    {bookingsTrend > 0 ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {Math.abs(bookingsTrend).toFixed(1)}%
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="text-2xl font-bold">€{totalRevenue.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Total Revenue</div>
            </div>
          </div>

          {/* Simple Bar Chart */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Daily Bookings</h4>
            <div className="flex items-end space-x-1 h-32">
              {chartData.map((data, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full bg-primary rounded-t min-h-[4px] transition-all hover:bg-primary/80"
                    style={{ 
                      height: `${(data.bookings / maxBookings) * 100}%` 
                    }}
                    title={`${data.bookings} bookings on ${new Date(data.date).toLocaleDateString()}`}
                  />
                  <div className="text-xs text-gray-500 mt-1 transform -rotate-45 origin-top-left">
                    {new Date(data.date).toLocaleDateString([], { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Revenue Chart */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Daily Revenue</h4>
            <div className="flex items-end space-x-1 h-20">
              {chartData.map((data, index) => (
                <div key={index} className="flex-1">
                  <div 
                    className="w-full bg-green-500 rounded-t min-h-[2px] transition-all hover:bg-green-400"
                    style={{ 
                      height: `${(data.revenue / maxRevenue) * 100}%` 
                    }}
                    title={`€${data.revenue.toFixed(2)} revenue on ${new Date(data.date).toLocaleDateString()}`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}