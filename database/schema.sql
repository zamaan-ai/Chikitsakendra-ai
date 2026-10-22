CREATE DATABASE IF NOT EXISTS chikitsakendra CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE chikitsakendra;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(80) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(160) NULL,
  role ENUM('doctor','admin') NOT NULL DEFAULT 'doctor',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  failed_login_count INT UNSIGNED NOT NULL DEFAULT 0,
  locked_until DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS patients (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  patient_code VARCHAR(32) NOT NULL UNIQUE,
  session_token_hash CHAR(64) NULL,
  -- full_name and mobile store AES-256-GCM ciphertext (base64: iv+tag+data), not plaintext.
  full_name VARCHAR(500) NULL,
  mobile VARCHAR(500) NULL,
  preferred_language VARCHAR(20) NOT NULL DEFAULT 'English',
  consent_status ENUM('pending','granted','revoked') NOT NULL DEFAULT 'pending',
  consent_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS intakes (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  patient_id BIGINT UNSIGNED NOT NULL,
  chief_complaint TEXT NOT NULL,
  duration VARCHAR(80) NULL,
  status ENUM('draft','submitted','doctor_review','closed') NOT NULL DEFAULT 'draft',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_intake_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  INDEX idx_intakes_patient (patient_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS vitals (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  intake_id BIGINT UNSIGNED NOT NULL,
  temperature VARCHAR(32) NULL,
  blood_pressure VARCHAR(32) NULL,
  weight VARCHAR(32) NULL,
  heart_rate VARCHAR(32) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_vitals_intake FOREIGN KEY (intake_id) REFERENCES intakes(id) ON DELETE CASCADE,
  INDEX idx_vitals_intake (intake_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS reports (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  patient_id BIGINT UNSIGNED NOT NULL,
  intake_id BIGINT UNSIGNED NULL,
  original_name VARCHAR(255) NOT NULL,
  stored_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(120) NOT NULL,
  size_bytes BIGINT UNSIGNED NOT NULL,
  storage_path VARCHAR(500) NOT NULL,
  storage_url VARCHAR(500) NULL,
  ocr_status ENUM('pending','processing','completed','failed','not_started') NOT NULL DEFAULT 'not_started',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reports_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  CONSTRAINT fk_reports_intake FOREIGN KEY (intake_id) REFERENCES intakes(id) ON DELETE SET NULL,
  INDEX idx_reports_patient (patient_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS summaries (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  intake_id BIGINT UNSIGNED NOT NULL,
  chief_complaint TEXT NULL,
  history_text TEXT NULL,
  symptoms_text TEXT NULL,
  vitals_text TEXT NULL,
  medical_history TEXT NULL,
  medications_allergies TEXT NULL,
  confidence DECIMAL(5,2) NULL,
  ai_status ENUM('draft','generated','reviewed') NOT NULL DEFAULT 'draft',
  clinician_verified TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_summary_intake FOREIGN KEY (intake_id) REFERENCES intakes(id) ON DELETE CASCADE,
  INDEX idx_summaries_intake (intake_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS doctor_reviews (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  intake_id BIGINT UNSIGNED NOT NULL,
  doctor_name VARCHAR(160) NULL,
  status ENUM('pending','in_review','approved','rejected') NOT NULL DEFAULT 'pending',
  notes TEXT NULL,
  reviewed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_review_intake FOREIGN KEY (intake_id) REFERENCES intakes(id) ON DELETE CASCADE,
  INDEX idx_reviews_status (status)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  patient_id BIGINT UNSIGNED NULL,
  intake_id BIGINT UNSIGNED NULL,
  actor_type ENUM('patient','doctor','admin','system') NOT NULL DEFAULT 'system',
  actor_id BIGINT UNSIGNED NULL,
  ip_address VARCHAR(64) NULL,
  action VARCHAR(120) NOT NULL,
  metadata JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_audit_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE SET NULL,
  CONSTRAINT fk_audit_intake FOREIGN KEY (intake_id) REFERENCES intakes(id) ON DELETE SET NULL,
  INDEX idx_audit_created (created_at),
  INDEX idx_audit_actor (actor_type, actor_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS audio_recordings (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  patient_id BIGINT UNSIGNED NOT NULL,
  session_id CHAR(36) NOT NULL,
  filename VARCHAR(255) NOT NULL,
  storage_url VARCHAR(500) NULL,
  duration_seconds INT UNSIGNED NULL,
  size_bytes BIGINT UNSIGNED NULL,
  format VARCHAR(20) NOT NULL DEFAULT 'mp3',
  status ENUM('pending','completed','failed') NOT NULL DEFAULT 'pending',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_audio_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  INDEX idx_audio_patient (patient_id),
  INDEX idx_audio_created (created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS storage_url (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  report_id BIGINT UNSIGNED NULL,
  audio_id BIGINT UNSIGNED NULL,
  storage_url VARCHAR(500) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_storage_report FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
  CONSTRAINT fk_storage_audio FOREIGN KEY (audio_id) REFERENCES audio_recordings(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Retention policy config (used by scripts/retention-cleanup.js). Adjust per your compliance requirements.
CREATE TABLE IF NOT EXISTS retention_policy (
  id TINYINT UNSIGNED PRIMARY KEY DEFAULT 1,
  reports_retention_days INT UNSIGNED NOT NULL DEFAULT 365,
  audit_retention_days INT UNSIGNED NOT NULL DEFAULT 1825,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT INTO retention_policy (id) VALUES (1) ON DUPLICATE KEY UPDATE id = id;
