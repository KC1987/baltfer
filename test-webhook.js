// Test script to simulate Stripe webhook
// Run with: node test-webhook.js

const testWebhook = async () => {
  try {
    // First create a test booking in your database
    // Then simulate the Stripe webhook payload
    
    const webhookPayload = {
      id: "evt_test_webhook",
      object: "event",
      type: "payment_intent.succeeded",
      data: {
        object: {
          id: "pi_test_12345",
          metadata: {
            booking_id: "your-actual-booking-id-here" // Replace with real booking ID
          }
        }
      }
    }

    const response = await fetch('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'test_signature' // You'll need proper signature for real test
      },
      body: JSON.stringify(webhookPayload)
    })

    const result = await response.text()
    console.log('Webhook Response:', result)
    
  } catch (error) {
    console.error('Test failed:', error)
  }
}

console.log('This is a template - modify booking_id and run with proper Stripe signature')
// testWebhook()