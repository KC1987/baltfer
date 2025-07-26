'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  LayoutDashboard,
  Calendar,
  Users,
  Car,
  MapPin,
  DollarSign,
  Star,
  Settings,
  X,
  UserCheck,
  BarChart3,
  TestTube,
  Zap
} from 'lucide-react'

interface AdminSidebarProps {
  open: boolean
  setOpen: (open: boolean) => void
  isMobile?: boolean
}

const navigation = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
    badge: null
  },
  {
    name: 'Bookings',
    href: '/admin/bookings',
    icon: Calendar,
    badge: 'New'
  },
  {
    name: 'Customers',
    href: '/admin/customers',
    icon: Users,
    badge: null
  },
  {
    name: 'Drivers',
    href: '/admin/drivers',
    icon: UserCheck,
    badge: null
  },
  {
    name: 'Fleet',
    href: '/admin/fleet',
    icon: Car,
    badge: null
  },
  {
    name: 'Locations',
    href: '/admin/locations',
    icon: MapPin,
    badge: null
  },
  {
    name: 'Pricing',
    href: '/admin/pricing',
    icon: DollarSign,
    badge: null
  },
  {
    name: 'Reviews',
    href: '/admin/reviews',
    icon: Star,
    badge: null
  },
  {
    name: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
    badge: null
  },
  {
    name: 'Test SMS',
    href: '/admin/test-sms',
    icon: TestTube,
    badge: 'Dev'
  },
  {
    name: 'Test Webhook',
    href: '/admin/test-webhook',
    icon: Zap,
    badge: 'Dev'
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    badge: null
  }
]

export function AdminSidebar({ open, setOpen, isMobile = false }: AdminSidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile backdrop */}
      {open && isMobile && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        'fixed top-16 left-0 z-50 h-[calc(100vh-4rem)] w-72 sm:w-80 lg:w-64 bg-white shadow-xl lg:shadow-lg transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto lg:top-0 lg:h-screen border-r border-gray-200',
        open ? 'translate-x-0' : '-translate-x-full',
        'overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100'
      )}>
        {/* Header - Only show on mobile when sidebar is open */}
        <div className="flex items-center justify-between h-14 px-4 sm:px-6 border-b border-gray-100 lg:hidden">
          <div className="text-lg font-semibold text-gray-900">Navigation</div>
          <Button
            variant="ghost"
            size="sm"
            className="p-2 hover:bg-gray-100 rounded-md"
            onClick={() => setOpen(false)}
          >
            <X className="h-5 w-5 text-gray-500" />
          </Button>
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:flex items-center h-16 px-6 border-b border-gray-200">
          <div className="text-lg font-semibold text-primary">Admin Panel</div>
        </div>

        {/* Navigation */}
        <nav className="py-4 px-3 sm:px-4 lg:px-4 lg:mt-4">
          <div className="space-y-1">
            {navigation.map((item, index) => {
              const Icon = item.icon
              const isActive = pathname === item.href || 
                (item.href !== '/admin' && pathname.startsWith(item.href))
              
              return (
                <Link
                  key={index}
                  href={item.href}
                  className={cn(
                    'flex items-center justify-between px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 group',
                    isActive 
                      ? 'bg-gradient-to-r from-primary to-primary/90 text-white shadow-sm shadow-primary/25' 
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 active:bg-gray-100'
                  )}
                  onClick={() => isMobile && setOpen(false)}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <Icon className={cn(
                      "h-5 w-5 flex-shrink-0 transition-colors",
                      isActive ? "text-white" : "text-gray-500 group-hover:text-gray-700"
                    )} />
                    <span className="truncate">{item.name}</span>
                  </div>
                  {item.badge && (
                    <Badge 
                      variant={isActive ? "secondary" : "outline"}
                      className={cn(
                        "text-xs ml-2 flex-shrink-0",
                        isActive 
                          ? "bg-white/20 text-white border-white/30" 
                          : "bg-gray-100 text-gray-600 border-gray-200"
                      )}
                    >
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 bg-gray-50/50">
          <div className="text-xs text-gray-500 text-center font-medium">
            Baltfer Admin v1.0
          </div>
          <div className="text-xs text-gray-400 text-center mt-1">
            Build {new Date().getFullYear()}
          </div>
        </div>
      </div>
    </>
  )
}