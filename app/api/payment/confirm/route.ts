import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { stripe, handleStripeError } from '@/lib/stripe'

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
    const { payment_intent_id } = body

    if (!payment_intent_id) {
      return NextResponse.json(
        { error: 'Payment intent ID is required' },
        { status: 400 }
      )
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id)

    if (!paymentIntent) {
      return NextResponse.json(
        { error: 'Payment intent not found' },
        { status: 404 }
      )
    }

    // Get booking ID from metadata
    const bookingId = paymentIntent.metadata.booking_id

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Booking information not found in payment' },
        { status: 400 }
      )
    }

    // Verify the booking belongs to the authenticated user
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, user_id, status, payment_status')
      .eq('id', bookingId)
      .eq('user_id', user.id)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found or access denied' },
        { status: 404 }
      )
    }

    // Update booking status based on payment status
    let bookingStatus = booking.status
    let paymentStatus = 'pending'

    switch (paymentIntent.status) {
      case 'succeeded':
        paymentStatus = 'paid'
        if (booking.status === 'pending') {
          bookingStatus = 'confirmed'
        }
        break
      case 'processing':
        paymentStatus = 'pending'
        break
      case 'requires_payment_method':
      case 'requires_confirmation':
      case 'requires_action':
        paymentStatus = 'pending'
        break
      case 'canceled':
        paymentStatus = 'pending'
        break
      default:
        paymentStatus = 'pending'
    }

    // Update the booking in database
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update({
        payment_status: paymentStatus,
        status: bookingStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)
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
      console.error('Error updating booking:', updateError)
      return NextResponse.json(
        { error: 'Failed to update booking status' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      payment_status: paymentIntent.status,
      booking: updatedBooking,
      amount_received: paymentIntent.amount_received,
      currency: paymentIntent.currency
    })

  } catch (error: any) {
    console.error('Error confirming payment:', error)
    
    const errorMessage = handleStripeError(error)
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}