ALTER TABLE user_content
  ADD COLUMN highlight_style TEXT NOT NULL DEFAULT 'highlight'
  CHECK(highlight_style IN ('highlight', 'underline'));
