'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  MoreHorizontal,
  Eye,
  Edit,
  UserPlus,
  MapPin,
  Calendar,
  Users,
  Clock,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Link from 'next/link'

interface Booking {
  id: string
  pickup_address: string
  destination_address: string
  departure_time: string
  passenger_count: number
  total_price: number
  status: string
  payment_status: string
  notes: string | null
  created_at: string
  profiles: {
    full_name: string | null
    email: string
    phone: string | null
  } | null
  vehicle_types: {
    name: string
  } | null
  driver_assignments: Array<{
    drivers: {
      full_name: string
      phone: string | null
    } | null
  }> | null
}

interface BookingsTableProps {
  filters?: {
    search: string
    status: string
    paymentStatus: string
    dateFrom: string
    dateTo: string
  }
}

export function BookingsTable({ filters }: BookingsTableProps) {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const ITEMS_PER_PAGE = 10

  const fetchBookings = useCallback(async (page = 1) => {
    let isMounted = true

    try {
      setLoading(page === 1)
      if (page > 1) setRefreshing(true)
      setError(null)

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: ITEMS_PER_PAGE.toString(),
        sort_by: 'created_at',
        sort_order: 'desc',
        ...(filters?.search && { search: filters.search }),
        ...(filters?.status && filters.status !== 'all' && { status: filters.status }),
        ...(filters?.paymentStatus && filters.paymentStatus !== 'all' && { payment_status: filters.paymentStatus }),
        ...(filters?.dateFrom && { date_from: filters.dateFrom }),
        ...(filters?.dateTo && { date_to: filters.dateTo }),
      })

      console.log('Fetching bookings with URL:', `/api/admin/bookings?${queryParams}`)
      const response = await fetch(`/api/admin/bookings?${queryParams}`)
      
      console.log('Response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('API Error Response:', errorData)
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      console.log('API Response data:', data)
      
      if (isMounted) {
        setBookings(data.bookings || [])
        setTotalPages(data.pagination?.totalPages || 1)
        setTotal(data.pagination?.total || 0)
        setCurrentPage(page)
      }
    } catch (error) {
      console.error('Error fetching bookings:', error)
      console.error('Error type:', typeof error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      if (isMounted) {
        setError(error instanceof Error ? error.message : 'Failed to fetch bookings')
      }
    } finally {
      if (isMounted) {
        setLoading(false)
        setRefreshing(false)
      }
    }

    return () => {
      isMounted = false
    }
  }, [filters])

  useEffect(() => {
    fetchBookings(1)
  }, [fetchBookings])

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

  const formatAddress = (address: string, maxLength = 40) => {
    return address.length > maxLength ? `${address.substring(0, maxLength)}...` : address
  }

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime)
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  }

  if (loading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader className="px-3 sm:px-6 py-4">
          <CardTitle className="text-lg font-semibold">All Bookings</CardTitle>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-4 p-4 border rounded-lg">
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
    <Card className="border-0 shadow-sm">
      <CardHeader className="px-3 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            All Bookings {total > 0 && <span className="text-sm font-normal text-gray-500">({total})</span>}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchBookings(currentPage)}
            disabled={refreshing}
            className="p-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-0 sm:px-6">
        {error ? (
          <div className="text-center py-12">
            <div className="text-red-500 text-lg mb-2">Error loading bookings</div>
            <div className="text-gray-500 text-sm mb-4">{error}</div>
            <Button 
              onClick={() => fetchBookings(currentPage)}
              disabled={refreshing}
              variant="outline"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Try Again
            </Button>
          </div>
        ) : bookings.length === 0 && !loading ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-2">No bookings found</div>
            <div className="text-gray-400 text-sm">Try adjusting your filters or search terms</div>
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="sm:hidden space-y-3">
              {bookings.map((booking) => {
                const datetime = formatDateTime(booking.departure_time)
                return (
                  <div key={booking.id} className="border rounded-lg p-4 bg-white shadow-sm">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {booking.profiles?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-sm">
                            {booking.profiles?.full_name || 'Unknown Customer'}
                          </div>
                          <div className="text-xs text-gray-500">
                            ID: {booking.id.substring(0, 8)}...
                          </div>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="p-1">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/bookings/${booking.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Booking
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Assign Driver
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Status Badges */}
                    <div className="flex space-x-2 mb-3">
                      {getStatusBadge(booking.status, booking.payment_status)}
                      {getPaymentBadge(booking.payment_status)}
                    </div>

                    {/* Route */}
                    <div className="space-y-2 mb-3">
                      <div className="flex items-start space-x-2">
                        <MapPin className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-gray-700">
                          {formatAddress(booking.pickup_address, 35)}
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <MapPin className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-gray-700">
                          {formatAddress(booking.destination_address, 35)}
                        </div>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{datetime.date}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{datetime.time}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="h-3 w-3" />
                        <span>{booking.passenger_count} pax</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <DollarSign className="h-3 w-3" />
                        <span className="font-medium">€{booking.total_price.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Vehicle and Driver */}
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">
                          Vehicle: {booking.vehicle_types?.name || 'Not selected'}
                        </span>
                        <span className="text-gray-500">
                          Driver: {booking.driver_assignments?.[0]?.drivers?.full_name || 'Unassigned'}
                        </span>
                      </div>
                      {booking.notes && (
                        <div className="mt-2 text-xs text-gray-600">
                          <span className="font-medium">Notes:</span> {booking.notes}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Customer</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Route</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Schedule</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Price</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Driver</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => {
                    const datetime = formatDateTime(booking.departure_time)
                    return (
                      <tr key={booking.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {booking.profiles?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-sm">
                                {booking.profiles?.full_name || 'Unknown Customer'}
                              </div>
                              <div className="text-xs text-gray-500">
                                {booking.profiles?.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="space-y-1">
                            <div className="text-sm text-gray-700">
                              <span className="text-green-600">FROM:</span> {formatAddress(booking.pickup_address, 30)}
                            </div>
                            <div className="text-sm text-gray-700">
                              <span className="text-red-600">TO:</span> {formatAddress(booking.destination_address, 30)}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="space-y-1">
                            <div className="text-sm text-gray-700">{datetime.date}</div>
                            <div className="text-sm text-gray-500">{datetime.time}</div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="space-y-1">
                            {getStatusBadge(booking.status, booking.payment_status)}
                            {getPaymentBadge(booking.payment_status)}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-medium text-sm">€{booking.total_price.toFixed(2)}</div>
                          <div className="text-xs text-gray-500">{booking.passenger_count} passengers</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm">
                            {booking.driver_assignments?.[0]?.drivers?.full_name || (
                              <span className="text-gray-400 italic">Unassigned</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            {booking.vehicle_types?.name || 'No vehicle'}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/bookings/${booking.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Booking
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <UserPlus className="mr-2 h-4 w-4" />
                                Assign Driver
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-3 sm:px-0 py-4 border-t border-gray-200 mt-4">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchBookings(currentPage - 1)}
                    disabled={currentPage === 1 || refreshing}
                    className="px-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline ml-1">Previous</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchBookings(currentPage + 1)}
                    disabled={currentPage === totalPages || refreshing}
                    className="px-2"
                  >
                    <span className="hidden sm:inline mr-1">Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-sm text-gray-500">
                  Page {currentPage} of {totalPages}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}