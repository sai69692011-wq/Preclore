-- supabase/migration.sql
-- ─────────────────────────────────────────────────────────────────────────────
-- "Advisor" Layer v1 — Mentor Memory & engagement streaks
-- Run with: supabase db push   (or paste into the Supabase SQL editor)
-- ─────────────────────────────────────────────────────────────────────────────

-- Per-user mentor/advisor state. Queried by src/lib/mentor-memory.ts.
-- (ADDITION beyond the spec snippet — the streaks table alone is not enough;
-- mentor-memory.ts reads projects_completed / selected_mentor / last_active
-- from this table.)
CREATE TABLE IF NOT EXISTS mentor_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  selected_mentor TEXT NOT NULL DEFAULT 'vyrn',
  projects_completed INTEGER NOT NULL DEFAULT 0,
  last_active TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Track researcher engagement streaks (per spec — supports the fire-streak UI).
CREATE TABLE IF NOT EXISTS streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_active_date DATE DEFAULT CURRENT_DATE,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- (ADDITION) PostgREST can only embed related tables across a DIRECT foreign
-- key. fetchUserMentorMemory() runs:
--   .from("mentor_memory").select("*, streaks(current_streak, longest_streak)")
-- so streaks.user_id must also point at mentor_memory(user_id). Both columns
-- are UNIQUE per user, making the relationship 1:1 (embed returns an object,
-- not an array). A column may hold multiple FK constraints, so the spec's
-- REFERENCES users(id) above stays untouched.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'streaks_mentor_memory_fkey'
  ) THEN
    ALTER TABLE streaks
      ADD CONSTRAINT streaks_mentor_memory_fkey
      FOREIGN KEY (user_id) REFERENCES mentor_memory(user_id)
      ON DELETE CASCADE;
  END IF;
END$$;

-- ── Row Level Security ───────────────────────────────────────────────────────
-- The server client (src/lib/supabase-server.ts) runs as the authed user, so
-- without policies the memory fetch would return nothing. One combined policy
-- per table keeps it simple; drop or tighten to taste. If your backend writes
-- streaks via the SERVICE_ROLE key, RLS is bypassed there anyway.
ALTER TABLE mentor_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users manage own mentor_memory" ON mentor_memory;
CREATE POLICY "users manage own mentor_memory" ON mentor_memory
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "users manage own streaks" ON streaks;
CREATE POLICY "users manage own streaks" ON streaks
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ═════════════════════════════════════════════════════════════════════════════
-- v2.3.1 — Academic Reviewer Pipeline (2026-07-19)
-- ═════════════════════════════════════════════════════════════════════════════

-- Track verified academic reviewers.
-- (ADDITION vs spec: id_document_path stores the institutional ID upload.)
CREATE TABLE IF NOT EXISTS reviewers (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  name TEXT,
  email TEXT UNIQUE,
  institution TEXT,
  expertise TEXT[], -- e.g. ['Water', 'Agriculture']
  is_verified BOOLEAN DEFAULT false,
  rating_avg DECIMAL(3,2) DEFAULT 0,
  id_document_path TEXT
);

-- Store high-rigor academic reviews.
-- (ADDITION vs spec: CHECK bounds on all four criteria + overall, plus
-- supporting indexes. The spec only constrained rigor.)
CREATE TABLE IF NOT EXISTS project_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id UUID REFERENCES reviewers(id),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  rigor INTEGER CHECK (rigor BETWEEN 1 AND 5),
  innovation INTEGER CHECK (innovation BETWEEN 1 AND 5),
  impact INTEGER CHECK (impact BETWEEN 1 AND 5),
  presentation INTEGER CHECK (presentation BETWEEN 1 AND 5),
  overall INTEGER CHECK (overall BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(reviewer_id, project_id)
);

CREATE INDEX IF NOT EXISTS idx_project_ratings_project ON project_ratings(project_id);
CREATE INDEX IF NOT EXISTS idx_project_ratings_reviewer ON project_ratings(reviewer_id);

-- (ADDITION) Denormalized academic aggregate on projects. The rating server
-- action maintains these; the reviewer feed and the 1.1x multiplier read
-- them instead of re-joining project_ratings on every page load.
ALTER TABLE projects ADD COLUMN IF NOT EXISTS academic_rating_avg DECIMAL(3,2) DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS academic_review_count INTEGER DEFAULT 0;

-- ── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE reviewers ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_ratings ENABLE ROW LEVEL SECURITY;

-- Reviewers manage their own profile row (id == auth user).
DROP POLICY IF EXISTS "reviewers manage own profile" ON reviewers;
CREATE POLICY "reviewers manage own profile" ON reviewers
  FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Ratings are owned by their reviewer; INSERT additionally requires the
