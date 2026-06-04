-- ─────────────────────────────────────────────────────────────────────────────
-- LetLoyal Production — Seed Data
-- Run on VPS: mysql -u root -pLetloyal@2026 letloyal_prod < db/seed.sql
--
-- Passwords (bcrypt $2b$12$...):
--   Admin   (jaison650@gmail.com)  → Admin@LetLoyal2026
--   Merchant (demo@letloyal.com)   → Demo@1234
--
-- NOTE: bcrypt hashes below were generated with cost=12.
-- Change passwords after first login via the reset flow.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Admin user ────────────────────────────────────────────────────────────────
INSERT INTO admin_users (id, email, password_hash, name, role)
VALUES (
  UUID(),
  'jaison650@gmail.com',
  '$2a$12$j8SrOzzhvtXPTyRNZZYSZu8agxxS2E.gzoiKrNvSFkzFYaU8qsPcq',
  'Jaison',
  'superadmin'
)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  role = VALUES(role);

-- ── Test merchant ─────────────────────────────────────────────────────────────
INSERT INTO merchants (id, slug, business_name, email, password_hash, speed_dials, status)
VALUES (
  UUID(),
  'demo-shop',
  'Demo Shop',
  'demo@letloyal.com',
  '$2a$12$HnmB87uyUlqVzS5b6na2Ge/q2c7fMceg.wzjpOcwBjCSeosqnqKKm',
  JSON_ARRAY(100, 200, 500, 1000),
  'active'
)
ON DUPLICATE KEY UPDATE
  business_name = VALUES(business_name),
  speed_dials   = VALUES(speed_dials),
  status        = VALUES(status);

-- ── Test campaign (visit-based, 10 stamps → Free item) ───────────────────────
INSERT INTO campaigns (id, merchant_id, name, campaign_type, status, reward_threshold, reward_description)
SELECT
  UUID(),
  m.id,
  'Starter Stamps',
  'visit_based',
  'active',
  10,
  'Free item on your 10th visit!'
FROM merchants m
WHERE m.slug = 'demo-shop'
  AND NOT EXISTS (
    SELECT 1 FROM campaigns c
    WHERE c.merchant_id = m.id AND c.status = 'active'
  );

-- ── Verify ────────────────────────────────────────────────────────────────────
SELECT 'Merchants:' AS '';
SELECT slug, business_name, email, status FROM merchants;

SELECT 'Admins:' AS '';
SELECT email, name, role FROM admin_users;

SELECT 'Campaigns:' AS '';
SELECT c.name, c.campaign_type, c.status, c.reward_threshold, c.reward_description
FROM campaigns c
JOIN merchants m ON c.merchant_id = m.id;
