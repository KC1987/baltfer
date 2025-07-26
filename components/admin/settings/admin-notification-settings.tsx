'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Check, AlertCircle, Phone } from 'lucide-react'

interface AdminNotificationSettingsProps {
  userId: string
  currentSettings: Record<string, string>
}

export function AdminNotificationSettings({ userId, currentSettings }: AdminNotificationSettingsProps) {
  const [phone, setPhone] = useState(currentSettings.notification_phone || '')
  const [smsEnabled, setSmsEnabled] = useState(currentSettings.sms_notifications_enabled === 'true')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleSave = async () => {
    setIsLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          settings: {
            notification_phone: phone,
            sms_notifications_enabled: smsEnabled.toString(),
          },
        }),
      })

      const result = await response.json()

      if (result.success) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' })
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to save settings' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  const isValidPhone = (phone: string) => {
    return /^\+[1-9]\d{1,14}$/.test(phone)
  }

  return (
    <div className="space-y-6">
      {message && (
        <Alert className={message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          {message.type === 'success' ? (
            <Check className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className={message.type === 'success' ? 'text-green-700' : 'text-red-700'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {/* SMS Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Phone className="h-5 w-5" />
            SMS Notifications
          </CardTitle>
          <CardDescription>
            Receive SMS alerts when new bookings are confirmed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Enable SMS Notifications</Label>
              <div className="text-sm text-gray-500">
                Get notified immediately when payments are confirmed
              </div>
            </div>
            <Switch
              checked={smsEnabled}
              onCheckedChange={setSmsEnabled}
            />
          </div>

          {smsEnabled && (
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1234567890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={!isValidPhone(phone) && phone ? 'border-red-300' : ''}
              />
              <div className="text-sm text-gray-500">
                Enter phone number in international format (e.g., +1234567890)
              </div>
              {!isValidPhone(phone) && phone && (
                <div className="text-sm text-red-600">
                  Please enter a valid international phone number starting with +
                </div>
              )}
            </div>
          )}

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="text-sm text-blue-800">
              <strong>SMS Content Preview:</strong>
            </div>
            <div className="text-xs text-blue-700 mt-2 font-mono">
              🚗 NEW BALTFER BOOKING<br />
              ID: ABC12345<br />
              Customer: John Doe<br />
              From: Airport Terminal<br />
              To: Downtown Hotel<br />
              Time: Jan 15, 2024 2:30 PM<br />
              Vehicle: Premium Sedan<br />
              Total: €89.50<br />
              <br />
              Admin Dashboard: [link]
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={isLoading || (smsEnabled && !isValidPhone(phone))}
          className="min-w-[120px]"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Settings'
          )}
        </Button>
      </div>
    </div>
  )
}