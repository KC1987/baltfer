-- Fix existing databases that have US locations instead of Baltic ones
-- Run this if you see US locations in your popular pickup locations

-- Remove US locations
DELETE FROM locations WHERE address LIKE '%MD %' OR address LIKE '%VA %' OR address LIKE '%DC %';
DELETE FROM locations WHERE name LIKE '%Baltimore%' OR name LIKE '%Washington%' OR name LIKE '%Reagan%' OR name LIKE '%Dulles%';

-- Insert Baltic States popular locations (if not already present)
INSERT INTO locations (name, address, latitude, longitude, type) 
SELECT * FROM (VALUES
-- === LATVIA ===
('Riga International Airport (RIX)', 'Mārupe, LV-1053, Latvia', 56.9237, 23.9711, 'airport'),
('Riga Central Station', 'Stacijas laukums 5, Rīga, LV-1050', 56.9465, 24.1063, 'station'),
('Grand Hotel Kempinski Riga', 'Aspazijas bulvāris 22, Rīga, LV-1050', 56.9515, 24.1092, 'hotel'),
('Riga Old Town', 'Vecrīga, Rīga, LV-1050', 56.9481, 24.1059, 'custom'),
('Jurmala Beach Resort', 'Jūrmala, LV-2015', 56.9681, 23.7794, 'custom'),
('Sigulda Castle', 'Pils iela 16, Sigulda, LV-2150', 57.1544, 24.8525, 'custom'),
('Rundāle Palace', 'Pilsrundāle, Rundāles pagasts, LV-3921', 56.4166, 24.0217, 'custom'),

-- === ESTONIA ===
('Tallinn Airport (TLL)', 'Lennujaama tee 2, Tallinn, 11101, Estonia', 59.4133, 24.8328, 'airport'),
('Tallinn Central Station (Balti jaam)', 'Toompuiestee 37, Tallinn, 10133, Estonia', 59.4468, 24.7235, 'station'),
('Hotel Telegraaf', 'Vene 9, Tallinn, 10123, Estonia', 59.4370, 24.7536, 'hotel'),
('Tallinn Old Town', 'Vanalinn, Tallinn, Estonia', 59.4370, 24.7536, 'custom'),
('Tartu University', 'Ülikooli 18, Tartu, 50090, Estonia', 58.3806, 26.7251, 'custom'),
('Pärnu Beach', 'Pärnu, Estonia', 58.3859, 24.4971, 'custom'),

-- === LITHUANIA ===
('Vilnius Airport (VNO)', 'Rodūnios kelias 10A, Vilnius, 02189, Lithuania', 54.6341, 25.2858, 'airport'),
('Kaunas Airport (KUN)', 'Oro uosto g. 4, Karmėlava, 54460, Lithuania', 54.9639, 24.0848, 'airport'),
('Vilnius Railway Station', 'Geležinkelio g. 16, Vilnius, 02100, Lithuania', 54.6731, 25.2879, 'station'),
('Grand Hotel Kempinski Vilnius', 'Universiteto g. 14, Vilnius, 01122, Lithuania', 54.6872, 25.2797, 'hotel'),
('Vilnius Old Town', 'Senamiestis, Vilnius, Lithuania', 54.6872, 25.2797, 'custom'),
('Trakai Castle', 'Karaimų g. 53, Trakai, 21104, Lithuania', 54.6512, 24.9342, 'custom'),
('Palanga Resort', 'Palanga, Lithuania', 55.9178, 21.0608, 'custom')
) AS new_locations(name, address, latitude, longitude, type)
WHERE NOT EXISTS (
    SELECT 1 FROM locations 
    WHERE locations.name = new_locations.name
);