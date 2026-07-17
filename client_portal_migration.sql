-- =========================================================================
-- Client Portal Migration (RBAC and RLS enhancements)
-- =========================================================================

-- 1. Add client_id column to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL;

-- 2. Helper functions for RLS
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS VARCHAR AS $$
    SELECT role FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_client_id()
RETURNS UUID AS $$
    SELECT client_id FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- 3. Policy overrides for direct client tables

-- Clients Table
DROP POLICY IF EXISTS clients_policy ON clients;
CREATE POLICY clients_policy ON clients FOR ALL USING (
    (get_user_role() != 'client' AND organization_id = get_user_org()) OR
    (get_user_role() = 'client' AND id = get_user_client_id())
);

-- Brand Directories
DROP POLICY IF EXISTS brand_directories_policy ON brand_directories;
CREATE POLICY brand_directories_policy ON brand_directories FOR ALL USING (
    (get_user_role() != 'client' AND organization_id = get_user_org()) OR
    (get_user_role() = 'client' AND client_id = get_user_client_id())
);

-- Campaigns
DROP POLICY IF EXISTS campaigns_policy ON campaigns;
CREATE POLICY campaigns_policy ON campaigns FOR ALL USING (
    (get_user_role() != 'client' AND organization_id = get_user_org()) OR
    (get_user_role() = 'client' AND client_id = get_user_client_id())
);

-- Reports
DROP POLICY IF EXISTS reports_policy ON reports;
CREATE POLICY reports_policy ON reports FOR ALL USING (
    (get_user_role() != 'client' AND organization_id = get_user_org()) OR
    (get_user_role() = 'client' AND client_id = get_user_client_id())
);

-- 4. Policy overrides for child tables (Tables that link via campaign_id)

-- Analytics Snapshots
DROP POLICY IF EXISTS snapshots_policy ON analytics_snapshots;
CREATE POLICY snapshots_policy ON analytics_snapshots FOR ALL USING (
    (get_user_role() != 'client' AND organization_id = get_user_org()) OR
    (get_user_role() = 'client' AND campaign_id IN (SELECT id FROM campaigns WHERE client_id = get_user_client_id()))
);

-- Normalized Metrics (Links via snapshot_id -> campaign_id)
-- To keep it performant, we check the snapshot's campaign
DROP POLICY IF EXISTS metrics_policy ON normalized_metrics;
CREATE POLICY metrics_policy ON normalized_metrics FOR ALL USING (
    (get_user_role() != 'client' AND organization_id = get_user_org()) OR
    (get_user_role() = 'client' AND snapshot_id IN (
        SELECT s.id FROM analytics_snapshots s 
        JOIN campaigns c ON s.campaign_id = c.id 
        WHERE c.client_id = get_user_client_id()
    ))
);

-- LLM Insights
DROP POLICY IF EXISTS insights_policy ON llm_insights;
CREATE POLICY insights_policy ON llm_insights FOR ALL USING (
    (get_user_role() != 'client' AND organization_id = get_user_org()) OR
    (get_user_role() = 'client' AND campaign_id IN (SELECT id FROM campaigns WHERE client_id = get_user_client_id()))
);

-- Graph Configurations
DROP POLICY IF EXISTS graph_configs_policy ON graph_configurations;
CREATE POLICY graph_configs_policy ON graph_configurations FOR ALL USING (
    (get_user_role() != 'client' AND organization_id = get_user_org()) OR
    (get_user_role() = 'client' AND campaign_id IN (SELECT id FROM campaigns WHERE client_id = get_user_client_id()))
);

-- 5. Missing Policies Fixes
-- Add a policy for report_sections since it was missing
DROP POLICY IF EXISTS report_sections_policy ON report_sections;
CREATE POLICY report_sections_policy ON report_sections FOR ALL USING (
    report_id IN (SELECT id FROM reports WHERE 
        (get_user_role() != 'client' AND organization_id = get_user_org()) OR
        (get_user_role() = 'client' AND client_id = get_user_client_id())
    )
);
