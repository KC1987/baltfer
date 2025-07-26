import { loadStripe, Stripe } from '@stripe/stripe-js'

// Client-side Stripe instance
let stripePromise: Promise<Stripe | null>

export const getStripe = () => {
  if (!stripePromise) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    if (!publishableKey) {
      console.error('Stripe publishable key is missing')
      return Promise.resolve(null)
    }
    stripePromise = loadStripe(publishableKey)
  }
  return stripePromise
}

// Server-side Stripe instance
import StripeNode from 'stripe'

// Only initialize Stripe if we have a secret key
const stripeSecretKey = process.env.STRIPE_SECRET_KEY
if (!stripeSecretKey) {
  console.warn('Stripe secret key not found. Payment features will be disabled.')
}

export const stripe = stripeSecretKey ? new StripeNode(stripeSecretKey, {
  apiVersion: '2025-06-30.basil',
  typescript: true,
}) : null

// Stripe configuration validation
export const isStripeConfigured = () => {
  return !!(
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY && 
    process.env.STRIPE_SECRET_KEY
  )
}

// Payment status types
export type PaymentStatus = 'pending' | 'processing' | 'succeeded' | 'failed' | 'canceled'

// Payment intent metadata interface
export interface PaymentMetadata {
  booking_id: string
  user_id: string
  pickup_address: string
  destination_address: string
  departure_time: string
  vehicle_type: string
  passenger_count: string
  total_amount: string
}

// Common Stripe error handling
export const handleStripeError = (error: any): string => {
  if (error.type === 'StripeCardError') {
    // Card declined
    return error.message
  } else if (error.type === 'StripeRateLimitError') {
    return 'Too many requests. Please try again later.'
  } else if (error.type === 'StripeInvalidRequestError') {
    return 'Invalid payment request. Please check your information.'
  } else if (error.type === 'StripeAPIError') {
    return 'Payment service temporarily unavailable. Please try again.'
  } else if (error.type === 'StripeConnectionError') {
    return 'Network error. Please check your connection and try again.'
  } else if (error.type === 'StripeAuthenticationError') {
    return 'Payment authentication failed. Please contact support.'
  } else {
    return 'An unexpected error occurred. Please try again.'
  }
}

// Format currency amounts
export const formatCurrency = (amount: number, currency: string = 'EUR'): string => {
  return new Intl.NumberFormat('lv-LV', {
    style: 'currency',
    currency,
  }).format(amount)
}

// Convert euros to cents for Stripe
export const eurosToCents = (euros: number): number => {
  return Math.round(euros * 100)
}

// Convert cents to euros
export const centsToEuros = (cents: number): number => {
  return cents / 100
}

// VAT calculations for Latvia
export const LATVIA_VAT_RATE = 0.21 // 21%

export interface VATBreakdown {
  subtotal: number
  vatAmount: number
  vatRate: number
  total: number
}

// Calculate VAT breakdown from total price (VAT included)
export const calculateVATFromTotal = (totalPrice: number): VATBreakdown => {
  const subtotal = totalPrice / (1 + LATVIA_VAT_RATE)
  const vatAmount = totalPrice - subtotal
  
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    vatAmount: Math.round(vatAmount * 100) / 100,
    vatRate: LATVIA_VAT_RATE,
    total: totalPrice
  }
}

// Calculate VAT breakdown from subtotal (VAT not included)
export const calculateVATFromSubtotal = (subtotal: number): VATBreakdown => {
  const vatAmount = subtotal * LATVIA_VAT_RATE
  const total = subtotal + vatAmount
  
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    vatAmount: Math.round(vatAmount * 100) / 100,
    vatRate: LATVIA_VAT_RATE,
    total: Math.round(total * 100) / 100
  }
}

// Legacy aliases for backward compatibility
export const dollarsToCents = eurosToCents
export const centsToDollars = centsToEuros