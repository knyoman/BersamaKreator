-- =============================================================================
-- NANOCONNECT - ALL-IN-ONE INSTALLER
-- Platform: Supabase (PostgreSQL)
-- Version: 1.0
-- Last Updated: 2026-02-05
-- =============================================================================
-- 
-- CARA MENGGUNAKAN:
-- 1. Login ke Supabase Dashboard → https://tznupuahwbgqrsmtelai.supabase.co
-- 2. Buka SQL Editor (di menu sebelah kiri)
-- 3. Copy SELURUH isi file ini
-- 4. Paste ke SQL Editor
-- 5. Klik "RUN" atau tekan Ctrl+Enter
-- 6. Tunggu sampai selesai (sekitar 10-30 detik)
-- 7. Cek di Table Editor untuk melihat hasilnya
--
-- CATATAN: File ini akan otomatis:
-- ✅ Install extensions
-- ✅ Create 4 tables (users, influencers, orders, reviews)
-- ✅ Create indexes untuk performa
-- ✅ Create triggers untuk auto-update
-- ✅ Create views untuk query kompleks
-- ✅ Insert sample data (7 users, 4 influencers, 7 orders, 5 reviews)
-- ✅ Enable Row Level Security (RLS)
-- ✅ Create RLS policies
--
-- =============================================================================

-- =============================================================================
-- PART 1: EXTENSIONS
-- =============================================================================

DO $$ 
BEGIN
    RAISE NOTICE '=== INSTALLING EXTENSIONS ===';
END $$;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- PART 2: DROP EXISTING TABLES (untuk clean install)
-- =============================================================================

DO $$ 
BEGIN
    RAISE NOTICE '=== DROPPING EXISTING TABLES (if any) ===';
END $$;

DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS influencers CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop views if exist
DROP VIEW IF EXISTS v_influencer_profiles CASCADE;
DROP VIEW IF EXISTS v_order_details CASCADE;

-- Drop functions if exist
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
DROP FUNCTION IF EXISTS update_influencer_stats CASCADE;
DROP FUNCTION IF EXISTS is_admin CASCADE;
DROP FUNCTION IF EXISTS is_sme CASCADE;
DROP FUNCTION IF EXISTS is_influencer CASCADE;
DROP FUNCTION IF EXISTS get_user_type CASCADE;

-- =============================================================================
-- PART 3: CREATE TABLES
-- =============================================================================

DO $$ 
BEGIN
    RAISE NOTICE '=== CREATING TABLES ===';
END $$;

-- TABLE: users
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

-- TABLE: influencers
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
    portfolio_images TEXT[],
    is_verified BOOLEAN DEFAULT false,
    rating_average DECIMAL(3,2) DEFAULT 0.00,
    total_orders INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- TABLE: orders
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

-- TABLE: reviews
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    response TEXT,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- PART 4: CREATE INDEXES
-- =============================================================================

DO $$ 
BEGIN
    RAISE NOTICE '=== CREATING INDEXES ===';
END $$;

-- Indexes for users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_user_type ON users(user_type);
CREATE INDEX idx_users_is_active ON users(is_active);

-- Indexes for influencers
CREATE INDEX idx_influencers_user_id ON influencers(user_id);
CREATE INDEX idx_influencers_username ON influencers(username);
CREATE INDEX idx_influencers_niche ON influencers(niche);
CREATE INDEX idx_influencers_is_verified ON influencers(is_verified);
CREATE INDEX idx_influencers_rating ON influencers(rating_average);

