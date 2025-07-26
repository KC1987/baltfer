import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'

export async function POST(request: NextRequest) {
  console.log('🔍 WEBHOOK DEBUG - Request received')
  
  try {
    const body = await request.text()
    const headersList = await headers()
    
    console.log('📋 Webhook Headers:', {
      'stripe-signature': headersList.get('stripe-signature'),
      'content-type': headersList.get('content-type'),
      'user-agent': headersList.get('user-agent'),
    })
    
    console.log('📦 Webhook Body (first 200 chars):', body.substring(0, 200))
    
    try {
      const parsedBody = JSON.parse(body)
      console.log('🎯 Event Type:', parsedBody.type)
      console.log('🆔 Event ID:', parsedBody.id)
      
      if (parsedBody.type === 'payment_intent.succeeded') {
        console.log('💰 Payment Intent Succeeded!')
        console.log('📝 Metadata:', parsedBody.data.object.metadata)
      }
    } catch (parseError) {
      console.log('❌ Could not parse body as JSON:', parseError.message)
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Debug webhook received',
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('🚨 Debug webhook error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}