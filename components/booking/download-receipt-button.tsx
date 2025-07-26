'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'

interface DownloadReceiptButtonProps {
  bookingId: string
  className?: string
  size?: 'default' | 'sm' | 'lg' | 'icon'
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
}

export function DownloadReceiptButton({ 
  bookingId, 
  className = '', 
  size = 'sm',
  variant = 'ghost'
}: DownloadReceiptButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    try {
      setIsDownloading(true)
      
      // Call the receipt API
      const response = await fetch(`/api/receipt/${bookingId}`)
      
      if (!response.ok) {
        throw new Error('Failed to generate receipt')
      }
      
      // Get the PDF blob
      const blob = await response.blob()
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `baltfer-receipt-${bookingId.slice(-8).toUpperCase()}.pdf`
      
      // Trigger download
      document.body.appendChild(link)
      link.click()
      
      // Cleanup
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
    } catch (error) {
      console.error('Download failed:', error)
      alert('Failed to download receipt. Please try again or contact support.')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <Button 
      variant={variant} 
      className={`w-full ${className}`} 
      size={size}
      onClick={handleDownload}
      disabled={isDownloading}
    >
      {isDownloading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Download className="h-4 w-4 mr-2" />
      )}
      {isDownloading ? 'Generating Receipt...' : 'Download Receipt'}
    </Button>
  )
}