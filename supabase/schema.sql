-- ==============================================================================
-- TALVIORA TECH: AI Career Intelligence Platform
-- Production PostgreSQL Database DDL & Row Level Security (RLS) Schema
-- Compatible with Supabase PostgreSQL 15+
-- Apply this baseline before the adaptive roadmap migration.
BEGIN;
-- ==============================================================================

-- Enable UUID & Crypto extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. PROFILES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'Learner',
    email TEXT,
    target_role TEXT NOT NULL DEFAULT 'AI Solutions Architect',
    experience_level TEXT NOT NULL DEFAULT 'Junior' CHECK (experience_level IN ('Entry', 'Junior', 'Mid-Level', 'Senior', 'Lead')),
    readiness_score INT NOT NULL DEFAULT 70 CHECK (readiness_score >= 0 AND readiness_score <= 100),
    weekly_hours INT NOT NULL DEFAULT 12 CHECK (weekly_hours >= 1 AND weekly_hours <= 100),
    current_streak_days INT NOT NULL DEFAULT 1 CHECK (current_streak_days >= 0),
    verified_badges_count INT NOT NULL DEFAULT 0 CHECK (verified_badges_count >= 0),
    github_url TEXT,
    linkedin_url TEXT,
    portfolio_slug TEXT UNIQUE,
    bio TEXT DEFAULT 'Engineering next-generation AI systems and cloud architectures.',
    skills JSONB NOT NULL DEFAULT '{"Python": 75, "SQL": 70, "Machine Learning": 65, "System Design": 60}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for portfolio vanity lookups
CREATE INDEX IF NOT EXISTS idx_profiles_portfolio_slug ON public.profiles(portfolio_slug);

-- ------------------------------------------------------------------------------
-- 2. ASSESSMENTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    target_role TEXT NOT NULL,
    readiness_score INT NOT NULL CHECK (readiness_score >= 0 AND readiness_score <= 100),
    strong_pillars JSONB NOT NULL DEFAULT '[]'::jsonb,
    growth_pillars JSONB NOT NULL DEFAULT '[]'::jsonb,
    priority_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
    recommended_projects JSONB NOT NULL DEFAULT '[]'::jsonb,
    next_sprint_focus TEXT,
    executive_summary TEXT,
    answers JSONB NOT NULL DEFAULT '{}'::jsonb,
    assessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assessments_user_id ON public.assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_assessments_assessed_at ON public.assessments(assessed_at DESC);

-- ------------------------------------------------------------------------------
-- 3. INTERVIEW SESSIONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.interview_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    question TEXT NOT NULL,
    candidate_answer TEXT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 10),
    strengths JSONB NOT NULL DEFAULT '[]'::jsonb,
    areas_for_improvement JSONB NOT NULL DEFAULT '[]'::jsonb,
    ideal_talking_points JSONB NOT NULL DEFAULT '[]'::jsonb,
    verdict TEXT,
    evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interview_sessions_user_id ON public.interview_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_evaluated_at ON public.interview_sessions(evaluated_at DESC);

-- ------------------------------------------------------------------------------
-- 4. TASKS TABLE (Sprint & Daily Accountability)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tasks (
    id TEXT PRIMARY KEY DEFAULT ('task-' || gen_random_uuid()::text),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'General',
    hours INT NOT NULL DEFAULT 2 CHECK (hours >= 1 AND hours <= 40),
    "column" TEXT NOT NULL DEFAULT 'backlog' CHECK ("column" IN ('backlog', 'in-progress', 'completed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_column ON public.tasks("column");

-- ------------------------------------------------------------------------------
-- 5. BOOKMARKS TABLE (Saved Courses, Projects, Opportunities)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL CHECK (item_type IN ('project', 'course', 'opportunity', 'resource')),
    item_id TEXT NOT NULL,
    title TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, item_type, item_id)
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON public.bookmarks(user_id);

-- ------------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Public can view public profiles via slug" ON public.profiles;
CREATE POLICY "Public can view public profiles via slug"
    ON public.profiles FOR SELECT TO anon
    USING (portfolio_slug IS NOT NULL);

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT TO authenticated
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Assessments Policies
DROP POLICY IF EXISTS "Users can view own assessments" ON public.assessments;
CREATE POLICY "Users can view own assessments"
    ON public.assessments FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own assessments" ON public.assessments;
CREATE POLICY "Users can insert own assessments"
    ON public.assessments FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Interview Sessions Policies
DROP POLICY IF EXISTS "Users can view own interviews" ON public.interview_sessions;
CREATE POLICY "Users can view own interviews"
    ON public.interview_sessions FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own interviews" ON public.interview_sessions;
CREATE POLICY "Users can insert own interviews"
    ON public.interview_sessions FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Tasks Policies
DROP POLICY IF EXISTS "Users can view own tasks" ON public.tasks;
CREATE POLICY "Users can view own tasks"
    ON public.tasks FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own tasks" ON public.tasks;
CREATE POLICY "Users can manage own tasks"
    ON public.tasks FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Bookmarks Policies
DROP POLICY IF EXISTS "Users can manage own bookmarks" ON public.bookmarks;
CREATE POLICY "Users can manage own bookmarks"
    ON public.bookmarks FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Explicit API grants: public portfolios expose only queried fields.
REVOKE ALL ON TABLE public.profiles, public.assessments, public.interview_sessions, public.tasks, public.bookmarks FROM anon;
GRANT SELECT (name, target_role, readiness_score, bio, skills, portfolio_slug) ON TABLE public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON TABLE public.profiles TO authenticated;
GRANT SELECT, INSERT ON TABLE public.assessments, public.interview_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.tasks, public.bookmarks TO authenticated;

-- ------------------------------------------------------------------------------
-- 7. TRIGGERS & AUTOMATION
-- ------------------------------------------------------------------------------

-- Auto-update updated_at timestamp function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Auto-provision profile on auth.users registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, name, email, portfolio_slug)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(COALESCE(NEW.email, 'learner@talviora.tech'), '@', 1), 'Learner'),
        NEW.email,
        COALESCE(split_part(NEW.email, '@', 1), 'learner') || '-' || substr(NEW.id::text, 1, 4)
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 8. MENTOR QUESTIONS (Question-only admin inbox)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.mentor_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question TEXT NOT NULL CHECK (char_length(question) BETWEEN 3 AND 4000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mentor_questions_created_at
    ON public.mentor_questions(created_at DESC);

ALTER TABLE public.mentor_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can submit mentor questions" ON public.mentor_questions;
CREATE POLICY "Anyone can submit mentor questions"
    ON public.mentor_questions FOR INSERT TO anon, authenticated
    WITH CHECK (char_length(question) BETWEEN 3 AND 4000);

DROP POLICY IF EXISTS "Talviora admins can read mentor questions" ON public.mentor_questions;
CREATE POLICY "Talviora admins can read mentor questions"
    ON public.mentor_questions FOR SELECT TO authenticated
    USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Talviora admins can delete mentor questions" ON public.mentor_questions;
CREATE POLICY "Talviora admins can delete mentor questions"
    ON public.mentor_questions FOR DELETE TO authenticated
    USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

GRANT INSERT ON public.mentor_questions TO anon, authenticated;
GRANT SELECT, DELETE ON public.mentor_questions TO authenticated;
REVOKE UPDATE ON public.mentor_questions FROM anon, authenticated;

COMMIT;
NOTIFY pgrst, 'reload schema';
