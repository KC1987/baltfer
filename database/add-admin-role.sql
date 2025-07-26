-- Add admin role support to profiles table
-- Run this after creating the basic schema

-- Add role column to profiles table
ALTER TABLE profiles ADD COLUMN role text DEFAULT 'customer' CHECK (role IN ('customer', 'driver', 'admin'));

-- Create index for role queries
CREATE INDEX idx_profiles_role ON profiles(role);

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'phone');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to make a user admin (run manually for your admin account)
-- Replace 'your-user-uuid-here' with your actual user ID
-- You can get your user ID from the Supabase auth dashboard
-- 
-- UPDATE profiles SET role = 'admin' WHERE id = 'your-user-uuid-here';