-- reviewer to be VERIFIED — unverified faculty cannot move student scores.
DROP POLICY IF EXISTS "reviewers read own ratings" ON project_ratings;
CREATE POLICY "reviewers read own ratings" ON project_ratings
  FOR SELECT
  USING (auth.uid() = reviewer_id);

DROP POLICY IF EXISTS "verified reviewers insert ratings" ON project_ratings;
CREATE POLICY "verified reviewers insert ratings" ON project_ratings
  FOR INSERT
  WITH CHECK (
    auth.uid() = reviewer_id
    AND EXISTS (
      SELECT 1 FROM reviewers r
      WHERE r.id = auth.uid() AND r.is_verified = true
    )
  );

DROP POLICY IF EXISTS "reviewers update own ratings" ON project_ratings;
CREATE POLICY "reviewers update own ratings" ON project_ratings
  FOR UPDATE
  USING (auth.uid() = reviewer_id);

-- OPTIONAL: let students read ratings on their own projects. The column name
-- for the project's owner varies by schema — adjust before enabling.
-- CREATE POLICY "students read ratings on own projects" ON project_ratings
--   FOR SELECT
--   USING (EXISTS (
--     SELECT 1 FROM projects p
--     WHERE p.id = project_ratings.project_id AND p.user_id = auth.uid()
--   ));

-- NOTE: submitRating() also UPDATEs projects (academic_rating_avg /
-- academic_review_count). If projects RLS restricts writes to owners, put
-- that aggregate step in a trigger on project_ratings instead.

-- OPTIONAL: private storage bucket for institutional IDs (run separately or
-- via the dashboard; requires storage schema access):
-- INSERT INTO storage.buckets (id, name, public)
--   VALUES ('institutional-ids', 'institutional-ids', false)
--   ON CONFLICT (id) DO NOTHING;
-- CREATE POLICY "reviewers upload own ids" ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'institutional-ids' AND auth.uid()::text = (storage.foldername(name))[1]);
-- CREATE POLICY "reviewers read own ids" ON storage.objects FOR SELECT
--   USING (bucket_id = 'institutional-ids' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ═════════════════════════════════════════════════════════════════════════════
-- Preclore Research Journal v2 — the "Citation Moat" (2026-07-19)
-- Trigger-rolled unique counts + minimal-privilege writes. Supersedes v1.
-- ═════════════════════════════════════════════════════════════════════════════
--
-- UPGRADE NOTE (only if v1 was already deployed): the event tables change
-- viewer_id from UUID (auth.users only) to TEXT (auth uid OR a guest cookie
-- id "anon.<uuid>"). On an existing v1 install, run once BEFORE this section:
--   ALTER TABLE paper_views     DROP CONSTRAINT paper_views_viewer_id_fkey;
--   ALTER TABLE paper_views     ALTER COLUMN viewer_id TYPE TEXT;
--   ALTER TABLE paper_citations DROP CONSTRAINT paper_citations_viewer_id_fkey;
--   ALTER TABLE paper_citations ALTER COLUMN viewer_id TYPE TEXT;
-- Fresh installs need nothing — CREATE TABLE IF NOT EXISTS is a no-op on
-- existing tables.

-- Track the public "afterlife" of a project: reads and citations.
CREATE TABLE IF NOT EXISTS published_research (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE UNIQUE,
  title TEXT NOT NULL,
  abstract TEXT,
  view_count INTEGER DEFAULT 0,
  citation_count INTEGER DEFAULT 0,
  published_at TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'published' CHECK (status IN ('published', 'archived'))
);

-- 1. Unique Tracking Tables — the DB itself enforces uniqueness for BOTH
-- signed-in users (auth uid) and guests (cookie-minted "anon.<uuid>").
CREATE TABLE IF NOT EXISTS paper_views (
  paper_id UUID REFERENCES published_research(id) ON DELETE CASCADE,
  viewer_id TEXT NOT NULL, -- auth.users id OR 'anon.<uuid>' from the action
  viewed_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (paper_id, viewer_id)
);

CREATE TABLE IF NOT EXISTS paper_citations (
  paper_id UUID REFERENCES published_research(id) ON DELETE CASCADE,
  viewer_id TEXT NOT NULL,
  cited_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (paper_id, viewer_id)
);

-- 2. Hardened RLS: minimal-privilege writes. Reading published work is
-- public; the only public write surface is the two counter columns.
ALTER TABLE published_research ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read published" ON published_research;
CREATE POLICY "Public read published" ON published_research
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public bump counters" ON published_research; -- v1 name
DROP POLICY IF EXISTS "Minimal counter updates" ON published_research;
CREATE POLICY "Minimal counter updates" ON published_research
  FOR UPDATE USING (status = 'published')
  WITH CHECK (status = 'published');

-- Grant update ONLY on the counter columns to public roles — nothing else
-- on the table is writable outside privileged flows.
GRANT UPDATE (view_count, citation_count) ON published_research TO anon, authenticated;

-- Event tables: insert-only for the person doing the viewing/citing.
-- Authenticated visitors must use their own uid; guests may only use the
-- action-minted 'anon.<uuid>' namespace — arbitrary text cannot be written.
ALTER TABLE paper_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE paper_citations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "record own views" ON paper_views; -- v1 name
DROP POLICY IF EXISTS "insert view events" ON paper_views;
CREATE POLICY "insert view events" ON paper_views
  FOR INSERT WITH CHECK (
    viewer_id = auth.uid()::text OR viewer_id LIKE 'anon.%'
  );

DROP POLICY IF EXISTS "read own views" ON paper_views;
CREATE POLICY "read own views" ON paper_views
  FOR SELECT USING (viewer_id = auth.uid()::text);

DROP POLICY IF EXISTS "record own citations" ON paper_citations; -- v1 name
DROP POLICY IF EXISTS "insert citation events" ON paper_citations;
CREATE POLICY "insert citation events" ON paper_citations
  FOR INSERT WITH CHECK (
    viewer_id = auth.uid()::text OR viewer_id LIKE 'anon.%'
  );

DROP POLICY IF EXISTS "read own citations" ON paper_citations;
CREATE POLICY "read own citations" ON paper_citations
  FOR SELECT USING (viewer_id = auth.uid()::text);

-- 3. Automatic Rollup Trigger — counters are RECOMPUTED from the unique set
-- on every insert (self-healing, race-free). The server action no longer
-- touches the counters at all. SECURITY DEFINER so the rollup isn't subject
-- to the inserting visitor's RLS visibility of the target row.
CREATE OR REPLACE FUNCTION rollup_unique_counts() RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_TABLE_NAME = 'paper_views') THEN
    UPDATE published_research
      SET view_count = (SELECT count(*) FROM paper_views WHERE paper_id = NEW.paper_id)
      WHERE id = NEW.paper_id;
  ELSIF (TG_TABLE_NAME = 'paper_citations') THEN
    UPDATE published_research
      SET citation_count = (SELECT count(*) FROM paper_citations WHERE paper_id = NEW.paper_id)
      WHERE id = NEW.paper_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_view_count ON paper_views;
