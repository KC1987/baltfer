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
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Send test SMS
    const testBookingData = {
      id: 'test-' + Date.now(),
      customer_name: 'Test Customer',
      pickup_address: 'Baltimore/Washington International Airport',
      destination_address: '123 Main St, Baltimore, MD 21201',
      departure_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      vehicle_type: 'Premium Sedan',
      total_price: 89.50,
    }

    const result = await sendBookingConfirmationSMS(testBookingData)

    return NextResponse.json({
      success: result.success,
      message: result.success ? 'Test SMS sent successfully!' : 'SMS failed to send',
      details: result,
    })

  } catch (error) {
    console.error('Test SMS error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}