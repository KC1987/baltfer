import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase-server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TestSMSButton } from '@/components/admin/test-sms-button'
import { MessageSquare, TestTube } from 'lucide-react'

export default async function TestSMSPage() {
  const supabase = await createServerClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard')
  }

  // Get admin phone settings
  const { data: settings } = await supabase
    .from('admin_settings')
    .select('setting_key, setting_value')
    .eq('admin_id', user.id)
    .in('setting_key', ['notification_phone', 'sms_notifications_enabled'])

  const currentSettings = settings?.reduce((acc, setting) => {
    acc[setting.setting_key] = setting.setting_value
    return acc
  }, {} as Record<string, string>) || {}

  const phoneConfigured = currentSettings.notification_phone && 
                         currentSettings.notification_phone !== '+1234567890'
  const smsEnabled = currentSettings.sms_notifications_enabled === 'true'

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <TestTube className="h-8 w-8 text-sky-500" />
          <h1 className="text-3xl font-bold">Test SMS Notifications</h1>
        </div>
        <p className="text-gray-600">
          Test the SMS notification system before going live
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Test SMS Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Send Test SMS
            </CardTitle>
            <CardDescription>
              Send a test booking notification to your configured phone number
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Configuration Status */}
            <div className="space-y-2">
              <div className={`flex items-center gap-2 text-sm ${
                phoneConfigured ? 'text-green-600' : 'text-red-600'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  phoneConfigured ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                Phone Number: {phoneConfigured ? 'Configured' : 'Not Configured'}
              </div>
              
              <div className={`flex items-center gap-2 text-sm ${
                smsEnabled ? 'text-green-600' : 'text-red-600'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  smsEnabled ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                SMS Notifications: {smsEnabled ? 'Enabled' : 'Disabled'}
              </div>
            </div>

            {/* Test Button */}
            <div className="pt-4 border-t">
              {phoneConfigured && smsEnabled ? (
                <TestSMSButton />
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-600 mb-3">
                    Please configure your phone number and enable SMS notifications first
                  </p>
                  <a 
                    href="/admin/settings" 
                    className="text-sky-600 hover:text-sky-700 text-sm font-medium"
                  >
                    Go to Settings →
                  </a>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Test Message Preview */}
        <Card>
          <CardHeader>
            <CardTitle>SMS Message Preview</CardTitle>
            <CardDescription>
              This is what the SMS notification will look like
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-100 p-4 rounded-lg font-mono text-sm">
              <div className="text-gray-800">
                🚗 NEW BALTFER BOOKING<br />
                ID: TEST1234<br />
                Customer: Test Customer<br />
                From: Baltimore/Washington International Airport<br />
                To: 123 Main St, Baltimore, MD 21201<br />
                Time: {new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleString()}<br />
                Vehicle: Premium Sedan<br />
                Total: €89.50<br />
                <br />
                Admin Dashboard: http://localhost:3000/admin/bookings/test-123
              </div>
            </div>
            
            <div className="mt-4 text-xs text-gray-500">
              <strong>Note:</strong> Actual bookings will include real customer data and booking IDs
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Environment Check */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Environment Configuration</CardTitle>
          <CardDescription>
            Check if all required environment variables are configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className={`flex items-center gap-2 ${
              process.env.VONAGE_API_KEY ? 'text-green-600' : 'text-red-600'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                process.env.VONAGE_API_KEY ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              VONAGE_API_KEY: {process.env.VONAGE_API_KEY ? 'Set' : 'Missing'}
            </div>
            
            <div className={`flex items-center gap-2 ${
              process.env.VONAGE_API_SECRET ? 'text-green-600' : 'text-red-600'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                process.env.VONAGE_API_SECRET ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              VONAGE_API_SECRET: {process.env.VONAGE_API_SECRET ? 'Set' : 'Missing'}
            </div>
          </div>
          
          {!process.env.VONAGE_API_KEY || !process.env.VONAGE_API_SECRET ? (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Missing Vonage credentials:</strong> Add VONAGE_API_KEY and VONAGE_API_SECRET to your .env.local file
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}