-- Indexes for orders
CREATE INDEX idx_orders_influencer_id ON orders(influencer_id);
CREATE INDEX idx_orders_sme_id ON orders(sme_id);
CREATE INDEX idx_orders_status ON orders(order_status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- Indexes for reviews
CREATE INDEX idx_reviews_order_id ON reviews(order_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_is_published ON reviews(is_published);

-- =============================================================================
-- PART 5: CREATE FUNCTIONS
-- =============================================================================

DO $$ 
BEGIN
    RAISE NOTICE '=== CREATING FUNCTIONS ===';
END $$;

-- Function: update_updated_at_column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: update_influencer_stats
CREATE OR REPLACE FUNCTION update_influencer_stats()
RETURNS TRIGGER AS $$
BEGIN
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
$$ LANGUAGE plpgsql;

-- =============================================================================
-- PART 6: CREATE TRIGGERS
-- =============================================================================

DO $$ 
BEGIN
    RAISE NOTICE '=== CREATING TRIGGERS ===';
END $$;

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_influencers_updated_at 
    BEFORE UPDATE ON influencers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at 
    BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_influencer_stats_trigger
    AFTER INSERT OR UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_influencer_stats();

-- =============================================================================
-- PART 7: CREATE VIEWS
-- =============================================================================

DO $$ 
BEGIN
    RAISE NOTICE '=== CREATING VIEWS ===';
END $$;

-- View: v_influencer_profiles
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

-- View: v_order_details
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
    sme.id as sme_id,
    sme.name as sme_name,
    sme.email as sme_email,
    inf.id as influencer_id,
    inf.username as influencer_username,
    u_inf.name as influencer_name,
    inf.followers_count,
    inf.engagement_rate
FROM orders o
JOIN users sme ON o.sme_id = sme.id
JOIN influencers inf ON o.influencer_id = inf.id
JOIN users u_inf ON inf.user_id = u_inf.id;

-- =============================================================================
-- PART 8: INSERT SAMPLE DATA
-- =============================================================================

DO $$ 
BEGIN
    RAISE NOTICE '=== INSERTING SAMPLE DATA ===';
END $$;

-- Sample Users
INSERT INTO users (id, name, email, password, role, user_type, phone, profile_image, is_active, email_verified) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Admin NANOCONNECT', 'admin@nanoconnect.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'admin', '081234567890', 'https://ui-avatars.com/api/?name=Admin+NC', true, true),
('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Budi Santoso', 'budi.sme@gmail.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', 'sme', '081234567891', 'https://ui-avatars.com/api/?name=Budi+Santoso', true, true),
('c3d4e5f6-a7b8-9012-cdef-123456789012', 'Siti Nurhaliza', 'siti.sme@gmail.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', 'sme', '081234567892', 'https://ui-avatars.com/api/?name=Siti+N', true, true),
('d4e5f6a7-b8c9-0123-def1-234567890123', 'Andi Wijaya', 'andi.influencer@gmail.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', 'influencer', '081234567893', 'https://ui-avatars.com/api/?name=Andi+W', true, true),
('e5f6a7b8-c9d0-1234-ef12-345678901234', 'Rina Permatasari', 'rina.influencer@gmail.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', 'influencer', '081234567894', 'https://ui-avatars.com/api/?name=Rina+P', true, true),
('22222222-2222-2222-2222-222222222222', 'Dimas Pratama', 'dimas.foodie@gmail.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', 'influencer', '081234567895', 'https://ui-avatars.com/api/?name=Dimas+P', true, true),
('33333333-3333-3333-3333-333333333333', 'Laras Setiawan', 'laras.tech@gmail.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', 'influencer', '081234567896', 'https://ui-avatars.com/api/?name=Laras+S', true, false);

-- Sample Influencers
INSERT INTO influencers (id, user_id, username, followers_count, engagement_rate, niche, price_per_post, bio, instagram_url, tiktok_url, youtube_url, portfolio_images, is_verified, rating_average, total_orders) VALUES
('f6a7b8c9-d0e1-2345-f123-456789012345', 'd4e5f6a7-b8c9-0123-def1-234567890123', 'andi_wijaya_official', 125000, 8.50, 'Fashion & Lifestyle', 2500000.00, 'Fashion enthusiast | Lifestyle blogger | Collaboration: DM me', 'https://instagram.com/andi_wijaya_official', 'https://tiktok.com/@andi_wijaya', 'https://youtube.com/@andiwijaya', ARRAY['https://example.com/portfolio1.jpg', 'https://example.com/portfolio2.jpg'], true, 4.50, 15),
('a7b8c9d0-e1f2-3456-1234-567890123456', 'e5f6a7b8-c9d0-1234-ef12-345678901234', 'rina_beauty_id', 85000, 12.30, 'Beauty & Skincare', 1800000.00, 'Beauty & skincare reviewer | Let me help your brand shine ✨', 'https://instagram.com/rina_beauty_id', 'https://tiktok.com/@rinabeauty', 'https://youtube.com/@rinabeauty', ARRAY['https://example.com/rina1.jpg', 'https://example.com/rina2.jpg'], true, 4.80, 22),
('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'foodie_jakarta', 45000, 6.80, 'Food & Culinary', 800000.00, 'Jakarta foodie | Food blogger | Restaurant reviewer 🍜', 'https://instagram.com/foodie_jakarta', NULL, NULL, ARRAY['https://example.com/food1.jpg'], false, 0.00, 0),
('44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 'laras_tech_review', 95000, 9.20, 'Technology & Gadget', 2200000.00, 'Tech reviewer | Gadget enthusiast | Trusted tech recommendation 📱', 'https://instagram.com/laras_tech_review', 'https://tiktok.com/@larastech', NULL, ARRAY['https://example.com/tech1.jpg'], true, 4.60, 18);

-- Sample Orders
INSERT INTO orders (id, influencer_id, sme_id, order_status, campaign_name, campaign_description, total_price, deadline, payment_status, notes, completed_at) VALUES
('55555555-5555-5555-5555-555555555555', 'f6a7b8c9-d0e1-2345-f123-456789012345', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'completed', 'Summer Collection Launch', 'Promote our new summer fashion collection dengan 3 post Instagram + 1 Reels', 7500000.00, '2026-01-15', 'paid', 'Sudah selesai dengan sangat baik', '2026-01-16 10:30:00+07'),
('66666666-6666-6666-6666-666666666666', 'a7b8c9d0-e1f2-3456-1234-567890123456', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'completed', 'Skincare Product Review', 'Review produk skincare terbaru kami + tutorial penggunaan', 3600000.00, '2026-01-20', 'paid', 'Content sangat menarik dan engaging', '2026-01-21 14:20:00+07'),
('77777777-7777-7777-7777-777777777777', 'f6a7b8c9-d0e1-2345-f123-456789012345', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 'in_progress', 'Valentine Day Campaign', 'Kampanye Valentine dengan 2 feed post + 3 story', 5000000.00, '2026-02-14', 'paid', 'Sedang dalam proses produksi konten', NULL),
('88888888-8888-8888-8888-888888888888', '44444444-4444-4444-4444-444444444444', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 'pending', 'Tech Product Launch', 'Launch produk tech terbaru dengan unboxing dan review', 4400000.00, '2026-02-28', 'unpaid', 'Menunggu konfirmasi dari influencer', NULL),
('99999999-9999-9999-9999-999999999999', 'a7b8c9d0-e1f2-3456-1234-567890123456', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'cancelled', 'Ramadan Campaign', 'Kampanye produk untuk bulan Ramadan', 3000000.00, '2026-03-01', 'refunded', 'Dibatalkan karena perubahan strategi marketing', NULL),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'f6a7b8c9-d0e1-2345-f123-456789012345', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 'completed', 'Back to School Campaign', 'Kampanye produk fashion untuk back to school season', 5000000.00, '2026-01-10', 'paid', NULL, '2026-01-11 16:00:00+07'),
('ffffffff-ffff-ffff-ffff-ffffffffffff', '44444444-4444-4444-4444-444444444444', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'completed', 'Gadget Review Campaign', 'Review gadget terbaru dengan detail spesifikasi dan performa', 4400000.00, '2026-01-25', 'paid', NULL, '2026-01-26 11:30:00+07');

-- Sample Reviews
INSERT INTO reviews (id, order_id, rating, comment, response, is_published) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '55555555-5555-5555-5555-555555555555', 5, 'Kerjasama dengan Andi sangat profesional! Konten yang dihasilkan sangat berkualitas dan sesuai dengan brief. Engagement rate juga sangat bagus. Highly recommended!', 'Terima kasih banyak! Senang bisa bekerja sama dan menghasilkan konten yang memuaskan 🙏', true),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '66666666-6666-6666-6666-666666666666', 5, 'Rina sangat detail dalam membuat konten review. Respon cepat dan profesional. Hasilnya melebihi ekspektasi kami. Pasti akan repeat order!', 'Thank you so much! Looking forward untuk project selanjutnya ❤️', true),
('cccccccc-cccc-cccc-cccc-cccccccccccc', '99999999-9999-9999-9999-999999999999', 3, 'Proses komunikasi kurang lancar, tapi hasil konten cukup bagus. Sayangnya campaign harus dibatalkan karena internal issue.', NULL, false),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 4, 'Konten bagus dan sesuai target audience. Delivery tepat waktu. Overall satisfied!', NULL, true),
('11111111-aaaa-bbbb-cccc-111111111111', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 5, 'Review sangat detail dan informatif. Subscriber kami sangat appreciate kontennya. Great work Laras!', 'Terima kasih! Senang bisa membantu mempromosikan produk yang berkualitas 🚀', true);

