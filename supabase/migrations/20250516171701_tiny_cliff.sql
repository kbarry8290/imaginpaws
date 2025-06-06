/*
  # Add age field to transformations table

  1. Changes
    - Add `age` column to `transformations` table
    - Set default value to 'adult'
    - Make column NOT NULL to maintain data consistency

  2. Notes
    - Existing rows will get the default value 'adult'
    - No changes to RLS policies needed
*/

ALTER TABLE transformations
ADD COLUMN IF NOT EXISTS age text NOT NULL DEFAULT 'adult';