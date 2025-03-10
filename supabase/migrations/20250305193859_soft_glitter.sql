/*
  # Initialize Framew0xrk Database Schema

  1. New Tables
    - `api_keys`: Stores API keys for authentication
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `key` (text, unique)
      - `name` (text)
      - `created_at` (timestamp)
      - `last_used_at` (timestamp)
    
    - `messages`: Stores user messages and context
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `content` (text)
      - `context` (jsonb)
      - `created_at` (timestamp)
    
    - `strategies`: Stores generated strategies and analysis
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `message_id` (uuid, references messages)
      - `analysis` (jsonb)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- API Keys table
CREATE TABLE api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  key text UNIQUE NOT NULL,
  name text,
  created_at timestamptz DEFAULT now(),
  last_used_at timestamptz
);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own API keys"
  ON api_keys
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Messages table
CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  content text NOT NULL,
  context jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own messages"
  ON messages
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Strategies table
CREATE TABLE strategies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  message_id uuid REFERENCES messages NOT NULL,
  analysis jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE strategies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own strategies"
  ON strategies
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);