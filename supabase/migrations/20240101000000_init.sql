-- ============================================================================
-- UniMelb Match Database Schema
-- Version: 7.0 (Production)
-- Embedding Model: Voyage AI voyage-3-lite (512 dimensions)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. EXTENSIONS & TYPES
-- ----------------------------------------------------------------------------

-- Enable pgvector for similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- User status enum for state machine
CREATE TYPE user_status AS ENUM ('onboarding', 'waiting', 'matched');

-- ----------------------------------------------------------------------------
-- 2. TABLES
-- ----------------------------------------------------------------------------

-- Profiles table (extends auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    bio TEXT,
    major TEXT,
    embedding VECTOR(512),  -- Voyage AI voyage-3-lite dimensions
    status user_status NOT NULL DEFAULT 'onboarding',
    current_match_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Matches table (friendship connections)
CREATE TABLE public.matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_a_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_b_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    similarity_score FLOAT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Prevent self-matching
    CONSTRAINT no_self_match CHECK (user_a_id != user_b_id),

    -- Ensure consistent ordering (smaller UUID first) to prevent duplicates
    CONSTRAINT ordered_user_ids CHECK (user_a_id < user_b_id)
);

-- Messages table (chat history)
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add foreign key for current_match_id after matches table exists
ALTER TABLE public.profiles
ADD CONSTRAINT fk_current_match
FOREIGN KEY (current_match_id) REFERENCES public.matches(id) ON DELETE SET NULL;

-- ----------------------------------------------------------------------------
-- 3. INDEXES
-- ----------------------------------------------------------------------------

-- Composite index for finding existing matches between two users
CREATE UNIQUE INDEX idx_matches_user_pair ON public.matches(user_a_id, user_b_id);

-- Index for finding all matches involving a user
CREATE INDEX idx_matches_user_a ON public.matches(user_a_id);
CREATE INDEX idx_matches_user_b ON public.matches(user_b_id);

-- Index for active matches lookup
CREATE INDEX idx_matches_active ON public.matches(is_active) WHERE is_active = TRUE;

-- Index for finding waiting users
CREATE INDEX idx_profiles_waiting ON public.profiles(status) WHERE status = 'waiting';

-- IVFFlat index for vector similarity search (optimize after seeding)
-- Lists = sqrt(n) where n is expected row count; start with 100 for ~10k users
CREATE INDEX idx_profiles_embedding ON public.profiles
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Messages lookup by match
CREATE INDEX idx_messages_match ON public.messages(match_id, created_at DESC);

-- ----------------------------------------------------------------------------
-- 4. TRIGGERS
-- ----------------------------------------------------------------------------

-- Auto-create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_profiles_updated
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS)
-- ----------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Profiles: Anyone can read (for matching UI), only owner can update
CREATE POLICY "Profiles are viewable by authenticated users"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (TRUE);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Matches: Only participants can view their matches
CREATE POLICY "Users can view own matches"
    ON public.matches FOR SELECT
    TO authenticated
    USING (
        auth.uid() = user_a_id OR
        auth.uid() = user_b_id
    );

-- Messages: Participants of ACTIVE matches can insert and view
CREATE POLICY "Users can view messages in their active matches"
    ON public.messages FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.matches
            WHERE matches.id = messages.match_id
            AND matches.is_active = TRUE
            AND (matches.user_a_id = auth.uid() OR matches.user_b_id = auth.uid())
        )
    );

CREATE POLICY "Users can send messages in their active matches"
    ON public.messages FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM public.matches
            WHERE matches.id = messages.match_id
            AND matches.is_active = TRUE
            AND (matches.user_a_id = auth.uid() OR matches.user_b_id = auth.uid())
        )
    );

-- ----------------------------------------------------------------------------
-- 6. REALTIME SETUP
-- ----------------------------------------------------------------------------

ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- ----------------------------------------------------------------------------
-- 7. MATCHING FUNCTIONS (RPC)
-- ----------------------------------------------------------------------------

