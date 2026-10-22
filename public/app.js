/* ChikitsaKendra AI - Professional Full-Stack Integration Layer */
(() => {
  const state = {
    patientId: null,
    patientCode: null,
    intakeId: null,
    consent: false,
    sessionToken: null,
    wsToken: null
  };

  function getStaffToken() { return sessionStorage.getItem('chikitsaStaffToken'); }
  function setStaffToken(t) { t ? sessionStorage.setItem('chikitsaStaffToken', t) : sessionStorage.removeItem('chikitsaStaffToken'); }

  // `auth` = 'patient' (sends patient session token), 'staff' (sends doctor/admin JWT), or 'none'.
  const api = async (url, options = {}) => {
    const { auth = 'patient', headers = {}, ...rest } = options;
    const finalHeaders = { ...headers };
    if (auth === 'patient' && state.sessionToken) finalHeaders.Authorization = `Bearer ${state.sessionToken}`;
    if (auth === 'staff') {
      const token = getStaffToken();
      if (token) finalHeaders.Authorization = `Bearer ${token}`;
    }
    const response = await fetch(url, { ...rest, headers: finalHeaders });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
    return data;
  };

  function toastMessage(message) {
    if (typeof toast === 'function') return toast(message);
    alert(message);
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value || '—';
  }

  function applyPreferredLanguage(language) {
    const buttons = [...document.querySelectorAll('.lang-group button')];
    const supportedLanguages = buttons.map(button => button.textContent.trim());
    const selectedLanguage = supportedLanguages.includes(language) ? language : 'English';
    buttons.forEach(button => {
      button.classList.toggle('active', button.textContent.trim() === selectedLanguage);
    });
    if (typeof window.applyTranslations === 'function') window.applyTranslations(selectedLanguage);
    return selectedLanguage;
  }

  async function boot() {
    try {
      const saved = localStorage.getItem('chikitsaPatient');
      if (saved) Object.assign(state, JSON.parse(saved));
      let preferredLanguage = localStorage.getItem('chikitsaPreferredLanguage') ||
        document.querySelector('.lang-group .active')?.textContent?.trim() || 'English';
      preferredLanguage = applyPreferredLanguage(preferredLanguage);
      if (!state.patientId || !state.sessionToken) {
        const patient = await api('/api/patients/anonymous', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, auth: 'none',
          body: JSON.stringify({ preferredLanguage })
        });
        Object.assign(state, {
          patientId: patient.id,
          patientCode: patient.patientCode,
          sessionToken: patient.sessionToken,
          wsToken: patient.wsToken
        });
        localStorage.setItem('chikitsaPatient', JSON.stringify(state));
      }
      const patient = await api(`/api/patients/${state.patientId}`);
      preferredLanguage = localStorage.getItem('chikitsaPreferredLanguage') || patient.preferred_language || preferredLanguage;
      preferredLanguage = applyPreferredLanguage(preferredLanguage);
      localStorage.setItem('chikitsaPreferredLanguage', preferredLanguage);
      state.consent = patient.consent_status === 'granted';
      localStorage.setItem('chikitsaPatient', JSON.stringify(state));
      const label = document.querySelector('.user-meta strong');
      if (label && state.patientCode) label.textContent = `Patient ${state.patientCode}`;
      await refreshStats();
      await loadPatientRecords();
    } catch (error) {
      console.error(error);
      if (String(error.message).includes('Invalid patient session')) {
        localStorage.removeItem('chikitsaPatient');
      }
    }
  }

  async function refreshStats() {
    try {
      const stats = await api('/api/dashboard/stats', { auth: 'none' });
      const values = document.querySelectorAll('.stat strong');
      if (values[0]) values[0].textContent = stats.patients;
      if (values[1]) values[1].textContent = stats.intakes;
      if (values[2]) values[2].textContent = stats.reports;
      if (values[4]) values[4].textContent = stats.pendingReviews;
    } catch (_) {}
  }

  async function loadPatientRecords() {
    if (!state.patientId) return;
    try {
      const records = await api(`/api/patients/${state.patientId}/records`);
      // Update reports list in UI if exists
      const reportListEl = document.getElementById('fileList');
      if (reportListEl && records.reports && records.reports.length > 0) {
        reportListEl.innerHTML = records.reports.map(r => `
          <div style="padding:8px 12px;background:var(--teal-soft);border:1px solid var(--border);border-radius:8px;margin-top:6px;display:flex;justify-content:space-between;align-items:center;">
            <span>📄 <strong>${r.original_name}</strong> <small style="color:var(--muted)">(${(r.size_bytes/1024).toFixed(1)} KB)</small></span>
            <a href="/api/patients/${state.patientId}/reports/${r.id}/download" target="_blank" style="color:var(--teal-dark);font-weight:600;font-size:12px;">Download ↓</a>
          </div>
        `).join('');
      }
    } catch (_) {}
  }

  // ---- Patient Actions ----

  window.saveSymptom = async function saveSymptomWithMySQL() {
    const input = document.getElementById('symptom');
    const value = input?.value?.trim();
    if (!value) return toastMessage('Please describe your main health concern first.');
    if (!state.patientId) return toastMessage('Database session is not ready yet. Please try again.');
    try {
      const result = await api('/api/intakes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chiefComplaint: value })
      });
      state.intakeId = result.id;
      localStorage.setItem('chikitsaPatient', JSON.stringify(state));
      setText('summaryComplaint', value);
      setText('fullComplaint', value);
      setText('historyComplaint', value);
      toastMessage('✓ Intake saved securely.');
      if (typeof showPage === 'function') showPage('history');
      await refreshStats();
    } catch (error) {
      toastMessage(error.message);
    }
  };

  window.giveConsent = async function giveConsentWithMySQL() {
    if (!state.patientId) return toastMessage('Database session is not ready yet.');
    try {
      const result = await api(`/api/patients/${state.patientId}/consent`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ granted: true })
      });
      state.consent = result.consentStatus === 'granted';
      localStorage.setItem('chikitsaPatient', JSON.stringify(state));
      toastMessage('✓ Consent recorded securely in database.');
    } catch (error) { toastMessage(error.message); }
  };

  window.fileSelected = async function uploadReportsWithMySQL(input) {
    if (!input?.files?.length) return;
    if (!state.patientId) return toastMessage('Database session is not ready yet.');
    const form = new FormData();
    [...input.files].forEach(file => form.append('reports', file));
    if (state.intakeId) form.append('intakeId', state.intakeId);
    try {
      const result = await api(`/api/patients/${state.patientId}/reports`, { method: 'POST', body: form });
      toastMessage(`✓ ${result.files.length} document(s) uploaded successfully.`);
      await loadPatientRecords();
      await refreshStats();
    } catch (error) { toastMessage(error.message); }
  };

  window.sendDoctorReview = async function sendDoctorReviewWithMySQL() {
    if (!state.intakeId) return toastMessage('Please save your symptoms intake before sending for review.');
    if (!state.consent) return toastMessage('Please grant patient consent before sending for review.');
    try {
      await api(`/api/intakes/${state.intakeId}/doctor-review`, { method: 'POST' });
      toastMessage('✓ Intake successfully queued for clinician review.');
      await refreshStats();
      if (typeof showPage === 'function') showPage('doctor');
    } catch (error) { toastMessage(error.message); }
  };

  window.changeLanguage = async function changeLanguageWithMySQL(_button, language) {
    const selectedLanguage = applyPreferredLanguage(language);
    localStorage.setItem('chikitsaPreferredLanguage', selectedLanguage);
    if (state.patientId) {
      try {
        await api(`/api/patients/${state.patientId}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ preferredLanguage: selectedLanguage })
        });
        toastMessage(`Language set to: ${selectedLanguage}`);
      } catch (error) { toastMessage(`Language changed: ${selectedLanguage}`); }
    } else toastMessage(`Language set to: ${selectedLanguage}`);
  };

  // ============================================================
  // WEBSOCKET REAL-TIME AUDIO STREAMING IN BROWSER
  // ============================================================
  let isRecording = false;
  let activeMediaStream = null;
  let activeMediaRecorder = null;
  let activeWebSocket = null;
  let recordingTimer = null;
  let recordingSeconds = 0;
  let chunkSequence = 0;
  let speechRecognizer = null;

  async function getFreshWsToken() {
    if (!state.patientId) return null;
    try {
      const res = await api(`/api/patients/${state.patientId}/ws-token`);
      state.wsToken = res.wsToken;
      localStorage.setItem('chikitsaPatient', JSON.stringify(state));
      return res.wsToken;
    } catch (_) {
      return state.wsToken;
    }
  }

  window.toggleAudioRecording = async function toggleAudioRecording() {
    if (isRecording) {
      await stopAudioRecording();
    } else {
      await startAudioRecording();
    }
  };

  window.startListening = window.toggleAudioRecording;
  window.voiceInput = window.toggleAudioRecording;

  async function startAudioRecording() {
    if (!state.patientId) {
      toastMessage('Session initializing. Please wait a moment...');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      activeMediaStream = stream;

      const wsToken = await getFreshWsToken();
      if (!wsToken) throw new Error('Could not obtain audio token');

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}?token=${wsToken}`;
      activeWebSocket = new WebSocket(wsUrl);

      activeWebSocket.onopen = () => {
        chunkSequence = 0;
        activeWebSocket.send(JSON.stringify({
          type: 'audio-start',
          payload: {
            sessionId: `sess-${Date.now()}`,
            metadata: { sampleRate: 16000, mimeType: 'audio/webm' }
          }
        }));
      };

      activeWebSocket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'audio-completed') {
            toastMessage(`✓ Voice audio saved (ID #${msg.payload.recordingId})`);
            loadPatientRecords();
            refreshStats();
          }
        } catch (_) {}
      };

      // Set up MediaRecorder
      const options = { mimeType: 'audio/webm' };
      activeMediaRecorder = MediaRecorder.isTypeSupported('audio/webm')
        ? new MediaRecorder(stream, options)
        : new MediaRecorder(stream);

      activeMediaRecorder.ondataavailable = async (e) => {
        if (e.data && e.data.size > 0 && activeWebSocket && activeWebSocket.readyState === WebSocket.OPEN) {
          const buffer = await e.data.arrayBuffer();
          const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
          chunkSequence++;
          activeWebSocket.send(JSON.stringify({
            type: 'audio-chunk',
            payload: { chunk: base64, sequence: chunkSequence, timestamp: Date.now() }
          }));
        }
      };

      activeMediaRecorder.start(250); // Emit chunk every 250ms
      isRecording = true;
      recordingSeconds = 0;

      // Update UI state
      const heroMic = document.getElementById('heroMic');
      const voiceText = document.getElementById('voiceText');
      const voiceStatus = document.getElementById('voiceStatus');
      if (heroMic) heroMic.classList.add('listening');

      recordingTimer = setInterval(() => {
        recordingSeconds++;
        const timeStr = `${String(Math.floor(recordingSeconds / 60)).padStart(2, '0')}:${String(recordingSeconds % 60).padStart(2, '0')}`;
        if (voiceText) voiceText.innerHTML = `<span style="color:#ef4444;">● REC ${timeStr}</span> (Tap to Stop)`;
        if (voiceStatus) voiceStatus.innerHTML = `<span style="color:#ef4444;">● Recording ${timeStr}</span>`;
      }, 1000);

      // Optional: Speech recognition speech-to-text
      const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRec) {
        try {
          speechRecognizer = new SpeechRec();
          speechRecognizer.lang = 'en-IN';
          speechRecognizer.continuous = true;
          speechRecognizer.interimResults = true;
          speechRecognizer.onresult = (ev) => {
            const transcript = Array.from(ev.results).map(r => r[0].transcript).join(' ');
            const symptomBox = document.getElementById('symptom');
            if (symptomBox && transcript) symptomBox.value = transcript;
          };
          speechRecognizer.start();
        } catch (_) {}
      }

      toastMessage('🎙 Recording voice audio...');
    } catch (err) {
      console.warn('Microphone recording error:', err);
      toastMessage('Microphone access unavailable or denied.');
    }
  }

  async function stopAudioRecording() {
    isRecording = false;
    clearInterval(recordingTimer);

    if (activeMediaRecorder && activeMediaRecorder.state !== 'inactive') {
      activeMediaRecorder.stop();
    }
    if (activeMediaStream) {
      activeMediaStream.getTracks().forEach(t => t.stop());
      activeMediaStream = null;
    }
    if (speechRecognizer) {
      try { speechRecognizer.stop(); } catch (_) {}
      speechRecognizer = null;
    }

    if (activeWebSocket && activeWebSocket.readyState === WebSocket.OPEN) {
      activeWebSocket.send(JSON.stringify({
        type: 'audio-end',
        payload: { finalize: true, format: 'wav', duration: recordingSeconds }
      }));
      setTimeout(() => {
        if (activeWebSocket) activeWebSocket.close();
      }, 1000);
    }

    const heroMic = document.getElementById('heroMic');
    const voiceText = document.getElementById('voiceText');
    const voiceStatus = document.getElementById('voiceStatus');
    if (heroMic) heroMic.classList.remove('listening');
    if (voiceText) voiceText.textContent = 'Voice Audio Saved ✓';
    if (voiceStatus) voiceStatus.textContent = 'Voice recording captured ✓';
  }

  // ============================================================
  // DOCTOR / STAFF AUTH & CLINICIAN WORKFLOW
  // ============================================================

  window.staffLogin = async function staffLogin() {
    const username = document.getElementById('staffUsername')?.value?.trim();
    const password = document.getElementById('staffPassword')?.value;
    const errEl = document.getElementById('staffLoginError');
    if (errEl) errEl.textContent = '';
    if (!username || !password) { if (errEl) errEl.textContent = 'Enter username and password.'; return; }
    try {
      const result = await api('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, auth: 'none',
        body: JSON.stringify({ username, password })
      });
      setStaffToken(result.token);
      sessionStorage.setItem('chikitsaStaffUsername', username);
      await window.onEnterDoctorPage();
    } catch (error) {
      if (errEl) errEl.textContent = error.message;
    }
  };

  window.staffLogout = function staffLogout() {
    setStaffToken(null);
    window.onEnterDoctorPage();
  };

  function renderQueue(reviews) {
    const body = document.getElementById('doctorLiveQueueBody');
    if (!body) return;
    if (!reviews.length) {
      body.innerHTML = `
        <div class="card" style="padding:32px;text-align:center;color:var(--muted);">
          <div style="font-size:32px;margin-bottom:8px;">✅</div>
          <h3>Doctor Review Queue Empty</h3>
          <p>All submitted patient clinical intakes have been processed.</p>
        </div>`;
      return;
    }

    body.innerHTML = reviews.map(r => {
      const statusBadge =
        r.status === 'approved' ? '<span class="badge badge-green">✓ Approved</span>' :
        r.status === 'in_review' ? '<span class="badge badge-blue">⏳ In Review</span>' :
        r.status === 'rejected' ? '<span class="badge badge-red">✗ Rejected</span>' :
        '<span class="badge badge-orange">● Pending Review</span>';

      const hasVitals = r.temperature || r.blood_pressure || r.heart_rate || r.weight;
      const vitalsHtml = hasVitals ? `
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin:8px 0;padding:8px 12px;background:var(--bg);border-radius:8px;font-size:12px;">
          ${r.temperature ? `<span>🌡️ <strong>${r.temperature}</strong></span>` : ''}
          ${r.blood_pressure ? `<span>🩺 <strong>${r.blood_pressure}</strong></span>` : ''}
          ${r.heart_rate ? `<span>💓 <strong>${r.heart_rate}</strong></span>` : ''}
          ${r.weight ? `<span>⚖️ <strong>${r.weight}</strong></span>` : ''}
        </div>` : '<div style="color:var(--muted);font-size:12px;margin:4px 0;">No vitals recorded</div>';

      return `
        <div class="card" style="margin-bottom:16px;border-left:4px solid var(--teal);">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;">
            <div>
              <div style="display:flex;align-items:center;gap:8px;">
                <h3 style="margin:0;font-size:16px;">${r.patient_code}</h3>
                <span style="font-size:11px;color:var(--muted);">Lang: ${r.preferred_language || 'English'}</span>
              </div>
              <p style="margin:6px 0 2px;font-size:14px;color:var(--text);"><strong>Complaint:</strong> ${r.chief_complaint || '—'} <span style="color:var(--muted)">(${r.duration || 'duration unrecorded'})</span></p>
            </div>
            <div>${statusBadge}</div>
          </div>

          ${vitalsHtml}

          <div style="display:flex;gap:16px;font-size:12px;color:var(--muted);margin:8px 0;">
            <span>📄 Reports: <strong>${r.reports_count || 0}</strong></span>
            <span>🎙️ Voice Audio: <strong>${r.audio_count || 0}</strong></span>
            ${r.doctor_name ? `<span>Reviewed by: <strong>${r.doctor_name}</strong></span>` : ''}
          </div>

          <!-- Expandable Case Details -->
          <details style="margin:10px 0;background:#f9fcfb;padding:8px 12px;border:1px solid var(--border);border-radius:8px;">
            <summary style="cursor:pointer;font-weight:600;font-size:12px;color:var(--teal-dark);" onclick="window.loadDoctorDossier(${r.id})">
              🔍 Inspect Attached Records &amp; Audio
            </summary>
            <div id="dossier_${r.id}" style="padding-top:10px;font-size:13px;">
              <p style="color:var(--muted);">Loading details...</p>
            </div>
          </details>

          <!-- Doctor Notes & Actions -->
          <div style="margin-top:12px;padding-top:10px;border-top:1px solid var(--border);">
            <input type="text" id="docNotes_${r.id}" value="${r.notes || ''}" placeholder="Enter clinical observations or notes..."
                   style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:6px;font-size:13px;margin-bottom:8px;box-sizing:border-box;">
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <button data-review-id="${r.id}" data-status="in_review" class="action-btn" style="padding:6px 14px;font-size:12px;background:var(--blue-soft);color:var(--blue);">
                ⏳ In Review
              </button>
              <button data-review-id="${r.id}" data-status="approved" class="action-btn" style="padding:6px 14px;font-size:12px;background:var(--green-soft);color:var(--green);font-weight:700;">
                ✓ Approve Summary
              </button>
              <button data-review-id="${r.id}" data-status="rejected" class="action-btn" style="padding:6px 14px;font-size:12px;background:var(--red-soft);color:var(--red);">
                ✗ Reject
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    body.querySelectorAll('button[data-review-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.reviewId;
        const status = btn.dataset.status;
        const notes = document.getElementById(`docNotes_${id}`)?.value || '';
        updateReview(id, status, notes);
      });
    });
  }

  window.loadDoctorDossier = async function loadDoctorDossier(reviewId) {
    const el = document.getElementById(`dossier_${reviewId}`);
    if (!el || el.dataset.loaded) return;
    try {
      const data = await api(`/api/doctor/reviews/${reviewId}/details`, { auth: 'staff' });
      el.dataset.loaded = 'true';

      let reportsHtml = '<p style="color:var(--muted);font-size:12px;">No reports uploaded</p>';
      if (data.reports && data.reports.length > 0) {
        reportsHtml = data.reports.map(rep => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 8px;background:white;border:1px solid var(--border);border-radius:4px;margin-bottom:4px;">
            <span>📄 ${rep.original_name}</span>
            <a href="/api/doctor/reports/${rep.id}/download" target="_blank" style="color:var(--teal-dark);font-weight:600;font-size:12px;">Download Document ↓</a>
          </div>
        `).join('');
      }

      let audioHtml = '<p style="color:var(--muted);font-size:12px;">No audio voice recordings</p>';
      if (data.audio && data.audio.length > 0) {
        audioHtml = data.audio.map(aud => `
          <div style="margin-bottom:6px;background:white;padding:6px 8px;border:1px solid var(--border);border-radius:4px;">
            <div style="font-size:11px;color:var(--muted);margin-bottom:2px;">🎙️ Recording #${aud.id} (${aud.duration_seconds || 0}s)</div>
            <audio controls src="/api/doctor/audio/${aud.id}/play" style="width:100%;height:32px;"></audio>
          </div>
        `).join('');
      }

      el.innerHTML = `
        <div style="margin-bottom:8px;"><strong>Diagnostic Reports:</strong>${reportsHtml}</div>
        <div><strong>Patient Voice Audio:</strong>${audioHtml}</div>
      `;
    } catch (err) {
      el.innerHTML = `<span style="color:var(--red);">Failed to load dossier: ${err.message}</span>`;
    }
  };

  async function updateReview(reviewId, status, notes = '') {
    try {
      await api(`/api/doctor/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        auth: 'staff',
        body: JSON.stringify({ status, notes })
      });
      toastMessage(`✓ Review status updated to "${status}"`);
      await window.onEnterDoctorPage();
      await refreshStats();
    } catch (error) { toastMessage(error.message); }
  }

  window.onEnterDoctorPage = async function onEnterDoctorPage() {
    const gate = document.getElementById('doctorAuthGate');
    const live = document.getElementById('doctorLiveQueue');
    if (!gate || !live) return;
    if (!getStaffToken()) {
      gate.style.display = 'flex';
      live.style.display = 'none';
      return;
    }
    try {
      const reviews = await api('/api/doctor/reviews', { auth: 'staff' });
      gate.style.display = 'none';
      live.style.display = 'block';

      const username = sessionStorage.getItem('chikitsaStaffUsername') || 'Doctor';
      const initials = username.slice(0, 2).toUpperCase();
      const nameEl = document.getElementById('docProfileName');
      const initEl = document.getElementById('docProfileInitials');
      if (nameEl) nameEl.textContent = username;
      if (initEl) initEl.textContent = initials;
      renderQueue(reviews);
    } catch (error) {
      setStaffToken(null);
      gate.style.display = 'flex';
      live.style.display = 'none';
    }
  };

  document.addEventListener('DOMContentLoaded', boot);
})();
