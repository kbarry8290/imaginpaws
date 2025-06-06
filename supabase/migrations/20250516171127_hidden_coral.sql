/*
  # Add credit purchase logging

  1. New Tables
    - `credit_purchase_log`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `product_id` (text)
      - `credits_added` (integer)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `credit_purchase_log` table
    - Add policy for authenticated users to:
      - Insert their own purchase logs
      - Read their own purchase logs
*/

CREATE TABLE IF NOT EXISTS credit_purchase_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  product_id text NOT NULL,
  credits_added integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE credit_purchase_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own purchase logs"
  ON credit_purchase_log
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own purchase logs"
  ON credit_purchase_log
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);