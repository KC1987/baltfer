-- Fix multiple SMS issue: Remove duplicate admin settings
-- This query will keep only the most recent setting for each admin + setting_key combination

-- Check current admin settings (run this first to see duplicates)
SELECT admin_id, setting_key, setting_value, created_at, COUNT(*) as count_entries
FROM admin_settings 
GROUP BY admin_id, setting_key, setting_value, created_at
HAVING COUNT(*) > 1
ORDER BY admin_id, setting_key;

-- Delete duplicate entries, keeping only the most recent one
DELETE FROM admin_settings 
WHERE id NOT IN (
  SELECT DISTINCT ON (admin_id, setting_key) id
  FROM admin_settings 
  ORDER BY admin_id, setting_key, created_at DESC
);

-- Verify admin settings after cleanup
SELECT p.email, p.role, 
       s.setting_key, s.setting_value, s.created_at
FROM profiles p
LEFT JOIN admin_settings s ON p.id = s.admin_id
WHERE p.role = 'admin'
ORDER BY p.email, s.setting_key;