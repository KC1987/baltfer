-- Fix the bookings -> profiles relationship for SMS notifications

-- First, let's check the current bookings table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'bookings' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if foreign key constraint exists
SELECT conname, conrelid::regclass AS table_name, confrelid::regclass AS foreign_table
FROM pg_constraint 
WHERE contype = 'f' 
AND conrelid = 'bookings'::regclass;

-- If user_id column exists but constraint is missing, add it
ALTER TABLE bookings 
ADD CONSTRAINT fk_bookings_user_id 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Verify the relationship works
SELECT 
  b.id as booking_id,
  b.user_id,
  p.full_name,
  p.email
FROM bookings b
LEFT JOIN profiles p ON b.user_id = p.id
LIMIT 3;