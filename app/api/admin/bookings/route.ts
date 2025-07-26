import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    // Check authentication and admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      console.error('Auth error:', authError)
      return NextResponse.json(
        { error: 'Authentication error' },
        { status: 401 }
      )
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Profile fetch error:', profileError)
      return NextResponse.json(
        { error: 'Profile verification failed' },
        { status: 500 }
      )
    }

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Get query parameters for filtering and pagination
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const paymentStatus = searchParams.get('payment_status')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sort_by') || 'created_at'
    const sortOrder = searchParams.get('sort_order') || 'desc'
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')

    const offset = (page - 1) * limit

    // Build query - simplified to avoid foreign key issues
    let query = supabase
      .from('bookings')
      .select(`
        id,
        pickup_address,
        destination_address,
        departure_time,
        passenger_count,
        luggage_count,
        total_price,
        distance_km,
        duration_minutes,
        status,
        payment_status,
        special_requirements,
        notes,
        created_at,
        updated_at,
        stripe_payment_intent_id,
        user_id,
        vehicle_type_id
      `, { count: 'exact' })

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }
    
    if (paymentStatus && paymentStatus !== 'all') {
      query = query.eq('payment_status', paymentStatus)
    }

    if (search) {
      query = query.or(`pickup_address.ilike.%${search}%,destination_address.ilike.%${search}%`)
    }

    if (dateFrom) {
      query = query.gte('departure_time', dateFrom)
    }

    if (dateTo) {
      query = query.lte('departure_time', dateTo)
    }

    // Apply sorting and pagination
    query = query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1)

    console.log('About to execute query...')
    const { data: bookings, error, count } = await query
    console.log('Query executed. Error:', error, 'Count:', count, 'Data length:', bookings?.length)

    if (error) {
      console.error('Error fetching bookings:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      return NextResponse.json(
        { error: 'Failed to fetch bookings', details: error },
        { status: 500 }
      )
    }

    console.log(`Fetched ${bookings?.length || 0} bookings. Total count: ${count}`)

    // If we have bookings, enrich them with profile and vehicle type data
    let enrichedBookings = bookings || []
    
    if (bookings && bookings.length > 0) {
      try {
        // Get unique user IDs and vehicle type IDs
        const userIds = [...new Set(bookings.map(b => b.user_id).filter(Boolean))]
        const vehicleTypeIds = [...new Set(bookings.map(b => b.vehicle_type_id).filter(Boolean))]
        
        // Fetch profiles separately
        let profilesMap: any = {}
        if (userIds.length > 0) {
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, full_name, email, phone')
            .in('id', userIds)
          
          if (!profilesError && profiles) {
            profilesMap = profiles.reduce((acc: any, profile: any) => {
              acc[profile.id] = profile
              return acc
            }, {})
          }
        }
        
        // Fetch vehicle types separately
        let vehicleTypesMap: any = {}
        if (vehicleTypeIds.length > 0) {
          const { data: vehicleTypes, error: vehicleTypesError } = await supabase
            .from('vehicle_types')
            .select('id, name, max_passengers, max_luggage')
            .in('id', vehicleTypeIds)
          
          if (!vehicleTypesError && vehicleTypes) {
            vehicleTypesMap = vehicleTypes.reduce((acc: any, vt: any) => {
              acc[vt.id] = vt
              return acc
            }, {})
          }
        }
        
        // Enrich bookings with the fetched data
        enrichedBookings = bookings.map((booking: any) => ({
          ...booking,
          profiles: profilesMap[booking.user_id] || null,
          vehicle_types: vehicleTypesMap[booking.vehicle_type_id] || null,
          driver_assignments: [] // For now, we'll handle this later
        }))
        
      } catch (enrichError) {
        console.error('Error enriching bookings data:', enrichError)
        // Continue with basic bookings data if enrichment fails
      }
    }

    return NextResponse.json({
      bookings: enrichedBookings,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Error in admin bookings API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const {
      user_id,
      pickup_address,
      pickup_latitude,
      pickup_longitude,
      destination_address,
      destination_latitude,
      destination_longitude,
      departure_time,
      vehicle_type_id,
      passenger_count,
      luggage_count,
      special_requirements,
      distance_km,
      duration_minutes,
      total_price
    } = body

    // Validate required fields
    if (!user_id || !pickup_address || !destination_address || !departure_time || !vehicle_type_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        user_id,
        pickup_address,
        pickup_latitude: pickup_latitude || null,
        pickup_longitude: pickup_longitude || null,
        destination_address,
        destination_latitude: destination_latitude || null,
        destination_longitude: destination_longitude || null,
        departure_time,
        vehicle_type_id,
        passenger_count: passenger_count || 1,
        luggage_count: luggage_count || 0,
        special_requirements: special_requirements || null,
        distance_km: distance_km || 0,
        duration_minutes: duration_minutes || 0,
        total_price: total_price || 0,
        status: 'pending',
        payment_status: 'pending'
      })
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
        )
      `)
      .single()

    if (bookingError) {
      console.error('Error creating booking:', bookingError)
      return NextResponse.json(
        { error: 'Failed to create booking' },
        { status: 500 }
      )
    }

    return NextResponse.json({ booking }, { status: 201 })

  } catch (error) {
    console.error('Error in admin booking creation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}