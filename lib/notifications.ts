import { createServerClient } from '@/lib/supabase-server'
import { SupabaseClient } from '@supabase/supabase-js'

interface BookingData {
  id: string
  customer_name: string
  pickup_address: string
  destination_address: string
  departure_time: string
  vehicle_type: string
  total_price: number
  payment_method?: string
}

export async function sendBookingConfirmationSMS(bookingData: BookingData, supabaseClient?: SupabaseClient) {
  try {
    const supabase = supabaseClient || await createServerClient()
    
    // Get admin notification settings
    const { data: adminSettings, error: settingsError } = await supabase
      .from('admin_settings')
      .select('admin_id, setting_key, setting_value')
      .in('setting_key', ['notification_phone', 'sms_notifications_enabled'])
    
    if (settingsError) {
      console.error('Error fetching admin settings:', settingsError)
      return { success: false, error: 'Failed to fetch admin settings' }
    }

    // Group settings by admin_id
    const adminNotificationSettings = adminSettings.reduce((acc, setting) => {
      if (!acc[setting.admin_id]) {
        acc[setting.admin_id] = {}
      }
      acc[setting.admin_id][setting.setting_key] = setting.setting_value
      return acc
    }, {} as Record<string, Record<string, string>>)

    const results = []

    // Send SMS to each admin with notifications enabled
    for (const [adminId, settings] of Object.entries(adminNotificationSettings)) {
      const phoneNumber = settings.notification_phone
      const smsEnabled = settings.sms_notifications_enabled === 'true'

      if (!smsEnabled || !phoneNumber || phoneNumber === '+1234567890') {
        console.log(`Skipping SMS for admin ${adminId}: notifications disabled or phone not configured`)
        continue
      }

      // Call the Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('send-booking-sms', {
        body: {
          booking_id: bookingData.id,
          customer_name: bookingData.customer_name,
          pickup_address: bookingData.pickup_address,
          destination_address: bookingData.destination_address,
          departure_time: bookingData.departure_time,
          vehicle_type: bookingData.vehicle_type,
          total_price: bookingData.total_price,
          payment_method: bookingData.payment_method,
          admin_phone: phoneNumber,
        },
      })

      if (error) {
        console.error(`SMS notification failed for admin ${adminId}:`, error)
        results.push({ admin_id: adminId, success: false, error: error.message })
      } else {
        console.log(`SMS notification sent successfully to admin ${adminId}`)
        results.push({ admin_id: adminId, success: true, data })
      }
    }

    return {
      success: results.some(r => r.success),
      results,
      message: `SMS notifications sent to ${results.filter(r => r.success).length} admin(s)`
    }

  } catch (error) {
    console.error('Error sending booking confirmation SMS:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function updateAdminNotificationSettings(adminId: string, settings: Record<string, string>) {
  try {
    const supabase = await createServerClient()

    const updates = Object.entries(settings).map(([key, value]) => ({
      admin_id: adminId,
      setting_key: key,
      setting_value: value,
    }))

    const { error } = await supabase
      .from('admin_settings')
      .upsert(updates, { onConflict: 'admin_id,setting_key' })

    if (error) {
      throw error
    }

    return { success: true, message: 'Admin notification settings updated' }
  } catch (error) {
    console.error('Error updating admin notification settings:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function getAdminNotificationSettings(adminId: string) {
  try {
    const supabase = await createServerClient()

    const { data, error } = await supabase
      .from('admin_settings')
      .select('setting_key, setting_value')
      .eq('admin_id', adminId)
      .in('setting_key', ['notification_phone', 'sms_notifications_enabled'])

    if (error) {
      throw error
    }

    const settings = data.reduce((acc, setting) => {
      acc[setting.setting_key] = setting.setting_value
      return acc
    }, {} as Record<string, string>)

    return { success: true, settings }
  } catch (error) {
    console.error('Error fetching admin notification settings:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}