/**
 * LetLoyal Production — Database Seed
 * Run: npm run seed
 *
 * Idempotent: safe to run multiple times.
 * Seeds: 1 admin, 1 test merchant (demo-shop), 1 visit-based campaign.
 */

import * as mysql from 'mysql2/promise';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

// ── env ───────────────────────────────────────────────────────────────────────
const DB_HOST     = process.env.DB_HOST     || '72.60.18.98';
const DB_PORT     = parseInt(process.env.DB_PORT || '3306', 10);
const DB_USER     = process.env.DB_USER     || 'letloyal_user';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME     = process.env.DB_NAME     || 'letloyal';

// ── seed data ─────────────────────────────────────────────────────────────────
const ADMIN = {
  email:    'jaison650@gmail.com',
  password: 'Admin@LetLoyal2026',          // change after first login
  name:     'Jaison',
  role:     'superadmin' as const,
};

const MERCHANT = {
  slug:          'demo-shop',
  business_name: 'Demo Shop',
  email:         'demo@letloyal.com',
  password:      'Demo@1234',              // temp password for testing
  speed_dials:   JSON.stringify([100, 200, 500, 1000]),
};

const CAMPAIGN = {
  name:               'Starter Stamps',
  campaign_type:      'visit_based' as const,
  status:             'active' as const,
  reward_threshold:   10,
  reward_description: 'Free item on your 10th visit!',
  points_per_rupee:   null,
};

// ── main ──────────────────────────────────────────────────────────────────────
async function main() {
  const conn = await mysql.createConnection({
    host:     DB_HOST,
    port:     DB_PORT,
    user:     DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
  });

  console.log('Connected to MySQL at', DB_HOST);

  try {
    // ── Admin ──────────────────────────────────────────────────────────────
    const adminHash = await bcrypt.hash(ADMIN.password, 12);
    const adminId   = crypto.randomUUID();

    await conn.execute(
      `INSERT INTO admin_users (id, email, password_hash, name, role)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         password_hash = VALUES(password_hash),
         name          = VALUES(name),
         role          = VALUES(role)`,
      [adminId, ADMIN.email, adminHash, ADMIN.name, ADMIN.role],
    );
    console.log('✓ Admin upserted:', ADMIN.email);

    // ── Merchant ───────────────────────────────────────────────────────────
    const merchantHash = await bcrypt.hash(MERCHANT.password, 12);
    const merchantId   = crypto.randomUUID();

    await conn.execute(
      `INSERT INTO merchants (id, slug, business_name, email, password_hash, speed_dials)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         business_name = VALUES(business_name),
         password_hash = VALUES(password_hash),
         speed_dials   = VALUES(speed_dials)`,
      [
        merchantId,
        MERCHANT.slug,
        MERCHANT.business_name,
        MERCHANT.email,
        merchantHash,
        MERCHANT.speed_dials,
      ],
    );
    console.log('✓ Merchant upserted:', MERCHANT.slug);

    // Fetch actual merchant id (may differ if row already existed)
    const [rows] = await conn.execute<mysql.RowDataPacket[]>(
      'SELECT id FROM merchants WHERE slug = ?',
      [MERCHANT.slug],
    );
    const realMerchantId = rows[0].id as string;

    // ── Campaign ───────────────────────────────────────────────────────────
    // Check if an active campaign already exists for this merchant
    const [existing] = await conn.execute<mysql.RowDataPacket[]>(
      `SELECT id FROM campaigns
       WHERE merchant_id = ? AND status = 'active'
       LIMIT 1`,
      [realMerchantId],
    );

    if (existing.length === 0) {
      const campaignId = crypto.randomUUID();
      await conn.execute(
        `INSERT INTO campaigns
           (id, merchant_id, name, campaign_type, status, reward_threshold, reward_description, points_per_rupee)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          campaignId,
          realMerchantId,
          CAMPAIGN.name,
          CAMPAIGN.campaign_type,
          CAMPAIGN.status,
          CAMPAIGN.reward_threshold,
          CAMPAIGN.reward_description,
          CAMPAIGN.points_per_rupee,
        ],
      );
      console.log('✓ Campaign created:', CAMPAIGN.name);
    } else {
      console.log('✓ Campaign already exists — skipped');
    }

    // ── Verify ─────────────────────────────────────────────────────────────
    console.log('\n── Verification ─────────────────────────────────────');
    const [merchants] = await conn.execute<mysql.RowDataPacket[]>(
      'SELECT slug, business_name, email FROM merchants',
    );
    console.log('Merchants:', merchants);

    const [admins] = await conn.execute<mysql.RowDataPacket[]>(
      'SELECT email, role FROM admin_users',
    );
    console.log('Admins:', admins);

    const [campaigns] = await conn.execute<mysql.RowDataPacket[]>(
      'SELECT name, campaign_type, status, reward_threshold FROM campaigns',
    );
    console.log('Campaigns:', campaigns);

    console.log('\n✅ Seed complete.');
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
