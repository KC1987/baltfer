import { redirect } from 'next/navigation'

interface BookingRedirectProps {
  params: Promise<{
    id: string
  }>
}

export default async function BookingRedirect({ params }: BookingRedirectProps) {
  const { id } = await params
  
  // Redirect to the correct booking details page
  redirect(`/dashboard/booking/${id}`)
}