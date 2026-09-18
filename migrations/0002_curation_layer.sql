CREATE TABLE dua_curation (
  dua_id UUID PRIMARY KEY REFERENCES dua_items(id) ON DELETE CASCADE,
  audience TEXT NOT NULL CHECK (audience IN ('KIDS', 'FAMILY', 'ADULT')),
  chapter TEXT NOT NULL CHECK (BTRIM(chapter) <> ''),
  chapter_order INTEGER NOT NULL CHECK (chapter_order >= 0),
  difficulty SMALLINT NOT NULL CHECK (difficulty BETWEEN 1 AND 3),
  display_order INTEGER NOT NULL CHECK (display_order >= 0),
  curation_rule TEXT NOT NULL CHECK (BTRIM(curation_rule) <> ''),
  curated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX dua_curation_audience_idx ON dua_curation (audience, display_order);
CREATE INDEX dua_curation_chapter_idx ON dua_curation (chapter_order, display_order);
