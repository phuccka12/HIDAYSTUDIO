-- Fix RLS Policy cho profiles table - QUICK FIX
-- Copy và RUN trong Supabase SQL Editor

-- Tạm thời tắt RLS để test
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Hoặc nếu muốn giữ RLS, thử policy đơn giản hơn:
-- DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
-- DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
-- DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- CREATE POLICY "Allow all authenticated users" ON public.profiles
--   FOR ALL USING (auth.role() = 'authenticated');

-- Test query
SELECT 'RLS disabled for testing! App should work now! 🎉' as result;