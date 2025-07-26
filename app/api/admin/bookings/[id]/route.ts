import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    // Get booking details
    const { data: booking, error } = await supabase
      .from('bookings')
      .select(`
        *,
        profiles!user_id (
          id,
          full_name,
          email,
          phone,
          created_at
        ),
        vehicle_types (
          id,
          name,
          description,
          max_passengers,
          max_luggage,
          base_price,
          price_per_km
        ),
        driver_assignments (
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
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Booking not found' },
          { status: 404 }
        )
      }
      console.error('Error fetching booking:', error)
      return NextResponse.json(
        { error: 'Failed to fetch booking' },
        { status: 500 }
      )
    }

    return NextResponse.json({ booking })

  } catch (error) {
    console.error('Error in admin booking details API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
    const {
      status,
      payment_status,
      pickup_address,
      destination_address,
      departure_time,
      passenger_count,
      luggage_count,
      special_requirements,
      notes,
      total_price,
      vehicle_type_id,
      distance_km,
      duration_minutes
    } = body

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (status !== undefined) updateData.status = status
    if (payment_status !== undefined) updateData.payment_status = payment_status
    if (pickup_address !== undefined) updateData.pickup_address = pickup_address
    if (destination_address !== undefined) updateData.destination_address = destination_address
    if (departure_time !== undefined) updateData.departure_time = departure_time
    if (passenger_count !== undefined) updateData.passenger_count = passenger_count
    if (luggage_count !== undefined) updateData.luggage_count = luggage_count
    if (special_requirements !== undefined) updateData.special_requirements = special_requirements
    if (notes !== undefined) updateData.notes = notes
    if (total_price !== undefined) updateData.total_price = total_price
    if (vehicle_type_id !== undefined) updateData.vehicle_type_id = vehicle_type_id
    if (distance_km !== undefined) updateData.distance_km = distance_km
    if (duration_minutes !== undefined) updateData.duration_minutes = duration_minutes

    // Update booking
    const { data: booking, error } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        profiles!user_id (
          full_name,
          email,
          phone
        ),
        vehicle_types (
          name,
          max_passengers,
          max_luggage
        ),
        driver_assignments (
          id,
          status,
          drivers (
            full_name,
            phone
          )
        )
      `)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Booking not found' },
          { status: 404 }
        )
      }
      console.error('Error updating booking:', error)
      return NextResponse.json(
        { error: 'Failed to update booking' },
        { status: 500 }
      )
    }

    return NextResponse.json({ booking })

  } catch (error) {
    console.error('Error in admin booking update API:', error)
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
    const { id } = await params
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

    // Check if booking can be deleted (not paid or in progress)
    const { data: booking } = await supabase
      .from('bookings')
      .select('status, payment_status')
      .eq('id', id)
      .single()

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    if (booking.payment_status === 'paid' || booking.status === 'in_progress') {
      return NextResponse.json(
        { error: 'Cannot delete paid or in-progress bookings' },
        { status: 400 }
      )
    }

    // Delete booking (this will cascade to driver_assignments if configured)
    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting booking:', error)
      return NextResponse.json(
        { error: 'Failed to delete booking' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Booking deleted successfully' })

  } catch (error) {
    console.error('Error in admin booking deletion API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}