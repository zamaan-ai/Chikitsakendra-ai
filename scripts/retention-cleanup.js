#!/usr/bin/env node
// Deletes data past the configured retention window. Intended to run on a schedule
// (e.g. a daily cron job / Docker sidecar), NOT automatically on every server start.
// Review database/schema.sql `retention_policy` table and your actual regulatory
// requirements (this defaults to placeholder values, not a compliance guarantee).
require('dotenv').config();
const fs = require('fs/promises');
const pool = require('../db');

async function main() {
  const [[policy]] = await pool.query('SELECT * FROM retention_policy WHERE id = 1');
  if (!policy) throw new Error('No retention_policy row found — did you run schema.sql?');

  const [oldReports] = await pool.execute(
    'SELECT id, storage_path FROM reports WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)',
    [policy.reports_retention_days]
  );
  for (const report of oldReports) {
    try {
      await fs.unlink(report.storage_path);
    } catch (err) {
      if (err.code !== 'ENOENT') console.warn(`Could not delete file for report ${report.id}: ${err.message}`);
    }
    await pool.execute('DELETE FROM reports WHERE id = ?', [report.id]);
  }
  console.log(`Deleted ${oldReports.length} report(s) older than ${policy.reports_retention_days} days.`);

  const [auditResult] = await pool.execute(
    'DELETE FROM audit_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)',
    [policy.audit_retention_days]
  );
  console.log(`Deleted ${auditResult.affectedRows} audit log row(s) older than ${policy.audit_retention_days} days.`);

  await pool.end();
}

main().catch(err => {
  console.error('Retention cleanup failed:', err);
  process.exit(1);
});
