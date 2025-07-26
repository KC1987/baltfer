import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { calculateVATFromTotal } from '@/lib/stripe'
import puppeteer from 'puppeteer'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerClient()
    
    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Fetch booking details with related data
    const { data: booking, error } = await supabase
      .from('bookings')
      .select(`
        *,
        vehicle_types (
          name,
          description,
          max_passengers,
          max_luggage
        )
      `)
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user can only access their own receipts
      .single()

    // Fetch user profile separately
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, phone')
      .eq('id', user.id)
      .single()

    // Fetch driver assignments separately if needed
    const { data: driverAssignments } = await supabase
      .from('driver_assignments')
      .select(`
        id,
        assigned_at,
        drivers (
          user_id,
          license_number
        )
      `)
      .eq('booking_id', id)

    if (error || !booking) {
      console.error('Booking not found:', { id, error, userId: user.id })
      return NextResponse.json(
        { 
          error: 'Booking not found',
          details: 'The booking either does not exist or you do not have permission to access it',
          bookingId: id
        },
        { status: 404 }
      )
    }

    // Only allow receipt generation for paid bookings
    if (booking.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Receipt only available for paid bookings' },
        { status: 400 }
      )
    }

    // Calculate VAT breakdown
    const vatBreakdown = calculateVATFromTotal(booking.total_price)
    
    // Generate HTML receipt
    const html = generateReceiptHTML(booking, profile, driverAssignments || [], user, vatBreakdown)
    
    // Check if PDF is requested (default to PDF)
    const format = request.nextUrl.searchParams.get('format') || 'pdf'
    
    if (format === 'html') {
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html',
          'Content-Disposition': `inline; filename="receipt-${booking.id.substring(0, 8)}.html"`
        }
      })
    }
    
    // Generate PDF
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    
    try {
      const page = await browser.newPage()
      await page.setContent(html, { waitUntil: 'networkidle0' })
      
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '0.5cm',
          right: '0.8cm',
          bottom: '0.5cm',
          left: '0.8cm'
        },
        preferCSSPageSize: true,
        displayHeaderFooter: false
      })
      
      return new NextResponse(pdf, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="receipt-${booking.id.substring(0, 8)}.pdf"`
        }
      })
    } finally {
      await browser.close()
    }

  } catch (error: any) {
    console.error('Error generating receipt:', error)
    return NextResponse.json(
      { error: 'Failed to generate receipt' },
      { status: 500 }
    )
  }
}

function generateReceiptHTML(booking: any, profile: any, driverAssignments: any[], user: any, vatBreakdown: any): string {
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
  const assignedDriver = driverAssignments?.[0]

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
            padding: 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: bold;
        }
        .header p {
            margin: 3px 0 0 0;
            opacity: 0.9;
            font-size: 14px;
        }
        .content {
            padding: 15px;
        }
        .receipt-info {
            background: #f8fafc;
            border-radius: 6px;
            padding: 12px;
            margin-bottom: 15px;
            display: flex;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 12px;
        }
        .receipt-info div {
            flex: 1;
            min-width: 150px;
        }
        .receipt-info strong {
            display: block;
            color: #374151;
            margin-bottom: 3px;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .section {
            margin-bottom: 18px;
        }
        .section h2 {
            color: #0ea5e9;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 6px;
            margin-bottom: 12px;
            font-size: 16px;
            margin-top: 0;
        }
        .route {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 12px;
        }
        .route-point {
            display: flex;
            align-items: center;
            gap: 8px;
            flex: 1;
        }
        .route-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            flex-shrink: 0;
        }
        .pickup-dot { background-color: #10b981; }
        .destination-dot { background-color: #ef4444; }
        .route-arrow {
            font-size: 16px;
            color: #6b7280;
        }
        .details-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
            gap: 12px;
            margin-bottom: 12px;
        }
        .details-grid-2col {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 12px;
        }
        .detail-item {
            background: #f8fafc;
            border-radius: 4px;
            padding: 10px;
        }
        .detail-item strong {
            display: block;
            color: #374151;
            margin-bottom: 3px;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .detail-item span {
            font-size: 13px;
            font-weight: 600;
        }
        .pricing {
            background: #f0f9ff;
            border: 1px solid #bae6fd;
            border-radius: 6px;
            padding: 12px;
        }
        .pricing-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 6px;
            padding: 3px 0;
            font-size: 13px;
        }
        .pricing-row.total {
            border-top: 1px solid #0ea5e9;
            margin-top: 8px;
            padding-top: 8px;
            font-size: 16px;
            font-weight: bold;
            color: #0ea5e9;
        }
        .status-badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 10px;
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
            border-radius: 4px;
            padding: 10px;
            margin-top: 10px;
            font-size: 12px;
        }
        .footer {
            background: #f8fafc;
            padding: 12px 15px;
            text-align: center;
            color: #6b7280;
            font-size: 11px;
        }
        @media print {
            body { 
                background: white; 
                padding: 0; 
                margin: 0;
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
            }
            .receipt { 
                box-shadow: none; 
                margin: 0;
                border-radius: 0;
            }
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
                <div class="details-grid-2col">
                    <div class="detail-item">
                        <strong>Name</strong>
                        <span>${profile?.full_name || 'N/A'}</span>
                    </div>
                    <div class="detail-item">
                        <strong>Email</strong>
                        <span>${user?.email || 'N/A'}</span>
                    </div>
                </div>
                <div class="detail-item" style="margin-bottom: 12px;">
                    <strong>Phone</strong>
                    <span>${profile?.phone || 'N/A'}</span>
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

                <div class="details-grid" style="grid-template-columns: repeat(3, 1fr);">
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
                </div>
                <div class="details-grid" style="grid-template-columns: repeat(3, 1fr);">
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
                <div class="detail-item">
                    <strong>Driver Status</strong>
                    <span>Driver Assigned - Contact details will be provided before pickup</span>
                </div>
            </div>
            ` : ''}

            <div class="section">
                <h2>Payment Summary</h2>
                <div class="pricing">
                    <div class="pricing-row">
                        <span>Subtotal (excl. VAT)</span>
                        <span>€${vatBreakdown.subtotal.toFixed(2)}</span>
                    </div>
                    <div class="pricing-row">
                        <span>VAT (21%)</span>
                        <span>€${vatBreakdown.vatAmount.toFixed(2)}</span>
                    </div>
                    <div class="pricing-row total">
                        <span>Total Amount (incl. VAT)</span>
                        <span>€${booking.total_price.toFixed(2)}</span>
                    </div>
                </div>
                <div class="notes" style="margin-top: 10px;">
                    <strong>VAT Information:</strong><br>
                    VAT Registration Number: LV40103258378<br>
                    VAT Rate: 21% (Standard rate for Latvia)<br>
                    This invoice complies with EU VAT Directive 2006/112/EC
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

</body>
</html>
  `.trim()
}