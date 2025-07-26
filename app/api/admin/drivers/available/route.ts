import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    // Check authentication and admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const datetime = searchParams.get('datetime')
    const bookingId = searchParams.get('booking_id') // To exclude current assignment

    // Get all active drivers
    let driversQuery = supabase
      .from('drivers')
      .select(`
        id,
        full_name,
        phone,
        email,
        license_number,
        vehicle_info,
        is_active,
        created_at,
        profiles!inner (
          role
        )
      `)
      .eq('is_active', true)
      .eq('profiles.role', 'driver')
      .order('full_name')

    const { data: allDrivers, error: driversError } = await driversQuery

    if (driversError) {
      console.error('Error fetching drivers:', driversError)
      return NextResponse.json(
        { error: 'Failed to fetch drivers' },
        { status: 500 }
      )
    }

    // If no datetime specified, return all active drivers
    if (!datetime) {
      return NextResponse.json({ drivers: allDrivers || [] })
    }

    // Check availability for specific datetime
    const departureTime = new Date(datetime)
    const bufferHours = 2 // 2-hour buffer before and after
    const timeStart = new Date(departureTime.getTime() - bufferHours * 60 * 60 * 1000)
    const timeEnd = new Date(departureTime.getTime() + bufferHours * 60 * 60 * 1000)

    // Get conflicting assignments
    let conflictQuery = supabase
      .from('driver_assignments')
      .select(`
        driver_id,
        bookings!inner (
          id,
          departure_time,
          status
        )
      `)
      .eq('status', 'assigned')
      .gte('bookings.departure_time', timeStart.toISOString())
      .lte('bookings.departure_time', timeEnd.toISOString())
      .neq('bookings.status', 'cancelled')
      .neq('bookings.status', 'completed')

    // Exclude current booking if provided
    if (bookingId) {
      conflictQuery = conflictQuery.neq('bookings.id', bookingId)
    }

    const { data: conflicts } = await conflictQuery

    // Filter out drivers with conflicts
    const conflictDriverIds = new Set(conflicts?.map(c => c.driver_id) || [])
    const availableDrivers = allDrivers?.filter(driver => 
      !conflictDriverIds.has(driver.id)
    ) || []

    return NextResponse.json({ 
      drivers: availableDrivers,
      datetime,
      total_drivers: allDrivers?.length || 0,
      available_drivers: availableDrivers.length
    })

  } catch (error) {
    console.error('Error in available drivers API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}