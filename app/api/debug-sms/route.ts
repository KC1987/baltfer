import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
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

    // Debug information
    const debugInfo = {
      // Check admin settings
      adminSettings: await supabase
        .from('admin_settings')
        .select('admin_id, setting_key, setting_value, created_at')
        .order('created_at', { ascending: false }),
      
      // Check recent bookings with payment status
      recentBookings: await supabase
        .from('bookings')
        .select(`
          id,
          payment_status,
          status,
          created_at,
          total_price,
          user_id,
          vehicle_type_id,
          pickup_address,
          destination_address
        `)
        .order('created_at', { ascending: false })
        .limit(5),
      
      // Check notification logs
      recentNotifications: await supabase
        .from('admin_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10),
      
      // Environment check
      environment: {
        vonageConfigured: !!(process.env.VONAGE_API_KEY && process.env.VONAGE_API_SECRET),
        appUrl: process.env.NEXT_PUBLIC_APP_URL,
      }
    }

    return NextResponse.json({
      success: true,
      debug: debugInfo
    })

  } catch (error) {
    console.error('Debug SMS error:', error)
    return NextResponse.json(
      { success: false, error: 'Debug failed', details: error.message },
      { status: 500 }
    )
  }
}