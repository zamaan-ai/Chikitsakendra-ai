require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, param } = require('express-validator');
const WebSocket = require('ws');
const { Readable } = require('stream');

const pool = require('./db');
const { encrypt, decrypt, sha256Hex } = require('./lib/crypto-util');
const { requireStaffAuth, requireRole, requirePatientAuth, requirePatientAuthViaIntake } = require('./middleware/auth');
const { handleValidation } = require('./middleware/validate');
const { 
  uploadToStorage, 
  getFileStream, 
  deleteFromStorage, 
  generateSignedUrl,
  getStorageType 
} = require('./lib/storage-util');

// Precomputed once at startup so failed logins for a non-existent username still pay
// the bcrypt cost (timing-attack / enumeration mitigation) without hashing per-request.
const DUMMY_PASSWORD_HASH = bcrypt.hashSync('not-a-real-password', 10);

// --- Startup config checks (fail fast rather than run insecurely) ---
for (const name of ['JWT_SECRET', 'ENCRYPTION_KEY']) {
  const val = process.env[name];
  if (!val || val.startsWith('change_me')) {
    console.error(`FATAL: ${name} is not configured. Set a real secret in .env before starting. See .env.example.`);
    process.exit(1);
  }
}

const app = express();
app.set('trust proxy', 1); // needed for correct IPs / rate limiting behind a reverse proxy
const PORT = Number(process.env.PORT || 3000);
const uploadDir = path.resolve(process.env.UPLOAD_DIR || './uploads');
fs.mkdirSync(uploadDir, { recursive: true });

// --- Security headers ---
app.use(helmet({
  contentSecurityPolicy: false // the existing dashboard uses inline styles/scripts; enable+tune this once assets are externalized
}));

// --- CORS: explicit allow-list instead of open '*' ---
const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origin not allowed by CORS policy'));
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' })); // Increased for audio chunks
app.use(express.urlencoded({ extended: true }));

// --- Rate limiting ---
const generalLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  max: Number(process.env.RATE_LIMIT_MAX || 300),
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', generalLimiter);

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.LOGIN_RATE_LIMIT_MAX || 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Try again later.' }
});

app.use(express.static(path.join(__dirname, 'public')));

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${crypto.randomUUID()}-${safe}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 10 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'audio/mpeg', 'audio/wav', 'audio/ogg'];
    cb(null, allowed.includes(file.mimetype));
  }
});

async function audit({ patientId = null, intakeId = null, action, metadata = null, actorType = 'system', actorId = null, ip = null }) {
  await pool.execute(
    'INSERT INTO audit_logs (patient_id, intake_id, action, metadata, actor_type, actor_id, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [patientId, intakeId, action, metadata ? JSON.stringify(metadata) : null, actorType, actorId, ip]
  );
}

function actorFromReq(req) {
  if (req.user) return { actorType: req.user.role, actorId: req.user.id };
  if (req.patientId) return { actorType: 'patient', actorId: req.patientId };
  return { actorType: 'system', actorId: null };
}

// ============================================================
// WEBSOCKET SERVER FOR AUDIO STREAMING
// ============================================================
const wsClients = new Map();
const wsAuthTokens = new Map();
const audioSessions = new Map();

function generateWebSocketToken(patientId) {
  const token = crypto.randomBytes(64).toString('base64url');
  wsAuthTokens.set(token, {
    patientId,
    expires: Date.now() + 24 * 60 * 60 * 1000
  });
  return token;
}

