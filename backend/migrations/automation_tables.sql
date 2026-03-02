-- Automation Tables for Sento
-- Run this in your Supabase SQL Editor

-- Scheduled Posts Table
CREATE TABLE IF NOT EXISTS scheduled_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('Post', 'Reel')),
    caption TEXT,
    concept TEXT,
    media_url TEXT,
    scheduled_time TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'published', 'failed')),
    trend_source TEXT,
    instagram_post_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Automation Settings Table
CREATE TABLE IF NOT EXISTS automation_settings (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'default',
    settings JSONB NOT NULL DEFAULT '{
        "mode": "auto",
        "posts_per_day": 2,
        "content_mix": {"posts": 50, "reels": 50},
        "posting_times": ["09:00", "18:00"],
        "active_days": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        "use_trends": true,
        "trend_region": "United States",
        "is_active": false
    }'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content Performance History (for AI learning)
CREATE TABLE IF NOT EXISTS content_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scheduled_post_id UUID REFERENCES scheduled_posts(id),
    instagram_post_id TEXT,
    content_type VARCHAR(20),
    trend_used TEXT,
    reach INTEGER DEFAULT 0,
    impressions INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    saves INTEGER DEFAULT 0,
    engagement_rate DECIMAL(5,2),
    posted_at TIMESTAMPTZ,
    metrics_updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_status ON scheduled_posts(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_scheduled_time ON scheduled_posts(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_content_performance_engagement ON content_performance(engagement_rate DESC);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_scheduled_posts_updated_at
    BEFORE UPDATE ON scheduled_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_automation_settings_updated_at
    BEFORE UPDATE ON automation_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies (adjust based on your auth setup)
ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_performance ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (customize based on your auth)
CREATE POLICY "Allow all on scheduled_posts" ON scheduled_posts FOR ALL USING (true);
CREATE POLICY "Allow all on automation_settings" ON automation_settings FOR ALL USING (true);
CREATE POLICY "Allow all on content_performance" ON content_performance FOR ALL USING (true);