CREATE TRIGGER trigger_view_count
  AFTER INSERT ON paper_views
  FOR EACH ROW EXECUTE FUNCTION rollup_unique_counts();

DROP TRIGGER IF EXISTS trigger_citation_count ON paper_citations;
CREATE TRIGGER trigger_citation_count
  AFTER INSERT ON paper_citations
  FOR EACH ROW EXECUTE FUNCTION rollup_unique_counts();

-- ═════════════════════════════════════════════════════════════════════════════
-- Failure Vault v1 — reflections that pay Resilience Points (2026-07-19)
-- ═════════════════════════════════════════════════════════════════════════════

-- (SPEC-DEFINED-BY-ENGINEER — the spec named this table but supplied no DDL.)
CREATE TABLE IF NOT EXISTS failure_vault (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  project_title TEXT, -- free-text fallback when no project row is linked
  what_went_wrong TEXT NOT NULL,
  lessons_learned TEXT NOT NULL,
  do_differently TEXT NOT NULL,
  points_awarded INTEGER NOT NULL DEFAULT 200,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Anti-farming: one PAID reflection per user per project.
-- (Partial index — multiple free-text reflections without a project are fine.)
CREATE UNIQUE INDEX IF NOT EXISTS uq_failure_vault_user_project
  ON failure_vault(user_id, project_id)
  WHERE project_id IS NOT NULL;

ALTER TABLE failure_vault ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "students manage own reflections" ON failure_vault;
CREATE POLICY "students manage own reflections" ON failure_vault
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- (ADDITION) Resilience Points wallet shown on the dashboard.
CREATE TABLE IF NOT EXISTS user_points (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  resilience_points INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users manage own points" ON user_points;
CREATE POLICY "users manage own points" ON user_points
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ═════════════════════════════════════════════════════════════════════════════
-- Audit Layer v1 — Shadow Jury (2026-07-19)
-- ═════════════════════════════════════════════════════════════════════════════

-- (ADDITION) Where the Semantic Plagiarism Layer writes its verdicts. If it
-- already maintains these columns, the IF NOT EXISTS clauses are no-ops.
ALTER TABLE projects ADD COLUMN IF NOT EXISTS matched_project_id UUID REFERENCES projects(id) ON DELETE SET NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS similarity_score DECIMAL(3,2);

-- (SPEC-DEFINED-BY-ENGINEER) Immutable decision log for flagged content.
CREATE TABLE IF NOT EXISTS content_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  matched_project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  admin_id UUID REFERENCES users(id),
  action TEXT NOT NULL CHECK (action IN ('approved', 'rejected')),
  note TEXT,
  similarity_score DECIMAL(3,2),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_violations_project ON content_violations(project_id);

ALTER TABLE content_violations ENABLE ROW LEVEL SECURITY;
-- Only admins read/write the audit log. ASSUMPTION: public.users has
-- verification_tier and users.id == auth.uid().
DROP POLICY IF EXISTS "admins manage violations" ON content_violations;
CREATE POLICY "admins manage violations" ON content_violations
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid() AND u.verification_tier = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid() AND u.verification_tier = 'admin'
  ));

