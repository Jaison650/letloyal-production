-- ─────────────────────────────────────────────────────────────────────────────
-- LetLoyal Production — Full Database Schema
-- MySQL 8.0+ | Charset: utf8mb4 | Engine: InnoDB
-- Run: mysql -h 72.60.18.98 -u letloyal_user -p letloyal < db/schema.sql
-- ─────────────────────────────────────────────────────────────────────────────

SET NAMES utf8mb4;
SET foreign_key_checks = 0;
SET time_zone = '+00:00';

-- ─────────────────────────────────────────────────────────────────────────────
-- M0 migrations — run on existing DB (idempotent via IF NOT EXISTS / IF EXISTS):
-- ALTER TABLE merchants ADD COLUMN website_url VARCHAR(500) NULL AFTER phone;
-- ALTER TABLE merchants ADD COLUMN latitude DECIMAL(10,7) NULL AFTER website_url;
-- ALTER TABLE merchants ADD COLUMN longitude DECIMAL(10,7) NULL AFTER latitude;
-- ALTER TABLE merchants ADD COLUMN plan ENUM('free','starter','pro') NOT NULL DEFAULT 'free' AFTER status;
-- ALTER TABLE merchants ADD COLUMN billing_note TEXT NULL AFTER plan;
-- ALTER TABLE merchants ADD COLUMN email_otp CHAR(6) NULL AFTER billing_note;
-- ALTER TABLE merchants ADD COLUMN email_otp_expires DATETIME NULL AFTER email_otp;
-- ALTER TABLE merchants ADD COLUMN email_verified TINYINT(1) NOT NULL DEFAULT 1 AFTER email_otp_expires; -- DEFAULT 1 grandfathers existing merchants as verified; new registrations set to 0 by register route
-- ALTER TABLE campaigns ADD COLUMN streak_enabled TINYINT(1) NOT NULL DEFAULT 0 AFTER points_per_rupee;
-- ALTER TABLE campaigns ADD COLUMN streak_period ENUM('day','week') NULL AFTER streak_enabled;
-- ALTER TABLE campaigns ADD COLUMN streak_days TINYINT UNSIGNED NULL AFTER streak_period;
-- ALTER TABLE campaigns ADD COLUMN streak_multiplier DECIMAL(3,1) NULL DEFAULT 1.5 AFTER streak_days;
-- ALTER TABLE customers MODIFY COLUMN phone_number VARCHAR(20) NULL;
-- ALTER TABLE customers ADD COLUMN google_id VARCHAR(255) NULL UNIQUE AFTER password_hash;
-- ALTER TABLE customers ADD COLUMN birthday DATE NULL;
-- ALTER TABLE customers ADD COLUMN gender VARCHAR(20) NULL;
-- ALTER TABLE customers ADD CONSTRAINT chk_customers_identity CHECK (phone_number IS NOT NULL OR google_id IS NOT NULL);
-- ALTER TABLE qr_tokens ADD COLUMN item_name VARCHAR(120) NULL AFTER amount_rupees;
-- ALTER TABLE qr_tokens ADD COLUMN quantity INT NOT NULL DEFAULT 1 AFTER item_name;
-- ALTER TABLE campaigns ADD INDEX idx_campaigns_merchant_status (merchant_id, status);
-- ALTER TABLE customer_merchant ADD INDEX idx_cm_merchant_reward (merchant_id, reward_status);
-- ALTER TABLE visits ADD INDEX idx_visits_merchant_created (merchant_id, created_at);
--
-- 2026-07-13 — this file was re-synced to the live prod schema (SHOW CREATE TABLE
-- diff). Known intentional deltas vs prod (schema.sql is the intent, prod pending
-- ALTER approval):
--   * customers: chk_customers_identity CHECK is missing in prod
--   * customer_reset_tokens: UNIQUE on token_hash is missing in prod
-- ─────────────────────────────────────────────────────────────────────────────

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. MERCHANTS — auth + branded profile (flat, no separate profile table)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS merchants (
  id                  VARCHAR(36)               NOT NULL PRIMARY KEY DEFAULT (UUID()),
  slug                VARCHAR(50)               NOT NULL UNIQUE,
  business_name       VARCHAR(120)              NOT NULL,
  email               VARCHAR(255)              NOT NULL UNIQUE,
  phone               VARCHAR(20)               NULL,     -- inserted by register route; legacy but live
  password_hash       VARCHAR(255)              NOT NULL,
  -- Branding (Cloudflare R2 URLs)
  logo_url            VARCHAR(500)              NULL,
  banner_url          VARCHAR(500)              NULL,
  -- Location + social
  address             VARCHAR(300)              NULL,
  website_url         VARCHAR(500)              NULL,
  latitude            DECIMAL(10,7)             NULL,
  longitude           DECIMAL(10,7)             NULL,
  gmaps_url           VARCHAR(500)              NULL,
  instagram_url       VARCHAR(500)              NULL,
  google_review_url   VARCHAR(500)              NULL,
  -- Speed dial / menu presets: JSON array of { name, price, emoji }
  -- (legacy rows may still be plain integers, e.g. [100,200,500,1000] — normalized at read time)
  speed_dials         JSON                      NULL,
  -- Status + plan
  status              ENUM('active','suspended') NOT NULL DEFAULT 'active',
  plan                ENUM('free','starter','pro') NOT NULL DEFAULT 'free',
  billing_note        TEXT                      NULL,
  -- Email OTP verification
  email_otp           CHAR(6)                   NULL,
  email_otp_expires   DATETIME                  NULL,
  email_verified      TINYINT(1)                NOT NULL DEFAULT 1,  -- DEFAULT 1 grandfathers pre-OTP merchants; register route sets 0 explicitly
  created_at          TIMESTAMP                 NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP                 NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_merchants_email  (email),
  INDEX idx_merchants_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. CAMPAIGNS — one active campaign per merchant (schema allows many)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS campaigns (
  id                  VARCHAR(36)                          NOT NULL PRIMARY KEY DEFAULT (UUID()),
  merchant_id         VARCHAR(36)                          NOT NULL,
  name                VARCHAR(120)                         NOT NULL,
  campaign_type       ENUM('visit_based','spend_based')    NOT NULL,
  status              ENUM('active','paused','ended')       NOT NULL DEFAULT 'active',
  reward_threshold    INT                                  NOT NULL,          -- stamps OR points needed
  reward_description  VARCHAR(200)                         NOT NULL,
  points_per_rupee    DECIMAL(10,4)                        NULL,              -- spend_based only (e.g. 0.1 = 1pt/₹10)
  -- Streak bonuses (NOT NULL + defaults: scan route reads these without null guards)
  streak_enabled      TINYINT(1)                           NOT NULL DEFAULT 0,
  streak_period       ENUM('day','week','month')           NOT NULL DEFAULT 'day',
  streak_days         TINYINT                              NOT NULL DEFAULT 3,
  streak_multiplier   DECIMAL(3,1)                         NOT NULL DEFAULT 2.0,
  created_at          TIMESTAMP                            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP                            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE,
  INDEX idx_campaigns_merchant (merchant_id),
  INDEX idx_campaigns_status   (status),
  INDEX idx_campaigns_merchant_status (merchant_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. CUSTOMERS — phone-number identity + optional password for login
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
  id            VARCHAR(36)  NOT NULL PRIMARY KEY DEFAULT (UUID()),
  phone_number  VARCHAR(20)  NULL UNIQUE,
  name          VARCHAR(120) NULL,                    -- optional, captured on first scan
  email         VARCHAR(255) NULL UNIQUE,             -- optional, for password reset
  password_hash VARCHAR(255) NULL,                   -- optional, for password-based login
  google_id     VARCHAR(255) NULL UNIQUE,            -- Google OAuth sub claim
  birthday      DATE         NULL,
  gender        ENUM('male','female','other','prefer_not_to_say') NULL,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_customers_identity CHECK (phone_number IS NOT NULL OR google_id IS NOT NULL),
  INDEX idx_customers_phone (phone_number),
  INDEX idx_customers_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. CUSTOMER_MERCHANT — loyalty relationship per customer + campaign
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customer_merchant (
  id            VARCHAR(36)                          NOT NULL PRIMARY KEY DEFAULT (UUID()),
  customer_id   VARCHAR(36)                          NOT NULL,
  merchant_id   VARCHAR(36)                          NOT NULL,
  campaign_id   VARCHAR(36)                          NOT NULL,
  progress      INT                                  NOT NULL DEFAULT 0,
  cycle_number  INT                                  NOT NULL DEFAULT 1,
  reward_status ENUM('in_progress','unlocked')       NOT NULL DEFAULT 'in_progress',
  last_scan_at  TIMESTAMP                            NULL,
  -- Streak tracking (read/written by /api/scan)
  current_streak   INT                               NOT NULL DEFAULT 0,
  streak_last_date DATE                              NULL,
  created_at    TIMESTAMP                            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP                            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_customer_campaign (customer_id, campaign_id),
  FOREIGN KEY (customer_id) REFERENCES customers(id)  ON DELETE CASCADE,
  FOREIGN KEY (merchant_id) REFERENCES merchants(id)  ON DELETE CASCADE,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id)  ON DELETE CASCADE,
  INDEX idx_cm_merchant (merchant_id),
  INDEX idx_cm_reward   (reward_status),
  INDEX idx_cm_merchant_reward (merchant_id, reward_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. VISITS — append-only audit of every earn event
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS visits (
  id            VARCHAR(36)    NOT NULL PRIMARY KEY DEFAULT (UUID()),
  customer_id   VARCHAR(36)    NOT NULL,
  merchant_id   VARCHAR(36)    NOT NULL,
  campaign_id   VARCHAR(36)    NOT NULL,
  points_added  INT            NOT NULL,
  amount_rupees DECIMAL(10,2)  NULL,                 -- spend_based only
  created_at    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  INDEX idx_visits_merchant  (merchant_id),
  INDEX idx_visits_customer  (customer_id),
  INDEX idx_visits_created   (created_at),
  INDEX idx_visits_merchant_created (merchant_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. REDEMPTIONS — log of confirmed reward redemptions
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS redemptions (
  id           VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  customer_id  VARCHAR(36) NOT NULL,
  merchant_id  VARCHAR(36) NOT NULL,
  campaign_id  VARCHAR(36) NOT NULL,
  cycle_number INT         NOT NULL,
  points_spent INT         NOT NULL,
  redeemed_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  INDEX idx_redemptions_merchant (merchant_id),
  INDEX idx_redemptions_customer (customer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. FEEDBACK — star rating + message, optional anonymity
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS feedback (
  id           VARCHAR(36)  NOT NULL PRIMARY KEY DEFAULT (UUID()),
  merchant_id  VARCHAR(36)  NOT NULL,
  customer_id  VARCHAR(36)  NULL,                    -- null when anonymous
  message      VARCHAR(500) NOT NULL,
  rating       TINYINT      NULL,                    -- 1..5 or null
  is_anonymous BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE,
  INDEX idx_feedback_merchant (merchant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. RESET_TOKENS — merchant password reset via emailed link (15-min TTL)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reset_tokens (
  id          VARCHAR(36)  NOT NULL PRIMARY KEY DEFAULT (UUID()),
  merchant_id VARCHAR(36)  NOT NULL,
  token_hash  VARCHAR(255) NOT NULL UNIQUE,          -- sha256 of emailed token
  expires_at  TIMESTAMP    NOT NULL,
  used_at     TIMESTAMP    NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE,
  INDEX idx_reset_token (token_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. QR_TOKENS — merchant-generated single-use QR tokens
--    Replaces HMAC approach. Each transaction = one token.
--    Expires on scan (status→used) or merchant revoke (status→revoked).
--    Safety expiry: 30 min hard fallback for orphaned tokens.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS qr_tokens (
  id            VARCHAR(36)                          NOT NULL PRIMARY KEY DEFAULT (UUID()),
  token         VARCHAR(64)                          NOT NULL UNIQUE,   -- crypto.randomBytes(32).toString('hex')
  merchant_id   VARCHAR(36)                          NOT NULL,
  campaign_id   VARCHAR(36)                          NOT NULL,
  amount_rupees DECIMAL(10,2)                        NULL,              -- NULL = visit_based
  item_name     VARCHAR(120)                         NULL,              -- set when generated from a single named menu item/cart
  quantity      INT                                  NOT NULL DEFAULT 1,
  status        ENUM('active','used','revoked')       NOT NULL DEFAULT 'active',
  used_at       TIMESTAMP                            NULL,
  revoked_at    TIMESTAMP                            NULL,
  safety_expiry TIMESTAMP                            NOT NULL,          -- created_at + 30 min
  created_at    TIMESTAMP                            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  INDEX idx_qr_token          (token),
  INDEX idx_qr_merchant_active (merchant_id, status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- 10. CUSTOMER_RESET_TOKENS — customer password reset via emailed link (1-hour TTL)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customer_reset_tokens (
  id            VARCHAR(36)  NOT NULL PRIMARY KEY DEFAULT (UUID()),
  customer_id   VARCHAR(36)  NOT NULL,
  token_hash    VARCHAR(255) NOT NULL UNIQUE,          -- sha256 of emailed token
  expires_at    TIMESTAMP    NOT NULL,
  used_at       TIMESTAMP    NULL,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  INDEX idx_customer_reset_token (token_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- 11. ADMIN_USERS — platform admins only (no self-signup)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_users (
  id            VARCHAR(36)                      NOT NULL PRIMARY KEY DEFAULT (UUID()),
  email         VARCHAR(255)                     NOT NULL UNIQUE,
  password_hash VARCHAR(255)                     NOT NULL,
  name          VARCHAR(120)                     NOT NULL,
  role          ENUM('superadmin','staff')        NOT NULL DEFAULT 'superadmin',
  created_at    TIMESTAMP                        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_admin_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- 12. REDEEM_CODES — customer-generated 6-char codes, validated by merchant
--     (see /api/public/redeem-code + /api/merchant/[slug]/validate).
--     No UNIQUE on code: old codes are expired on regeneration; global
--     uniqueness of active codes is an open QA item (DV-3, 2026-07-09 plan).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS redeem_codes (
  id                   VARCHAR(36)  NOT NULL PRIMARY KEY DEFAULT (UUID()),
  customer_merchant_id VARCHAR(36)  NOT NULL,
  merchant_id          VARCHAR(36)  NOT NULL,
  customer_id          VARCHAR(36)  NOT NULL,
  code                 CHAR(6)      NOT NULL,
  status               ENUM('active','used','expired') NOT NULL DEFAULT 'active',
  expires_at           TIMESTAMP    NOT NULL,
  used_at              TIMESTAMP    NULL,
  created_at           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_rc_code     (code),
  INDEX idx_rc_merchant (merchant_id),
  FOREIGN KEY (customer_merchant_id) REFERENCES customer_merchant(id) ON DELETE CASCADE,
  FOREIGN KEY (merchant_id)          REFERENCES merchants(id)         ON DELETE CASCADE,
  FOREIGN KEY (customer_id)          REFERENCES customers(id)         ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- 13. CONSENT_LOG — cookie/privacy consent records per visitor
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS consent_log (
  id            VARCHAR(36)   NOT NULL DEFAULT (UUID()),
  visitor_ref   VARCHAR(100)  NOT NULL,
  categories    JSON          NOT NULL,
  locale        VARCHAR(10)   NOT NULL DEFAULT 'en',
  ip            VARCHAR(45)   NULL,
  user_agent    TEXT          NULL,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_consent_visitor (visitor_ref, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- 14. INSTANT_OFFERS — time-limited offers pushed by merchant
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS instant_offers (
  id              VARCHAR(36)   NOT NULL DEFAULT (UUID()),
  merchant_id     VARCHAR(36)   NOT NULL,
  title           VARCHAR(120)  NOT NULL,
  description     TEXT          NULL,
  valid_until     DATETIME      NOT NULL,
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_offers_merchant_valid (merchant_id, valid_until),
  CONSTRAINT fk_offers_merchant FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- 15. PUSH_SUBSCRIPTIONS — web push registrations (src/lib/webpush.ts,
--     /api/push/subscribe). owner_id = merchant UUID or customer phone digits.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id          VARCHAR(36)                 NOT NULL PRIMARY KEY DEFAULT (UUID()),
  owner_type  ENUM('merchant','customer') NOT NULL,
  owner_id    VARCHAR(36)                 NOT NULL,
  merchant_id VARCHAR(36)                 NULL COMMENT 'For customer subs: which merchant',
  endpoint    TEXT                        NOT NULL,
  p256dh      VARCHAR(512)                NOT NULL,
  auth        VARCHAR(255)                NOT NULL,
  created_at  TIMESTAMP                   NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_owner    (owner_type, owner_id),
  INDEX idx_merchant (merchant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- 16. PUSH_BLASTS — log of merchant push broadcasts (/api/merchant/[slug]/push)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS push_blasts (
  id              VARCHAR(36)  NOT NULL PRIMARY KEY DEFAULT (UUID()),
  merchant_id     VARCHAR(36)  NOT NULL,
  title           VARCHAR(255) NOT NULL,
  body            TEXT         NOT NULL,
  recipient_count INT          NOT NULL DEFAULT 0,
  sent_at         TIMESTAMP    NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_merchant (merchant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET foreign_key_checks = 1;
