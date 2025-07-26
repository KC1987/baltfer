'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { PaymentForm } from '@/components/payment/payment-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'

interface PaymentPageClientProps {
  booking: any
}

export function PaymentPageClient({ booking }: PaymentPageClientProps) {
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)

  const handlePaymentSuccess = async (paymentIntent: any) => {
    setIsProcessing(true)
    
    // Wait a moment for the server to process the payment
    setTimeout(() => {
      router.push(`/payment-success?booking_id=${booking.id}&payment_intent=${paymentIntent.id}`)
    }, 2000)
  }

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error)
    // Error is already displayed in the payment form
  }

  if (isProcessing) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="p-8">
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <h3 className="text-lg font-semibold">Processing Your Payment</h3>
                <p className="text-muted-foreground">
                  Please wait while we confirm your payment...
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
        
        <PaymentForm
          bookingId={booking.id}
          amount={booking.total_price}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
        />
      </div>
    </div>
  )
}