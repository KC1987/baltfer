-- Baltfer Transfer Booking Database Schema
-- Run these commands in your Supabase SQL editor

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table is handled by Supabase Auth automatically
-- Additional user profile data
CREATE TABLE profiles (
  id uuid REFERENCES auth.users PRIMARY KEY,
  full_name text,
  phone text,
  created_at timestamp with time zone DEFAULT now()
);

-- Locations for pick-up/drop-off points
CREATE TABLE locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL,
  latitude decimal(10, 8) NOT NULL,
  longitude decimal(11, 8) NOT NULL,
  type text CHECK (type IN ('airport', 'hotel', 'station', 'custom')),
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- User favorite/recent locations for quick selection
CREATE TABLE user_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  name text NOT NULL, -- User's custom name for the location
  address text NOT NULL,
  latitude decimal(10, 8) NOT NULL,
  longitude decimal(11, 8) NOT NULL,
  location_type text CHECK (location_type IN ('pickup', 'destination', 'both')) DEFAULT 'both',
  usage_count integer DEFAULT 1, -- Track how often used for smart sorting
  last_used_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, address) -- Prevent duplicate addresses per user
);

-- Vehicle types and their base rates
CREATE TABLE vehicle_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL, -- e.g., 'Standard', 'Premium', 'Van'
  base_price decimal(10, 2) NOT NULL,
  price_per_km decimal(10, 2) NOT NULL,
  max_passengers integer NOT NULL,
  max_luggage integer NOT NULL,
  description text,
  image_url text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- Drivers
CREATE TABLE drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users UNIQUE,
  license_number text NOT NULL,
  vehicle_registration text NOT NULL,
  vehicle_type_id uuid REFERENCES vehicle_types,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- Bookings
CREATE TABLE bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  pickup_location_id uuid REFERENCES locations,
  pickup_address text NOT NULL,
  pickup_latitude decimal(10, 8) NOT NULL,
  pickup_longitude decimal(11, 8) NOT NULL,
  destination_location_id uuid REFERENCES locations,
  destination_address text NOT NULL,
  destination_latitude decimal(10, 8) NOT NULL,
  destination_longitude decimal(11, 8) NOT NULL,
  vehicle_type_id uuid REFERENCES vehicle_types NOT NULL,
  departure_time timestamp with time zone NOT NULL,
  distance_km decimal(10, 2) NOT NULL,
  duration_minutes integer NOT NULL,
  base_price decimal(10, 2) NOT NULL,
  total_price decimal(10, 2) NOT NULL,
  status text CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')) DEFAULT 'pending',
  payment_status text CHECK (payment_status IN ('pending', 'paid', 'refunded')) DEFAULT 'pending',
  stripe_payment_intent_id text,
  passenger_count integer NOT NULL,
  luggage_count integer NOT NULL,
  special_requirements text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Driver assignments
CREATE TABLE driver_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings NOT NULL,
  driver_id uuid REFERENCES drivers NOT NULL,
  assigned_at timestamp with time zone DEFAULT now(),
  status text CHECK (status IN ('assigned', 'accepted', 'declined', 'completed')) DEFAULT 'assigned',
  notes text
);

-- Pricing rules for dynamic pricing
CREATE TABLE pricing_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text CHECK (type IN ('time_based', 'demand_based', 'distance_based')),
  multiplier decimal(3, 2) NOT NULL,
  conditions jsonb NOT NULL, -- e.g., {"hour_start": 22, "hour_end": 6}
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- Reviews
CREATE TABLE reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings UNIQUE NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL,
  driver_id uuid REFERENCES drivers,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp with time zone DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_departure_time ON bookings(departure_time);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_payment_status ON bookings(payment_status);
CREATE INDEX idx_locations_type ON locations(type);
CREATE INDEX idx_locations_active ON locations(is_active);
CREATE INDEX idx_vehicle_types_active ON vehicle_types(is_active);
CREATE INDEX idx_drivers_active ON drivers(is_active);
CREATE INDEX idx_driver_assignments_booking ON driver_assignments(booking_id);
CREATE INDEX idx_pricing_rules_active ON pricing_rules(is_active);
CREATE INDEX idx_reviews_rating ON reviews(rating);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at trigger to bookings table
CREATE TRIGGER update_bookings_updated_at 
    BEFORE UPDATE ON bookings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert Baltic region vehicle types with EUR pricing
