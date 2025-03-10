/*
  # Initial Schema Setup for Framew0rk

  1. New Tables
    - `users`: Store user information and preferences
      - `id` (uuid, primary key): User identifier
      - `wallet_address` (text): User's blockchain wallet address
      - `created_at` (timestamptz): Account creation timestamp
      - `updated_at` (timestamptz): Last update timestamp
      - `settings` (jsonb): User preferences and settings

    - `protocols`: DeFi protocols integrated with the platform
      - `id` (uuid, primary key): Protocol identifier
      - `name` (text): Protocol name
      - `config` (jsonb): Protocol configuration and features
      - `user_id` (uuid): Protocol owner reference
      - `created_at` (timestamptz): Creation timestamp
      - `updated_at` (timestamptz): Last update timestamp

    - `api_keys`: API keys for protocol integration
      - `id` (uuid, primary key): Key identifier
      - `key` (text): Actual API key
      - `protocol_id` (uuid): Associated protocol
      - `user_id` (uuid): Key owner
      - `created_at` (timestamptz): Creation timestamp
      - `last_used_at` (timestamptz): Last usage timestamp

    - `messages`: User interactions with the AI
      - `id` (uuid, primary key): Message identifier
      - `content` (text): Message content
      - `protocol_id` (uuid): Associated protocol
      - `user_id` (uuid): Message sender
      - `context` (jsonb): Message context
      - `created_at` (timestamptz): Message timestamp

    - `protocol_analyses`: AI analyses of protocol interactions
      - `id` (uuid, primary key): Analysis identifier
      - `message_id` (uuid): Associated message
      - `protocol_id` (uuid): Associated protocol
      - `content` (text): Analysis content
      - `user_id` (uuid): Analysis recipient
      - `created_at` (timestamptz): Analysis timestamp

    - `protocol_training`: Protocol-specific AI training data
      - `id` (uuid, primary key): Training record identifier
      - `protocol_id` (uuid): Associated protocol
      - `training_data` (jsonb): Training documentation
      - `completion` (text): Training completion
      - `status` (text): Training status
      - `created_at` (timestamptz): Training timestamp

  2. Functions
    - `generate_api_key()`: Generate secure API keys

  3. Security
    - Enable RLS on all tables
    - Set up appropriate access policies
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address text UNIQUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  settings jsonb DEFAULT '{}'::jsonb
);

-- Protocols table
CREATE TABLE protocols (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- API keys table
CREATE TABLE api_keys (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  key text UNIQUE NOT NULL,
  protocol_id uuid REFERENCES protocols(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  last_used_at timestamptz
);

-- Messages table
CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  content text NOT NULL,
  protocol_id uuid REFERENCES protocols(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  context jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Protocol analyses table
CREATE TABLE protocol_analyses (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id uuid REFERENCES messages(id) ON DELETE CASCADE,
  protocol_id uuid REFERENCES protocols(id) ON DELETE CASCADE,
  content text NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Protocol training table
CREATE TABLE protocol_training (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  protocol_id uuid REFERENCES protocols(id) ON DELETE CASCADE,
  training_data jsonb NOT NULL,
  completion text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- API key generation function
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
      SELECT 1 FROM api_keys WHERE api_keys.key = key
    ) INTO key_exists;
    
    -- Exit loop if key is unique
    EXIT WHEN NOT key_exists;
  END LOOP;
  
  RETURN key;
END;
$$;

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE protocol_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE protocol_training ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can read and update their own data
CREATE POLICY "Users can manage their own data"
  ON users
  FOR ALL
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Protocol owners can manage their protocols
CREATE POLICY "Protocol owners can manage their protocols"
  ON protocols
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- API keys are accessible by protocol owners
CREATE POLICY "Protocol owners can manage API keys"
  ON api_keys
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Messages are accessible by their owners and protocol owners
CREATE POLICY "Users can access their messages"
  ON messages
  FOR ALL
  TO authenticated
  USING (
    auth.uid() = user_id OR
    auth.uid() IN (
      SELECT p.user_id FROM protocols p WHERE p.id = protocol_id
    )
  )
  WITH CHECK (auth.uid() = user_id);

-- Analyses are accessible by message owners and protocol owners
CREATE POLICY "Users can access their analyses"
  ON protocol_analyses
  FOR ALL
  TO authenticated
  USING (
    auth.uid() = user_id OR
    auth.uid() IN (
      SELECT p.user_id FROM protocols p WHERE p.id = protocol_id
    )
  )
  WITH CHECK (auth.uid() = user_id);

-- Training data is accessible by protocol owners
CREATE POLICY "Protocol owners can manage training data"
  ON protocol_training
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT p.user_id FROM protocols p WHERE p.id = protocol_id
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT p.user_id FROM protocols p WHERE p.id = protocol_id
    )
  );