-- PostgreSQL Schema Migrations for Beauty Things Nail Studio (Supabase)
-- Target Platform: Supabase (Postgres Database)
-- Generated: June 17, 2026

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom-types/enums
CREATE TYPE order_status_type AS ENUM (
  'PENDING_REVIEW',
  'ACCEPTED',
  'ACCEPTED_WITH_DELAY',
  'REJECTED',
  'WAITING_PAYMENT',
  'PAYMENT_UPLOADED',
  'PAYMENT_VERIFIED',
  'IN_PRODUCTION',
  'COMPLETED',
  'CANCELLED'
);

CREATE TYPE seller_decision_type AS ENUM (
  'ACCEPT',
  'ACCEPT_WITH_DELAY',
  'REJECT'
);

CREATE TYPE seller_reason_type AS ENUM (
  'NORMAL',
  'DELAY',
  'MATERIAL_SHORTAGE',
  'FULLY_BOOKED',
  'CUSTOM'
);

-- 1. Create Products Table (Nail designs catalog)
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL, -- 'Classic', 'Luxury', 'Cute', 'Elegant', 'Minimalist'
  price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  images TEXT[] NOT NULL DEFAULT '{}', -- Array of image URLs
  shapes TEXT[] NOT NULL DEFAULT '{}', -- ["Almond", "Coffin", "Square", "Oval"]
  lengths TEXT[] NOT NULL DEFAULT '{}', -- ["Short", "Medium", "Long"]
  tags TEXT[] NOT NULL DEFAULT '{}',
  production_time VARCHAR(100) DEFAULT '3-5 days',
  is_best_seller BOOLEAN DEFAULT FALSE,
  is_new_arrival BOOLEAN DEFAULT FALSE,
  rating NUMERIC(2, 1) DEFAULT 5.0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Custom Nail Requests Table
CREATE TABLE custom_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nail_shape VARCHAR(100) NOT NULL,
  nail_length VARCHAR(100) NOT NULL,
  color_preference VARCHAR(255) NOT NULL,
  notes TEXT,
  reference_image TEXT NOT NULL, -- URL path in Supabase Storage buckets
  status VARCHAR(50) DEFAULT 'PENDING', -- 'PENDING', 'ACCEPTED', 'REJECTED'
  price NUMERIC(10,2),
  estimated_time VARCHAR(100),
  seller_decision VARCHAR(50),
  seller_reason_type seller_reason_type DEFAULT 'NORMAL',
  seller_remark TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  order_id UUID -- Links to order once payment is initiated
);

-- 3. Create Orders Table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID DEFAULT uuid_generate_v4(), -- Simulated or real Auth user id
  customer_name VARCHAR(255) NOT NULL,
  phone VARCHAR(100) NOT NULL,
  telegram_username VARCHAR(100) NOT NULL,
  delivery_address TEXT NOT NULL,
  delivery_option VARCHAR(50) NOT NULL, -- 'SELF_PICKUP' or 'DELIVERY'
  delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  total_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  status order_status_type DEFAULT 'PENDING_REVIEW',
  
  -- Seller Approval Fields
  seller_decision seller_decision_type,
  seller_reason_type seller_reason_type DEFAULT 'NORMAL',
  seller_remark TEXT,
  estimated_completion_date VARCHAR(100), -- "3 days", "7 days", "14 days", or custom
  user_confirmed_decision VARCHAR(50), -- 'ACCEPTED' or 'CANCELLED'

  -- Payment fields
  payment_screenshot TEXT, -- Image URL inside payment-proof storage bucket
  transaction_ref VARCHAR(255),
  payment_method VARCHAR(50), -- 'ABA', 'ACLEDA', 'WING'
  
  is_custom_request_order BOOLEAN DEFAULT FALSE,
  custom_request_id UUID REFERENCES custom_requests(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Order Items Junction Table
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  image TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  shape VARCHAR(100) NOT NULL,
  length VARCHAR(100) NOT NULL,
  size_notes VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create Order History / Timeline Table
CREATE TABLE order_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status VARCHAR(100) NOT NULL,
  remark TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create Reviews Table
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  author VARCHAR(255) NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Create Store Settings Table
CREATE TABLE store_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 2.00,
  telegram_bot_token VARCHAR(255),
  telegram_channel_id VARCHAR(255),
  aba_qr_text TEXT,
  aba_holder VARCHAR(255),
  aba_number VARCHAR(100),
  acleda_qr_text TEXT,
  acleda_holder VARCHAR(255),
  acleda_number VARCHAR(100),
  wing_qr_text TEXT,
  wing_holder VARCHAR(255),
  wing_number VARCHAR(100),
  khmer_default_enabled BOOLEAN DEFAULT TRUE,
  CONSTRAINT single_row CHECK (id = 1)
);

-- 8. Create Telegram Logs Table
CREATE TABLE telegram_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient VARCHAR(100) NOT NULL, -- 'CUSTOMER' or 'SELLER'
  content TEXT NOT NULL,
  status VARCHAR(50) NOT NULL, -- 'SUCCESS' or 'FAILED'
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES for lightning performance
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_history_order_id ON order_history(order_id);
CREATE INDEX idx_custom_requests_status ON custom_requests(status);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_reviews_product_id ON reviews(product_id);

-- Enforce Row Level Security (RLS) policies for user private orders
-- (Example to configure Supabase authenticated roles)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_requests ENABLE ROW LEVEL SECURITY;

-- Allow anonymous checkouts and anonymous order lookup if customer knows order ID
CREATE POLICY "Public read/write access to orders" ON orders FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public read/write access to order_items" ON order_items FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public read/write access to order_history" ON order_history FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public read/write access to custom_requests" ON custom_requests FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public read/write access to store_settings" ON store_settings FOR SELECT TO public USING (true);
CREATE POLICY "Public read access to products" ON products FOR SELECT TO public USING (true);
CREATE POLICY "Public read access to reviews" ON reviews FOR SELECT TO public USING (true);

-- Insert Default Store Settings
INSERT INTO store_settings (
  id, delivery_fee, telegram_bot_token, telegram_channel_id,
  aba_qr_text, aba_holder, aba_number,
  acleda_qr_text, acleda_holder, acleda_number,
  wing_qr_text, wing_holder, wing_number, khmer_default_enabled
) VALUES (
  1, 2.00, '', '',
  'https://pay.aba.com.kh/beautythings_sample', 'CHHIM BEAUTY THINGS Co.', '000 123 456',
  'https://pay.acledabank.com.kh/beautythings_sample', 'CHHIM BEAUTY THINGS Co.', '0123-45-678910-11',
  'https://pay.wingmoney.com/beautythings_sample', 'CHHIM BEAUTY THINGS Co.', '098 765 432', TRUE
) ON CONFLICT (id) DO NOTHING;
