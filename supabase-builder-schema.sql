-- ESTIQUOTE — Builder Tables (run in Supabase SQL Editor)

CREATE TABLE IF NOT EXISTS builders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL UNIQUE,
  email text, business_name text, contact_name text,
  phone text, postcode text, lat numeric, lng numeric,
  about text, trades text[] DEFAULT '{}',
  accreditations text[] DEFAULT '{}', photos text[] DEFAULT '{}',
  years_experience integer DEFAULT 0, plan text DEFAULT 'builder_listed',
  verified boolean DEFAULT false,
  verified_at timestamptz,
  verified_method text, -- 'payment' | 'manual' | 'companies_house'
  insured boolean DEFAULT false,
  insured_at timestamptz,
  insured_doc_type text,
  rating numeric DEFAULT 5.0, review_count integer DEFAULT 0,
  completed_jobs integer DEFAULT 0, response_time_hours numeric DEFAULT 24,
  profile_views integer DEFAULT 0, active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS enquiries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  builder_user_id uuid REFERENCES auth.users,
  builder_id uuid REFERENCES builders(id),
  homeowner_name text, homeowner_email text, homeowner_phone text,
  homeowner_postcode text, trade text, location text, budget text, message text,
  read_at timestamptz, responded_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS builder_docs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  doc_type text NOT NULL, file_url text, expires_at date,
  uploaded_at timestamptz DEFAULT now(),
  UNIQUE(user_id, doc_type)
);

CREATE TABLE IF NOT EXISTS builder_reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  builder_id uuid REFERENCES builders(id),
  reviewer_name text, reviewer_location text, project_type text,
  rating integer CHECK (rating >= 1 AND rating <= 5), review_text text,
  features_used text[], verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE builders ENABLE ROW LEVEL SECURITY;
ALTER TABLE enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE builder_docs ENABLE ROW LEVEL SECURITY;
ALTER TABLE builder_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read builders" ON builders FOR SELECT USING (active = true);
CREATE POLICY "Builder insert own" ON builders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Builder update own" ON builders FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Builder reads own enquiries" ON enquiries FOR SELECT TO authenticated USING (auth.uid() = builder_user_id);
CREATE POLICY "Anyone can submit enquiry" ON enquiries FOR INSERT WITH CHECK (true);
CREATE POLICY "Builder marks read" ON enquiries FOR UPDATE TO authenticated USING (auth.uid() = builder_user_id);
CREATE POLICY "Builder reads own docs" ON builder_docs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Builder manages own docs" ON builder_docs FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Public read reviews" ON builder_reviews FOR SELECT USING (true);
CREATE POLICY "Anyone can submit review" ON builder_reviews FOR INSERT WITH CHECK (true);

INSERT INTO storage.buckets (id, name, public) VALUES ('builder-photos', 'builder-photos', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('builder-docs', 'builder-docs', false) ON CONFLICT DO NOTHING;
CREATE POLICY "Public read photos" ON storage.objects FOR SELECT USING (bucket_id = 'builder-photos');
CREATE POLICY "Builder upload photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'builder-photos');
CREATE POLICY "Builder manage docs" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'builder-docs');

-- ── MATERIAL PRICES (user-submitted price data) ───────────────
CREATE TABLE IF NOT EXISTS material_prices (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  material_id text NOT NULL,
  merchant_id text NOT NULL,
  price_value numeric NOT NULL,
  region text,
  trade_account boolean DEFAULT false,
  purchase_date date,
  submitted_at timestamptz DEFAULT now()
);

ALTER TABLE material_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit price" ON material_prices FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read prices" ON material_prices FOR SELECT USING (true);
