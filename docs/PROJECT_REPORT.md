# ChikitsaKendra AI — Final Year Project Report

**Title:** ChikitsaKendra AI: A Hardened Digital Healthcare Intake & Doctor-Review System with MySQL Persistence  

**Subtitle:** Browser-based patient workflow connected to a secure Node.js/Express API and MySQL 8.4  

---

## 1. Abstract

ChikitsaKendra AI is a web-based prototype that digitizes the early stages of a clinical encounter: anonymous patient session creation, symptom/intake capture, consent management, report upload, and a doctor review queue. The original system was a browser-only UI with no durable storage. This project adds a production-oriented persistence layer (MySQL), authentication and role-based access control, field-level encryption of sensitive patient data, input validation, rate limiting, audit logging, and Docker-based deployment — while preserving the existing user interface.

The result is a complete, runnable engineering prototype suitable for academic demonstration and further clinical-content / AI integration work.

---

## 2. Problem Statement

Many digital health prototypes stop at the front-end demo: data lives only in the browser, there is no real multi-user concurrency, no authentication for clinicians, and no protection of personally identifiable information (PII). For a system that handles health-related information, this is insufficient.

**Goals of this project:**

1. Persist patient sessions, intakes, vitals, reports, and doctor reviews in a relational database.
2. Enforce authentication: patients use per-session opaque tokens; doctors/admins use JWT-based staff accounts.
3. Encrypt selected PII at rest (name, mobile).
4. Add standard web security controls (CORS allow-list, helmet headers, rate limits, validation).
5. Provide a reproducible deployment path via Docker Compose.
6. Keep the original clinical UI intact so the engineering work is clearly additive.

---

## 3. Objectives

| # | Objective | Status |
|---|-----------|--------|
| 1 | Design normalized MySQL schema for the clinical intake lifecycle | Done |
| 2 | Implement REST API for patient and doctor workflows | Done |
| 3 | Integrate existing dashboard UI with the API | Done |
| 4 | Implement staff auth (bcrypt + JWT) and patient session tokens | Done |
| 5 | Encrypt patient name/mobile with AES-256-GCM | Done |
| 6 | Add validation, rate limiting, security headers, audit trail | Done |
| 7 | Dockerize application + database | Done |
| 8 | Provide setup scripts, seed data, and documentation | Done |

---

## 4. System Architecture

```
Patient / Doctor Browser
          │
          ▼
  Existing ChikitsaKendra UI  (public/dashboard.html + public/app.js)
          │
          ▼
  Node.js + Express REST API  (server.js)
     │                    │
     │                    └──► Local report files (/uploads)
     ▼
  MySQL 8.4
     ├── users              (staff accounts)
     ├── patients           (encrypted PII + session token hash)
     ├── intakes
     ├── vitals
     ├── reports
     ├── summaries
     ├── doctor_reviews
     ├── audit_logs
     └── retention_policy
```

**Key design choices:**

- Stateless API; all state lives in MySQL or short-lived tokens.
- Patient identity is established by a random session token issued at first contact; only the SHA-256 hash is stored.
- Staff identity is established by username/password → JWT.
- CSRF is mitigated by requiring `Authorization: Bearer …` on every state-changing request (no cookie-based session for API mutations).

---

## 5. Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | HTML5, CSS3, vanilla JavaScript (existing UI preserved) |
| Backend | Node.js 22, Express 5 |
| Database | MySQL 8.4 |
| Auth | bcryptjs, jsonwebtoken |
| Encryption | Node.js `crypto` (AES-256-GCM) |
| Validation | express-validator |
| Security | helmet, express-rate-limit, CORS allow-list |
| File upload | multer |
| Deployment | Docker, Docker Compose |
| Language | JavaScript (ES modules not required; CommonJS) |

---

## 6. Database Design (Summary)

- **patients** — patient_code, encrypted full_name/mobile, preferred_language, consent_status, session_token_hash  
- **intakes** — chief_complaint, duration, status (draft → submitted → doctor_review → closed)  
- **vitals** — temperature, blood_pressure, weight, heart_rate (per intake)  
- **reports** — uploaded file metadata + local storage path, ocr_status placeholder  
- **summaries** — draft clinical summary fields + AI status flags  
- **doctor_reviews** — queue status (pending / in_review / approved / rejected)  
- **users** — staff accounts with bcrypt hash, role, lockout fields  
- **audit_logs** — actor_type, actor_id, ip_address, action, metadata  
- **retention_policy** — configurable retention windows for reports and audit rows  

