/**
 * LetLoyal Production — Demo Merchant Seed
 * Run: npm run seed:demo
 *
 * Idempotent per-merchant: if a merchant's slug already has customers seeded,
 * that merchant is skipped entirely (safe to re-run without duplicating data).
 *
 * Seeds two fully-populated demo merchants for sales/investor demos:
 *   - "Spice Junction" (restaurant, spend_based) — 32 customers
 *   - "ShinePro Car Wash" (car wash, visit_based) — 32 customers
 * Each gets a campaign, named menu/service items, realistic customer spread
 * (loyal repeats, near-reward, one-time, inactive), visit history, a few
 * redemptions, and merchant feedback.
 */

import * as mysql from 'mysql2/promise';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

// ── env ─────────────────────────────────────────────────────────────────────
const DB_HOST     = process.env.DB_HOST     || '72.60.18.98';
const DB_PORT      = parseInt(process.env.DB_PORT || '3306', 10);
const DB_USER      = process.env.DB_USER     || 'letloyal_user';
const DB_PASSWORD  = process.env.DB_PASSWORD || '';
const DB_NAME      = process.env.DB_NAME     || 'letloyal_prod';

const DEMO_PASSWORD = 'Demo@1234';

// ── name pool (Indian names, mixed gender) ───────────────────────────────────
const NAMES: { name: string; gender: 'male' | 'female' }[] = [
  { name: 'Rahul Sharma',      gender: 'male'   },
  { name: 'Priya Patel',       gender: 'female' },
  { name: 'Amit Kumar',        gender: 'male'   },
  { name: 'Sneha Reddy',       gender: 'female' },
  { name: 'Vikram Singh',      gender: 'male'   },
  { name: 'Ananya Iyer',       gender: 'female' },
  { name: 'Arjun Nair',        gender: 'male'   },
  { name: 'Divya Menon',       gender: 'female' },
  { name: 'Karan Gupta',       gender: 'male'   },
  { name: 'Pooja Verma',       gender: 'female' },
  { name: 'Rohan Joshi',       gender: 'male'   },
  { name: 'Kavya Rao',         gender: 'female' },
  { name: 'Siddharth Malhotra',gender: 'male'   },
  { name: 'Neha Agarwal',      gender: 'female' },
  { name: 'Aditya Chopra',     gender: 'male'   },
  { name: 'Ritika Bose',       gender: 'female' },
  { name: 'Manish Yadav',      gender: 'male'   },
  { name: 'Shreya Desai',      gender: 'female' },
  { name: 'Sanjay Mehta',      gender: 'male'   },
  { name: 'Isha Kapoor',       gender: 'female' },
  { name: 'Varun Chauhan',     gender: 'male'   },
  { name: 'Meera Pillai',      gender: 'female' },
  { name: 'Nikhil Bansal',     gender: 'male'   },
  { name: 'Anjali Krishnan',   gender: 'female' },
  { name: 'Deepak Rana',       gender: 'male'   },
  { name: 'Swati Chatterjee',  gender: 'female' },
  { name: 'Harsh Trivedi',     gender: 'male'   },
  { name: 'Nisha Das',         gender: 'female' },
  { name: 'Gaurav Saxena',     gender: 'male'   },
  { name: 'Tanvi Bhatt',       gender: 'female' },
  { name: 'Rajesh Pandey',     gender: 'male'   },
  { name: 'Sakshi Mishra',     gender: 'female' },
];

// ── helpers ───────────────────────────────────────────────────────────────
function daysAgo(n: number, hourJitter = true): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  if (hourJitter) d.setHours(9 + Math.floor(Math.random() * 11), Math.floor(Math.random() * 60), 0, 0);
  return d;
}
function randomBirthday(minAge: number, maxAge: number, biasNear = false): Date {
  const age = minAge + Math.floor(Math.random() * (maxAge - minAge + 1));
  const today = new Date();
  const year  = today.getFullYear() - age;
  const dayOffset = biasNear ? Math.floor(Math.random() * 25) : Math.floor(Math.random() * 365);
  const base  = biasNear ? new Date(today.getTime() + dayOffset * 86400000) : new Date(year, 0, 1 + dayOffset);
  return new Date(year, base.getMonth(), base.getDate());
}
function toSqlDate(d: Date): string {
  return d.toISOString().slice(0, 19).replace('T', ' ');
}
function toSqlDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

interface CampaignSpec {
  name: string;
  campaign_type: 'visit_based' | 'spend_based';
  reward_threshold: number;
  reward_description: string;
  points_per_rupee: number | null;
}

