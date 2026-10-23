-- Store only questions sent to the AI mentor. Replies and conversation history are never stored here.
CREATE TABLE IF NOT EXISTS public.mentor_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL CHECK (char_length(question) BETWEEN 3 AND 4000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mentor_questions_created_at
  ON public.mentor_questions (created_at DESC);

ALTER TABLE public.mentor_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can submit mentor questions" ON public.mentor_questions;
CREATE POLICY "Anyone can submit mentor questions"
  ON public.mentor_questions
  FOR INSERT TO anon, authenticated
  WITH CHECK (char_length(question) BETWEEN 3 AND 4000);

DROP POLICY IF EXISTS "Talviora admins can read mentor questions" ON public.mentor_questions;
CREATE POLICY "Talviora admins can read mentor questions"
  ON public.mentor_questions
  FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Talviora admins can delete mentor questions" ON public.mentor_questions;
CREATE POLICY "Talviora admins can delete mentor questions"
  ON public.mentor_questions
  FOR DELETE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

GRANT INSERT ON public.mentor_questions TO anon, authenticated;
GRANT SELECT, DELETE ON public.mentor_questions TO authenticated;
REVOKE UPDATE ON public.mentor_questions FROM anon, authenticated;