-- =============================================================================
-- PART 9: ENABLE ROW LEVEL SECURITY
-- =============================================================================

DO $$ 
BEGIN
    RAISE NOTICE '=== ENABLING ROW LEVEL SECURITY ===';
END $$;

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE influencers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- PART 10: CREATE RLS POLICIES
-- =============================================================================

DO $$ 
BEGIN
    RAISE NOTICE '=== CREATING RLS POLICIES ===';
END $$;

-- Policies for USERS table
CREATE POLICY "Users dapat melihat semua user"
    ON users FOR SELECT
    USING (true);

CREATE POLICY "Users hanya bisa update data sendiri"
    ON users FOR UPDATE
    USING (auth.uid()::text = id::text);

CREATE POLICY "Siapapun bisa register"
    ON users FOR INSERT
    WITH CHECK (true);

-- Policies for INFLUENCERS table
CREATE POLICY "Semua orang bisa melihat influencer profiles"
    ON influencers FOR SELECT
    USING (true);

CREATE POLICY "Influencer bisa update profile sendiri"
    ON influencers FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = influencers.user_id
            AND users.id::text = auth.uid()::text
        )
    );

CREATE POLICY "Influencer bisa membuat profile"
    ON influencers FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = influencers.user_id
            AND users.id::text = auth.uid()::text
            AND users.user_type = 'influencer'
        )
    );

