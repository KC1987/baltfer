// Simple test script to verify receipt endpoint
const http = require('http');

// Test receipt endpoint with a mock booking ID
const testBookingId = '86f870f9-ae92-4043-96d3-86db998b011c';
const path = `/api/receipt/${testBookingId}`;

console.log('Testing receipt endpoint...');
console.log(`URL: http://localhost:3002${path}`);

const options = {
  hostname: 'localhost',
  port: 3002,
  path: path,
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', data);
  });
});

req.on('error', (e) => {
  console.error(`Request error: ${e.message}`);
});

req.end();