-- FlashLink Database Schema
-- PostgreSQL 16+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- Users Table
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    api_key VARCHAR(64) UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_api_key ON users(api_key);
CREATE INDEX idx_users_deleted_at ON users(deleted_at);

-- ============================================
-- URLs Table
-- ============================================
CREATE TABLE IF NOT EXISTS urls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    short_code VARCHAR(20) NOT NULL UNIQUE,
    original_url TEXT NOT NULL,
    custom_alias VARCHAR(50),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    click_count BIGINT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Performance indexes
CREATE UNIQUE INDEX idx_urls_short_code ON urls(short_code);
CREATE INDEX idx_urls_user_id ON urls(user_id);
CREATE INDEX idx_urls_created_at ON urls(created_at DESC);
CREATE INDEX idx_urls_click_count ON urls(click_count DESC);
CREATE INDEX idx_urls_is_active ON urls(is_active);
CREATE INDEX idx_urls_expires_at ON urls(expires_at);
CREATE INDEX idx_urls_user_created ON urls(user_id, created_at DESC);
CREATE INDEX idx_urls_short_code_active ON urls(short_code, is_active);
CREATE INDEX idx_urls_deleted_at ON urls(deleted_at);

-- ============================================
-- Analytics Table
-- ============================================
CREATE TABLE IF NOT EXISTS analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url_id UUID NOT NULL REFERENCES urls(id) ON DELETE CASCADE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    referer TEXT,
    country VARCHAR(100),
    city VARCHAR(100),
    device VARCHAR(50),
    browser VARCHAR(50),
    os VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance indexes for analytics queries
CREATE INDEX idx_analytics_url_id ON analytics(url_id);
CREATE INDEX idx_analytics_created_at ON analytics(created_at DESC);
CREATE INDEX idx_analytics_url_created ON analytics(url_id, created_at DESC);
CREATE INDEX idx_analytics_country ON analytics(url_id, country);
CREATE INDEX idx_analytics_browser ON analytics(url_id, browser);
CREATE INDEX idx_analytics_device ON analytics(url_id, device);
CREATE INDEX idx_analytics_os ON analytics(url_id, os);

-- ============================================
-- Partitioning (optional, for high-volume)
-- ============================================
-- For production with millions of records, consider partitioning analytics by month:
-- CREATE TABLE analytics_partitioned (LIKE analytics INCLUDING ALL) PARTITION BY RANGE (created_at);
