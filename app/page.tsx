'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase.auth])
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-sky-100">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 lg:py-24">
        <div className="text-center">
          <h1 className="text-4xl lg:text-6xl font-bold text-slate-900 mb-6">
            Premium Transfer Services
          </h1>
          <p className="text-xl lg:text-2xl text-slate-700 mb-8 max-w-3xl mx-auto">
            Book reliable, comfortable transfers across Latvia, Estonia, and Lithuania. 
            From airports to hotels to cross-border journeys, we get you there safely and on time.
          </p>
          <div className="flex gap-4 justify-center flex-col sm:flex-row">
            <Link href="/book">
              <Button size="lg" className="text-lg px-8 py-6 bg-sky-500 hover:bg-sky-600 text-white">
                Book Your Transfer
              </Button>
            </Link>
            {!loading && !user && (
              <Link href="/auth/signup">
                <Button variant="outline" size="lg" className="text-lg px-8 py-6 border-sky-500 text-sky-600 hover:bg-sky-50">
                  Create Account
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
            Why Choose Baltfer?
          </h2>
          <p className="text-lg text-slate-700 max-w-2xl mx-auto">
            We provide exceptional transfer services across the Baltic region with focus on reliability, comfort, and seamless cross-border travel.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🌍 Baltic Cross-Border
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Seamless transfers between Latvia, Estonia, and Lithuania. One booking covers your entire Baltic journey.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🚗 Professional Drivers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Licensed, experienced drivers who know the Baltic region and prioritize your safety and comfort.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                ⏰ On-Time Guarantee
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                We track your flight and adjust pickup times automatically. No more waiting or missed connections.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                💳 Transparent Pricing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Fixed prices in EUR with no hidden fees. See the exact cost upfront including any cross-border charges.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🚐 Vehicle Options
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Choose from economy cars to luxury vehicles and specialized cross-border vans. Perfect for Baltic road trips.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📱 Easy Booking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Book online in just a few clicks. Manage your bookings, track your driver, and get updates via SMS.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🛡️ Secure Payments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                All payments are processed securely with industry-standard encryption. Multiple payment options available.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-white rounded-2xl shadow-xl p-8 lg:p-12 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
            Ready to Book Your Transfer?
          </h2>
          <p className="text-lg text-slate-700 mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied customers who trust Baltfer for their transportation needs.
          </p>
          <Link href="/book">
            <Button size="lg" className="text-lg px-8 py-6 bg-sky-500 hover:bg-sky-600 text-white">
              Book Now
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}