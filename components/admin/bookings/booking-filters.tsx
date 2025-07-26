'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, Filter, X, Calendar } from 'lucide-react'

interface FilterState {
  search: string
  status: string
  paymentStatus: string
  dateFrom: string
  dateTo: string
}

interface BookingFiltersProps {
  onFiltersChange?: (filters: FilterState) => void
}

export function BookingFilters({ onFiltersChange }: BookingFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    paymentStatus: 'all',
    dateFrom: '',
    dateTo: ''
  })

  const [activeFilters, setActiveFilters] = useState(0)

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    
    // Count active filters (excluding 'all' values)
    const activeCount = Object.entries(newFilters).filter(([key, value]) => {
      if (key === 'status' || key === 'paymentStatus') {
        return value !== '' && value !== 'all'
      }
      return value !== ''
    }).length
    setActiveFilters(activeCount)
    
    // Notify parent component
    onFiltersChange?.(newFilters)
  }

  const clearFilters = () => {
    const emptyFilters: FilterState = {
      search: '',
      status: 'all',
      paymentStatus: 'all',
      dateFrom: '',
      dateTo: ''
    }
    setFilters(emptyFilters)
    setActiveFilters(0)
    onFiltersChange?.(emptyFilters)
  }

  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ]

  const paymentStatusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'paid', label: 'Paid' },
    { value: 'failed', label: 'Failed' },
    { value: 'refunded', label: 'Refunded' }
  ]

  return (
    <Card className="border-0 shadow-sm bg-white">
      <CardContent className="p-3 sm:p-4 lg:p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 min-w-0">
              <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 flex-shrink-0" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">Filters</h3>
              {activeFilters > 0 && (
                <Badge variant="default" className="text-xs px-2 py-1 bg-primary">
                  {activeFilters}
                </Badge>
              )}
            </div>
            {activeFilters > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-gray-500 hover:text-gray-700 px-2 py-1 h-auto"
              >
                <X className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Clear all</span>
              </Button>
            )}
          </div>

          {/* Mobile-First Filter Controls */}
          <div className="space-y-4">
            {/* Row 1: Search - Full width on mobile */}
            <div className="w-full">
              <Label htmlFor="search" className="text-sm font-medium text-gray-700 mb-2 block">
                Search Bookings
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="search"
                  placeholder="Search addresses, customers..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10 border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {/* Row 2: Status Filters - 2 columns on mobile, more on larger screens */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* Status Filter */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Status</Label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => handleFilterChange('status', value)}
                >
                  <SelectTrigger className="border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Status Filter */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Payment</Label>
                <Select
                  value={filters.paymentStatus}
                  onValueChange={(value) => handleFilterChange('paymentStatus', value)}
                >
                  <SelectTrigger className="border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary">
                    <SelectValue placeholder="All payments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All payments</SelectItem>
                    {paymentStatusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date From */}
              <div>
                <Label htmlFor="dateFrom" className="text-sm font-medium text-gray-700 mb-2 block">
                  From Date
                </Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  className="border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Date To */}
              <div>
                <Label htmlFor="dateTo" className="text-sm font-medium text-gray-700 mb-2 block">
                  To Date
                </Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  className="border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Active Filters Display */}
          {activeFilters > 0 && (
            <div className="pt-3 border-t border-gray-100">
              <div className="flex items-center mb-2">
                <span className="text-sm font-medium text-gray-700 mr-2">Active filters:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {filters.search && (
                  <Badge variant="outline" className="text-xs px-2 py-1 bg-blue-50 text-blue-700 border-blue-200">
                    Search: {filters.search.length > 20 ? `${filters.search.substring(0, 20)}...` : filters.search}
                    <button
                      onClick={() => handleFilterChange('search', '')}
                      className="ml-1 hover:text-red-600 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {filters.status && filters.status !== 'all' && (
                  <Badge variant="outline" className="text-xs px-2 py-1 bg-green-50 text-green-700 border-green-200">
                    Status: {statusOptions.find(s => s.value === filters.status)?.label}
                    <button
                      onClick={() => handleFilterChange('status', 'all')}
                      className="ml-1 hover:text-red-600 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {filters.paymentStatus && filters.paymentStatus !== 'all' && (
                  <Badge variant="outline" className="text-xs px-2 py-1 bg-purple-50 text-purple-700 border-purple-200">
                    Payment: {paymentStatusOptions.find(p => p.value === filters.paymentStatus)?.label}
                    <button
                      onClick={() => handleFilterChange('paymentStatus', 'all')}
                      className="ml-1 hover:text-red-600 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {filters.dateFrom && (
                  <Badge variant="outline" className="text-xs px-2 py-1 bg-orange-50 text-orange-700 border-orange-200">
                    From: {filters.dateFrom}
                    <button
                      onClick={() => handleFilterChange('dateFrom', '')}
                      className="ml-1 hover:text-red-600 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {filters.dateTo && (
                  <Badge variant="outline" className="text-xs px-2 py-1 bg-orange-50 text-orange-700 border-orange-200">
                    To: {filters.dateTo}
                    <button
                      onClick={() => handleFilterChange('dateTo', '')}
                      className="ml-1 hover:text-red-600 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}