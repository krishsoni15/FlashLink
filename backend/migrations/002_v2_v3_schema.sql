-- FlashLink V2 & V3 Database Schema Enhancements
-- PostgreSQL 16+

-- 1. Create Roles Enum if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'member_role') THEN
        CREATE TYPE member_role AS ENUM ('owner', 'admin', 'editor', 'viewer');
    END IF;
END $$;

-- 2. Workspaces Table
CREATE TABLE IF NOT EXISTS workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    owner_id UUID REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workspaces_slug ON workspaces(slug);
CREATE INDEX IF NOT EXISTS idx_workspaces_owner ON workspaces(owner_id);

-- 3. Workspace Members Table
CREATE TABLE IF NOT EXISTS workspace_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role member_role NOT NULL DEFAULT 'viewer',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(workspace_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_composite ON workspace_members(workspace_id, user_id);

-- 4. Custom Domains Table
CREATE TABLE IF NOT EXISTS domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    domain VARCHAR(255) UNIQUE NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    ssl_active BOOLEAN DEFAULT FALSE,
    dns_txt_token VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_domains_workspace ON domains(workspace_id);
CREATE INDEX IF NOT EXISTS idx_domains_domain ON domains(domain);

-- 5. API Keys Table
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    key_prefix VARCHAR(10) NOT NULL,
    key_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_workspace ON api_keys(workspace_id);

-- 6. Enhance URLs Table to support V2 requirements
-- Check first if columns exist before adding them
ALTER TABLE urls ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
ALTER TABLE urls ADD COLUMN IF NOT EXISTS domain_id UUID REFERENCES domains(id) ON DELETE SET NULL;
ALTER TABLE urls ADD COLUMN IF NOT EXISTS title VARCHAR(255);
ALTER TABLE urls ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE urls ADD COLUMN IF NOT EXISTS max_clicks INT DEFAULT NULL;
ALTER TABLE urls ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255) DEFAULT NULL;
ALTER TABLE urls ADD COLUMN IF NOT EXISTS geo_targeting JSONB DEFAULT NULL;
ALTER TABLE urls ADD COLUMN IF NOT EXISTS device_targeting JSONB DEFAULT NULL;
ALTER TABLE urls ADD COLUMN IF NOT EXISTS ab_testing JSONB DEFAULT NULL;

-- 7. Link-in-Bio Profiles Table
CREATE TABLE IF NOT EXISTS bio_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    username VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100),
    bio TEXT,
    avatar_url TEXT,
    theme_config JSONB,
    socials JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bio_profiles_username ON bio_profiles(username);
CREATE INDEX IF NOT EXISTS idx_bio_profiles_workspace ON bio_profiles(workspace_id);

-- 8. Link-in-Bio Buttons/Links Table
CREATE TABLE IF NOT EXISTS bio_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES bio_profiles(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    url TEXT NOT NULL,
    icon_type VARCHAR(50),
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bio_links_profile ON bio_links(profile_id);

-- 9. Partitioned Analytics Table
CREATE TABLE IF NOT EXISTS clicks_partitioned (
    id UUID NOT NULL,
    link_id UUID NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    ip_hash VARCHAR(64),
    country VARCHAR(3),
    region VARCHAR(100),
    city VARCHAR(100),
    device VARCHAR(50),
    browser VARCHAR(50),
    os VARCHAR(50),
    referrer VARCHAR(255),
    is_unique BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (id, timestamp)
) PARTITION BY RANGE (timestamp);

-- Generate initial month partitions for safety
CREATE TABLE IF NOT EXISTS clicks_y2026m05 PARTITION OF clicks_partitioned
    FOR VALUES FROM ('2026-05-01 00:00:00+00') TO ('2026-06-01 00:00:00+00');

CREATE TABLE IF NOT EXISTS clicks_y2026m06 PARTITION OF clicks_partitioned
    FOR VALUES FROM ('2026-06-01 00:00:00+00') TO ('2026-07-01 00:00:00+00');

CREATE TABLE IF NOT EXISTS clicks_y2026m07 PARTITION OF clicks_partitioned
    FOR VALUES FROM ('2026-07-01 00:00:00+00') TO ('2026-08-01 00:00:00+00');
