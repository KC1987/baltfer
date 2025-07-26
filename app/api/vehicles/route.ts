import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    const { data: vehicles, error } = await supabase
      .from('vehicle_types')
      .select('*')
      .eq('is_active', true)
      .order('base_price')

    if (error) {
      throw error
    }

    return NextResponse.json({ vehicles })
  } catch (error: any) {
    console.error('Error fetching vehicles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch vehicles' },
      { status: 500 }
    )
  }
}