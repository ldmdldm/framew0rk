/*
  # Add positions table and related functionality

  1. New Tables
    - positions
      - Stores user positions in protocols
      - Includes token information and position metrics
      - Tracks position status and history

  2. Security
    - Enable RLS on positions table
    - Add policies for position access and management

  3. Changes
    - Add positions table
    - Add position-specific RLS policies
    - Add position status enum type
*/

-- Create position status enum
CREATE TYPE position_status AS ENUM ('active', 'closed');

-- Create positions table
CREATE TABLE positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id uuid REFERENCES protocols(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  type text NOT NULL,
  amount text NOT NULL,
  token_address text NOT NULL,
  token_info jsonb NOT NULL,
  config jsonb DEFAULT '{}'::jsonb,
  status position_status DEFAULT 'active',
  metrics jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  closed_at timestamptz
);

-- Enable RLS
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can manage their own positions"
  ON positions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Update trigger for positions
CREATE TRIGGER update_positions_updated_at
  BEFORE UPDATE ON positions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();