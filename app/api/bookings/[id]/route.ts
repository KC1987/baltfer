import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient()
    const resolvedParams = await params
    
    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Fetch booking first
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        vehicle_types (
          name,
          max_passengers,
          max_luggage
        )
      `)
      .eq('id', resolvedParams.id)
      .eq('user_id', user.id)
      .single()

    if (bookingError) {
      if (bookingError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Booking not found' },
          { status: 404 }
        )
      }
      throw bookingError
    }

    // Fetch user profile separately
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, phone')
      .eq('id', user.id)
      .single()

    // Combine the data
    const bookingWithProfile = {
      ...booking,
      profiles: profile || { full_name: 'Unknown', phone: 'Unknown' }
    }

    return NextResponse.json({ booking: bookingWithProfile })
  } catch (error: any) {
    console.error('Error fetching booking:', error)
    return NextResponse.json(
      { error: 'Failed to fetch booking' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient()
    const resolvedParams = await params
    
    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { status, special_requirements } = body

    // Validate that user owns this booking
    const { data: existingBooking, error: fetchError } = await supabase
      .from('bookings')
      .select('id, status')
      .eq('id', resolvedParams.id)
      .eq('user_id', user.id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Booking not found' },
          { status: 404 }
        )
      }
      throw fetchError
    }

    // Only allow certain status changes
    const allowedStatusChanges = {
      'pending': ['cancelled'],
      'confirmed': ['cancelled']
    }

    if (status && !allowedStatusChanges[existingBooking.status as keyof typeof allowedStatusChanges]?.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status change' },
        { status: 400 }
      )
    }

    // Update the booking
    const updateData: any = {}
    if (status) updateData.status = status
    if (special_requirements !== undefined) updateData.special_requirements = special_requirements

    const { data: booking, error: updateError } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', resolvedParams.id)
      .eq('user_id', user.id)
      .select(`
        *,
        vehicle_types (
          name,
          max_passengers,
          max_luggage
        )
      `)
      .single()

    if (updateError) {
      throw updateError
    }

    // Fetch user profile separately for updated booking
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, phone')
      .eq('id', user.id)
      .single()

    // Combine the data
    const bookingWithProfile = {
      ...booking,
      profiles: profile || { full_name: 'Unknown', phone: 'Unknown' }
    }

    return NextResponse.json({ booking: bookingWithProfile })
  } catch (error: any) {
    console.error('Error updating booking:', error)
    return NextResponse.json(
      { error: 'Failed to update booking' },
      { status: 500 }
    )
  }
}