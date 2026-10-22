#!/usr/bin/env node
/**
 * Seed demo patients, intakes, vitals, summaries, doctor reviews, and audit rows.
 * Encrypts PII through the same AES-256-GCM helper the live app uses.
 *
 * Prerequisites:
 *   - MySQL is up and schema.sql has been applied
 *   - .env has real JWT_SECRET and ENCRYPTION_KEY (not the placeholders)
 *
 * Usage:
 *   node scripts/seed-demo-data.js
 *   # or inside Docker:
 *   docker compose exec app node scripts/seed-demo-data.js
 *
 * Safe to re-run: uses deterministic patient_code values and ON DUPLICATE KEY UPDATE.
 */
require('dotenv').config();
const crypto = require('crypto');
const pool = require('../db');
const { encrypt, sha256Hex } = require('../lib/crypto-util');

const DEMOS = [
  {
    patientCode: 'DEMO-1001',
    fullName: 'Anita Sharma',
    mobile: '+91-98765-43210',
    preferredLanguage: 'Hindi',
    consent: 'granted',
    chiefComplaint: 'Persistent cough and mild fever for 5 days',
    duration: '5 days',
    vitals: { temperature: '100.2°F', bloodPressure: '118/76', weight: '58 kg', heartRate: '88 bpm' },
    reviewStatus: 'pending'
  },
  {
    patientCode: 'DEMO-1002',
    fullName: 'Rahul Verma',
    mobile: '+91-91234-56789',
    preferredLanguage: 'English',
    consent: 'granted',
    chiefComplaint: 'Lower back pain radiating to left leg, worse in the morning',
    duration: '2 weeks',
    vitals: { temperature: '98.4°F', bloodPressure: '124/80', weight: '72 kg', heartRate: '76 bpm' },
    reviewStatus: 'in_review'
  },
  {
    patientCode: 'DEMO-1003',
    fullName: 'Fatima Khan',
    mobile: '+91-99887-76655',
    preferredLanguage: 'English',
    consent: 'granted',
    chiefComplaint: 'Intermittent headaches with sensitivity to light',
    duration: '10 days',
    vitals: { temperature: '98.6°F', bloodPressure: '110/70', weight: '55 kg', heartRate: '72 bpm' },
    reviewStatus: 'approved'
  },
  {
    patientCode: 'DEMO-1004',
    fullName: 'Suresh Patel',
    mobile: '+91-90011-22334',
    preferredLanguage: 'Gujarati',
    consent: 'pending',
    chiefComplaint: 'Occasional chest discomfort after climbing stairs',
    duration: '3 days',
    vitals: { temperature: '98.2°F', bloodPressure: '132/84', weight: '81 kg', heartRate: '82 bpm' },
    reviewStatus: null // no review until consent
  }
];

async function upsertPatient(demo) {
  const sessionToken = crypto.randomBytes(32).toString('base64url');
  const tokenHash = sha256Hex(sessionToken);

  const [existing] = await pool.execute(
    'SELECT id FROM patients WHERE patient_code = ?',
    [demo.patientCode]
  );

  let patientId;
  if (existing.length) {
    patientId = existing[0].id;
    await pool.execute(
      `UPDATE patients SET
         full_name = ?, mobile = ?, preferred_language = ?,
         consent_status = ?, consent_at = IF(? = 'granted', COALESCE(consent_at, NOW()), NULL),
         session_token_hash = ?
       WHERE id = ?`,
      [
        encrypt(demo.fullName),
        encrypt(demo.mobile),
        demo.preferredLanguage,
        demo.consent,
        demo.consent,
        tokenHash,
        patientId
      ]
    );
  } else {
    const [result] = await pool.execute(
      `INSERT INTO patients
         (patient_code, full_name, mobile, preferred_language, consent_status, consent_at, session_token_hash)
       VALUES (?, ?, ?, ?, ?, IF(? = 'granted', NOW(), NULL), ?)`,
      [
        demo.patientCode,
        encrypt(demo.fullName),
        encrypt(demo.mobile),
        demo.preferredLanguage,
        demo.consent,
        demo.consent,
        tokenHash
      ]
    );
    patientId = result.insertId;
  }

  return { patientId, sessionToken };
}

