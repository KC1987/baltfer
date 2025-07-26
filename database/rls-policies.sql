-- Row Level Security (RLS) Policies for Baltfer
-- Run these commands in your Supabase SQL editor after creating the tables

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Locations policies (public read access)
CREATE POLICY "Anyone can view active locations" ON locations
    FOR SELECT USING (is_active = true);

-- Admin only for locations management
CREATE POLICY "Admin can manage locations" ON locations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Vehicle types policies (public read access)
CREATE POLICY "Anyone can view active vehicle types" ON vehicle_types
    FOR SELECT USING (is_active = true);

-- Admin only for vehicle types management
CREATE POLICY "Admin can manage vehicle types" ON vehicle_types
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Drivers policies
CREATE POLICY "Drivers can view own profile" ON drivers
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Drivers can update own profile" ON drivers
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admin can manage drivers" ON drivers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Bookings policies
CREATE POLICY "Users can view own bookings" ON bookings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create bookings" ON bookings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending bookings" ON bookings
    FOR UPDATE USING (
        auth.uid() = user_id 
        AND status IN ('pending', 'confirmed')
    );

-- Drivers can view assigned bookings
CREATE POLICY "Drivers can view assigned bookings" ON bookings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM driver_assignments da
            JOIN drivers d ON d.id = da.driver_id
            WHERE da.booking_id = bookings.id
            AND d.user_id = auth.uid()
        )
    );

-- Admin can view all bookings
CREATE POLICY "Admin can manage all bookings" ON bookings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Driver assignments policies
CREATE POLICY "Drivers can view own assignments" ON driver_assignments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM drivers 
            WHERE drivers.id = driver_assignments.driver_id 
            AND drivers.user_id = auth.uid()
        )
    );

CREATE POLICY "Drivers can update own assignments" ON driver_assignments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM drivers 
            WHERE drivers.id = driver_assignments.driver_id 
            AND drivers.user_id = auth.uid()
        )
    );

CREATE POLICY "Admin can manage driver assignments" ON driver_assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Pricing rules policies (public read access)
CREATE POLICY "Anyone can view active pricing rules" ON pricing_rules
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admin can manage pricing rules" ON pricing_rules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Reviews policies
CREATE POLICY "Users can view reviews for their bookings" ON reviews
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM bookings 
            WHERE bookings.id = reviews.booking_id 
            AND bookings.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create reviews for their completed bookings" ON reviews
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM bookings 
            WHERE bookings.id = reviews.booking_id 
            AND bookings.user_id = auth.uid() 
            AND bookings.status = 'completed'
        )
    );

CREATE POLICY "Users can update own reviews" ON reviews
    FOR UPDATE USING (auth.uid() = user_id);

-- Drivers can view reviews about them
CREATE POLICY "Drivers can view own reviews" ON reviews
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM drivers 
            WHERE drivers.id = reviews.driver_id 
            AND drivers.user_id = auth.uid()
        )
    );

-- Admin can view all reviews
CREATE POLICY "Admin can view all reviews" ON reviews
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );