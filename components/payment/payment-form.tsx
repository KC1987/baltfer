'use client'

import { useState, useEffect, useCallback } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CreditCard, Lock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { formatCurrency } from '@/lib/stripe'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')

interface PaymentFormProps {
  bookingId: string
  amount: number
  currency?: string
  onSuccess: (paymentIntent: any) => void
  onError: (error: string) => void
}

interface BookingDetails {
  id: string
  pickup_address: string
  destination_address: string
  departure_time: string
  total_price: number
  vehicle_types: {
    name: string
  }
  passenger_count: number
}

const PaymentFormContent = ({ bookingId, amount, currency = 'usd', onSuccess, onError }: PaymentFormProps) => {
  const stripe = useStripe()
  const elements = useElements()
  const [isLoading, setIsLoading] = useState(false)
  const [clientSecret, setClientSecret] = useState<string>('')
  const [paymentIntentId, setPaymentIntentId] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [cardError, setCardError] = useState<string>('')
  const [cardComplete, setCardComplete] = useState<boolean>(false)
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null)

  const createPaymentIntentCallback = useCallback(async () => {
    try {
      const response = await fetch('/api/payment/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          booking_id: bookingId,
          amount,
          currency
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.error === 'Payment service not configured') {
          throw new Error('Payment service is currently unavailable. Please contact support to complete your booking.')
        }
        throw new Error(data.error || 'Failed to create payment intent')
      }

      setClientSecret(data.client_secret)
      setPaymentIntentId(data.payment_intent_id)
    } catch (err: any) {
      setError(err.message)
      onError(err.message)
    }
  }, [bookingId, amount, currency, onError])

  const fetchBookingDetailsCallback = useCallback(async () => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`)
      if (response.ok) {
        const data = await response.json()
        setBookingDetails(data.booking)
      }
    } catch (err) {
      console.error('Error fetching booking details:', err)
    }
  }, [bookingId])

  useEffect(() => {
    // Create payment intent when component mounts
    createPaymentIntentCallback()
    fetchBookingDetailsCallback()
  }, [createPaymentIntentCallback, fetchBookingDetailsCallback])


  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    const cardElement = elements.getElement(CardElement)

    if (!cardElement) {
      setError('Card element not found')
      return
    }

    if (!clientSecret) {
      setError('Payment not initialized. Please try again.')
      return
    }

    setIsLoading(true)
    setError('')
    setCardError('')

    try {
      // Confirm payment
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              // Add billing details from user profile if available
            },
          },
        }
      )

      if (stripeError) {
        setError(stripeError.message || 'Payment failed')
        onError(stripeError.message || 'Payment failed')
      } else if (paymentIntent) {
        // Confirm payment on server
        const confirmResponse = await fetch('/api/payment/confirm', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            payment_intent_id: paymentIntent.id,
          }),
        })

        const confirmData = await confirmResponse.json()

        if (!confirmResponse.ok) {
          throw new Error(confirmData.error || 'Failed to confirm payment')
        }

        onSuccess(paymentIntent)
      }
    } catch (err: any) {
      setError(err.message)
      onError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCardChange = (event: any) => {
    if (event.error) {
      setCardError(event.error.message)
    } else {
      setCardError('')
    }
    setCardComplete(event.complete)
  }

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSmoothing: 'antialiased',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
      complete: {
        color: '#424770',
      },
    },
    hidePostalCode: true,
  }

  return (
    <div className="space-y-6">
      {/* Booking Summary */}
      {bookingDetails && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Booking Summary
            </CardTitle>
            <CardDescription>
              Confirm your transfer details before payment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <div className="text-sm font-medium">Route</div>
                <div className="text-sm text-muted-foreground">
                  From: {bookingDetails.pickup_address}
                </div>
                <div className="text-sm text-muted-foreground">
                  To: {bookingDetails.destination_address}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium">Vehicle</div>
                  <div className="text-sm text-muted-foreground">
                    {bookingDetails.vehicle_types.name}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium">Passengers</div>
                  <div className="text-sm text-muted-foreground">
                    {bookingDetails.passenger_count}
                  </div>
                </div>
              </div>
              
              <div>
                <div className="text-sm font-medium">Departure</div>
                <div className="text-sm text-muted-foreground">
                  {new Date(bookingDetails.departure_time).toLocaleString()}
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="flex justify-between items-center">
              <span className="font-semibold">Total Amount</span>
              <div className="text-right">
                <div className="text-2xl font-bold">
                  {formatCurrency(amount)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Including all taxes and fees
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Information
          </CardTitle>
          <CardDescription>
            Your payment is secured with 256-bit SSL encryption
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Card Details</label>
                <Badge variant="secondary" className="text-xs">
                  <Lock className="h-3 w-3 mr-1" />
                  Secure
                </Badge>
              </div>
              <div className={`border rounded-md p-4 bg-background focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent ${cardError ? 'border-red-300' : ''}`}>
                <CardElement options={cardElementOptions} onChange={handleCardChange} />
              </div>
              {cardError && (
                <div className="text-sm text-red-600">{cardError}</div>
              )}
              <div className="text-xs text-muted-foreground">
                We accept Visa, Mastercard, American Express, and more
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-start gap-2">
                <Lock className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <div className="font-medium mb-1">Secure Payment</div>
                  <ul className="space-y-1 text-xs">
                    <li>• Your card details are encrypted and secure</li>
                    <li>• No payment until your transfer is confirmed</li>
                    <li>• Free cancellation up to 2 hours before pickup</li>
                  </ul>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={!stripe || isLoading || !clientSecret || !cardComplete || !!cardError}
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing Payment...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Pay {formatCurrency(amount)}
                </>
              )}
            </Button>

            <div className="text-center text-xs text-muted-foreground">
              By completing this payment, you agree to our Terms of Service and Privacy Policy
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export function PaymentForm(props: PaymentFormProps) {
  // Check if Stripe is configured
  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.includes('placeholder')) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            Payment Service Unavailable
          </CardTitle>
          <CardDescription>
            Payment processing is currently being configured
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Payment processing is temporarily unavailable. Your booking has been saved and you can complete payment later.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-2">
            <h4 className="font-semibold">What happens next?</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Your booking has been saved with booking ID</li>
              <li>• You will receive an email with payment instructions</li>
              <li>• You can pay via bank transfer or contact support</li>
              <li>• Your transfer will be confirmed once payment is received</li>
            </ul>
          </div>
          
          <div className="flex gap-2">
            <Button className="flex-1" onClick={() => window.location.href = '/dashboard'}>
              View Booking Details
            </Button>
            <Button variant="outline" onClick={() => window.location.href = 'mailto:support@baltfer.com'}>
              Contact Support
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Elements stripe={stripePromise}>
      <PaymentFormContent {...props} />
    </Elements>
  )
}