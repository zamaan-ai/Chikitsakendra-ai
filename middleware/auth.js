const jwt = require('jsonwebtoken');
const pool = require('../db');
const { sha256Hex } = require('../lib/crypto-util');

function getBearerToken(req) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  return token;
}

/** Requires a valid doctor/admin JWT. Attaches req.user = { id, role, username }. */
function requireStaffAuth(req, res, next) {
  const token = getBearerToken(req);
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.type !== 'staff') throw new Error('wrong token type');
    req.user = { id: payload.sub, role: payload.role, username: payload.username };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
}

/** Requires the staff JWT to carry one of the given roles. Use after requireStaffAuth. */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

/**
 * Requires a valid patient session token (issued at anonymous patient creation).
 * The token alone identifies the patient (it's a per-patient secret), so this
 * works both for routes with :patientId in the URL and routes (like POST
 * /api/intakes) that only get an ID from the token. When the route DOES have
 * a :patientId param, it's cross-checked against the token's own patient as
 * defense in depth, so a token can never be used to act as a different ID.
 * Attaches req.patientId (number).
 */
async function requirePatientAuth(req, res, next) {
  const token = getBearerToken(req);
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  try {
    const [rows] = await pool.execute(
      'SELECT id FROM patients WHERE session_token_hash = ?',
      [sha256Hex(token)]
    );
    if (!rows.length) return res.status(401).json({ error: 'Invalid patient session' });
    const tokenPatientId = rows[0].id;
    const urlPatientId = req.params.patientId ? Number(req.params.patientId) : null;
    if (urlPatientId !== null && urlPatientId !== tokenPatientId) {
      return res.status(403).json({ error: 'Session does not match requested patient' });
    }
    req.patientId = tokenPatientId;
    next();
  } catch (err) {
    return res.status(500).json({ error: 'Authentication check failed' });
  }
}

/** Same as requirePatientAuth but resolves patientId via an intake row (for /intakes/:intakeId/* routes). */
async function requirePatientAuthViaIntake(req, res, next) {
  const token = getBearerToken(req);
  const intakeId = Number(req.params.intakeId);
  if (!token || !intakeId) return res.status(401).json({ error: 'Authentication required' });
  try {
    const [rows] = await pool.execute(
      `SELECT p.id AS patient_id FROM intakes i JOIN patients p ON p.id = i.patient_id
       WHERE i.id = ? AND p.session_token_hash = ?`,
      [intakeId, sha256Hex(token)]
    );
    if (!rows.length) return res.status(401).json({ error: 'Invalid patient session' });
    req.patientId = rows[0].patient_id;
    next();
  } catch (err) {
    return res.status(500).json({ error: 'Authentication check failed' });
  }
}

module.exports = { requireStaffAuth, requireRole, requirePatientAuth, requirePatientAuthViaIntake };
