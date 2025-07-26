'use client'

import { useState } from 'react'
import { AdminLayout } from '@/components/admin/layout/admin-layout'
import { BookingsTable } from '@/components/admin/bookings/bookings-table'
import { BookingFilters } from '@/components/admin/bookings/booking-filters'
import { BookingStats } from '@/components/admin/bookings/booking-stats'

interface FilterState {
  search: string
  status: string
  paymentStatus: string
  dateFrom: string
  dateTo: string
}

export function AdminBookingsContent() {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    paymentStatus: 'all',
    dateFrom: '',
    dateTo: ''
  })

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters)
  }

  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Page Header */}
        <div className="pb-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">Booking Management</h1>
          <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">
            Manage all customer bookings, assignments, and schedules
          </p>
        </div>

        {/* Booking Statistics */}
        <BookingStats />

        {/* Filters and Search */}
        <BookingFilters onFiltersChange={handleFiltersChange} />

        {/* Bookings Table */}
        <BookingsTable filters={filters} />
      </div>
    </AdminLayout>
  )
}