function setupWebSocketServer(server) {
  const wss = new WebSocket.Server({ 
    server,
    verifyClient: (info, cb) => {
      const url = new URL(info.req.url, 'http://localhost');
      const token = url.searchParams.get('token') || info.req.headers['x-session-token'];
      
      if (!token) {
        return cb(false, 401, 'Unauthorized: Missing session token');
      }
      
      const sessionData = wsAuthTokens.get(token);
      if (!sessionData || sessionData.expires < Date.now()) {
        return cb(false, 401, 'Unauthorized: Invalid or expired token');
      }
      
      info.req.patientId = sessionData.patientId;
      cb(true);
    }
  });

  wss.on('connection', (ws, req) => {
    const patientId = req.patientId;
    
    if (!wsClients.has(patientId)) {
      wsClients.set(patientId, new Set());
    }
    wsClients.get(patientId).add(ws);
    
    console.log(`WebSocket connected for patient ${patientId}`);

    ws.on('message', async (data) => {
      try {
        const message = typeof data === 'string' ? JSON.parse(data) : JSON.parse(data.toString());
        const { type, payload } = message;

        switch (type) {
          case 'audio-start':
            await handleAudioStart(patientId, payload);
            break;
          
          case 'audio-chunk':
            await handleAudioChunk(patientId, payload);
            break;
          
          case 'audio-end':
            await handleAudioEnd(patientId, payload);
            break;
          
          case 'ping':
            ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
            break;
          
          default:
            ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type' }));
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({ type: 'error', message: 'Failed to process message' }));
      }
    });

    ws.on('close', () => {
      if (wsClients.has(patientId)) {
        wsClients.get(patientId).delete(ws);
        if (wsClients.get(patientId).size === 0) {
          wsClients.delete(patientId);
        }
      }
      console.log(`WebSocket disconnected for patient ${patientId}`);
    });
  });

  return wss;
}

// --- WebSocket Audio Handlers ---
async function handleAudioStart(patientId, payload) {
  const { sessionId, metadata = {} } = payload || {};
  
  audioSessions.set(patientId, {
    sessionId: sessionId || crypto.randomUUID(),
    chunks: [],
    metadata,
    startedAt: new Date(),
    totalBytes: 0,
    tempFiles: []
  });
  
  await audit({
    patientId,
    action: 'AUDIO_SESSION_START',
    metadata: { sessionId, ...metadata },
    actorType: 'patient',
    actorId: patientId,
    ip: null
  });
  
  const ws = wsClients.get(patientId);
  if (ws) {
    ws.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'audio-started',
          payload: { sessionId: audioSessions.get(patientId).sessionId }
        }));
      }
    });
  }
  
  return { status: 'ok', sessionId: audioSessions.get(patientId).sessionId };
}

async function handleAudioChunk(patientId, payload) {
  const session = audioSessions.get(patientId);
  if (!session) {
    throw new Error('No active audio session');
  }
  
  const { chunk, sequence, timestamp } = payload;
  const buffer = Buffer.from(chunk, 'base64');
  session.chunks.push({ buffer, sequence, timestamp });
  session.totalBytes += buffer.length;
  
  // Flush chunks periodically to avoid memory issues
  if (session.chunks.length >= 50 || session.totalBytes > 5 * 1024 * 1024) {
    await flushAudioChunks(patientId);
  }
}

async function flushAudioChunks(patientId) {
  const session = audioSessions.get(patientId);
  if (!session || session.chunks.length === 0) return;
  
  session.chunks.sort((a, b) => a.sequence - b.sequence);
  const combined = Buffer.concat(session.chunks.map(c => c.buffer));
  
  const tempPath = path.join(uploadDir, `audio_temp_${patientId}_${Date.now()}_${session.chunks.length}.raw`);
  fs.writeFileSync(tempPath, combined);
  
  session.chunks = [];
  session.tempFiles.push(tempPath);
}

