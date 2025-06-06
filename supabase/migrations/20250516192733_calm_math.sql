/*
  # Rename credits column to match usage

  1. Changes
    - Rename `scan_credits` column to `picture_credits` in `user_credits` table
    - Update column name to match existing usage in application
    
  2. Notes
    - No data loss will occur
    - All existing credits will be preserved
    - No changes to RLS policies needed
*/

DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'user_credits' 
    AND column_name = 'scan_credits'
  ) THEN
    ALTER TABLE user_credits 
    RENAME COLUMN scan_credits TO picture_credits;
  END IF;
END $$;