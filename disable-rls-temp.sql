-- Temporary: Disable RLS for testing
-- Copy và RUN trong Supabase SQL Editor

-- Disable RLS temporarily
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

SELECT 'RLS disabled temporarily for testing! ⚠️' as result;

-- Note: Nhớ enable lại sau:
-- ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;