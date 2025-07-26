'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function AdminTestPage() {
  const [result, setResult] = useState<string>('Testing...')

  useEffect(() => {
    const testAdminAPI = async () => {
      try {
        console.log('Testing admin API...')
        const response = await fetch('/api/admin/bookings?page=1&limit=5')
        console.log('Response status:', response.status)
        console.log('Response headers:', Object.fromEntries(response.headers.entries()))
        
        if (!response.ok) {
          const errorText = await response.text()
          console.error('Error response:', errorText)
          setResult(`Error: ${response.status} - ${errorText}`)
          return
        }
        
        const data = await response.json()
        console.log('Success data:', data)
        setResult(`Success: Got ${data.bookings?.length || 0} bookings. Total: ${data.pagination?.total || 0}`)
        
      } catch (error) {
        console.error('Fetch error:', error)
        setResult(`Fetch Error: ${error}`)
      }
    }

    testAdminAPI()
  }, [])

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Admin API Test</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{result}</p>
          <div className="mt-4">
            <p className="text-sm text-gray-600">Check the browser console for detailed logs.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}