# 🚀 Hướng dẫn Setup Supabase cho IELTS Learning Platform

## Bước 1: Tạo Supabase Project

1. Truy cập [https://supabase.com](https://supabase.com)
2. Đăng nhập/Đăng ký tài khoản
3. Click "New Project"
4. Chọn Organization (hoặc tạo mới)
5. Điền thông tin:
   - **Name**: `ielts-learning-platform`
   - **Database Password**: Tạo mật khẩu mạnh (lưu lại)
   - **Region**: Singapore (gần Việt Nam nhất)
6. Click "Create new project"
7. Đợi 2-3 phút để project khởi tạo

## Bước 2: Lấy API Keys

1. Vào **Settings** → **API**
2. Copy các thông tin sau:
   - **Project URL** (anon, public)
   - **anon public** key
   - **service_role** key (chỉ dùng cho server)

## Bước 3: Setup Database Schema

Vào **SQL Editor** và chạy các script sau:

### 3.1. Enable RLS (Row Level Security)
```sql
-- Enable RLS on auth.users
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;
```

### 3.2. Tạo bảng profiles
```sql
-- Create profiles table
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Auto-create profile on signup
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

-- Trigger for auto-create profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 3.3. Tạo bảng user_progress (tiến độ học tập)
```sql
-- Create user_progress table
CREATE TABLE public.user_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_type TEXT NOT NULL CHECK (skill_type IN ('listening', 'reading', 'writing', 'speaking')),
  current_level DECIMAL(3,1) DEFAULT 0.0,
  target_score DECIMAL(3,1),
  total_exercises INTEGER DEFAULT 0,
  completed_exercises INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own progress" ON public.user_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" ON public.user_progress
  FOR ALL USING (auth.uid() = user_id);
```

### 3.4. Tạo bảng writing_submissions (bài viết được submit)
```sql
-- Create writing_submissions table
CREATE TABLE public.writing_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL CHECK (task_type IN ('task1', 'task2')),
  prompt TEXT NOT NULL,
  content TEXT NOT NULL,
  ai_score DECIMAL(3,1),
  ai_feedback JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.writing_submissions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own submissions" ON public.writing_submissions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create submissions" ON public.writing_submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

## Bước 4: Cập nhật Environment Variables

Tạo file `.env.local` trong thư mục root của project:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**⚠️ Quan trọng**: 
- File phải tên là `.env.local` (không phải `.env`)
- Thay `your-project-id` và `your-anon-key-here` bằng giá trị thật từ Supabase
- Restart dev server sau khi tạo file: `npm run dev`

## Bước 5: Test Database

Vào **Table Editor** để kiểm tra:
- ✅ `profiles` table đã tạo
- ✅ `user_progress` table đã tạo  
- ✅ `writing_submissions` table đã tạo
- ✅ RLS policies đã enable

## Bước 6: Tạo Admin User

1. Vào **Authentication** → **Users**
2. Click "Add user"
3. Điền:
   - **Email**: admin@ielts.com
   - **Password**: tạo mật khẩu mạnh
   - **Email Confirm**: true
4. Sau khi tạo, vào **SQL Editor** chạy:

```sql
-- Set admin role
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'admin@ielts.com';
```

---

## 🎯 Sau khi setup xong, chúng ta sẽ có:

1. ✅ Database thật với schema hoàn chỉnh
2. ✅ Authentication system hoạt động  
3. ✅ Admin/User roles
4. ✅ Progress tracking
5. ✅ Writing submissions storage

## 🧪 Test Authentication:

1. **Chạy app**: `npm run dev`
2. **Click "Đăng ký"** trên modal
3. **Điền thông tin** và submit
4. **Check Supabase Dashboard**:
   - **Authentication → Users**: Thấy user mới
   - **Table Editor → profiles**: Thấy profile được tạo tự động

## 🚨 Troubleshooting:

**Lỗi "Missing Supabase environment variables":**
- Đảm bảo file `.env.local` đúng tên và location
- Restart dev server: `Ctrl+C` rồi `npm run dev`

**Lỗi "Invalid API key":**  
- Kiểm tra lại URL và API key từ Supabase Settings → API
- Đảm bảo dùng **anon public** key (không phải service_role)

**User đăng ký không xuất hiện:**
- Check Console có lỗi không
- Kiểm tra SQL trigger đã chạy đúng chưa

---

# 🔧 FIX 403 PERMISSION ERRORS

## ❌ Problem
Getting errors like:
```
Failed to load resource: the server responded with a status of 403 (Forbidden)
permission denied for schema public
```

## ✅ Quick Fix for Development

### Step 1: Run Schema Setup
1. Go to **Supabase Dashboard → SQL Editor**
2. Copy content from `supabase/schema.sql` and run it
3. This creates all tables: profiles, user_progress, writing_submissions

### Step 2: Disable RLS (Development Only)
1. In SQL Editor, run:
```sql
-- Disable RLS for development
ALTER TABLE IF EXISTS profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_progress DISABLE ROW LEVEL SECURITY;  
ALTER TABLE IF EXISTS writing_submissions DISABLE ROW LEVEL SECURITY;
```

### Step 3: Verify
1. Refresh your app
2. Try logging in
3. Check if dashboards load data

## 🔒 For Production: Use Proper RLS
Run `supabase/rls-policies.sql` instead of disabling RLS.