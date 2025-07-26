import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supabase = await createServerClient()
    
    // Test basic database connection
    const { data: testData, error: testError } = await supabase
      .from('bookings')
      .select('id, created_at')
      .limit(1)

    if (testError) {
      console.error('Database test error:', testError)
      return NextResponse.json({
        success: false,
        error: testError,
        message: 'Database connection failed'
      })
    }

    // Test auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      hasUser: !!user,
      userEmail: user?.email || null,
      testDataCount: testData?.length || 0,
      authError: authError || null
    })

  } catch (error) {
    console.error('Test API error:', error)
    return NextResponse.json({
      success: false,
      error: error,
      message: 'API test failed'
    }, { status: 500 })
  }
}