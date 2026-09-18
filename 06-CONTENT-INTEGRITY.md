# Content Integrity — Doa & Dzikir

## Mandatory Fields
Setiap doa ACTIVE wajib memiliki:
- `arabic`
- `latin`
- `translation_id`
- `source_reference`
- `external_id`
- `content_hash`

## Source Is Mandatory
`source_reference` harus berasal dari response API eQuran/upstream yang sama.

Jangan:
- membuat sumber sendiri
- menebak sumber
- mengubah sumber dengan AI
- menghapus sumber karena UI terlalu penuh

Jika source panjang, UI boleh collapse, tetapi data tetap disimpan.

## Translation
Arti/terjemahan diambil dari eQuran. Jangan paraphrase otomatis atau menulis ulang dengan AI untuk production. Jika kelak ada `child_explanation`, simpan sebagai field terpisah dan review editorial.

## Latin
Latin berasal dari upstream dan diperlakukan sebagai learning aid.

## Arabic
Simpan teks upstream secara utuh. UI chunks tidak boleh mengubah canonical Arabic.

## Raw Payload
Simpan raw payload setiap import untuk audit: batch, external id, received_at, raw JSON, hash.

## Diff Workflow
1. import candidate
2. compare hash
3. produce diff
4. REVIEW_REQUIRED
5. reviewer checks Arabic/Latin/arti/source
6. approve
7. activate

## Review Screen
Reviewer melihat old/new Arabic, Latin, translation, source, group, tags berdampingan.

## No Auto-Activation
Sync boleh fetch tetapi tidak boleh activate perubahan konten agama otomatis.
