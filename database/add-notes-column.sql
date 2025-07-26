-- Add notes column to bookings table
-- This column will store additional notes from customers

ALTER TABLE bookings ADD COLUMN notes text;

-- Add index for better performance when searching notes
CREATE INDEX IF NOT EXISTS idx_bookings_notes ON bookings(notes) WHERE notes IS NOT NULL;

-- Update RLS policies to include notes field (no changes needed as existing policies cover all columns)