async function ensureIntake(patientId, demo) {
  const [rows] = await pool.execute(
    'SELECT id FROM intakes WHERE patient_id = ? AND chief_complaint = ? LIMIT 1',
    [patientId, demo.chiefComplaint]
  );
  if (rows.length) return rows[0].id;

  const status = demo.reviewStatus ? 'doctor_review' : 'submitted';
  const [result] = await pool.execute(
    'INSERT INTO intakes (patient_id, chief_complaint, duration, status) VALUES (?, ?, ?, ?)',
    [patientId, demo.chiefComplaint, demo.duration, status]
  );
  const intakeId = result.insertId;

  await pool.execute(
    `INSERT INTO summaries (intake_id, chief_complaint, symptoms_text, vitals_text, ai_status, confidence)
     VALUES (?, ?, ?, ?, 'draft', 0.78)`,
    [
      intakeId,
      demo.chiefComplaint,
      demo.chiefComplaint,
      `Temp ${demo.vitals.temperature}, BP ${demo.vitals.bloodPressure}, HR ${demo.vitals.heartRate}, Wt ${demo.vitals.weight}`
    ]
  );

  await pool.execute(
    'INSERT INTO vitals (intake_id, temperature, blood_pressure, weight, heart_rate) VALUES (?, ?, ?, ?, ?)',
    [intakeId, demo.vitals.temperature, demo.vitals.bloodPressure, demo.vitals.weight, demo.vitals.heartRate]
  );

  return intakeId;
}

async function ensureReview(intakeId, status) {
  if (!status) return;
  const [rows] = await pool.execute(
    'SELECT id FROM doctor_reviews WHERE intake_id = ? LIMIT 1',
    [intakeId]
  );
  if (rows.length) {
    await pool.execute(
      'UPDATE doctor_reviews SET status = ?, reviewed_at = IF(? IN ("approved","rejected"), COALESCE(reviewed_at, NOW()), reviewed_at) WHERE id = ?',
      [status, status, rows[0].id]
    );
    return;
  }
  await pool.execute(
    'INSERT INTO doctor_reviews (intake_id, status, reviewed_at) VALUES (?, ?, IF(? IN ("approved","rejected"), NOW(), NULL))',
    [intakeId, status, status]
  );
}

async function audit(patientId, intakeId, action) {
  await pool.execute(
    'INSERT INTO audit_logs (patient_id, intake_id, action, actor_type, actor_id, ip_address) VALUES (?, ?, ?, "system", NULL, "127.0.0.1")',
    [patientId, intakeId, action]
  );
}

async function main() {
  // Fail fast if secrets are still placeholders (same guard as server.js)
  for (const name of ['ENCRYPTION_KEY']) {
    const val = process.env[name];
    if (!val || val.startsWith('change_me')) {
      console.error(`FATAL: ${name} is not configured. Set a real secret in .env first.`);
      process.exit(1);
    }
  }

  console.log('Seeding demo data (encrypted PII)...\n');

  for (const demo of DEMOS) {
    const { patientId, sessionToken } = await upsertPatient(demo);
    const intakeId = await ensureIntake(patientId, demo);
    await ensureReview(intakeId, demo.reviewStatus);
    await audit(patientId, intakeId, 'DEMO_SEEDED');

    console.log(`✓ ${demo.patientCode}  →  patient_id=${patientId}, intake_id=${intakeId}, review=${demo.reviewStatus || 'none'}`);
    console.log(`  (demo session token for API tests — not stored in plaintext in DB): ${sessionToken.slice(0, 12)}…`);
  }

  const [[stats]] = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM patients) AS patients,
      (SELECT COUNT(*) FROM intakes) AS intakes,
      (SELECT COUNT(*) FROM doctor_reviews) AS reviews,
      (SELECT COUNT(*) FROM doctor_reviews WHERE status='pending') AS pending
  `);
  console.log('\nDatabase totals:');
  console.log(`  patients=${stats.patients}  intakes=${stats.intakes}  reviews=${stats.reviews}  pending=${stats.pending}`);
  console.log('\nDone. Open the Doctor tab after creating a staff user with scripts/create-user.js');

  await pool.end();
}

main().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
