import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { sendBookingConfirmationSMS } from '@/lib/notifications'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!adminProfile || adminProfile.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Get the most recent booking for testing
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        id,
        pickup_address,
        destination_address,
        departure_time,
        total_price,
        payment_status,
        status,
        user_id,
        vehicle_type_id
      `)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json(
        { success: false, error: 'No bookings found to test with' },
        { status: 404 }
      )
    }

    // Get customer and vehicle info separately
    const { data: customerProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', booking.user_id)
      .single()
    
    const { data: vehicleType } = await supabase
      .from('vehicle_types')
      .select('name')
      .eq('id', booking.vehicle_type_id)
      .single()

    // Simulate the webhook SMS trigger
    console.log('Testing webhook SMS with booking:', booking.id)
    
    const smsResult = await sendBookingConfirmationSMS({
      id: booking.id,
      customer_name: customerProfile?.full_name || 'Unknown Customer',
      pickup_address: booking.pickup_address,
      destination_address: booking.destination_address,
      departure_time: booking.departure_time,
      vehicle_type: vehicleType?.name || 'Unknown Vehicle',
      total_price: booking.total_price,
    })

    // Update booking status to simulate webhook
    await supabase
      .from('bookings')
      .update({
        payment_status: 'paid',
        status: 'confirmed',
        updated_at: new Date().toISOString()
      })
      .eq('id', booking.id)

    return NextResponse.json({
      success: true,
      message: 'Webhook SMS test completed',
      bookingId: booking.id,
      smsResult,
      bookingDetails: {
        id: booking.id,
        customer: customerProfile?.full_name || 'Unknown Customer',
        pickup: booking.pickup_address,
        destination: booking.destination_address,
        vehicle: vehicleType?.name || 'Unknown Vehicle',
        total: booking.total_price
      }
    })

  } catch (error) {
    console.error('Test webhook SMS error:', error)
    return NextResponse.json(
      { success: false, error: 'Test failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}