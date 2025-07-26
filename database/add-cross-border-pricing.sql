-- Add special pricing rules for cross-border Baltic trips
-- Run this after the initial schema and location updates

-- Insert cross-border pricing rules
INSERT INTO pricing_rules (name, type, multiplier, conditions) VALUES
-- Standard time-based rules (same as before)
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

-- Update the schema comment
COMMENT ON TABLE pricing_rules IS 'Dynamic pricing rules for local and cross-border Baltic transfers';