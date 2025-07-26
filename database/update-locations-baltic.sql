-- Update locations for Baltic states operations (Latvia, Estonia, Lithuania)
-- Run this after the initial schema to replace sample locations with Baltic locations

-- Clear existing sample locations
DELETE FROM locations WHERE type IN ('airport', 'station', 'hotel');

-- Insert Baltic States locations
INSERT INTO locations (name, address, latitude, longitude, type) VALUES

-- === LATVIA ===
-- Airports
('Riga International Airport (RIX)', 'Mārupe, LV-1053, Latvia', 56.9237, 23.9711, 'airport'),
('Liepāja International Airport', 'Liepāja, LV-3405, Latvia', 56.5175, 21.0969, 'airport'),

-- Railway Stations
('Riga Central Station', 'Stacijas laukums 5, Rīga, LV-1050', 56.9465, 24.1063, 'station'),
('Daugavpils Railway Station', 'Stacijas iela 46, Daugavpils, LV-5401', 55.8794, 26.5199, 'station'),

-- Major Hotels Latvia
('Grand Hotel Kempinski Riga', 'Aspazijas bulvāris 22, Rīga, LV-1050', 56.9515, 24.1092, 'hotel'),
('Radisson Blu Elizabete Hotel', 'Elizabetes iela 73, Rīga, LV-1050', 56.9565, 24.1165, 'hotel'),

-- Popular destinations Latvia
('Riga Old Town', 'Vecrīga, Rīga, LV-1050', 56.9481, 24.1059, 'custom'),
('Jurmala Beach Resort', 'Jūrmala, LV-2015', 56.9681, 23.7794, 'custom'),
('Sigulda Castle', 'Pils iela 16, Sigulda, LV-2150', 57.1544, 24.8525, 'custom'),
('Rundāle Palace', 'Pilsrundāle, Rundāles pagasts, LV-3921', 56.4166, 24.0217, 'custom'),

-- === ESTONIA ===
-- Airports
('Tallinn Airport (TLL)', 'Lennujaama tee 2, Tallinn, 11101, Estonia', 59.4133, 24.8328, 'airport'),
('Tartu Airport', 'Reola küla, Ülenurme vald, 61707, Estonia', 58.3074, 26.6903, 'airport'),

-- Railway Stations
('Tallinn Central Station (Balti jaam)', 'Toompuiestee 37, Tallinn, 10133, Estonia', 59.4468, 24.7235, 'station'),
('Tartu Railway Station', 'Vaksali 6, Tartu, 51014, Estonia', 58.3775, 26.7308, 'station'),

-- Major Hotels Estonia
('Hotel Telegraaf', 'Vene 9, Tallinn, 10123, Estonia', 59.4370, 24.7536, 'hotel'),
('Radisson Blu Sky Hotel', 'Rävala puiestee 3, Tallinn, 10143, Estonia', 59.4272, 24.7531, 'hotel'),

-- Popular destinations Estonia
('Tallinn Old Town', 'Vanalinn, Tallinn, Estonia', 59.4370, 24.7536, 'custom'),
('Tartu University', 'Ülikooli 18, Tartu, 50090, Estonia', 58.3806, 26.7251, 'custom'),
('Pärnu Beach', 'Pärnu, Estonia', 58.3859, 24.4971, 'custom'),
('Saaremaa Island (Kuressaare)', 'Kuressaare, Saaremaa, Estonia', 58.2530, 22.4897, 'custom'),

-- === LITHUANIA ===
-- Airports
('Vilnius Airport (VNO)', 'Rodūnios kelias 10A, Vilnius, 02189, Lithuania', 54.6341, 25.2858, 'airport'),
('Kaunas Airport (KUN)', 'Oro uosto g. 4, Karmėlava, 54460, Lithuania', 54.9639, 24.0848, 'airport'),
('Palanga Airport (PLQ)', 'Liepojos pl. 1, Palanga, 00135, Lithuania', 55.9733, 21.0939, 'airport'),

-- Railway Stations
('Vilnius Railway Station', 'Geležinkelio g. 16, Vilnius, 02100, Lithuania', 54.6731, 25.2879, 'station'),
('Kaunas Railway Station', 'Čiurlionio g. 16, Kaunas, 03101, Lithuania', 54.8985, 23.9036, 'station'),

-- Major Hotels Lithuania
('Grand Hotel Kempinski Vilnius', 'Universiteto g. 14, Vilnius, 01122, Lithuania', 54.6872, 25.2797, 'hotel'),
('Radisson Blu Hotel Lietuva', 'Konstitucijos pr. 20, Vilnius, 09308, Lithuania', 54.6976, 25.2707, 'hotel'),

-- Popular destinations Lithuania
('Vilnius Old Town', 'Senamiestis, Vilnius, Lithuania', 54.6872, 25.2797, 'custom'),
('Trakai Castle', 'Karaimų g. 53, Trakai, 21104, Lithuania', 54.6512, 24.9342, 'custom'),
('Kaunas Old Town', 'Senamiestis, Kaunas, Lithuania', 54.8985, 23.9036, 'custom'),
('Palanga Resort', 'Palanga, Lithuania', 55.9178, 21.0608, 'custom'),
('Hill of Crosses', 'Jurgaičiai, 81439, Lithuania', 56.0154, 23.4165, 'custom'),

-- Port/Ferry Terminals (Cross-Baltic connections)
('Riga Passenger Port', 'Eksporta iela 3a, Rīga, LV-1010', 56.9658, 24.0975, 'station'),
('Tallinn Port (Terminal D)', 'Logi 5, Tallinn, 10611, Estonia', 59.4420, 24.7540, 'station'),
('Klaipėda Port', 'Perkėlos g. 10, Klaipėda, 91109, Lithuania', 55.7067, 21.1175, 'station');