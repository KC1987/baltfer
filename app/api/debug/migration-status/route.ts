import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    // Check if payment_method column exists by trying to select it
    const { data, error } = await supabase
      .from('bookings')
      .select('payment_method')
      .limit(1)

    if (error && error.code === '42703') {
      return NextResponse.json({
        migration_needed: true,
        status: 'payment_method column not found',
        error: error.message,
        instructions: 'Please run the migration SQL in your Supabase Dashboard'
      })
    }

    return NextResponse.json({
      migration_needed: false,
      status: 'payment_method column exists',
      message: 'Database is ready for cash payments'
    })

  } catch (error: any) {
    return NextResponse.json({
      migration_needed: true,
      status: 'unknown',
      error: error.message
    }, { status: 500 })
  }
}