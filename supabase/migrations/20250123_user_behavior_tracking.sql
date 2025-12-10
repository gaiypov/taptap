-- Migration: User Behavior Tracking System
-- Tracks user actions for personalized recommendations

-- Create user_behavior table
CREATE TABLE IF NOT EXISTS user_behavior (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  category VARCHAR(50),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_user_behavior_user_id ON user_behavior(user_id);
CREATE INDEX IF NOT EXISTS idx_user_behavior_created_at ON user_behavior(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_behavior_event_type ON user_behavior(event_type);
CREATE INDEX IF NOT EXISTS idx_user_behavior_listing_id ON user_behavior(listing_id);
CREATE INDEX IF NOT EXISTS idx_user_behavior_category ON user_behavior(category);

-- Composite index for user + category + time queries
CREATE INDEX IF NOT EXISTS idx_user_behavior_user_category_time
  ON user_behavior(user_id, category, created_at DESC);

-- Composite index for recommendations
CREATE INDEX IF NOT EXISTS idx_user_behavior_user_event_time
  ON user_behavior(user_id, event_type, created_at DESC);

-- Enable RLS
ALTER TABLE user_behavior ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own behavior data
CREATE POLICY "Users can view own behavior" ON user_behavior
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own behavior data
CREATE POLICY "Users can insert own behavior" ON user_behavior
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own behavior data (for GDPR compliance)
CREATE POLICY "Users can delete own behavior" ON user_behavior
  FOR DELETE USING (auth.uid() = user_id);

-- Function to clean up old behavior data (older than 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_behavior_data()
RETURNS void AS $$
BEGIN
  DELETE FROM user_behavior
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a cron job to run cleanup weekly (if pg_cron is available)
-- SELECT cron.schedule('cleanup-behavior', '0 3 * * 0', 'SELECT cleanup_old_behavior_data()');

-- View for aggregated user preferences (useful for analytics)
CREATE OR REPLACE VIEW user_preferences_summary AS
SELECT
  user_id,
  category,
  COUNT(*) as total_events,
  COUNT(DISTINCT listing_id) as unique_listings,
  COUNT(*) FILTER (WHERE event_type = 'view') as views,
  COUNT(*) FILTER (WHERE event_type = 'view_long') as long_views,
  COUNT(*) FILTER (WHERE event_type = 'like') as likes,
  COUNT(*) FILTER (WHERE event_type = 'favorite') as favorites,
  COUNT(*) FILTER (WHERE event_type = 'share') as shares,
  COUNT(*) FILTER (WHERE event_type = 'chat_start') as chats_started,
  COUNT(*) FILTER (WHERE event_type = 'call') as calls,
  MAX(created_at) as last_activity
FROM user_behavior
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY user_id, category;

-- Grant access to the view
GRANT SELECT ON user_preferences_summary TO authenticated;

-- Function to get user's top preferences for a category
CREATE OR REPLACE FUNCTION get_user_top_preferences(
  p_user_id UUID,
  p_category VARCHAR(50),
  p_limit INT DEFAULT 10
)
RETURNS TABLE(
  preference_key VARCHAR,
  preference_value TEXT,
  weight BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    key::VARCHAR as preference_key,
    value::TEXT as preference_value,
    COUNT(*)::BIGINT as weight
  FROM user_behavior,
       jsonb_each_text(metadata)
  WHERE user_id = p_user_id
    AND category = p_category
    AND created_at > NOW() - INTERVAL '30 days'
    AND key IN ('brand', 'city', 'color', 'transmission', 'breed', 'property_type')
  GROUP BY key, value
  ORDER BY weight DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute on function
GRANT EXECUTE ON FUNCTION get_user_top_preferences TO authenticated;

COMMENT ON TABLE user_behavior IS 'Stores user behavior events for personalized recommendations';
COMMENT ON COLUMN user_behavior.event_type IS 'Type of event: view, like, favorite, share, chat_start, call, search, etc.';
COMMENT ON COLUMN user_behavior.metadata IS 'Additional event data: brand, price, city, duration, etc.';
