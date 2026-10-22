# ChikitsaKendra AI — Presentation Outline (12–15 slides)

Use this as a speaker-notes scaffold. Each block = one slide (or two if your template is sparse).

---

### Slide 1 — Title
- **ChikitsaKendra AI**
- Digital Healthcare Intake & Doctor-Review System with MySQL Persistence
- Final Year Project | Your Name | Department | Year
- Optional: college logo

### Slide 2 — Agenda
1. Problem & Motivation  
2. Objectives  
3. Architecture  
4. Technology Stack  
5. Database Design  
6. Security Hardening  
7. Key Features / Demo Flow  
8. Implementation Highlights  
9. Results  
10. Limitations & Future Work  
11. Conclusion  

### Slide 3 — Problem Statement
- Many health prototypes are **front-end only** — data vanishes on refresh
- No real clinician authentication or audit trail
- PII (name, mobile) stored in plaintext or not stored at all
- Hard to demonstrate multi-user / doctor queue scenarios
- **Need:** durable storage + auth + basic security without breaking the existing UI

### Slide 4 — Objectives
- Persist patient lifecycle (session → intake → reports → doctor review)
- Patient session tokens + staff JWT/RBAC
- Encrypt sensitive fields at rest
- Validation, rate limits, CORS, audit logs
- Dockerized, reproducible setup
- Keep original clinical UI

### Slide 5 — System Architecture (diagram)
```
Browser UI  →  Express API  →  MySQL 8.4
                 │
                 └── uploads/ (reports)
```
- Patients: anonymous session token  
- Doctors: login → JWT  
- All mutations require `Authorization: Bearer …`

*(Use `docs/images/architecture-target.png` from the repo if available.)*

### Slide 6 — Technology Stack
| Layer | Choice |
|-------|--------|
| UI | Existing HTML/CSS/JS |
| API | Node.js + Express |
| DB | MySQL 8.4 |
| Auth | bcrypt + JWT |
| Crypto | AES-256-GCM |
| Deploy | Docker Compose |

### Slide 7 — Database Schema (high level)
Tables: `patients`, `intakes`, `vitals`, `reports`, `summaries`, `doctor_reviews`, `users`, `audit_logs`, `retention_policy`  
- FK chain: patient → intake → vitals / summaries / reviews  
- `full_name` / `mobile` store **ciphertext**, not plaintext  
- `session_token_hash` = SHA-256 of patient bearer token  

### Slide 8 — Security Features
- Staff: bcrypt (cost 12), JWT, lockout after 5 failures  
- Patient: opaque token; only hash in DB  
- Field encryption: AES-256-GCM  
- express-validator on writes  
- Rate limits (general + login)  
- helmet + CORS allow-list  
- Audit log with actor + IP  
- Retention cleanup script (scheduled)

### Slide 9 — User Flows (Demo Path)
**Patient**  
1. Open app → automatic anonymous session  
2. Enter chief complaint → saved as intake  
3. Grant consent  
4. Upload report(s)  
5. Send to doctor review  

**Doctor**  
1. Doctor tab → login  
2. See live queue  
3. Start review / Approve / Reject  

### Slide 10 — Implementation Highlights
- `public/app.js` — thin integration layer over existing UI  
- `server.js` — all REST routes + security middleware  
- `lib/crypto-util.js` — encrypt / decrypt / sha256Hex  
- `middleware/auth.js` — staff JWT + patient token checks  
- `scripts/create-user.js` & `seed-demo-data.js`  

### Slide 11 — Results / What Works
- End-to-end patient → doctor flow on real MySQL  
- Dashboard stats from live counts  
- Encrypted PII verified via seed script  
- Docker one-command bring-up  
- Clear separation of patient vs staff privileges  

### Slide 12 — Limitations & Future Work
**Out of scope (by design):** real ASR/TTS, OCR, clinical LLM, cloud storage, formal DPDP/HIPAA clearance  

**Next steps:**  
- LLM-assisted draft summary (with clinician gate)  
- Object storage (S3/GCS)  
- Automated tests & monitoring  
- Domain-authored question trees  

### Slide 13 — Conclusion
- Converted a browser-only prototype into a **hardened, persistent** system  
- Auth, encryption, audit, and Docker deployment delivered  
- Ready for academic demo and further clinical-AI work  

### Slide 14 — Q&A / Thank You
- Thank you  
- Questions?  
- Repo / demo link (if hosted)

---

## Suggested timing
- Slides 1–4: ~3 min  
- Architecture + DB + Security: ~5 min  
- Demo (live or recorded): ~4–5 min  
- Results + Future + Close: ~2–3 min  
**Total ≈ 12–15 minutes** + Q&A
