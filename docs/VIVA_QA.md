# ChikitsaKendra AI — Viva / Oral Exam Q&A Sheet

Short, defensible answers. Expand with your own words and a live demo if asked.

---

## Project & Motivation

**Q1. What is the main problem your project solves?**  
A: The original ChikitsaKendra UI was browser-only — no durable storage, no clinician login, no protection of patient identity data. We added a real MySQL backend, authentication, encryption of PII, audit logging, and Docker deployment while keeping the existing UI.

**Q2. Is this a production medical product?**  
A: No. It is a hardened engineering prototype. Real clinical AI (ASR, OCR, LLM summaries), formal compliance (e.g. India’s DPDP Act), and medical content design are explicitly out of scope and need domain experts and external services.

---

## Architecture & Design

**Q3. Explain the high-level architecture.**  
A: Browser UI talks only to a Node/Express REST API. The API talks to MySQL for all durable state and stores uploaded reports on local disk (`/uploads`). Patients receive an opaque session token; doctors log in and receive a JWT.

**Q4. Why not use cookies for sessions?**  
A: All state-changing API calls require a bearer token in the `Authorization` header. A third-party site cannot attach that header to a forged request, which mitigates classic CSRF without needing a separate CSRF token.

**Q5. How is a patient identified?**  
A: On first load the API creates an anonymous patient row and returns a random session token. Only the SHA-256 hash of that token is stored. Every later patient request must present the same token; the middleware resolves the patient ID from the hash and refuses cross-patient access.

**Q6. How do doctors authenticate?**  
A: Staff accounts live in the `users` table with bcrypt password hashes. Login returns a JWT signed with `JWT_SECRET`. Routes under `/api/doctor/*` require a valid staff JWT and an allowed role (`doctor` or `admin`). Accounts are created only via `scripts/create-user.js` — there is no public self-registration.

---

## Database

**Q7. List the main tables and their purpose.**  
A:  
- `patients` — identity + encrypted name/mobile + consent + session token hash  
- `intakes` — chief complaint and lifecycle status  
- `vitals`, `summaries`, `reports` — clinical payload linked to intake/patient  
- `doctor_reviews` — queue for clinicians  
- `users` — staff accounts  
- `audit_logs` — who did what, from which IP  
- `retention_policy` — config for cleanup script  

**Q8. Why encrypt only name and mobile?**  
A: They are the clearest PII identifiers in this schema. Encryption at rest protects database dumps and backups. The application server still holds the key (this is not end-to-end encryption). Expanding encryption to more columns is straightforward with the same helper.

**Q9. What happens if the encryption key is lost?**  
A: All already-encrypted name/mobile values become permanently unreadable. The key must be backed up separately from the database (e.g. secrets manager), never only in the repo.

---

## Security

**Q10. What security controls did you implement?**  
A:  
1. Staff bcrypt + JWT + lockout after 5 failed logins  
2. Patient opaque tokens (hash only in DB)  
3. AES-256-GCM field encryption  
4. express-validator on write endpoints  
5. Rate limiting (general + stricter on login)  
6. helmet security headers  
7. CORS restricted to an explicit origin list  
8. Audit log with actor type/id and IP  
9. Retention cleanup script for old reports/audit rows  

**Q11. How does login lockout work?**  
A: Failed attempts increment `failed_login_count`. At 5 failures, `locked_until` is set 15 minutes ahead. A successful login resets the counter. Non-existent usernames still run a bcrypt compare against a dummy hash to reduce timing/enumeration leaks.

**Q12. Why is CSP disabled in helmet?**  
A: The existing dashboard uses inline styles and scripts. Enabling a strict CSP would break the UI until assets are externalized and nonces/hashes are added. Documented as a deliberate trade-off for this prototype.

---

## Implementation

**Q13. Which files are the “integration layer”?**  
A: `public/app.js` overrides UI actions (save symptom, consent, upload, doctor review, language) to call the API. `server.js` hosts all routes. Original root-level HTML/JS files were reference-only and have been removed in the cleaned distribution; only `public/` is served.

**Q14. How are file uploads handled?**  
A: multer stores files under `UPLOAD_DIR` with a sanitized, unique filename. Only PDF/JPEG/PNG are accepted, max 10 MB each. Metadata is written to the `reports` table. OCR is a status field only — actual OCR is future work.

**Q15. How do you seed demo data without storing plaintext PII in SQL?**  
A: `scripts/seed-demo-data.js` uses the same `encrypt()` helper as the live app, so names and mobiles are ciphertext in MySQL from the start. It is safe to re-run (deterministic patient codes).

---

## Deployment & Operations

**Q16. How do you run the system?**  
A: Copy `.env.example` → `.env`, generate real `JWT_SECRET` and `ENCRYPTION_KEY`, then `docker compose up --build`. Create a doctor with `create-user.js`. Optionally run `seed-demo-data.js`. Open `http://localhost:3000`.

**Q17. Why does the server refuse to start if secrets are still “change_me”?**  
A: Fail-fast: running with placeholder secrets would be insecure. The same check exists for encryption so we never write “encrypted” data under a weak key.

**Q18. Is retention cleanup automatic?**  
A: No. `scripts/retention-cleanup.js` must be scheduled (cron or sidecar). Defaults in `retention_policy` are placeholders; real periods depend on jurisdiction.

---

## Testing & Results

**Q19. How did you verify the system works?**  
A: Manual end-to-end path (patient session → intake → consent → upload → doctor queue → staff approve/reject), health and stats endpoints, login lockout, invalid-token rejection, and the demo seed script (which exercises encryption).

**Q20. What would you add if you had more time?**  
A: Automated API tests, LLM-backed draft summaries behind a clinician verification gate, object storage instead of local disk, externalized assets so CSP can be enabled, and monitoring/alerting.

---

## Ethics & Scope

**Q21. Why did you not integrate a real clinical AI model?**  
A: Clinical recommendations require medical expertise, safety review, and usually a licensed model/API. Shipping unverified AI advice would be irresponsible. The architecture leaves clear extension points (`summaries` table, `ai_status` field).

**Q22. How does this relate to data protection laws?**  
A: We implemented engineering controls (auth, encryption, audit, retention scaffolding) that align with good practice under laws such as India’s DPDP Act. Formal compliance still requires legal review, DPIA, and organisational processes — not only code.

---

## Quick “one-liner” answers

| Topic | One-liner |
|-------|-----------|
| Auth model | Patients = opaque session token; staff = bcrypt + JWT |
| Encryption | AES-256-GCM on name & mobile; key from env |
| Main risk if key lost | Encrypted PII becomes unrecoverable |
| Deployment | Docker Compose (Node app + MySQL 8.4) |
| Not claimed | Production medical device / full DPDP compliance / real clinical AI |
