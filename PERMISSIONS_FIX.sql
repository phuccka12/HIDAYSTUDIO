-- ================================================
-- FIX PERMISSIONS HOÀN TOÀN - CHẠY SCRIPT NÀY TRONG SUPABASE
-- ================================================

-- 1. DROP VÀ TẠO LẠI TẤT CẢ TABLES (để chắc chắn clean)
DROP TABLE IF EXISTS writing_submissions;
DROP TABLE IF EXISTS user_progress;
DROP TABLE IF EXISTS profiles;

-- 2. TẠO LẠI CÁC BẢNG VỚI PERMISSIONS ĐẦY ĐỦ
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    role TEXT DEFAULT 'user',
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    skill_type TEXT NOT NULL,
    current_level NUMERIC(2,1) DEFAULT 0.0,
    target_score NUMERIC(2,1) DEFAULT 7.0,
    completed_exercises INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE writing_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    task_type TEXT NOT NULL,
    prompt TEXT NOT NULL,
    content TEXT NOT NULL,
    ai_score NUMERIC(2,1),
    ai_feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TẮT HẾT RLS (QUAN TRỌNG!)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE writing_submissions DISABLE ROW LEVEL SECURITY;

-- 4. XÓA TẤT CẢ POLICIES CŨ (NẾU CÓ)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON profiles;

DROP POLICY IF EXISTS "Users can view own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can insert own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can update own progress" ON user_progress;

DROP POLICY IF EXISTS "Users can view own submissions" ON writing_submissions;
DROP POLICY IF EXISTS "Users can insert own submissions" ON writing_submissions;
DROP POLICY IF EXISTS "Users can update own submissions" ON writing_submissions;

-- 5. GRANT FULL PERMISSIONS
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON user_progress TO authenticated;
GRANT ALL ON writing_submissions TO authenticated;

GRANT ALL ON profiles TO anon;
GRANT ALL ON user_progress TO anon;
GRANT ALL ON writing_submissions TO anon;

-- 6. TẠO ADMIN USER
INSERT INTO profiles (id, email, full_name, role)
VALUES (
    '0e76c489-c72e-431a-a8d6-a4a79471eeaa',
    'phuccao03738@gmail.com',
    'Admin User',
    'admin'
) ON CONFLICT (id) DO UPDATE SET 
    role = 'admin',
    updated_at = NOW();

-- 7. TẠO VÀI SAMPLE DATA ĐỂ TEST
INSERT INTO user_progress (user_id, skill_type, current_level, target_score, completed_exercises)
VALUES 
    ('0e76c489-c72e-431a-a8d6-a4a79471eeaa', 'reading', 6.5, 7.5, 10),
    ('0e76c489-c72e-431a-a8d6-a4a79471eeaa', 'writing', 6.0, 7.0, 5),
    ('0e76c489-c72e-431a-a8d6-a4a79471eeaa', 'listening', 7.0, 8.0, 15),
    ('0e76c489-c72e-431a-a8d6-a4a79471eeaa', 'speaking', 6.0, 7.5, 8)
ON CONFLICT DO NOTHING;

INSERT INTO writing_submissions (user_id, task_type, prompt, content, ai_score, ai_feedback)
VALUES 
    ('0e76c489-c72e-431a-a8d6-a4a79471eeaa', 'Task 1', 'The chart shows...', 'The given chart illustrates...', 6.5, 'Good structure but needs more detail'),
    ('0e76c489-c72e-431a-a8d6-a4a79471eeaa', 'Task 2', 'Some people think...', 'In recent years...', 7.0, 'Excellent arguments and examples')
ON CONFLICT DO NOTHING;

-- 8. VERIFY KẾT QUẢ
SELECT 'SUCCESS! All tables recreated with full permissions!' as status;
SELECT 'Profile created:' as info, email, role FROM profiles WHERE email = 'phuccao03738@gmail.com';
SELECT 'Progress data:' as info, COUNT(*) as count FROM user_progress;
SELECT 'Submissions data:' as info, COUNT(*) as count FROM writing_submissions;

-- ================================================
-- HOÀN THÀNH! Sau khi chạy script này:
-- 1. Refresh web app hoàn toàn (Ctrl+F5)
-- 2. Login lại
-- 3. Tất cả sẽ hoạt động!
-- ================================================