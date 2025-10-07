-- ========================================
-- TEMPORARY FIX: DISABLE RLS FOR DEVELOPMENT
-- ========================================
-- This is a TEMPORARY solution to fix 403 errors
-- Use this only for development/testing
-- Re-enable RLS with proper policies in production

-- Disable RLS on all tables temporarily
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE writing_submissions DISABLE ROW LEVEL SECURITY;

-- Or if tables don't exist yet, create them without RLS
-- You can run this after creating tables to disable RLS

-- ========================================
-- NOTE: 
-- This makes all data publicly accessible
-- Only use for development
-- Use rls-policies.sql for production setup
-- ========================================