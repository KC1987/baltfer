'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { 
  Menu, 
  User, 
  LogOut, 
  Settings, 
  Bell,
  Search 
} from 'lucide-react'
import { Input } from '@/components/ui/input'

interface AdminNavbarProps {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

interface AdminProfile {
  full_name: string | null
  email: string
}

export function AdminNavbar({ sidebarOpen, setSidebarOpen }: AdminNavbarProps) {
  const [profile, setProfile] = useState<AdminProfile | null>(null)
  const [notifications, setNotifications] = useState(0)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    let isMounted = true

    const getProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user && isMounted) {
          const { data } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .single()
          
          if (isMounted) {
            setProfile({
              full_name: data?.full_name,
              email: user.email || ''
            })
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
      }
    }

    // Get unread notifications count (simulated for now)
    if (isMounted) {
      setNotifications(3)
    }

    getProfile()

    return () => {
      isMounted = false
    }
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <nav className="bg-white shadow-sm border-b border-slate-200 fixed w-full z-40 top-0">
      <div className="px-3 sm:px-4 lg:px-6">
        <div className="flex justify-between items-center h-16">
          {/* Left section */}
          <div className="flex items-center min-w-0 flex-1 sm:flex-none">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden mr-2 p-2 hover:bg-gray-100 rounded-md"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="h-5 w-5 text-gray-800" />
            </Button>
            
            {/* Logo and title */}
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
              <div className="text-2xl sm:text-3xl font-bold text-sky-500 font-bauhaus truncate">
                Baltfer
              </div>
              <Badge variant="secondary" className="text-xs hidden sm:inline-flex bg-sky-100 text-sky-700 border-sky-200">
                Admin
              </Badge>
            </div>
          </div>

          {/* Center section - Search (Desktop only) */}
          <div className="hidden lg:flex items-center flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 h-4 w-4" />
              <Input
                placeholder="Search bookings, customers..."
                className="pl-10 w-full border-slate-300 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* Right section */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            {/* Mobile search button */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="lg:hidden p-2 hover:bg-gray-100 rounded-md"
            >
              <Search className="h-5 w-5 text-gray-800" />
            </Button>

            {/* Notifications */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="relative p-2 hover:bg-gray-100 rounded-md"
            >
              <Bell className="h-5 w-5 text-gray-800" />
              {notifications > 0 && (
                <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                  {notifications > 9 ? '9+' : notifications}
                </div>
              )}
            </Button>

            {/* Admin profile dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-md"
                >
                  <div className="h-8 w-8 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-full flex items-center justify-center shadow-sm">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="hidden sm:block text-left min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate max-w-24 lg:max-w-none">
                      {profile?.full_name || 'Admin'}
                    </div>
                    <div className="text-xs text-gray-600 hidden lg:block">
                      Administrator
                    </div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 sm:w-56">
                <div className="px-3 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {profile?.full_name || 'Admin User'}
                  </p>
                  <p className="text-xs text-gray-600 truncate">
                    {profile?.email}
                  </p>
                </div>
                <DropdownMenuItem 
                  onClick={() => router.push('/admin/settings')}
                  className="py-2 cursor-pointer"
                >
                  <Settings className="mr-3 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => router.push('/dashboard')}
                  className="py-2 cursor-pointer"
                >
                  <User className="mr-3 h-4 w-4" />
                  User Dashboard
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleSignOut}
                  className="py-2 cursor-pointer text-red-600 focus:text-red-600"
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  )
}