interface MerchantSpec {
  slug: string;
  business_name: string;
  email: string;
  address: string;
  phonePrefix: string; // 7-digit prefix + 2-digit customer index → 9-digit unique number
  menu: { name: string; price: number; emoji: string }[];
  campaign: CampaignSpec;
  feedback: { message: string; rating: number | null; anonymous: boolean }[];
}

const RESTAURANT: MerchantSpec = {
  slug: 'spice-junction',
  business_name: 'Spice Junction',
  email: 'demo.restaurant@letloyal.in',
  address: '12 MG Road, Bengaluru, Karnataka 560001',
  phonePrefix: '90000000',
  menu: [
    { name: 'Butter Chicken',   price: 320, emoji: '🍛' },
    { name: 'Paneer Tikka',     price: 280, emoji: '🧀' },
    { name: 'Chicken Biryani',  price: 260, emoji: '🍚' },
    { name: 'Masala Dosa',      price: 150, emoji: '🥞' },
    { name: 'Gulab Jamun',      price: 80,  emoji: '🍬' },
    { name: 'Filter Coffee',    price: 40,  emoji: '☕' },
  ],
  campaign: {
    name: 'Spice Junction Rewards',
    campaign_type: 'spend_based',
    reward_threshold: 2000,
    reward_description: '₹200 off your next order!',
    points_per_rupee: 1,
  },
  feedback: [
    { message: 'Butter chicken was amazing, best in the area!', rating: 5, anonymous: false },
    { message: 'Great service, food came out hot and fresh.', rating: 5, anonymous: false },
    { message: 'Good food but the wait was a bit long on weekends.', rating: 4, anonymous: true },
    { message: 'Loved the filter coffee, will be back for sure.', rating: 5, anonymous: false },
    { message: 'Biryani portion could be bigger for the price.', rating: 3, anonymous: true },
    { message: 'Staff were very friendly and helpful.', rating: 4, anonymous: false },
  ],
};

const CARWASH: MerchantSpec = {
  slug: 'shinepro-car-wash',
  business_name: 'ShinePro Car Wash',
  email: 'demo.carwash@letloyal.in',
  address: '45 Ring Road, Pune, Maharashtra 411001',
  phonePrefix: '90000001',
  menu: [
    { name: 'Basic Wash',        price: 150, emoji: '🚿' },
    { name: 'Premium Wash',      price: 300, emoji: '🧼' },
    { name: 'Interior Vacuum',   price: 100, emoji: '🧹' },
    { name: 'Wax Polish',        price: 250, emoji: '✨' },
    { name: 'Full Detailing',    price: 800, emoji: '🚗' },
    { name: 'Tyre Shine',        price: 80,  emoji: '🛞' },
  ],
  campaign: {
    name: 'ShinePro Loyalty',
    campaign_type: 'visit_based',
    reward_threshold: 6,
    reward_description: 'Your 6th wash is FREE!',
    points_per_rupee: null,
  },
  feedback: [
    { message: 'Car looked brand new after the full detailing package.', rating: 5, anonymous: false },
    { message: 'Quick service, in and out in 30 minutes.', rating: 5, anonymous: false },
    { message: 'Good wash but interior vacuum missed a few spots.', rating: 3, anonymous: true },
    { message: 'Been coming here for months, always consistent quality.', rating: 5, anonymous: false },
    { message: 'Reasonable pricing compared to nearby places.', rating: 4, anonymous: true },
    { message: 'Wax polish gave a really nice shine, worth it.', rating: 4, anonymous: false },
  ],
};