async function handleAudioEnd(patientId, payload) {
  const session = audioSessions.get(patientId);
  if (!session) {
    throw new Error('No active audio session');
  }
  
  await flushAudioChunks(patientId);
  
  const { finalize = true, format = 'mp3', duration = 0 } = payload || {};
  
  if (finalize && session.tempFiles && session.tempFiles.length > 0) {
    try {
      const audioData = Buffer.concat(
        session.tempFiles.map(file => fs.readFileSync(file))
      );
      
      const filename = `audio_${patientId}_${Date.now()}.${format}`;
      const filePath = path.join(uploadDir, filename);
      fs.writeFileSync(filePath, audioData);
      
      // Upload to cloud storage
      const storageUrl = await uploadToStorage(filePath, {
        bucket: process.env.AUDIO_BUCKET || 'audio',
        key: `audio/${patientId}/${filename}`,
        contentType: `audio/${format}`
      });
      
      // Save to database
      const [result] = await pool.execute(
        `INSERT INTO audio_recordings 
         (patient_id, session_id, filename, storage_url, duration_seconds, size_bytes, format, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [patientId, session.sessionId, filename, storageUrl, duration || 0, audioData.length, format, 'completed']
      );
      
      // Clean up temp files
      session.tempFiles.forEach(file => {
        try { fs.unlinkSync(file); } catch (e) {}
      });
      
      // Clean up local file if using cloud storage
      if (getStorageType() !== 'local') {
        try { fs.unlinkSync(filePath); } catch (e) {}
      }
      
      await audit({
        patientId,
        action: 'AUDIO_RECORDING_SAVED',
        metadata: { recordingId: result.insertId, sessionId: session.sessionId, duration },
        actorType: 'patient',
        actorId: patientId,
        ip: null
      });
      
      const ws = wsClients.get(patientId);
      if (ws) {
        ws.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'audio-completed',
              payload: { recordingId: result.insertId, url: storageUrl }
            }));
          }
        });
      }
      
      audioSessions.delete(patientId);
      return { status: 'ok', recordingId: result.insertId, url: storageUrl };
      
    } catch (error) {
      console.error('Error processing audio:', error);
      throw error;
    }
  }
  
  audioSessions.delete(patientId);
  return { status: 'ok', message: 'Audio session ended' };
}

// ============================================================
// API ROUTES
// ============================================================

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, database: 'mysql', time: new Date().toISOString() });
  } catch (error) {
    res.status(503).json({ ok: false, error: 'Database unavailable' });
  }
});

// ============================================================
// STAFF AUTH
// ============================================================
app.post('/api/auth/login',
  loginLimiter,
  body('username').isString().trim().isLength({ min: 1, max: 80 }),
  body('password').isString().isLength({ min: 1, max: 200 }),
  handleValidation,
  async (req, res) => {
    const { username, password } = req.body;
    try {
      const [rows] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
      const user = rows[0];
      const hashToCheck = user ? user.password_hash : DUMMY_PASSWORD_HASH;
      const passwordOk = await bcrypt.compare(password, hashToCheck);

      if (user && user.locked_until && new Date(user.locked_until) > new Date()) {
        return res.status(423).json({ error: 'Account temporarily locked. Try again later.' });
      }
      if (!user || !passwordOk || !user.is_active) {
        if (user) {
          const failCount = user.failed_login_count + 1;
          const lock = failCount >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;
          await pool.execute('UPDATE users SET failed_login_count = ?, locked_until = ? WHERE id = ?', [failCount, lock, user.id]);
        }
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      await pool.execute('UPDATE users SET failed_login_count = 0, locked_until = NULL WHERE id = ?', [user.id]);
      const token = jwt.sign(
        { sub: user.id, role: user.role, username: user.username, type: 'staff' },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
      );
      await audit({ action: 'STAFF_LOGIN', actorType: user.role, actorId: user.id, ip: req.ip });
      res.json({ token, role: user.role, username: user.username, fullName: user.full_name });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Login failed' });
    }
  }
);

app.get('/api/auth/me', requireStaffAuth, (req, res) => res.json(req.user));

// ============================================================
// PATIENT ROUTES
// ============================================================
app.post('/api/patients/anonymous',
  body('preferredLanguage').optional().isString().trim().isLength({ max: 20 }),
  handleValidation,
  async (req, res) => {
    try {
      const language = req.body?.preferredLanguage || 'English';
      const code = `PT-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
      const sessionToken = crypto.randomBytes(32).toString('base64url');
      const [result] = await pool.execute(
        'INSERT INTO patients (patient_code, preferred_language, session_token_hash) VALUES (?, ?, ?)',
        [code, language, sha256Hex(sessionToken)]
      );
      
      const wsToken = generateWebSocketToken(result.insertId);
      
      await audit({ patientId: result.insertId, action: 'PATIENT_CREATED', metadata: { anonymous: true }, actorType: 'patient', actorId: result.insertId, ip: req.ip });
      res.status(201).json({ 
        id: result.insertId, 
        patientCode: code, 
        preferredLanguage: language, 
        sessionToken,
        wsToken
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Unable to create patient' });
    }
  }
);

app.get('/api/patients/:patientId', requirePatientAuth, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM patients WHERE id = ?', [req.patientId]);
    if (!rows.length) return res.status(404).json({ error: 'Patient not found' });
    const patient = rows[0];
    res.json({
      ...patient,
      full_name: decrypt(patient.full_name),
      mobile: decrypt(patient.mobile),
      session_token_hash: undefined
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to load patient' });
  }
});

app.patch('/api/patients/:patientId',
  requirePatientAuth,
  body('preferredLanguage').optional().isString().trim().isLength({ max: 20 }),
  body('fullName').optional().isString().trim().isLength({ max: 160 }),
  body('mobile').optional().isString().trim().matches(/^[0-9+()\-\s]{6,20}$/),
  handleValidation,
  async (req, res) => {
    try {
      const { preferredLanguage, fullName, mobile } = req.body || {};
      await pool.execute(
        'UPDATE patients SET preferred_language = COALESCE(?, preferred_language), full_name = COALESCE(?, full_name), mobile = COALESCE(?, mobile) WHERE id = ?',
        [preferredLanguage ?? null, fullName ? encrypt(fullName) : null, mobile ? encrypt(mobile) : null, req.patientId]
      );
      const actor = actorFromReq(req);
      await audit({ patientId: req.patientId, action: 'PATIENT_UPDATED', ...actor, ip: req.ip });
      res.json({ ok: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Unable to update patient' });
    }
  }
);

app.post('/api/intakes',
  requirePatientAuth,
  body('chiefComplaint').isString().trim().isLength({ min: 1, max: 4000 }),
  body('duration').optional().isString().trim().isLength({ max: 80 }),
  handleValidation,
  async (req, res) => {
    try {
      const { chiefComplaint, duration = null } = req.body || {};
      const [result] = await pool.execute(
        'INSERT INTO intakes (patient_id, chief_complaint, duration, status) VALUES (?, ?, ?, "submitted")',
        [req.patientId, chiefComplaint.trim(), duration]
      );
      await pool.execute(
        'INSERT INTO summaries (intake_id, chief_complaint, symptoms_text, ai_status) VALUES (?, ?, ?, "draft")',
        [result.insertId, chiefComplaint.trim(), chiefComplaint.trim()]
      );
      await audit({ patientId: req.patientId, intakeId: result.insertId, action: 'INTAKE_SUBMITTED', actorType: 'patient', actorId: req.patientId, ip: req.ip });
      res.status(201).json({ id: result.insertId, patientId: req.patientId, chiefComplaint: chiefComplaint.trim(), duration });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Unable to save intake' });
    }
  }
);

app.post('/api/intakes/:intakeId/vitals',
  requirePatientAuthViaIntake,
  body('temperature').optional().isString().trim().isLength({ max: 32 }),
  body('bloodPressure').optional().isString().trim().isLength({ max: 32 }),
  body('weight').optional().isString().trim().isLength({ max: 32 }),
  body('heartRate').optional().isString().trim().isLength({ max: 32 }),
  handleValidation,
  async (req, res) => {
    try {
      const { temperature = null, bloodPressure = null, weight = null, heartRate = null } = req.body || {};
      const [result] = await pool.execute(
        'INSERT INTO vitals (intake_id, temperature, blood_pressure, weight, heart_rate) VALUES (?, ?, ?, ?, ?)',
        [req.params.intakeId, temperature, bloodPressure, weight, heartRate]
      );
      await audit({ patientId: req.patientId, intakeId: req.params.intakeId, action: 'VITALS_SAVED', actorType: 'patient', actorId: req.patientId, ip: req.ip });
      res.status(201).json({ id: result.insertId });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Unable to save vitals' });
    }
  }
);

app.post('/api/patients/:patientId/consent', requirePatientAuth, async (req, res) => {
  try {
    const granted = Boolean(req.body?.granted);
    await pool.execute(
      'UPDATE patients SET consent_status = ?, consent_at = IF(?, NOW(), NULL) WHERE id = ?',
      [granted ? 'granted' : 'revoked', granted, req.patientId]
    );
    await audit({ patientId: req.patientId, action: granted ? 'CONSENT_GRANTED' : 'CONSENT_REVOKED', actorType: 'patient', actorId: req.patientId, ip: req.ip });
    res.json({ ok: true, consentStatus: granted ? 'granted' : 'revoked' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to save consent' });
  }
});

app.post('/api/patients/:patientId/reports', requirePatientAuth, upload.array('reports', 10), async (req, res) => {
  try {
    const patientId = req.patientId;
    const intakeId = req.body.intakeId || null;
    const files = req.files || [];
    if (!files.length) return res.status(400).json({ error: 'No valid report files uploaded' });
    
    const rows = [];
    for (const file of files) {
      const storageUrl = await uploadToStorage(file.path, {
        bucket: process.env.REPORT_BUCKET || 'reports',
        key: `reports/${patientId}/${file.filename}`,
        contentType: file.mimetype
      });
      
      const [result] = await pool.execute(
        'INSERT INTO reports (patient_id, intake_id, original_name, stored_name, mime_type, size_bytes, storage_path, storage_url, ocr_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, "not_started")',
        [patientId, intakeId, file.originalname, file.filename, file.mimetype, file.size, file.path, storageUrl]
      );
      
      if (getStorageType() !== 'local') {
        try { fs.unlinkSync(file.path); } catch (e) {}
      }
      
      rows.push({ id: result.insertId, name: file.originalname, size: file.size, type: file.mimetype, url: storageUrl });
    }
    await audit({ patientId, intakeId, action: 'REPORTS_UPLOADED', metadata: { count: files.length }, actorType: 'patient', actorId: patientId, ip: req.ip });
    res.status(201).json({ files: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to save reports' });
  }
});

app.get('/api/patients/:patientId/reports/:reportId/download', requirePatientAuth, async (req, res) => {
  try {
    const { patientId, reportId } = req.params;
    
    const [rows] = await pool.execute(
      'SELECT * FROM reports WHERE id = ? AND patient_id = ?',
      [reportId, patientId]
    );
    
    if (!rows.length) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    const report = rows[0];
    
    if (report.storage_url && !report.storage_url.startsWith('local://')) {
      const signedUrl = await generateSignedUrl(report.storage_url, 15 * 60);
      return res.json({ url: signedUrl });
    }
    
    const localPath = report.storage_url && report.storage_url.startsWith('local://')
      ? report.storage_url.replace('local://', '')
      : report.storage_path;

    if (localPath && fs.existsSync(localPath)) {
      res.download(path.resolve(localPath), report.original_name);
    } else {
      res.status(404).json({ error: 'File not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to download report' });
  }
});

app.get('/api/patients/:patientId/records', requirePatientAuth, async (req, res) => {
  try {
    const patientId = req.patientId;
    const [intakes] = await pool.execute('SELECT * FROM intakes WHERE patient_id = ? ORDER BY created_at DESC', [patientId]);
    const [reports] = await pool.execute('SELECT id, original_name, mime_type, size_bytes, ocr_status, created_at, storage_url FROM reports WHERE patient_id = ? ORDER BY created_at DESC', [patientId]);
    const [reviews] = await pool.execute(
      `SELECT dr.*, i.chief_complaint, p.patient_code FROM doctor_reviews dr
       JOIN intakes i ON i.id = dr.intake_id JOIN patients p ON p.id = i.patient_id
       WHERE p.id = ? ORDER BY dr.created_at DESC`, [patientId]
    );
    const [audio] = await pool.execute(
      'SELECT id, filename, storage_url, duration_seconds, size_bytes, format, status, created_at FROM audio_recordings WHERE patient_id = ? ORDER BY created_at DESC',
      [patientId]
    );
    res.json({ intakes, reports, reviews, audio });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to load records' });
  }
});

app.post('/api/intakes/:intakeId/doctor-review', requirePatientAuthViaIntake, async (req, res) => {
  try {
    const intakeId = req.params.intakeId;
    const [rows] = await pool.execute(
      `SELECT i.id, i.patient_id, p.consent_status FROM intakes i JOIN patients p ON p.id=i.patient_id WHERE i.id=?`,
      [intakeId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Intake not found' });
    if (rows[0].consent_status !== 'granted') return res.status(403).json({ error: 'Patient consent is required' });
    const [result] = await pool.execute(
      'INSERT INTO doctor_reviews (intake_id, status) VALUES (?, "pending")', [intakeId]
    );
    await pool.execute('UPDATE intakes SET status="doctor_review" WHERE id=?', [intakeId]);
    await audit({ patientId: rows[0].patient_id, intakeId, action: 'SENT_TO_DOCTOR_REVIEW', actorType: 'patient', actorId: req.patientId, ip: req.ip });
    res.status(201).json({ id: result.insertId, status: 'pending' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to create doctor review' });
  }
});

// ============================================================
// AUDIO RECORDING ROUTES
// ============================================================

app.get('/api/patients/:patientId/ws-token', requirePatientAuth, (req, res) => {
  const wsToken = generateWebSocketToken(req.patientId);
  res.json({ wsToken });
});

app.get('/api/patients/:patientId/audio', requirePatientAuth, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, filename, storage_url, duration_seconds, size_bytes, format, status, created_at FROM audio_recordings WHERE patient_id = ? ORDER BY created_at DESC',
      [req.patientId]
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to load audio recordings' });
  }
});

app.get('/api/patients/:patientId/audio/:audioId/play', requirePatientAuth, async (req, res) => {
  try {
    const { patientId, audioId } = req.params;
    
    const [rows] = await pool.execute(
      'SELECT * FROM audio_recordings WHERE id = ? AND patient_id = ?',
      [audioId, patientId]
    );
    
    if (!rows.length) {
      return res.status(404).json({ error: 'Recording not found' });
    }
    
    const audio = rows[0];
    
    if (audio.storage_url && !audio.storage_url.startsWith('local://')) {
      const signedUrl = await generateSignedUrl(audio.storage_url, 30 * 60);
      return res.json({ url: signedUrl });
    }

    const localPath = audio.storage_url && audio.storage_url.startsWith('local://')
      ? audio.storage_url.replace('local://', '')
      : path.join(uploadDir, audio.filename);

    if (localPath && fs.existsSync(localPath)) {
      res.setHeader('Content-Type', `audio/${audio.format || 'wav'}`);
      return res.sendFile(path.resolve(localPath));
    }
    
    res.status(404).json({ error: 'File not found' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to play audio' });
  }
});

// ============================================================
// DOCTOR / ADMIN ROUTES
// ============================================================
app.get('/api/doctor/reviews', requireStaffAuth, requireRole('doctor', 'admin'), async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT dr.id, dr.intake_id, dr.status, dr.doctor_name, dr.notes, dr.created_at, dr.reviewed_at,
              p.id AS patient_id, p.patient_code, p.preferred_language,
              i.chief_complaint, i.duration,
              v.temperature, v.blood_pressure, v.weight, v.heart_rate,
              (SELECT COUNT(*) FROM reports r WHERE r.patient_id = p.id) AS reports_count,
              (SELECT COUNT(*) FROM audio_recordings a WHERE a.patient_id = p.id) AS audio_count
       FROM doctor_reviews dr
       JOIN intakes i ON i.id = dr.intake_id
       JOIN patients p ON p.id = i.patient_id
       LEFT JOIN vitals v ON v.intake_id = i.id
       ORDER BY dr.created_at DESC`
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to load doctor queue' });
  }
});

app.get('/api/doctor/reviews/:reviewId/details', requireStaffAuth, requireRole('doctor', 'admin'), async (req, res) => {
  try {
    const { reviewId } = req.params;
    const [reviewRows] = await pool.execute(
      `SELECT dr.id, dr.intake_id, dr.status, dr.doctor_name, dr.notes, dr.created_at, dr.reviewed_at,
              p.id AS patient_id, p.patient_code, p.preferred_language, p.created_at AS patient_created_at,
              i.chief_complaint, i.duration, i.status AS intake_status,
              v.temperature, v.blood_pressure, v.weight, v.heart_rate
       FROM doctor_reviews dr
       JOIN intakes i ON i.id = dr.intake_id
       JOIN patients p ON p.id = i.patient_id
       LEFT JOIN vitals v ON v.intake_id = i.id
       WHERE dr.id = ?`,
      [reviewId]
    );

    if (!reviewRows.length) return res.status(404).json({ error: 'Review not found' });
    const review = reviewRows[0];

    const [reports] = await pool.execute(
      'SELECT id, original_name, mime_type, size_bytes, ocr_status, created_at, storage_url FROM reports WHERE patient_id = ? ORDER BY created_at DESC',
      [review.patient_id]
    );

    const [audio] = await pool.execute(
      'SELECT id, filename, duration_seconds, size_bytes, format, status, created_at, storage_url FROM audio_recordings WHERE patient_id = ? ORDER BY created_at DESC',
      [review.patient_id]
    );

    const [summaries] = await pool.execute(
      'SELECT id, chief_complaint, history_text, symptoms_text, vitals_text, confidence, ai_status, clinician_verified FROM summaries WHERE intake_id = ?',
      [review.intake_id]
    );

    res.json({
      ...review,
      reports,
      audio,
      summary: summaries[0] || null
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to load review details' });
  }
});

app.get('/api/doctor/reports/:reportId/download', requireStaffAuth, requireRole('doctor', 'admin'), async (req, res) => {
  try {
    const { reportId } = req.params;
    const [rows] = await pool.execute('SELECT * FROM reports WHERE id = ?', [reportId]);
    if (!rows.length) return res.status(404).json({ error: 'Report not found' });
    const report = rows[0];

    await audit({
      patientId: report.patient_id,
      intakeId: report.intake_id,
      action: 'DOCTOR_DOWNLOAD_REPORT',
      metadata: { reportId: report.id },
      actorType: req.user.role,
      actorId: req.user.id,
      ip: req.ip
    });

    if (report.storage_url && !report.storage_url.startsWith('local://')) {
      const signedUrl = await generateSignedUrl(report.storage_url, 15 * 60);
      return res.json({ url: signedUrl });
    }

    const localPath = report.storage_url && report.storage_url.startsWith('local://')
      ? report.storage_url.replace('local://', '')
      : report.storage_path;

    if (localPath && fs.existsSync(localPath)) {
      res.download(path.resolve(localPath), report.original_name);
    } else {
      res.status(404).json({ error: 'File not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to download report' });
  }
});

app.get('/api/doctor/audio/:audioId/play', requireStaffAuth, requireRole('doctor', 'admin'), async (req, res) => {
  try {
    const { audioId } = req.params;
    const [rows] = await pool.execute('SELECT * FROM audio_recordings WHERE id = ?', [audioId]);
    if (!rows.length) return res.status(404).json({ error: 'Audio recording not found' });
    const audio = rows[0];

    await audit({
      patientId: audio.patient_id,
      action: 'DOCTOR_PLAY_AUDIO',
      metadata: { audioId: audio.id },
      actorType: req.user.role,
      actorId: req.user.id,
      ip: req.ip
    });

    if (audio.storage_url && !audio.storage_url.startsWith('local://')) {
      const signedUrl = await generateSignedUrl(audio.storage_url, 30 * 60);
      return res.json({ url: signedUrl });
    }

    const localPath = audio.storage_url && audio.storage_url.startsWith('local://')
      ? audio.storage_url.replace('local://', '')
      : path.join(uploadDir, audio.filename);

    if (localPath && fs.existsSync(localPath)) {
      res.setHeader('Content-Type', `audio/${audio.format || 'wav'}`);
      return res.sendFile(path.resolve(localPath));
    }

    res.status(404).json({ error: 'File not found' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to play audio' });
  }
});

app.patch('/api/doctor/reviews/:reviewId',
  requireStaffAuth,
  requireRole('doctor', 'admin'),
  param('reviewId').isInt(),
  body('status').isIn(['pending', 'in_review', 'approved', 'rejected']),
  body('notes').optional().isString().trim().isLength({ max: 4000 }),
  handleValidation,
  async (req, res) => {
    try {
      const { status, notes = null } = req.body || {};
      await pool.execute(
        'UPDATE doctor_reviews SET status=?, doctor_name=COALESCE(?, doctor_name), notes=COALESCE(?, notes), reviewed_at=IF(? IN ("approved","rejected"), NOW(), reviewed_at) WHERE id=?',
        [status, req.user.username, notes, status, req.params.reviewId]
      );
      await audit({ action: 'DOCTOR_REVIEW_UPDATED', metadata: { reviewId: req.params.reviewId, status }, actorType: req.user.role, actorId: req.user.id, ip: req.ip });
      res.json({ ok: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Unable to update review' });
    }
  }
);

app.get('/api/dashboard/stats', async (_req, res) => {
  try {
    const [[patients]] = await pool.query('SELECT COUNT(*) AS count FROM patients');
    const [[intakes]] = await pool.query('SELECT COUNT(*) AS count FROM intakes');
    const [[reports]] = await pool.query('SELECT COUNT(*) AS count FROM reports');
    const [[pending]] = await pool.query('SELECT COUNT(*) AS count FROM doctor_reviews WHERE status="pending"');
    const [[audio]] = await pool.query('SELECT COUNT(*) AS count FROM audio_recordings');
    res.json({ 
      patients: patients.count, 
      intakes: intakes.count, 
      reports: reports.count, 
      pendingReviews: pending.count,
      audioRecordings: audio.count 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to load dashboard stats' });
  }
});

app.get(/.*/, (req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));

// Centralized error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// --- Start Server with WebSocket support ---
const server = app.listen(PORT, () => {
  console.log(`ChikitsaKendra AI running at http://localhost:${PORT}`);
  console.log(`WebSocket server running at ws://localhost:${PORT}`);
});

setupWebSocketServer(server);

module.exports = { app, server };