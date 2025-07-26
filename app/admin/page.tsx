import { createServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { AdminLayout } from '@/components/admin/layout/admin-layout'
import { DashboardMetrics } from '@/components/admin/dashboard/dashboard-metrics'
import { RecentBookings } from '@/components/admin/dashboard/recent-bookings'
import { AnalyticsChart } from '@/components/admin/dashboard/analytics-chart'
import { ActivityFeed } from '@/components/admin/dashboard/activity-feed'

export default async function AdminDashboard() {
  const supabase = await createServerClient()

  // Check authentication and admin role
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/auth/login')
  }

  // Verify admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Page Header */}
        <div className="pb-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">Dashboard</h1>
          <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">
            Welcome back! Here&apos;s what&apos;s happening with Baltfer today.
          </p>
        </div>

        {/* Dashboard Metrics */}
        <DashboardMetrics />

        {/* Charts and Recent Activity */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
          <AnalyticsChart />
          <ActivityFeed />
        </div>

        {/* Recent Bookings */}
        <RecentBookings />
      </div>
    </AdminLayout>
  )
}