async function seedMerchant(conn: mysql.Connection, spec: MerchantSpec) {
  // ── Merchant ────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const merchantId   = crypto.randomUUID();
  const speedDials   = JSON.stringify(spec.menu);

  await conn.execute(
    `INSERT INTO merchants (id, slug, business_name, email, password_hash, address, speed_dials, status, email_verified)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'active', 1)
     ON DUPLICATE KEY UPDATE
       business_name = VALUES(business_name),
       password_hash = VALUES(password_hash),
       address       = VALUES(address),
       speed_dials   = VALUES(speed_dials)`,
    [merchantId, spec.slug, spec.business_name, spec.email, passwordHash, spec.address, speedDials],
  );

  const [merchantRows] = await conn.execute<mysql.RowDataPacket[]>(
    'SELECT id FROM merchants WHERE slug = ?', [spec.slug],
  );
  const mId = merchantRows[0].id as string;
  console.log(`✓ Merchant upserted: ${spec.slug} (${mId})`);

  // ── Skip customer seeding if already done ──────────────────────────────
  const [existingCustomers] = await conn.execute<mysql.RowDataPacket[]>(
    'SELECT COUNT(*) AS cnt FROM customer_merchant WHERE merchant_id = ?', [mId],
  );
  if (Number(existingCustomers[0].cnt) > 0) {
    console.log(`  → ${spec.slug} already has customers seeded — skipping customer/visit generation.`);
    return;
  }

  // ── Campaign ────────────────────────────────────────────────────────────
  const [existingCampaign] = await conn.execute<mysql.RowDataPacket[]>(
    `SELECT id FROM campaigns WHERE merchant_id = ? AND status = 'active' LIMIT 1`, [mId],
  );
  let campaignId: string;
  if (existingCampaign.length === 0) {
    campaignId = crypto.randomUUID();
    await conn.execute(
      `INSERT INTO campaigns (id, merchant_id, name, campaign_type, status, reward_threshold, reward_description, points_per_rupee)
       VALUES (?, ?, ?, ?, 'active', ?, ?, ?)`,
      [campaignId, mId, spec.campaign.name, spec.campaign.campaign_type, spec.campaign.reward_threshold,
       spec.campaign.reward_description, spec.campaign.points_per_rupee],
    );
    console.log(`✓ Campaign created: ${spec.campaign.name}`);
  } else {
    campaignId = existingCampaign[0].id as string;
    console.log('  → Active campaign already exists — reusing it.');
  }

  const isSpend = spec.campaign.campaign_type === 'spend_based';
  const threshold = spec.campaign.reward_threshold;
  const pointsPerRupee = spec.campaign.points_per_rupee ?? 1;

  // ── Customer distribution across 32 customers ──────────────────────────
  // 3 unlocked (ready to redeem) · 5 close to reward · 8 one-time visitors
  // 6 inactive (21+ days) · 4 loyal repeats (cycle 2+) · 6 mid-range random
  type Band = 'unlocked' | 'close' | 'one_time' | 'inactive' | 'loyal' | 'mid';
  const bands: Band[] = [
    ...Array(3).fill('unlocked'),
    ...Array(5).fill('close'),
    ...Array(8).fill('one_time'),
    ...Array(6).fill('inactive'),
    ...Array(4).fill('loyal'),
    ...Array(6).fill('mid'),
  ];

  for (let i = 0; i < 32; i++) {
    const band = bands[i];
    const person = NAMES[i % NAMES.length];
    const phone = `${spec.phonePrefix}${String(i + 1).padStart(2, '0')}`;
    const customerId = crypto.randomUUID();

    const birthday = Math.random() < 0.7
      ? randomBirthday(20, 55, i < 4) // first few get near-future birthdays for the "upcoming birthdays" widget
      : null;
    const gender = Math.random() < 0.05 ? 'other' : person.gender;

    await conn.execute(
      `INSERT INTO customers (id, phone_number, name, gender, birthday)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name)`,
      [customerId, phone, person.name, gender, birthday ? toSqlDay(birthday) : null],
    );
    const [custRow] = await conn.execute<mysql.RowDataPacket[]>(
      'SELECT id FROM customers WHERE phone_number = ?', [phone],
    );
    const cId = custRow[0].id as string;

    // ── Determine progress / cycle / recency per band ───────────────────
    let progress: number, cycleNumber = 1, rewardStatus: 'in_progress' | 'unlocked' = 'in_progress';
    let lastScanDaysAgo: number;
    let visitCount: number;

    switch (band) {
      case 'unlocked':
        progress = threshold; rewardStatus = 'unlocked';
        lastScanDaysAgo = Math.floor(Math.random() * 3);
        visitCount = isSpend ? 6 + Math.floor(Math.random() * 3) : threshold;
        break;
      case 'close':
        progress = Math.floor(threshold * (0.78 + Math.random() * 0.18));
        lastScanDaysAgo = Math.floor(Math.random() * 5);
        visitCount = isSpend ? 4 + Math.floor(Math.random() * 3) : progress;
        break;
      case 'one_time':
        progress = isSpend ? Math.floor(threshold * (0.05 + Math.random() * 0.1)) : 1;
        lastScanDaysAgo = 3 + Math.floor(Math.random() * 15);
        visitCount = 1;
        break;
      case 'inactive':
        progress = Math.floor(threshold * (0.2 + Math.random() * 0.4));
        lastScanDaysAgo = 25 + Math.floor(Math.random() * 30);
        visitCount = 2 + Math.floor(Math.random() * 2);
        break;
      case 'loyal':
        cycleNumber = 2 + Math.floor(Math.random() * 2);
        progress = Math.floor(threshold * (0.3 + Math.random() * 0.5));
        lastScanDaysAgo = Math.floor(Math.random() * 7);
        visitCount = isSpend ? 8 + Math.floor(Math.random() * 5) : threshold * (cycleNumber - 1) + progress;
        break;
      default: // mid
        progress = Math.floor(threshold * (0.3 + Math.random() * 0.4));
        lastScanDaysAgo = 1 + Math.floor(Math.random() * 10);
        visitCount = isSpend ? 3 + Math.floor(Math.random() * 3) : progress;
    }

    await conn.execute(
      `INSERT INTO customer_merchant (id, customer_id, merchant_id, campaign_id, progress, cycle_number, reward_status, last_scan_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [crypto.randomUUID(), cId, mId, campaignId, progress, cycleNumber, rewardStatus, toSqlDate(daysAgo(lastScanDaysAgo))],
    );

    // ── Visit history (spread from oldest to lastScanDaysAgo) ───────────
    for (let v = 0; v < visitCount; v++) {
      const spread = visitCount === 1 ? lastScanDaysAgo : Math.round(lastScanDaysAgo + (v * (60 - lastScanDaysAgo)) / visitCount);
      const visitDate = v === visitCount - 1 ? daysAgo(lastScanDaysAgo) : daysAgo(Math.min(spread, 60));
      const menuItem = spec.menu[Math.floor(Math.random() * spec.menu.length)];
      const amount = isSpend ? menuItem.price + Math.floor(Math.random() * 100) : null;
      const pointsAdded = isSpend ? Math.round((amount ?? 0) * pointsPerRupee) : 1;

      await conn.execute(
        `INSERT INTO visits (id, customer_id, merchant_id, campaign_id, points_added, amount_rupees, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [crypto.randomUUID(), cId, mId, campaignId, pointsAdded, amount, toSqlDate(visitDate)],
      );
    }

    // ── Redemption for completed prior cycles (loyal customers) ─────────
    if (cycleNumber > 1) {
      for (let c = 1; c < cycleNumber; c++) {
        await conn.execute(
          `INSERT INTO redemptions (id, customer_id, merchant_id, campaign_id, cycle_number, points_spent, redeemed_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [crypto.randomUUID(), cId, mId, campaignId, c, threshold, toSqlDate(daysAgo(lastScanDaysAgo + 20 * (cycleNumber - c)))],
        );
      }
    }
  }
  console.log(`✓ Seeded 32 customers + visit history for ${spec.slug}`);

  // ── A couple of "today" visits so the dashboard's scans-today isn't 0 ──
  const [anyCustomer] = await conn.execute<mysql.RowDataPacket[]>(
    'SELECT customer_id FROM customer_merchant WHERE merchant_id = ? LIMIT 3', [mId],
  );
  for (const row of anyCustomer as { customer_id: string }[]) {
    const menuItem = spec.menu[Math.floor(Math.random() * spec.menu.length)];
    const amount = isSpend ? menuItem.price : null;
    await conn.execute(
      `INSERT INTO visits (id, customer_id, merchant_id, campaign_id, points_added, amount_rupees, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [crypto.randomUUID(), row.customer_id, mId, campaignId, isSpend ? Math.round((amount ?? 0) * pointsPerRupee) : 1, amount],
    );
  }

  // ── Feedback ─────────────────────────────────────────────────────────
  const [feedbackCustomers] = await conn.execute<mysql.RowDataPacket[]>(
    'SELECT customer_id FROM customer_merchant WHERE merchant_id = ? LIMIT ?',
    [mId, spec.feedback.length],
  );
  const fbCustomers = feedbackCustomers as { customer_id: string }[];
  for (let i = 0; i < spec.feedback.length; i++) {
    const fb = spec.feedback[i];
    const custId = fbCustomers[i % fbCustomers.length]?.customer_id ?? null;
    await conn.execute(
      `INSERT INTO feedback (id, merchant_id, customer_id, message, rating, is_anonymous, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [crypto.randomUUID(), mId, fb.anonymous ? null : custId, fb.message, fb.rating, fb.anonymous, toSqlDate(daysAgo(Math.floor(Math.random() * 20)))],
    );
  }
  console.log(`✓ Seeded ${spec.feedback.length} feedback entries for ${spec.slug}`);
}

async function main() {
  const conn = await mysql.createConnection({
    host: DB_HOST, port: DB_PORT, user: DB_USER, password: DB_PASSWORD, database: DB_NAME,
  });
  console.log('Connected to MySQL at', DB_HOST);

  try {
    await seedMerchant(conn, RESTAURANT);
    await seedMerchant(conn, CARWASH);

    console.log('\n── Login credentials (all demo accounts) ────────────');
    console.log(`Restaurant : ${RESTAURANT.email} / ${DEMO_PASSWORD}  (slug: ${RESTAURANT.slug})`);
    console.log(`Car wash   : ${CARWASH.email} / ${DEMO_PASSWORD}  (slug: ${CARWASH.slug})`);
    console.log('\n✅ Demo seed complete.');
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error('❌ Demo seed failed:', err);
  process.exit(1);
});
