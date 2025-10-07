-- ========================================
-- DATABASE SCHEMA FOR IELTS LEARNING PLATFORM
-- ========================================
-- Run this script in Supabase SQL Editor to create tables

-- 1. PROFILES TABLE (extends auth.users)
-- ========================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    target_score NUMERIC(2,1) DEFAULT 7.0,
    current_level TEXT DEFAULT 'beginner',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger that calls the function every time a user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. USER_PROGRESS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS user_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    skill_type TEXT NOT NULL CHECK (skill_type IN ('listening', 'reading', 'writing', 'speaking')),
    current_level NUMERIC(2,1) DEFAULT 0.0,
    target_score NUMERIC(2,1) DEFAULT 7.0,
    total_exercises INTEGER DEFAULT 0,
    completed_exercises INTEGER DEFAULT 0,
    last_practice_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one record per user per skill
    UNIQUE(user_id, skill_type)
);

-- 3. WRITING_SUBMISSIONS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS writing_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    task_type TEXT NOT NULL CHECK (task_type IN ('task_1', 'task_2')),
    prompt TEXT NOT NULL,
    content TEXT NOT NULL,
    word_count INTEGER,
    ai_score NUMERIC(2,1),
    ai_feedback TEXT,
    human_score NUMERIC(2,1),
    human_feedback TEXT,
    status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'ai_graded', 'human_graded', 'final')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. LEARNING_PATHS TABLE (for personalized study plans)
-- ========================================
CREATE TABLE IF NOT EXISTS learning_paths (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    target_score NUMERIC(2,1) NOT NULL,
    weak_skills TEXT[], -- Array of skills that need improvement
    study_hours_per_week INTEGER DEFAULT 10,
    target_test_date DATE,
    current_step INTEGER DEFAULT 1,
    total_steps INTEGER DEFAULT 20,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. EXERCISES TABLE (for practice materials)
-- ========================================
CREATE TABLE IF NOT EXISTS exercises (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    skill_type TEXT NOT NULL CHECK (skill_type IN ('listening', 'reading', 'writing', 'speaking')),
    difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    content JSONB, -- Flexible content storage
    instructions TEXT,
    estimated_time INTEGER, -- in minutes
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. USER_EXERCISE_ATTEMPTS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS user_exercise_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
    answers JSONB,
    score NUMERIC(5,2),
    time_spent INTEGER, -- in seconds
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. INDEXES FOR BETTER PERFORMANCE
-- ========================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_skill ON user_progress(skill_type);
CREATE INDEX IF NOT EXISTS idx_writing_submissions_user_id ON writing_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_writing_submissions_created_at ON writing_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_learning_paths_user_id ON learning_paths(user_id);
CREATE INDEX IF NOT EXISTS idx_exercises_skill ON exercises(skill_type);
CREATE INDEX IF NOT EXISTS idx_user_attempts_user_id ON user_exercise_attempts(user_id);

-- 8. UPDATE TRIGGERS FOR UPDATED_AT
-- ========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_progress_updated_at BEFORE UPDATE ON user_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_writing_submissions_updated_at BEFORE UPDATE ON writing_submissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learning_paths_updated_at BEFORE UPDATE ON learning_paths
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exercises_updated_at BEFORE UPDATE ON exercises
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- SAMPLE DATA FOR TESTING
-- ========================================

-- Insert sample exercises (only if not exists)
INSERT INTO exercises (title, skill_type, difficulty_level, instructions, estimated_time)
VALUES 
    ('IELTS Writing Task 1: Bar Chart', 'writing', 'intermediate', 'Describe the bar chart showing tourism statistics', 20),
    ('IELTS Writing Task 2: Technology Essay', 'writing', 'intermediate', 'Write an essay about technology impact on society', 40),
    ('IELTS Listening: Multiple Choice', 'listening', 'beginner', 'Listen to the audio and answer questions', 15),
    ('IELTS Reading: True/False/Not Given', 'reading', 'intermediate', 'Read the passage and determine if statements are true, false, or not given', 25)
ON CONFLICT DO NOTHING;

-- ========================================
-- VERIFICATION
-- ========================================
-- Check if tables were created successfully
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';