INSERT INTO vehicle_types (name, base_price, price_per_km, max_passengers, max_luggage, description) VALUES
('Economy', 12.00, 1.20, 4, 2, 'Comfortable economy car for up to 4 passengers'),
('Standard', 18.00, 1.60, 4, 3, 'Standard sedan with extra comfort and space'),
('Premium', 28.00, 2.40, 4, 4, 'Luxury vehicle with premium amenities'),
('Van', 35.00, 2.00, 8, 6, 'Spacious van for groups up to 8 passengers'),
('Executive', 45.00, 3.20, 4, 4, 'Executive class vehicle with luxury features'),
('Cross-Border Premium', 35.00, 1.80, 4, 4, 'Premium vehicle for cross-border trips between Baltic countries'),
('Cross-Border Van', 50.00, 1.50, 8, 8, 'Large van ideal for cross-border group travel with extra luggage space');

-- Insert Baltic States popular locations
INSERT INTO locations (name, address, latitude, longitude, type) VALUES
-- === LATVIA ===
('Riga International Airport (RIX)', 'Mārupe, LV-1053, Latvia', 56.9237, 23.9711, 'airport'),
('Riga Central Station', 'Stacijas laukums 5, Rīga, LV-1050', 56.9465, 24.1063, 'station'),
('Grand Hotel Kempinski Riga', 'Aspazijas bulvāris 22, Rīga, LV-1050', 56.9515, 24.1092, 'hotel'),
('Riga Old Town', 'Vecrīga, Rīga, LV-1050', 56.9481, 24.1059, 'custom'),
('Jurmala Beach Resort', 'Jūrmala, LV-2015', 56.9681, 23.7794, 'custom'),

-- === ESTONIA ===
('Tallinn Airport (TLL)', 'Lennujaama tee 2, Tallinn, 11101, Estonia', 59.4133, 24.8328, 'airport'),
('Tallinn Central Station (Balti jaam)', 'Toompuiestee 37, Tallinn, 10133, Estonia', 59.4468, 24.7235, 'station'),
('Tallinn Old Town', 'Vanalinn, Tallinn, Estonia', 59.4370, 24.7536, 'custom'),

-- === LITHUANIA ===
('Vilnius Airport (VNO)', 'Rodūnios kelias 10A, Vilnius, 02189, Lithuania', 54.6341, 25.2858, 'airport'),
('Vilnius Railway Station', 'Geležinkelio g. 16, Vilnius, 02100, Lithuania', 54.6731, 25.2879, 'station'),
('Vilnius Old Town', 'Senamiestis, Vilnius, Lithuania', 54.6872, 25.2797, 'custom');

-- Insert pricing rules for Baltic operations
INSERT INTO pricing_rules (name, type, multiplier, conditions) VALUES
-- Standard time-based rules
('Peak Hours Weekday', 'time_based', 1.25, '{"days": ["monday", "tuesday", "wednesday", "thursday", "friday"], "hour_start": 7, "hour_end": 9}'),
('Peak Hours Evening', 'time_based', 1.20, '{"days": ["monday", "tuesday", "wednesday", "thursday", "friday"], "hour_start": 17, "hour_end": 19}'),
('Night Surcharge', 'time_based', 1.30, '{"hour_start": 22, "hour_end": 6}'),
('Weekend Premium', 'time_based', 1.15, '{"days": ["saturday", "sunday"]}'),
('Holiday Surcharge', 'demand_based', 1.50, '{"type": "holiday"}'),

-- Cross-border specific rules
('Cross-Border Base', 'distance_based', 1.20, '{"min_distance_km": 100, "type": "cross_border"}'),
('Cross-Border Long Distance', 'distance_based', 1.35, '{"min_distance_km": 250, "type": "cross_border"}'),
('Cross-Border Weekend', 'time_based', 1.25, '{"days": ["friday", "saturday", "sunday"], "type": "cross_border"}'),
('Border Crossing Fee', 'demand_based', 1.10, '{"type": "border_crossing"}');

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on user_locations table
ALTER TABLE user_locations ENABLE ROW LEVEL SECURITY;

-- Users can only see and manage their own locations
CREATE POLICY "Users can view own locations" ON user_locations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own locations" ON user_locations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own locations" ON user_locations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own locations" ON user_locations
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_user_locations_user_id ON user_locations(user_id);
CREATE INDEX idx_user_locations_usage_count ON user_locations(user_id, usage_count DESC);
CREATE INDEX idx_user_locations_last_used ON user_locations(user_id, last_used_at DESC);