import { NextResponse } from 'next/server'

export async function GET() {
  // Generate a sample receipt for testing purposes
  const sampleBooking = {
    id: '86f870f9-ae92-4043-96d3-86db998b011c',
    pickup_address: 'Riga International Airport (RIX), Mārupe, LV-1053, Latvia',
    destination_address: 'Old Town Riga, Vecpilsētas iela 5, Riga, LV-1050, Latvia',
    departure_time: new Date().toISOString(),
    distance_km: 12,
    duration_minutes: 25,
    passenger_count: 2,
    luggage_count: 1,
    total_price: 35.50,
    base_price: 30.00,
    status: 'completed',
    payment_status: 'paid',
    special_requirements: 'Child seat required',
    notes: 'Please call upon arrival',
    created_at: new Date().toISOString(),
    vehicle_types: {
      name: 'Standard Sedan',
      description: 'Comfortable sedan for up to 4 passengers',
      max_passengers: 4,
      max_luggage: 3
    },
    profiles: {
      full_name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+371 20123456'
    },
    driver_assignments: [{
      assigned_at: new Date().toISOString(),
      drivers: {
        license_number: 'LV-ABC123',
        profiles: {
          full_name: 'Driver Name',
          phone: '+371 20654321'
        }
      }
    }]
  }

  const html = generateReceiptHTML(sampleBooking)
  
  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
      'Content-Disposition': `inline; filename="sample-receipt.html"`
    }
  })
}

