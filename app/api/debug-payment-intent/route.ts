import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    // Get most recent booking
    const { data: recentBooking } = await supabase
      .from('bookings')
      .select('id, payment_status, status, created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // Get recent notification logs
    const { data: recentNotifications } = await supabase
      .from('admin_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)

    return NextResponse.json({
      success: true,
      debug: {
        mostRecentBooking: recentBooking,
        recentNotifications: recentNotifications,
        timestamp: new Date().toISOString(),
        note: "Check if recent booking has notification log entry"
      }
    })

  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}