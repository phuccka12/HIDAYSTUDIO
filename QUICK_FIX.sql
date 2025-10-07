-- ================================================
-- SCRIPT SUPER SIMPLE ĐỂ FIX NGAY LẬP TỨC
-- ================================================
-- Copy toàn bộ script này vào Supabase SQL Editor và RUN

-- 1. TẠO BẢNG PROFILES
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TẠO BẢNG USER_PROGRESS  
CREATE TABLE IF NOT EXISTS user_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    skill_type TEXT NOT NULL,
    current_level NUMERIC(2,1) DEFAULT 0.0,
    target_score NUMERIC(2,1) DEFAULT 7.0,
    completed_exercises INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TẠO BẢNG WRITING_SUBMISSIONS
CREATE TABLE IF NOT EXISTS writing_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    task_type TEXT NOT NULL,
    prompt TEXT NOT NULL,
    content TEXT NOT NULL,
    ai_score NUMERIC(2,1),
    ai_feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TẮT RLS (QUAN TRỌNG!)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE writing_submissions DISABLE ROW LEVEL SECURITY;

-- 5. TẠO ADMIN USER
INSERT INTO profiles (id, email, full_name, role)
VALUES (
    '0e76c489-c72e-431a-a8d6-a4a79471eeaa',
    'phuccao03738@gmail.com',
    'Admin User',
    'admin'
) ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- 6. VERIFY THÀNH CÔNG
SELECT 'SUCCESS! Tables created and admin user set!' as status;
SELECT email, role FROM profiles WHERE email = 'phuccao03738@gmail.com';

-- ================================================
-- DONE! Sau khi chạy xong:
-- 1. Refresh web app
-- 2. Login lại
-- 3. Sẽ vào admin dashboard!
-- ================================================