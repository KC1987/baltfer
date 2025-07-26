import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase-server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AdminNotificationSettings } from '@/components/admin/settings/admin-notification-settings'
import { Bell, MessageSquare, Settings } from 'lucide-react'

export default async function AdminSettingsPage() {
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

  // Get current notification settings
  const { data: settings } = await supabase
    .from('admin_settings')
    .select('setting_key, setting_value')
    .eq('admin_id', user.id)
    .in('setting_key', ['notification_phone', 'sms_notifications_enabled'])

  const currentSettings = settings?.reduce((acc, setting) => {
    acc[setting.setting_key] = setting.setting_value
    return acc
  }, {} as Record<string, string>) || {}

  // Get recent notifications
  const { data: recentNotifications } = await supabase
    .from('admin_notifications')
    .select(`
      id,
      type,
      recipient,
      status,
      sent_at,
      created_at,
      bookings!inner(id, pickup_address, destination_address)
    `)
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="h-8 w-8 text-sky-500" />
          <h1 className="text-3xl font-bold">Admin Settings</h1>
        </div>
        <p className="text-gray-600">
          Manage your notification preferences and system settings
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Settings Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Settings
              </CardTitle>
              <CardDescription>
                Configure how you receive booking notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AdminNotificationSettings 
                userId={user.id}
                currentSettings={currentSettings}
              />
            </CardContent>
          </Card>

          {/* SMS Service Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                SMS Service Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Vonage SMS Service</span>
                <Badge className="bg-green-500 text-white">Active</Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Cost per SMS:</span>
                  <span className="ml-2 font-medium">$0.0057</span>
                </div>
                <div>
                  <span className="text-gray-600">Est. Monthly:</span>
                  <span className="ml-2 font-medium">~$0.75</span>
                </div>
              </div>
              <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                <strong>Note:</strong> SMS notifications are triggered automatically when bookings are confirmed via payment. 
                Each notification includes booking details and a direct link to the admin dashboard.
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Notifications */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Notifications</CardTitle>
              <CardDescription>
                Last 10 SMS notifications sent
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentNotifications && recentNotifications.length > 0 ? (
                <div className="space-y-3">
                  {recentNotifications.map((notification) => (
                    <div key={notification.id} className="border-b border-gray-100 pb-3 last:border-b-0">
                      <div className="flex items-center justify-between mb-1">
                        <Badge 
                          variant={notification.status === 'sent' ? 'default' : 'destructive'}
                          className="text-xs"
                        >
                          {notification.status}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {new Date(notification.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {notification.type.toUpperCase()} to {notification.recipient}
                      </div>
                      {notification.bookings && (
                        <div className="text-xs text-gray-500 mt-1">
                          Booking: {(notification.bookings as any).pickup_address} → {(notification.bookings as any).destination_address}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No notifications sent yet</p>
                  <p className="text-xs">Notifications will appear here when bookings are confirmed</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}