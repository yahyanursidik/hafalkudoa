CREATE TABLE dua_import_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  upstream_url TEXT NOT NULL CHECK (BTRIM(upstream_url) <> ''),
  status TEXT NOT NULL CHECK (status IN ('STARTED', 'COMPLETED', 'FAILED')),
  item_count INTEGER NOT NULL DEFAULT 0 CHECK (item_count >= 0),
  checksum TEXT
);

CREATE TABLE dua_raw_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES dua_import_batches(id) ON DELETE RESTRICT,
  external_id TEXT NOT NULL CHECK (BTRIM(external_id) <> ''),
  raw_payload_json JSONB NOT NULL,
  content_hash TEXT NOT NULL CHECK (BTRIM(content_hash) <> ''),
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (batch_id, external_id)
);

CREATE TABLE dua_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT,
  title TEXT,
  group_name TEXT,
  arabic TEXT,
  latin TEXT,
  translation_id TEXT,
  source_reference TEXT,
  content_hash TEXT,
  status TEXT NOT NULL CHECK (status IN ('IMPORTED', 'REVIEW_REQUIRED', 'APPROVED', 'ACTIVE', 'REJECTED')),
  import_batch_id UUID NOT NULL REFERENCES dua_import_batches(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  activated_at TIMESTAMPTZ,
  CONSTRAINT active_dua_requires_complete_content CHECK (
    status <> 'ACTIVE'
    OR (
      external_id IS NOT NULL AND BTRIM(external_id) <> ''
      AND arabic IS NOT NULL AND BTRIM(arabic) <> ''
      AND latin IS NOT NULL AND BTRIM(latin) <> ''
      AND translation_id IS NOT NULL AND BTRIM(translation_id) <> ''
      AND source_reference IS NOT NULL AND BTRIM(source_reference) <> ''
      AND content_hash IS NOT NULL AND BTRIM(content_hash) <> ''
      AND activated_at IS NOT NULL
    )
  ),
  CONSTRAINT dua_arabic_is_not_html CHECK (arabic IS NULL OR arabic !~ '<[^>]+>')
);

CREATE UNIQUE INDEX dua_items_active_external_id_key
  ON dua_items (external_id)
  WHERE status = 'ACTIVE';

CREATE TABLE dua_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE CHECK (BTRIM(slug) <> ''),
  name TEXT NOT NULL CHECK (BTRIM(name) <> '')
);

CREATE TABLE dua_item_tags (
  dua_id UUID NOT NULL REFERENCES dua_items(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES dua_tags(id) ON DELETE RESTRICT,
  PRIMARY KEY (dua_id, tag_id)
);

CREATE TABLE dua_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dua_id UUID NOT NULL REFERENCES dua_items(id) ON DELETE CASCADE,
  sequence INTEGER NOT NULL CHECK (sequence >= 0),
  arabic_start INTEGER NOT NULL CHECK (arabic_start >= 0),
  arabic_end INTEGER NOT NULL CHECK (arabic_end > arabic_start),
  latin_segment TEXT NOT NULL,
  visual_group SMALLINT NOT NULL CHECK (visual_group BETWEEN 1 AND 5),
  UNIQUE (dua_id, sequence)
);

CREATE INDEX dua_raw_imports_external_id_idx ON dua_raw_imports (external_id);
CREATE INDEX dua_items_status_idx ON dua_items (status);
