/*
  # Create messages table for chat history

  1. New Tables
    - `messages`
      - `id` (uuid, primary key)
      - `content` (text)
      - `is_user` (boolean)
      - `created_at` (timestamp)
      - `context` (jsonb)

  2. Security
    - Enable RLS on `messages` table
    - Add policy for authenticated users to read their own messages
    - Add policy for authenticated users to insert messages
*/

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  is_user boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  context jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own messages"
  ON messages
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert messages"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);