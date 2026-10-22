/**
 * Comprehensive System Verification Suite for ChikitsaKendra AI
 */
const axios = require('axios');
const WebSocket = require('ws');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const pool = require('../db');

const BASE_URL = 'http://localhost:3000';
const WS_URL = 'ws://localhost:3000';

async function runTests() {
  console.log('====================================================');
  console.log('   CHIKITSAKENDRA AI - FULL SYSTEM VERIFICATION    ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${testName} - ${details}`);
      failed++;
    }
  }

  try {
    // 1. Health check
    console.log('\n--- 1. Health & Server Status ---');
    const healthRes = await axios.get(`${BASE_URL}/api/health`);
    assert(healthRes.status === 200 && healthRes.data.ok === true, 'GET /api/health returns 200 OK');
    assert(healthRes.data.database === 'mysql', 'Database reports mysql');

    // 2. Frontend Serving
    console.log('\n--- 2. Frontend Serving ---');
    const indexRes = await axios.get(`${BASE_URL}/`);
    assert(indexRes.status === 200 && indexRes.data.includes('ChikitsaKendra AI'), 'GET / serves dashboard.html');
    const jsRes = await axios.get(`${BASE_URL}/app.js`);
    assert(jsRes.status === 200 && jsRes.data.includes('ChikitsaKendra AI'), 'GET /app.js serves successfully');
    const i18nRes = await axios.get(`${BASE_URL}/i18n.js`);
    assert(i18nRes.status === 200 && i18nRes.data.includes('translations'), 'GET /i18n.js serves translations');

    // 3. Initial Dashboard Stats
    console.log('\n--- 3. Public Stats Endpoint ---');
    const statsRes = await axios.get(`${BASE_URL}/api/dashboard/stats`);
    assert(statsRes.status === 200, 'GET /api/dashboard/stats returns 200');
    assert(typeof statsRes.data.patients === 'number', 'Stats contains patient count');

    // 4. Staff Auth & Access Control
    console.log('\n--- 4. Staff Auth & Access Control ---');
    try {
      await axios.post(`${BASE_URL}/api/auth/login`, { username: 'drpriya', password: 'wrongpassword' });
      assert(false, 'Login with incorrect password should be rejected');
    } catch (err) {
      assert(err.response?.status === 401, 'Login with bad password correctly returned 401');
    }

    const loginRes = await axios.post(`${BASE_URL}/api/auth/login`, { username: 'drpriya', password: 'password12345' });
    assert(loginRes.status === 200 && Boolean(loginRes.data.token), 'Doctor login succeeds and returns JWT');
    const doctorToken = loginRes.data.token;

    const meRes = await axios.get(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${doctorToken}` }
    });
    assert(meRes.data.username === 'drpriya' && meRes.data.role === 'doctor', 'GET /api/auth/me returns doctor profile');

    // 5. Patient Lifecycle & Encryption
    console.log('\n--- 5. Anonymous Patient Lifecycle & PII Encryption ---');
    const patientCreate = await axios.post(`${BASE_URL}/api/patients/anonymous`, { preferredLanguage: 'Hindi' });
    assert(patientCreate.status === 201 && patientCreate.data.sessionToken, 'Created anonymous patient session');
    const patientId = patientCreate.data.id;
    const sessionToken = patientCreate.data.sessionToken;
    let wsToken = patientCreate.data.wsToken;

    const patientGet = await axios.get(`${BASE_URL}/api/patients/${patientId}`, {
      headers: { Authorization: `Bearer ${sessionToken}` }
    });
    assert(patientGet.data.preferred_language === 'Hindi', 'Patient language preserved');

    const patchRes = await axios.patch(`${BASE_URL}/api/patients/${patientId}`, {
      fullName: 'Vikram Malhotra',
      mobile: '+91 98765 01234'
    }, {
      headers: { Authorization: `Bearer ${sessionToken}` }
    });
    assert(patchRes.data.ok === true, 'Updated patient personal info');

    const [dbRows] = await pool.execute('SELECT full_name, mobile FROM patients WHERE id = ?', [patientId]);
    assert(dbRows[0].full_name && !dbRows[0].full_name.includes('Vikram'), 'Patient name is encrypted at rest in DB');
    const patientDecrypted = await axios.get(`${BASE_URL}/api/patients/${patientId}`, {
      headers: { Authorization: `Bearer ${sessionToken}` }
    });
    assert(patientDecrypted.data.full_name === 'Vikram Malhotra', 'API returns decrypted patient name');

    const consentRes = await axios.post(`${BASE_URL}/api/patients/${patientId}/consent`, { granted: true }, {
      headers: { Authorization: `Bearer ${sessionToken}` }
    });
    assert(consentRes.data.consentStatus === 'granted', 'Patient consent recorded as granted');

    // 6. Intake & Vitals
    console.log('\n--- 6. Intake & Vitals ---');
    const intakeRes = await axios.post(`${BASE_URL}/api/intakes`, {
      chiefComplaint: 'Severe migraine and nausea for 3 days',
      duration: '3 days'
    }, {
      headers: { Authorization: `Bearer ${sessionToken}` }
    });
    assert(intakeRes.status === 201 && intakeRes.data.id, 'Intake recorded successfully');
    const intakeId = intakeRes.data.id;

    const vitalsRes = await axios.post(`${BASE_URL}/api/intakes/${intakeId}/vitals`, {
      temperature: '99.5°F',
      bloodPressure: '120/80',
      weight: '70 kg',
      heartRate: '82 bpm'
    }, {
      headers: { Authorization: `Bearer ${sessionToken}` }
    });
    assert(vitalsRes.status === 201 && vitalsRes.data.id, 'Vitals recorded successfully');

    // 7. Medical Report Upload & Download
    console.log('\n--- 7. Medical Report Upload & Download ---');
    const pdfPath = path.join(__dirname, 'fixtures/test.pdf');
    const form = new FormData();
    form.append('intakeId', intakeId);
    form.append('reports', fs.createReadStream(pdfPath), {
      filename: 'sample_lab_report.pdf',
      contentType: 'application/pdf'
    });

    const uploadRes = await axios.post(`${BASE_URL}/api/patients/${patientId}/reports`, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${sessionToken}`
      }
    });
    assert(uploadRes.status === 201 && uploadRes.data.files.length === 1, 'Medical report PDF uploaded');
    const reportId = uploadRes.data.files[0].id;

    const downloadRes = await axios.get(`${BASE_URL}/api/patients/${patientId}/reports/${reportId}/download`, {
      headers: { Authorization: `Bearer ${sessionToken}` }
    });
    assert(downloadRes.status === 200, 'Patient report download endpoint accessible');

    // 8. WebSocket Audio Streaming
    console.log('\n--- 8. Real-Time WebSocket Audio Streaming ---');
    const tokenRes = await axios.get(`${BASE_URL}/api/patients/${patientId}/ws-token`, {
      headers: { Authorization: `Bearer ${sessionToken}` }
    });
    wsToken = tokenRes.data.wsToken;

    const wsPromise = new Promise((resolve, reject) => {
      const ws = new WebSocket(`${WS_URL}?token=${wsToken}`);
      let completedRecording = null;

      ws.on('open', () => {
        ws.send(JSON.stringify({
          type: 'audio-start',
          payload: { sessionId: `test-sess-${Date.now()}`, metadata: { sampleRate: 16000 } }
        }));
      });

      ws.on('message', (msg) => {
        try {
          const parsed = JSON.parse(msg.toString());
          if (parsed.type === 'audio-started') {
            const fakePcmChunk = Buffer.alloc(1024, 0x55).toString('base64');
            for (let seq = 1; seq <= 3; seq++) {
              ws.send(JSON.stringify({
                type: 'audio-chunk',
                payload: { chunk: fakePcmChunk, sequence: seq, timestamp: Date.now() }
              }));
            }
            setTimeout(() => {
              ws.send(JSON.stringify({
                type: 'audio-end',
                payload: { finalize: true, format: 'wav', duration: 3 }
              }));
            }, 100);
          } else if (parsed.type === 'audio-completed') {
            completedRecording = parsed.payload;
            ws.close();
            resolve(completedRecording);
          }
        } catch (e) {
          reject(e);
        }
      });

      ws.on('error', (err) => reject(err));
      setTimeout(() => reject(new Error('WebSocket timeout')), 6000);
    });

    const audioResult = await wsPromise;
    assert(audioResult && audioResult.recordingId, `Audio streaming completed (Recording ID: ${audioResult?.recordingId})`);
    const audioId = audioResult.recordingId;

    const audioListRes = await axios.get(`${BASE_URL}/api/patients/${patientId}/audio`, {
      headers: { Authorization: `Bearer ${sessionToken}` }
    });
    assert(audioListRes.data.length > 0, 'Audio recording appears in patient audio history');

    // 9. Doctor Review Workflow & Dossier
    console.log('\n--- 9. Doctor Review Workflow & Dossier ---');
    const sendReviewRes = await axios.post(`${BASE_URL}/api/intakes/${intakeId}/doctor-review`, {}, {
      headers: { Authorization: `Bearer ${sessionToken}` }
    });
    assert(sendReviewRes.status === 201 && sendReviewRes.data.status === 'pending', 'Intake submitted to doctor queue');
    const reviewId = sendReviewRes.data.id;

    // Doctor checks queue (with vitals and counts)
    const queueRes = await axios.get(`${BASE_URL}/api/doctor/reviews`, {
      headers: { Authorization: `Bearer ${doctorToken}` }
    });
    const foundInQueue = queueRes.data.find(r => r.id === reviewId);
    assert(Boolean(foundInQueue), 'New submission is visible in doctor queue');
    assert(foundInQueue?.temperature === '99.5°F', 'Doctor queue returns patient vitals (temperature)');
    assert(Number(foundInQueue?.reports_count) >= 1, 'Doctor queue returns reports count');
    assert(Number(foundInQueue?.audio_count) >= 1, 'Doctor queue returns audio count');

    // Doctor inspects detailed case dossier
    const dossierRes = await axios.get(`${BASE_URL}/api/doctor/reviews/${reviewId}/details`, {
      headers: { Authorization: `Bearer ${doctorToken}` }
    });
    assert(dossierRes.status === 200, 'Doctor dossier details endpoint accessible');
    assert(dossierRes.data.reports?.length >= 1, 'Doctor dossier includes medical reports list');
    assert(dossierRes.data.audio?.length >= 1, 'Doctor dossier includes audio recordings list');

    // Doctor downloads patient report
    const docReportRes = await axios.get(`${BASE_URL}/api/doctor/reports/${reportId}/download`, {
      headers: { Authorization: `Bearer ${doctorToken}` }
    });
    assert(docReportRes.status === 200, 'Doctor report download endpoint accessible');

    // Doctor streams patient audio
    const docAudioRes = await axios.get(`${BASE_URL}/api/doctor/audio/${audioId}/play`, {
      headers: { Authorization: `Bearer ${doctorToken}` }
    });
    assert(docAudioRes.status === 200, 'Doctor audio play/stream endpoint accessible');

    // Doctor approves review with notes
    const updateReviewRes = await axios.patch(`${BASE_URL}/api/doctor/reviews/${reviewId}`, {
      status: 'approved',
      notes: 'Prescribed rest and hydration.'
    }, {
      headers: { Authorization: `Bearer ${doctorToken}` }
    });
    assert(updateReviewRes.data.ok === true, 'Doctor review approved with notes');

    // 10. Patient Records Aggregation
    console.log('\n--- 10. Patient Records Aggregation ---');
    const recordsRes = await axios.get(`${BASE_URL}/api/patients/${patientId}/records`, {
      headers: { Authorization: `Bearer ${sessionToken}` }
    });
    assert(recordsRes.data.intakes.length > 0, 'Records include intakes');
    assert(recordsRes.data.reports.length > 0, 'Records include reports');
    assert(recordsRes.data.reviews.length > 0, 'Records include reviews');
    assert(recordsRes.data.audio.length > 0, 'Records include audio recordings');

    // 11. Audit Logs Check
    console.log('\n--- 11. Audit Trail Verification ---');
    const [auditRows] = await pool.execute(
      'SELECT action, actor_type FROM audit_logs WHERE patient_id = ? ORDER BY id DESC',
      [patientId]
    );
    assert(auditRows.length >= 6, `Audit trail recorded ${auditRows.length} distinct actions for patient`);
    const actions = auditRows.map(r => r.action);
    assert(actions.includes('PATIENT_CREATED'), 'Audit logged PATIENT_CREATED');
    assert(actions.includes('CONSENT_GRANTED'), 'Audit logged CONSENT_GRANTED');
    assert(actions.includes('INTAKE_SUBMITTED'), 'Audit logged INTAKE_SUBMITTED');
    assert(actions.includes('REPORTS_UPLOADED'), 'Audit logged REPORTS_UPLOADED');
    assert(actions.includes('AUDIO_RECORDING_SAVED'), 'Audit logged AUDIO_RECORDING_SAVED');
    assert(actions.includes('DOCTOR_DOWNLOAD_REPORT'), 'Audit logged DOCTOR_DOWNLOAD_REPORT');
    assert(actions.includes('DOCTOR_PLAY_AUDIO'), 'Audit logged DOCTOR_PLAY_AUDIO');

  } catch (error) {
    console.error('\n❌ Unexpected error during test run:', error.response?.data || error.message);
    failed++;
  } finally {
    console.log('\n====================================================');
    console.log(`TOTAL TESTS RUN: ${passed + failed}`);
    console.log(`  PASSED: ${passed}`);
    console.log(`  FAILED: ${failed}`);
    console.log('====================================================');
    await pool.end();
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
