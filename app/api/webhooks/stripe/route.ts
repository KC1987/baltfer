import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { createServerClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { sendBookingConfirmationSMS } from '@/lib/notifications'

// Disable body parsing for webhooks
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  console.log('🎯 STRIPE WEBHOOK - Request received at', new Date().toISOString())
  
  if (!stripe) {
    console.log('❌ Stripe not configured')
    return NextResponse.json(
      { error: 'Payment service not configured' },
      { status: 503 }
    )
  }

  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    console.error('Missing Stripe signature')
    return NextResponse.json(
      { error: 'Missing Stripe signature' },
      { status: 400 }
    )
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('Missing Stripe webhook secret')
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    )
  }

  let event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    )
  }

  // Use service role client to bypass RLS for webhook
  const supabase = await createServerClient()
  
  // Check if service role key is available
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is missing!')
    console.error('📋 This is required for webhooks to bypass RLS policies')
    return NextResponse.json(
      { error: 'Service configuration missing' },
      { status: 500 }
    )
  }
  
  // For webhook operations, we need to bypass RLS since there's no user session
  const supabaseService = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    console.log('📨 Webhook event type:', event.type)
    console.log('🆔 Event ID:', event.id)
    
    switch (event.type) {
      case 'payment_intent.succeeded':
        console.log('💰 Processing payment_intent.succeeded')
        await handlePaymentSucceeded(event.data.object, supabaseService)
        break
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object, supabaseService)
        break
      case 'payment_intent.canceled':
        await handlePaymentCanceled(event.data.object, supabaseService)
        break
      case 'payment_intent.requires_action':
        await handlePaymentRequiresAction(event.data.object, supabaseService)
        break
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handlePaymentSucceeded(paymentIntent: any, supabaseService: any) {
  const bookingId = paymentIntent.metadata.booking_id
  
  console.log('🔍 Payment Intent Metadata:', paymentIntent.metadata)
  console.log('📝 Booking ID from metadata:', bookingId)
  console.log('💳 Payment Intent ID:', paymentIntent.id)

  if (!bookingId) {
    console.error('❌ No booking ID in payment intent metadata')
    console.error('🔍 Full payment intent object keys:', Object.keys(paymentIntent))
    return
  }

  try {
    // Update booking status (use service client to bypass RLS)
    const { error } = await supabaseService
      .from('bookings')
      .update({
        payment_status: 'paid',
        status: 'confirmed',
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)

    if (error) {
      console.error('Error updating booking after successful payment:', error)
      throw error
    }

    // Get booking details for SMS notification (with retry for timing issues)
    let booking = null
    let bookingError = null
    
    // Retry up to 3 times with small delays
    for (let attempt = 1; attempt <= 3; attempt++) {
      console.log(`🔄 Attempt ${attempt} to fetch booking details`)
      
      const result = await supabaseService
        .from('bookings')
        .select(`
          id,
          pickup_address,
          destination_address,
          departure_time,
          total_price,
          payment_method,
          user_id,
          vehicle_type_id
        `)
        .eq('id', bookingId)
        .single()
      
      booking = result.data
      bookingError = result.error
      
      if (!bookingError && booking) {
        console.log(`✅ Successfully fetched booking on attempt ${attempt}`)
        break
      }
      
      if (attempt < 3) {
        console.log(`⏳ Booking not found on attempt ${attempt}, waiting 1 second...`)
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    let customerName = 'Unknown Customer'
    let vehicleTypeName = 'Unknown Vehicle'

    if (booking && !bookingError) {
      // Get customer name separately (using service client)
      const { data: profile } = await supabaseService
        .from('profiles')
        .select('full_name')
        .eq('id', booking.user_id)
        .single()
      
      customerName = profile?.full_name || 'Unknown Customer'

      // Get vehicle type name separately (using service client)
      const { data: vehicleType } = await supabaseService
        .from('vehicle_types')
        .select('name')
        .eq('id', booking.vehicle_type_id)
        .single()
      
      vehicleTypeName = vehicleType?.name || 'Unknown Vehicle'
    }

    if (bookingError) {
      console.error('❌ Error fetching booking details for SMS:', bookingError)
      console.error('📝 Tried to fetch booking ID:', bookingId)
      console.error('🔍 Booking query result:', { booking, error: bookingError })
    } else {
      console.log('✅ Successfully fetched booking details for SMS')
      console.log('📋 Booking data:', { 
        id: booking.id, 
        user_id: booking.user_id, 
        vehicle_type_id: booking.vehicle_type_id 
      })
      // Send SMS notification to admin (using service client to bypass RLS)
      const smsResult = await sendBookingConfirmationSMS({
        id: booking.id,
        customer_name: customerName,
        pickup_address: booking.pickup_address,
        destination_address: booking.destination_address,
        departure_time: booking.departure_time,
        vehicle_type: vehicleTypeName,
        total_price: booking.total_price,
        payment_method: booking.payment_method,
      }, supabaseService)

      if (smsResult.success) {
        console.log(`SMS notification sent for booking ${bookingId}:`, smsResult.message)
      } else {
        console.error(`SMS notification failed for booking ${bookingId}:`, smsResult.error)
      }
    }

    console.log(`Payment succeeded for booking ${bookingId}`)
  } catch (error) {
    console.error('Error handling payment success:', error)
    throw error
  }
}

async function handlePaymentFailed(paymentIntent: any, supabaseService: any) {
  const bookingId = paymentIntent.metadata.booking_id

  if (!bookingId) {
    console.error('No booking ID in payment intent metadata')
    return
  }

  try {
    // Update booking status
    const { error } = await supabaseService
      .from('bookings')
      .update({
        payment_status: 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)

    if (error) {
      console.error('Error updating booking after failed payment:', error)
      throw error
    }

    // Here you could add additional logic like:
    // - Send payment failure notification
    // - Hold the booking for retry
    // - Send email with payment instructions

    console.log(`Payment failed for booking ${bookingId}`)
  } catch (error) {
    console.error('Error handling payment failure:', error)
    throw error
  }
}

async function handlePaymentCanceled(paymentIntent: any, supabaseService: any) {
  const bookingId = paymentIntent.metadata.booking_id

  if (!bookingId) {
    console.error('No booking ID in payment intent metadata')
    return
  }

  try {
    // Update booking status
    const { error } = await supabaseService
      .from('bookings')
      .update({
        payment_status: 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)

    if (error) {
      console.error('Error updating booking after canceled payment:', error)
      throw error
    }

    console.log(`Payment canceled for booking ${bookingId}`)
  } catch (error) {
    console.error('Error handling payment cancellation:', error)
    throw error
  }
}

async function handlePaymentRequiresAction(paymentIntent: any, supabaseService: any) {
  const bookingId = paymentIntent.metadata.booking_id

  if (!bookingId) {
    console.error('No booking ID in payment intent metadata')
    return
  }

  try {
    // Keep booking as pending while payment requires action
    const { error } = await supabaseService
      .from('bookings')
      .update({
        payment_status: 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)

    if (error) {
      console.error('Error updating booking for payment requiring action:', error)
      throw error
    }

    console.log(`Payment requires action for booking ${bookingId}`)
  } catch (error) {
    console.error('Error handling payment requiring action:', error)
    throw error
  }
}