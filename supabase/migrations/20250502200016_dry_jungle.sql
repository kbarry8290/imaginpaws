/*
  # Create transformations table

  1. New Tables
    - `transformations`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `original_photo` (text)
      - `result_photo` (text)
      - `style` (text)
      - `sex` (text)
      - `personality` (text)
      - `clothing` (text)
      - `background` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `transformations` table
    - Add policies for authenticated users to:
      - Read their own transformations
      - Create new transformations
*/

CREATE TABLE IF NOT EXISTS transformations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  original_photo text NOT NULL,
  result_photo text NOT NULL,
  style text NOT NULL,
  sex text NOT NULL,
  personality text NOT NULL,
  clothing text NOT NULL,
  background text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE transformations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own transformations"
  ON transformations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create transformations"
  ON transformations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);