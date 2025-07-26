import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    let query = supabase
      .from('locations')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (type) {
      query = query.eq('type', type)
    }

    const { data: locations, error } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({ locations })
  } catch (error: any) {
    console.error('Error fetching locations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch locations' },
      { status: 500 }
    )
  }
}