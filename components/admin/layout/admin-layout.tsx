'use client'

import { useState, useEffect } from 'react'
import { AdminSidebar } from './admin-sidebar'
import { AdminNavbar } from './admin-navbar'

interface AdminLayoutProps {
  children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
      // Auto-close sidebar on mobile when window resizes
      if (window.innerWidth < 1024) {
        setSidebarOpen(false)
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Close sidebar when clicking outside on mobile
  const handleMainClick = () => {
    if (isMobile && sidebarOpen) {
      setSidebarOpen(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Navbar - Fixed on mobile */}
      <AdminNavbar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
      />
      
      <div className="flex pt-16"> {/* Account for fixed navbar */}
        {/* Admin Sidebar */}
        <AdminSidebar 
          open={sidebarOpen} 
          setOpen={setSidebarOpen}
          isMobile={isMobile}
        />
        
        {/* Main Content */}
        <main 
          className="flex-1 lg:ml-64 transition-all duration-300 ease-in-out"
          onClick={handleMainClick}
        >
          <div className="p-3 sm:p-4 lg:p-6 max-w-full overflow-hidden">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}