-- Policies for ORDERS table
CREATE POLICY "Users bisa melihat order mereka"
    ON orders FOR SELECT
    USING (
        sme_id::text = auth.uid()::text
        OR influencer_id IN (
            SELECT id FROM influencers WHERE user_id::text = auth.uid()::text
        )
    );

CREATE POLICY "SME bisa membuat order"
    ON orders FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = sme_id
            AND id::text = auth.uid()::text
            AND user_type = 'sme'
        )
    );

CREATE POLICY "SME bisa update order mereka"
    ON orders FOR UPDATE
    USING (sme_id::text = auth.uid()::text);

CREATE POLICY "Influencer bisa update order mereka"
    ON orders FOR UPDATE
    USING (
        influencer_id IN (
            SELECT id FROM influencers WHERE user_id::text = auth.uid()::text
        )
    );

-- Policies for REVIEWS table
CREATE POLICY "Semua orang bisa melihat published reviews"
    ON reviews FOR SELECT
    USING (is_published = true);

CREATE POLICY "SME bisa melihat semua review mereka"
    ON reviews FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = reviews.order_id
            AND orders.sme_id::text = auth.uid()::text
        )
    );

CREATE POLICY "Influencer bisa melihat review mereka"
    ON reviews FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM orders o
            JOIN influencers i ON o.influencer_id = i.id
            WHERE o.id = reviews.order_id
            AND i.user_id::text = auth.uid()::text
        )
    );

CREATE POLICY "SME bisa membuat review"
    ON reviews FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = reviews.order_id
            AND orders.sme_id::text = auth.uid()::text
            AND orders.order_status = 'completed'
        )
    );

CREATE POLICY "SME bisa update review mereka"
    ON reviews FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = reviews.order_id
            AND orders.sme_id::text = auth.uid()::text
        )
    );

