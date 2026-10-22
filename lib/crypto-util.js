// Field-level encryption for patient PII (full_name, mobile) stored in MySQL.
// Uses AES-256-GCM: random 12-byte IV per value + 16-byte auth tag, packed as
// base64(iv || tag || ciphertext). This protects data at rest in the DB/backups
// even though the app itself can still read it (this is NOT end-to-end encryption
// and does not protect against a compromised app server — see README security notes).

const crypto = require('crypto');

const ALGO = 'aes-256-gcm';
const IV_LEN = 12;
const TAG_LEN = 16;

function loadKey() {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw || raw === 'change_me_32_byte_base64_key') {
    throw new Error(
      'ENCRYPTION_KEY is not set. Generate one with: ' +
      `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
    );
  }
  const key = Buffer.from(raw, 'base64');
  if (key.length !== 32) {
    throw new Error('ENCRYPTION_KEY must decode to exactly 32 bytes (AES-256).');
  }
  return key;
}

let cachedKey = null;
function key() {
  if (!cachedKey) cachedKey = loadKey();
  return cachedKey;
}

/** Encrypt a plaintext string. Returns null for null/undefined/empty input (so optional fields stay NULL). */
function encrypt(plaintext) {
  if (plaintext === null || plaintext === undefined || plaintext === '') return null;
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGO, key(), iv);
  const ciphertext = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ciphertext]).toString('base64');
}

/** Decrypt a value produced by encrypt(). Returns null for null input. Throws on tampered/corrupt data. */
function decrypt(packed) {
  if (packed === null || packed === undefined || packed === '') return null;
  const buf = Buffer.from(packed, 'base64');
  const iv = buf.subarray(0, IV_LEN);
  const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN);
  const ciphertext = buf.subarray(IV_LEN + TAG_LEN);
  const decipher = crypto.createDecipheriv(ALGO, key(), iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext.toString('utf8');
}

/** SHA-256 hash for storing lookup tokens (e.g. patient session tokens) without keeping the raw secret. */
function sha256Hex(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

module.exports = { encrypt, decrypt, sha256Hex };
