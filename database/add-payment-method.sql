-- Add payment_method column to bookings table
-- Run this in your Supabase SQL editor

ALTER TABLE bookings 
ADD COLUMN payment_method text CHECK (payment_method IN ('card', 'cash')) DEFAULT 'card';

-- Update existing bookings to have 'card' as payment method
UPDATE bookings SET payment_method = 'card' WHERE payment_method IS NULL;

-- Add index for better performance
CREATE INDEX idx_bookings_payment_method ON bookings(payment_method);

-- Update the payment status check constraint to be more specific for cash payments
-- We'll allow 'confirmed' status for cash payments even if payment_status is 'pending'
-- This will be handled in the application logic