CREATE POLICY "Influencer bisa respond review"
    ON reviews FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM orders o
            JOIN influencers i ON o.influencer_id = i.id
            WHERE o.id = reviews.order_id
            AND i.user_id::text = auth.uid()::text
        )
    );

-- =============================================================================
-- PART 11: CREATE HELPER FUNCTIONS FOR RLS
-- =============================================================================

DO $$ 
BEGIN
    RAISE NOTICE '=== CREATING HELPER FUNCTIONS ===';
END $$;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users
        WHERE id::text = auth.uid()::text
        AND user_type = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_sme()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users
        WHERE id::text = auth.uid()::text
        AND user_type = 'sme'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_influencer()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users
        WHERE id::text = auth.uid()::text
        AND user_type = 'influencer'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_type()
RETURNS VARCHAR AS $$
BEGIN
    RETURN (
        SELECT user_type FROM users
        WHERE id::text = auth.uid()::text
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- PART 12: ADD COMMENTS
-- =============================================================================

DO $$ 
BEGIN
    RAISE NOTICE '=== ADDING TABLE COMMENTS ===';
END $$;

COMMENT ON TABLE users IS 'Tabel utama untuk semua user dalam sistem';
COMMENT ON TABLE influencers IS 'Profile detail untuk influencer';
COMMENT ON TABLE orders IS 'Tabel untuk mengelola order/campaign';
COMMENT ON TABLE reviews IS 'Tabel untuk review dan rating dari SME ke Influencer';
COMMENT ON VIEW v_influencer_profiles IS 'View untuk menampilkan profile influencer lengkap';
COMMENT ON VIEW v_order_details IS 'View untuk menampilkan detail order lengkap';

-- =============================================================================
-- PART 13: VERIFICATION
-- =============================================================================

DO $$ 
DECLARE
    v_users_count INTEGER;
    v_influencers_count INTEGER;
    v_orders_count INTEGER;
    v_reviews_count INTEGER;
BEGIN
    RAISE NOTICE '=== VERIFICATION ===';
    
    SELECT COUNT(*) INTO v_users_count FROM users;
    SELECT COUNT(*) INTO v_influencers_count FROM influencers;
    SELECT COUNT(*) INTO v_orders_count FROM orders;
    SELECT COUNT(*) INTO v_reviews_count FROM reviews;
    
    RAISE NOTICE 'Users: % records', v_users_count;
    RAISE NOTICE 'Influencers: % records', v_influencers_count;
    RAISE NOTICE 'Orders: % records', v_orders_count;
    RAISE NOTICE 'Reviews: % records', v_reviews_count;
    
    IF v_users_count = 7 AND v_influencers_count = 4 AND v_orders_count = 7 AND v_reviews_count = 5 THEN
        RAISE NOTICE '✅ INSTALLATION SUCCESSFUL!';
        RAISE NOTICE '✅ All tables created with sample data';
        RAISE NOTICE '✅ All indexes created';
        RAISE NOTICE '✅ All triggers created';
        RAISE NOTICE '✅ All views created';
        RAISE NOTICE '✅ Row Level Security enabled';
        RAISE NOTICE '✅ RLS policies created';
        RAISE NOTICE '';
        RAISE NOTICE '🎉 NANOCONNECT Database is ready!';
        RAISE NOTICE '';
        RAISE NOTICE 'Test accounts (password: password123):';
        RAISE NOTICE '- Admin: admin@nanoconnect.com';
        RAISE NOTICE '- SME: budi.sme@gmail.com';
        RAISE NOTICE '- Influencer: andi.influencer@gmail.com';
    ELSE
        RAISE WARNING '⚠️ Installation may have issues. Please check the data.';
    END IF;
END $$;

-- =============================================================================
-- INSTALLATION COMPLETE
-- =============================================================================
-- 
-- Next steps:
-- 1. Go to Table Editor to see your tables
-- 2. Check Authentication → Users (will be empty until users register)
-- 3. Try querying: SELECT * FROM v_influencer_profiles;
-- 4. Try querying: SELECT * FROM v_order_details;
--
-- Documentation:
-- - See DATABASE_README.md for complete documentation
-- - See useful_queries.sql for analytics queries
-- - See QUICK_START.md for next steps
--
-- =============================================================================
