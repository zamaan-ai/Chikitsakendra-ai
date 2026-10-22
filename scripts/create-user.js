#!/usr/bin/env node
// Usage: node scripts/create-user.js <username> <password> <doctor|admin> ["Full Name"]
require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../db');

async function main() {
  const [username, password, role = 'doctor', fullName = null] = process.argv.slice(2);
  if (!username || !password) {
    console.error('Usage: node scripts/create-user.js <username> <password> <doctor|admin> ["Full Name"]');
    process.exit(1);
  }
  if (!['doctor', 'admin'].includes(role)) {
    console.error('Role must be "doctor" or "admin".');
    process.exit(1);
  }
  if (password.length < 10) {
    console.error('Password must be at least 10 characters.');
    process.exit(1);
  }
  const hash = await bcrypt.hash(password, 12);
  try {
    await pool.execute(
      `INSERT INTO users (username, password_hash, role, full_name) VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), role = VALUES(role), full_name = VALUES(full_name), is_active = 1, failed_login_count = 0, locked_until = NULL`,
      [username, hash, role, fullName]
    );
    console.log(`✓ User "${username}" (${role}) created/updated.`);
  } catch (err) {
    console.error('Failed to create user:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
