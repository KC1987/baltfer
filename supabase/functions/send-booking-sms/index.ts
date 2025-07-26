import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BookingNotification {
  booking_id: string
  customer_name: string
  pickup_address: string
  destination_address: string
  departure_time: string
  vehicle_type: string
  total_price: number
  payment_method?: string
  admin_phone: string
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { booking_id, customer_name, pickup_address, destination_address, departure_time, vehicle_type, total_price, payment_method, admin_phone } = await req.json() as BookingNotification

    // Format the SMS message (ultra-short version)
    const shortPickup = pickup_address.length > 30 ? pickup_address.substring(0, 30) + '...' : pickup_address
    const shortDestination = destination_address.length > 30 ? destination_address.substring(0, 30) + '...' : destination_address
    
    const paymentIcon = payment_method === 'cash' ? '💵' : '💳'
    const paymentText = payment_method === 'cash' ? ' (CASH)' : ''
    
    const smsMessage = `🚗 ${customer_name} | ${shortPickup}→${shortDestination} | ${new Date(departure_time).toLocaleDateString()} ${new Date(departure_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} | ${paymentIcon}€${total_price.toFixed(2)}${paymentText}`

    // Send SMS using Vonage API (most cost-effective)
    const vonageApiKey = Deno.env.get('VONAGE_API_KEY')
    const vonageApiSecret = Deno.env.get('VONAGE_API_SECRET')
    
    if (!vonageApiKey || !vonageApiSecret) {
      throw new Error('Vonage API credentials not configured')
    }

    const vonageResponse = await fetch('https://rest.nexmo.com/sms/json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Baltfer',
        to: admin_phone,
        text: smsMessage,
        api_key: vonageApiKey,
        api_secret: vonageApiSecret,
      }),
    })

    const vonageResult = await vonageResponse.json()

    if (vonageResult.messages[0].status !== '0') {
      throw new Error(`SMS failed: ${vonageResult.messages[0]['error-text']}`)
    }

    // Log the notification for admin dashboard
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    await supabase
      .from('admin_notifications')
      .insert({
        type: 'sms',
        booking_id,
        recipient: admin_phone,
        message: smsMessage,
        status: 'sent',
        sent_at: new Date().toISOString(),
      })

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'SMS notification sent successfully',
        message_id: vonageResult.messages[0]['message-id']
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('SMS notification error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})