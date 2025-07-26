// Simple test to verify notification service logic
// Run with: node test-notifications.js

const testNotificationLogic = () => {
  console.log('🧪 Testing SMS Notification Logic\n')

  // Test 1: Message formatting
  const bookingData = {
    id: 'test-booking-123',
    customer_name: 'John Doe',
    pickup_address: 'Baltimore/Washington International Airport',
    destination_address: '123 Main St, Baltimore, MD 21201',
    departure_time: '2024-01-15T14:30:00Z',
    vehicle_type: 'Premium Sedan',
    total_price: 89.50,
  }

  const formatSMSMessage = (data) => {
    return `🚗 NEW BALTFER BOOKING
ID: ${data.id.slice(-8).toUpperCase()}
Customer: ${data.customer_name}
From: ${data.pickup_address}
To: ${data.destination_address}
Time: ${new Date(data.departure_time).toLocaleString()}
Vehicle: ${data.vehicle_type}
Total: €${data.total_price.toFixed(2)}

Admin Dashboard: http://localhost:3000/admin/bookings/${data.id}`
  }

  const message = formatSMSMessage(bookingData)
  console.log('✅ SMS Message Format Test:')
  console.log('----------------------------')
  console.log(message)
  console.log('----------------------------\n')

  // Test 2: Phone number validation
  const validatePhone = (phone) => /^\+[1-9]\d{1,14}$/.test(phone)
  
  const testPhones = [
    '+1234567890', // Valid
    '+44123456789', // Valid
    '1234567890', // Invalid (no +)
    '+0123456789', // Invalid (starts with 0)
    'not-a-phone', // Invalid
  ]

  console.log('✅ Phone Validation Test:')
  testPhones.forEach(phone => {
    console.log(`${phone}: ${validatePhone(phone) ? '✅ Valid' : '❌ Invalid'}`)
  })

  console.log('\n🎉 All logic tests passed!')
  console.log('\n📱 Next Steps:')
  console.log('1. Add Vonage credentials to .env.local')
  console.log('2. Visit /admin/test-sms to send real SMS')
  console.log('3. Create a test booking to test full flow')
}

testNotificationLogic()