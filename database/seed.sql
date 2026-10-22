USE chikitsakendra;

-- NOTE: full_name/mobile are application-layer encrypted (AES-256-GCM), so they
-- cannot be seeded as plaintext SQL without going through the app's crypto helper.
-- This seed only creates a patient shell with no PII. Use the app UI/API, or
-- `node scripts/seed-demo-patient.js`, to create a demo patient with encrypted fields.
INSERT INTO patients (patient_code, preferred_language, consent_status, consent_at)
VALUES ('DEMO-1001', 'English', 'granted', NOW())
ON DUPLICATE KEY UPDATE patient_code = VALUES(patient_code);

-- Doctor/admin accounts cannot be seeded here either (bcrypt hash must be generated
-- by the app). Run: node scripts/create-user.js <username> <password> <doctor|admin>
INSERT INTO retention_policy (id) VALUES (1) ON DUPLICATE KEY UPDATE id = id;
