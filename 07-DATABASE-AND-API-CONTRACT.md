# Database & API Contract

## Content Tables
### dua_import_batches
`id, started_at, completed_at, upstream_url, status, item_count, checksum`

### dua_raw_imports
`id, batch_id, external_id, raw_payload_json, content_hash, received_at`

### dua_items
`id, external_id, title, group_name, arabic, latin, translation_id, source_reference, content_hash, status, import_batch_id, created_at, updated_at, activated_at`

### dua_tags
`id, slug, name`

### dua_item_tags
`dua_id, tag_id`

### dua_chunks
Learning metadata only:
`id, dua_id, sequence, arabic_start, arabic_end, latin_segment, visual_group`

Jangan simpan HTML dalam `arabic`.

## Child/Learning Tables
### child_profiles
`id, parent_user_id, display_name, age_band, reading_level, latin_assistance, show_translation, color_flow_enabled, created_at`

### memorization_plans
`id, child_id, title, status, created_at`

### memorization_items
`id, plan_id, dua_id, sequence, target_date`

### dua_progress
`id, child_id, dua_id, status, confidence, manual_repetitions, hint_count, first_learned_at, last_reviewed_at, next_review_at, updated_at`

### learning_sessions
`id, child_id, mode, started_at, completed_at`

### memorization_attempts
`id, child_id, dua_id, session_id, assessment, hint_count, manual_repetition_count, created_at`

## Public API
### Content
- `GET /api/v1/dua`
- `GET /api/v1/dua/:id`
- `GET /api/v1/dua/groups`
- `GET /api/v1/dua/tags`

Detail response wajib berisi:
```json
{
  "id": "internal-id",
  "externalId": 1,
  "title": "...",
  "arabic": "...",
  "latin": "...",
  "translation": "...",
  "source": "...",
  "group": "...",
  "tags": []
}
```

### Children
- `GET /api/v1/children`
- `POST /api/v1/children`
- `PATCH /api/v1/children/:id`

### Progress
- `GET /api/v1/children/:id/progress`
- `POST /api/v1/learning/sessions`
- `POST /api/v1/learning/repetition`
- `POST /api/v1/learning/hint`
- `POST /api/v1/learning/assessment`

### Review
- `GET /api/v1/children/:id/reviews`
- `POST /api/v1/reviews/:id/complete`

## No Audio API
Tidak ada `/audio`, `/recitation`, atau `/pronunciation` pada MVP.
