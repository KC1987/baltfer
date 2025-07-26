-- Update vehicle pricing for Baltic region (EUR currency)
-- Run this after the initial schema to update pricing to EUR

-- Clear existing vehicle types
DELETE FROM vehicle_types;

-- Insert Baltic region vehicle types with EUR pricing
INSERT INTO vehicle_types (name, base_price, price_per_km, max_passengers, max_luggage, description) VALUES
('Economy', 12.00, 1.20, 4, 2, 'Comfortable economy car for up to 4 passengers'),
('Standard', 18.00, 1.60, 4, 3, 'Standard sedan with extra comfort and space'),
('Premium', 28.00, 2.40, 4, 4, 'Luxury vehicle with premium amenities'),
('Van', 35.00, 2.00, 8, 6, 'Spacious van for groups up to 8 passengers'),
('Executive', 45.00, 3.20, 4, 4, 'Executive class vehicle with luxury features'),
('Cross-Border Premium', 35.00, 1.80, 4, 4, 'Premium vehicle for cross-border trips between Baltic countries'),
('Cross-Border Van', 50.00, 1.50, 8, 8, 'Large van ideal for cross-border group travel with extra luggage space');