'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Zap, Check, AlertCircle } from 'lucide-react'

export function TestWebhookButton() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ type: 'success' | 'error', message: string, details?: any } | null>(null)

  const handleTestWebhook = async () => {
    if (isLoading) return // Prevent double-clicks
    
    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/test-webhook-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (data.success) {
        setResult({
          type: 'success',
          message: 'Webhook SMS test completed successfully! Check your phone.',
          details: data.bookingDetails
        })
      } else {
        setResult({
          type: 'error',
          message: data.error || 'Webhook test failed'
        })
      }
    } catch (error) {
      setResult({
        type: 'error',
        message: 'Network error. Please try again.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {result && (
        <Alert className={result.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          {result.type === 'success' ? (
            <Check className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className={result.type === 'success' ? 'text-green-700' : 'text-red-700'}>
            {result.message}
            {result.details && (
              <div className="mt-2 text-xs">
                <strong>Booking:</strong> {result.details.customer} - {result.details.pickup} → {result.details.destination}
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      <Button 
        onClick={handleTestWebhook} 
        disabled={isLoading}
        className="w-full"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Testing Webhook SMS...
          </>
        ) : (
          <>
            <Zap className="h-4 w-4 mr-2" />
            Test Webhook SMS
          </>
        )}
      </Button>

      <div className="text-xs text-gray-500 text-center">
        This will send SMS using your most recent booking data
      </div>
    </div>
  )
}