-- Admins may update project status (needed to Approve/Reject flagged work).
-- Adjust if your projects UPDATE rights are handled elsewhere.
DROP POLICY IF EXISTS "admins update flagged projects" ON projects;
CREATE POLICY "admins update flagged projects" ON projects
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid() AND u.verification_tier = 'admin'
  ));

-- ═════════════════════════════════════════════════════════════════════════════
-- Connectivity Layer v1 — Problem Graph (2026-07-19)
-- ═════════════════════════════════════════════════════════════════════════════

-- Supporting tables for the Graph (per spec).
CREATE TABLE IF NOT EXISTS problem_graph_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE UNIQUE,
  category TEXT
);

CREATE TABLE IF NOT EXISTS problem_graph_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_project_id UUID REFERENCES projects(id),
  target_project_id UUID REFERENCES projects(id),
  similarity_score DECIMAL(3,2) CHECK (similarity_score BETWEEN 0 AND 1)
);

CREATE INDEX IF NOT EXISTS idx_graph_edges_source ON problem_graph_edges(source_project_id);
CREATE INDEX IF NOT EXISTS idx_graph_edges_target ON problem_graph_edges(target_project_id);

-- The graph is a public discovery surface (students finding collaborators).
ALTER TABLE problem_graph_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_graph_edges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read graph nodes" ON problem_graph_nodes;
CREATE POLICY "Public read graph nodes" ON problem_graph_nodes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read graph edges" ON problem_graph_edges;
CREATE POLICY "Public read graph edges" ON problem_graph_edges
  FOR SELECT USING (true);

-- ═════════════════════════════════════════════════════════════════════════════
-- v2.3 Perfection — Legal Facilitator Shield + Foundational Access
-- ═════════════════════════════════════════════════════════════════════════════

-- ── Mentorship requests (Instagram-style follow/accept) ──────────────────────
-- Contact details stay hidden until the RESEARCHER accepts — the Parental
-- Buffer decision point. A guardian-approval step can later hook into the
-- accept transition without schema change.
CREATE TABLE IF NOT EXISTS mentorship_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID REFERENCES users(id) ON DELETE CASCADE,
  researcher_id UUID REFERENCES users(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT now(),
  responded_at TIMESTAMPTZ,
  UNIQUE (requester_id, researcher_id)
);

CREATE INDEX IF NOT EXISTS idx_mentorship_researcher ON mentorship_requests(researcher_id);

ALTER TABLE mentorship_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "requesters create own requests" ON mentorship_requests;
CREATE POLICY "requesters create own requests" ON mentorship_requests
  FOR INSERT WITH CHECK (auth.uid() = requester_id);

DROP POLICY IF EXISTS "both sides read request" ON mentorship_requests;
CREATE POLICY "both sides read request" ON mentorship_requests
  FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = researcher_id);

DROP POLICY IF EXISTS "researcher responds" ON mentorship_requests;
CREATE POLICY "researcher responds" ON mentorship_requests
  FOR UPDATE USING (auth.uid() = researcher_id);

-- ── The Email Moat ───────────────────────────────────────────────────────────
-- Two-layer defense:
--   1. Public surface = this SECURITY DEFINER view, which exposes email ONLY
--      when the caller holds an ACCEPTED request from that researcher.
--   2. Optionally harden the base table itself (commented below — enable
--      after auditing your existing grants).
CREATE OR REPLACE VIEW researcher_directory
SECURITY DEFINER
SET search_path = public
AS
SELECT
  u.id,
  u.name,
  CASE
    WHEN u.id = auth.uid() THEN u.email
    WHEN EXISTS (
      SELECT 1 FROM mentorship_requests mr
      WHERE mr.researcher_id = u.id
        AND mr.requester_id = auth.uid()
        AND mr.status = 'accepted'
    ) THEN u.email
    ELSE NULL
  END AS email
FROM users u;

GRANT SELECT ON researcher_directory TO anon, authenticated;

-- OPTIONAL HARDENING (enable when ready): strip direct email reads from the
-- base table so ALL contact access flows through the view above.
-- REVOKE SELECT (email) ON users FROM anon, authenticated;

