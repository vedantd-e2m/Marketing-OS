-- =========================================================================
-- Marketing OS V2 — Database RLS Policy Fresh Start Patch
-- Copy and paste this script directly into your Supabase SQL Editor and Run.
-- =========================================================================

-- 1. Drop ALL possible old policies on Organizations and Users to start clean
DROP POLICY IF EXISTS select_orgs ON organizations;
DROP POLICY IF EXISTS insert_orgs ON organizations;
DROP POLICY IF EXISTS update_orgs ON organizations;
DROP POLICY IF EXISTS delete_orgs ON organizations;
DROP POLICY IF EXISTS user_member_select ON users;
DROP POLICY IF EXISTS user_self_policy ON users;
DROP POLICY IF EXISTS user_org_policy ON users;
DROP POLICY IF EXISTS user_org_select ON users;
DROP POLICY IF EXISTS user_self_all ON users;
DROP POLICY IF EXISTS users_policy ON users;
DROP POLICY IF EXISTS insert_users ON users;

-- -------------------------------------------------------------------------
-- 2. Redefine the original get_user_org function (in-place replacement)
-- -------------------------------------------------------------------------

-- Drop old get_auth_user_org using CASCADE to automatically remove
-- any old dependent policies pointing to it (which we recreate below).
DROP FUNCTION IF EXISTS get_auth_user_org() CASCADE;

-- We use CREATE OR REPLACE to update the function body in-place.
-- This bypasses the dependency drop locks from clients, campaigns, etc.
CREATE OR REPLACE FUNCTION get_user_org()
RETURNS UUID AS $$
DECLARE
    org_id UUID;
BEGIN
    -- Language plpgsql prevents query inlining, resolving the users RLS recursion
    -- for all tables (clients, campaigns, reports, etc.) referencing this function.
    SELECT organization_id INTO org_id FROM public.users WHERE id = auth.uid();
    RETURN org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -------------------------------------------------------------------------
-- 3. Recreate Policies for Organizations Table
-- -------------------------------------------------------------------------

-- Allow users to read their own organization details, or select a new organization during signup before user creation
CREATE POLICY select_orgs ON organizations 
    FOR SELECT 
    USING (
        id = get_user_org()
        OR
        NOT EXISTS (SELECT 1 FROM public.users WHERE organization_id = organizations.id)
    );

-- Allow anyone to create a new organization during registration
CREATE POLICY insert_orgs ON organizations 
    FOR INSERT 
    WITH CHECK (true);

-- Allow organization updates by members
CREATE POLICY update_orgs ON organizations 
    FOR UPDATE 
    USING (id = get_user_org());

-- -------------------------------------------------------------------------
-- 4. Recreate Policies for Users Table
-- -------------------------------------------------------------------------

-- Allow users full read/write access to their own user profile
CREATE POLICY user_self_policy ON users 
    FOR ALL 
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Allow anyone to insert a user profile (secured by database foreign key constraint pointing to auth.users.id)
CREATE POLICY insert_users ON users 
    FOR INSERT 
    WITH CHECK (true);

-- Allow users to read profiles of other members in their organization
CREATE POLICY user_member_select ON users 
    FOR SELECT 
    USING (organization_id = get_user_org());

-- -------------------------------------------------------------------------
-- 5. Enable Supabase Realtime Publication for V2 Dashboard updates
-- -------------------------------------------------------------------------
DO $$
BEGIN
    -- 1. Add platform_import_jobs if not already in publication
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_rel pr 
        JOIN pg_publication p ON p.oid = pr.prpubid 
        JOIN pg_class c ON c.oid = pr.prrelid 
        WHERE p.pubname = 'supabase_realtime' AND c.relname = 'platform_import_jobs'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE platform_import_jobs;
    END IF;

    -- 2. Add campaigns
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_rel pr 
        JOIN pg_publication p ON p.oid = pr.prpubid 
        JOIN pg_class c ON c.oid = pr.prrelid 
        WHERE p.pubname = 'supabase_realtime' AND c.relname = 'campaigns'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE campaigns;
    END IF;

    -- 3. Add reports
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_rel pr 
        JOIN pg_publication p ON p.oid = pr.prpubid 
        JOIN pg_class c ON c.oid = pr.prrelid 
        WHERE p.pubname = 'supabase_realtime' AND c.relname = 'reports'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE reports;
    END IF;

    -- 4. Add notifications
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_rel pr 
        JOIN pg_publication p ON p.oid = pr.prpubid 
        JOIN pg_class c ON c.oid = pr.prrelid 
        WHERE p.pubname = 'supabase_realtime' AND c.relname = 'notifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
    END IF;

    -- 5. Add llm_insights
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_rel pr 
        JOIN pg_publication p ON p.oid = pr.prpubid 
        JOIN pg_class c ON c.oid = pr.prrelid 
        WHERE p.pubname = 'supabase_realtime' AND c.relname = 'llm_insights'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE llm_insights;
    END IF;
END $$;