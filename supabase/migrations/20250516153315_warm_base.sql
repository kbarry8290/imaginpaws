/*
  # Add user credits table and daily free scans tracking

  1. New Tables
    - `user_credits`
      - `user_id` (uuid, primary key, references auth.users)
      - `scan_credits` (integer, default 0)
      - `daily_scans_used` (integer, default 0)
      - `last_scan_date` (date, default current_date)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `user_credits` table
    - Add policies for authenticated users to:
      - Read their own credits
      - Update their own credits
*/

CREATE TABLE IF NOT EXISTS user_credits (
  user_id uuid PRIMARY KEY REFERENCES auth.users,
  scan_credits integer DEFAULT 0,
  daily_scans_used integer DEFAULT 0,
  last_scan_date date DEFAULT CURRENT_DATE,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own credits"
  ON user_credits
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own credits"
  ON user_credits
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own credits"
  ON user_credits
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);