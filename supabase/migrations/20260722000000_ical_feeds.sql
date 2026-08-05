-- iCal 連携テーブル

CREATE TABLE ical_feeds (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id  UUID NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
  property_id    UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  feed_type      TEXT NOT NULL CHECK (feed_type IN ('site_controller', 'ota')),
  name           TEXT NOT NULL,
  url            TEXT NOT NULL,
  last_synced_at TIMESTAMPTZ,
  last_error     TEXT,
  created_at     TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE ical_bookings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_id       UUID NOT NULL REFERENCES ical_feeds(id) ON DELETE CASCADE,
  property_id   UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  uid           TEXT NOT NULL,
  dtstart       DATE NOT NULL,
  dtend         DATE NOT NULL,
  summary       TEXT,
  missing_count INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE (feed_id, uid)
);

-- jobs テーブル拡張
ALTER TABLE jobs ADD COLUMN source TEXT NOT NULL DEFAULT 'manual';
ALTER TABLE jobs ADD COLUMN ical_booking_id UUID REFERENCES ical_bookings(id);

-- RLS
ALTER TABLE ical_feeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE ical_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contractor members can read ical_feeds"
  ON ical_feeds FOR SELECT
  USING (contractor_id = my_company_id());

CREATE POLICY "admins can manage ical_feeds"
  ON ical_feeds FOR ALL
  USING (contractor_id = my_company_id() AND my_role() IN ('contractor_admin', 'contractor_vendor'))
  WITH CHECK (contractor_id = my_company_id() AND my_role() IN ('contractor_admin', 'contractor_vendor'));

CREATE POLICY "contractor members can read ical_bookings"
  ON ical_bookings FOR SELECT
  USING (property_id IN (SELECT id FROM properties WHERE contractor_id = my_company_id()));

-- grants
GRANT SELECT ON ical_feeds TO authenticated;
GRANT SELECT ON ical_bookings TO authenticated;
