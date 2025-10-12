-- Supabase RLS policies removed
-- This file previously contained RLS policy SQL for Supabase and has been
-- removed because the project now uses MongoDB. Restore from backups if needed.
-- 1. PROFILES TABLE POLICIES
-- ========================================

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Policy: Users can update their own profile  
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Policy: Users can insert their own profile (for first time setup)
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Policy: Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- 2. USER_PROGRESS TABLE POLICIES
-- ========================================

-- Enable RLS on user_progress table
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own progress
CREATE POLICY "Users can view own progress" ON user_progress
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own progress
CREATE POLICY "Users can insert own progress" ON user_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own progress
CREATE POLICY "Users can update own progress" ON user_progress
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Admins can view all user progress
CREATE POLICY "Admins can view all progress" ON user_progress
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- 3. WRITING_SUBMISSIONS TABLE POLICIES
-- ========================================

-- Enable RLS on writing_submissions table
ALTER TABLE writing_submissions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own writing submissions
CREATE POLICY "Users can view own submissions" ON writing_submissions
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own writing submissions
CREATE POLICY "Users can insert own submissions" ON writing_submissions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own writing submissions
CREATE POLICY "Users can update own submissions" ON writing_submissions
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Admins can view all writing submissions
CREATE POLICY "Admins can view all submissions" ON writing_submissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Policy: Admins can update all writing submissions (for scoring)
CREATE POLICY "Admins can update all submissions" ON writing_submissions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- 4. ADDITIONAL HELPER FUNCTIONS
-- ========================================

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. GRANT PERMISSIONS
-- ========================================

-- Grant usage on auth schema to authenticated users
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT SELECT ON auth.users TO authenticated;

-- ========================================
-- VERIFICATION QUERIES
-- ========================================
-- Run these to verify the policies are working:

-- Check if RLS is enabled
-- SELECT schemaname, tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE tablename IN ('profiles', 'user_progress', 'writing_submissions');

-- Check existing policies
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename IN ('profiles', 'user_progress', 'writing_submissions');