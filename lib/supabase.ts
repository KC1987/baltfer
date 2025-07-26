import { createBrowserClient } from '@supabase/ssr'

export const createClient = () => {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// For development - check if env vars are set
export const isSupabaseConfigured = () => {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          phone: string | null
          created_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          phone?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          phone?: string | null
          created_at?: string
        }
      }
      locations: {
        Row: {
          id: string
          name: string
          address: string
          latitude: number
          longitude: number
          type: 'airport' | 'hotel' | 'station' | 'custom'
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          address: string
          latitude: number
          longitude: number
          type: 'airport' | 'hotel' | 'station' | 'custom'
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string
          latitude?: number
          longitude?: number
          type?: 'airport' | 'hotel' | 'station' | 'custom'
          is_active?: boolean
          created_at?: string
        }
      }
      vehicle_types: {
        Row: {
          id: string
          name: string
          base_price: number
          price_per_km: number
          max_passengers: number
          max_luggage: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          base_price: number
          price_per_km: number
          max_passengers: number
          max_luggage: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          base_price?: number
          price_per_km?: number
          max_passengers?: number
          max_luggage?: number
          created_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          user_id: string
          pickup_location_id: string | null
          pickup_address: string
          pickup_latitude: number
          pickup_longitude: number
          destination_location_id: string | null
          destination_address: string
          destination_latitude: number
          destination_longitude: number
          vehicle_type_id: string
          departure_time: string
          distance_km: number
          duration_minutes: number
          base_price: number
          total_price: number
          status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
          payment_status: 'pending' | 'paid' | 'refunded'
          stripe_payment_intent_id: string | null
          passenger_count: number
          luggage_count: number
          special_requirements: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          pickup_location_id?: string | null
          pickup_address: string
          pickup_latitude: number
          pickup_longitude: number
          destination_location_id?: string | null
          destination_address: string
          destination_latitude: number
          destination_longitude: number
          vehicle_type_id: string
          departure_time: string
          distance_km: number
          duration_minutes: number
          base_price: number
          total_price: number
          status?: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
          payment_status?: 'pending' | 'paid' | 'refunded'
          stripe_payment_intent_id?: string | null
          passenger_count: number
          luggage_count: number
          special_requirements?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          pickup_location_id?: string | null
          pickup_address?: string
          pickup_latitude?: number
          pickup_longitude?: number
          destination_location_id?: string | null
          destination_address?: string
          destination_latitude?: number
          destination_longitude?: number
          vehicle_type_id?: string
          departure_time?: string
          distance_km?: number
          duration_minutes?: number
          base_price?: number
          total_price?: number
          status?: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
          payment_status?: 'pending' | 'paid' | 'refunded'
          stripe_payment_intent_id?: string | null
          passenger_count?: number
          luggage_count?: number
          special_requirements?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}