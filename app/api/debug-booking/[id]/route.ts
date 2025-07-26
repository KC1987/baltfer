import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerClient()
    
    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    console.log('Debug booking request:', { id, userId: user?.id })

    // First, let's check if the booking exists at all (without user filter)
    const { data: bookingExists, error: existsError } = await supabase
      .from('bookings')
      .select('id, user_id, status, payment_status')
      .eq('id', id)
      .single()

    console.log('Booking exists check:', { bookingExists, existsError })

    // Then check if it belongs to the current user
    let userBooking = null
    let userError = null
    
    if (user) {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          vehicle_types (name),
          profiles!user_id (full_name, email)
        `)
        .eq('id', id)
        .eq('user_id', user.id)
        .single()
      
      userBooking = data
      userError = error
    }

    // Get total bookings count for context
    const { count: totalBookings } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })

    console.log('Debug results:', {
      requestedId: id,
      currentUser: user?.id,
      bookingExists: !!bookingExists,
      belongsToUser: !!userBooking,
      totalBookingsInDb: totalBookings,
      errors: {
        auth: authError,
        exists: existsError,
        user: userError
      }
    })

    return NextResponse.json({
      debug: true,
      requestedId: id,
      currentUser: user?.id || 'Not authenticated',
      booking: {
        exists: !!bookingExists,
        belongsToCurrentUser: !!userBooking,
        details: bookingExists || null
      },
      database: {
        totalBookings: totalBookings || 0
      },
      errors: {
        authentication: authError?.message || null,
        bookingLookup: existsError?.message || null,
        userBookingLookup: userError?.message || null
      },
      suggestions: [
        bookingExists ? 'Booking exists in database' : 'Booking not found in database',
        user ? 'User is authenticated' : 'User not authenticated',
        userBooking ? 'User has access to this booking' : 'User does not have access to this booking or it does not exist'
      ]
    })

  } catch (error: any) {
    console.error('Debug endpoint error:', error)
    return NextResponse.json(
      { 
        debug: true,
        error: 'Debug endpoint failed',
        details: error.message 
      },
      { status: 500 }
    )
  }
}