Foreign keys enforce the patient → intake → vitals/summaries/reviews lifecycle. Cascade rules are chosen so deleting a patient removes dependent clinical rows while audit rows can be retained or anonymized by policy.

---

## 7. Security Features Implemented

1. **Authentication & RBAC**  
   - Staff: bcrypt (cost 12), JWT, account lockout after 5 failed attempts.  
   - Patients: opaque bearer token; only hash stored; scoped to that patient only.

2. **Encryption at rest**  
   - AES-256-GCM with random IV per field; key from `ENCRYPTION_KEY` (32-byte base64).

3. **Input validation** on every write endpoint.

4. **Rate limiting** — general API limit + stricter login limit.

5. **Security headers** via helmet (CSP left off intentionally because the existing UI uses inline styles/scripts).

6. **CORS** restricted to an explicit origin list.

7. **Audit logging** with actor and IP for significant events.

8. **Retention scaffolding** — `scripts/retention-cleanup.js` deletes old reports/audit rows according to policy (must be scheduled; not auto-run).

---

## 8. API Overview

| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/api/health` | none |
| GET | `/api/dashboard/stats` | none (aggregates only) |
| POST | `/api/auth/login` | none (rate-limited) |
| GET | `/api/auth/me` | staff |
| POST | `/api/patients/anonymous` | none → issues patient token |
| GET/PATCH | `/api/patients/:id` | patient |
| POST | `/api/patients/:id/consent` | patient |
| POST | `/api/intakes` | patient |
| POST | `/api/intakes/:id/vitals` | patient (via intake) |
| POST | `/api/patients/:id/reports` | patient |
| GET | `/api/patients/:id/records` | patient |
| POST | `/api/intakes/:id/doctor-review` | patient (requires consent) |
| GET | `/api/doctor/reviews` | staff |
| PATCH | `/api/doctor/reviews/:id` | staff |

---

## 9. How to Run (Quick Reference)

```bash
cp .env.example .env
# Generate and set JWT_SECRET and ENCRYPTION_KEY (see README)

docker compose up --build

docker compose exec app node scripts/create-user.js drpriya "StrongPass123!" doctor "Dr. Priya Sharma"
docker compose exec app node scripts/seed-demo-data.js   # optional demo rows

# Open http://localhost:3000
```

---

## 10. Testing Approach

- Manual end-to-end: create patient session → enter symptoms → grant consent → upload report → send to doctor queue → staff login → approve/reject.
- Health endpoint and dashboard stats verify DB connectivity.
- Login lockout and invalid-token rejection tested via API calls.
- Demo seed script verifies encryption path works for bulk inserts.

Automated unit/integration tests are a natural next step but were not required for the prototype scope.

---

## 11. Limitations & Future Work

| Gap | Why it is out of scope for pure engineering |
|-----|---------------------------------------------|
| Multilingual ASR/TTS | Requires commercial speech API keys |
| OCR on reports | Requires OCR library/service + credentials |
| Clinical questioning trees / LLM | Requires medical domain authorship + safety review |
| Cloud object storage | Requires cloud account & IAM |
| Formal compliance (DPDP / HIPAA) | Legal/process work, not a code change |

Suggested future work: plug in an LLM for draft summary generation behind a clinician-verification gate; move uploads to S3-compatible storage; add automated tests and monitoring.

---

## 12. Conclusion

This project successfully converts a browser-only healthcare UI prototype into a durable, authenticated, and security-hardened system backed by MySQL. All core engineering objectives — persistence, auth, encryption, validation, audit, and containerized deployment — have been met. The system is ready for academic demonstration and provides a solid foundation for subsequent clinical-AI and compliance work.

---

## 13. References / Tools Used

- Node.js, Express, mysql2, bcryptjs, jsonwebtoken, helmet, express-rate-limit, express-validator, multer, dotenv  
- MySQL 8.4, Docker, Docker Compose  
- AES-256-GCM (Node.js crypto)  

*(Add college-specific bibliography / IEEE citations as required by your department.)*
