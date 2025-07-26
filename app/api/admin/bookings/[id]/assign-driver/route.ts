import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await params
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

    const body = await request.json()
    const { driver_id, notes } = body

    if (!driver_id) {
      return NextResponse.json(
        { error: 'Driver ID is required' },
        { status: 400 }
      )
    }

    // Check if booking exists and is assignable
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, status, departure_time')
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    if (booking.status === 'cancelled' || booking.status === 'completed') {
      return NextResponse.json(
        { error: 'Cannot assign driver to cancelled or completed booking' },
        { status: 400 }
      )
    }

    // Check if driver exists and is available
    const { data: driver, error: driverError } = await supabase
      .from('drivers')
      .select(`
        id,
        full_name,
        phone,
        is_active,
        profiles!inner (
          role
        )
      `)
      .eq('id', driver_id)
      .eq('is_active', true)
      .single()

    if (driverError || !driver) {
      return NextResponse.json(
        { error: 'Driver not found or inactive' },
        { status: 404 }
      )
    }

    // Check if driver is already assigned to another booking at the same time
    const departureTime = new Date(booking.departure_time)
    const bufferHours = 2 // 2-hour buffer before and after
    const timeStart = new Date(departureTime.getTime() - bufferHours * 60 * 60 * 1000)
    const timeEnd = new Date(departureTime.getTime() + bufferHours * 60 * 60 * 1000)

    const { data: conflictingAssignments } = await supabase
      .from('driver_assignments')
      .select(`
        id,
        bookings!inner (
          departure_time,
          status
        )
      `)
      .eq('driver_id', driver_id)
      .eq('status', 'assigned')
      .gte('bookings.departure_time', timeStart.toISOString())
      .lte('bookings.departure_time', timeEnd.toISOString())
      .neq('bookings.status', 'cancelled')
      .neq('bookings.status', 'completed')

    if (conflictingAssignments && conflictingAssignments.length > 0) {
      return NextResponse.json(
        { error: 'Driver is not available at this time (scheduling conflict)' },
        { status: 409 }
      )
    }

    // Remove any existing assignment for this booking
    await supabase
      .from('driver_assignments')
      .delete()
      .eq('booking_id', bookingId)

    // Create new driver assignment
    const { data: assignment, error: assignmentError } = await supabase
      .from('driver_assignments')
      .insert({
        booking_id: bookingId,
        driver_id,
        assigned_at: new Date().toISOString(),
        assigned_by: user.id,
        status: 'assigned',
        notes: notes || null
      })
      .select(`
        id,
        assigned_at,
        status,
        notes,
        drivers (
          id,
          full_name,
          phone,
          email,
          license_number,
          vehicle_info
        )
      `)
      .single()

    if (assignmentError) {
      console.error('Error creating driver assignment:', assignmentError)
      return NextResponse.json(
        { error: 'Failed to assign driver' },
        { status: 500 }
      )
    }

    // Update booking status to confirmed if it was pending
    if (booking.status === 'pending') {
      await supabase
        .from('bookings')
        .update({ status: 'confirmed' })
        .eq('id', bookingId)
    }

    return NextResponse.json({ assignment }, { status: 201 })

  } catch (error) {
    console.error('Error in driver assignment API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await params
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

    // Remove driver assignment
    const { error } = await supabase
      .from('driver_assignments')
      .delete()
      .eq('booking_id', bookingId)

    if (error) {
      console.error('Error removing driver assignment:', error)
      return NextResponse.json(
        { error: 'Failed to remove driver assignment' },
        { status: 500 }
      )
    }

    // Update booking status back to pending if it was confirmed
    await supabase
      .from('bookings')
      .update({ status: 'pending' })
      .eq('id', bookingId)
      .eq('status', 'confirmed')

    return NextResponse.json({ message: 'Driver assignment removed successfully' })

  } catch (error) {
    console.error('Error in driver assignment removal API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}