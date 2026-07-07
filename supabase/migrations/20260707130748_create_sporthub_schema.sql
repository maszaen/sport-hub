/*
# SportHub Schema

1. New Tables
  - `venues`: Sports venue listings
    - id, name, address, description, sport (enum), price_per_hour, image_url, rating, created_at
  - `bookings`: User booking records
    - id, user_id (auth), venue_id (fk), date, start_time, end_time, total_price, name, phone, notes, status, created_at
  - `venue_images`: Additional images per venue

2. Security
  - RLS enabled on all tables
  - venues: public SELECT (anon + authenticated), no public write
  - bookings: authenticated users can CRUD their own bookings

3. Notes
  - sport column uses text with a CHECK constraint for the 5 sport types
  - Prices stored in integer (IDR cents equivalent, but displayed as full Rupiah)
*/

-- Venues table
CREATE TABLE IF NOT EXISTS venues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL,
  description text NOT NULL DEFAULT '',
  sport text NOT NULL CHECK (sport IN ('Padel', 'Futsal', 'Tennis', 'Mini Soccer', 'Bulu Tangkis')),
  price_per_hour integer NOT NULL DEFAULT 100000,
  image_url text NOT NULL DEFAULT '',
  rating numeric(2,1) NOT NULL DEFAULT 4.5,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE venues ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone_can_view_venues" ON venues;
CREATE POLICY "anyone_can_view_venues" ON venues FOR SELECT
  TO anon, authenticated USING (true);

-- Venue images (secondary photos)
CREATE TABLE IF NOT EXISTS venue_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0
);

ALTER TABLE venue_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone_can_view_venue_images" ON venue_images;
CREATE POLICY "anyone_can_view_venue_images" ON venue_images FOR SELECT
  TO anon, authenticated USING (true);

-- Bookings table (multi-user, owner-scoped)
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  venue_id uuid NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  booking_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  total_price integer NOT NULL,
  booker_name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_bookings" ON bookings;
CREATE POLICY "select_own_bookings" ON bookings FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_bookings" ON bookings;
CREATE POLICY "insert_own_bookings" ON bookings FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_bookings" ON bookings;
CREATE POLICY "update_own_bookings" ON bookings FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_bookings" ON bookings;
CREATE POLICY "delete_own_bookings" ON bookings FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
