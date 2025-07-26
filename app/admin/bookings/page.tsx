import { createServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { AdminBookingsContent } from '@/components/admin/bookings/admin-bookings-content'

export default async function AdminBookingsPage() {
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

  return <AdminBookingsContent />
}