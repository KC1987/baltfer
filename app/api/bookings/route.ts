import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { sendBookingConfirmationSMS } from '@/lib/notifications'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
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
    console.log('Received booking data:', JSON.stringify(body, null, 2))
    
    const {
      pickup,
      destination,
      vehicle_type_id,
      departure_time,
      passenger_count,
      luggage_count,
      special_requirements,
      customer_name,
      customer_phone,
      notes,
      distance_km,
      duration_minutes,
      total_price,
      payment_method
    } = body

    // Validate required fields
    if (!pickup || !destination || !vehicle_type_id || !departure_time || !customer_name || !customer_phone) {
      return NextResponse.json(
        { error: 'Missing required fields: pickup, destination, vehicle_type_id, departure_time, customer_name, and customer_phone are required' },
        { status: 400 }
      )
    }

    // Get vehicle type for base price calculation
    const { data: vehicleType, error: vehicleError } = await supabase
      .from('vehicle_types')
      .select('*')
      .eq('id', vehicle_type_id)
      .single()

    if (vehicleError || !vehicleType) {
      return NextResponse.json(
        { error: 'Invalid vehicle type' },
        { status: 400 }
      )
    }

    // Calculate base price
    const base_price = vehicleType.base_price + (distance_km * vehicleType.price_per_km)

    // Update user profile with name and phone (upsert)
    await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        full_name: customer_name.trim(),
        phone: customer_phone.trim()
      }, {
        onConflict: 'id'
      })

    // Create the booking (without location IDs for now - we'll use addresses only)
    const bookingData: any = {
      user_id: user.id,
      pickup_address: pickup.address,
      pickup_latitude: pickup.latitude,
      pickup_longitude: pickup.longitude,
      destination_address: destination.address,
      destination_latitude: destination.latitude,
      destination_longitude: destination.longitude,
      vehicle_type_id,
      departure_time: new Date(departure_time).toISOString(),
      distance_km: distance_km || 0,
      duration_minutes: duration_minutes || 0,
      base_price,
      total_price: total_price || base_price,
      passenger_count: passenger_count || 1,
      luggage_count: luggage_count || 0,
      special_requirements: special_requirements || null,
      notes: notes?.trim() || null,
      status: payment_method === 'cash' ? 'confirmed' : 'pending',
      payment_status: payment_method === 'cash' ? 'pending' : 'pending'
    }

    // Only add payment_method if it's provided (graceful migration handling)
    if (payment_method) {
      bookingData.payment_method = payment_method
    }
    
    console.log('Creating booking with data:', JSON.stringify(bookingData, null, 2))
    
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert([bookingData])
      .select(`
        *,
        vehicle_types (
          name,
          max_passengers,
          max_luggage
        )
      `)
      .single()

    if (bookingError) {
      throw bookingError
    }

    // Send SMS notification for cash payments (card payments are handled by webhook)
    if (payment_method === 'cash') {
      try {
        const smsResult = await sendBookingConfirmationSMS({
          id: booking.id,
          customer_name: customer_name,
          pickup_address: booking.pickup_address,
          destination_address: booking.destination_address,
          departure_time: booking.departure_time,
          vehicle_type: booking.vehicle_types.name,
          total_price: booking.total_price,
          payment_method: booking.payment_method || 'cash',
        }, supabase)

        if (smsResult.success) {
          console.log(`SMS notification sent for cash booking ${booking.id}:`, smsResult.message)
        } else {
          console.error(`SMS notification failed for cash booking ${booking.id}:`, smsResult.error)
        }
      } catch (smsError) {
        console.error('SMS notification error for cash booking:', smsError)
        // Don't fail the booking creation if SMS fails
      }
    }

    return NextResponse.json({ booking })
  } catch (error: any) {
    console.error('Error creating booking:', error)
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
      stack: error?.stack
    })
    
    // Provide more specific error information
    let errorMessage = 'Failed to create booking'
    let statusCode = 500
    
    if (error?.code === 'PGRST116') {
      errorMessage = 'Database table not found'
      statusCode = 500
    } else if (error?.code === '23505') {
      errorMessage = 'Duplicate booking detected'
      statusCode = 409
    } else if (error?.code === '23503') {
      errorMessage = 'Invalid reference data (vehicle type or location)'
      statusCode = 400
    } else if (error?.code === '42703') {
      errorMessage = 'Database column not found - please run database migration for payment_method'
      statusCode = 500
    } else if (error?.message) {
      errorMessage = error.message
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error?.details || null,
        hint: error?.hint || null,
        code: error?.code || null,
        debug: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: statusCode }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
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

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('bookings')
      .select(`
        *,
        vehicle_types (
          name,
          max_passengers,
          max_luggage
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq('status', status)
    }

    const { data: bookings, error } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({ bookings })
  } catch (error: any) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    )
  }
}