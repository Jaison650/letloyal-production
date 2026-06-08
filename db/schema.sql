-- ─────────────────────────────────────────────────────────────────────────────
-- LetLoyal Production — Full Database Schema
-- MySQL 8.0+ | Charset: utf8mb4 | Engine: InnoDB
-- Run: mysql -h 72.60.18.98 -u letloyal_user -p letloyal < db/schema.sql
-- ─────────────────────────────────────────────────────────────────────────────

SET NAMES utf8mb4;
SET foreign_key_checks = 0;
SET time_zone = '+00:00';

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. MERCHANTS — auth + branded profile (flat, no separate profile table)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS merchants (
  id                  VARCHAR(36)               NOT NULL PRIMARY KEY DEFAULT (UUID()),
  slug                VARCHAR(50)               NOT NULL UNIQUE,
  business_name       VARCHAR(120)              NOT NULL,
  email               VARCHAR(255)              NOT NULL UNIQUE,
  password_hash       VARCHAR(255)              NOT NULL,
  -- Branding (Cloudflare R2 URLs)
  logo_url            VARCHAR(500)              NULL,
  banner_url          VARCHAR(500)              NULL,
  -- Location + social
  address             VARCHAR(300)              NULL,
  gmaps_url           VARCHAR(500)              NULL,
  instagram_url       VARCHAR(500)              NULL,
  google_review_url   VARCHAR(500)              NULL,
  -- Speed dial presets (JSON array of ₹ integers, e.g. [100,200,500,1000])
  speed_dials         JSON                      NULL,
  -- Status
  status              ENUM('active','suspended') NOT NULL DEFAULT 'active',
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
  created_at          TIMESTAMP                            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP                            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE,
  INDEX idx_campaigns_merchant (merchant_id),
  INDEX idx_campaigns_status   (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. CUSTOMERS — phone-number identity + optional password for login
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
  id           VARCHAR(36)  NOT NULL PRIMARY KEY DEFAULT (UUID()),
  phone_number VARCHAR(20)  NOT NULL UNIQUE,
  name         VARCHAR(120) NULL,                    -- optional, captured on first scan
  email        VARCHAR(255) NULL UNIQUE,             -- optional, for password reset
  password_hash VARCHAR(255) NULL,                   -- optional, for password-based login
  created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
  created_at    TIMESTAMP                            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP                            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_customer_campaign (customer_id, campaign_id),
  FOREIGN KEY (customer_id) REFERENCES customers(id)  ON DELETE CASCADE,
  FOREIGN KEY (merchant_id) REFERENCES merchants(id)  ON DELETE CASCADE,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id)  ON DELETE CASCADE,
  INDEX idx_cm_merchant (merchant_id),
  INDEX idx_cm_reward   (reward_status)
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
  INDEX idx_visits_created   (created_at)
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

SET foreign_key_checks = 1;
