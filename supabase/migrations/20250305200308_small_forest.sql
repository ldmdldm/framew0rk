/*
  # Protocol AI Assistant Schema

  1. New Tables
    - `protocols`
      - Core protocol information and configuration
    - `protocol_training`
      - Training data and status for each protocol
    - `protocol_analyses`
      - Stored analyses and recommendations
    - `messages`
      - User interactions with the AI assistant
    - `api_keys`
      - Protocol API key management

  2. Security
    - Enable RLS on all tables
    - Add policies for protocol access and data management
*/

-- Protocols table
CREATE TABLE IF NOT EXISTS protocols (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  config jsonb NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE protocols ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Protocols are viewable by their owners"
  ON protocols
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Protocols are insertable by their owners"
  ON protocols
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Protocols are updatable by their owners"
  ON protocols
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Protocol training table
CREATE TABLE IF NOT EXISTS protocol_training (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id uuid REFERENCES protocols(id) ON DELETE CASCADE,
  training_data jsonb NOT NULL,
  status text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE protocol_training ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Training data is viewable by protocol owners"
  ON protocol_training
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM protocols
      WHERE id = protocol_training.protocol_id
      AND user_id = auth.uid()
    )
  );

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  protocol_id uuid REFERENCES protocols(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  context jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Messages are viewable by protocol owners"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM protocols
      WHERE id = messages.protocol_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Messages are insertable by authenticated users"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Protocol analyses table
CREATE TABLE IF NOT EXISTS protocol_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES messages(id) ON DELETE CASCADE,
  protocol_id uuid REFERENCES protocols(id) ON DELETE CASCADE,
  content text NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE protocol_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Analyses are viewable by protocol owners"
  ON protocol_analyses
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM protocols
      WHERE id = protocol_analyses.protocol_id
      AND user_id = auth.uid()
    )
  );

-- API keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  protocol_id uuid REFERENCES protocols(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  last_used_at timestamptz
);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "API keys are viewable by protocol owners"
  ON api_keys
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "API keys are insertable by protocol owners"
  ON api_keys
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Functions
CREATE OR REPLACE FUNCTION generate_api_key()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  key text;
  key_exists boolean;
BEGIN
  LOOP
    -- Generate a random key
    key := encode(gen_random_bytes(32), 'hex');
    
    -- Check if key exists
    SELECT EXISTS (
      SELECT 1 FROM api_keys WHERE key = key
    ) INTO key_exists;
    
    -- Exit loop if key doesn't exist
    EXIT WHEN NOT key_exists;
  END LOOP;
  
  RETURN key;
END;
$$;

-- Triggers
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_protocols_updated_at
  BEFORE UPDATE ON protocols
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_protocol_training_updated_at
  BEFORE UPDATE ON protocol_training
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();