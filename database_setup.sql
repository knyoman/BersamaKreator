-- =============================================================================
-- NANOCONNECT DATABASE SCHEMA
-- Platform: Supabase (PostgreSQL)
-- Description: Database schema untuk platform marketplace influencer & SME
-- =============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- DROP EXISTING TABLES (if needed for fresh setup)
-- =============================================================================
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS influencers CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- =============================================================================
-- TABLE: users
-- Description: Tabel utama untuk semua user (SME, Influencer, Admin)
-- =============================================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('sme', 'influencer', 'admin')),
    phone VARCHAR(20),
    profile_image TEXT,
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes untuk performa query
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_user_type ON users(user_type);
CREATE INDEX idx_users_is_active ON users(is_active);

-- =============================================================================
-- TABLE: influencers
-- Description: Profile detail untuk user dengan tipe influencer
-- =============================================================================
CREATE TABLE influencers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    username VARCHAR(100) NOT NULL UNIQUE,
    followers_count INTEGER DEFAULT 0,
    engagement_rate DECIMAL(5,2) DEFAULT 0.00,
    niche VARCHAR(100),
    price_per_post DECIMAL(12,2) DEFAULT 0.00,
    bio TEXT,
    instagram_url VARCHAR(255),
    tiktok_url VARCHAR(255),
    youtube_url VARCHAR(255),
    portfolio_images TEXT[], -- Array untuk menyimpan URL gambar portfolio
    is_verified BOOLEAN DEFAULT false,
    rating_average DECIMAL(3,2) DEFAULT 0.00,
    total_orders INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes untuk performa query
CREATE INDEX idx_influencers_user_id ON influencers(user_id);
CREATE INDEX idx_influencers_username ON influencers(username);
CREATE INDEX idx_influencers_niche ON influencers(niche);
CREATE INDEX idx_influencers_is_verified ON influencers(is_verified);
CREATE INDEX idx_influencers_rating ON influencers(rating_average);

-- =============================================================================
-- TABLE: orders
-- Description: Tabel untuk mengelola pesanan antara SME dan Influencer
-- =============================================================================
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    influencer_id UUID NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
    sme_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (order_status IN ('pending', 'accepted', 'in_progress', 'completed', 'cancelled', 'rejected')),
    campaign_name VARCHAR(255),
    campaign_description TEXT,
    total_price DECIMAL(12,2) NOT NULL,
    deadline DATE,
    payment_status VARCHAR(20) DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'refunded')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes untuk performa query
CREATE INDEX idx_orders_influencer_id ON orders(influencer_id);
CREATE INDEX idx_orders_sme_id ON orders(sme_id);
CREATE INDEX idx_orders_status ON orders(order_status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- =============================================================================
-- TABLE: reviews
-- Description: Tabel untuk review dan rating dari SME ke Influencer
-- =============================================================================
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    response TEXT, -- Response dari influencer
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes untuk performa query
CREATE INDEX idx_reviews_order_id ON reviews(order_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_is_published ON reviews(is_published);

-- =============================================================================
-- TRIGGERS: Auto-update updated_at timestamp
-- =============================================================================

-- Function untuk update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger untuk semua tabel
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_influencers_updated_at BEFORE UPDATE ON influencers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- FUNCTION: Update influencer stats after review
-- =============================================================================
CREATE OR REPLACE FUNCTION update_influencer_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update average rating dan total orders
    UPDATE influencers
    SET 
        rating_average = (
            SELECT COALESCE(AVG(r.rating), 0)
            FROM reviews r
            JOIN orders o ON r.order_id = o.id
            WHERE o.influencer_id = (SELECT influencer_id FROM orders WHERE id = NEW.order_id)
            AND r.is_published = true
        ),
        total_orders = (
            SELECT COUNT(*)
            FROM orders
            WHERE influencer_id = (SELECT influencer_id FROM orders WHERE id = NEW.order_id)
            AND order_status = 'completed'
        )
    WHERE id = (SELECT influencer_id FROM orders WHERE id = NEW.order_id);
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_influencer_stats_trigger
AFTER INSERT OR UPDATE ON reviews
FOR EACH ROW EXECUTE FUNCTION update_influencer_stats();

-- =============================================================================
-- COMMENTS: Documentation untuk setiap tabel
-- =============================================================================

COMMENT ON TABLE users IS 'Tabel utama untuk semua user dalam sistem';
COMMENT ON TABLE influencers IS 'Profile detail untuk influencer';
COMMENT ON TABLE orders IS 'Tabel untuk mengelola order/campaign';
COMMENT ON TABLE reviews IS 'Tabel untuk review dan rating dari SME ke Influencer';

-- =============================================================================
-- VIEWS: Helpful views untuk query yang sering digunakan
-- =============================================================================

-- View untuk influencer dengan user info
CREATE OR REPLACE VIEW v_influencer_profiles AS
SELECT 
    i.id,
    i.user_id,
    u.name,
    u.email,
    u.phone,
    u.profile_image,
    i.username,
    i.followers_count,
    i.engagement_rate,
    i.niche,
    i.price_per_post,
    i.bio,
    i.instagram_url,
    i.tiktok_url,
    i.youtube_url,
    i.is_verified,
    i.rating_average,
    i.total_orders,
    i.created_at,
    i.updated_at
FROM influencers i
JOIN users u ON i.user_id = u.id
WHERE u.is_active = true;

-- View untuk order dengan detail lengkap
CREATE OR REPLACE VIEW v_order_details AS
SELECT 
    o.id,
    o.campaign_name,
    o.campaign_description,
    o.total_price,
    o.order_status,
    o.payment_status,
    o.deadline,
    o.created_at,
    o.updated_at,
    -- SME Info
    sme.id as sme_id,
    sme.name as sme_name,
    sme.email as sme_email,
    -- Influencer Info
    inf.id as influencer_id,
    inf.username as influencer_username,
    u_inf.name as influencer_name,
    inf.followers_count,
    inf.engagement_rate
FROM orders o
JOIN users sme ON o.sme_id = sme.id
JOIN influencers inf ON o.influencer_id = inf.id
JOIN users u_inf ON inf.user_id = u_inf.id;

COMMENT ON VIEW v_influencer_profiles IS 'View untuk menampilkan profile influencer lengkap';
COMMENT ON VIEW v_order_details IS 'View untuk menampilkan detail order lengkap';