function generateReceiptHTML(booking: any): string {
  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime)
    return {
      date: date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      })
    }
  }

  const datetime = formatDateTime(booking.departure_time)
  const createdDate = formatDateTime(booking.created_at)
  const assignedDriver = booking.driver_assignments?.[0]

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Transfer Receipt - Baltfer</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.3;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 10px;
            background-color: #f9fafb;
            font-size: 13px;
        }
        .receipt {
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 32px;
            font-weight: bold;
        }
        .header p {
            margin: 5px 0 0 0;
            opacity: 0.9;
            font-size: 18px;
        }
        .demo-notice {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            color: #92400e;
            padding: 15px;
            margin: 20px 30px;
            border-radius: 6px;
            text-align: center;
            font-weight: 600;
        }
        .content {
            padding: 30px;
        }
        .receipt-info {
            background: #f8fafc;
            border-radius: 6px;
            padding: 20px;
            margin-bottom: 30px;
            display: flex;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 20px;
        }
        .receipt-info div {
            flex: 1;
            min-width: 200px;
        }
        .receipt-info strong {
            display: block;
            color: #374151;
            margin-bottom: 5px;
        }
        .section {
            margin-bottom: 30px;
        }
        .section h2 {
            color: #0ea5e9;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 10px;
            margin-bottom: 20px;
            font-size: 20px;
        }
        .route {
            display: flex;
            align-items: center;
            gap: 15px;
            margin-bottom: 20px;
        }
        .route-point {
            display: flex;
            align-items: center;
            gap: 10px;
            flex: 1;
        }
        .route-dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            flex-shrink: 0;
        }
        .pickup-dot { background-color: #10b981; }
        .destination-dot { background-color: #ef4444; }
        .route-arrow {
            font-size: 20px;
            color: #6b7280;
        }
        .details-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }
        .detail-item {
            background: #f8fafc;
            border-radius: 6px;
            padding: 15px;
        }
        .detail-item strong {
            display: block;
            color: #374151;
            margin-bottom: 5px;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .detail-item span {
            font-size: 16px;
            font-weight: 600;
        }
        .pricing {
            background: #f0f9ff;
            border: 1px solid #bae6fd;
            border-radius: 8px;
            padding: 20px;
        }
        .pricing-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding: 5px 0;
        }
        .pricing-row.total {
            border-top: 2px solid #0ea5e9;
            margin-top: 15px;
            padding-top: 15px;
            font-size: 20px;
            font-weight: bold;
            color: #0ea5e9;
        }
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .status-paid {
            background-color: #dcfce7;
            color: #166534;
        }
        .status-confirmed {
            background-color: #dbeafe;
            color: #1e40af;
        }
        .notes {
            background: #fffbeb;
            border: 1px solid #fde68a;
            border-radius: 6px;
            padding: 15px;
            margin-top: 20px;
        }
        .footer {
            background: #f8fafc;
            padding: 20px 30px;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
        }
        @media print {
            body { background: white; padding: 0; }
            .receipt { box-shadow: none; }
            .demo-notice { display: none; }
        }
        @media (max-width: 600px) {
            .receipt-info { flex-direction: column; }
            .route { flex-direction: column; text-align: center; }
            .details-grid { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="receipt">
        <div class="header">
            <h1 style="font-family: 'Bauhaus', sans-serif; color: #ffffff;">Baltfer</h1>
            <p>Transfer Receipt</p>
        </div>
        
        <div class="demo-notice">
            🧪 DEMO RECEIPT - This is a sample receipt for testing purposes
        </div>
        
        <div class="content">
            <div class="receipt-info">
                <div>
                    <strong>Receipt #</strong>
                    ${booking.id.substring(0, 8).toUpperCase()}
                </div>
                <div>
                    <strong>Booking Date</strong>
                    ${createdDate.date}
                </div>
                <div>
                    <strong>Status</strong>
                    <span class="status-badge status-paid">Paid</span>
                    <span class="status-badge status-confirmed">${booking.status}</span>
                </div>
            </div>

            <div class="section">
                <h2>Customer Information</h2>
                <div class="details-grid">
                    <div class="detail-item">
                        <strong>Name</strong>
                        <span>${booking.profiles?.full_name || 'N/A'}</span>
                    </div>
                    <div class="detail-item">
                        <strong>Email</strong>
                        <span>${booking.profiles?.email || 'N/A'}</span>
                    </div>
                    <div class="detail-item">
                        <strong>Phone</strong>
                        <span>${booking.profiles?.phone || 'N/A'}</span>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2>Transfer Details</h2>
                <div class="route">
                    <div class="route-point">
                        <div class="route-dot pickup-dot"></div>
                        <div>
                            <strong>Pickup Location</strong><br>
                            ${booking.pickup_address}
                        </div>
                    </div>
                    <div class="route-arrow">→</div>
                    <div class="route-point">
                        <div class="route-dot destination-dot"></div>
                        <div>
                            <strong>Destination</strong><br>
                            ${booking.destination_address}
                        </div>
                    </div>
                </div>

                <div class="details-grid">
                    <div class="detail-item">
                        <strong>Date</strong>
                        <span>${datetime.date}</span>
                    </div>
                    <div class="detail-item">
                        <strong>Time</strong>
                        <span>${datetime.time}</span>
                    </div>
                    <div class="detail-item">
                        <strong>Vehicle</strong>
                        <span>${booking.vehicle_types?.name || 'N/A'}</span>
                    </div>
                    <div class="detail-item">
                        <strong>Distance</strong>
                        <span>${booking.distance_km} km</span>
                    </div>
                    <div class="detail-item">
                        <strong>Passengers</strong>
                        <span>${booking.passenger_count}</span>
                    </div>
                    <div class="detail-item">
                        <strong>Luggage</strong>
                        <span>${booking.luggage_count} bags</span>
                    </div>
                </div>
            </div>

            ${assignedDriver ? `
            <div class="section">
                <h2>Driver Information</h2>
                <div class="details-grid">
                    <div class="detail-item">
                        <strong>Driver Name</strong>
                        <span>${assignedDriver.drivers?.profiles?.full_name || 'N/A'}</span>
                    </div>
                    <div class="detail-item">
                        <strong>License Number</strong>
                        <span>${assignedDriver.drivers?.license_number || 'N/A'}</span>
                    </div>
                    <div class="detail-item">
                        <strong>Phone</strong>
                        <span>${assignedDriver.drivers?.profiles?.phone || 'N/A'}</span>
                    </div>
                </div>
            </div>
            ` : ''}

            <div class="section">
                <h2>Payment Summary</h2>
                <div class="pricing">
                    <div class="pricing-row">
                        <span>Base Price</span>
                        <span>€${booking.base_price.toFixed(2)}</span>
                    </div>
                    ${booking.total_price > booking.base_price ? `
                    <div class="pricing-row">
                        <span>Additional Charges</span>
                        <span>€${(booking.total_price - booking.base_price).toFixed(2)}</span>
                    </div>
                    ` : ''}
                    <div class="pricing-row total">
                        <span>Total Amount</span>
                        <span>€${booking.total_price.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            ${booking.special_requirements || booking.notes ? `
            <div class="section">
                <h2>Additional Information</h2>
                ${booking.special_requirements ? `
                <div class="notes">
                    <strong>Special Requirements:</strong><br>
                    ${booking.special_requirements}
                </div>
                ` : ''}
                ${booking.notes ? `
                <div class="notes">
                    <strong>Customer Notes:</strong><br>
                    ${booking.notes}
                </div>
                ` : ''}
            </div>
            ` : ''}
        </div>
        
        <div class="footer">
            <p>Thank you for choosing Baltfer for your transfer needs!</p>
            <p>For support, contact us at support@baltfer.com</p>
            <p>Generated: ${new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
        </div>
    </div>

    <script>
        // Auto-print functionality for better user experience
        window.onload = function() {
            if (window.location.search.includes('print=true')) {
                window.print();
            }
        }
    </script>
</body>
</html>
  `.trim()
}