-- Helper function to check if two users have ever been matched
CREATE OR REPLACE FUNCTION public.users_previously_matched(
    p_user_a UUID,
    p_user_b UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_ordered_a UUID;
    v_ordered_b UUID;
BEGIN
    -- Ensure consistent ordering
    IF p_user_a < p_user_b THEN
        v_ordered_a := p_user_a;
        v_ordered_b := p_user_b;
    ELSE
        v_ordered_a := p_user_b;
        v_ordered_b := p_user_a;
    END IF;

    RETURN EXISTS (
        SELECT 1 FROM public.matches
        WHERE user_a_id = v_ordered_a
        AND user_b_id = v_ordered_b
    );
END;
$$;

-- Atomic matching function with race condition protection
CREATE OR REPLACE FUNCTION public.match_user_atomically(
    p_target_user_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_target_profile RECORD;
    v_candidate RECORD;
    v_match_id UUID;
    v_ordered_a UUID;
    v_ordered_b UUID;
BEGIN
    -- Lock and fetch target user
    SELECT * INTO v_target_profile
    FROM public.profiles
    WHERE id = p_target_user_id
    AND status = 'waiting'
    FOR UPDATE SKIP LOCKED;

    -- If user not waiting or locked by another process, abort
    IF v_target_profile IS NULL THEN
        RETURN NULL;
    END IF;

    -- Find best matching candidate
    -- CRITICAL: Exclude anyone who has EVER been matched with this user (active OR inactive)
    SELECT p.id, p.embedding,
           1 - (p.embedding <=> v_target_profile.embedding) AS similarity
    INTO v_candidate
    FROM public.profiles p
    WHERE p.status = 'waiting'
    AND p.id != p_target_user_id
    AND p.embedding IS NOT NULL
    -- Exclude previous matches (this is the safety requirement)
    AND NOT public.users_previously_matched(p_target_user_id, p.id)
    ORDER BY p.embedding <=> v_target_profile.embedding ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED;

    -- No candidate found
    IF v_candidate IS NULL THEN
        RETURN NULL;
    END IF;

    -- Ensure consistent ordering for the match record
    IF p_target_user_id < v_candidate.id THEN
        v_ordered_a := p_target_user_id;
        v_ordered_b := v_candidate.id;
    ELSE
        v_ordered_a := v_candidate.id;
        v_ordered_b := p_target_user_id;
    END IF;

    -- Create match record
    INSERT INTO public.matches (user_a_id, user_b_id, similarity_score)
    VALUES (v_ordered_a, v_ordered_b, v_candidate.similarity)
    RETURNING id INTO v_match_id;

    -- Update both users' status
    UPDATE public.profiles
    SET status = 'matched',
        current_match_id = v_match_id
    WHERE id IN (p_target_user_id, v_candidate.id);

    RETURN v_match_id;
END;
$$;

-- Batch matching function (admin only)
CREATE OR REPLACE FUNCTION public.run_batch_matching(
    p_admin_email TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_admin_emails TEXT[] := ARRAY[
        -- ADD YOUR ADMIN EMAIL(S) HERE
        'admin@student.unimelb.edu.au'
    ];
    v_user_id UUID;
    v_match_count INTEGER := 0;
    v_result UUID;
BEGIN
    -- Verify admin access
    IF NOT (p_admin_email = ANY(v_admin_emails)) THEN
        RAISE EXCEPTION 'Unauthorized: % is not an admin', p_admin_email;
    END IF;

    -- Process all waiting users
    FOR v_user_id IN
        SELECT id FROM public.profiles
        WHERE status = 'waiting'
        AND embedding IS NOT NULL
        ORDER BY updated_at ASC  -- Oldest waiters first (fairness)
    LOOP
        -- Attempt to match this user
        SELECT public.match_user_atomically(v_user_id) INTO v_result;

        IF v_result IS NOT NULL THEN
            v_match_count := v_match_count + 1;
        END IF;
    END LOOP;

    RETURN v_match_count;
END;
$$;

-- Unmatch function with safety reset
CREATE OR REPLACE FUNCTION public.unmatch_users(
    p_match_id UUID,
    p_requesting_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_match RECORD;
BEGIN
    -- Fetch and validate match
    SELECT * INTO v_match
    FROM public.matches
    WHERE id = p_match_id
    AND is_active = TRUE
    FOR UPDATE;

    IF v_match IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Verify requesting user is participant
    IF p_requesting_user_id != v_match.user_a_id
       AND p_requesting_user_id != v_match.user_b_id THEN
        RETURN FALSE;
    END IF;

    -- Deactivate match (record preserved for "never re-match" safety)
    UPDATE public.matches
    SET is_active = FALSE
    WHERE id = p_match_id;

    -- Reset both users to waiting status
    UPDATE public.profiles
    SET status = 'waiting',
        current_match_id = NULL
    WHERE id IN (v_match.user_a_id, v_match.user_b_id);

    RETURN TRUE;
END;
$$;

-- Get match partner details
CREATE OR REPLACE FUNCTION public.get_match_partner(
    p_match_id UUID,
    p_user_id UUID
)
RETURNS TABLE (
    partner_id UUID,
    partner_name TEXT,
    partner_bio TEXT,
    partner_major TEXT,
    similarity_score FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        CASE
            WHEN m.user_a_id = p_user_id THEN m.user_b_id
            ELSE m.user_a_id
        END AS partner_id,
        p.full_name AS partner_name,
        p.bio AS partner_bio,
        p.major AS partner_major,
        m.similarity_score
    FROM public.matches m
    JOIN public.profiles p ON p.id = CASE
        WHEN m.user_a_id = p_user_id THEN m.user_b_id
        ELSE m.user_a_id
    END
    WHERE m.id = p_match_id
    AND m.is_active = TRUE
    AND (m.user_a_id = p_user_id OR m.user_b_id = p_user_id);
END;
$$;

-- ----------------------------------------------------------------------------
-- 8. UTILITY FUNCTIONS
-- ----------------------------------------------------------------------------

-- Get user's current status and match info
CREATE OR REPLACE FUNCTION public.get_user_status(p_user_id UUID)
RETURNS TABLE (
    status user_status,
    current_match_id UUID,
    partner_name TEXT,
    similarity_score FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        pr.status,
        pr.current_match_id,
        partner.full_name AS partner_name,
        m.similarity_score
    FROM public.profiles pr
    LEFT JOIN public.matches m ON m.id = pr.current_match_id AND m.is_active = TRUE
    LEFT JOIN public.profiles partner ON partner.id = CASE
        WHEN m.user_a_id = p_user_id THEN m.user_b_id
        ELSE m.user_a_id
    END
    WHERE pr.id = p_user_id;
END;
$$;
