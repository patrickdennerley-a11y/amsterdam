-- ============================================================================
-- Enable REPLICA IDENTITY FULL for Realtime subscriptions
-- This ensures all columns are included in realtime payloads, not just the PK
-- ============================================================================

-- Enable full replica identity on profiles table
-- Required for realtime subscriptions to receive status and current_match_id
ALTER TABLE public.profiles REPLICA IDENTITY FULL;

-- Enable full replica identity on messages table for complete message data
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- Enable full replica identity on matches table
ALTER TABLE public.matches REPLICA IDENTITY FULL;
