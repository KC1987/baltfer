import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { stripe, eurosToCents, dollarsToCents, handleStripeError, type PaymentMetadata } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: 'Payment service not configured' },
        { status: 503 }
      )
    }

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
    const { booking_id, amount, currency = 'eur' } = body

    if (!booking_id || !amount) {
      return NextResponse.json(
        { error: 'Booking ID and amount are required' },
        { status: 400 }
      )
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      )
    }

    // Get booking details for metadata
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        vehicle_types (
          name
        )
      `)
      .eq('id', booking_id)
      .eq('user_id', user.id)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Check if booking already has a payment intent
    if (booking.stripe_payment_intent_id) {
      // Retrieve existing payment intent
      try {
        const existingIntent = await stripe.paymentIntents.retrieve(
          booking.stripe_payment_intent_id
        )
        
        if (existingIntent.status === 'succeeded') {
          return NextResponse.json(
            { error: 'Payment already completed for this booking' },
            { status: 400 }
          )
        }
        
        // If payment intent exists but not succeeded, we can reuse it
        if (existingIntent.amount === eurosToCents(amount)) {
          return NextResponse.json({
            client_secret: existingIntent.client_secret,
            payment_intent_id: existingIntent.id
          })
        }
      } catch (stripeError) {
        console.error('Error retrieving existing payment intent:', stripeError)
        // Continue to create new payment intent if retrieval fails
      }
    }

    // Get user profile for customer information
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, phone')
      .eq('id', user.id)
      .single()

    // Create Stripe customer if needed
    let customerId: string | undefined
    try {
      const customers = await stripe.customers.list({
        email: user.email,
        limit: 1
      })

      if (customers.data.length > 0) {
        customerId = customers.data[0].id
      } else {
        const customer = await stripe.customers.create({
          email: user.email || undefined,
          name: profile?.full_name || undefined,
          phone: profile?.phone || undefined,
          metadata: {
            user_id: user.id
          }
        })
        customerId = customer.id
      }
    } catch (customerError) {
      console.error('Error managing Stripe customer:', customerError)
      // Continue without customer ID if creation fails
    }

    // Prepare metadata for the payment intent
    const metadata = {
      booking_id: booking.id,
      user_id: user.id,
      pickup_address: booking.pickup_address,
      destination_address: booking.destination_address,
      departure_time: booking.departure_time,
      vehicle_type: booking.vehicle_types?.name || 'Unknown',
      passenger_count: booking.passenger_count.toString(),
      total_amount: amount.toString()
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: eurosToCents(amount),
      currency,
      customer: customerId,
      metadata,
      description: `Transfer booking from ${booking.pickup_address} to ${booking.destination_address}`,
      automatic_payment_methods: {
        enabled: true,
      },
      receipt_email: user.email || undefined,
    })

    // Update booking with payment intent ID
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        stripe_payment_intent_id: paymentIntent.id,
        payment_status: 'pending'
      })
      .eq('id', booking_id)

    if (updateError) {
      console.error('Error updating booking with payment intent:', updateError)
      // Don't fail the request, as the payment intent was created successfully
    }

    return NextResponse.json({
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id,
      amount: eurosToCents(amount),
      currency
    })

  } catch (error: any) {
    console.error('Error creating payment intent:', error)
    
    const errorMessage = handleStripeError(error)
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}