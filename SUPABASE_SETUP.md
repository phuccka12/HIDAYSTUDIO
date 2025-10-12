REMOVED: Supabase setup instructions
This file previously contained Supabase setup instructions and examples. The
project has migrated to MongoDB and all Supabase-related content has been
removed.
If you need the original content, restore it from your secure backups.

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