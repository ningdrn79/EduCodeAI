/**
 * Kreator Cilik - Aplikasi Pembelajaran Konten Digital & Berpikir Komputasional
 * Kelas 4 SD Semester 1 (TP 2.1 - TP 2.4)
 */

// ==========================================
// 0. KONSTANTA PENYIMPANAN SESI & DATABASE RESMI
// ==========================================
const DB_STORAGE_KEY = 'educode_student_db_v1';
const ACTIVE_STUDENT_KEY = 'educode_active_student_v1';
const GURU_PIN_KEY = 'educode_guru_pin_v1';
const WEBHOOK_KEY = 'educode_guru_webhook_v1';
const SPREADSHEET_ID_KEY = 'educode_guru_sheet_id_v1';
const SHEET_TAB_NAME_KEY = 'educode_lms_sheet_tab_name_v1';
const DEFAULT_SHEET_TAB_NAME = 'DATA SISWA LMS';
const DEFAULT_GURU_PIN = '1234';
const CLASS_SHEETS_KEY = 'educode_class_sheets_map_v1';
const CLASS_SHEET_ACTIVE_TAB_KEY = 'educode_class_sheet_active_tab_v1';
const ACTIVE_TAB_KEY = 'educode_student_active_tab_v1';
const ACTIVE_SEM_KEY = 'educode_student_active_sem_v1';
const TEACHER_SESSION_KEY = 'educode_teacher_session_v1';
const SEMESTER_2_UNLOCKED_KEY = 'educode_semester_2_unlocked_v1';

// Helper: Cek Status Sesi Guru Aktif (Multi-Lapisan: window, localStorage, sessionStorage, Cookie)
function isTeacherSessionActive() {
  if (window.__TEACHER_SESSION_ACTIVE__ === true) return true;
  try {
    const ls = localStorage.getItem(TEACHER_SESSION_KEY);
    if (ls === 'ACTIVE') return true;
  } catch (e) {}
  try {
    const ss = sessionStorage.getItem(TEACHER_SESSION_KEY);
    if (ss === 'ACTIVE') return true;
  } catch (e) {}
  try {
    const m = document.cookie.match(new RegExp('(?:^|;\\s*)' + TEACHER_SESSION_KEY + '=([^;]+)'));
    if (m && m[1] === 'ACTIVE') return true;
  } catch (e) {}
  return false;
}
window.isTeacherSessionActive = isTeacherSessionActive;

// Helper: Simpan atau Hapus Sesi Guru (Multi-Lapisan)
function setTeacherSessionActive(isActive) {
  window.__TEACHER_SESSION_ACTIVE__ = !!isActive;
  if (typeof state !== 'undefined') {
    state.isGuruLoggedIn = !!isActive;
  }
  if (isActive) {
    try { localStorage.setItem(TEACHER_SESSION_KEY, 'ACTIVE'); } catch (e) {}
    try { sessionStorage.setItem(TEACHER_SESSION_KEY, 'ACTIVE'); } catch (e) {}
    try {
      const d = new Date();
      d.setTime(d.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 hari
      document.cookie = `${TEACHER_SESSION_KEY}=ACTIVE;expires=${d.toUTCString()};path=/;SameSite=Lax`;
    } catch (e) {}
  } else {
    try { localStorage.removeItem(TEACHER_SESSION_KEY); } catch (e) {}
    try { sessionStorage.removeItem(TEACHER_SESSION_KEY); } catch (e) {}
    try {
      document.cookie = `${TEACHER_SESSION_KEY}=LOGGED_OUT;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;SameSite=Lax`;
    } catch (e) {}
    const earlyGuruStyle = document.getElementById('style-early-teacher-session');
    if (earlyGuruStyle) {
      earlyGuruStyle.remove();
    }
  }
}
window.setTeacherSessionActive = setTeacherSessionActive;

// Helper: Ambil Profil Siswa Aktif (Dukungan Multi-Lapisan: window, localStorage, sessionStorage, Cookie)
function getActiveStudentProfile() {
  try {
    // 1. Cek cache memori window
    if (window.__ACTIVE_STUDENT_PROFILE__ && (window.__ACTIVE_STUDENT_PROFILE__.nama || window.__ACTIVE_STUDENT_PROFILE__.nis || window.__ACTIVE_STUDENT_PROFILE__.id)) {
      if (window.__ACTIVE_STUDENT_PROFILE__.nama && window.__ACTIVE_STUDENT_PROFILE__.nama.startsWith('Siswa ') && window.__ACTIVE_STUDENT_PROFILE__.nama.includes('(')) {
        clearActiveStudentSession();
        return null;
      }
      return window.__ACTIVE_STUDENT_PROFILE__;
    }

    let raw = null;

    // 2. Cek localStorage secara terisolasi
    try {
      const ls = localStorage.getItem(ACTIVE_STUDENT_KEY);
      if (ls && ls !== 'LOGGED_OUT' && ls !== 'null' && ls !== 'undefined') {
        raw = ls;
      }
    } catch (eLs) {}

    // 3. Cek sessionStorage secara terisolasi
    if (!raw) {
      try {
        const ss = sessionStorage.getItem(ACTIVE_STUDENT_KEY);
        if (ss && ss !== 'LOGGED_OUT' && ss !== 'null' && ss !== 'undefined') {
          raw = ss;
        }
      } catch (eSs) {}
    }

    // 4. Cek document.cookie sebagai pengaman cadangan peramban
    if (!raw) {
      try {
        const m = document.cookie.match(new RegExp('(?:^|;\\s*)' + ACTIVE_STUDENT_KEY + '=([^;]+)'));
        if (m && m[1]) {
          const ck = decodeURIComponent(m[1]);
          if (ck && ck !== 'LOGGED_OUT' && ck !== 'null' && ck !== 'undefined') {
            raw = ck;
          }
        }
      } catch (eCk) {}
    }

    if (!raw || raw === 'LOGGED_OUT' || raw === 'null' || raw === 'undefined') {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (parsed && (parsed.nama || parsed.nis || parsed.id)) {
      if (parsed.nama && parsed.nama.startsWith('Siswa ') && parsed.nama.includes('(')) {
        clearActiveStudentSession();
        return null;
      }
      window.__ACTIVE_STUDENT_PROFILE__ = parsed;
      // Sinkronkan ke seluruh penyimpanan agar selalu persisten di reload (F5)
      try { localStorage.setItem(ACTIVE_STUDENT_KEY, raw); } catch (e) {}
      try { sessionStorage.setItem(ACTIVE_STUDENT_KEY, raw); } catch (e) {}
      try { document.cookie = ACTIVE_STUDENT_KEY + '=' + encodeURIComponent(raw) + '; path=/; max-age=31536000'; } catch (e) {}
      return parsed;
    }
    return null;
  } catch (e) {
    return null;
  }
}
window.getActiveStudentProfile = getActiveStudentProfile;

// Helper: Simpan Sesi Siswa Aktif ke Seluruh Lapisan Penyimpanan
function saveActiveStudentSession(profile, targetTab = null) {
  if (!profile) return;
  window.__ACTIVE_STUDENT_PROFILE__ = profile;
  const raw = JSON.stringify(profile);
  try { localStorage.setItem(ACTIVE_STUDENT_KEY, raw); } catch (e) {}
  try { sessionStorage.setItem(ACTIVE_STUDENT_KEY, raw); } catch (e) {}
  try { document.cookie = ACTIVE_STUDENT_KEY + '=' + encodeURIComponent(raw) + '; path=/; max-age=31536000'; } catch (e) {}

  if (targetTab) {
    try { localStorage.setItem(ACTIVE_TAB_KEY, targetTab); } catch (e) {}
    try { sessionStorage.setItem(ACTIVE_TAB_KEY, targetTab); } catch (e) {}
  }
  try { localStorage.setItem(ACTIVE_SEM_KEY, String(state.currentSemester || 1)); } catch (e) {}
  try { sessionStorage.setItem(ACTIVE_SEM_KEY, String(state.currentSemester || 1)); } catch (e) {}
}
window.saveActiveStudentSession = saveActiveStudentSession;

// Helper: Bersihkan Sesi Siswa Aktif (HANYA Saat Siswa Sengaja Mengklik Tombol Keluar)
function clearActiveStudentSession() {
  window.__ACTIVE_STUDENT_PROFILE__ = null;
  window.__ACTIVE_STUDENT_RESTORED__ = null;
  try { localStorage.removeItem(ACTIVE_STUDENT_KEY); } catch (e) {}
  try { sessionStorage.removeItem(ACTIVE_STUDENT_KEY); } catch (e) {}
  try { localStorage.setItem(ACTIVE_STUDENT_KEY, 'LOGGED_OUT'); } catch (e) {}
  try { sessionStorage.setItem(ACTIVE_STUDENT_KEY, 'LOGGED_OUT'); } catch (e) {}
  try { document.cookie = ACTIVE_STUDENT_KEY + '=LOGGED_OUT; path=/; max-age=0'; } catch (e) {}
  try { localStorage.removeItem(ACTIVE_TAB_KEY); } catch (e) {}
  try { sessionStorage.removeItem(ACTIVE_TAB_KEY); } catch (e) {}
  try { localStorage.removeItem(ACTIVE_SEM_KEY); } catch (e) {}
  try { sessionStorage.removeItem(ACTIVE_SEM_KEY); } catch (e) {}

  const earlyStyle = document.getElementById('style-early-student-session');
  if (earlyStyle) earlyStyle.remove();
  const cardsSiswa = document.getElementById('beranda-fitur-cards-siswa');
  if (cardsSiswa) cardsSiswa.classList.add('hidden');
}
window.clearActiveStudentSession = clearActiveStudentSession;

// ==========================================
// 1. STATE & SOUND SYNTHESIZER (WEB AUDIO API)
// ==========================================
let state = {
  currentSemester: 1, // 1 (Konten Digital & MS Word) atau 2 (Coding Scratch & AI)
  currentTab: 'beranda',
  currentModul: 'tp1',
  currentModulSem2: 'tp5',
  currentDemo: 'demo-tp1',
  currentPraktik: 'praktik-tp1',
  userPoints: 0,
  ttsEnabled: true,
  // Praktik 1 State
  p1Mode: 'teks',
  p1BrushColor: '#000000',
  p1IsDrawing: false,
  // Praktik 2 State
  p2SelectedItem: null,
  p2Items: {
    'p2-item-1': { type: 'teks', label: '"HEMAT ENERGI LISTRIK"' },
    'p2-item-2': { type: 'gambar', label: '💡 [Ikon Lampu Bohlam Hemat]' },
    'p2-item-3': { type: 'teks', label: '"Matikan saklar saat tidak dipakai untuk cegah boros listrik."' },
    'p2-item-4': { type: 'gambar', label: '🔌 [Ikon Cabut Colokan Kabel]' }
  },
  p2PlacedCount: 0,
  // Praktik 3 State (Poster)
  posterBg: 'blue',
  posterIcon: 'fa-book-open',
  // Kuis State
  currentQuizIndex: 0,
  quizScore: 0,
  quizAnswered: false,
  // Coding & AI Simulator State (Semester 2)
  codingBlocks: [],
  codingRobotX: 0,
  codingRobotY: 0,
  codingRobotRot: 0,
  isExecutingCode: false,
  // Dasbor Guru State
  isGuruLoggedIn: typeof isTeacherSessionActive === 'function' ? isTeacherSessionActive() : false,
  modePenilaianGuru: 1 // 1: Semester 1 (Word & Excel), 2: Semester 2 (Scratch & RoboMind), 'semua': Rekap Gabungan
};

// Web Audio Effects (Synthesizer, tanpa butuh aset audio luar)
const audioCtx = (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined')
  ? new (window.AudioContext || window.webkitAudioContext)()
  : null;

function playSound(type) {
  try {
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === 'click') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'success') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'error') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.setValueAtTime(200, now + 0.1);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'fanfare') {
      // Kemenangan sertifikat
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.connect(g);
        g.connect(audioCtx.destination);
        o.type = 'triangle';
        o.frequency.setValueAtTime(freq, now + idx * 0.12);
        g.gain.setValueAtTime(0.15, now + idx * 0.12);
        g.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.12 + 0.25);
        o.start(now + idx * 0.12);
        o.stop(now + idx * 0.12 + 0.25);
      });
    }
  } catch (err) {
    // Audio context error safe fallback
  }
}

// ==========================================
// 2. SISTEM POIN & NOTIFIKASI TOAST
// ==========================================
// 2. SISTEM POIN, I18N, & NOTIFIKASI TOAST
// ==========================================
function tambahPoin(jumlah) {
  state.userPoints += jumlah;
  const p1 = document.getElementById('user-points');
  if (p1) p1.innerText = state.userPoints;
  const p2 = document.getElementById('user-points-sem1');
  if (p2) p2.innerText = state.userPoints;
  const wb = document.getElementById('welcome-siswa-bintang');
  if (wb) wb.innerText = state.userPoints;
  playSound('success');

  // Sinkronkan poin ke identitas siswa di database
  if (typeof syncPoinSiswaKeDb === 'function') {
    syncPoinSiswaKeDb(state.userPoints);
  }
}

function showToast(pesan, tipe = 'info') {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toast-msg');
  const toastIcon = document.getElementById('toast-icon');

  toastMsg.innerText = pesan;
  if (tipe === 'success') {
    toastIcon.className = 'fa-solid fa-star text-yellow-400 text-lg';
  } else if (tipe === 'error') {
    toastIcon.className = 'fa-solid fa-circle-exclamation text-rose-400 text-lg';
  } else {
    toastIcon.className = 'fa-solid fa-bell text-blue-400 text-lg';
  }

  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3200);
}

function beriPoinPraktik(nomor, pesan) {
  tambahPoin(25);
  showToast(`${pesan} (+25 Bintang!)`, 'success');

  // Catat kemajuan tantangan di Database Guru
  if (nomor === 'excel' && typeof catatLatihanExcelSiswa === 'function') {
    catatLatihanExcelSiswa();
  }
}

// ==========================================
// 3. TEXT-TO-SPEECH (WEB SPEECH API) & SOUND
// ==========================================
function toggleAudioNarration() {
  state.ttsEnabled = !state.ttsEnabled;
  const icon = document.getElementById('tts-icon');
  const iconSem1 = document.getElementById('tts-icon-sem1');
  const soundLabel = document.getElementById('sound-status-label');

  if (state.ttsEnabled) {
    if (icon) icon.className = 'fa-solid fa-volume-high text-amber-700';
    if (iconSem1) iconSem1.className = 'fa-solid fa-volume-high text-xs';
    if (soundLabel) soundLabel.innerText = (state.currentLang === 'en') ? 'Sound: ON' : 'Suara: ON';
    showToast(state.currentLang === 'en' ? 'Sound is now ON 🔊' : 'Suara narator diaktifkan 🔊');
  } else {
    window.speechSynthesis && window.speechSynthesis.cancel();
    if (icon) icon.className = 'fa-solid fa-volume-xmark text-amber-900';
    if (iconSem1) iconSem1.className = 'fa-solid fa-volume-xmark text-xs';
    if (soundLabel) soundLabel.innerText = (state.currentLang === 'en') ? 'Sound: OFF' : 'Suara: OFF';
    showToast(state.currentLang === 'en' ? 'Sound is now OFF 🔇' : 'Suara narator dimatikan 🔇');
  }
}

function speakContent(elementId, forceLang = null) {
  if (!('speechSynthesis' in window)) {
    showToast('Fitur suara tidak didukung di peramban ini.', 'error');
    return;
  }
  if (!state.ttsEnabled) {
    showToast('Suara narator sedang dimatikan. Klik tombol volume di atas.', 'info');
    return;
  }

  window.speechSynthesis.cancel();
  const el = document.getElementById(elementId);
  if (!el) return;

  const textToRead = el.innerText;
  const utterance = new SpeechSynthesisUtterance(textToRead);
  
  // Deteksi bahasa: jika forceLang diberikan, atau elementId mengandung '-en', atau bahasa global 'en'
  const targetLang = forceLang || ((elementId.includes('-en') || state.currentLang === 'en') ? 'en-US' : 'id-ID');
  utterance.lang = targetLang;
  utterance.rate = 0.95; // Kecepatan ramah anak SD
  utterance.pitch = 1.1; // Nada bersahabat

  window.speechSynthesis.speak(utterance);
  showToast(targetLang === 'en-US' ? 'Reading material in English... 🎧' : 'Sedang membacakan materi Bahasa Indonesia... 🎧');
}

// ==========================================
// 4. BILINGUAL TRANSLATION (ENGLISH / INDONESIAN)
// ==========================================
state.currentLang = 'id'; // 'id' (Bahasa Indonesia) atau 'en' (English)

const i18nDict = {
  id: {
    beranda: 'Beranda',
    loginSiswa: 'Masuk Siswa',
    loginGuru: 'Login Guru',
    sem1: 'Semester 1',
    sem2: 'Semester 2',
    sound: 'Sound',
    gameAntariksa: 'Game Antariksa',
    modul: 'Modul Belajar',
    demo: 'Demo Praktik',
    praktik: 'Studio Praktik',
    kuis: 'Kuis',
    kembaliBeranda: 'Kembali ke Beranda',
    misiAntariksa: 'Misi Antariksa Siswa Cilik',
    judulGameAntariksa: 'Petualangan Antariksa EduCode',
    skor: 'Skor',
    pelindung: 'Perisai',
    rekor: 'Rekor',
    heroBadge: 'EduCode AI • Semester 1',
    heroBadgeSem2: 'EduCode AI • Semester 2',
    heroTitleSem1: 'Belajar Coding & AI<br>Bersama, Untuk Masa Depan',
    heroDescSem1: 'Membangun keterampilan digital, pengolah kata (MS Word), kreativitas, dan budi pekerti bersama SDS Cinta Kasih Tzu Chi.',
    heroTitleSem2: 'Petualangan Coding & AI Cilik<br>Animasi, Game & Robot Pintar',
    heroDescSem2: 'Mempelajari pemrograman visual (Scratch/Blockly), logika percabangan robot cerdas, dan pengenalan sensor kamera AI bersama SDS Cinta Kasih Tzu Chi.',
    roboBadge: 'Jawaban Robo-Tzu Chi',
    btnReplayVoice: 'Ulangi Suara',
    youAsked: '👦 Kamu Bertanya: ',
    roboSpeaking: 'Robo berbicara... 🔊',
    mascotBadge: 'Maskot EduCode',
    moodBadge: '⭐ Ceria',
    btnGreet: '👋 Sapa',
    btnTalkToRobo: 'Bicara ke Robo 🎙️',
    initialSpeechRobo: 'Halo teman pintar! Aku Robo-Tzu Chi. Klik tombol <strong>"Bicara ke Robo 🎙️"</strong> di samping kanan untuk menanyakan apa saja padaku, dan aku akan langsung menjawabnya dengan suaraku! ✨'
  },
  en: {
    beranda: 'Home',
    loginSiswa: 'Student Login',
    loginGuru: 'Teacher Login',
    sem1: 'Semester 1',
    sem2: 'Semester 2',
    sound: 'Sound',
    gameAntariksa: 'Space Game',
    modul: 'Learning Modules',
    demo: 'Demo Practice',
    praktik: 'Practice Studio',
    kuis: 'Quiz',
    kembaliBeranda: 'Back to Home',
    misiAntariksa: 'Junior Space Mission',
    judulGameAntariksa: 'EduCode Space Adventure',
    skor: 'Score',
    pelindung: 'Shield',
    rekor: 'Best Score',
    heroBadge: 'EduCode AI • Semester 1',
    heroBadgeSem2: 'EduCode AI • Semester 2',
    heroTitleSem1: 'Learn Coding & AI<br>Together, For the Future',
    heroDescSem1: 'Building digital skills, word processing (MS Word), creativity, and good character in the tech era with SDS Cinta Kasih Tzu Chi.',
    heroTitleSem2: 'Junior Coding & AI Adventure<br>Animation, Games & Smart Robots',
    heroDescSem2: 'Learning visual block coding (Scratch/Blockly), smart robot branching logic, and AI vision sensors with SDS Cinta Kasih Tzu Chi.',
    roboBadge: 'Robo-Tzu Chi Answer',
    btnReplayVoice: 'Replay Voice',
    youAsked: '👦 You Asked: ',
    roboSpeaking: 'Robo is speaking... 🔊',
    mascotBadge: 'EduCode Mascot',
    moodBadge: '⭐ Cheerful',
    btnGreet: '👋 Greet',
    btnTalkToRobo: 'Talk to Robo 🎙️',
    initialSpeechRobo: 'Hello smart friend! I am Robo-Tzu Chi. Click the <strong>"Talk to Robo 🎙️"</strong> button on the right to ask me anything, and I will answer you right away with my voice! ✨'
  }
};

function toggleBahasaAplikasi() {
  playSound('click');
  state.currentLang = (state.currentLang === 'id') ? 'en' : 'id';
  terapkanBahasa();
  if (state.currentLang === 'en') {
    showToast('Language changed to English 🇬🇧', 'info');
  } else {
    showToast('Bahasa dialihkan ke Bahasa Indonesia 🇮🇩', 'info');
  }
}

function terapkanBahasa() {
  const lang = state.currentLang || 'id';
  const dict = i18nDict[lang] || i18nDict.id;

  // Update elemen ber-atribut data-i18n
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key]) {
      el.innerHTML = dict[key];
    }
  });

  // Label toggle button di Navbar Utama
  const langLabel = document.getElementById('lang-current-label');
  if (langLabel) {
    langLabel.innerText = (lang === 'id') ? 'Indonesian / English' : 'English / Indonesian';
  }

  // Sound label
  const soundLabel = document.getElementById('sound-status-label');
  if (soundLabel) {
    soundLabel.innerText = state.ttsEnabled ? (lang === 'en' ? 'Sound: ON' : 'Suara: ON') : (lang === 'en' ? 'Sound: OFF' : 'Suara: OFF');
  }

  // Hero section update
  const heroBadge = document.getElementById('hero-badge');
  const heroTitle = document.getElementById('hero-title');
  const heroDesc = document.getElementById('hero-desc');
  if (state.currentSemester === 2) {
    if (heroBadge) heroBadge.innerText = dict.heroBadgeSem2;
    if (heroTitle) heroTitle.innerHTML = dict.heroTitleSem2;
    if (heroDesc) heroDesc.innerText = dict.heroDescSem2;
  } else {
    if (heroBadge) heroBadge.innerText = dict.heroBadge;
    if (heroTitle) heroTitle.innerHTML = dict.heroTitleSem1;
    if (heroDesc) heroDesc.innerText = dict.heroDescSem1;
  }

  // Update teks balon maskot jika masih berupa salam awal
  const speechBubbleText = document.getElementById('robot-speech-text');
  if (speechBubbleText) {
    speechBubbleText.innerHTML = dict.initialSpeechRobo;
  }
  window._jawabanTerakhirRobo = (lang === 'en')
    ? "Hello smart friend! I am Robo-Tzu Chi, your friendly coding buddy! Click Talk to Robo to ask me anything!"
    : "Halo teman pintar! Aku Robo-Tzu Chi! Senang sekali bisa mengobrol denganmu! Klik tombol Bicara untuk bertanya padaku!";

  // Sapa langsung dengan suara jika narator aktif
  if (state.ttsEnabled && 'speechSynthesis' in window) {
    const greetingMsg = (lang === 'en')
      ? "Hello! I am Robo-Tzu Chi. Let's learn coding and AI together!"
      : "Halo teman pintar! Aku Robo-Tzu Chi. Ayo belajar coding dan AI bersama!";
    sapaRobotHalo(greetingMsg);
  }

  // Sinkronkan modul TP 1.1 - TP 1.4 & TP 2.1 jika sedang dibuka
  if (typeof gantiBahasaModulTP1_1 === 'function') {
    gantiBahasaModulTP1_1(lang);
  }
  if (typeof gantiBahasaModulTP1_2 === 'function') {
    gantiBahasaModulTP1_2(lang);
  }
  if (typeof gantiBahasaModulTP1_3 === 'function') {
    gantiBahasaModulTP1_3(lang);
  }
  if (typeof gantiBahasaModulTP1_4 === 'function') {
    gantiBahasaModulTP1_4(lang);
  }
  if (typeof gantiBahasaModulTP2_1 === 'function') {
    gantiBahasaModulTP2_1(lang);
  }
}

// ==========================================
// 5. NAVIGASI TAMPILAN UTAMA VS SEMESTER 1 VS DASBOR GURU
// ==========================================
state.headerNavMode = 'utama'; // 'utama', 'sem1', atau 'guru'

function setHeaderNavMode(mode) {
  state.headerNavMode = mode;
  const navUtama = document.getElementById('navbar-tampilan-utama');
  const navSem1 = document.getElementById('navbar-tampilan-sem1');
  const navGuru = document.getElementById('navbar-tampilan-guru');
  const mNavUtama = document.getElementById('m-navbar-utama');
  const mNavSem1 = document.getElementById('m-navbar-sem1');
  const mNavGuru = document.getElementById('m-navbar-guru');

  if (mode === 'guru') {
    // Mode Dasbor Guru: Hanya Tampilkan Dock Guru (Darningsih, S.T., Kelas 4, 5, 6, Keluar)
    if (navUtama) navUtama.classList.add('hidden');
    if (navSem1) navSem1.classList.add('hidden');
    if (navGuru) navGuru.classList.remove('hidden');
    if (mNavUtama) mNavUtama.classList.add('hidden');
    if (mNavSem1) mNavSem1.classList.add('hidden');
    if (mNavGuru) mNavGuru.classList.remove('hidden');
  } else if (mode === 'sem1') {
    // Mode Siswa
    if (navUtama) navUtama.classList.add('hidden');
    if (navSem1) navSem1.classList.remove('hidden');
    if (navGuru) navGuru.classList.add('hidden');
    if (mNavUtama) mNavUtama.classList.add('hidden');
    if (mNavSem1) mNavSem1.classList.remove('hidden');
    if (mNavGuru) mNavGuru.classList.add('hidden');
  } else {
    // Mode Utama (Tampilan Utama Bersih / Tamu)
    if (navUtama) navUtama.classList.remove('hidden');
    if (navSem1) navSem1.classList.add('hidden');
    if (navGuru) navGuru.classList.add('hidden');
    if (mNavUtama) mNavUtama.classList.remove('hidden');
    if (mNavSem1) mNavSem1.classList.add('hidden');
    if (mNavGuru) mNavGuru.classList.add('hidden');
  }
}

function bukaTampilanUtama() {
  playSound('click');
  const student = getActiveStudentProfile();
  if (student) {
    setHeaderNavMode('sem1');
  } else {
    setHeaderNavMode('utama');
  }
  switchTab('beranda');
  if (spaceGame && spaceGame.isRunning) {
    spaceGame.isRunning = false;
  }
  showToast(state.currentLang === 'en' ? 'Home View Active 🏠' : 'Tampilan Utama Beranda Aktif 🏠', 'info');
}

// ==========================================
// KONTROL AKSES PERIODE SEMESTER 2 OLEH GURU
// ==========================================
function isSemester2Unlocked() {
  try {
    return localStorage.getItem(SEMESTER_2_UNLOCKED_KEY) === 'true';
  } catch (e) {
    return false;
  }
}
window.isSemester2Unlocked = isSemester2Unlocked;

function setSemester2Unlocked(unlocked) {
  try {
    localStorage.setItem(SEMESTER_2_UNLOCKED_KEY, unlocked ? 'true' : 'false');
  } catch (e) {}
  updateSemesterAccessUI();
}
window.setSemester2Unlocked = setSemester2Unlocked;

function toggleAksesSemester2OlehGuru() {
  const current = isSemester2Unlocked();
  const next = !current;
  setSemester2Unlocked(next);
  playSound(next ? 'fanfare' : 'click');
  if (next) {
    showToast('Akses Semester 2 berhasil DIBUKA untuk Siswa! 🚀 Siswa kini dapat mempelajari materi Coding & AI.', 'success');
  } else {
    // Jika dikunci kembali dan saat ini sedang berada di semester 2, alihkan ke semester 1
    if (state.currentSemester === 2) {
      pilihSemester(1);
    }
    showToast('Akses Semester 2 berhasil DISEMBUNYIKAN dari Siswa! 🔒 Siswa fokus pada Semester 1 hingga Januari 2027.', 'info');
  }
  renderPanelPengaturanSemesterGuru();
}
window.toggleAksesSemester2OlehGuru = toggleAksesSemester2OlehGuru;

function renderPanelPengaturanSemesterGuru() {
  const pill = document.getElementById('guru-sem2-status-pill');
  const btn = document.getElementById('btn-toggle-sem2-guru');
  const isUnlocked = isSemester2Unlocked();

  if (pill) {
    if (isUnlocked) {
      pill.className = 'px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 flex items-center gap-1.5';
      pill.innerHTML = '<i class="fa-solid fa-lock-open text-emerald-400"></i> <span>Semester 2 Terbuka untuk Siswa</span>';
    } else {
      pill.className = 'px-3 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-400/40 flex items-center gap-1.5';
      pill.innerHTML = '<i class="fa-solid fa-lock text-amber-400"></i> <span>Semester 2 Disembunyikan (Mulai Jan 2027)</span>';
    }
  }

  if (btn) {
    if (isUnlocked) {
      btn.className = 'w-full md:w-auto px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 active:scale-95 text-white font-title text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-amber-950/40 cursor-pointer';
      btn.innerHTML = '<i class="fa-solid fa-lock text-sm"></i> <span>Sembunyikan / Kunci Semester 2</span>';
    } else {
      btn.className = 'w-full md:w-auto px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white font-title text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 cursor-pointer';
      btn.innerHTML = '<i class="fa-solid fa-lock-open text-sm"></i> <span>Buka Akses Semester 2 Sekarang</span>';
    }
  }
}
window.renderPanelPengaturanSemesterGuru = renderPanelPengaturanSemesterGuru;

function updateSemesterAccessUI() {
  const isUnlocked = isSemester2Unlocked();

  // 1. Sembunyikan / Tampilkan kartu Semester 2 di Beranda Siswa
  const sem2Cards = document.querySelectorAll('.sem2-feature-card');
  sem2Cards.forEach(el => {
    if (isUnlocked) {
      el.classList.remove('hidden');
      el.style.display = '';
    } else {
      el.classList.add('hidden');
      el.style.display = 'none';
    }
  });

  const gridCol1 = document.getElementById('card-sem-grid-col1');
  if (gridCol1) {
    if (isUnlocked) {
      gridCol1.classList.remove('grid-cols-1');
      gridCol1.classList.add('grid-cols-2');
    } else {
      gridCol1.classList.remove('grid-cols-2');
      gridCol1.classList.add('grid-cols-1');
    }
  }

  const gridCol2 = document.getElementById('card-sem-grid-col2');
  if (gridCol2) {
    if (isUnlocked) {
      gridCol2.classList.remove('grid-cols-1');
      gridCol2.classList.add('grid-cols-2');
    } else {
      gridCol2.classList.remove('grid-cols-2');
      gridCol2.classList.add('grid-cols-1');
    }
  }

  // 2. Jika Semester 2 sedang terkunci, pastikan state selalu kembali ke Semester 1
  if (!isUnlocked) {
    state.currentSemester = 1;
    try {
      localStorage.setItem('educode_student_active_sem_v1', '1');
      sessionStorage.setItem('educode_student_active_sem_v1', '1');
    } catch (e) {}

    const navLabText = document.getElementById('nav-lab-text');
    const navLabIcon = document.getElementById('nav-lab-icon');
    const mNavLabText = document.getElementById('m-nav-lab-text');
    const mNavLabIcon = document.getElementById('m-nav-lab-icon');
    const navExcel = document.getElementById('nav-msexcel');
    const mNavExcel = document.getElementById('m-nav-msexcel');
    const navDemo = document.getElementById('nav-demo');
    const mNavDemo = document.getElementById('m-nav-demo');

    if (navLabText) navLabText.innerText = 'Lab MS Word';
    if (navLabIcon) navLabIcon.className = 'fa-solid fa-file-word text-blue-400 icon-3d-glow';
    if (mNavLabText) mNavLabText.innerText = 'Lab Word';
    if (mNavLabIcon) mNavLabIcon.className = 'fa-solid fa-file-word text-lg text-blue-400';
    if (navExcel) navExcel.classList.remove('hidden');
    if (mNavExcel) mNavExcel.classList.remove('hidden');
    if (navDemo) navDemo.classList.add('hidden');
    if (mNavDemo) mNavDemo.classList.add('hidden');

    document.querySelectorAll('.sem1-content').forEach(el => el.classList.remove('hidden'));
    document.querySelectorAll('.sem2-content').forEach(el => el.classList.add('hidden'));
  }

  updateLabelSemesterSiswa();
  renderPanelPengaturanSemesterGuru();
}
window.updateSemesterAccessUI = updateSemesterAccessUI;

function bukaSemesterDariUtama(semNumber) {
  const profile = getActiveStudentProfile();
  if (!profile) {
    playSound('warning');
    showToast(state.currentLang === 'en' 
      ? 'Please log in as a Student with your NIS first to access class materials! 🎓' 
      : 'Silakan Login Siswa dengan NIS terlebih dahulu untuk mengakses materi kelas! 🎓', 'warning');
    bukaPilihSiswaCepat();
    return;
  }
  if (semNumber === 2 && !isSemester2Unlocked()) {
    playSound('warning');
    showToast('Materi Semester 2 (Coding & AI) dijadwalkan mulai bulan Januari 2027! Saat ini mari fokus menuntaskan materi Semester 1 📘✨', 'warning');
    return;
  }
  playSound('fanfare');
  pilihSemester(semNumber);
  setHeaderNavMode('sem1');
  switchTab('modul');
  if (semNumber === 1) {
    if (typeof bukaModulDetail === 'function') bukaModulDetail('tp1');
    showToast(state.currentLang === 'en' ? 'Welcome to Semester 1! Modules active 📘' : 'Masuk ke Semester 1! Modul Belajar siap dipelajari 📘', 'success');
  } else {
    if (typeof bukaModulDetailSem2 === 'function') bukaModulDetailSem2('tp5');
    showToast(state.currentLang === 'en' ? 'Welcome to Semester 2! Coding & AI active 🚀' : 'Masuk ke Semester 2! Lab Coding & AI siap dipelajari 🚀', 'success');
  }
}

// ==========================================
// INTERAKSI ROBOT MASKOT LUCU (ROBO-TZU CHI)
// ==========================================
const sapaanRobotList = [
  '🤖 "Halo! Aku Robo-Tzu Chi, ayo belajar Coding & AI bersama!" ✨',
  '🎉 "Yey! Semangat belajar hari ini! Klik Semester 1 untuk mulai latihan!" 📘',
  '💡 "Tahukah kamu? Komputer bekerja dengan instruksi logika yang runtut!" 🧠',
  '🌟 "Kamu anak yang hebat, kreatif, dan berbudi pekerti luhur!" 💚',
  '🚀 "Ayo kumpulkan banyak bintang poin dan selesaikan tantangannya!" ⭐'
];
let sapaanRobotIndex = 0;

function sapaRobotLucu() {
  playSound('success');
  sapaanRobotIndex = (sapaanRobotIndex + 1) % sapaanRobotList.length;
  const bubbleText = document.getElementById('robot-speech-text');
  if (bubbleText) {
    bubbleText.innerText = sapaanRobotList[sapaanRobotIndex];
  }
  const mascotImg = document.getElementById('robot-mascot-img');
  if (mascotImg) {
    mascotImg.classList.add('animate-bounce');
    setTimeout(() => mascotImg.classList.remove('animate-bounce'), 800);
  }
  tambahPoin(5);
  showToast(state.currentLang === 'en' ? 'Robo-Tzu Chi smiles! (+5 Stars ⭐)' : 'Robo-Tzu Chi tersenyum senang! (+5 Bintang ⭐)', 'success');
}

function updateNavSemesterVisibility() {
  const navExcel = document.getElementById('nav-msexcel');
  const mNavExcel = document.getElementById('m-nav-msexcel');
  const navDemo = document.getElementById('nav-demo');
  const mNavDemo = document.getElementById('m-nav-demo');

  if (state.currentSemester === 2 && isSemester2Unlocked()) {
    if (navExcel) navExcel.classList.add('hidden');
    if (mNavExcel) mNavExcel.classList.add('hidden');
    // RoboMind Tampil di Semester 2
    if (navDemo) navDemo.classList.remove('hidden');
    if (mNavDemo) mNavDemo.classList.remove('hidden');
  } else {
    // Semester 1: Excel tampil, RoboMind disembunyikan
    if (navExcel) navExcel.classList.remove('hidden');
    if (mNavExcel) mNavExcel.classList.remove('hidden');
    if (navDemo) navDemo.classList.add('hidden');
    if (mNavDemo) mNavDemo.classList.add('hidden');
  }
}

function toggleSemesterSiswa() {
  if (!isSemester2Unlocked()) {
    playSound('warning');
    showToast('Semester 2 akan dibuka oleh Guru pada Januari 2027. Saat ini fokus di Semester 1 ya! 📘✨', 'info');
    return;
  }
  const targetSem = state.currentSemester === 1 ? 2 : 1;
  pilihSemester(targetSem);
}
window.toggleSemesterSiswa = toggleSemesterSiswa;

function updateLabelSemesterSiswa() {
  const label = document.getElementById('label-toggle-sem');
  const icon = document.getElementById('icon-toggle-sem');
  const btn = document.getElementById('btn-toggle-sem-siswa');
  const heroBtnSem2 = document.getElementById('hero-btn-sem2');
  const unlocked = isSemester2Unlocked();

  // Sinkronkan Tombol Semester 2 di Hero Banner
  if (heroBtnSem2) {
    if (unlocked) {
      heroBtnSem2.classList.remove('hidden');
      heroBtnSem2.style.display = '';
    } else {
      heroBtnSem2.classList.add('hidden');
      heroBtnSem2.style.display = 'none';
    }
  }

  if (!btn) return;
  const profile = getActiveStudentProfile();
  if (!profile || !unlocked) {
    btn.classList.add('hidden');
    btn.style.display = 'none';
    return;
  }

  btn.classList.remove('hidden');
  btn.style.display = '';
  if (state.currentSemester === 2) {
    if (label) label.innerText = 'Semester 2';
    if (icon) icon.className = 'fa-solid fa-robot text-purple-200';
    btn.className = 'px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-title text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-purple-900/30 cursor-pointer';
  } else {
    if (label) label.innerText = 'Semester 1';
    if (icon) icon.className = 'fa-solid fa-graduation-cap text-blue-600';
    btn.className = 'px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-title text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer';
  }
}
window.updateLabelSemesterSiswa = updateLabelSemesterSiswa;

function switchTab(tabId) {
  playSound('click');
  window.speechSynthesis && window.speechSynthesis.cancel();

  // Sinkronkan navbar: Jika membuka Dasbor Guru, tampilkan dock menu guru (Darningsih, S.T., Kelas 4, 5, 6, Keluar)
  if (tabId === 'guru' || (state.isGuruLoggedIn && tabId === 'guru')) {
    setHeaderNavMode('guru');
  } else {
    const student = getActiveStudentProfile();
    if (student) {
      setHeaderNavMode('sem1');
    } else {
      if (tabId === 'beranda' || tabId === 'antariksa') {
        setHeaderNavMode('utama');
      } else {
        setHeaderNavMode('sem1');
      }
    }
  }

  // Daftar semua tab
  const tabs = ['beranda', 'modul', 'msword', 'msexcel', 'demo', 'praktik', 'kuis', 'antariksa', 'guru'];
  tabs.forEach(tab => {
    const section = document.getElementById(`tab-${tab}`);
    if (section) {
      if (tab === tabId) {
        section.classList.remove('hidden');
      } else {
        section.classList.add('hidden');
      }
    }

    // Desktop Nav styling 3D Tactile
    const navBtn = document.getElementById(`nav-${tab}`);
    if (navBtn) {
      if (tab === tabId) {
        navBtn.className = 'nav-btn nav-btn-3d active-tab px-4.5 sm:px-5 py-2 rounded-full font-title font-bold text-xs sm:text-sm transition-all duration-200 flex items-center gap-2';
      } else {
        navBtn.className = 'nav-btn nav-btn-3d px-3.5 sm:px-4 py-2 rounded-full font-title font-semibold text-xs sm:text-sm transition-all duration-200 flex items-center gap-2 text-slate-300 hover:text-white';
      }
    }

    // Mobile Nav styling
    const mNavBtn = document.getElementById(`m-nav-${tab}`);
    if (mNavBtn) {
      if (tab === tabId) {
        mNavBtn.classList.remove('text-slate-400');
        mNavBtn.classList.add('text-blue-400', 'scale-105', 'font-bold');
      } else {
        mNavBtn.classList.remove('text-blue-400', 'scale-105', 'font-bold');
        mNavBtn.classList.add('text-slate-400');
      }
    }
  });

  if (tabId === 'guru') {
    renderDasborGuru();
  }

  // Pastikan mode fullscreen dinonaktifkan jika berpindah tab
  if (tabId !== 'msexcel' && typeof isExcelFullscreenActive !== 'undefined' && isExcelFullscreenActive) {
    toggleExcelFullscreen(false);
  }
  if (tabId !== 'demo' && typeof isRoboFullscreenActive !== 'undefined' && isRoboFullscreenActive) {
    toggleRoboFullscreen(false);
  }

  // Pastikan tombol Lab MS Excel disembunyikan jika di Semester 2
  updateNavSemesterVisibility();

  state.currentTab = tabId;
  if (typeof updateScrollNavVisibility === 'function') {
    updateScrollNavVisibility();
  }
  const currentActiveStudent = getActiveStudentProfile();
  if (currentActiveStudent && tabId !== 'guru') {
    try {
      localStorage.setItem('educode_student_active_tab_v1', tabId);
      sessionStorage.setItem('educode_student_active_tab_v1', tabId);
      localStorage.setItem('educode_student_active_sem_v1', String(state.currentSemester));
      sessionStorage.setItem('educode_student_active_sem_v1', String(state.currentSemester));
    } catch (e) {}
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Sinkronkan status profil siswa di kartu sambutan saat membuka tab beranda
  if (tabId === 'beranda' && typeof muatProfilSiswa === 'function') {
    muatProfilSiswa();
  }

  // Inisialisasi canvas atau galeri jika membuka tab praktik
  if (tabId === 'praktik') {
    if (state.p1Mode === 'gambar') {
      setTimeout(initPaintApp, 100);
    } else {
      setTimeout(renderGaleriPosterWord, 50);
    }
  }

  // Inisialisasi simulator spreadsheet jika membuka Lab MS Excel
  if (tabId === 'msexcel') {
    setTimeout(initExcelSpreadsheet, 50);
  }

  // Pastikan Lab MS Word memiliki poster awal jika lembar kerja masih kosong
  if (tabId === 'msword') {
    if (wordElements.length === 0) {
      setTimeout(() => loadPresetPosterLingkungan('indonesia_hebat'), 50);
    }
  }

  // Inisialisasi simulator RoboMind jika membuka tab Demo Praktik
  if (tabId === 'demo') {
    setTimeout(() => {
      if (typeof initRoboMindSimulator === 'function') initRoboMindSimulator();
    }, 50);
  }

  // Inisialisasi Game Antariksa jika tab antariksa dibuka
  if (tabId === 'antariksa') {
    setTimeout(initGameAntariksa, 50);
  }
}

// ==========================================
// 6. ENGINE GAME ANTARIKSA (SPACE ADVENTURE)
// ==========================================
let spaceGame = {
  canvas: null,
  ctx: null,
  animId: null,
  isRunning: false,
  isPaused: false,
  score: 0,
  lives: 3,
  highScore: 0,
  player: { x: 380, y: 350, w: 40, h: 44, speed: 6 },
  stars: [],       // Bintang latar belakang scrolling
  lasers: [],      // Laser tembakan pemain
  items: [],       // Bintang emas, kristal, chip
  meteors: [],     // Batu meteor luar angkasa
  particles: [],   // Partikel ledakan
  keys: {},
  eventsAttached: false,
  lastSpawnTime: 0,
  lastLaserTime: 0
};

function bukaGameAntariksa() {
  playSound('click');
  switchTab('antariksa');
}

function initGameAntariksa() {
  const canvas = document.getElementById('space-game-canvas');
  if (!canvas) return;
  spaceGame.canvas = canvas;
  spaceGame.ctx = canvas.getContext('2d');
  spaceGame.highScore = parseInt(localStorage.getItem('educode_space_highscore') || '0', 10);
  
  const hsEl = document.getElementById('space-highscore-val');
  if (hsEl) hsEl.innerText = spaceGame.highScore;

  // Inisialisasi bintang antariksa di latar belakang
  spaceGame.stars = [];
  for (let i = 0; i < 80; i++) {
    spaceGame.stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 0.8,
      speed: Math.random() * 1.5 + 0.5,
      color: ['#ffffff', '#bae6fd', '#fef08a', '#e9d5ff'][Math.floor(Math.random() * 4)]
    });
  }

  // Pasang keyboard listener jika belum
  if (!spaceGame.eventsAttached) {
    window.addEventListener('keydown', (e) => {
      if (state.currentTab !== 'antariksa') return;
      const k = e.key.toLowerCase();
      if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown', 'a', 'd', 'w', 's', ' '].includes(k)) {
        spaceGame.keys[k] = true;
        if (e.key === ' ' && spaceGame.isRunning && !spaceGame.isPaused) {
          e.preventDefault();
          tembakLaserAntariksa();
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      if (state.currentTab !== 'antariksa') return;
      const k = e.key.toLowerCase();
      spaceGame.keys[k] = false;
    });

    // Touch listeners
    const bLeft = document.getElementById('btn-space-left');
    const bRight = document.getElementById('btn-space-right');
    const bFire = document.getElementById('btn-space-fire');

    if (bLeft) {
      bLeft.addEventListener('mousedown', () => { spaceGame.keys['arrowleft'] = true; });
      bLeft.addEventListener('mouseup', () => { spaceGame.keys['arrowleft'] = false; });
      bLeft.addEventListener('touchstart', (e) => { e.preventDefault(); spaceGame.keys['arrowleft'] = true; });
      bLeft.addEventListener('touchend', (e) => { e.preventDefault(); spaceGame.keys['arrowleft'] = false; });
    }
    if (bRight) {
      bRight.addEventListener('mousedown', () => { spaceGame.keys['arrowright'] = true; });
      bRight.addEventListener('mouseup', () => { spaceGame.keys['arrowright'] = false; });
      bRight.addEventListener('touchstart', (e) => { e.preventDefault(); spaceGame.keys['arrowright'] = true; });
      bRight.addEventListener('touchend', (e) => { e.preventDefault(); spaceGame.keys['arrowright'] = false; });
    }
    if (bFire) {
      bFire.addEventListener('click', (e) => {
        e.preventDefault();
        tembakLaserAntariksa();
      });
    }

    spaceGame.eventsAttached = true;
  }

  drawSpaceInitialPreview();
}

function drawSpaceInitialPreview() {
  if (!spaceGame.ctx) return;
  const ctx = spaceGame.ctx;
  const cvs = spaceGame.canvas;

  // Latar luar angkasa
  ctx.fillStyle = '#030712';
  ctx.fillRect(0, 0, cvs.width, cvs.height);

  // Gambar bintang latar
  spaceGame.stars.forEach(st => {
    ctx.fillStyle = st.color;
    ctx.fillRect(st.x, st.y, st.size, st.size);
  });

  // Gambar pesawat cilik
  drawPesawatAntariksa(cvs.width / 2 - 20, cvs.height - 70);
}

function mulaiGameAntariksa() {
  playSound('fanfare');
  spaceGame.score = 0;
  spaceGame.lives = 3;
  spaceGame.lasers = [];
  spaceGame.items = [];
  spaceGame.meteors = [];
  spaceGame.particles = [];
  spaceGame.player.x = spaceGame.canvas.width / 2 - 20;
  spaceGame.player.y = spaceGame.canvas.height - 65;
  spaceGame.isRunning = true;
  spaceGame.isPaused = false;
  spaceGame.lastSpawnTime = Date.now();

  updateSpaceHUD();

  const overlay = document.getElementById('space-game-overlay');
  if (overlay) overlay.classList.add('hidden');

  if (spaceGame.animId) cancelAnimationFrame(spaceGame.animId);
  spaceGame.animId = requestAnimationFrame(spaceGameLoop);

  showToast('Misi Antariksa Dimulai! Kumpulkan bintang & hancurkan meteor 🚀⭐', 'success');
}

function pauseGameAntariksa() {
  if (!spaceGame.isRunning) return;
  spaceGame.isPaused = !spaceGame.isPaused;
  const lbl = document.getElementById('label-pause-game');
  if (lbl) lbl.innerText = spaceGame.isPaused ? 'Lanjut' : 'Jeda';
  showToast(spaceGame.isPaused ? 'Game Dijeda ⏸️' : 'Misi Dilanjutkan! ▶️');
}

function tembakLaserAntariksa() {
  if (!spaceGame.isRunning || spaceGame.isPaused) return;
  const now = Date.now();
  if (now - spaceGame.lastLaserTime < 180) return; // cooldown
  spaceGame.lastLaserTime = now;

  // 2 Laser kiri dan kanan
  spaceGame.lasers.push({
    x: spaceGame.player.x + 6,
    y: spaceGame.player.y,
    w: 4,
    h: 14,
    speed: 10
  });
  spaceGame.lasers.push({
    x: spaceGame.player.x + spaceGame.player.w - 10,
    y: spaceGame.player.y,
    w: 4,
    h: 14,
    speed: 10
  });

  playSound('click');
}

function spaceGameLoop() {
  if (!spaceGame.isRunning) return;

  if (!spaceGame.isPaused) {
    updateSpaceGame();
    renderSpaceGame();
  }

  spaceGame.animId = requestAnimationFrame(spaceGameLoop);
}

function updateSpaceGame() {
  const cvs = spaceGame.canvas;
  const p = spaceGame.player;

  // Gerak Pesawat
  if ((spaceGame.keys['arrowleft'] || spaceGame.keys['a']) && p.x > 10) {
    p.x -= p.speed;
  }
  if ((spaceGame.keys['arrowright'] || spaceGame.keys['d']) && p.x < cvs.width - p.w - 10) {
    p.x += p.speed;
  }
  if ((spaceGame.keys['arrowup'] || spaceGame.keys['w']) && p.y > 50) {
    p.y -= p.speed;
  }
  if ((spaceGame.keys['arrowdown'] || spaceGame.keys['s']) && p.y < cvs.height - p.h - 10) {
    p.y += p.speed;
  }

  // Update Bintang Latar
  spaceGame.stars.forEach(st => {
    st.y += st.speed;
    if (st.y > cvs.height) {
      st.y = 0;
      st.x = Math.random() * cvs.width;
    }
  });

  // Update Lasers
  for (let i = spaceGame.lasers.length - 1; i >= 0; i--) {
    const lz = spaceGame.lasers[i];
    lz.y -= lz.speed;
    if (lz.y < -20) {
      spaceGame.lasers.splice(i, 1);
    }
  }

  // Spawn Meteor & Items secara berkala
  const now = Date.now();
  if (now - spaceGame.lastSpawnTime > 850) {
    spaceGame.lastSpawnTime = now;

    // Spawn Meteor
    if (Math.random() < 0.65) {
      spaceGame.meteors.push({
        x: Math.random() * (cvs.width - 50) + 20,
        y: -40,
        size: Math.random() * 20 + 26,
        speed: Math.random() * 2.2 + 1.8,
        rot: Math.random() * Math.PI,
        rotSpeed: (Math.random() - 0.5) * 0.05
      });
    }

    // Spawn Item (Bintang ⭐ atau Kristal 💎)
    if (Math.random() < 0.55) {
      const type = Math.random() < 0.7 ? 'star' : 'crystal';
      spaceGame.items.push({
        type: type,
        x: Math.random() * (cvs.width - 40) + 20,
        y: -30,
        size: 26,
        speed: Math.random() * 1.5 + 1.5,
        rot: 0
      });
    }
  }

  // Update Meteors & Cek Tabrakan dengan Laser
  for (let m = spaceGame.meteors.length - 1; m >= 0; m--) {
    const met = spaceGame.meteors[m];
    met.y += met.speed;
    met.rot += met.rotSpeed;

    // Tabrakan Laser vs Meteor
    let destroyed = false;
    for (let l = spaceGame.lasers.length - 1; l >= 0; l--) {
      const lz = spaceGame.lasers[l];
      if (lz.x + lz.w >= met.x - met.size / 2 &&
          lz.x <= met.x + met.size / 2 &&
          lz.y <= met.y + met.size / 2 &&
          lz.y + lz.h >= met.y - met.size / 2) {
        
        destroyed = true;
        spaceGame.lasers.splice(l, 1);
        break;
      }
    }

    if (destroyed) {
      createSpaceExplosion(met.x, met.y, '#f97316');
      spaceGame.meteors.splice(m, 1);
      spaceGame.score += 15;
      updateSpaceHUD();
      playSound('success');
      continue;
    }

    // Tabrakan Pesawat vs Meteor
    if (p.x + p.w >= met.x - met.size / 2 &&
        p.x <= met.x + met.size / 2 &&
        p.y + p.h >= met.y - met.size / 2 &&
        p.y <= met.y + met.size / 2) {
      
      createSpaceExplosion(met.x, met.y, '#ef4444');
      spaceGame.meteors.splice(m, 1);
      spaceGame.lives--;
      updateSpaceHUD();
      playSound('error');

      if (spaceGame.lives <= 0) {
        gameOverAntariksa();
        return;
      }
      continue;
    }

    // Lewat batas bawah
    if (met.y > cvs.height + 50) {
      spaceGame.meteors.splice(m, 1);
    }
  }

  // Update Items & Cek Diambil Pesawat
  for (let it = spaceGame.items.length - 1; it >= 0; it--) {
    const item = spaceGame.items[it];
    item.y += item.speed;

    // Cek tabrakan dengan pesawat
    if (p.x + p.w >= item.x - item.size / 2 &&
        p.x <= item.x + item.size / 2 &&
        p.y + p.h >= item.y - item.size / 2 &&
        p.y <= item.y + item.size / 2) {
      
      if (item.type === 'star') {
        spaceGame.score += 10;
        tambahPoin(1);
        createSpaceExplosion(item.x, item.y, '#facc15');
      } else {
        spaceGame.score += 25;
        if (spaceGame.lives < 3) spaceGame.lives++;
        createSpaceExplosion(item.x, item.y, '#38bdf8');
      }

      spaceGame.items.splice(it, 1);
      updateSpaceHUD();
      playSound('success');
      continue;
    }

    if (item.y > cvs.height + 50) {
      spaceGame.items.splice(it, 1);
    }
  }

  // Update Partikel Ledakan
  for (let pt = spaceGame.particles.length - 1; pt >= 0; pt--) {
    const part = spaceGame.particles[pt];
    part.x += part.vx;
    part.y += part.vy;
    part.alpha -= 0.035;
    if (part.alpha <= 0) {
      spaceGame.particles.splice(pt, 1);
    }
  }
}

function renderSpaceGame() {
  const ctx = spaceGame.ctx;
  const cvs = spaceGame.canvas;

  // Latar Luar Angkasa
  ctx.fillStyle = '#030712';
  ctx.fillRect(0, 0, cvs.width, cvs.height);

  // Bintang Latar
  spaceGame.stars.forEach(st => {
    ctx.fillStyle = st.color;
    ctx.fillRect(st.x, st.y, st.size, st.size);
  });

  // Laser
  ctx.fillStyle = '#38bdf8';
  ctx.shadowColor = '#0284c7';
  ctx.shadowBlur = 8;
  spaceGame.lasers.forEach(lz => {
    ctx.fillRect(lz.x, lz.y, lz.w, lz.h);
  });
  ctx.shadowBlur = 0;

  // Items (Bintang & Kristal)
  spaceGame.items.forEach(it => {
    ctx.save();
    ctx.translate(it.x, it.y);
    if (it.type === 'star') {
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⭐', 0, 0);
    } else {
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('💎', 0, 0);
    }
    ctx.restore();
  });

  // Meteors
  spaceGame.meteors.forEach(met => {
    ctx.save();
    ctx.translate(met.x, met.y);
    ctx.rotate(met.rot);
    ctx.font = `${Math.round(met.size)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🪨', 0, 0);
    ctx.restore();
  });

  // Partikel Ledakan
  spaceGame.particles.forEach(pt => {
    ctx.save();
    ctx.globalAlpha = Math.max(0, pt.alpha);
    ctx.fillStyle = pt.color;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  // Pesawat Pemain
  drawPesawatAntariksa(spaceGame.player.x, spaceGame.player.y);
}

function drawPesawatAntariksa(x, y) {
  const ctx = spaceGame.ctx;
  ctx.save();
  ctx.translate(x, y);

  // Api Dorongan Jet
  const flameH = Math.random() * 8 + 10;
  ctx.fillStyle = '#f97316';
  ctx.beginPath();
  ctx.moveTo(14, 40);
  ctx.lineTo(20, 40 + flameH);
  ctx.lineTo(26, 40);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#facc15';
  ctx.beginPath();
  ctx.moveTo(17, 40);
  ctx.lineTo(20, 40 + flameH * 0.6);
  ctx.lineTo(23, 40);
  ctx.closePath();
  ctx.fill();

  // Badan Pesawat (Roket Putih Bersih)
  ctx.fillStyle = '#f8fafc';
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(20, 0);
  ctx.quadraticCurveTo(34, 15, 34, 38);
  ctx.lineTo(6, 38);
  ctx.quadraticCurveTo(6, 15, 20, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Sayap Kiri & Kanan
  ctx.fillStyle = '#2563eb';
  ctx.beginPath();
  ctx.moveTo(6, 26);
  ctx.lineTo(0, 40);
  ctx.lineTo(8, 38);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(34, 26);
  ctx.lineTo(40, 40);
  ctx.lineTo(32, 38);
  ctx.closePath();
  ctx.fill();

  // Kaca Kokpit Pesawat
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.arc(20, 16, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Lambang Teratai Hijau Cilik di Pesawat
  ctx.fillStyle = '#16a34a';
  ctx.beginPath();
  ctx.arc(20, 28, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function createSpaceExplosion(x, y, color) {
  for (let i = 0; i < 14; i++) {
    const angle = Math.random() * Math.PI * 2;
    const spd = Math.random() * 4 + 1.5;
    spaceGame.particles.push({
      x: x,
      y: y,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd,
      size: Math.random() * 3 + 1.5,
      alpha: 1,
      color: color
    });
  }
}

function updateSpaceHUD() {
  const scEl = document.getElementById('space-score-val');
  const lvEl = document.getElementById('space-lives-val');
  if (scEl) scEl.innerText = spaceGame.score;
  if (lvEl) {
    let hearts = '';
    for (let i = 0; i < spaceGame.lives; i++) hearts += '❤️';
    lvEl.innerText = hearts || '💀 Habis';
  }
}

function gameOverAntariksa() {
  spaceGame.isRunning = false;
  if (spaceGame.animId) cancelAnimationFrame(spaceGame.animId);

  // Simpan High Score
  if (spaceGame.score > spaceGame.highScore) {
    spaceGame.highScore = spaceGame.score;
    localStorage.setItem('educode_space_highscore', spaceGame.highScore);
    const hsEl = document.getElementById('space-highscore-val');
    if (hsEl) hsEl.innerText = spaceGame.highScore;
  }

  // Bonus bintang poin siswa
  const bonusBintang = Math.floor(spaceGame.score / 25);
  if (bonusBintang > 0) {
    tambahPoin(bonusBintang);
  }

  const overlay = document.getElementById('space-game-overlay');
  const title = document.getElementById('space-overlay-title');
  const desc = document.getElementById('space-overlay-desc');
  const btnLabel = document.getElementById('space-btn-start-label');

  if (title) title.innerText = 'Misi Selesai! 🎉';
  if (desc) desc.innerHTML = `Skor Akhirmu: <b class="text-yellow-300 text-lg">${spaceGame.score}</b><br>Kamu mendapatkan <b>+${bonusBintang} Bintang Akun!</b> ⭐<br>Hebat sekali penjelajahanmu hari ini!`;
  if (btnLabel) btnLabel.innerText = 'Main Lagi (Play Again)';
  if (overlay) overlay.classList.remove('hidden');

  playSound('fanfare');
  showToast(`Misi Selesai! Skor: ${spaceGame.score} (+${bonusBintang} Bintang) 🚀🏆`, 'success');
}

// ==========================================
// 5. MODUL DETAIL TAB SWITCHER
// ==========================================
function bukaModulDetail(tpKey) {
  playSound('click');
  window.speechSynthesis && window.speechSynthesis.cancel();

  // Beralih ke tab modul jika belum di tab modul
  if (state.currentTab !== 'modul') {
    switchTab('modul');
  }

  // Pemetaan alias key
  const aliasMap = {
    'tp1': 'tp2_1',
    'tp2': 'tp2_2',
    'tp3': 'tp2_3',
    'tp4': 'tp2_4'
  };
  const targetKey = aliasMap[tpKey] || tpKey;

  const allTps = ['tp1_1', 'tp1_2', 'tp1_3', 'tp1_4', 'tp2_1', 'tp2_2', 'tp2_3', 'tp2_4'];
  allTps.forEach(tp => {
    // Cari konten modul berdasarkan ID baru atau ID lama (backward compatibility)
    let content = document.getElementById(`konten-modul-${tp}`);
    if (!content) {
      if (tp === 'tp2_1') content = document.getElementById('konten-modul-tp1');
      if (tp === 'tp2_2') content = document.getElementById('konten-modul-tp2');
      if (tp === 'tp2_3') content = document.getElementById('konten-modul-tp3');
      if (tp === 'tp2_4') content = document.getElementById('konten-modul-tp4');
    }

    // Cari tombol tab
    let btn = document.getElementById(`btn-modul-${tp}`);
    if (!btn) {
      if (tp === 'tp2_1') btn = document.getElementById('btn-modul-tp1');
      if (tp === 'tp2_2') btn = document.getElementById('btn-modul-tp2');
      if (tp === 'tp2_3') btn = document.getElementById('btn-modul-tp3');
      if (tp === 'tp2_4') btn = document.getElementById('btn-modul-tp4');
    }

    if (content) {
      if (tp === targetKey) {
        content.classList.remove('hidden');
      } else {
        content.classList.add('hidden');
      }
    }

    if (btn) {
      if (tp === targetKey) {
        btn.className = 'modul-tab-btn active-modul-tab px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold font-title bg-blue-600 text-white shadow-xs';
      } else {
        btn.className = 'modul-tab-btn px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold font-title bg-slate-100 text-slate-600 hover:bg-slate-200';
      }
    }
  });

  state.currentModul = targetKey;

  // Gulir halus ke kartu rangkuman modul yang dipilih
  setTimeout(() => {
    let targetEl = document.getElementById(`konten-modul-${targetKey}`);
    if (!targetEl) {
      if (targetKey === 'tp2_1') targetEl = document.getElementById('konten-modul-tp1');
      if (targetKey === 'tp2_2') targetEl = document.getElementById('konten-modul-tp2');
      if (targetKey === 'tp2_3') targetEl = document.getElementById('konten-modul-tp3');
      if (targetKey === 'tp2_4') targetEl = document.getElementById('konten-modul-tp4');
    }
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, 100);
}

// Fungsi gulir langsung ke tabel PROTA
function gulirKeTabelProta() {
  playSound('click');
  if (state.currentTab !== 'modul') {
    switchTab('modul');
  }
  setTimeout(() => {
    const el = document.getElementById('tabel-prota-kurikulum-merdeka');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, 100);
}

function gantiBahasaModulTP1_1(lang) {
  playSound('click');
  window.speechSynthesis && window.speechSynthesis.cancel();
  const panelId = document.getElementById('tp1_1-lang-id');
  const panelEn = document.getElementById('tp1_1-lang-en');
  const btnId = document.getElementById('btn-tp1_1-lang-id');
  const btnEn = document.getElementById('btn-tp1_1-lang-en');

  if (lang === 'en') {
    if (panelId) panelId.classList.add('hidden');
    if (panelEn) panelEn.classList.remove('hidden');
    if (btnEn) btnEn.className = 'px-3 py-1.5 rounded-lg text-xs font-bold font-title bg-blue-600 text-white shadow-xs transition flex items-center gap-1.5';
    if (btnId) btnId.className = 'px-3 py-1.5 rounded-lg text-xs font-bold font-title text-slate-600 hover:text-slate-900 transition flex items-center gap-1.5';
    showToast('Materi TP 1.1 beralih ke Bahasa Inggris 🇬🇧', 'info');
  } else {
    if (panelEn) panelEn.classList.add('hidden');
    if (panelId) panelId.classList.remove('hidden');
    if (btnId) btnId.className = 'px-3 py-1.5 rounded-lg text-xs font-bold font-title bg-emerald-600 text-white shadow-xs transition flex items-center gap-1.5';
    if (btnEn) btnEn.className = 'px-3 py-1.5 rounded-lg text-xs font-bold font-title text-slate-600 hover:text-slate-900 transition flex items-center gap-1.5';
    showToast('Materi TP 1.1 beralih ke Bahasa Indonesia 🇮🇩', 'info');
  }
}

function gantiBahasaModulTP1_2(lang) {
  playSound('click');
  window.speechSynthesis && window.speechSynthesis.cancel();
  const panelId = document.getElementById('tp1_2-lang-id');
  const panelEn = document.getElementById('tp1_2-lang-en');
  const btnId = document.getElementById('btn-tp1_2-lang-id');
  const btnEn = document.getElementById('btn-tp1_2-lang-en');

  if (lang === 'en') {
    if (panelId) panelId.classList.add('hidden');
    if (panelEn) panelEn.classList.remove('hidden');
    if (btnEn) btnEn.className = 'px-3 py-1.5 rounded-xl text-xs font-bold font-title bg-blue-600 text-white shadow-xs transition flex items-center gap-1.5';
    if (btnId) btnId.className = 'px-3 py-1.5 rounded-xl text-xs font-bold font-title text-slate-600 hover:text-slate-900 transition flex items-center gap-1.5';
    showToast('Materi TP 1.2 beralih ke Bahasa Inggris 🇬🇧', 'info');
  } else {
    if (panelEn) panelEn.classList.add('hidden');
    if (panelId) panelId.classList.remove('hidden');
    if (btnId) btnId.className = 'px-3 py-1.5 rounded-xl text-xs font-bold font-title bg-blue-600 text-white shadow-xs transition flex items-center gap-1.5';
    if (btnEn) btnEn.className = 'px-3 py-1.5 rounded-xl text-xs font-bold font-title text-slate-600 hover:text-slate-900 transition flex items-center gap-1.5';
    showToast('Materi TP 1.2 beralih ke Bahasa Indonesia 🇮🇩', 'info');
  }
}

function gantiBahasaModulTP1_3(lang) {
  playSound('click');
  window.speechSynthesis && window.speechSynthesis.cancel();
  const panelId = document.getElementById('tp1_3-lang-id');
  const panelEn = document.getElementById('tp1_3-lang-en');
  const btnId = document.getElementById('btn-tp1_3-lang-id');
  const btnEn = document.getElementById('btn-tp1_3-lang-en');

  if (lang === 'en') {
    if (panelId) panelId.classList.add('hidden');
    if (panelEn) panelEn.classList.remove('hidden');
    if (btnEn) btnEn.className = 'px-3 py-1.5 rounded-xl text-xs font-bold font-title bg-amber-500 text-white shadow-xs transition flex items-center gap-1.5';
    if (btnId) btnId.className = 'px-3 py-1.5 rounded-xl text-xs font-bold font-title text-slate-600 hover:text-slate-900 transition flex items-center gap-1.5';
    showToast('Materi TP 1.3 beralih ke Bahasa Inggris 🇬🇧', 'info');
  } else {
    if (panelEn) panelEn.classList.add('hidden');
    if (panelId) panelId.classList.remove('hidden');
    if (btnId) btnId.className = 'px-3 py-1.5 rounded-xl text-xs font-bold font-title bg-amber-500 text-white shadow-xs transition flex items-center gap-1.5';
    if (btnEn) btnEn.className = 'px-3 py-1.5 rounded-xl text-xs font-bold font-title text-slate-600 hover:text-slate-900 transition flex items-center gap-1.5';
    showToast('Materi TP 1.3 beralih ke Bahasa Indonesia 🇮🇩', 'info');
  }
}

function gantiBahasaModulTP1_4(lang) {
  playSound('click');
  window.speechSynthesis && window.speechSynthesis.cancel();
  const panelId = document.getElementById('tp1_4-lang-id');
  const panelEn = document.getElementById('tp1_4-lang-en');
  const btnId = document.getElementById('btn-tp1_4-lang-id');
  const btnEn = document.getElementById('btn-tp1_4-lang-en');

  if (lang === 'en') {
    if (panelId) panelId.classList.add('hidden');
    if (panelEn) panelEn.classList.remove('hidden');
    if (btnEn) btnEn.className = 'px-3 py-1.5 rounded-xl text-xs font-bold font-title bg-purple-600 text-white shadow-xs transition flex items-center gap-1.5';
    if (btnId) btnId.className = 'px-3 py-1.5 rounded-xl text-xs font-bold font-title text-slate-600 hover:text-slate-900 transition flex items-center gap-1.5';
    showToast('Materi TP 1.4 beralih ke Bahasa Inggris 🇬🇧', 'info');
  } else {
    if (panelEn) panelEn.classList.add('hidden');
    if (panelId) panelId.classList.remove('hidden');
    if (btnId) btnId.className = 'px-3 py-1.5 rounded-xl text-xs font-bold font-title bg-purple-600 text-white shadow-xs transition flex items-center gap-1.5';
    if (btnEn) btnEn.className = 'px-3 py-1.5 rounded-xl text-xs font-bold font-title text-slate-600 hover:text-slate-900 transition flex items-center gap-1.5';
    showToast('Materi TP 1.4 beralih ke Bahasa Indonesia 🇮🇩', 'info');
  }
}

function gantiBahasaModulTP2_1(lang) {
  playSound('click');
  window.speechSynthesis && window.speechSynthesis.cancel();
  const panelId = document.getElementById('tp2_1-lang-id');
  const panelEn = document.getElementById('tp2_1-lang-en');
  const btnId = document.getElementById('btn-tp2_1-lang-id');
  const btnEn = document.getElementById('btn-tp2_1-lang-en');

  if (lang === 'en') {
    if (panelId) panelId.classList.add('hidden');
    if (panelEn) panelEn.classList.remove('hidden');
    if (btnEn) btnEn.className = 'px-3 py-1.5 rounded-xl text-xs font-bold font-title bg-blue-600 text-white shadow-xs transition flex items-center gap-1.5';
    if (btnId) btnId.className = 'px-3 py-1.5 rounded-xl text-xs font-bold font-title text-slate-600 hover:text-slate-900 transition flex items-center gap-1.5';
    showToast('Materi TP 2.1 beralih ke Bahasa Inggris 🇬🇧', 'info');
  } else {
    if (panelEn) panelEn.classList.add('hidden');
    if (panelId) panelId.classList.remove('hidden');
    if (btnId) btnId.className = 'px-3 py-1.5 rounded-xl text-xs font-bold font-title bg-blue-600 text-white shadow-xs transition flex items-center gap-1.5';
    if (btnEn) btnEn.className = 'px-3 py-1.5 rounded-xl text-xs font-bold font-title text-slate-600 hover:text-slate-900 transition flex items-center gap-1.5';
    showToast('Materi TP 2.1 beralih ke Bahasa Indonesia 🇮🇩', 'info');
  }
}

function bukaModalGambarMateri(src, judul = 'Pratinjau Infografis Materi') {
  playSound('click');
  const modal = document.getElementById('modal-gambar-materi');
  const img = document.getElementById('modal-gambar-materi-img');
  const txtJudul = document.getElementById('modal-gambar-materi-judul');
  const btnUnduh = document.getElementById('modal-gambar-materi-unduh');
  if (modal && img) {
    img.src = src;
    if (txtJudul) txtJudul.innerText = judul;
    if (btnUnduh) {
      btnUnduh.href = src;
      btnUnduh.download = src.split('/').pop();
    }
    modal.classList.remove('hidden');
  }
}

function tutupModalGambarMateri() {
  playSound('click');
  const modal = document.getElementById('modal-gambar-materi');
  if (modal) {
    modal.classList.add('hidden');
  }
}

window.bukaModulDetail = bukaModulDetail;
window.gulirKeTabelProta = gulirKeTabelProta;
window.gantiBahasaModulTP1_1 = gantiBahasaModulTP1_1;
window.gantiBahasaModulTP1_2 = gantiBahasaModulTP1_2;
window.gantiBahasaModulTP1_3 = gantiBahasaModulTP1_3;
window.gantiBahasaModulTP1_4 = gantiBahasaModulTP1_4;
window.gantiBahasaModulTP2_1 = gantiBahasaModulTP2_1;
window.bukaModalGambarMateri = bukaModalGambarMateri;
window.bukaModalGambarMateriDariSrc = bukaModalGambarMateri;
window.tutupModalGambarMateri = tutupModalGambarMateri;

// ==========================================
// 6. DEMONSTRASI LOGIKA (TP 2.1 - 2.4)
// ==========================================
function setDemoTab(demoKey) {
  playSound('click');
  const allDemos = ['demo-tp1', 'demo-tp2', 'demo-tp3', 'demo-tp4'];
  allDemos.forEach(d => {
    const panel = document.getElementById(d);
    const btn = document.getElementById(`btn-sub${d}`);
    if (panel && btn) {
      if (d === demoKey) {
        panel.classList.remove('hidden');
        btn.className = 'demo-sub-btn active-demo-sub px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold';
      } else {
        panel.classList.add('hidden');
        btn.className = 'demo-sub-btn px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold bg-slate-100 text-slate-600';
      }
    }
  });
  state.currentDemo = demoKey;
}

// Demo 1 Update
function updateDemo1() {
  playSound('click');
  const textSelect = document.getElementById('demo1-text-select').value;
  const imgSelect = document.getElementById('demo1-img-select').value;

  const previewText = document.getElementById('demo1-preview-text');
  if (textSelect === 'baca') {
    previewText.innerText = '"Buku Adalah Jendela Dunia. Ayo Membaca!" 📖';
  } else if (textSelect === 'sampah') {
    previewText.innerText = '"Buang Sampah Pada Tempatnya Demi Kelas Bersih!" 🧹';
  } else {
    previewText.innerText = '"Gunakan Internet dengan Sopan dan Cerdas!" 🌐';
  }

  const previewImg = document.getElementById('demo1-preview-img');
  if (imgSelect === 'buku') {
    previewImg.innerHTML = '<i class="fa-solid fa-book-open-reader"></i>';
    previewImg.className = 'text-6xl text-amber-500 transform hover:scale-110 transition duration-300';
  } else if (imgSelect === 'bumi') {
    previewImg.innerHTML = '<i class="fa-solid fa-earth-americas"></i>';
    previewImg.className = 'text-6xl text-emerald-500 transform hover:scale-110 transition duration-300';
  } else {
    previewImg.innerHTML = '<i class="fa-solid fa-rocket"></i>';
    previewImg.className = 'text-6xl text-purple-500 transform hover:scale-110 transition duration-300';
  }
}

// Demo 2: Dekomposisi Poster
function toggleDekomposisi(target) {
  playSound('click');
  const items = {
    judul: document.getElementById('decomp-judul'),
    gambar: document.getElementById('decomp-gambar'),
    deskripsi: document.getElementById('decomp-deskripsi'),
    action: document.getElementById('decomp-action')
  };

  Object.keys(items).forEach(key => {
    if (target === 'all' || target === key) {
      items[key].style.opacity = '1';
      items[key].style.transform = 'scale(1)';
    } else {
      items[key].style.opacity = '0.2';
      items[key].style.transform = 'scale(0.97)';
    }
  });
}

// Demo 3: Uji Harmonis
function evaluasiDemo3() {
  playSound('click');
  const teks = document.querySelector('input[name="demo3-teks"]:checked').value;
  const gambar = document.querySelector('input[name="demo3-gambar"]:checked').value;

  const iconEl = document.getElementById('demo3-status-icon');
  const titleEl = document.getElementById('demo3-status-title');
  const descEl = document.getElementById('demo3-status-desc');
  const badgeEl = document.getElementById('demo3-status-badge');

  if (teks === gambar) {
    iconEl.className = 'text-5xl my-4 text-emerald-500 animate-bounce';
    iconEl.innerHTML = '<i class="fa-solid fa-circle-check"></i>';
    titleEl.innerText = 'Sangat Cocok & Logis! 🎉';
    badgeEl.className = 'mt-4 py-1.5 px-3 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold';
    badgeEl.innerText = 'Skor Logika: 100/100 (Harmonis)';

    if (teks === 'taman') {
      descEl.innerText = 'Pesan ajakan merawat tanaman klop sekali dengan gambar tanaman pot. Pembaca langsung paham!';
    } else if (teks === 'olahraga') {
      descEl.innerText = 'Ajakan berolahraga sangat serasi dengan gambar bola dan sepatu senam!';
    } else {
      descEl.innerText = 'Pesan teknologi komputer sangat pas dipadukan dengan grafis gawai/komputer!';
    }
  } else {
    iconEl.className = 'text-5xl my-4 text-amber-500 animate-pulse';
    iconEl.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>';
    titleEl.innerText = 'Kurang Logis / Kurang Nyambung! 🤔';
    badgeEl.className = 'mt-4 py-1.5 px-3 rounded-xl bg-amber-100 text-amber-800 text-xs font-bold';
    badgeEl.innerText = 'Skor Logika: 40/100 (Perlu Diperbaiki)';
    descEl.innerText = 'Teks dan gambar memiliki topik yang berbeda. Audiens akan merasa bingung memahami pesan utamanya.';
  }
}

// ==========================================
// 7. PRAKTIK 1 (KONTEN SATUAN: TEKS & GAMBAR)
// ==========================================
function setPraktikSubtab(pKey) {
  playSound('click');
  const allP = ['praktik-tp1', 'praktik-tp2', 'praktik-tp3', 'praktik-tp4'];
  allP.forEach(p => {
    const panel = document.getElementById(p);
    const btn = document.getElementById(`btn-${p}`);
    if (panel && btn) {
      if (p === pKey) {
        panel.classList.remove('hidden');
        btn.className = 'praktik-sub-btn active-praktik-sub px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold';
      } else {
        panel.classList.add('hidden');
        btn.className = 'praktik-sub-btn px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-slate-100 text-slate-600';
      }
    }
  });
  state.currentPraktik = pKey;

  if (pKey === 'praktik-tp1') {
    if (state.p1Mode === 'gambar') {
      setTimeout(initPaintApp, 100);
    } else {
      setTimeout(renderGaleriPosterWord, 50);
    }
  }
}

function setModePraktik1(mode) {
  playSound('click');
  state.p1Mode = mode;
  const areaWord = document.getElementById('p1-area-teks');
  const areaGambar = document.getElementById('p1-area-gambar');
  const btnWord = document.getElementById('btn-mode-teks');
  const btnGambar = document.getElementById('btn-mode-gambar');

  if (mode === 'word' || mode === 'teks') {
    if (areaWord) areaWord.classList.remove('hidden');
    if (areaGambar) areaGambar.classList.add('hidden');
    if (btnWord) btnWord.className = 'px-3.5 py-2 rounded-xl font-bold text-xs bg-blue-600 text-white shadow-md transition flex items-center gap-1.5';
    if (btnGambar) btnGambar.className = 'px-3.5 py-2 rounded-xl font-bold text-xs bg-slate-100 text-slate-600 hover:bg-slate-200 shadow-sm transition flex items-center gap-1.5';
    renderGaleriPosterWord();
  } else {
    if (areaWord) areaWord.classList.add('hidden');
    if (areaGambar) areaGambar.classList.remove('hidden');
    if (btnGambar) btnGambar.className = 'px-3.5 py-2 rounded-xl font-bold text-xs bg-pink-500 text-white shadow-md transition flex items-center gap-1.5';
    if (btnWord) btnWord.className = 'px-3.5 py-2 rounded-xl font-bold text-xs bg-slate-100 text-slate-600 hover:bg-slate-200 shadow-sm transition flex items-center gap-1.5';
    setTimeout(initPaintApp, 60);
  }
}

function renderP1TextPreview() {
  const text = document.getElementById('p1-input-text').value || 'Tulis sesuatu...';
  const font = document.getElementById('p1-font-select').value;
  const bg = document.getElementById('p1-bg-select').value;

  const card = document.getElementById('p1-text-card');
  const display = document.getElementById('p1-preview-display');

  display.innerText = text;
  display.style.fontFamily = font;
  card.className = `w-full max-w-sm p-8 rounded-3xl border-2 shadow-lg text-center transition-all ${bg}`;
}

function addP1Emoji(emoji) {
  playSound('click');
  const input = document.getElementById('p1-input-text');
  input.value += ' ' + emoji;
  renderP1TextPreview();
}

// ==========================================
// ENGINE APLIKASI PAINT TERBARU (MODERN EDITION)
// ==========================================
let paintApp = {
  canvas: null,
  ctx: null,
  initialized: false,
  color: '#000000',
  size: 6,
  tool: 'brush', // brush, pencil, eraser, bucket, text
  shape: 'none', // none, line, rect, circle, star, heart
  isDrawing: false,
  startX: 0,
  startY: 0,
  snapshot: null,
  history: [],
  redoList: []
};

function initPaintApp() {
  paintApp.canvas = document.getElementById('paint-canvas');
  if (!paintApp.canvas) return;
  paintApp.ctx = paintApp.canvas.getContext('2d', { willReadFrequently: true });

  if (!paintApp.initialized) {
    // Beri latar belakang putih default
    paintApp.ctx.fillStyle = '#ffffff';
    paintApp.ctx.fillRect(0, 0, paintApp.canvas.width, paintApp.canvas.height);
    savePaintState();

    // Mouse Listeners
    paintApp.canvas.addEventListener('mousedown', startPaintDraw);
    paintApp.canvas.addEventListener('mousemove', onPaintDrawMove);
    paintApp.canvas.addEventListener('mouseup', endPaintDraw);
    paintApp.canvas.addEventListener('mouseleave', endPaintDraw);

    // Touch Listeners untuk Tablet / HP
    paintApp.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      startPaintDraw(e);
    }, { passive: false });
    paintApp.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      onPaintDrawMove(e);
    }, { passive: false });
    paintApp.canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      endPaintDraw();
    }, { passive: false });

    paintApp.initialized = true;
  }
}

function getPaintPointerPos(e) {
  const rect = paintApp.canvas.getBoundingClientRect();
  const scaleX = paintApp.canvas.width / rect.width;
  const scaleY = paintApp.canvas.height / rect.height;

  const clientX = e.clientX || (e.touches && e.touches[0].clientX);
  const clientY = e.clientY || (e.touches && e.touches[0].clientY);

  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY
  };
}

function startPaintDraw(e) {
  const pos = getPaintPointerPos(e);
  paintApp.isDrawing = true;
  paintApp.startX = pos.x;
  paintApp.startY = pos.y;

  // Simpan snapshot untuk preview shape
  paintApp.snapshot = paintApp.ctx.getImageData(0, 0, paintApp.canvas.width, paintApp.canvas.height);

  // Jika alat Cat Tumpah (Bucket)
  if (paintApp.tool === 'bucket') {
    paintApp.ctx.fillStyle = paintApp.color;
    paintApp.ctx.fillRect(0, 0, paintApp.canvas.width, paintApp.canvas.height);
    savePaintState();
    paintApp.isDrawing = false;
    playSound('click');
    return;
  }

  // Set gaya goresan
  paintApp.ctx.beginPath();
  paintApp.ctx.moveTo(pos.x, pos.y);
  paintApp.ctx.strokeStyle = (paintApp.tool === 'eraser') ? '#ffffff' : paintApp.color;
  paintApp.ctx.fillStyle = paintApp.color;
  paintApp.ctx.lineWidth = (paintApp.tool === 'pencil') ? 2 : ((paintApp.tool === 'eraser') ? paintApp.size * 2 : paintApp.size);
  paintApp.ctx.lineCap = 'round';
  paintApp.ctx.lineJoin = 'round';

  if (paintApp.shape === 'none' && paintApp.tool !== 'bucket') {
    paintApp.ctx.lineTo(pos.x, pos.y);
    paintApp.ctx.stroke();
  }
}

function onPaintDrawMove(e) {
  if (!paintApp.isDrawing) return;
  const pos = getPaintPointerPos(e);

  if (paintApp.shape === 'none') {
    // Mode goresan bebas (kuas, pensil, eraser)
    paintApp.ctx.strokeStyle = (paintApp.tool === 'eraser') ? '#ffffff' : paintApp.color;
    paintApp.ctx.lineWidth = (paintApp.tool === 'pencil') ? 2 : ((paintApp.tool === 'eraser') ? paintApp.size * 2 : paintApp.size);
    paintApp.ctx.lineTo(pos.x, pos.y);
    paintApp.ctx.stroke();
  } else {
    // Mode gambar bentuk (shapes) dengan restore snapshot
    paintApp.ctx.putImageData(paintApp.snapshot, 0, 0);
    paintApp.ctx.strokeStyle = paintApp.color;
    paintApp.ctx.lineWidth = paintApp.size;
    paintApp.ctx.fillStyle = paintApp.color;

    const sx = paintApp.startX;
    const sy = paintApp.startY;
    const ex = pos.x;
    const ey = pos.y;
    const w = ex - sx;
    const h = ey - sy;

    if (paintApp.shape === 'line') {
      paintApp.ctx.beginPath();
      paintApp.ctx.moveTo(sx, sy);
      paintApp.ctx.lineTo(ex, ey);
      paintApp.ctx.stroke();
    } else if (paintApp.shape === 'rect') {
      paintApp.ctx.strokeRect(sx, sy, w, h);
    } else if (paintApp.shape === 'circle') {
      paintApp.ctx.beginPath();
      const radius = Math.sqrt(w * w + h * h) / 2;
      const cx = (sx + ex) / 2;
      const cy = (sy + ey) / 2;
      paintApp.ctx.arc(cx, cy, Math.max(2, radius), 0, 2 * Math.PI);
      paintApp.ctx.stroke();
    } else if (paintApp.shape === 'star') {
      drawPaintStar(sx, sy, ex, ey);
    } else if (paintApp.shape === 'heart') {
      drawPaintHeart(sx, sy, ex, ey);
    }
  }
}

function endPaintDraw() {
  if (paintApp.isDrawing) {
    paintApp.isDrawing = false;
    paintApp.ctx.beginPath();
    savePaintState();
  }
}

// Menggambar Bentuk Bintang
function drawPaintStar(cx, cy, ex, ey) {
  const r = Math.sqrt((ex - cx) * (ex - cx) + (ey - cy) * (ey - cy));
  if (r < 4) return;
  const spikes = 5;
  const step = Math.PI / spikes;
  let rot = Math.PI / 2 * 3;
  let x = cx;
  let y = cy;

  paintApp.ctx.beginPath();
  paintApp.ctx.moveTo(cx, cy - r);
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * r;
    y = cy + Math.sin(rot) * r;
    paintApp.ctx.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * (r / 2);
    y = cy + Math.sin(rot) * (r / 2);
    paintApp.ctx.lineTo(x, y);
    rot += step;
  }
  paintApp.ctx.lineTo(cx, cy - r);
  paintApp.ctx.closePath();
  paintApp.ctx.stroke();
}

// Menggambar Bentuk Hati
function drawPaintHeart(sx, sy, ex, ey) {
  const w = ex - sx;
  const h = ey - sy;
  if (Math.abs(w) < 4 || Math.abs(h) < 4) return;

  const topCurveHeight = h * 0.3;
  paintApp.ctx.beginPath();
  paintApp.ctx.moveTo(sx + w / 2, sy + topCurveHeight);
  paintApp.ctx.bezierCurveTo(sx + w / 2, sy, sx, sy, sx, sy + topCurveHeight);
  paintApp.ctx.bezierCurveTo(sx, sy + (h + topCurveHeight) / 2, sx + w / 2, sy + (h + topCurveHeight) / 2, sx + w / 2, sy + h);
  paintApp.ctx.bezierCurveTo(sx + w / 2, sy + (h + topCurveHeight) / 2, sx + w, sy + (h + topCurveHeight) / 2, sx + w, sy + topCurveHeight);
  paintApp.ctx.bezierCurveTo(sx + w, sy, sx + w / 2, sy, sx + w / 2, sy + topCurveHeight);
  paintApp.ctx.closePath();
  paintApp.ctx.stroke();
}

// Pengaturan Tool, Shape, Size, dan Color Paint
function setPaintTool(toolName) {
  playSound('click');
  paintApp.tool = toolName;

  const tools = ['brush', 'pencil', 'eraser', 'bucket', 'text'];
  tools.forEach(t => {
    const btn = document.getElementById(`paint-tool-${t}`);
    if (btn) {
      if (t === toolName) {
        btn.className = 'paint-tool-btn active-paint-tool px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5';
      } else {
        btn.className = 'paint-tool-btn px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200';
      }
    }
  });

  const toolLabels = { brush: 'Kuas', pencil: 'Pensil', eraser: 'Penghapus', bucket: 'Cat Tumpah', text: 'Teks' };
  const labelEl = document.getElementById('paint-status-tool');
  if (labelEl) labelEl.innerText = toolLabels[toolName] || toolName;

  if (toolName === 'eraser') {
    paintApp.canvas.style.cursor = 'cell';
  } else if (toolName === 'bucket') {
    paintApp.canvas.style.cursor = 'copy';
  } else {
    paintApp.canvas.style.cursor = 'crosshair';
  }
}

function setPaintShape(shapeName) {
  playSound('click');
  paintApp.shape = shapeName;

  const shapes = ['none', 'line', 'rect', 'circle', 'star', 'heart'];
  shapes.forEach(s => {
    const btn = document.getElementById(`paint-shape-${s}`);
    if (btn) {
      if (s === shapeName) {
        btn.className = 'paint-shape-btn active-paint-shape px-2 py-1.5 rounded-xl font-bold text-xs';
      } else {
        btn.className = 'paint-shape-btn px-2 py-1.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200';
      }
    }
  });
}

function setPaintSize(sizeVal) {
  playSound('click');
  paintApp.size = sizeVal;

  [2, 6, 14, 28].forEach(sz => {
    const btn = document.getElementById(`paint-size-${sz}`);
    if (btn) {
      if (sz === sizeVal) {
        btn.className = 'paint-size-btn active-paint-size w-7 h-7 rounded-lg border font-bold flex items-center justify-center text-xs bg-blue-100 border-blue-400 text-blue-700';
      } else {
        btn.className = 'paint-size-btn w-7 h-7 rounded-lg border font-bold flex items-center justify-center text-xs bg-white text-slate-700';
      }
    }
  });

  const sizeEl = document.getElementById('paint-status-size');
  if (sizeEl) sizeEl.innerText = `${sizeVal}px`;
}

function setPaintColor(colorHex) {
  playSound('click');
  paintApp.color = colorHex;
  const indicator = document.getElementById('paint-active-color-indicator');
  if (indicator) indicator.style.backgroundColor = colorHex;

  const colorInput = document.getElementById('paint-custom-color');
  if (colorInput) colorInput.value = colorHex;
}

// Undo, Redo, Clear
function savePaintState() {
  if (!paintApp.canvas) return;
  const data = paintApp.canvas.toDataURL();
  paintApp.history.push(data);
  if (paintApp.history.length > 25) paintApp.history.shift();
  paintApp.redoList = [];
}

function undoPaintCanvas() {
  if (paintApp.history.length > 1) {
    playSound('click');
    const current = paintApp.history.pop();
    paintApp.redoList.push(current);
    const prevState = paintApp.history[paintApp.history.length - 1];
    restorePaintState(prevState);
    showToast('Langkah lukisan dibatalkan (Undo)');
  }
}

function redoPaintCanvas() {
  if (paintApp.redoList.length > 0) {
    playSound('click');
    const nextState = paintApp.redoList.pop();
    paintApp.history.push(nextState);
    restorePaintState(nextState);
    showToast('Langkah lukisan dimajukan (Redo)');
  }
}

function restorePaintState(dataUrl) {
  const img = new Image();
  img.onload = () => {
    paintApp.ctx.clearRect(0, 0, paintApp.canvas.width, paintApp.canvas.height);
    paintApp.ctx.drawImage(img, 0, 0);
  };
  img.src = dataUrl;
}

function clearPaintCanvas() {
  playSound('click');
  if (confirm('Kosongkan lembar kanvas Paint dan mulai lukisan baru?')) {
    paintApp.ctx.fillStyle = '#ffffff';
    paintApp.ctx.fillRect(0, 0, paintApp.canvas.width, paintApp.canvas.height);
    savePaintState();
    showToast('Kanvas Paint telah dibersihkan!');
  }
}

function tambahTeksKePaintPrompt() {
  playSound('click');
  const userText = prompt('Ketik kata atau kalimat yang ingin ditempel ke lukisan:', 'CINTAI ALAM');
  if (userText && userText.trim()) {
    paintApp.ctx.fillStyle = paintApp.color;
    paintApp.ctx.font = 'bold 28px Fredoka, sans-serif';
    paintApp.ctx.fillText(userText.trim(), paintApp.canvas.width / 2 - 80, paintApp.canvas.height / 2);
    savePaintState();
    showToast('Teks berhasil ditempel ke lukisan!');
  }
}

// ==========================================================
// FITUR SIMPAN GAMBAR PNG DARI PAINT (FITUR UTAMA)
// ==========================================================
function downloadPaintCanvas() {
  playSound('fanfare');
  if (!paintApp.canvas) return;

  const link = document.createElement('a');
  link.download = `Lukisan-Paint-Cilik-Kelas4-${Date.now()}.png`;
  link.href = paintApp.canvas.toDataURL('image/png');
  link.click();

  tambahPoin(30);
  showToast('Lukisan Paint berhasil disimpan dan diunduh ke komputer! 💾 (+30 Bintang)', 'success');
}

// FITUR KIRIM HASIL LUKISAN PAINT LANGSUNG KE LAB MS WORD
function kirimPaintKeWord() {
  playSound('success');
  if (!paintApp.canvas) return;

  const dataUrl = paintApp.canvas.toDataURL('image/png');
  sisipkanGambarLuarKeWord(dataUrl, 'Lukisan dari Paint');
  switchTab('msword');
  showToast('Lukisan Paint langsung dipasang di lembar kerja Word! 📄', 'success');
}

// Backward compatibility helper
function clearP1Canvas() {
  clearPaintCanvas();
}
function setP1BrushColor(c) {
  setPaintColor(c);
}

// ==========================================
// 8. PRAKTIK 2: PUZZLE DEKOMPOSISI
// ==========================================
function selectP2Item(itemId, itemType) {
  playSound('click');
  // Hapus seleksi sebelumnya
  document.querySelectorAll('.p2-draggable').forEach(el => el.classList.remove('selected'));

  const el = document.getElementById(itemId);
  if (!el) return;

  el.classList.add('selected');
  state.p2SelectedItem = { id: itemId, type: itemType };
  document.getElementById('p2-selected-info').innerText =
    `Item terpilih: "${state.p2Items[itemId].label}". Sekarang klik wadah tujuannya!`;
}

function dropP2ItemTo(targetWadah) {
  if (!state.p2SelectedItem) {
    showToast('Pilih salah satu komponen di sebelah kiri terlebih dahulu!', 'info');
    return;
  }

  const { id, type } = state.p2SelectedItem;
  const isCorrect = (type === targetWadah);

  if (isCorrect) {
    playSound('success');
    // Pindahkan item ke wadah
    const itemEl = document.getElementById(id);
    if (itemEl) itemEl.remove();

    const slotContainer = document.getElementById(`p2-slot-${targetWadah}`);
    const placeholder = slotContainer.querySelector('.placeholder-text');
    if (placeholder) placeholder.remove();

    const placedDiv = document.createElement('div');
    placedDiv.className = 'p-2 bg-white rounded-xl shadow-xs border border-slate-200 font-semibold';
    placedDiv.innerText = state.p2Items[id].label;
    slotContainer.appendChild(placedDiv);

    state.p2PlacedCount++;
    const remaining = 4 - state.p2PlacedCount;
    document.getElementById('p2-remaining-count').innerText = `${remaining} tersisa`;

    state.p2SelectedItem = null;
    document.getElementById('p2-selected-info').innerText = 'Bagus! Silakan pilih komponen berikutnya.';

    if (state.p2PlacedCount === 4) {
      tambahPoin(30);
      document.getElementById('p2-feedback-box').classList.remove('hidden');
      playSound('fanfare');
    }
  } else {
    playSound('error');
    showToast(`Kurang tepat! Komponen tersebut bukan untuk wadah ${targetWadah}. Ingat Dekomposisi!`, 'error');
  }
}

function resetPraktik2() {
  playSound('click');
  state.p2PlacedCount = 0;
  state.p2SelectedItem = null;

  document.getElementById('p2-remaining-count').innerText = '4 tersisa';
  document.getElementById('p2-feedback-box').classList.add('hidden');
  document.getElementById('p2-selected-info').innerText =
    'Klik salah satu komponen di atas, lalu klik kotak wadah tujuannya di sebelah kanan!';

  // Reset Wadah
  document.getElementById('p2-slot-teks').innerHTML =
    '<p class="text-blue-400 italic text-[11px] placeholder-text">Belum ada teks dimasukkan...</p>';
  document.getElementById('p2-slot-gambar').innerHTML =
    '<p class="text-emerald-400 italic text-[11px] placeholder-text">Belum ada gambar dimasukkan...</p>';

  // Re-populate bank
  const bank = document.getElementById('p2-items-bank');
  bank.innerHTML = `
    <div id="p2-item-1" onclick="selectP2Item('p2-item-1', 'teks')" class="p2-draggable p-2.5 bg-white rounded-xl border border-slate-300 text-xs font-bold cursor-pointer hover:border-blue-400 flex items-center justify-between shadow-sm">
      <span>"HEMAT ENERGI LISTRIK"</span>
      <span class="text-[10px] text-slate-400">Pilih</span>
    </div>
    <div id="p2-item-2" onclick="selectP2Item('p2-item-2', 'gambar')" class="p2-draggable p-2.5 bg-white rounded-xl border border-slate-300 text-xs font-bold cursor-pointer hover:border-emerald-400 flex items-center justify-between shadow-sm">
      <span>💡 [Ikon Lampu Bohlam Hemat]</span>
      <span class="text-[10px] text-slate-400">Pilih</span>
    </div>
    <div id="p2-item-3" onclick="selectP2Item('p2-item-3', 'teks')" class="p2-draggable p-2.5 bg-white rounded-xl border border-slate-300 text-xs font-bold cursor-pointer hover:border-purple-400 flex items-center justify-between shadow-sm">
      <span>"Matikan saklar saat tidak dipakai untuk cegah boros listrik."</span>
      <span class="text-[10px] text-slate-400">Pilih</span>
    </div>
    <div id="p2-item-4" onclick="selectP2Item('p2-item-4', 'gambar')" class="p2-draggable p-2.5 bg-white rounded-xl border border-slate-300 text-xs font-bold cursor-pointer hover:border-emerald-400 flex items-center justify-between shadow-sm">
      <span>🔌 [Ikon Cabut Colokan Kabel]</span>
      <span class="text-[10px] text-slate-400">Pilih</span>
    </div>
  `;
}

// ==========================================
// 9. PRAKTIK 3: STUDIO POSTER KREATIF (TP 2.3)
// ==========================================
function updateStudioPoster() {
  const judul = document.getElementById('p3-judul').value || 'JUDUL POSTER';
  const desc = document.getElementById('p3-deskripsi').value || 'Deskripsi pesan kamu...';
  const creator = document.getElementById('p3-creator').value || 'Siswa Kelas 4';

  document.getElementById('poster-display-judul').innerText = judul;
  document.getElementById('poster-display-deskripsi').innerText = desc;
  document.getElementById('poster-display-creator').innerText = creator;
}

function setP3Sticker(iconClass) {
  playSound('click');
  state.posterIcon = iconClass;
  const iconDisplay = document.getElementById('poster-display-icon');
  iconDisplay.className = `fa-solid ${iconClass} text-6xl text-yellow-300 drop-shadow`;
}

function setP3BgTheme(theme) {
  playSound('click');
  state.posterBg = theme;
  const box = document.getElementById('poster-canvas-box');

  if (theme === 'blue') {
    box.className = 'w-full max-w-sm aspect-[4/5] rounded-3xl p-6 shadow-2xl flex flex-col justify-between text-center relative overflow-hidden transition-all duration-300 bg-gradient-to-b from-blue-600 to-indigo-800 text-white border-4 border-white';
  } else if (theme === 'green') {
    box.className = 'w-full max-w-sm aspect-[4/5] rounded-3xl p-6 shadow-2xl flex flex-col justify-between text-center relative overflow-hidden transition-all duration-300 bg-gradient-to-b from-emerald-600 to-teal-800 text-white border-4 border-white';
  } else if (theme === 'purple') {
    box.className = 'w-full max-w-sm aspect-[4/5] rounded-3xl p-6 shadow-2xl flex flex-col justify-between text-center relative overflow-hidden transition-all duration-300 bg-gradient-to-b from-purple-600 to-indigo-900 text-white border-4 border-white';
  } else if (theme === 'yellow') {
    box.className = 'w-full max-w-sm aspect-[4/5] rounded-3xl p-6 shadow-2xl flex flex-col justify-between text-center relative overflow-hidden transition-all duration-300 bg-gradient-to-b from-amber-400 to-orange-500 text-slate-900 border-4 border-white';
  } else if (theme === 'sunset') {
    box.className = 'w-full max-w-sm aspect-[4/5] rounded-3xl p-6 shadow-2xl flex flex-col justify-between text-center relative overflow-hidden transition-all duration-300 bg-gradient-to-b from-pink-500 via-rose-500 to-orange-500 text-white border-4 border-white';
  }
}

function applyP3Preset(preset) {
  playSound('click');
  if (preset === 'buku') {
    document.getElementById('p3-judul').value = 'MEMBACA ITU KEREN!';
    document.getElementById('p3-deskripsi').value = 'Luangkan 15 menit setiap hari untuk membaca buku favoritmu di perpustakaan!';
    setP3Sticker('fa-book-open');
    setP3BgTheme('blue');
  } else if (preset === 'lingkungan') {
    document.getElementById('p3-judul').value = 'KELAS BERSIH, BELAJAR NYAMAN!';
    document.getElementById('p3-deskripsi').value = 'Ayo buang sampah pada tempatnya dan lakukan piket kelas dengan ceria!';
    setP3Sticker('fa-seedling');
    setP3BgTheme('green');
  } else if (preset === 'sahabat') {
    document.getElementById('p3-judul').value = 'STOP BULLYING, KITA SAHABAT!';
    document.getElementById('p3-deskripsi').value = 'Saling tolong-menolong, saling menyayangi, dan jadilah teman yang baik!';
    setP3Sticker('fa-hands-holding-child');
    setP3BgTheme('purple');
  } else if (preset === 'sarapan') {
    document.getElementById('p3-judul').value = 'SARAPAN SEHAT SETIAP PAGI!';
    document.getElementById('p3-deskripsi').value = 'Biar konsentrasi belajar makin maksimal dan tubuh tetap berenergi!';
    setP3Sticker('fa-apple-whole');
    setP3BgTheme('yellow');
  }
  updateStudioPoster();
}

function unduhPosterKarya() {
  playSound('success');
  const exportCanvas = document.getElementById('export-canvas');
  const eCtx = exportCanvas.getContext('2d');

  const width = exportCanvas.width;
  const height = exportCanvas.height;

  // Background gradient
  const grad = eCtx.createLinearGradient(0, 0, 0, height);
  if (state.posterBg === 'green') {
    grad.addColorStop(0, '#059669');
    grad.addColorStop(1, '#115e59');
  } else if (state.posterBg === 'purple') {
    grad.addColorStop(0, '#7c3aed');
    grad.addColorStop(1, '#312e81');
  } else if (state.posterBg === 'yellow') {
    grad.addColorStop(0, '#fbbf24');
    grad.addColorStop(1, '#f97316');
  } else if (state.posterBg === 'sunset') {
    grad.addColorStop(0, '#ec4899');
    grad.addColorStop(1, '#ea580c');
  } else {
    grad.addColorStop(0, '#2563eb');
    grad.addColorStop(1, '#3730a3');
  }
  eCtx.fillStyle = grad;
  eCtx.fillRect(0, 0, width, height);

  // Decorative border
  eCtx.strokeStyle = '#ffffff';
  eCtx.lineWidth = 14;
  eCtx.strokeRect(15, 15, width - 30, height - 30);

  // Badge Header
  eCtx.fillStyle = '#fef08a';
  eCtx.font = 'bold 22px Fredoka, sans-serif';
  eCtx.textAlign = 'center';
  eCtx.fillText('★ KARYA KONTEN DIGITAL SISWA KELAS 4 SD ★', width / 2, 80);

  // Title
  eCtx.fillStyle = '#ffffff';
  eCtx.font = '900 36px Fredoka, sans-serif';
  const judul = document.getElementById('p3-judul').value || 'JUDUL POSTER';
  eCtx.fillText(judul, width / 2, 160);

  // Center Circle Box
  eCtx.beginPath();
  eCtx.arc(width / 2, height / 2 - 20, 110, 0, 2 * Math.PI);
  eCtx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  eCtx.fill();
  eCtx.lineWidth = 5;
  eCtx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  eCtx.stroke();

  // Emoji / Icon
  eCtx.font = '80px sans-serif';
  eCtx.fillStyle = '#ffffff';
  let iconEmoji = '📖';
  if (state.posterIcon === 'fa-seedling') iconEmoji = '🌱';
  if (state.posterIcon === 'fa-hands-holding-child') iconEmoji = '🤝';
  if (state.posterIcon === 'fa-apple-whole') iconEmoji = '🍎';
  if (state.posterIcon === 'fa-rocket') iconEmoji = '🚀';
  eCtx.fillText(iconEmoji, width / 2, height / 2 + 10);

  // Description
  eCtx.font = '22px Nunito, sans-serif';
  eCtx.fillStyle = '#f8fafc';
  const desc = document.getElementById('p3-deskripsi').value || '';
  // Simple word wrap
  const words = desc.split(' ');
  let line = '';
  let y = height - 190;
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = eCtx.measureText(testLine);
    if (metrics.width > 500 && n > 0) {
      eCtx.fillText(line, width / 2, y);
      line = words[n] + ' ';
      y += 32;
    } else {
      line = testLine;
    }
  }
  eCtx.fillText(line, width / 2, y);

  // Footer creator
  eCtx.font = 'bold 20px Fredoka, sans-serif';
  eCtx.fillStyle = '#fde047';
  const creator = document.getElementById('p3-creator').value || 'Kreator Cilik';
  eCtx.fillText(`Dibuat Oleh: ${creator}`, width / 2, height - 60);

  // Download Trigger
  const link = document.createElement('a');
  link.download = `Poster-Digital-Kelas4-${Date.now()}.png`;
  link.href = exportCanvas.toDataURL('image/png');
  link.click();

  showToast('Poster berhasil diunduh ke komputermu! 🎨', 'success');
}

// ==========================================
// 10. PRAKTIK 4: SIMULASI DISEMINASI & EVALUASI (TP 2.4)
// ==========================================
function jalankanSimulasiDiseminasi() {
  playSound('click');
  const audiens = document.getElementById('p4-audiens').value;
  const saluran = document.getElementById('p4-saluran').value;
  const privasiAman = document.getElementById('p4-check-privasi').checked;
  const bahasaSopan = document.getElementById('p4-check-bahasa').checked;

  const resultScreen = document.getElementById('p4-result-screen');
  const note = document.getElementById('p4-evaluasi-note');

  let htmlResult = '';

  if (saluran === 'mading') {
    htmlResult = `
      <div class="p-4 bg-emerald-50 rounded-2xl border border-emerald-300 space-y-2 animate-fadeIn">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-emerald-800 bg-emerald-200 px-2 py-0.5 rounded-full">Hasil Diseminasi: Sukses Besar</span>
          <span class="text-xs text-slate-500 font-bold">Respon: 100% Positif</span>
        </div>
        <p class="text-sm font-bold text-emerald-950 font-title">Mading Digital Kelas 4 Menyala!</p>
        <div class="space-y-1.5 text-xs text-slate-700 bg-white p-3 rounded-xl border">
          <p>❤️ <b>24 Teman Kelas</b> menyukai postermu!</p>
          <p>💬 "Warnanya pas banget dan kata-katanya mudah diingat." - Siti</p>
          <p>🌟 "Bagus sekali nak, contoh pemanfaatan internet yang positif." - Wali Kelas</p>
        </div>
      </div>
    `;
  } else if (saluran === 'presentasi') {
    htmlResult = `
      <div class="p-4 bg-blue-50 rounded-2xl border border-blue-300 space-y-2 animate-fadeIn">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-blue-800 bg-blue-200 px-2 py-0.5 rounded-full">Hasil Diseminasi: Sangat Interaktif</span>
          <span class="text-xs text-slate-500 font-bold">Tepuk Tangan Meriah</span>
        </div>
        <p class="text-sm font-bold text-blue-950 font-title">Presentasi di Depan Kelas Berhasil!</p>
        <div class="space-y-1.5 text-xs text-slate-700 bg-white p-3 rounded-xl border">
          <p>👏 Semua teman bertepuk tangan setelah mendengar penjelasanmu.</p>
          <p>🙋‍♂️ 3 Teman bertanya bagaimana cara membuat perpaduan teksnya.</p>
        </div>
      </div>
    `;
  } else {
    htmlResult = `
      <div class="p-4 bg-purple-50 rounded-2xl border border-purple-300 space-y-2 animate-fadeIn">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-purple-800 bg-purple-200 px-2 py-0.5 rounded-full">Hasil Diseminasi: Menginspirasi Rumah</span>
        </div>
        <p class="text-sm font-bold text-purple-950 font-title">Orang Tua Ikut Bangga!</p>
        <div class="space-y-1.5 text-xs text-slate-700 bg-white p-3 rounded-xl border">
          <p>💖 Ayah dan Ibu memuji hasil karya poster digitalmu.</p>
          <p>📱 Dibagikan ke grup keluarga dengan aman tanpa bocor data pribadi.</p>
        </div>
      </div>
    `;
  }

  resultScreen.innerHTML = htmlResult;
  note.classList.remove('hidden');
  tambahPoin(35);
  showToast('Diseminasi berhasil & evaluasi dampak sangat baik! (+35 Bintang)', 'success');
}

// ==========================================
// 11. TANTANGAN KUIS INTERAKTIF & SERTIFIKAT
// ==========================================
const quizQuestions = [
  {
    tp: 'TP 2.1 (Konten Tunggal Sederhana)',
    question: 'Manakah di bawah ini yang merupakan contoh satu konten digital teks sederhana?',
    options: [
      'Sebuah slogan: "Matikan Keran Air Setelah Digunakan!"',
      'Video film kartun berdurasi 2 jam tanpa tulisan',
      'Kumpulan 10 foto tanpa teks dan tanpa keterangan',
      'Kertas gambar yang digambar manual dengan krayon'
    ],
    correct: 0,
    explanation: 'Slogan singkat yang dibuat di gawai adalah contoh konten teks digital tunggal yang memiliki pesan jelas!'
  },
  {
    tp: 'TP 2.2 (Menyusun Secara Terpisah)',
    question: 'Mengapa dalam Berpikir Komputasional (BK) kita perlu memisahkan elemen judul, teks isi, dan gambar sebelum digabungkan?',
    options: [
      'Agar proses pembuatan menjadi sangat lama dan sulit',
      'Agar jika ada kesalahan ketik judul, kita tidak perlu mengulang membuat seluruh gambar dari awal',
      'Supaya warnanya hilang semua',
      'Supaya tidak bisa dibaca oleh guru'
    ],
    correct: 1,
    explanation: 'Dekomposisi memecah bagian menjadi terpisah sehingga mudah diedit, ditata ulang, dan dirawat tanpa merusak bagian lain.'
  },
  {
    tp: 'TP 2.3 (Kombinasi Logis)',
    question: 'Jika kamu membuat poster bertema "Lomba Membaca Buku di Perpustakaan", gambar apakah yang paling logis dan cocok dipasangkan?',
    options: [
      'Gambar semangkuk bakso kuah pedas',
      'Gambar seorang anak tersenyum sedang membuka buku',
      'Gambar mobil truk derek',
      'Gambar gunung berapi meletus'
    ],
    correct: 1,
    explanation: 'Kombinasi logis mengharuskan gambar berhubungan langsung dengan isi pesan teks agar audiens tidak bingung.'
  },
  {
    tp: 'TP 2.4 (Diseminasi & Etika Digital)',
    question: 'Sebelum menyebarkan karya poster digital ke internet, hal penting apa yang TIDAK BOLEH dicantumkan demi keamanan privasi anak?',
    options: [
      'Nama lengkap, alamat rumah asli, dan nomor telepon pribadi',
      'Pesan motivasi belajar',
      'Gambar ikon kartun yang lucu',
      'Warna latar belakang poster yang cerah'
    ],
    correct: 0,
    explanation: 'Data privasi sensitif seperti alamat rumah dan nomor kontak tidak boleh disebarkan secara sembarangan di internet demi keamanan!'
  },
  {
    tp: 'Berpikir Komputasional',
    question: 'Kemampuan memilih informasi yang penting saja dan membuang detail yang tidak berguna saat membuat poster disebut...',
    options: [
      'Algoritma',
      'Abstraksi',
      'Dekomposisi',
      'Pengenalan Pola'
    ],
    correct: 1,
    explanation: 'Abstraksi adalah pilar Berpikir Komputasional untuk memfokuskan pikiran pada pesan inti dan mengabaikan hal yang tidak relevan.'
  }
];

// Bank Soal Kuis Khusus Semester 2: Pemrograman Balok & AI Cilik
const quizQuestionsSem2 = [
  {
    tp: 'TP 2.5 (Pemrograman Balok)',
    question: 'Pada aplikasi pemrograman visual (seperti Scratch / Blockly), balok perintah apakah yang ditaruh paling atas untuk memulai jalannya animasi saat tombol bendera ditekan?',
    options: [
      'Saat Bendera Hijau Diklik (When Green Flag Clicked)',
      'Hapus Semua Layar',
      'Matikan Komputer',
      'Tutup Jendela Aplikasi'
    ],
    correct: 0,
    explanation: 'Balok "Saat Bendera Hijau Diklik" adalah balok Kejadian (Event) utama yang memicu berjalannya seluruh urutan algoritma!'
  },
  {
    tp: 'TP 2.6 (Logika Perulangan / Loops)',
    question: 'Jika kamu ingin karakter robot Robo-Tzu Chi melangkah maju sebanyak 10 kali secara otomatis, balok cerdas apa yang paling ringkas digunakan?',
    options: [
      'Balok Perulangan (Ulangi 10 Kali / Repeat 10)',
      'Balok Ganti Latar Belakang Kertas',
      'Balok Menghapus Teks Dokumen',
      'Balok Berhenti Selamanya'
    ],
    correct: 0,
    explanation: 'Balok Perulangan (Looping) menghemat langkah kode dengan mengulang instruksi secara otomatis sesuai jumlah yang ditentukan.'
  },
  {
    tp: 'TP 2.6 (Percabangan Logika If-Else)',
    question: 'Instruksi: "JIKA robot mendeteksi sampah plastik, MAKA robot memasukkannya ke tong daur ulang". Dalam pemrograman, ini disebut aturan...',
    options: [
      'Percabangan Logika (Jika - Maka / If - Else)',
      'Mengganti Ukuran Huruf',
      'Menyimpan File PNG',
      'Menggambar Bentuk Bebas'
    ],
    correct: 0,
    explanation: 'Percabangan (If-Else) memungkinkan komputer atau robot mengambil keputusan cerdas sesuai kondisi di sekitarnya.'
  },
  {
    tp: 'TP 2.7 (Kecerdasan Buatan / AI Cilik)',
    question: 'Bagaimana cara komputer atau robot dengan kamera AI belajar membedakan botol plastik daur ulang dengan daun kering di taman?',
    options: [
      'AI dilatih dengan banyak contoh foto benda tersebut (Machine Learning)',
      'AI menebak secara acak dengan mata tertutup',
      'Robot mencium aroma benda dari jauh',
      'Komputer mendengarkan suara angin'
    ],
    correct: 0,
    explanation: 'Kecerdasan Buatan (AI) mengenali pola visual karena dilatih menggunakan data contoh foto dalam jumlah banyak (Machine Learning).'
  },
  {
    tp: 'TP 2.8 (Etika Budi Pekerti Tzu Chi)',
    question: 'Sebagai insan Tzu Chi yang berkarakter luhur, bagaimana sikap yang bijak saat kita menggunakan teknologi AI dan coding?',
    options: [
      'Memakai teknologi untuk kebaikan, menjaga kebersihan bumi, dan bersyukur (Gan En)',
      'Menyombongkan hasil karya dan mengejek teman yang belum paham',
      'Menggunakan kecerdasan buatan untuk berbuat curang saat ujian sekolah',
      'Bermain gim komputer berlebihan sampai lupa tugas belajar'
    ],
    correct: 0,
    explanation: 'Nilai budi pekerti Tzu Chi menekankan bahwa teknologi diciptakan sebagai sarana menebarkan cinta kasih dan melestarikan lingkungan.'
  }
];

function getActiveQuizList() {
  return state.currentSemester === 2 ? quizQuestionsSem2 : quizQuestions;
}

function loadQuizQuestion() {
  state.quizAnswered = false;
  const activeQuiz = getActiveQuizList();
  if (state.currentQuizIndex >= activeQuiz.length) {
    state.currentQuizIndex = 0;
  }
  const currentQ = activeQuiz[state.currentQuizIndex];
  
  const progEl = document.getElementById('quiz-progress-text');
  if (progEl) progEl.innerText = `Pertanyaan ${state.currentQuizIndex + 1} dari ${activeQuiz.length}`;
  
  const badgeEl = document.getElementById('quiz-tp-badge');
  if (badgeEl) badgeEl.innerText = currentQ.tp;
  
  const qEl = document.getElementById('quiz-question');
  if (qEl) qEl.innerText = currentQ.question;

  const optContainer = document.getElementById('quiz-options');
  if (optContainer) {
    optContainer.innerHTML = '';
    currentQ.options.forEach((opt, idx) => {
      const btn = document.createElement('button');
      btn.className = 'w-full text-left p-3.5 rounded-2xl border-2 border-slate-200 bg-white hover:border-blue-400 text-xs sm:text-sm font-semibold transition flex items-center justify-between';
      btn.innerHTML = `
        <span>${String.fromCharCode(65 + idx)}. ${opt}</span>
        <i class="fa-regular fa-circle text-slate-300"></i>
      `;
      btn.onclick = () => selectQuizAnswer(idx, btn);
      optContainer.appendChild(btn);
    });
  }

  const expEl = document.getElementById('quiz-explanation');
  if (expEl) expEl.className = 'hidden p-4 rounded-2xl text-xs sm:text-sm font-medium';
  
  const nextBtn = document.getElementById('quiz-next-btn');
  if (nextBtn) nextBtn.classList.add('hidden');
}

function selectQuizAnswer(selectedIndex, buttonEl) {
  if (state.quizAnswered) return;
  state.quizAnswered = true;

  const activeQuiz = getActiveQuizList();
  const currentQ = activeQuiz[state.currentQuizIndex];
  const allButtons = document.querySelectorAll('#quiz-options button');
  const explanationEl = document.getElementById('quiz-explanation');

  allButtons.forEach(btn => btn.disabled = true);

  if (selectedIndex === currentQ.correct) {
    playSound('success');
    state.quizScore += 20;
    const scoreEl = document.getElementById('quiz-score');
    if (scoreEl) scoreEl.innerText = state.quizScore;
    buttonEl.className = 'w-full text-left p-3.5 rounded-2xl border-2 border-emerald-500 bg-emerald-50 text-emerald-900 text-xs sm:text-sm font-bold flex items-center justify-between';
    buttonEl.innerHTML += '<i class="fa-solid fa-circle-check text-emerald-600 text-lg"></i>';

    if (explanationEl) {
      explanationEl.className = 'p-4 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs sm:text-sm font-medium';
      explanationEl.innerHTML = `🎉 <b>Jawaban Benar!</b> ${currentQ.explanation}`;
    }
  } else {
    playSound('error');
    buttonEl.className = 'w-full text-left p-3.5 rounded-2xl border-2 border-rose-500 bg-rose-50 text-rose-900 text-xs sm:text-sm font-bold flex items-center justify-between';
    buttonEl.innerHTML += '<i class="fa-solid fa-circle-xmark text-rose-600 text-lg"></i>';

    const correctBtn = allButtons[currentQ.correct];
    if (correctBtn) {
      correctBtn.className = 'w-full text-left p-3.5 rounded-2xl border-2 border-emerald-500 bg-emerald-50 text-emerald-900 text-xs sm:text-sm font-bold flex items-center justify-between';
    }

    if (explanationEl) {
      explanationEl.className = 'p-4 rounded-2xl bg-rose-100 border border-rose-300 text-rose-900 text-xs sm:text-sm font-medium';
      explanationEl.innerHTML = `❌ <b>Kurang Tepat.</b> ${currentQ.explanation}`;
    }
  }

  if (explanationEl) explanationEl.classList.remove('hidden');
  const nextBtn = document.getElementById('quiz-next-btn');
  if (nextBtn) nextBtn.classList.remove('hidden');
}

function nextQuestion() {
  playSound('click');
  state.currentQuizIndex++;
  const activeQuiz = getActiveQuizList();
  if (state.currentQuizIndex < activeQuiz.length) {
    loadQuizQuestion();
  } else {
    // Selesai Kuis
    const quizBox = document.getElementById('quiz-box');
    const certBox = document.getElementById('certificate-box');
    if (quizBox) quizBox.classList.add('hidden');
    if (certBox) certBox.classList.remove('hidden');
    
    const certScore = document.getElementById('cert-score');
    if (certScore) certScore.innerText = state.quizScore;
    
    // Perbarui judul sertifikat jika Semester 2
    const certTitle = document.getElementById('cert-title');
    const certSub = document.getElementById('cert-sub');
    if (certTitle) {
      certTitle.innerText = state.currentSemester === 2
        ? 'PROGRAMMER CILIK & KECERDASAN BUATAN'
        : 'KREATOR KONTEN DIGITAL CILIK';
    }
    if (certSub) {
      certSub.innerHTML = state.currentSemester === 2
        ? 'Telah berhasil menguasai materi <b>Pemrograman Visual & Kecerdasan Buatan Cilik</b> (TP 2.5 - TP 2.8) Kelas 4 SD Semester 2 dengan predikat:'
        : 'Telah berhasil menguasai materi <b>Memanfaatkan Internet & Berpikir Komputasional</b> (TP 2.1 - TP 2.4) Kelas 4 SD Semester 1 dengan predikat:';
    }

    tambahPoin(state.quizScore);
    playSound('fanfare');
    showToast(`Kuis Selesai! Kamu mendapat nilai ${state.quizScore}! 🏆`, 'success');

    // Simpan hasil kuis otomatis ke Database Guru
    if (typeof catatHasilKuisSiswa === 'function') {
      catatHasilKuisSiswa(state.currentSemester, state.quizScore);
    }
  }
}

function restartQuiz() {
  playSound('click');
  state.currentQuizIndex = 0;
  state.quizScore = 0;
  const scoreEl = document.getElementById('quiz-score');
  if (scoreEl) scoreEl.innerText = '0';
  const certBox = document.getElementById('certificate-box');
  const quizBox = document.getElementById('quiz-box');
  if (certBox) certBox.classList.add('hidden');
  if (quizBox) quizBox.classList.remove('hidden');
  loadQuizQuestion();
}

// ==========================================
// 13. SIMULATOR MICROSOFT WORD: POSTER LINGKUNGAN HIDUP
// ==========================================
const WORD_IMAGES = {
  bangun_pagi: { name: '1. Bangun Pagi', icon: 'fa-sun', color: '#eab308', size: 75, emoji: '🌅' },
  beribadah: { name: '2. Beribadah', icon: 'fa-hands-praying', color: '#0284c7', size: 75, emoji: '🤲' },
  berolahraga: { name: '3. Berolahraga', icon: 'fa-futbol', color: '#ea580c', size: 75, emoji: '⚽' },
  makan_sehat: { name: '4. Makan Bergizi', icon: 'fa-apple-whole', color: '#16a34a', size: 75, emoji: '🥗' },
  gemar_belajar: { name: '5. Gemar Belajar', icon: 'fa-book-open-reader', color: '#7c3aed', size: 75, emoji: '📖' },
  bermasyarakat: { name: '6. Bermasyarakat', icon: 'fa-people-group', color: '#0d9488', size: 75, emoji: '🤝' },
  tidur_cepat: { name: '7. Tidur Cepat', icon: 'fa-moon', color: '#4f46e5', size: 75, emoji: '🌙' },
  indonesia: { name: 'Indonesia Hebat', icon: 'fa-flag', color: '#dc2626', size: 75, emoji: '🇮🇩' },
  bumi: { name: 'Bumi Hijau', icon: 'fa-earth-americas', color: '#059669', size: 75, emoji: '🌍' },
  pohon: { name: 'Pohon Rindang', icon: 'fa-tree', color: '#16a34a', size: 85, emoji: '🌳' },
  sampah: { name: 'Tong Sampah', icon: 'fa-trash-can-arrow-up', color: '#d97706', size: 70, emoji: '🗑️' },
  air: { name: 'Keran & Air', icon: 'fa-faucet-drip', color: '#0284c7', size: 70, emoji: '💧' },
  recycle: { name: 'Daur Ulang 3R', icon: 'fa-recycle', color: '#059669', size: 75, emoji: '♻️' },
  tunas: { name: 'Tunas Tanaman', icon: 'fa-seedling', color: '#65a30d', size: 65, emoji: '🌱' },
  sepeda: { name: 'Sepeda Bebas Polusi', icon: 'fa-bicycle', color: '#4f46e5', size: 70, emoji: '🚲' },
  matahari: { name: 'Matahari Ceria', icon: 'fa-sun', color: '#eab308', size: 75, emoji: '☀️' }
};

let wordElements = [];
let activeWordElementId = null;
let wordPageBgColor = '#ffffff';
let wordPageBorderStyle = 'solid';

let wordDragState = {
  isDragging: false,
  elementId: null,
  startX: 0,
  startY: 0,
  elemStartX: 0,
  elemStartY: 0
};

// ==========================================
// BACKSTAGE VIEW MENU FILE (MICROSOFT WORD)
// ==========================================
let currentWordDocTitle = 'Poster_7_Kebiasaan_Anak_Indonesia_Hebat';

function bukaWordBackstage(tab = 'save') {
  playSound('click');
  const backstage = document.getElementById('word-backstage-view');
  if (backstage) backstage.classList.remove('hidden');
  setWordBackstageTab(tab);
}

function tutupWordBackstage() {
  playSound('click');
  const backstage = document.getElementById('word-backstage-view');
  if (backstage) backstage.classList.add('hidden');
}

function setWordBackstageTab(tabName) {
  playSound('click');
  const tabs = ['save', 'saveas', 'open', 'new'];
  tabs.forEach(t => {
    const btn = document.getElementById(`b-tab-${t}`);
    const panel = document.getElementById(`b-panel-${t}`);
    if (btn && panel) {
      if (t === tabName) {
        btn.className = 'w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-3 transition bg-blue-700/60 text-white shadow-xs';
        panel.classList.remove('hidden');
      } else {
        btn.className = 'w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-3 transition hover:bg-blue-700/40 text-blue-100';
        panel.classList.add('hidden');
      }
    }
  });

  if (tabName === 'open') {
    muatRiwayatDokumenWord();
  }
}

function simpanDokumenCepatWord() {
  bukaWordBackstage('save');
}

function simpanDokumenKeBrowser() {
  playSound('success');
  const inputEl = document.getElementById('word-doc-name-input');
  const title = (inputEl && inputEl.value.trim()) ? inputEl.value.trim() : 'Poster_Lingkungan_Hidup_Kelas4';
  currentWordDocTitle = title;

  const docData = {
    id: 'doc_' + Date.now(),
    title: title,
    savedAt: new Date().toISOString(),
    elements: JSON.parse(JSON.stringify(wordElements)),
    pageBgColor: wordPageBgColor,
    pageBorderStyle: wordPageBorderStyle
  };

  try {
    let savedDocs = JSON.parse(localStorage.getItem('kreator_cilik_word_docs') || '[]');
    const existingIndex = savedDocs.findIndex(d => d.title.toLowerCase() === title.toLowerCase());
    if (existingIndex >= 0) {
      savedDocs[existingIndex] = docData;
    } else {
      savedDocs.unshift(docData);
    }
    if (savedDocs.length > 15) savedDocs = savedDocs.slice(0, 15);
    localStorage.setItem('kreator_cilik_word_docs', JSON.stringify(savedDocs));

    const titleDisplay = document.getElementById('word-doc-title-display');
    if (titleDisplay) titleDisplay.innerText = `${title}.docx - Microsoft Word`;

    // Sinkronkan juga ke Galeri Poster Siswa (Praktik 1)
    simpanPosterKeGaleriWord(null);

    tambahPoin(20);
    showToast(`Dokumen "${title}" berhasil disimpan di browser & Galeri Praktik 1! 💾`, 'success');
    tutupWordBackstage();
  } catch (e) {
    showToast('Gagal menyimpan dokumen.', 'error');
  }
}

// Helper Escape XML untuk OpenXML Word
function escapeXml(unsafe) {
  return String(unsafe || '').replace(/[<>&'"]/g, function (c) {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

// Unduh Dokumen ke Format Word Asli (.docx)
async function unduhDokumenWorddoc() {
  playSound('fanfare');
  const inputEl = document.getElementById('word-doc-name-input');
  let title = (inputEl && inputEl.value.trim()) ? inputEl.value.trim() : 'Poster_Lingkungan_Hidup_Kelas4';
  title = title.replace(/\.docx$/i, ''); // hilangkan ekstensi ganda jika ada
  currentWordDocTitle = title;

  const docData = {
    fileType: 'MS_WORD_POSTER_KELAS4',
    version: '1.0',
    title: title,
    savedAt: new Date().toISOString(),
    elements: JSON.parse(JSON.stringify(wordElements)),
    pageBgColor: wordPageBgColor,
    pageBorderStyle: wordPageBorderStyle
  };

  try {
    if (typeof JSZip !== 'undefined') {
      const zip = new JSZip();

      // 1. [Content_Types].xml
      const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="json" ContentType="application/json"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;
      zip.file("[Content_Types].xml", contentTypesXml);

      // 2. _rels/.rels
      const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;
      zip.file("_rels/.rels", relsXml);

      // 3. word/document.xml (OpenXML Standar Microsoft Word)
      const sortedElements = [...wordElements].sort((a, b) => (a.y || 0) - (b.y || 0));
      let docParagraphsXml = '';

      // Judul Dokumen di Header
      docParagraphsXml += `
    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
        <w:spacing w:after="240"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:color w:val="185ABD"/>
          <w:sz w:val="38"/>
        </w:rPr>
        <w:t>${escapeXml(title)}</w:t>
      </w:r>
    </w:p>`;

      sortedElements.forEach(item => {
        if (item.type === 'teks') {
          const isJudul = item.subtype === 'judul';
          const isBanner = item.subtype === 'banner';
          const hexColor = (item.color || '#000000').replace('#', '').toUpperCase();
          const fontName = (item.fontFamily ? item.fontFamily.split(',')[0].replace(/['"]/g, '').trim() : 'Aptos');
          const halfPoints = Math.round((item.fontSizePx || (isJudul ? 32 : (isBanner ? 28 : 22))) * 1.5);
          const isBold = item.isBold !== undefined ? item.isBold : (isJudul || isBanner);
          const isItalic = !!item.isItalic;
          const isUnderline = !!item.isUnderline;
          const isStrike = !!item.isStrike;
          const isHighlight = item.highlightColor && item.highlightColor !== 'transparent';

          docParagraphsXml += `
    <w:p>
      <w:pPr>
        <w:jc w:val="${isJudul || isBanner ? 'center' : 'left'}"/>
        <w:spacing w:after="160"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="${escapeXml(fontName)}" w:hAnsi="${escapeXml(fontName)}"/>
          ${isBold ? '<w:b/>' : ''}
          ${isItalic ? '<w:i/>' : ''}
          ${isUnderline ? '<w:u w:val="single"/>' : ''}
          ${isStrike ? '<w:strike/>' : ''}
          ${isHighlight ? '<w:highlight w:val="yellow"/>' : ''}
          <w:color w:val="${hexColor.length === 6 ? hexColor : '047857'}"/>
          <w:sz w:val="${halfPoints}"/>
        </w:rPr>
        <w:t>${escapeXml(item.text)}</w:t>
      </w:r>
    </w:p>`;
        } else if (item.type === 'gambar') {
          const imgName = item.name || 'Gambar Lingkungan';
          docParagraphsXml += `
    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
        <w:spacing w:after="160"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:i/>
          <w:color w:val="059669"/>
          <w:sz w:val="22"/>
        </w:rPr>
        <w:t>[Ilustrasi Lingkungan Hidup: ${escapeXml(imgName)}]</w:t>
      </w:r>
    </w:p>`;
        } else if (item.type === 'gambar_luar') {
          const luarName = item.name || 'Gambar Unduhan Internet';
          docParagraphsXml += `
    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
        <w:spacing w:after="160"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:i/>
          <w:color w:val="0D9488"/>
          <w:sz w:val="22"/>
        </w:rPr>
        <w:t>[Gambar Unduhan Internet: ${escapeXml(luarName)}]</w:t>
      </w:r>
    </w:p>`;
        }
      });

      // Footer Informasi di Word
      docParagraphsXml += `
    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
        <w:spacing w:before="360"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:i/>
          <w:color w:val="64748B"/>
          <w:sz w:val="18"/>
        </w:rPr>
        <w:t>--- Dibuat dengan Simulator Microsoft Word • Kelas 4 SD Semester 1 ---</w:t>
      </w:r>
    </w:p>`;

      const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${docParagraphsXml}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
    </w:sectPr>
  </w:body>
</w:document>`;
      zip.file("word/document.xml", documentXml);

      // 4. word/poster_data.json (Menyimpan seluruh data tata letak & gambar untuk diedit kembali di web)
      zip.file("word/poster_data.json", JSON.stringify(docData, null, 2));

      // 5. Generate File .docx
      const docxBlob = await zip.generateAsync({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });

      const link = document.createElement('a');
      link.download = `${title}.docx`;
      link.href = URL.createObjectURL(docxBlob);
      link.click();

      // Sinkronkan ke Galeri Poster Praktik 1
      simpanPosterKeGaleriWord(null);

      tambahPoin(25);
      showToast(`File "${title}.docx" berhasil disimpan di komputer & Galeri Praktik 1! 💾`, 'success');
      tutupWordBackstage();
      return;
    }
  } catch (err) {
    console.error('JSZip docx error, fallback to json:', err);
  }

  // Fallback jika JSZip offline/gagal
  const jsonStr = JSON.stringify(docData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  const link = document.createElement('a');
  link.download = `${title}.docx`;
  link.href = URL.createObjectURL(blob);
  link.click();

  tambahPoin(25);
  showToast(`File "${title}.docx" berhasil diunduh ke komputer! 💾`, 'success');
  tutupWordBackstage();
}

function triggerBukaFileWorddoc() {
  playSound('click');
  const input = document.getElementById('word-file-open-input');
  if (input) input.click();
}

// Buka File Dokumen Word (.docx / .worddoc / .json)
async function handleBukaFileWorddoc(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  try {
    // 1. Coba baca sebagai ZIP (.docx asli) menggunakan JSZip
    if (typeof JSZip !== 'undefined') {
      try {
        const zip = await JSZip.loadAsync(file);

        // A. Cek file poster_data.json yang tersimpan di dalam ZIP .docx
        const posterFile = zip.file("word/poster_data.json");
        if (posterFile) {
          const jsonStr = await posterFile.async("string");
          const doc = JSON.parse(jsonStr);
          if (doc && Array.isArray(doc.elements)) {
            terapkanDokumenWord(doc);
            showToast(`Dokumen Word "${doc.title || file.name}" (.docx) berhasil dibuka & siap diedit! 📂`, 'success');
            tutupWordBackstage();
            event.target.value = '';
            return;
          }
        }

        // B. Cek file document.xml jika file DOCX dari MS Word desktop biasa
        const docXmlFile = zip.file("word/document.xml");
        if (docXmlFile) {
          const xmlStr = await docXmlFile.async("string");
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(xmlStr, "text/xml");
          const textNodes = Array.from(xmlDoc.getElementsByTagName("w:t"));
          const textLines = textNodes
            .map(t => t.textContent.trim())
            .filter(t => t.length > 0 && !t.includes('--- Dibuat dengan Simulator') && !t.includes('Microsoft Word Simulator'));

          if (textLines.length > 0) {
            let yOffset = 35;
            const importedElements = textLines.map((t, idx) => {
              const isJudul = idx === 0;
              const elem = {
                id: 'word-elem-' + Date.now() + '-' + idx,
                type: 'teks',
                subtype: isJudul ? 'judul' : 'slogan',
                text: t,
                color: isJudul ? '#047857' : '#0f172a',
                fontSize: isJudul ? 'text-2xl sm:text-3xl' : 'text-base sm:text-lg',
                x: 35,
                y: yOffset,
                zIndex: idx + 1
              };
              yOffset += 55;
              return elem;
            });

            terapkanDokumenWord({
              title: file.name.replace(/\.[^/.]+$/, ''),
              elements: importedElements,
              pageBgColor: '#ffffff',
              pageBorderStyle: 'none'
            });
            showToast(`Isi dokumen "${file.name}" (.docx) berhasil diimpor ke lembar kerja! 📂`, 'success');
            tutupWordBackstage();
            event.target.value = '';
            return;
          }
        }
      } catch (zipErr) {
        console.warn('Bukan file ZIP docx murni, mencoba parser teks/json...', zipErr);
      }
    }

    // 2. Fallback baca sebagai file teks / json / legacy .worddoc
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const doc = JSON.parse(e.target.result);
        if (doc && Array.isArray(doc.elements)) {
          terapkanDokumenWord(doc);
          showToast(`Dokumen "${doc.title || file.name}" berhasil dibuka dan siap diedit! 📂`, 'success');
          tutupWordBackstage();
        } else {
          showToast('Format file dokumen tidak dikenali!', 'error');
        }
      } catch (jsonErr) {
        showToast('Gagal membaca file. Pastikan memilih file dokumen Word (.docx) yang valid!', 'error');
      }
      event.target.value = '';
    };
    reader.readAsText(file);
    return;
  } catch (err) {
    showToast('Terjadi kesalahan saat membuka file dokumen.', 'error');
  }

  event.target.value = '';
}

function terapkanDokumenWord(doc) {
  playSound('success');
  wordElements = JSON.parse(JSON.stringify(doc.elements || []));
  activeWordElementId = null;

  if (doc.pageBgColor) {
    setWordPageBg(doc.pageBgColor);
  }
  if (doc.pageBorderStyle) {
    setWordPageBorder(doc.pageBorderStyle);
  }

  const title = doc.title || 'Poster_Lingkungan_Hidup_Kelas4';
  currentWordDocTitle = title;
  const inputEl = document.getElementById('word-doc-name-input');
  if (inputEl) inputEl.value = title;

  const titleDisplay = document.getElementById('word-doc-title-display');
  if (titleDisplay) titleDisplay.innerText = `${title}.docx - Microsoft Word`;

  renderWordElements();
}

function muatRiwayatDokumenWord() {
  const listEl = document.getElementById('word-recent-docs-list');
  if (!listEl) return;

  let savedDocs = [];
  try {
    savedDocs = JSON.parse(localStorage.getItem('kreator_cilik_word_docs') || '[]');
  } catch (e) {
    savedDocs = [];
  }

  if (savedDocs.length === 0) {
    listEl.innerHTML = `
      <div class="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center text-slate-400 text-xs">
        <i class="fa-solid fa-clock-rotate-left text-2xl mb-1 text-slate-300"></i>
        <p>Belum ada dokumen tersimpan di browser ini.</p>
        <p class="text-[10px] text-slate-400 mt-0.5">Bikin poster dan klik "Simpan Dokumen" sekarang!</p>
      </div>
    `;
    return;
  }

  listEl.innerHTML = savedDocs.map((doc) => {
    const tgl = new Date(doc.savedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    const countElem = (doc.elements && doc.elements.length) || 0;
    return `
      <div class="p-2.5 bg-slate-50 hover:bg-blue-50/60 rounded-xl border border-slate-200 transition flex items-center justify-between text-xs gap-2">
        <div class="flex items-center gap-2.5 overflow-hidden">
          <i class="fa-solid fa-file-word text-blue-600 text-lg shrink-0"></i>
          <div class="overflow-hidden">
            <h5 class="font-bold text-slate-800 truncate">${doc.title}.docx</h5>
            <span class="text-[10px] text-slate-400">${tgl} • ${countElem} elemen</span>
          </div>
        </div>
        <div class="flex items-center gap-1 shrink-0">
          <button type="button" onclick="bukaDokumenDariRiwayat('${doc.id}')" class="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] px-2.5 py-1 rounded-lg shadow-xs flex items-center gap-1">
            <i class="fa-solid fa-pen-to-square"></i> Buka & Edit
          </button>
          <button type="button" onclick="hapusDokumenDariRiwayat('${doc.id}')" class="text-rose-500 hover:text-rose-700 p-1" title="Hapus Dokumen">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function bukaDokumenDariRiwayat(docId) {
  try {
    const savedDocs = JSON.parse(localStorage.getItem('kreator_cilik_word_docs') || '[]');
    const targetDoc = savedDocs.find(d => d.id === docId);
    if (targetDoc) {
      terapkanDokumenWord(targetDoc);
      showToast(`Dokumen "${targetDoc.title}" dibuka kembali! Siap diedit 📂`, 'success');
      tutupWordBackstage();
    }
  } catch (e) {
    showToast('Gagal memuat dokumen dari riwayat.', 'error');
  }
}

function hapusDokumenDariRiwayat(docId) {
  playSound('click');
  if (confirm('Hapus dokumen ini dari riwayat browser?')) {
    try {
      let savedDocs = JSON.parse(localStorage.getItem('kreator_cilik_word_docs') || '[]');
      savedDocs = savedDocs.filter(d => d.id !== docId);
      localStorage.setItem('kreator_cilik_word_docs', JSON.stringify(savedDocs));
      muatRiwayatDokumenWord();
      showToast('Dokumen dihapus dari riwayat.');
    } catch (e) {}
  }
}

// ==========================================
// KONTROL JENDELA MICROSOFT WORD (Minimize, Maximize/Restore, Close)
// ==========================================
let isWordMaximized = false;

function minimizeWordWindow() {
  playSound('click');
  const win = document.getElementById('word-simulator-window');
  if (win) {
    win.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
      switchTab('beranda');
      win.classList.remove('scale-95', 'opacity-0');
      showToast('Jendela Microsoft Word diminimalkan ke Beranda 📄', 'info');
    }, 200);
  } else {
    switchTab('beranda');
  }
}

function toggleMaximizeWordWindow(forceState = null) {
  playSound('click');
  const win = document.getElementById('word-simulator-window');
  if (!win) return;

  const nextState = (forceState !== null) ? forceState : !isWordMaximized;
  isWordMaximized = nextState;

  const iconWin = document.getElementById('icon-word-maximize');
  const iconFs = document.getElementById('word-fullscreen-icon');
  const labelFs = document.getElementById('word-fullscreen-label');
  const btnTitle = document.getElementById('btn-word-fullscreen-title');
  const floatingBtn = document.getElementById('word-floating-exit-btn');

  if (isWordMaximized) {
    // Mode Layar Penuh Sejati Khas MS Excel (Desktop Isolation + Native Fullscreen)
    win.classList.add('word-fullscreen-mode');
    document.body.classList.add('word-fs-active');

    // Coba Browser Native Fullscreen (F11 sejati) jika didukung peramban
    if (!document.fullscreenElement && win.requestFullscreen) {
      win.requestFullscreen().catch(() => {});
    }

    if (iconWin) iconWin.className = 'fa-regular fa-clone text-[11px]'; // Ikon Restore Window
    if (iconFs) iconFs.className = 'fa-solid fa-compress text-xs text-amber-300';
    if (labelFs) labelFs.innerText = 'Keluar Penuh (Esc)';
    if (btnTitle) {
      btnTitle.className = 'bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3 py-1 rounded-lg border border-amber-400 flex items-center gap-1.5 transition shadow-xs hover:scale-105 active:scale-95 shrink-0 whitespace-nowrap';
    }
    if (floatingBtn) floatingBtn.classList.remove('hidden');

    showToast('Mode Layar Penuh Sejati Microsoft Word aktif! 🖥️ Tekan Esc atau klik tombol di kanan bawah untuk keluar.', 'success');
  } else {
    // Mode Jendela Normal / Standar
    win.classList.remove('word-fullscreen-mode');
    document.body.classList.remove('word-fs-active');

    // Keluar dari native fullscreen jika aktif
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }

    if (iconWin) iconWin.className = 'fa-regular fa-square text-[11px]'; // Ikon Kotak Maximize
    if (iconFs) iconFs.className = 'fa-solid fa-expand text-xs';
    if (labelFs) labelFs.innerText = 'Layar Penuh';
    if (btnTitle) {
      btnTitle.className = 'bg-blue-800 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1 rounded-lg border border-blue-400/60 flex items-center gap-1.5 transition shadow-xs hover:scale-105 active:scale-95 shrink-0 whitespace-nowrap';
    }
    if (floatingBtn) floatingBtn.classList.add('hidden');

    showToast('Kembali ke tampilan standar jendela Microsoft Word.');
  }
}

// Global Listener Keyboard untuk Microsoft Word (Delete, Backspace, Arrow Keys, Escape, Ctrl+Z, Ctrl+B, Ctrl+I, Ctrl+U)
window.addEventListener('keydown', function(e) {
  // Berlaku jika objek Word sedang aktif ATAU berada di tab msword / sem1
  const wordTabSection = document.getElementById('tab-msword');
  const isWordVisible = (wordTabSection && !wordTabSection.classList.contains('hidden')) || state.currentTab === 'msword' || state.currentTab === 'sem1';
  if (!isWordVisible && !activeWordElementId) return;

  const activeEl = document.activeElement;
  const isInputOrTextarea = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable);

  // 1. Tombol ESC untuk keluar dari Layar Penuh (Fullscreen)
  if (e.key === 'Escape') {
    if (isWordMaximized) {
      e.preventDefault();
      toggleMaximizeWordWindow(false);
      return;
    }
    if (activeWordElementId) {
      activeWordElementId = null;
      renderWordElements();
      return;
    }
  }

  // Jika sedang mengetik di input text / form pencarian / prompt, biarkan input menangani keyboard
  if (isInputOrTextarea) return;

  // 2. Tombol DELETE / BACKSPACE untuk menghapus tulisan atau gambar yang sedang dipilih
  if ((e.key === 'Delete' || e.key === 'Backspace') && activeWordElementId) {
    e.preventDefault();
    const item = wordElements.find(el => el.id === activeWordElementId);
    const itemLabel = item ? (item.type === 'teks' ? `Teks "${item.text ? item.text.substring(0, 15) : ''}..."` : 'Gambar') : 'Elemen';
    hapusElemenWord(activeWordElementId);
    showToast(`${itemLabel} dihapus dengan tombol ${e.key} pada keyboard 🗑️`, 'info');
    return;
  }

  // 3. Tombol Panah (Arrow Keys) untuk menggeser objek (Nudge position)
  if (activeWordElementId && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
    e.preventDefault();
    const item = wordElements.find(el => el.id === activeWordElementId);
    if (!item) return;

    const step = e.shiftKey ? 10 : 2; // Shift untuk pergeseran lebih cepat
    if (e.key === 'ArrowUp') item.y = Math.max(0, item.y - step);
    if (e.key === 'ArrowDown') item.y += step;
    if (e.key === 'ArrowLeft') item.x = Math.max(0, item.x - step);
    if (e.key === 'ArrowRight') item.x += step;

    renderWordElements();
    return;
  }

  // 4. Shortcut Ctrl / Cmd untuk Format Teks & Undo
  if (e.ctrlKey || e.metaKey) {
    const k = e.key.toLowerCase();
    if (k === 'z') {
      e.preventDefault();
      undoWordElement();
      return;
    } else if (k === 'b' && activeWordElementId) {
      e.preventDefault();
      toggleWordFormat('bold');
      return;
    } else if (k === 'i' && activeWordElementId) {
      e.preventDefault();
      toggleWordFormat('italic');
      return;
    } else if (k === 'u' && activeWordElementId) {
      e.preventDefault();
      toggleWordFormat('underline');
      return;
    } else if (k === 's') {
      e.preventDefault();
      simpanDokumenCepatWord();
      return;
    }
  }
});

function closeWordWindowPrompt() {
  playSound('click');
  if (isWordMaximized) {
    toggleMaximizeWordWindow(false);
    return;
  }
  if (wordElements.length > 0) {
    if (confirm('Tutup dokumen Microsoft Word dan kembali ke Beranda? Pastikan postermu sudah disimpan!')) {
      switchTab('beranda');
      showToast('Microsoft Word ditutup.', 'info');
    }
  } else {
    switchTab('beranda');
    showToast('Microsoft Word ditutup.', 'info');
  }
}

function buatDokumenBaruWord() {
  playSound('click');
  if (confirm('Buka dokumen baru yang kosong? (Pastikan karya saat ini sudah kamu simpan!)')) {
    wordElements = [];
    activeWordElementId = null;
    setWordPageBg('#ffffff');
    setWordPageBorder('none');
    currentWordDocTitle = 'Poster_Lingkungan_Hidup_Baru';
    const inputEl = document.getElementById('word-doc-name-input');
    if (inputEl) inputEl.value = currentWordDocTitle;
    const titleDisplay = document.getElementById('word-doc-title-display');
    if (titleDisplay) titleDisplay.innerText = `${currentWordDocTitle}.docx - Microsoft Word`;
    renderWordElements();
    tutupWordBackstage();
    showToast('Dokumen baru dibuka! 📄');
  }
}

// Ribbon Tab Switching
function setWordRibbonTab(tabName) {
  playSound('click');
  const tabs = ['home', 'insert', 'design', 'layout', 'format'];
  tabs.forEach(t => {
    const btn = document.getElementById(`ribbon-tab-${t}`);
    const panel = document.getElementById(`ribbon-panel-${t}`);
    if (btn && panel) {
      if (t === tabName) {
        if (t === 'format') {
          btn.className = 'px-3 py-1.5 rounded-t bg-[#107c41] text-white font-bold text-xs ml-2 shadow-xs flex items-center gap-1';
        } else {
          btn.className = 'px-3.5 py-1.5 rounded-t bg-white text-slate-800 font-bold shadow-xs transition';
        }
        panel.classList.remove('hidden');
      } else {
        if (t === 'format') {
          btn.className = 'px-3 py-1.5 rounded-t bg-[#107c41]/80 text-white font-medium text-xs ml-2 hover:bg-[#107c41] transition flex items-center gap-1';
        } else {
          btn.className = 'px-3 py-1.5 rounded-t text-white hover:bg-white/15 transition';
        }
        panel.classList.add('hidden');
      }
    }
  });
}

// Background & Border Kertas Word
function setWordPageBg(color) {
  playSound('click');
  wordPageBgColor = color;
  const paper = document.getElementById('word-paper');
  if (paper) paper.style.backgroundColor = color;
  showToast('Warna kertas Word diubah! 📄');
}

function setWordPageBorder(style) {
  playSound('click');
  wordPageBorderStyle = style;
  const borderEl = document.getElementById('word-paper-border');
  if (!borderEl) return;
  if (style === 'none') {
    borderEl.className = 'absolute inset-4 pointer-events-none transition-all duration-200 border-0';
  } else if (style === 'solid') {
    borderEl.className = 'absolute inset-4 pointer-events-none transition-all duration-200 border-4 border-emerald-600 rounded-xl';
  } else if (style === 'dashed') {
    borderEl.className = 'absolute inset-4 pointer-events-none transition-all duration-200 border-4 border-dashed border-emerald-500 rounded-xl';
  }
}

// Sisipkan Teks / Judul WordArt ke Word
function sisipkanTeksKeWord(text, subtype = 'slogan', color = '#0f172a') {
  playSound('click');
  const paper = document.getElementById('word-paper');
  const paperWidth = paper ? paper.clientWidth : 460;
  
  // Posisi awal default
  let posX = Math.max(20, Math.floor((paperWidth - 300) / 2));
  let posY = 50 + (wordElements.length * 45) % 350;
  let fontSizeClass = 'text-xl sm:text-2xl';

  if (subtype === 'judul') {
    posY = 35;
    fontSizeClass = 'text-2xl sm:text-3xl';
  } else if (subtype === 'pembuat') {
    posY = 580;
    fontSizeClass = 'text-xs sm:text-sm';
  }

  const newElem = {
    id: 'word-elem-' + Date.now(),
    type: 'teks',
    subtype: subtype,
    text: text,
    color: color,
    fontSize: fontSizeClass,
    x: posX,
    y: posY,
    zIndex: wordElements.length + 1
  };

  wordElements.push(newElem);
  activeWordElementId = newElem.id;
  renderWordElements();
  showToast(`Teks "${text.substring(0, 18)}..." disisipkan ke Word! 🔤`, 'success');
}

function sisipkanTeksKustom() {
  const input = document.getElementById('word-custom-text');
  const val = input.value.trim();
  if (!val) {
    showToast('Tuliskan kalimat slogan terlebih dahulu!', 'info');
    return;
  }
  sisipkanTeksKeWord(val, 'slogan', '#047857');
  input.value = '';
}

// Sisipkan Gambar Lingkungan ke Word
function sisipkanGambarKeWord(key) {
  playSound('click');
  const imgData = WORD_IMAGES[key];
  if (!imgData) return;

  const paper = document.getElementById('word-paper');
  const paperWidth = paper ? paper.clientWidth : 460;

  // Letakkan di tengah lembar Word
  const posX = Math.max(30, Math.floor((paperWidth - imgData.size) / 2));
  const posY = 180 + (wordElements.length * 30) % 250;

  const newElem = {
    id: 'word-elem-' + Date.now(),
    type: 'gambar',
    key: key,
    name: imgData.name,
    icon: imgData.icon,
    color: imgData.color,
    size: imgData.size,
    x: posX,
    y: posY,
    zIndex: wordElements.length + 1
  };

  wordElements.push(newElem);
  activeWordElementId = newElem.id;
  renderWordElements();
  showToast(`Gambar ${imgData.name} disisipkan ke Word! 🖼️`, 'success');
}

// ====================================================
// FITUR AMBIL GAMBAR DARI LUAR (DOWNLOAD INTERNET / URL)
// ====================================================
function triggerUploadGambarWord() {
  playSound('click');
  const fileInput = document.getElementById('word-image-upload-input');
  if (fileInput) fileInput.click();
}

function handleWordImageUpload(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    showToast('Pilihlah file berformat gambar (PNG, JPG, WEBP, dll)!', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    const dataUrl = e.target.result;
    sisipkanGambarLuarKeWord(dataUrl, file.name);
    event.target.value = ''; // reset agar bisa upload file yang sama
  };
  reader.readAsDataURL(file);
}

function tambahGambarUrlPrompt() {
  playSound('click');
  const url = prompt('Tempelkan link (URL) gambar dari internet:\n(Contoh: https://.../gambar.png)');
  if (url && url.trim()) {
    sisipkanGambarLuarKeWord(url.trim(), 'Gambar dari Internet');
  }
}

function sisipkanGambarLuarKeWord(imageSrc, imageName = 'Gambar Luar') {
  playSound('success');
  const paper = document.getElementById('word-paper');
  const paperWidth = paper ? paper.clientWidth : 460;

  const posX = Math.max(30, Math.floor((paperWidth - 140) / 2));
  const posY = 180 + (wordElements.length * 30) % 250;

  const newElem = {
    id: 'word-elem-' + Date.now(),
    type: 'gambar_luar',
    src: imageSrc,
    name: imageName,
    width: 140,
    x: posX,
    y: posY,
    zIndex: wordElements.length + 1
  };

  wordElements.push(newElem);
  activeWordElementId = newElem.id;
  renderWordElements();
  showToast('Gambar luar (hasil download) disisipkan ke Word! 🖼️', 'success');
}

function ubahUkuranGambarLuarWord(id, delta) {
  playSound('click');
  const item = wordElements.find(el => el.id === id);
  if (!item || item.type !== 'gambar_luar') return;
  item.width = Math.max(50, Math.min(380, item.width + delta));
  renderWordElements();
}

// Prompt WordArt & TextBox Tambahan
function tambahWordArtPrompt() {
  const userText = prompt('Masukkan Judul WordArt Lingkungan Hidup:', 'LESTARIKAN BUMI');
  if (userText && userText.trim()) {
    sisipkanTeksKeWord(userText.trim().toUpperCase(), 'judul', '#059669');
  }
}

function tambahTextBoxPrompt() {
  const userText = prompt('Masukkan Teks Kotak Slogan:', 'Kurangi penggunaan plastik sekali pakai!');
  if (userText && userText.trim()) {
    sisipkanTeksKeWord(userText.trim(), 'slogan', '#0284c7');
  }
}

function tambahBentukKotak() {
  sisipkanTeksKeWord('★ PEDULI LINGKUNGAN SEKOLAH ★', 'banner', '#15803d');
}

// Render Seluruh Elemen ke Lembar Word
function renderWordElements() {
  const container = document.getElementById('word-paper-elements');
  const emptyHint = document.getElementById('word-paper-empty-hint');
  const countEl = document.getElementById('word-element-count');

  if (!container) return;
  container.innerHTML = '';

  if (countEl) countEl.innerText = wordElements.length;
  const wordDocWordCountEl = document.getElementById('word-doc-word-count');
  if (wordDocWordCountEl) {
    let totalKata = 0;
    wordElements.forEach(item => {
      if (item.type === 'teks' && item.text) {
        totalKata += item.text.trim().split(/\s+/).filter(Boolean).length;
      }
    });
    wordDocWordCountEl.innerText = totalKata;
  }
  if (emptyHint) {
    emptyHint.style.display = (wordElements.length === 0) ? 'flex' : 'none';
  }

  wordElements.forEach(item => {
    const el = document.createElement('div');
    el.id = item.id;
    el.className = `word-element ${item.id === activeWordElementId ? 'active-element' : ''}`;
    el.setAttribute('tabindex', '0');
    el.style.left = `${item.x}px`;
    el.style.top = `${item.y}px`;
    el.style.zIndex = item.zIndex;
    el.style.outline = 'none';

    // Pastikan properti rotasi dan ukuran default terinisialisasi
    if (item.rotation === undefined) item.rotation = 0;
    if (item.width === undefined) {
      if (item.type === 'gambar') item.width = item.size || 75;
      else if (item.type === 'gambar_luar') item.width = 140;
    }

    // Terapkan rotasi CSS jika ada
    if (item.rotation !== 0) {
      el.style.transform = `rotate(${item.rotation}deg)`;
      el.style.transformOrigin = 'center center';
    } else {
      el.style.transform = 'none';
    }

    if (item.type === 'teks') {
      const isJudul = item.subtype === 'judul';
      const isBanner = item.subtype === 'banner';

      // Properti Font Lengkap MS Word
      const fontFamily = item.fontFamily || (isBanner ? 'Fredoka, sans-serif' : 'Aptos, sans-serif');
      const fontSizePx = item.fontSizePx || (isJudul ? 32 : (isBanner ? 24 : 20));
      const isBold = item.isBold !== undefined ? item.isBold : (isJudul || isBanner);
      const isItalic = item.isItalic || false;
      const isUnderline = item.isUnderline || false;
      const isStrike = item.isStrike || false;
      const subSuper = item.subSuper || 'normal';
      const textEffect = item.textEffect || 'none';
      const highlight = (item.highlightColor && item.highlightColor !== 'transparent') ? item.highlightColor : 'transparent';
      const color = item.color || (isBanner ? '#ffffff' : '#0f172a');

      // Kalkulasi Style CSS
      const decorations = [];
      if (isUnderline) decorations.push('underline');
      if (isStrike) decorations.push('line-through');
      const textDecoration = decorations.length > 0 ? decorations.join(' ') : 'none';

      let textShadow = 'none';
      let strokeStyle = '';
      if (textEffect === 'glow') {
        textShadow = '0 0 8px rgba(56, 189, 248, 0.9), 0 0 16px rgba(59, 130, 246, 0.7)';
      } else if (textEffect === 'shadow') {
        textShadow = '2px 2px 4px rgba(0, 0, 0, 0.4)';
      } else if (textEffect === 'outline') {
        strokeStyle = '-webkit-text-stroke: 1px #0284c7;';
      }

      let vertAlign = 'baseline';
      let effectiveSizePx = fontSizePx;
      if (subSuper === 'sub') {
        vertAlign = 'sub';
        effectiveSizePx = Math.max(10, Math.round(fontSizePx * 0.7));
      } else if (subSuper === 'super') {
        vertAlign = 'super';
        effectiveSizePx = Math.max(10, Math.round(fontSizePx * 0.7));
      }

      const textAlign = item.textAlign || 'left';

      el.innerHTML = `
        <div class="px-2.5 py-1 rounded-lg ${isBanner ? 'bg-emerald-600 font-black shadow-md border-2 border-white' : ''}" style="background-color: ${isBanner ? '#059669' : highlight}; text-align: ${textAlign};">
          <span class="block select-none tracking-wide" style="font-family: ${fontFamily}; font-size: ${effectiveSizePx}px; font-weight: ${isBold ? '800' : '400'}; font-style: ${isItalic ? 'italic' : 'normal'}; text-decoration: ${textDecoration}; color: ${color}; vertical-align: ${vertAlign}; text-shadow: ${textShadow}; ${strokeStyle} text-align: ${textAlign};" ondblclick="editWordTextElement('${item.id}')">
            ${escapeXml(item.text)}
          </span>
        </div>
        <!-- Handle Putar (Rotate) Khas MS Word -->
        <div class="word-rotate-connector"></div>
        <div class="word-rotate-handle" title="Putar Objek (Rotate)" onmousedown="startRotateWordElement(event, '${item.id}')" ontouchstart="startRotateWordElement(event, '${item.id}')">
          <i class="fa-solid fa-rotate-right"></i>
        </div>
        <div class="element-handle-box absolute -top-3 -right-3 gap-1">
          <button class="word-ctrl-btn text-blue-600" title="Edit Teks" onclick="editWordTextElement('${item.id}')"><i class="fa-solid fa-pen"></i></button>
          <button class="word-ctrl-btn text-rose-600" title="Hapus" onclick="hapusElemenWord('${item.id}')"><i class="fa-solid fa-xmark"></i></button>
        </div>
      `;
    } else if (item.type === 'gambar') {
      const gWidth = item.width || item.size || 75;
      el.innerHTML = `
        <div class="p-2 flex items-center justify-center select-none pointer-events-none" style="color: ${item.color}; font-size: ${gWidth}px; width: ${gWidth + 16}px; height: ${gWidth + 16}px;">
          <i class="fa-solid ${item.icon} drop-shadow"></i>
        </div>
        <!-- Handle Putar (Rotate) Khas MS Word -->
        <div class="word-rotate-connector"></div>
        <div class="word-rotate-handle" title="Putar Gambar (Rotate)" onmousedown="startRotateWordElement(event, '${item.id}')" ontouchstart="startRotateWordElement(event, '${item.id}')">
          <i class="fa-solid fa-rotate-right"></i>
        </div>
        <!-- 8 Handle Titik Resize Khas MS Word -->
        <div class="word-resize-handle handle-nw" onmousedown="startResizeWordElement(event, '${item.id}', 'nw')" ontouchstart="startResizeWordElement(event, '${item.id}', 'nw')"></div>
        <div class="word-resize-handle handle-n" onmousedown="startResizeWordElement(event, '${item.id}', 'n')" ontouchstart="startResizeWordElement(event, '${item.id}', 'n')"></div>
        <div class="word-resize-handle handle-ne" onmousedown="startResizeWordElement(event, '${item.id}', 'ne')" ontouchstart="startResizeWordElement(event, '${item.id}', 'ne')"></div>
        <div class="word-resize-handle handle-e" onmousedown="startResizeWordElement(event, '${item.id}', 'e')" ontouchstart="startResizeWordElement(event, '${item.id}', 'e')"></div>
        <div class="word-resize-handle handle-se" onmousedown="startResizeWordElement(event, '${item.id}', 'se')" ontouchstart="startResizeWordElement(event, '${item.id}', 'se')"></div>
        <div class="word-resize-handle handle-s" onmousedown="startResizeWordElement(event, '${item.id}', 's')" ontouchstart="startResizeWordElement(event, '${item.id}', 's')"></div>
        <div class="word-resize-handle handle-sw" onmousedown="startResizeWordElement(event, '${item.id}', 'sw')" ontouchstart="startResizeWordElement(event, '${item.id}', 'sw')"></div>
        <div class="word-resize-handle handle-w" onmousedown="startResizeWordElement(event, '${item.id}', 'w')" ontouchstart="startResizeWordElement(event, '${item.id}', 'w')"></div>
        <!-- Tombol Aksi Hapus & Quick Button -->
        <div class="element-handle-box absolute -top-3 -right-3 gap-1">
          <button class="word-ctrl-btn text-rose-600" title="Hapus Gambar" onclick="hapusElemenWord('${item.id}')"><i class="fa-solid fa-xmark"></i></button>
        </div>
      `;
    } else if (item.type === 'gambar_luar') {
      const gWidth = item.width || 140;
      el.innerHTML = `
        <div class="p-1 flex items-center justify-center select-none pointer-events-none">
          <img src="${item.src}" alt="${item.name}" class="rounded-lg shadow-md border border-slate-300 pointer-events-none select-none object-contain bg-white/60 p-0.5" style="width: ${gWidth}px;">
        </div>
        <!-- Handle Putar (Rotate) Khas MS Word -->
        <div class="word-rotate-connector"></div>
        <div class="word-rotate-handle" title="Putar Gambar (Rotate)" onmousedown="startRotateWordElement(event, '${item.id}')" ontouchstart="startRotateWordElement(event, '${item.id}')">
          <i class="fa-solid fa-rotate-right"></i>
        </div>
        <!-- 8 Handle Titik Resize Khas MS Word -->
        <div class="word-resize-handle handle-nw" onmousedown="startResizeWordElement(event, '${item.id}', 'nw')" ontouchstart="startResizeWordElement(event, '${item.id}', 'nw')"></div>
        <div class="word-resize-handle handle-n" onmousedown="startResizeWordElement(event, '${item.id}', 'n')" ontouchstart="startResizeWordElement(event, '${item.id}', 'n')"></div>
        <div class="word-resize-handle handle-ne" onmousedown="startResizeWordElement(event, '${item.id}', 'ne')" ontouchstart="startResizeWordElement(event, '${item.id}', 'ne')"></div>
        <div class="word-resize-handle handle-e" onmousedown="startResizeWordElement(event, '${item.id}', 'e')" ontouchstart="startResizeWordElement(event, '${item.id}', 'e')"></div>
        <div class="word-resize-handle handle-se" onmousedown="startResizeWordElement(event, '${item.id}', 'se')" ontouchstart="startResizeWordElement(event, '${item.id}', 'se')"></div>
        <div class="word-resize-handle handle-s" onmousedown="startResizeWordElement(event, '${item.id}', 's')" ontouchstart="startResizeWordElement(event, '${item.id}', 's')"></div>
        <div class="word-resize-handle handle-sw" onmousedown="startResizeWordElement(event, '${item.id}', 'sw')" ontouchstart="startResizeWordElement(event, '${item.id}', 'sw')"></div>
        <div class="word-resize-handle handle-w" onmousedown="startResizeWordElement(event, '${item.id}', 'w')" ontouchstart="startResizeWordElement(event, '${item.id}', 'w')"></div>
        <!-- Tombol Aksi Hapus -->
        <div class="element-handle-box absolute -top-3 -right-3 gap-1">
          <button class="word-ctrl-btn text-rose-600" title="Hapus Gambar" onclick="hapusElemenWord('${item.id}')"><i class="fa-solid fa-xmark"></i></button>
        </div>
      `;
    }

    // Event Klik untuk Memilih & Memulai Drag
    el.addEventListener('mousedown', (e) => startDragWordElement(e, item.id));
    el.addEventListener('touchstart', (e) => startDragWordElement(e, item.id), { passive: false });

    // Event Keyboard langsung pada elemen itu sendiri
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        e.stopPropagation();
        hapusElemenWord(item.id);
        showToast('Objek berhasil dihapus dengan tombol ' + e.key + ' 🗑️', 'info');
      }
    });

    container.appendChild(el);

    // Jika ini adalah elemen aktif, berikan fokus keyboard
    if (item.id === activeWordElementId) {
      setTimeout(() => {
        try { el.focus(); } catch(err) {}
      }, 10);
    }
  });
}

// Drag & Drop Gerakan Bebas Khas Wrap Text "In Front of Text"
function startDragWordElement(e, id) {
  if (e.target.closest('.word-ctrl-btn')) return; // Abaikan tombol kontrol
  e.preventDefault();
  activeWordElementId = id;
  renderWordElements();

  const item = wordElements.find(el => el.id === id);
  if (!item) return;

  if (item.type === 'teks') {
    sinkronkanRibbonFontDenganElemen(item);
  } else if (item.type === 'gambar' || item.type === 'gambar_luar') {
    // Otomatis sorot tab Picture Format khas MS Word asli
    const formatBtn = document.getElementById('ribbon-tab-format');
    if (formatBtn) {
      setWordRibbonTab('format');
    }
  }

  wordDragState.isDragging = true;
  wordDragState.elementId = id;

  const clientX = e.clientX || (e.touches && e.touches[0].clientX);
  const clientY = e.clientY || (e.touches && e.touches[0].clientY);

  wordDragState.startX = clientX;
  wordDragState.startY = clientY;
  wordDragState.elemStartX = item.x;
  wordDragState.elemStartY = item.y;

  document.addEventListener('mousemove', onDragWordMove);
  document.addEventListener('mouseup', endDragWord);
  document.addEventListener('touchmove', onDragWordMove, { passive: false });
  document.addEventListener('touchend', endDragWord);
}

function onDragWordMove(e) {
  if (!wordDragState.isDragging) return;
  e.preventDefault();

  const clientX = e.clientX || (e.touches && e.touches[0].clientX);
  const clientY = e.clientY || (e.touches && e.touches[0].clientY);

  const dx = clientX - wordDragState.startX;
  const dy = clientY - wordDragState.startY;

  const item = wordElements.find(el => el.id === wordDragState.elementId);
  if (!item) return;

  const paper = document.getElementById('word-paper');
  const maxW = paper ? paper.clientWidth - 50 : 400;
  const maxH = paper ? paper.clientHeight - 40 : 600;

  item.x = Math.max(5, Math.min(maxW, wordDragState.elemStartX + dx));
  item.y = Math.max(5, Math.min(maxH, wordDragState.elemStartY + dy));

  const domElem = document.getElementById(item.id);
  if (domElem) {
    domElem.style.left = `${item.x}px`;
    domElem.style.top = `${item.y}px`;
  }
}

function endDragWord() {
  wordDragState.isDragging = false;
  document.removeEventListener('mousemove', onDragWordMove);
  document.removeEventListener('mouseup', endDragWord);
  document.removeEventListener('touchmove', onDragWordMove);
  document.removeEventListener('touchend', endDragWord);
}

// ==========================================
// INTERAKSI RESIZE & ROTASI GAMBAR KHAS MS WORD
// ==========================================
let wordResizeState = {
  isResizing: false,
  elementId: null,
  handle: null,
  startX: 0,
  startY: 0,
  startWidth: 0,
  startHeight: 0,
  startElemX: 0,
  startElemY: 0,
  aspectRatio: 1
};

function startResizeWordElement(e, id, handle) {
  e.preventDefault();
  e.stopPropagation();

  const item = wordElements.find(el => el.id === id);
  if (!item) return;

  activeWordElementId = id;
  const clientX = e.clientX || (e.touches && e.touches[0].clientX);
  const clientY = e.clientY || (e.touches && e.touches[0].clientY);

  const domElem = document.getElementById(id);
  const curWidth = item.width || (item.size || 75);
  const curHeight = domElem ? domElem.offsetHeight : curWidth;

  wordResizeState = {
    isResizing: true,
    elementId: id,
    handle: handle,
    startX: clientX,
    startY: clientY,
    startWidth: curWidth,
    startHeight: curHeight,
    startElemX: item.x,
    startElemY: item.y,
    aspectRatio: curWidth / (curHeight || 1)
  };

  document.addEventListener('mousemove', onResizeWordMove);
  document.addEventListener('mouseup', endResizeWord);
  document.addEventListener('touchmove', onResizeWordMove, { passive: false });
  document.addEventListener('touchend', endResizeWord);
}

function onResizeWordMove(e) {
  if (!wordResizeState.isResizing) return;
  e.preventDefault();

  const clientX = e.clientX || (e.touches && e.touches[0].clientX);
  const clientY = e.clientY || (e.touches && e.touches[0].clientY);
  const dx = clientX - wordResizeState.startX;
  const dy = clientY - wordResizeState.startY;

  const item = wordElements.find(el => el.id === wordResizeState.elementId);
  if (!item) return;

  const handle = wordResizeState.handle;
  let newWidth = wordResizeState.startWidth;

  if (handle.includes('e')) {
    newWidth = wordResizeState.startWidth + dx;
  } else if (handle.includes('w')) {
    newWidth = wordResizeState.startWidth - dx;
    item.x = wordResizeState.startElemX + (wordResizeState.startWidth - newWidth);
  } else if (handle.includes('s')) {
    newWidth = wordResizeState.startWidth + dy * wordResizeState.aspectRatio;
  } else if (handle.includes('n')) {
    newWidth = wordResizeState.startWidth - dy * wordResizeState.aspectRatio;
    item.y = wordResizeState.startElemY + dy;
  }

  // Batas ukuran min & max
  newWidth = Math.max(30, Math.min(420, Math.round(newWidth)));
  item.width = newWidth;
  if (item.type === 'gambar') {
    item.size = newWidth;
  }

  // Update visual langsung pada elemen aktif
  const domElem = document.getElementById(item.id);
  if (domElem) {
    domElem.style.left = `${item.x}px`;
    domElem.style.top = `${item.y}px`;
    if (item.type === 'gambar') {
      const iconBox = domElem.querySelector('div');
      if (iconBox) {
        iconBox.style.fontSize = `${newWidth}px`;
        iconBox.style.width = `${newWidth + 16}px`;
        iconBox.style.height = `${newWidth + 16}px`;
      }
    } else if (item.type === 'gambar_luar') {
      const img = domElem.querySelector('img');
      if (img) img.style.width = `${newWidth}px`;
    }
  }
}

function endResizeWord() {
  if (wordResizeState.isResizing) {
    wordResizeState.isResizing = false;
    document.removeEventListener('mousemove', onResizeWordMove);
    document.removeEventListener('mouseup', endResizeWord);
    document.removeEventListener('touchmove', onResizeWordMove);
    document.removeEventListener('touchend', endResizeWord);
    renderWordElements();
  }
}

// ------------------------------------------
// FITUR PUTAR GAMBAR (ROTATE) OTENTIK MS WORD
// ------------------------------------------
let wordRotateState = {
  isRotating: false,
  elementId: null,
  centerX: 0,
  centerY: 0,
  startAngle: 0,
  startRotation: 0
};

function startRotateWordElement(e, id) {
  e.preventDefault();
  e.stopPropagation();

  const item = wordElements.find(el => el.id === id);
  if (!item) return;

  activeWordElementId = id;
  const domElem = document.getElementById(id);
  if (!domElem) return;

  const rect = domElem.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  const clientX = e.clientX || (e.touches && e.touches[0].clientX);
  const clientY = e.clientY || (e.touches && e.touches[0].clientY);

  const startAngle = Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI);

  wordRotateState = {
    isRotating: true,
    elementId: id,
    centerX: centerX,
    centerY: centerY,
    startAngle: startAngle,
    startRotation: item.rotation || 0
  };

  document.addEventListener('mousemove', onRotateWordMove);
  document.addEventListener('mouseup', endRotateWord);
  document.addEventListener('touchmove', onRotateWordMove, { passive: false });
  document.addEventListener('touchend', endRotateWord);
}

function onRotateWordMove(e) {
  if (!wordRotateState.isRotating) return;
  e.preventDefault();

  const clientX = e.clientX || (e.touches && e.touches[0].clientX);
  const clientY = e.clientY || (e.touches && e.touches[0].clientY);

  const currentAngle = Math.atan2(clientY - wordRotateState.centerY, clientX - wordRotateState.centerX) * (180 / Math.PI);
  let angleDiff = currentAngle - wordRotateState.startAngle;

  let newRot = Math.round(wordRotateState.startRotation + angleDiff);
  
  // Fitur snap ke 0, 45, 90, 180, 270 derajat jika dekat (khas MS Word)
  const snapAngles = [0, 45, 90, 135, 180, 225, 270, 315, 360, -45, -90, -180, -270];
  for (const s of snapAngles) {
    if (Math.abs(newRot - s) <= 4) {
      newRot = (s === 360) ? 0 : s;
      break;
    }
  }

  const item = wordElements.find(el => el.id === wordRotateState.elementId);
  if (!item) return;

  item.rotation = newRot;
  const domElem = document.getElementById(item.id);
  if (domElem) {
    domElem.style.transform = `rotate(${newRot}deg)`;
    domElem.style.transformOrigin = 'center center';
  }
}

function endRotateWord() {
  if (wordRotateState.isRotating) {
    wordRotateState.isRotating = false;
    document.removeEventListener('mousemove', onRotateWordMove);
    document.removeEventListener('mouseup', endRotateWord);
    document.removeEventListener('touchmove', onRotateWordMove);
    document.removeEventListener('touchend', endRotateWord);
    showToast(`Gambar diputar ke ${wordElements.find(el => el.id === activeWordElementId)?.rotation || 0}° 🔄`);
  }
}

// Edit & Hapus Elemen
function editWordTextElement(id) {
  playSound('click');
  const item = wordElements.find(el => el.id === id);
  if (!item || item.type !== 'teks') return;

  const newText = prompt('Ubah isi teks:', item.text);
  if (newText !== null && newText.trim() !== '') {
    item.text = newText.trim();
    renderWordElements();
    showToast('Teks berhasil diperbarui!');
  }
}

function hapusElemenWord(id) {
  playSound('click');
  wordElements = wordElements.filter(el => el.id !== id);
  if (activeWordElementId === id) activeWordElementId = null;
  renderWordElements();
  showToast('Elemen dihapus dari kertas Word.');
}

function deleteActiveElement() {
  if (activeWordElementId) {
    hapusElemenWord(activeWordElementId);
  } else {
    showToast('Klik salah satu elemen di kertas terlebih dahulu.', 'info');
  }
}

function ubahUkuranGambarWord(id, delta) {
  playSound('click');
  const item = wordElements.find(el => el.id === id);
  if (!item || item.type !== 'gambar') return;
  item.size = Math.max(35, Math.min(160, item.size + delta));
  renderWordElements();
}

// ==========================================
// PENGATURAN FONT MICROSOFT WORD MODERN
// ==========================================
let lastUsedWordColor = '#dc2626';

function sinkronkanRibbonFontDenganElemen(item) {
  if (!item || item.type !== 'teks') return;

  const fontSelect = document.getElementById('word-font-family');
  const sizeSelect = document.getElementById('word-font-size');
  const btnBold = document.getElementById('btn-word-bold');
  const btnItalic = document.getElementById('btn-word-italic');
  const btnUnderline = document.getElementById('btn-word-underline');
  const btnStrike = document.getElementById('btn-word-strike');
  const btnSub = document.getElementById('btn-word-sub');
  const btnSuper = document.getElementById('btn-word-super');
  const btnEffect = document.getElementById('btn-word-effect');
  const hlBar = document.getElementById('word-hl-bar');
  const colorBar = document.getElementById('word-color-bar');

  if (fontSelect && item.fontFamily) {
    fontSelect.value = item.fontFamily;
  }
  if (sizeSelect && item.fontSizePx) {
    sizeSelect.value = String(item.fontSizePx);
  }

  const setBtnActive = (btn, isActive) => {
    if (!btn) return;
    if (isActive) {
      btn.classList.add('bg-blue-100', 'border-blue-400', 'text-blue-700', 'shadow-xs');
      btn.classList.remove('border-transparent');
    } else {
      btn.classList.remove('bg-blue-100', 'border-blue-400', 'text-blue-700', 'shadow-xs');
      btn.classList.add('border-transparent');
    }
  };

  setBtnActive(btnBold, item.isBold);
  setBtnActive(btnItalic, item.isItalic);
  setBtnActive(btnUnderline, item.isUnderline);
  setBtnActive(btnStrike, item.isStrike);
  setBtnActive(btnSub, item.subSuper === 'sub');
  setBtnActive(btnSuper, item.subSuper === 'super');
  setBtnActive(btnEffect, item.textEffect && item.textEffect !== 'none');

  if (hlBar) {
    hlBar.style.backgroundColor = (item.highlightColor && item.highlightColor !== 'transparent') ? item.highlightColor : '#facc15';
  }
  if (colorBar && item.color) {
    colorBar.style.backgroundColor = item.color;
  }
}

function applyWordFontFamily(fontVal) {
  playSound('click');
  const item = wordElements.find(el => el.id === activeWordElementId);
  if (!item || item.type !== 'teks') {
    showToast('Pilih salah satu teks di lembar kerja terlebih dahulu.', 'info');
    return;
  }
  item.fontFamily = fontVal;
  renderWordElements();
  showToast(`Font diubah ke: ${fontVal.split(',')[0]}!`, 'info');
}

function applyWordFontSize(sizePx) {
  playSound('click');
  const item = wordElements.find(el => el.id === activeWordElementId);
  if (!item || item.type !== 'teks') {
    showToast('Pilih salah satu teks di lembar kerja terlebih dahulu.', 'info');
    return;
  }
  item.fontSizePx = parseInt(sizePx) || 20;
  renderWordElements();
}

function ubahWordFontSizeDelta(delta) {
  playSound('click');
  const item = wordElements.find(el => el.id === activeWordElementId);
  if (!item || item.type !== 'teks') {
    showToast('Pilih teks untuk mengubah ukuran font.', 'info');
    return;
  }
  const curSize = item.fontSizePx || 20;
  const newSize = Math.max(8, Math.min(96, curSize + delta));
  item.fontSizePx = newSize;

  const sizeSelect = document.getElementById('word-font-size');
  if (sizeSelect) sizeSelect.value = String(newSize);

  renderWordElements();
  showToast(`Ukuran Font: ${newSize}pt`, 'info');
}

function toggleWordCase() {
  playSound('click');
  const item = wordElements.find(el => el.id === activeWordElementId);
  if (!item || item.type !== 'teks' || !item.text) {
    showToast('Pilih teks untuk mengubah kapitalisasi.', 'info');
    return;
  }

  const str = item.text;
  if (str === str.toUpperCase()) {
    item.text = str.toLowerCase();
    showToast('Diubah ke: lowercase (huruf kecil)', 'info');
  } else if (str === str.toLowerCase()) {
    item.text = str.replace(/\b\w/g, l => l.toUpperCase());
    showToast('Diubah ke: Capitalize Each Word', 'info');
  } else {
    item.text = str.toUpperCase();
    showToast('Diubah ke: UPPERCASE (Semua Kapital)', 'info');
  }
  renderWordElements();
}

function clearWordTextFormatting() {
  playSound('click');
  const item = wordElements.find(el => el.id === activeWordElementId);
  if (!item || item.type !== 'teks') {
    showToast('Pilih teks untuk menghapus format.', 'info');
    return;
  }
  item.fontFamily = 'Aptos, sans-serif';
  item.fontSizePx = 20;
  item.isBold = false;
  item.isItalic = false;
  item.isUnderline = false;
  item.isStrike = false;
  item.subSuper = 'normal';
  item.textEffect = 'none';
  item.highlightColor = 'transparent';
  item.color = '#0f172a';

  sinkronkanRibbonFontDenganElemen(item);
  renderWordElements();
  showToast('Semua format font dibersihkan (Clear Formatting)! 🧹', 'success');
}

function toggleWordFormat(type) {
  playSound('click');
  const item = wordElements.find(el => el.id === activeWordElementId);
  if (!item || item.type !== 'teks') {
    showToast('Pilih salah satu teks di kertas terlebih dahulu.', 'info');
    return;
  }

  if (type === 'bold') {
    item.isBold = !item.isBold;
    showToast(item.isBold ? 'Teks Tebal (Bold)' : 'Teks Normal');
  } else if (type === 'italic') {
    item.isItalic = !item.isItalic;
    showToast(item.isItalic ? 'Teks Miring (Italic)' : 'Teks Tegak');
  } else if (type === 'underline') {
    item.isUnderline = !item.isUnderline;
    showToast(item.isUnderline ? 'Garis Bawah (Underline)' : 'Tanpa Garis Bawah');
  } else if (type === 'strike') {
    item.isStrike = !item.isStrike;
    showToast(item.isStrike ? 'Coretan Teks (Strikethrough)' : 'Tanpa Coretan');
  } else if (type === 'sub') {
    item.subSuper = (item.subSuper === 'sub') ? 'normal' : 'sub';
    showToast(item.subSuper === 'sub' ? 'Format Subscript (x₂)' : 'Normal');
  } else if (type === 'super') {
    item.subSuper = (item.subSuper === 'super') ? 'normal' : 'super';
    showToast(item.subSuper === 'super' ? 'Format Superscript (x²)' : 'Normal');
  }

  sinkronkanRibbonFontDenganElemen(item);
  renderWordElements();
}

function toggleWordTextEffect() {
  playSound('click');
  const item = wordElements.find(el => el.id === activeWordElementId);
  if (!item || item.type !== 'teks') {
    showToast('Pilih teks untuk memberikan efek seni (Typography)!', 'info');
    return;
  }

  const effects = ['none', 'glow', 'shadow', 'outline'];
  const curIdx = effects.indexOf(item.textEffect || 'none');
  const nextEffect = effects[(curIdx + 1) % effects.length];
  item.textEffect = nextEffect;

  sinkronkanRibbonFontDenganElemen(item);
  renderWordElements();

  const labels = {
    none: 'Normal (Tanpa Efek)',
    glow: 'Efek Berpendar (Blue Glow)',
    shadow: 'Efek Bayangan 3D (Shadow)',
    outline: 'Efek Garis Tepi (Outline WordArt)'
  };
  showToast(`Efek Teks: ${labels[nextEffect]} ✨`, 'info');
}

function bukaHighlightPicker(e) {
  e && e.stopPropagation();
  const popover = document.getElementById('popover-highlight-colors');
  if (popover) {
    popover.classList.toggle('hidden');
  }
}

function toggleWordHighlight(color) {
  playSound('click');
  const popover = document.getElementById('popover-highlight-colors');
  if (popover) popover.classList.add('hidden');

  const item = wordElements.find(el => el.id === activeWordElementId);
  if (!item || item.type !== 'teks') {
    showToast('Pilih teks untuk memberi warna sorot (Highlight).', 'info');
    return;
  }

  if (color === 'transparent' || item.highlightColor === color) {
    item.highlightColor = 'transparent';
    showToast('Warna sorot dihapus.', 'info');
  } else {
    item.highlightColor = color;
    showToast('Warna sorot teks (Highlight) diterapkan! 🖍️', 'success');
  }

  const hlBar = document.getElementById('word-hl-bar');
  if (hlBar) hlBar.style.backgroundColor = (item.highlightColor !== 'transparent') ? item.highlightColor : '#facc15';

  renderWordElements();
}

function applyLastWordColor() {
  applyWordTextColor(lastUsedWordColor);
}

function applyWordTextColor(color) {
  playSound('click');
  lastUsedWordColor = color;

  const item = wordElements.find(el => el.id === activeWordElementId);
  if (!item) {
    showToast('Pilih teks di lembar kerja untuk mengganti warna.', 'info');
    return;
  }

  item.color = color;
  const colorBar = document.getElementById('word-color-bar');
  if (colorBar) colorBar.style.backgroundColor = color;

  renderWordElements();
  showToast('Warna teks berhasil diubah! 🎨', 'success');
}

function tampilkanTipsFontWord() {
  playSound('click');
  showToast('Tip MS Word: Gunakan kombinasi Font Aptos/Calibri, tebal (B), dan warna teks yang kontras untuk poster yang indah!', 'info');
}

function applyActiveFontSize(sizeClass) {
  const item = wordElements.find(el => el.id === activeWordElementId);
  if (item && item.type === 'teks') {
    item.fontSize = sizeClass;
    renderWordElements();
  }
}

function applyActiveTextColor(color) {
  applyWordTextColor(color);
}

// Pengaturan Perataan Paragraf (Left, Center, Right, Justify)
function setWordTextAlign(align) {
  playSound('click');
  const item = wordElements.find(el => el.id === activeWordElementId);
  if (!item || item.type !== 'teks') {
    showToast('Pilih salah satu teks di lembar kerja terlebih dahulu.', 'info');
    return;
  }
  item.textAlign = align;
  renderWordElements();
  const alignNames = { left: 'Rata Kiri', center: 'Rata Tengah', right: 'Rata Kanan', justify: 'Rata Kanan-Kiri' };
  showToast(`Perataan Teks: ${alignNames[align] || align} 📄`);
}

// Galeri Quick Styles MS Word (Normal, No Spacing, Heading 1, Heading 2, Title, Subtitle)
function terapkanGayaCepatWord(styleKey) {
  playSound('click');
  const item = wordElements.find(el => el.id === activeWordElementId);
  if (!item || item.type !== 'teks') {
    showToast('Pilih salah satu teks di lembar kerja untuk menerapkan Style.', 'info');
    return;
  }

  if (styleKey === 'normal') {
    item.fontSizePx = 20;
    item.isBold = false;
    item.isItalic = false;
    item.color = '#0f172a';
    item.fontFamily = 'Aptos, sans-serif';
    showToast('Style: Normal diterapkan');
  } else if (styleKey === 'no_spacing') {
    item.fontSizePx = 18;
    item.isBold = false;
    item.isItalic = false;
    item.color = '#0f172a';
    item.fontFamily = 'Aptos, sans-serif';
    showToast('Style: No Spacing diterapkan');
  } else if (styleKey === 'heading1') {
    item.fontSizePx = 28;
    item.isBold = true;
    item.isItalic = false;
    item.color = '#2f5597';
    item.fontFamily = 'Aptos, sans-serif';
    showToast('Style: Heading 1 diterapkan (Biru Tua Tebal)');
  } else if (styleKey === 'heading2') {
    item.fontSizePx = 24;
    item.isBold = true;
    item.isItalic = false;
    item.color = '#2f5597';
    item.fontFamily = 'Aptos, sans-serif';
    showToast('Style: Heading 2 diterapkan');
  } else if (styleKey === 'title') {
    item.fontSizePx = 34;
    item.isBold = true;
    item.isItalic = false;
    item.color = '#0f172a';
    item.fontFamily = 'Aptos, sans-serif';
    showToast('Style: Title (Judul Besar) diterapkan');
  } else if (styleKey === 'subtitle') {
    item.fontSizePx = 20;
    item.isBold = false;
    item.isItalic = true;
    item.color = '#595959';
    item.fontFamily = 'Aptos, sans-serif';
    showToast('Style: Subtitle (Miring Abu-abu) diterapkan');
  }

  sinkronkanRibbonFontDenganElemen(item);
  renderWordElements();
}

function bringActiveToFront() {
  playSound('click');
  const item = wordElements.find(el => el.id === activeWordElementId);
  if (!item) return;
  const maxZ = Math.max(...wordElements.map(el => el.zIndex || 1), 1);
  item.zIndex = maxZ + 1;
  renderWordElements();
  showToast('Elemen dimajukan ke lapisan depan.');
}

function sendActiveToBack() {
  playSound('click');
  const item = wordElements.find(el => el.id === activeWordElementId);
  if (!item) return;
  item.zIndex = 1;
  renderWordElements();
  showToast('Elemen dimundurkan ke lapisan belakang.');
}

function undoWordElement() {
  playSound('click');
  if (wordElements.length > 0) {
    wordElements.pop();
    activeWordElementId = null;
    renderWordElements();
    showToast('Langkah terakhir dibatalkan (Undo).');
  }
}

function resetLembarWord() {
  playSound('click');
  if (confirm('Kosongkan seluruh lembar kerja Word untuk membuat poster baru?')) {
    wordElements = [];
    activeWordElementId = null;
    setWordPageBg('#ffffff');
    setWordPageBorder('none');
    renderWordElements();
    document.getElementById('word-eval-box').classList.add('hidden');
    showToast('Lembar kerja Word berhasil dibersihkan.');
  }
}

// Preset Poster Otomatis untuk Belajar Tata Letak
function loadPresetPosterLingkungan(preset) {
  if (!preset) return;
  playSound('success');
  wordElements = [];

  if (preset === 'indonesia_hebat') {
    setWordPageBg('#ffffff');
    setWordPageBorder('solid');
    wordElements = [
      { id: 'w1', type: 'teks', subtype: 'judul', text: 'TUJUH KEBIASAAN ANAK INDONESIA HEBAT', color: '#d97706', fontSizePx: 26, isBold: true, x: 25, y: 35, zIndex: 2 },
      { id: 'w2', type: 'gambar', key: 'indonesia', name: 'Indonesia Hebat', icon: 'fa-flag', color: '#dc2626', size: 85, x: 195, y: 120, zIndex: 1 },
      { id: 'w3', type: 'gambar', key: 'bangun_pagi', name: 'Bangun Pagi', icon: 'fa-sun', color: '#eab308', size: 55, x: 45, y: 220, zIndex: 1 },
      { id: 'w4', type: 'gambar', key: 'berolahraga', name: 'Berolahraga', icon: 'fa-futbol', color: '#ea580c', size: 55, x: 350, y: 220, zIndex: 1 },
      { id: 'w5', type: 'teks', subtype: 'slogan', text: '1. Bangun Pagi • 2. Beribadah • 3. Berolahraga • 4. Makan Bergizi', color: '#1e3a8a', fontSizePx: 14, isBold: true, x: 20, y: 330, zIndex: 3 },
      { id: 'w6', type: 'teks', subtype: 'slogan', text: '5. Gemar Belajar • 6. Bermasyarakat • 7. Tidur Cepat', color: '#1e3a8a', fontSizePx: 14, isBold: true, x: 60, y: 380, zIndex: 3 },
      { id: 'w7', type: 'teks', subtype: 'slogan', text: 'Dari Pembiasaan Menjadi Kebiasaan, Terbentuk Kepribadian & Peradaban!', color: '#b45309', fontSizePx: 12, isItalic: true, x: 15, y: 460, zIndex: 3 },
      { id: 'w8', type: 'teks', subtype: 'pembuat', text: 'Karya Pelajar Pancasila - Siswa Kelas 4 SD Hebat', color: '#475569', fontSizePx: 12, x: 100, y: 560, zIndex: 4 }
    ];
  } else if (preset === 'asta_cita') {
    setWordPageBg('#eff6ff');
    setWordPageBorder('solid');
    wordElements = [
      { id: 'w1', type: 'teks', subtype: 'judul', text: 'MEWUJUDKAN ASTA CITA BANGSA', color: '#1e40af', fontSizePx: 26, isBold: true, x: 45, y: 35, zIndex: 2 },
      { id: 'w2', type: 'gambar', key: 'indonesia', name: 'Indonesia', icon: 'fa-flag', color: '#dc2626', size: 90, x: 190, y: 130, zIndex: 1 },
      { id: 'w3', type: 'teks', subtype: 'banner', text: '★ GENERASI EMAS INDONESIA BERKARAKTER ★', color: '#ffffff', fontSizePx: 16, isBold: true, x: 40, y: 280, zIndex: 3 },
      { id: 'w4', type: 'teks', subtype: 'slogan', text: 'Religius • Bermoral • Sehat • Cerdas & Kreatif • Kerja Keras • Disiplin • Mandiri • Bermanfaat', color: '#1e3a8a', fontSizePx: 13, isBold: true, x: 15, y: 410, zIndex: 3 },
      { id: 'w5', type: 'teks', subtype: 'pembuat', text: 'Pendidikan Karakter Bangsa Kelas 4 SD', color: '#3b82f6', fontSizePx: 12, x: 120, y: 560, zIndex: 4 }
    ];
  } else if (preset === 'sehat_bugar') {
    setWordPageBg('#fefce8');
    setWordPageBorder('dashed');
    wordElements = [
      { id: 'w1', type: 'teks', subtype: 'judul', text: 'BANGUN PAGI, OLAHRAGA & BERGIZI', color: '#b45309', fontSizePx: 24, isBold: true, x: 25, y: 35, zIndex: 2 },
      { id: 'w2', type: 'gambar', key: 'bangun_pagi', name: 'Bangun Pagi', icon: 'fa-sun', color: '#eab308', size: 85, x: 70, y: 150, zIndex: 1 },
      { id: 'w3', type: 'gambar', key: 'berolahraga', name: 'Berolahraga', icon: 'fa-futbol', color: '#ea580c', size: 85, x: 195, y: 150, zIndex: 1 },
      { id: 'w4', type: 'gambar', key: 'makan_sehat', name: 'Makan Bergizi', icon: 'fa-apple-whole', color: '#16a34a', size: 85, x: 320, y: 150, zIndex: 1 },
      { id: 'w5', type: 'teks', subtype: 'slogan', text: 'Awali Hari dengan Sholat/Ibadah, Senam Pagi, dan Sarapan Sehat Bergizi!', color: '#9a3412', fontSizePx: 14, isBold: true, x: 20, y: 390, zIndex: 3 },
      { id: 'w6', type: 'teks', subtype: 'pembuat', text: 'Duta Anak Sehat & Hebat Kelas 4 SD', color: '#b45309', fontSizePx: 12, x: 130, y: 560, zIndex: 4 }
    ];
  } else if (preset === 'cerdas_sosial') {
    setWordPageBg('#f5f3ff');
    setWordPageBorder('solid');
    wordElements = [
      { id: 'w1', type: 'teks', subtype: 'judul', text: 'GEMAR BELAJAR & BERMASYARAKAT', color: '#6d28d9', fontSizePx: 24, isBold: true, x: 25, y: 35, zIndex: 2 },
      { id: 'w2', type: 'gambar', key: 'gemar_belajar', name: 'Belajar', icon: 'fa-book-open-reader', color: '#7c3aed', size: 95, x: 110, y: 140, zIndex: 1 },
      { id: 'w3', type: 'gambar', key: 'bermasyarakat', name: 'Bermasyarakat', icon: 'fa-people-group', color: '#0d9488', size: 95, x: 260, y: 140, zIndex: 1 },
      { id: 'w4', type: 'teks', subtype: 'slogan', text: 'Membaca Membuka Cakrawala Dunia, Gotong Royong Mempererat Persaudaraan!', color: '#5b21b6', fontSizePx: 14, isBold: true, x: 15, y: 400, zIndex: 3 },
      { id: 'w5', type: 'teks', subtype: 'pembuat', text: 'Generasi Cerdas Berkarakter Kelas 4 SD', color: '#7c3aed', fontSizePx: 12, x: 120, y: 560, zIndex: 4 }
    ];
  } else if (preset === 'bumi') {
    setWordPageBg('#ecfdf5');
    setWordPageBorder('solid');
    wordElements = [
      { id: 'w1', type: 'teks', subtype: 'judul', text: 'JAGA BUMI KITA BERSERI', color: '#047857', fontSizePx: 28, isBold: true, x: 40, y: 35, zIndex: 2 },
      { id: 'w2', type: 'gambar', key: 'bumi', name: 'Bumi', icon: 'fa-earth-americas', color: '#059669', size: 100, x: 180, y: 130, zIndex: 1 },
      { id: 'w3', type: 'teks', subtype: 'slogan', text: 'Bumi adalah Rumah Kita Bersama, Rawatlah dengan Cinta!', color: '#065f46', fontSizePx: 16, isBold: true, x: 25, y: 460, zIndex: 3 }
    ];
  }

  activeWordElementId = null;
  renderWordElements();
  showToast(`Template "${preset.toUpperCase()}" berhasil dipasang di Word!`, 'success');
}

// Evaluasi Berpikir Komputasional (Kombinasi Logis & Dekomposisi)
function evaluasiPosterWord() {
  playSound('click');
  const evalBox = document.getElementById('word-eval-box');
  const evalDesc = document.getElementById('word-eval-desc');
  evalBox.classList.remove('hidden');

  const adaJudul = wordElements.some(el => el.type === 'teks' && (el.subtype === 'judul' || el.text.length > 5));
  const adaGambar = wordElements.some(el => el.type === 'gambar' || el.type === 'gambar_luar');
  const adaSlogan = wordElements.some(el => el.type === 'teks' && el.subtype !== 'judul');

  if (adaJudul && adaGambar && adaSlogan) {
    tambahPoin(50);
    playSound('fanfare');
    evalDesc.innerHTML = '<b>Luar Biasa!</b> Poster 7 Kebiasaan Anak Indonesia Hebat di Microsoft Word sudah tersusun lengkap dengan <i>Dekomposisi Elemen</i> yang sempurna: ada Judul Utama WordArt, Gambar Ikon Karakter (termasuk gambar pilihanmu), dan Butir Kebiasaan Hebat. Kamu menerapkan Berpikir Komputasional dengan sangat baik!';
    showToast('Selamat! Nilai Poster 100/100 (+50 Bintang)', 'success');
  } else if (!adaJudul) {
    evalDesc.innerHTML = '<b>Belum Lengkap:</b> Postermu belum memiliki Judul Utama (WordArt). Sisipkan judul "Tujuh Kebiasaan Anak Indonesia Hebat" dari Bank Teks di sebelah kiri!';
    showToast('Tambahkan Judul Utama pada postermu!', 'info');
  } else if (!adaGambar) {
    evalDesc.innerHTML = '<b>Belum Lengkap:</b> Postermu belum memiliki Gambar Ikon Karakter. Sisipkan ikon 7 Kebiasaan atau upload foto dari komputer!';
    showToast('Sisipkan gambar/ikon karakter ke postermu!', 'info');
  } else {
    evalDesc.innerHTML = '<b>Hampir Sempurna:</b> Tambahkan butir kebiasaan hebat atau nama pembuat agar postermu semakin informatif!';
    showToast('Tambahkan butir kebiasaan atau nama pembuat!', 'info');
  }

  evalBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Helper membuat DataURL Gambar Poster PNG secara mandiri dari wordElements atau docData
async function generatePosterDataUrl(customDocData = null) {
  try {
    let canvas = document.getElementById('export-canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'export-canvas';
      canvas.className = 'hidden';
      document.body.appendChild(canvas);
    }
    const eCtx = canvas.getContext('2d');
    const width = 600;
    const height = 780;
    canvas.width = width;
    canvas.height = height;

    const targetBg = (customDocData && customDocData.pageBgColor) || wordPageBgColor || '#ffffff';
    const targetBorder = (customDocData && customDocData.pageBorderStyle) || wordPageBorderStyle || 'solid';
    const elementsList = (customDocData && Array.isArray(customDocData.elements)) ? customDocData.elements : wordElements;

    // 1. Background Kertas
    eCtx.fillStyle = targetBg;
    eCtx.fillRect(0, 0, width, height);

    // 2. Page Border
    if (targetBorder === 'solid') {
      eCtx.strokeStyle = '#059669';
      eCtx.lineWidth = 10;
      eCtx.strokeRect(18, 18, width - 36, height - 36);
    } else if (targetBorder === 'dashed') {
      eCtx.strokeStyle = '#10b981';
      eCtx.lineWidth = 8;
      eCtx.setLineDash([15, 10]);
      eCtx.strokeRect(18, 18, width - 36, height - 36);
      eCtx.setLineDash([]);
    }

    // 3. Render Elemen
    const scale = 600 / 480;
    const sorted = [...elementsList].sort((a, b) => (a.zIndex || 1) - (b.zIndex || 1));

    for (const item of sorted) {
      const rx = (item.x || 0) * scale;
      const ry = (item.y || 0) * scale;
      eCtx.save();
      const rot = item.rotation || 0;

      if (item.type === 'teks') {
        const isJudul = item.subtype === 'judul';
        const isBanner = item.subtype === 'banner';

        if (rot !== 0) {
          eCtx.translate(rx + 60, ry + 15);
          eCtx.rotate((rot * Math.PI) / 180);
          eCtx.translate(-(rx + 60), -(ry + 15));
        }

        if (isBanner) {
          eCtx.fillStyle = '#059669';
          eCtx.fillRect(rx - 10, ry - 22, width * 0.8, 44);
          eCtx.fillStyle = '#ffffff';
          eCtx.font = 'bold 22px Fredoka, sans-serif';
          eCtx.textAlign = 'left';
          eCtx.fillText(item.text || '', rx + 10, ry + 6);
        } else {
          eCtx.fillStyle = item.color || '#000000';
          eCtx.font = isJudul ? '900 28px Fredoka, sans-serif' : 'bold 18px Nunito, sans-serif';
          eCtx.textAlign = 'left';
          eCtx.fillText(item.text || '', rx, ry + 24);
        }
      } else if (item.type === 'gambar') {
        const imgData = WORD_IMAGES[item.key];
        const emojiChar = imgData ? imgData.emoji : '🌱';
        const curSize = (item.width || item.size || 75);
        const fontSize = Math.round(curSize * scale * 0.85);

        if (rot !== 0) {
          eCtx.translate(rx + fontSize / 2, ry + fontSize / 2);
          eCtx.rotate((rot * Math.PI) / 180);
          eCtx.translate(-(rx + fontSize / 2), -(ry + fontSize / 2));
        }

        eCtx.font = `${fontSize}px sans-serif`;
        eCtx.textAlign = 'left';
        eCtx.fillText(emojiChar, rx, ry + fontSize);
      } else if (item.type === 'gambar_luar' && item.src) {
        try {
          const imgObj = await new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
            img.src = item.src;
          });
          if (imgObj) {
            const rWidth = (item.width || 140) * scale;
            const aspect = imgObj.naturalHeight / (imgObj.naturalWidth || 1);
            const rHeight = rWidth * aspect;

            if (rot !== 0) {
              eCtx.translate(rx + rWidth / 2, ry + rHeight / 2);
              eCtx.rotate((rot * Math.PI) / 180);
              eCtx.translate(-(rx + rWidth / 2), -(ry + rHeight / 2));
            }

            eCtx.drawImage(imgObj, rx, ry, rWidth, rHeight);
          }
        } catch (err) {}
      }
      eCtx.restore();
    }

    // Watermark
    eCtx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    eCtx.font = '13px Nunito, sans-serif';
    eCtx.textAlign = 'center';
    eCtx.fillText('Dibuat dengan Microsoft Word Simulator • Kelas 4 SD Semester 1', width / 2, height - 12);

    return canvas.toDataURL('image/png');
  } catch (err) {
    console.error('generatePosterDataUrl error:', err);
    return null;
  }
}

// Simpan Dokumen Word Jadi File Gambar PNG
async function simpanPosterWord() {
  playSound('success');
  const pngDataUrl = await generatePosterDataUrl();

  if (pngDataUrl) {
    // Trigger Download PNG
    const link = document.createElement('a');
    link.download = `Poster-Lingkungan-Hidup-MSWord-${Date.now()}.png`;
    link.href = pngDataUrl;
    link.click();
  }

  // Simpan ke Galeri Karya Poster Word (localStorage)
  await simpanPosterKeGaleriWord(pngDataUrl);

  tambahPoin(25);
  showToast('Poster Word berhasil disimpan di Galeri Praktik 1 dan diunduh! 🖨️ ⭐', 'success');
}

// Helper Preset Elemen Poster untuk Galeri & Simulator
function getPosterPresetElements(key = 'lingkungan') {
  if (key === 'indonesia_hebat' || key === 'hebat') {
    return [
      { id: 'w1', type: 'teks', subtype: 'judul', text: 'TUJUH KEBIASAAN ANAK INDONESIA HEBAT', color: '#d97706', fontSizePx: 26, isBold: true, x: 25, y: 35, zIndex: 2 },
      { id: 'w2', type: 'gambar', key: 'indonesia', name: 'Indonesia Hebat', icon: 'fa-flag', color: '#dc2626', size: 85, x: 195, y: 120, zIndex: 1 },
      { id: 'w3', type: 'gambar', key: 'bangun_pagi', name: 'Bangun Pagi', icon: 'fa-sun', color: '#eab308', size: 55, x: 45, y: 220, zIndex: 1 },
      { id: 'w4', type: 'gambar', key: 'berolahraga', name: 'Berolahraga', icon: 'fa-futbol', color: '#ea580c', size: 55, x: 350, y: 220, zIndex: 1 },
      { id: 'w5', type: 'teks', subtype: 'slogan', text: '1. Bangun Pagi • 2. Beribadah • 3. Berolahraga • 4. Makan Bergizi', color: '#1e3a8a', fontSizePx: 14, isBold: true, x: 20, y: 330, zIndex: 3 },
      { id: 'w6', type: 'teks', subtype: 'slogan', text: '5. Gemar Belajar • 6. Bermasyarakat • 7. Tidur Cepat', color: '#1e3a8a', fontSizePx: 14, isBold: true, x: 60, y: 380, zIndex: 3 },
      { id: 'w7', type: 'teks', subtype: 'slogan', text: 'Dari Pembiasaan Menjadi Kebiasaan, Terbentuk Kepribadian & Peradaban!', color: '#b45309', fontSizePx: 12, isItalic: true, x: 15, y: 460, zIndex: 3 },
      { id: 'w8', type: 'teks', subtype: 'pembuat', text: 'Karya Siswa Kelas 4 SD • SDS Cinta Kasih Tzu Chi', color: '#475569', fontSizePx: 12, x: 100, y: 560, zIndex: 4 }
    ];
  }
  return [
    { id: 'w1', type: 'teks', subtype: 'judul', text: 'LESTARIKAN LINGKUNGAN HIDUP KITA', color: '#047857', fontSizePx: 26, isBold: true, x: 25, y: 35, zIndex: 2 },
    { id: 'w2', type: 'gambar', key: 'bumi', name: 'Bumi Hijau', icon: 'fa-earth-americas', color: '#059669', size: 85, x: 195, y: 120, zIndex: 1 },
    { id: 'w3', type: 'gambar', key: 'tunas', name: 'Tunas Tanaman', icon: 'fa-seedling', color: '#65a30d', size: 55, x: 50, y: 220, zIndex: 1 },
    { id: 'w4', type: 'gambar', key: 'recycle', name: 'Daur Ulang', icon: 'fa-recycle', color: '#059669', size: 55, x: 340, y: 220, zIndex: 1 },
    { id: 'w5', type: 'teks', subtype: 'slogan', text: '1. Buang Sampah Pada Tempatnya • 2. Tanam Pohon Rindang', color: '#1e3a8a', fontSizePx: 13, isBold: true, x: 20, y: 330, zIndex: 3 },
    { id: 'w6', type: 'teks', subtype: 'slogan', text: '3. Hemat Air & Listrik • 4. Olah Sampah Daur Ulang Tzu Chi', color: '#1e3a8a', fontSizePx: 13, isBold: true, x: 20, y: 380, zIndex: 3 },
    { id: 'w7', type: 'teks', subtype: 'slogan', text: 'Bumi adalah Rumah Kita Bersama, Rawatlah dengan Cinta dan Kasih Sayang!', color: '#b45309', fontSizePx: 12, isItalic: true, x: 15, y: 460, zIndex: 3 },
    { id: 'w8', type: 'teks', subtype: 'pembuat', text: 'Karya Siswa Kelas 4 SD • SDS Cinta Kasih Tzu Chi', color: '#475569', fontSizePx: 12, x: 80, y: 560, zIndex: 4 }
  ];
}

// Simpan poster ke galeri koleksi siswa di Praktik 1
async function simpanPosterKeGaleriWord(previewDataUrl = null) {
  try {
    const inputEl = document.getElementById('word-doc-name-input');
    const title = (inputEl && inputEl.value.trim()) ? inputEl.value.trim() : (currentWordDocTitle || 'Poster_Kreator_Cilik');

    // Jika wordElements kosong saat siswa simpan, isi dengan elemen preset agar tidak menyimpan lembar kosong
    if (wordElements.length === 0) {
      wordElements = getPosterPresetElements('lingkungan');
      renderWordElements();
    }

    if (!previewDataUrl) {
      previewDataUrl = await generatePosterDataUrl();
    }

    const posterItem = {
      id: 'poster_' + Date.now(),
      title: title,
      date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
      image: previewDataUrl,
      elementsCount: wordElements.length,
      docData: {
        title: title,
        elements: JSON.parse(JSON.stringify(wordElements)),
        pageBgColor: wordPageBgColor,
        pageBorderStyle: wordPageBorderStyle
      }
    };

    let list = JSON.parse(localStorage.getItem('kreator_cilik_word_posters') || '[]');
    // Jika sudah ada judul yang sama, ganti dengan versi terbaru
    const existIdx = list.findIndex(p => p.title.toLowerCase() === title.toLowerCase());
    if (existIdx >= 0) {
      list[existIdx] = posterItem;
    } else {
      list.unshift(posterItem);
    }
    if (list.length > 12) list = list.slice(0, 12);
    localStorage.setItem('kreator_cilik_word_posters', JSON.stringify(list));

    // Refresh galeri jika sedang dibuka
    renderGaleriPosterWord();

    // Catat karya poster ke Database Guru
    if (typeof catatPosterSiswa === 'function') {
      catatPosterSiswa(title, previewDataUrl);
    }
  } catch (e) {
    console.warn('Gagal menyimpan poster ke galeri:', e);
  }
}

// Render Galeri Poster Siswa di Tab Praktik 1
function renderGaleriPosterWord() {
  const container = document.getElementById('p1-word-poster-gallery');
  if (!container) return;

  const rawStorage = localStorage.getItem('kreator_cilik_word_posters');
  let posters = [];
  if (rawStorage !== null) {
    try {
      posters = JSON.parse(rawStorage);
    } catch (e) {
      posters = [];
    }
  }

  // AUTO-REPAIR: Pastikan semua item poster memiliki elemen lengkap (cegah poster kosong/blank)
  let needReSave = false;
  if (Array.isArray(posters) && posters.length > 0) {
    posters.forEach(p => {
      if (!p.docData || !Array.isArray(p.docData.elements) || p.docData.elements.length === 0) {
        const isHebat = (p.title && p.title.toLowerCase().includes('hebat'));
        const repElements = getPosterPresetElements(isHebat ? 'hebat' : 'lingkungan');
        p.docData = {
          title: p.title || 'Poster_Lingkungan_Hidup_Kelas4',
          elements: repElements,
          pageBgColor: isHebat ? '#ffffff' : '#ecfdf5',
          pageBorderStyle: 'solid'
        };
        p.elementsCount = repElements.length;
        p.image = null; // Reset image agar di-render ulang
        needReSave = true;
      }
    });
  }

  // Cek apakah galeri sudah pernah diinisialisasi
  const hasInitialized = localStorage.getItem('kreator_cilik_word_posters_initialized');

  // Hanya buat starter pada kunjungan pertama kali (rawStorage === null). Jika siswa sudah menghapus semua, jangan paksa buat ulang!
  if (rawStorage === null && !hasInitialized) {
    const starter1 = {
      id: 'poster_' + Date.now(),
      title: 'Poster_Lingkungan_Hidup_Kelas4',
      date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
      elementsCount: 8,
      docData: {
        title: 'Poster_Lingkungan_Hidup_Kelas4',
        elements: getPosterPresetElements('lingkungan'),
        pageBgColor: '#ecfdf5',
        pageBorderStyle: 'solid'
      }
    };
    const starter2 = {
      id: 'poster_' + (Date.now() - 1000),
      title: 'Poster_7_Kebiasaan_Anak_Indonesia_Hebat',
      date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now() - 1000,
      elementsCount: 8,
      docData: {
        title: 'Poster_7_Kebiasaan_Anak_Indonesia_Hebat',
        elements: getPosterPresetElements('hebat'),
        pageBgColor: '#ffffff',
        pageBorderStyle: 'solid'
      }
    };
    posters = [starter1, starter2];
    localStorage.setItem('kreator_cilik_word_posters_initialized', 'true');
    needReSave = true;
  }

  if (needReSave) {
    try {
      localStorage.setItem('kreator_cilik_word_posters', JSON.stringify(posters));
    } catch(e) {}
  }

  // Tampilan jika galeri kosong (setelah siswa menghapus dokumen)
  if (posters.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-12 px-6 bg-slate-50 border-2 border-dashed border-slate-300 rounded-3xl text-center space-y-4">
        <div class="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-3xl mx-auto shadow-sm">
          <i class="fa-solid fa-file-word"></i>
        </div>
        <div>
          <h4 class="font-title font-bold text-slate-800 text-lg">Belum Ada Dokumen Poster di Galeri</h4>
          <p class="text-xs text-slate-500 max-w-md mx-auto mt-1">
            Semua dokumen poster telah dihapus. Kamu bisa membuat poster baru di Lab Microsoft Word atau memasang kembali contoh template!
          </p>
        </div>
        <div class="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button onclick="switchTab('msword')" class="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-title font-bold text-xs shadow-md transition flex items-center gap-2">
            <i class="fa-solid fa-plus-circle"></i> Buat Poster Baru di Word
          </button>
          <button onclick="pasangContohPosterGaleri()" class="px-4 py-2.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-xl font-title font-bold text-xs transition flex items-center gap-2">
            <i class="fa-solid fa-wand-magic-sparkles"></i> Pasang Contoh Poster
          </button>
        </div>
      </div>
    `;
    return;
  }

  // Tampilkan daftar poster siswa dengan Miniatur Lembar Dokumen Word Otentik & Aksi Lengkap
  container.innerHTML = posters.map((p, idx) => {
    const isNewest = idx === 0;
    const docElems = (p.docData && Array.isArray(p.docData.elements) && p.docData.elements.length > 0)
      ? p.docData.elements
      : getPosterPresetElements('lingkungan');

    const pageBg = (p.docData && p.docData.pageBgColor) || '#ffffff';
    const pageBorder = (p.docData && p.docData.pageBorderStyle) || 'solid';
    const borderStyleClass = pageBorder === 'solid'
      ? 'border-4 border-emerald-600'
      : (pageBorder === 'dashed' ? 'border-4 border-dashed border-emerald-500' : 'border border-slate-300');

    // Ambil elemen-elemen penting
    const judulElem = docElems.find(el => el.type === 'teks' && (el.subtype === 'judul' || el.text)) || { text: p.title || 'POSTER SISWA', color: '#047857' };
    const gambarElems = docElems.filter(el => el.type === 'gambar' || el.type === 'gambar_luar');
    const sloganElems = docElems.filter(el => el.type === 'teks' && el.subtype !== 'judul' && el.subtype !== 'pembuat');
    const pembuatElem = docElems.find(el => el.type === 'teks' && el.subtype === 'pembuat');

    // Bangun tampilan visual gambar / ikon tengah
    let imagesHtml = '';
    if (gambarElems.length > 0) {
      imagesHtml = gambarElems.slice(0, 3).map((g, gIdx) => {
        if (g.type === 'gambar_luar' && g.src) {
          return `<img src="${g.src}" class="max-h-16 max-w-[80px] object-contain rounded-lg shadow-xs border border-emerald-200 bg-white p-0.5" alt="Gambar">`;
        }
        const imgDef = WORD_IMAGES[g.key] || {};
        const emoji = imgDef.emoji || '🌱';
        const iconClass = g.icon || imgDef.icon || 'fa-seedling';
        const iconColor = g.color || imgDef.color || '#059669';
        const isMain = (gIdx === 0 || (g.size && g.size > 70));
        const badgeSize = isMain ? 'w-14 h-14 text-3xl' : 'w-11 h-11 text-2xl';
        return `
          <div class="${badgeSize} rounded-2xl bg-white/95 border-2 border-emerald-200/90 shadow-xs flex items-center justify-center drop-shadow-xs transition transform hover:scale-105" title="${g.name || 'Ikon'}">
            ${emoji !== '🌱' ? emoji : `<i class="fa-solid ${iconClass}" style="color:${iconColor};"></i>`}
          </div>
        `;
      }).join('');
    } else {
      imagesHtml = `
        <div class="w-14 h-14 rounded-2xl bg-white/95 border-2 border-emerald-300 shadow-xs flex items-center justify-center text-3xl">🌍</div>
        <div class="w-11 h-11 rounded-2xl bg-white/95 border-2 border-emerald-200 shadow-xs flex items-center justify-center text-2xl">🌱</div>
        <div class="w-11 h-11 rounded-2xl bg-white/95 border-2 border-emerald-200 shadow-xs flex items-center justify-center text-2xl">♻️</div>
      `;
    }

    // Bangun tampilan slogan
    let slogansHtml = '';
    if (sloganElems.length > 0) {
      slogansHtml = sloganElems.slice(0, 2).map(s => `
        <div class="bg-white/90 backdrop-blur-xs border border-emerald-200/80 rounded-lg px-2.5 py-1 shadow-2xs">
          <p class="text-[10px] font-bold truncate leading-tight" style="color: ${s.color || '#1e3a8a'};">
            ${s.text}
          </p>
        </div>
      `).join('');
    } else {
      slogansHtml = `
        <div class="bg-white/90 border border-emerald-200 rounded-lg px-2.5 py-1 text-[10px] font-bold text-emerald-900 truncate">
          🌱 Lestarikan Bumi • Jaga Kebersihan Lingkungan
        </div>
      `;
    }

    return `
      <div class="bg-white rounded-2xl border border-slate-200 hover:border-blue-400 shadow-sm hover:shadow-lg transition-all overflow-hidden flex flex-col group">
        <!-- Thumbnail Poster (Miniatur Lembar Dokumen Word Otentik) -->
        <div class="relative bg-slate-200/80 aspect-[3/4] overflow-hidden flex items-center justify-center border-b border-slate-100 p-3 select-none">
          
          <!-- Lembar Kertas Word Mini -->
          <div class="w-full h-full rounded-xl shadow-md p-3 sm:p-4 flex flex-col justify-between items-center text-center transition group-hover:scale-[1.02] duration-300 relative overflow-hidden select-none ${borderStyleClass}" style="background-color: ${pageBg};">
            
            <!-- Judul Poster & Pita Ms. Word -->
            <div class="w-full pt-0.5 space-y-1">
              <div class="inline-flex items-center gap-1.5 bg-white/90 backdrop-blur-xs px-2.5 py-0.5 rounded-full border border-emerald-300 text-[8px] font-black uppercase tracking-wider text-emerald-800 shadow-2xs">
                <i class="fa-solid fa-file-word text-blue-600"></i> Dokumen Ms. Word 2026
              </div>
              <h6 class="font-title font-black text-xs sm:text-sm leading-snug line-clamp-2 drop-shadow-2xs px-1" style="color: ${judulElem.color || '#047857'};">
                ${judulElem.text || p.title}
              </h6>
            </div>

            <!-- Ikon & Karakter Visual -->
            <div class="my-auto py-1 flex items-center justify-center gap-2 flex-wrap">
              ${imagesHtml}
            </div>

            <!-- Slogan & Identitas Kreator -->
            <div class="w-full space-y-1.5 pb-0.5 border-t border-slate-200/80 pt-1.5">
              ${slogansHtml}
              <div class="flex items-center justify-between text-[8px] font-bold text-slate-500 pt-0.5 px-0.5">
                <span class="truncate">👤 ${pembuatElem ? pembuatElem.text : 'Karya Siswa Kelas 4 SD'}</span>
                <span class="shrink-0 text-emerald-800 bg-emerald-100/90 font-black px-1.5 py-0.5 rounded shadow-2xs">Tzu Chi 🌸</span>
              </div>
            </div>

          </div>

          ${isNewest ? `
            <span class="absolute top-3 left-3 bg-emerald-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
              <i class="fa-solid fa-star text-amber-300"></i> Karya Terbaru
            </span>
          ` : ''}

          <!-- Tombol Aksi Cepat di Pojok Kanan Atas Thumbnail (Salin & Hapus) -->
          <div class="absolute top-3 right-3 z-10 flex items-center gap-1.5">
            <button onclick="event.stopPropagation(); salinPosterWordDariGaleri('${p.id}')" class="px-2 py-1 bg-white/95 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-lg shadow-md border border-indigo-200 text-[11px] font-bold transition flex items-center gap-1" title="Salin / Copy Dokumen Ini">
              <i class="fa-regular fa-copy"></i>
              <span class="text-[10px]">Salin</span>
            </button>
            <button onclick="event.stopPropagation(); bukaModalHapusPoster('${p.id}')" class="px-2 py-1 bg-white/95 hover:bg-rose-600 text-rose-600 hover:text-white rounded-lg shadow-md border border-rose-200 text-[11px] font-bold transition flex items-center gap-1" title="Hapus Dokumen Poster Ini">
              <i class="fa-solid fa-trash-can"></i>
              <span class="text-[10px]">Hapus</span>
            </button>
          </div>
        </div>

        <!-- Info & 4 Tombol Aksi Lengkap -->
        <div class="p-4 flex-1 flex flex-col justify-between space-y-3">
          <div>
            <div class="flex items-start justify-between gap-2">
              <h5 class="font-title font-bold text-sm text-slate-800 line-clamp-1 group-hover:text-blue-600 transition" title="${p.title}">${p.title}</h5>
              <span class="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold shrink-0">
                Word
              </span>
            </div>
            <p class="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <i class="fa-regular fa-clock"></i> ${p.date || 'Tersimpan'}
            </p>
          </div>

          <!-- 4 Tombol Aksi: Buka, Salin (Copy), Unduh, Hapus -->
          <div class="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
            <button onclick="bukaPosterWordDariGaleri('${p.id}')" class="px-2.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-xs hover:shadow transition flex items-center justify-center gap-1.5" title="Buka dan edit dokumen di Microsoft Word">
              <i class="fa-solid fa-pen-to-square"></i> Buka di Word
            </button>
            <button onclick="salinPosterWordDariGaleri('${p.id}')" class="px-2.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-bold text-xs border border-indigo-200 transition flex items-center justify-center gap-1.5" title="Salin / Duplikat dokumen ini">
              <i class="fa-regular fa-copy"></i> Salin (Copy)
            </button>
            <button onclick="unduhPosterWordDariGaleri('${p.id}')" class="px-2.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl font-bold text-xs border border-emerald-200 transition flex items-center justify-center gap-1.5" title="Unduh gambar PNG">
              <i class="fa-solid fa-download"></i> Unduh PNG
            </button>
            <button onclick="bukaModalHapusPoster('${p.id}')" class="px-2.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl font-bold text-xs border border-rose-200 transition flex items-center justify-center gap-1.5" title="Hapus dokumen ini dari galeri">
              <i class="fa-solid fa-trash-can"></i> Hapus
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Perbaiki dan Segarkan Tampilan Galeri Poster
function perbaikiGaleriPosterWord() {
  playSound('success');
  let list = [];
  try {
    list = JSON.parse(localStorage.getItem('kreator_cilik_word_posters') || '[]');
  } catch(e) { list = []; }

  // Bersihkan dan perbaiki setiap item
  list.forEach(p => {
    if (!p.docData || !Array.isArray(p.docData.elements) || p.docData.elements.length === 0) {
      const isHebat = (p.title && p.title.toLowerCase().includes('hebat'));
      p.docData = {
        title: p.title || 'Poster_Lingkungan_Hidup_Kelas4',
        elements: getPosterPresetElements(isHebat ? 'hebat' : 'lingkungan'),
        pageBgColor: isHebat ? '#ffffff' : '#ecfdf5',
        pageBorderStyle: 'solid'
      };
      p.elementsCount = p.docData.elements.length;
      p.image = null;
    }
  });

  if (list.length === 0) {
    pasangContohPosterGaleri();
    return;
  }

  localStorage.setItem('kreator_cilik_word_posters', JSON.stringify(list));
  renderGaleriPosterWord();
  showToast('Galeri poster Microsoft Word berhasil disegarkan & diperbarui! 🌟', 'success');
}

// Buka Poster dari Galeri kembali ke Simulator MS Word untuk diedit
function bukaPosterWordDariGaleri(posterId) {
  try {
    const list = JSON.parse(localStorage.getItem('kreator_cilik_word_posters') || '[]');
    const target = list.find(p => p.id === posterId);
    if (target && target.docData) {
      terapkanDokumenWord(target.docData);
      switchTab('msword');
      showToast(`Poster "${target.title}" dibuka kembali di Ms. Word! Siap diedit 📝`, 'success');
    }
  } catch (e) {
    showToast('Gagal membuka poster dari galeri.', 'error');
  }
}

// Unduh file PNG dari item galeri
async function unduhPosterWordDariGaleri(posterId) {
  try {
    const list = JSON.parse(localStorage.getItem('kreator_cilik_word_posters') || '[]');
    const target = list.find(p => p.id === posterId);
    if (!target) return;

    let imgUrl = target.image;
    // Jika belum ada file PNG atau ukuran data kosong/terlalu kecil, generate ulang
    if (!imgUrl || imgUrl.length < 5000) {
      imgUrl = await generatePosterDataUrl(target.docData);
      if (imgUrl) {
        target.image = imgUrl;
        localStorage.setItem('kreator_cilik_word_posters', JSON.stringify(list));
      }
    }

    if (imgUrl) {
      const link = document.createElement('a');
      link.download = `${target.title || 'Poster-Word'}.png`;
      link.href = imgUrl;
      link.click();
      playSound('success');
      showToast('Poster berhasil diunduh ke komputermu! 🖼️', 'success');
    } else {
      bukaPosterWordDariGaleri(posterId);
      setTimeout(simpanPosterWord, 500);
    }
  } catch (e) {
    showToast('Gagal mengunduh poster.', 'error');
  }
}

// Salin / Copy Dokumen Poster dari Galeri
function salinPosterWordDariGaleri(posterId) {
  playSound('click');
  try {
    let list = JSON.parse(localStorage.getItem('kreator_cilik_word_posters') || '[]');
    const target = list.find(p => p.id === posterId);
    if (!target) return;

    // Bersihkan nama dasar agar tidak bertumpuk
    const cleanBase = target.title
      .replace(/_Salinan_\d+$/i, '')
      .replace(/\s*\(Salinan(\s*\d+)?\)$/i, '')
      .replace(/\s*\(Copy(\s*\d+)?\)$/i, '')
      .trim();

    // Hitung jumlah salinan yang sudah ada
    const existingCopies = list.filter(p => p.title.toLowerCase().includes(cleanBase.toLowerCase()) && (p.title.includes('Salinan') || p.title.includes('Copy'))).length;
    const copySuffix = existingCopies > 0 ? `(Salinan ${existingCopies + 1})` : '(Salinan)';
    const newTitle = `${cleanBase} ${copySuffix}`;

    const clonedElements = (target.docData && Array.isArray(target.docData.elements))
      ? JSON.parse(JSON.stringify(target.docData.elements))
      : getPosterPresetElements('lingkungan');

    // Update teks judul di dalam dokumen jika ada
    const judulEl = clonedElements.find(el => el.type === 'teks' && el.subtype === 'judul');
    if (judulEl) {
      const cleanJudul = judulEl.text.replace(/\s*\(Salinan(\s*\d+)?\)$/i, '').trim();
      judulEl.text = `${cleanJudul} ${copySuffix}`;
    }

    const newPoster = {
      id: 'poster_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      title: newTitle,
      date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
      image: target.image || null,
      elementsCount: clonedElements.length,
      docData: {
        title: newTitle,
        elements: clonedElements,
        pageBgColor: (target.docData && target.docData.pageBgColor) || '#ffffff',
        pageBorderStyle: (target.docData && target.docData.pageBorderStyle) || 'solid'
      }
    };

    list.unshift(newPoster);
    if (list.length > 20) list = list.slice(0, 20);
    localStorage.setItem('kreator_cilik_word_posters', JSON.stringify(list));
    localStorage.setItem('kreator_cilik_word_posters_initialized', 'true');

    renderGaleriPosterWord();
    playSound('success');
    showToast(`Dokumen "${target.title}" berhasil dicopy! 📋 Salinan baru siap diedit.`, 'success');
  } catch (e) {
    console.error('salinPosterWordDariGaleri error:', e);
    showToast('Gagal menyalin dokumen.', 'error');
  }
}

// Variable state untuk konfirmasi hapus poster
let pendingHapusPosterId = null;

// Buka Modal Konfirmasi Hapus Satu Poster Word
function bukaModalHapusPoster(posterId) {
  playSound('click');
  pendingHapusPosterId = posterId;
  let list = [];
  try {
    list = JSON.parse(localStorage.getItem('kreator_cilik_word_posters') || '[]');
  } catch (e) {}
  const target = list.find(p => p.id === posterId);
  const targetTitle = target ? target.title : 'Dokumen Poster';

  const titleEl = document.getElementById('modal-hapus-poster-title');
  if (titleEl) {
    titleEl.textContent = targetTitle;
  }

  const modal = document.getElementById('modal-konfirmasi-hapus-poster');
  if (modal) {
    modal.classList.remove('hidden');
  } else {
    // Fallback jika modal belum ter-render
    if (confirm(`Apakah kamu yakin ingin MENGHAPUS dokumen "${targetTitle}" dari galeri?`)) {
      konfirmasiEksekusiHapusPoster();
    }
  }
}

// Tutup Modal Hapus Satu Poster
function tutupModalHapusPoster() {
  pendingHapusPosterId = null;
  const modal = document.getElementById('modal-konfirmasi-hapus-poster');
  if (modal) modal.classList.add('hidden');
}

// Eksekusi Hapus Satu Poster
function konfirmasiEksekusiHapusPoster() {
  if (!pendingHapusPosterId) return;
  try {
    let list = JSON.parse(localStorage.getItem('kreator_cilik_word_posters') || '[]');
    const target = list.find(p => p.id === pendingHapusPosterId);
    const targetTitle = target ? target.title : 'Dokumen Poster';

    list = list.filter(p => p.id !== pendingHapusPosterId);
    localStorage.setItem('kreator_cilik_word_posters', JSON.stringify(list));
    localStorage.setItem('kreator_cilik_word_posters_initialized', 'true');

    tutupModalHapusPoster();
    renderGaleriPosterWord();
    playSound('success');
    showToast(`Dokumen "${targetTitle}" berhasil dihapus dari galeri! 🗑️`, 'info');
  } catch (e) {
    console.error('konfirmasiEksekusiHapusPoster error:', e);
    tutupModalHapusPoster();
    showToast('Gagal menghapus dokumen poster.', 'error');
  }
}

// Alias fungsi hapus satu poster
function hapusPosterWordDariGaleri(posterId) {
  bukaModalHapusPoster(posterId);
}

// Buka Modal Konfirmasi Hapus Semua Poster
function bukaModalHapusSemuaPoster() {
  playSound('click');
  let list = [];
  try {
    list = JSON.parse(localStorage.getItem('kreator_cilik_word_posters') || '[]');
  } catch (e) {}

  if (list.length === 0) {
    showToast('Galeri poster sudah kosong.', 'info');
    return;
  }

  const modal = document.getElementById('modal-konfirmasi-hapus-semua-poster');
  if (modal) {
    modal.classList.remove('hidden');
  } else {
    if (confirm(`Hapus SELURUH ${list.length} dokumen poster dari galeri?`)) {
      konfirmasiEksekusiHapusSemuaPoster();
    }
  }
}

// Tutup Modal Hapus Semua Poster
function tutupModalHapusSemuaPoster() {
  const modal = document.getElementById('modal-konfirmasi-hapus-semua-poster');
  if (modal) modal.classList.add('hidden');
}

// Eksekusi Hapus Semua Poster
function konfirmasiEksekusiHapusSemuaPoster() {
  try {
    localStorage.setItem('kreator_cilik_word_posters', '[]');
    localStorage.setItem('kreator_cilik_word_posters_initialized', 'true');
    tutupModalHapusSemuaPoster();
    renderGaleriPosterWord();
    playSound('success');
    showToast('Semua dokumen poster berhasil dihapus bersih! 🗑️', 'info');
  } catch (e) {
    console.error('konfirmasiEksekusiHapusSemuaPoster error:', e);
    tutupModalHapusSemuaPoster();
    showToast('Gagal mengosongkan galeri.', 'error');
  }
}

// Alias bersihkan semua poster
function bersihkanSemuaPosterWord() {
  bukaModalHapusSemuaPoster();
}

// Bind ke window untuk memastikan selalu dapat diakses secara global
window.bukaModalHapusPoster = bukaModalHapusPoster;
window.tutupModalHapusPoster = tutupModalHapusPoster;
window.konfirmasiEksekusiHapusPoster = konfirmasiEksekusiHapusPoster;
window.hapusPosterWordDariGaleri = hapusPosterWordDariGaleri;
window.bukaModalHapusSemuaPoster = bukaModalHapusSemuaPoster;
window.tutupModalHapusSemuaPoster = tutupModalHapusSemuaPoster;
window.konfirmasiEksekusiHapusSemuaPoster = konfirmasiEksekusiHapusSemuaPoster;
window.bersihkanSemuaPosterWord = bersihkanSemuaPosterWord;
window.salinPosterWordDariGaleri = salinPosterWordDariGaleri;

// Pasang contoh poster awal langsung ke galeri jika siswa ingin melihat hasil kilat
async function pasangContohPosterGaleri() {
  playSound('success');
  loadPresetPosterLingkungan('indonesia_hebat');
  currentWordDocTitle = 'Poster_7_Kebiasaan_Anak_Indonesia_Hebat';
  setTimeout(async () => {
    const pngDataUrl = await generatePosterDataUrl();
    await simpanPosterKeGaleriWord(pngDataUrl);
    showToast('Contoh Poster 7 Kebiasaan Anak Indonesia Hebat berhasil dipajang di galeri! 🌟', 'success');
  }, 150);
}

// ==========================================
// 12. INITIALIZATION ON DOM READY & TZU CHI HELPERS
// ==========================================
function toggleTeacherMenu() {
  const menu = document.getElementById('teacher-dropdown');
  if (menu) menu.classList.toggle('hidden');
}

function bukaModalSemester2() {
  pilihSemester(2);
}

function tutupModalSemester2() {
  const modal = document.getElementById('modal-semester-2');
  if (modal) modal.classList.add('hidden');
}

// ==========================================
// 14. SISTEM DUA SEMESTER & NAVIGASI DINAMIS
// ==========================================
function pilihSemester(semNumber) {
  let targetSem = parseInt(semNumber) || 1;
  if (targetSem === 2 && !isSemester2Unlocked()) {
    targetSem = 1;
    semNumber = 1;
    playSound('warning');
    showToast('Materi Semester 2 (Coding & AI) dijadwalkan mulai bulan Januari 2027! Saat ini mari fokus menuntaskan materi Semester 1 📘✨', 'warning');
  } else {
    playSound('click');
  }
  state.currentSemester = targetSem;
  semNumber = targetSem;

  const profile = getActiveStudentProfile();
  if (profile) {
    try {
      localStorage.setItem('educode_student_active_sem_v1', String(state.currentSemester));
      sessionStorage.setItem('educode_student_active_sem_v1', String(state.currentSemester));
    } catch (e) {}
  }

  // Elemen Header & Hero
  const btnSem1 = document.getElementById('hero-btn-sem1');
  const btnSem2 = document.getElementById('hero-btn-sem2');
  const pillSem1 = document.getElementById('pill-sem1');
  const pillSem2 = document.getElementById('pill-sem2');
  const heroBadge = document.getElementById('hero-badge');
  const heroTitle = document.getElementById('hero-title');
  const heroDesc = document.getElementById('hero-desc');
  const robotSpeech = document.getElementById('robot-speech');
  const navLabText = document.getElementById('nav-lab-text');
  const navLabIcon = document.getElementById('nav-lab-icon');
  const mNavLabText = document.getElementById('m-nav-lab-text');
  const mNavLabIcon = document.getElementById('m-nav-lab-icon');
  const navExcel = document.getElementById('nav-msexcel');
  const mNavExcel = document.getElementById('m-nav-msexcel');
  const heroBanner = document.getElementById('hero-banner');

  const topSem1 = document.getElementById('btn-main-sem1');
  const topSem2 = document.getElementById('btn-main-sem2');

  if (semNumber === 1) {
    if (topSem1) topSem1.className = 'btn-sem-active-3d px-3.5 py-1.5 rounded-full font-title font-bold text-xs sm:text-sm text-white flex items-center gap-1.5 transition';
    if (topSem2) topSem2.className = 'px-3.5 py-1.5 rounded-full font-title font-bold text-xs sm:text-sm text-slate-300 hover:text-white hover:bg-slate-700/80 flex items-center gap-1.5 transition';
    if (btnSem1) btnSem1.className = 'bg-[#1D4ED8] hover:bg-[#1E40AF] text-white px-7 py-3.5 rounded-full font-title font-bold text-sm sm:text-base flex items-center gap-2.5 shadow-lg shadow-blue-950/30 border border-white/30 transition transform hover:-translate-y-0.5';
    if (btnSem2) btnSem2.className = 'bg-white hover:bg-slate-50 text-[#0284C7] px-7 py-3.5 rounded-full font-title font-bold text-sm sm:text-base flex items-center gap-2.5 shadow-lg transition transform hover:-translate-y-0.5 border border-transparent';
    if (pillSem1) pillSem1.className = 'px-3 py-1 rounded-full text-xs font-bold transition-all bg-blue-600 text-white shadow-xs';
    if (pillSem2) pillSem2.className = 'px-3 py-1 rounded-full text-xs font-bold transition-all text-slate-300 hover:text-white';
    if (heroBadge) heroBadge.innerText = 'EduCode AI • Semester 1';
    if (heroTitle) heroTitle.innerHTML = 'Belajar Coding & AI<br>Bersama, Untuk Masa Depan';
    if (heroDesc) heroDesc.innerText = 'Membangun keterampilan digital, pengolah kata (MS Word), kreativitas, dan karakter baik di era teknologi bersama SDS Cinta Kasih Tzu Chi.';
    if (robotSpeech) robotSpeech.innerText = '🤖 Halo! Aku Robo-Tzu Chi, ayo belajar Konten Digital & MS Word Semester 1!';
    if (navLabText) navLabText.innerText = 'Lab MS Word';
    if (navLabIcon) navLabIcon.className = 'fa-solid fa-file-word text-blue-400 icon-3d-glow';
    if (mNavLabText) mNavLabText.innerText = 'Lab Word';
    if (mNavLabIcon) mNavLabIcon.className = 'fa-solid fa-file-word text-lg text-blue-400';
    
    // Tampilkan tombol Lab MS Excel hanya di Semester 1
    if (navExcel) navExcel.classList.remove('hidden');
    if (mNavExcel) mNavExcel.classList.remove('hidden');

    // Sembunyikan RoboMind di Semester 1 (karena materi Semester 2)
    const navDemo = document.getElementById('nav-demo');
    const mNavDemo = document.getElementById('m-nav-demo');
    if (navDemo) navDemo.classList.add('hidden');
    if (mNavDemo) mNavDemo.classList.add('hidden');

    if (heroBanner) heroBanner.className = 'relative rounded-[32px] overflow-hidden bg-gradient-to-r from-[#0284C7] via-[#0EA5E9] to-[#38BDF8] p-6 sm:p-10 lg:p-12 shadow-2xl shadow-sky-500/25 border border-sky-300/30 text-white transition-all duration-300';

    // Beralih konten
    document.querySelectorAll('.sem1-content').forEach(el => el.classList.remove('hidden'));
    document.querySelectorAll('.sem2-content').forEach(el => el.classList.add('hidden'));

    showToast('Beralih ke Semester 1: Konten Digital, MS Word & MS Excel! 📘📊', 'info');
  } else {
    // Mode Semester 2 Aktif
    if (topSem1) topSem1.className = 'px-3.5 py-1.5 rounded-full font-title font-bold text-xs sm:text-sm text-slate-300 hover:text-white hover:bg-slate-700/80 flex items-center gap-1.5 transition';
    if (topSem2) topSem2.className = 'btn-game-3d px-3.5 py-1.5 rounded-full font-title font-bold text-xs sm:text-sm text-white flex items-center gap-1.5 transition';
    if (btnSem1) btnSem1.className = 'bg-white hover:bg-slate-50 text-purple-700 px-7 py-3.5 rounded-full font-title font-bold text-sm sm:text-base flex items-center gap-2.5 shadow-lg transition transform hover:-translate-y-0.5 border border-transparent';
    if (btnSem2) btnSem2.className = 'bg-[#6D28D9] hover:bg-[#5B21B6] text-white px-7 py-3.5 rounded-full font-title font-bold text-sm sm:text-base flex items-center gap-2.5 shadow-lg shadow-purple-950/30 border border-white/30 transition transform hover:-translate-y-0.5';
    if (pillSem1) pillSem1.className = 'px-3 py-1 rounded-full text-xs font-bold transition-all text-slate-300 hover:text-white';
    if (pillSem2) pillSem2.className = 'px-3 py-1 rounded-full text-xs font-bold transition-all bg-purple-600 text-white shadow-xs';
    if (heroBadge) heroBadge.innerText = 'EduCode AI • Semester 2';
    if (heroTitle) heroTitle.innerHTML = 'Petualangan Coding & AI Cilik<br>Animasi, Game & Robot Pintar';
    if (heroDesc) heroDesc.innerText = 'Mempelajari pemrograman visual (Scratch/Blockly), logika percabangan robot cerdas, dan pengenalan sensor kamera AI bersama SDS Cinta Kasih Tzu Chi.';
    if (robotSpeech) robotSpeech.innerText = '🚀 Semangat Semester 2! Ayo buat blok kode Scratch & kendalikan sensor AI!';
    if (navLabText) navLabText.innerText = 'Lab Coding & AI';
    if (navLabIcon) navLabIcon.className = 'fa-solid fa-robot text-purple-600';
    if (mNavLabText) mNavLabText.innerText = 'Lab Coding';
    if (mNavLabIcon) mNavLabIcon.className = 'fa-solid fa-robot text-lg text-purple-600';

    // Sembunyikan tombol Lab MS Excel di Semester 2 (hanya ada di Semester 1)
    if (navExcel) navExcel.classList.add('hidden');
    if (mNavExcel) mNavExcel.classList.add('hidden');

    // Tampilkan tombol RoboMind di Semester 2!
    const navDemo = document.getElementById('nav-demo');
    const mNavDemo = document.getElementById('m-nav-demo');
    if (navDemo) navDemo.classList.remove('hidden');
    if (mNavDemo) mNavDemo.classList.remove('hidden');

    // Jika siswa sedang di tab MS Excel saat berpindah ke Semester 2, alihkan ke beranda
    if (state.currentTab === 'msexcel') {
      switchTab('beranda');
    }

    if (heroBanner) heroBanner.className = 'relative rounded-[32px] overflow-hidden bg-gradient-to-r from-[#6D28D9] via-[#8B5CF6] to-[#A855F7] p-6 sm:p-10 lg:p-12 shadow-2xl shadow-purple-500/25 border border-purple-300/30 text-white transition-all duration-300';

    // Beralih konten
    document.querySelectorAll('.sem1-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.sem2-content').forEach(el => el.classList.remove('hidden'));

    showToast('Beralih ke Semester 2: Pemrograman Balok, RoboMind & AI Cilik! 🤖✨', 'success');
  }

  // Perbarui indikator tombol semester di kartu sambutan siswa
  updateLabelSemesterSiswa();

  // Muat ulang kuis sesuai semester aktif
  restartQuiz();

  // Inisialisasi simulator coding jika di semester 2
  if (state.codingBlocks.length === 0) {
    muatContohCoding('salam');
  }

  // Inisialisasi simulator RoboMind jika sedang membuka tab demo di Semester 2
  if (semNumber === 2 && state.currentTab === 'demo') {
    setTimeout(initRoboMindSimulator, 50);
  }
}
window.pilihSemester = pilihSemester;

// Sub-Tab Modul Semester 2 (TP 2.5 - 2.8)
function bukaModulDetailSem2(tpKey) {
  playSound('click');
  window.speechSynthesis && window.speechSynthesis.cancel();

  if (state.currentTab !== 'modul') {
    switchTab('modul');
  }

  const allTps = ['tp5', 'tp6', 'tp7', 'tp8'];
  allTps.forEach(tp => {
    const content = document.getElementById(`konten-modul-${tp}`);
    const btn = document.getElementById(`btn-modul-${tp}`);
    if (content && btn) {
      if (tp === tpKey) {
        content.classList.remove('hidden');
        btn.className = 'modul-tab-btn active-modul-tab px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold font-title bg-purple-600 text-white';
      } else {
        content.classList.add('hidden');
        btn.className = 'modul-tab-btn px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold font-title bg-slate-100 text-slate-600 hover:bg-slate-200';
      }
    }
  });

  state.currentModulSem2 = tpKey;
}

// ==========================================
// 15. SIMULATOR LAB CODING & ROBOT AI (SEMESTER 2)
// ==========================================
function tambahBalokCoding(type, label, iconClass, colorClass) {
  playSound('click');
  const newBlock = {
    id: 'block-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    type: type,
    label: label,
    icon: iconClass,
    color: colorClass
  };
  state.codingBlocks.push(newBlock);
  renderBalokCoding();
  showToast(`Balok "${label}" ditambahkan ke kode! 🧩`, 'info');
}

function hapusBalokCoding(idx) {
  playSound('click');
  state.codingBlocks.splice(idx, 1);
  renderBalokCoding();
}

function resetBalokCoding() {
  playSound('click');
  state.codingBlocks = [];
  renderBalokCoding();
  resetPosisiRobot();
  showToast('Lembar kode dikosongkan!', 'info');
}

function muatContohCoding(template) {
  playSound('click');
  resetPosisiRobot();
  if (template === 'salam') {
    state.codingBlocks = [
      { id: 'b1', type: 'event', label: 'Saat Bendera Hijau Diklik', icon: 'fa-flag', color: 'bg-amber-500 text-white' },
      { id: 'b2', type: 'gerak', label: 'Maju 20 Langkah', icon: 'fa-arrow-right', color: 'bg-blue-600 text-white' },
      { id: 'b3', type: 'bicara', label: 'Katakan "Gan En (Terima Kasih)!"', icon: 'fa-comment-dots', color: 'bg-purple-600 text-white' },
      { id: 'b4', type: 'suara', label: 'Bunyikan Nada Ceria', icon: 'fa-music', color: 'bg-pink-600 text-white' }
    ];
  } else if (template === 'sampah') {
    state.codingBlocks = [
      { id: 'b1', type: 'event', label: 'Saat Bendera Hijau Diklik', icon: 'fa-flag', color: 'bg-amber-500 text-white' },
      { id: 'b2', type: 'gerak', label: 'Maju 20 Langkah', icon: 'fa-arrow-right', color: 'bg-blue-600 text-white' },
      { id: 'b3', type: 'sensor', label: 'Sensor AI: Deteksi Sampah Daur Ulang', icon: 'fa-robot', color: 'bg-emerald-600 text-white' },
      { id: 'b4', type: 'bicara', label: 'Katakan "Sampah Berhasil Dipilah! ♻️"', icon: 'fa-comment-dots', color: 'bg-purple-600 text-white' },
      { id: 'b5', type: 'gerak', label: 'Lompat Gembira', icon: 'fa-angles-up', color: 'bg-blue-600 text-white' }
    ];
  } else if (template === 'patroli') {
    state.codingBlocks = [
      { id: 'b1', type: 'event', label: 'Saat Bendera Hijau Diklik', icon: 'fa-flag', color: 'bg-amber-500 text-white' },
      { id: 'b2', type: 'gerak', label: 'Maju 20 Langkah', icon: 'fa-arrow-right', color: 'bg-blue-600 text-white' },
      { id: 'b3', type: 'putar', label: 'Putar Balik 180°', icon: 'fa-rotate-right', color: 'bg-indigo-600 text-white' },
      { id: 'b4', type: 'bicara', label: 'Katakan "Taman Sekolah Bersih & Asri!"', icon: 'fa-comment-dots', color: 'bg-purple-600 text-white' },
      { id: 'b5', type: 'suara', label: 'Bunyikan Nada Ceria', icon: 'fa-music', color: 'bg-pink-600 text-white' }
    ];
  }
  renderBalokCoding();
}

function renderBalokCoding() {
  const container = document.getElementById('coding-workspace-blocks');
  if (!container) return;

  if (state.codingBlocks.length === 0) {
    container.innerHTML = `
      <div class="h-64 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center">
        <i class="fa-solid fa-puzzle-piece text-4xl mb-3 text-slate-300"></i>
        <p class="text-xs font-bold text-slate-500">Belum ada balok kode yang disusun</p>
        <p class="text-[11px] text-slate-400 mt-1">Klik balok perintah di sebelah kiri untuk menambahkannya ke sini!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = '';
  state.codingBlocks.forEach((block, idx) => {
    const blockEl = document.createElement('div');
    blockEl.id = `ui-${block.id}`;
    blockEl.className = `${block.color} px-4 py-2.5 rounded-2xl shadow-sm flex items-center justify-between font-title font-bold text-xs sm:text-sm cursor-pointer select-none transform hover:-translate-y-0.5 transition border border-white/20`;
    blockEl.innerHTML = `
      <div class="flex items-center gap-2.5">
        <span class="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-black">${idx + 1}</span>
        <i class="fa-solid ${block.icon}"></i>
        <span>${block.label}</span>
      </div>
      <button onclick="hapusBalokCoding(${idx})" class="w-6 h-6 rounded-full hover:bg-black/20 flex items-center justify-center transition text-xs" title="Hapus balok">
        <i class="fa-solid fa-xmark"></i>
      </button>
    `;
    container.appendChild(blockEl);
  });
}

function resetPosisiRobot() {
  state.codingRobotX = 0;
  state.codingRobotY = 0;
  state.codingRobotRot = 0;
  const robotEl = document.getElementById('coding-robot-sprite');
  const speechEl = document.getElementById('coding-robot-speech');
  const aiRadar = document.getElementById('coding-ai-radar');
  if (robotEl) {
    robotEl.style.transform = 'translate(0px, 0px) rotate(0deg)';
  }
  if (speechEl) speechEl.classList.add('hidden');
  if (aiRadar) aiRadar.classList.add('hidden');
}

async function jalankanProgramCoding() {
  if (state.isExecutingCode) return;
  if (state.codingBlocks.length === 0) {
    showToast('Susun balok kode terlebih dahulu!', 'info');
    return;
  }

  state.isExecutingCode = true;
  playSound('click');
  resetPosisiRobot();

  const runBtn = document.getElementById('btn-run-coding');
  if (runBtn) {
    runBtn.disabled = true;
    runBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Berjalan...';
  }

  const robotEl = document.getElementById('coding-robot-sprite');
  const speechEl = document.getElementById('coding-robot-speech');
  const speechText = document.getElementById('coding-robot-speech-text');
  const aiRadar = document.getElementById('coding-ai-radar');
  const aiStatusText = document.getElementById('coding-ai-status-text');

  for (let i = 0; i < state.codingBlocks.length; i++) {
    const block = state.codingBlocks[i];
    
    // Highlight balok yang sedang berjalan
    const blockUi = document.getElementById(`ui-${block.id}`);
    if (blockUi) blockUi.classList.add('ring-4', 'ring-yellow-400');

    // Eksekusi aksi sesuai tipe balok
    if (block.type === 'gerak') {
      if (block.label.includes('Maju')) {
        state.codingRobotX += 35;
      } else if (block.label.includes('Mundur')) {
        state.codingRobotX -= 25;
      } else if (block.label.includes('Lompat')) {
        state.codingRobotY -= 30;
      }
      playSound('click');
    } else if (block.type === 'putar') {
      state.codingRobotRot = (state.codingRobotRot + 180) % 360;
      playSound('click');
    } else if (block.type === 'bicara') {
      if (speechEl && speechText) {
        const textToSay = block.label.replace('Katakan ', '').replace(/["']/g, '');
        speechText.innerText = textToSay;
        speechEl.classList.remove('hidden');
      }
      playSound('success');
    } else if (block.type === 'suara') {
      playSound('success');
    } else if (block.type === 'sensor') {
      if (aiRadar && aiStatusText) {
        aiRadar.classList.remove('hidden');
        aiStatusText.innerText = '🔍 AI Mengidentifikasi Objek: Botol Daur Ulang Ditemukan! (Akurasi: 98%)';
      }
      playSound('fanfare');
    }

    if (robotEl) {
      robotEl.style.transform = `translate(${state.codingRobotX}px, ${state.codingRobotY}px) rotate(${state.codingRobotRot}deg)`;
    }

    // Tunggu jeda animasi balok
    await new Promise(r => setTimeout(r, 700));

    // Reset posisi Y jika tadi melompat
    if (block.label.includes('Lompat')) {
      state.codingRobotY = 0;
      if (robotEl) robotEl.style.transform = `translate(${state.codingRobotX}px, 0px) rotate(${state.codingRobotRot}deg)`;
    }

    if (blockUi) blockUi.classList.remove('ring-4', 'ring-yellow-400');
  }

  state.isExecutingCode = false;
  if (runBtn) {
    runBtn.disabled = false;
    runBtn.innerHTML = '<i class="fa-solid fa-play"></i> Jalankan Program';
  }

  tambahPoin(25);
  showToast('Program Coding & AI berhasil dijalankan! Hebat! 🌟🚀', 'success');
}

// Uji Sensor AI (Demo Semester 2)
function ujiSensorAI(tipe) {
  playSound('click');
  const previewImg = document.getElementById('demo-ai-vision-img');
  const resultBox = document.getElementById('demo-ai-vision-result');
  const titleBox = document.getElementById('demo-ai-vision-title');
  const confBox = document.getElementById('demo-ai-vision-conf');
  const recBox = document.getElementById('demo-ai-vision-rec');

  if (!previewImg || !resultBox) return;

  if (tipe === 'botol') {
    previewImg.innerHTML = '<span class="text-6xl">🧴</span>';
    titleBox.innerText = 'Botol Plastik Bekas (Anorganik)';
    confBox.innerText = '98.5%';
    recBox.innerText = 'Kategori: DAUR ULANG. Masukkan ke tong sampah kuning Tzu Chi untuk dijadikan bahan bermanfaat.';
    resultBox.className = 'p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 animate-fadeIn';
  } else if (tipe === 'daun') {
    previewImg.innerHTML = '<span class="text-6xl">🍂</span>';
    titleBox.innerText = 'Daun Kering Gugur (Organik)';
    confBox.innerText = '97.2%';
    recBox.innerText = 'Kategori: KOMPOS. Daun kering dapat diolah menjadi pupuk penyubur tanaman sekolah.';
    resultBox.className = 'p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-emerald-950 animate-fadeIn';
  } else if (tipe === 'kertas') {
    previewImg.innerHTML = '<span class="text-6xl">📄</span>';
    titleBox.innerText = 'Kertas Lembar Belajar (Daur Ulang)';
    confBox.innerText = '99.1%';
    recBox.innerText = 'Kategori: KERTAS DAUR ULANG. Pilah secara rapi agar bisa diolah menjadi kertas daur ulang baru.';
    resultBox.className = 'p-4 rounded-2xl bg-blue-50 border-2 border-blue-300 text-blue-950 animate-fadeIn';
  }

  playSound('success');
  tambahPoin(10);
  showToast('Sensor Kamera AI memindai objek dengan sukses! 👁️✨', 'success');
}

function selesaikanMisiCoding(misiNo) {
  playSound('fanfare');
  tambahPoin(30);
  showToast(`Misi ${misiNo} Selesai! Kamu mendapatkan 30 Bintang! 🏅🎉`, 'success');
}

// Sub-Tab Misi Studio Praktik Semester 2
let stateMisi2Benda = 'botol';
let isRunningMisi1 = false;
let isRunningMisi3 = false;

function setMisiPraktikSubtab(misiId) {
  playSound('click');
  const allMisis = ['misi-tp5', 'misi-tp6', 'misi-tp7', 'misi-tp8'];
  allMisis.forEach(m => {
    const el = document.getElementById(m);
    const btn = document.getElementById(`btn-${m}`);
    if (el && btn) {
      if (m === misiId) {
        el.classList.remove('hidden');
        btn.className = 'misi-sub-btn active-misi-sub px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-purple-600 text-white';
      } else {
        el.classList.add('hidden');
        btn.className = 'misi-sub-btn px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-slate-100 text-slate-600 hover:bg-slate-200';
      }
    }
  });
}

// MISI 1: Jalankan Algoritma Runtutan Langkah
async function ujiAlgoritmaMisi1() {
  if (isRunningMisi1) return;
  isRunningMisi1 = true;
  playSound('click');

  const statusEl = document.getElementById('grid-mission-status');
  const btnRun = document.getElementById('btn-run-misi1');
  const c1 = document.getElementById('grid-cell-1');
  const c2 = document.getElementById('grid-cell-2');
  const c3 = document.getElementById('grid-cell-3');
  const c5 = document.getElementById('grid-cell-5');
  const c6 = document.getElementById('grid-cell-6');
  const targetItem = document.getElementById('grid-target-item');

  if (btnRun) btnRun.disabled = true;

  // Step 1: Di Awal
  if (statusEl) statusEl.innerText = 'Langkah 1: Robot bersiap di posisi awal (Mulai)...';
  playSound('robot');
  await new Promise(r => setTimeout(r, 700));

  // Step 2: Maju ke cell 2
  if (statusEl) statusEl.innerText = 'Langkah 2: Maju 1 langkah ke depan...';
  if (c1) c1.classList.remove('bg-purple-900/60');
  if (c2) { c2.classList.add('bg-purple-600', 'text-white'); c2.innerHTML = '🤖'; }
  playSound('step');
  await new Promise(r => setTimeout(r, 700));

  // Step 3: Maju ke cell 3 (Botol)
  if (statusEl) statusEl.innerText = 'Langkah 3: Tiba di lokasi botol plastik bekas...';
  if (c2) { c2.classList.remove('bg-purple-600', 'text-white'); c2.innerHTML = '<i class="fa-solid fa-shoe-prints rotate-90"></i>'; }
  if (c3) { c3.classList.add('bg-purple-600'); }
  playSound('step');
  await new Promise(r => setTimeout(r, 700));

  // Step 4: Ambil botol
  if (statusEl) statusEl.innerText = 'Langkah 4: Robot memungut botol sampah plastik! 🧴';
  if (targetItem) targetItem.style.opacity = '0';
  playSound('success');
  await new Promise(r => setTimeout(r, 700));

  // Step 5: Belok ke cell 5
  if (statusEl) statusEl.innerText = 'Langkah 5: Berbelok menuju tempat daur ulang Tzu Chi...';
  if (c3) c3.classList.remove('bg-purple-600');
  if (c5) { c5.classList.add('bg-purple-600', 'text-white'); c5.innerHTML = '🤖'; }
  playSound('step');
  await new Promise(r => setTimeout(r, 700));

  // Step 6: Tiba di tong Tzu Chi
  if (c5) { c5.classList.remove('bg-purple-600', 'text-white'); c5.innerHTML = '<i class="fa-solid fa-arrow-turn-down rotate-90"></i>'; }
  if (c6) { c6.classList.add('ring-4', 'ring-emerald-400'); }
  if (statusEl) statusEl.innerHTML = '🎉 <b class="text-emerald-400">BERHASIL!</b> Botol dimasukkan ke Tong Daur Ulang Tzu Chi!';
  
  playSound('fanfare');
  tambahPoin(30);
  showToast('Misi 1 Selesai! Algoritma runtutan berhasil sempurna! 🌟 +30 Bintang', 'success');

  isRunningMisi1 = false;
  if (btnRun) btnRun.disabled = false;
}

function resetMisi1() {
  playSound('click');
  const statusEl = document.getElementById('grid-mission-status');
  const c1 = document.getElementById('grid-cell-1');
  const c2 = document.getElementById('grid-cell-2');
  const c3 = document.getElementById('grid-cell-3');
  const c5 = document.getElementById('grid-cell-5');
  const c6 = document.getElementById('grid-cell-6');
  const targetItem = document.getElementById('grid-target-item');

  if (statusEl) statusEl.innerText = 'Status: Menunggu eksekusi algoritma';
  if (c1) { c1.className = 'rounded-xl bg-purple-900/60 border border-purple-500 flex flex-col items-center justify-center text-2xl transition duration-300'; }
  if (c2) { c2.className = 'rounded-xl bg-slate-700/50 border border-slate-600 flex items-center justify-center text-xs text-slate-400'; c2.innerHTML = '<i class="fa-solid fa-shoe-prints rotate-90"></i>'; }
  if (c3) { c3.className = 'rounded-xl bg-amber-950/40 border border-amber-600 flex flex-col items-center justify-center text-2xl'; }
  if (c5) { c5.className = 'rounded-xl bg-slate-700/50 border border-slate-600 flex items-center justify-center text-xs text-slate-400'; c5.innerHTML = '<i class="fa-solid fa-arrow-turn-down rotate-90"></i>'; }
  if (c6) { c6.className = 'rounded-xl bg-emerald-950/40 border border-emerald-500 flex flex-col items-center justify-center text-2xl'; }
  if (targetItem) targetItem.style.opacity = '1';
}

// MISI 2: Pemilihan & Logika If-Else AI
function pilihBendaMisi2(benda) {
  playSound('click');
  stateMisi2Benda = benda;
  const list = ['botol', 'kertas', 'daun'];
  list.forEach(b => {
    const btn = document.getElementById(`btn-obj-${b}`);
    if (btn) {
      if (b === benda) {
        btn.className = 'p-3 bg-white border-2 border-purple-500 ring-2 ring-purple-200 rounded-2xl text-center shadow-xs';
      } else {
        btn.className = 'p-3 bg-white border-2 border-slate-200 rounded-2xl text-center shadow-xs hover:border-slate-300';
      }
    }
  });
}

function ujiLogikaMisi2() {
  playSound('click');
  const displayBox = document.getElementById('misi2-display-box');
  const title = document.getElementById('misi2-decision-title');
  const desc = document.getElementById('misi2-decision-desc');
  const icon = document.getElementById('misi2-robot-icon');

  if (!displayBox || !title || !desc) return;

  if (stateMisi2Benda === 'botol') {
    displayBox.className = 'p-8 rounded-3xl bg-amber-50 border-2 border-amber-400 text-center space-y-3 animate-fadeIn';
    if (icon) icon.innerHTML = '🧴';
    title.innerText = 'KEPUTUSAN: Wadah Sampah Daur Ulang ♻️';
    desc.innerText = 'Logika JIKA (Botol) terpenuhi! Botol plastik dipisahkan agar dapat diolah menjadi selimut atau baju daur ulang Tzu Chi.';
  } else if (stateMisi2Benda === 'kertas') {
    displayBox.className = 'p-8 rounded-3xl bg-blue-50 border-2 border-blue-400 text-center space-y-3 animate-fadeIn';
    if (icon) icon.innerHTML = '📄';
    title.innerText = 'KEPUTUSAN: Wadah Kertas Daur Ulang 📦';
    desc.innerText = 'Logika JIKA (Kertas) terpenuhi! Kertas bekas disusun rapi untuk didaur ulang menjadi kertas baru, menghemat penebangan pohon.';
  } else if (stateMisi2Benda === 'daun') {
    displayBox.className = 'p-8 rounded-3xl bg-emerald-50 border-2 border-emerald-400 text-center space-y-3 animate-fadeIn';
    if (icon) icon.innerHTML = '🍂';
    title.innerText = 'KEPUTUSAN: Wadah Kompos Alami 🌱';
    desc.innerText = 'Logika JIKA LAINNYA (Daun) terpenuhi! Sampah organik daun kering dibawa ke lubang biopori/kompos untuk menyuburkan tanah.';
  }

  playSound('fanfare');
  tambahPoin(30);
  showToast('Misi 2 Selesai! Logika percabangan robot berjalan akurat! 🤖✨ +30 Bintang', 'success');
}

// MISI 3: Loop Perulangan (Menanam 4 Pohon)
async function jalankanLoopMisi3() {
  if (isRunningMisi3) return;
  isRunningMisi3 = true;
  playSound('click');

  const counterEl = document.getElementById('misi3-counter');
  const statusEl = document.getElementById('misi3-status-text');
  const btnRun = document.getElementById('btn-run-misi3');
  if (btnRun) btnRun.disabled = true;

  for (let i = 1; i <= 4; i++) {
    const slot = document.getElementById(`tree-slot-${i}`);
    if (statusEl) statusEl.innerText = `Mengulang putaran ke-${i} dari 4: Robot menanam tunas pohon di Titik ${i}...`;
    playSound('step');
    await new Promise(r => setTimeout(r, 600));

    if (slot) {
      slot.className = 'h-24 bg-white/90 border-2 border-emerald-500 rounded-2xl flex flex-col items-center justify-center text-emerald-800 text-xs font-bold shadow-md transform scale-105 transition';
      slot.innerHTML = '<span class="text-3xl animate-bounce">🌳</span><span class="text-[10px] text-emerald-700">Pohon ' + i + ' Subur!</span>';
    }
    if (counterEl) counterEl.innerText = `${i}/4`;
    playSound('success');
    await new Promise(r => setTimeout(r, 500));
  }

  if (statusEl) statusEl.innerHTML = '🎉 <b class="text-emerald-700">Luar Biasa!</b> Seluruh 4 pohon berhasil ditanam otomatis dengan 1 balok loop!';
  playSound('fanfare');
  tambahPoin(30);
  showToast('Misi 3 Selesai! Balok perulangan (Loop) berhasil menanam 4 pohon! 🌳 +30 Bintang', 'success');

  isRunningMisi3 = false;
  if (btnRun) btnRun.disabled = false;
}

function resetMisi3() {
  playSound('click');
  const counterEl = document.getElementById('misi3-counter');
  const statusEl = document.getElementById('misi3-status-text');
  if (counterEl) counterEl.innerText = '0/4';
  if (statusEl) statusEl.innerText = 'Tekan tombol di sebelah kanan untuk menjalankan loop perulangan!';

  for (let i = 1; i <= 4; i++) {
    const slot = document.getElementById(`tree-slot-${i}`);
    if (slot) {
      slot.className = 'h-24 bg-white/60 border-2 border-dashed border-emerald-600 rounded-2xl flex flex-col items-center justify-center text-slate-400 text-xs font-bold transition';
      slot.innerHTML = '<span class="text-2xl opacity-40">🌱</span><span class="text-[10px]">Titik ' + i + '</span>';
    }
  }
}

// MISI 4: Robot Budi Pekerti & Kata Ren Si
function suarakanKataBijakMisi4(teks) {
  playSound('click');
  const speechText = document.getElementById('misi4-speech-text');
  const glow = document.getElementById('misi4-glow');

  if (speechText) speechText.innerText = `"${teks}"`;
  if (glow) {
    glow.className = 'w-24 h-24 mx-auto rounded-full bg-yellow-400/50 border-4 border-yellow-200 flex items-center justify-center text-5xl transition duration-500 scale-125 ring-8 ring-yellow-400/30';
  }

  bacaTeks(teks);

  setTimeout(() => {
    if (glow) glow.className = 'w-24 h-24 mx-auto rounded-full bg-yellow-400/20 border-4 border-yellow-300 flex items-center justify-center text-5xl transition duration-500';
  }, 4000);

  tambahPoin(30);
  showToast('Misi 4: Robot menyebarkan pesan budi pekerti Tzu Chi! 🌸🙏 +30 Bintang', 'success');
}

window.addEventListener('click', (e) => {
  const dropdown = document.getElementById('teacher-dropdown');
  if (dropdown && !e.target.closest('button[onclick="toggleTeacherMenu()"]') && !e.target.closest('#teacher-dropdown')) {
    dropdown.classList.add('hidden');
  }

  const popover = document.getElementById('popover-highlight-colors');
  if (popover && !e.target.closest('#popover-highlight-colors') && !e.target.closest('button[onclick="bukaHighlightPicker(event)"]')) {
    popover.classList.add('hidden');
  }
});

// ==========================================
// 15. LABORATORIUM SIMULATOR MICROSOFT EXCEL CILIK
// ==========================================
let excelState = {
  activeCell: 'B2',
  activeTemplate: 'checklist_karakter',
  autoSave: true,
  chartType: 'bar',
  viewMode: 'full', // 'full' (lembar dokumen excel penuh) atau 'split' (dengan diagram batang)
  clipboardVal: '',
  clipboardCells: [],
  history: [],
  historyIndex: -1,
  cols: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W'],
  rowCount: 25,
  colWidths: { 'A': 48, 'B': 220 }, // Lebar kustom kolom dalam piksel
  rowHeights: {}, // Tinggi kustom baris dalam piksel
  cells: {},
  formats: {},
  isEditing: false,
  savedValBeforeEdit: null,
  cursorAtEnd: true,
  // State untuk formula point & drag range selection (blok sel)
  isMouseDown: false,
  formulaSelecting: false,
  formulaSelectAnchor: null,
  formulaSelectCurrent: null,
  formulaPrefix: '',
  normalSelecting: false,
  rangeSelectAnchor: null,
  rangeSelectCurrent: null,
  // State Autofill (drag kotak hijau di pojok sel)
  isAutofilling: false,
  autofillAnchor: null,
  autofillCurrent: null,
  // State Resize Kolom & Baris
  isResizingCol: false,
  resizeColLetter: null,
  resizeColStartX: 0,
  resizeColStartWidth: 0,
  isResizingRow: false,
  resizeRowNumber: null,
  resizeRowStartY: 0,
  resizeRowStartHeight: 0
};

// 4 Template Pembelajaran Karakter & Data Kelas 4
const EXCEL_TEMPLATES = {
  checklist_karakter: {
    sheetTitle: 'Sheet1 - 7 Kebiasaan Anak Hebat',
    fileName: 'BukuKerja_7Kebiasaan_Kelas4.xlsx',
    chartLabelCol: 'B',
    chartValCol: 'I',
    chartTitle: 'Ketercapaian 7 Kebiasaan Anak Hebat (Hari)',
    maxVal: 6,
    rowCount: 9,
    cells: {
      'A1': 'No', 'B1': '7 Kebiasaan Anak Indonesia Hebat', 'C1': 'Senin', 'D1': 'Selasa', 'E1': 'Rabu', 'F1': 'Kamis', 'G1': 'Jumat', 'H1': 'Sabtu', 'I1': 'Ketercapaian',
      'A2': '1', 'B2': '1. Bangun Pagi Mandiri', 'C2': '1', 'D2': '1', 'E2': '1', 'F2': '1', 'G2': '1', 'H2': '1', 'I2': '=SUM(C2:H2)',
      'A3': '2', 'B3': '2. Taat Beribadah', 'C3': '1', 'D3': '1', 'E3': '1', 'F3': '1', 'G3': '1', 'H3': '1', 'I3': '=SUM(C3:H3)',
      'A4': '3', 'B4': '3. Rajin Berolahraga', 'C4': '1', 'D4': '0', 'E4': '1', 'F4': '1', 'G4': '1', 'H4': '1', 'I4': '=SUM(C4:H4)',
      'A5': '4', 'B5': '4. Makan Makanan Sehat & Bergizi', 'C5': '1', 'D5': '1', 'E5': '1', 'F5': '1', 'G5': '1', 'H5': '1', 'I5': '=SUM(C5:H5)',
      'A6': '5', 'B6': '5. Gemar Membaca & Belajar', 'C6': '1', 'D6': '1', 'E6': '1', 'F6': '1', 'G6': '1', 'H6': '0', 'I6': '=SUM(C6:H6)',
      'A7': '6', 'B7': '6. Bermasyarakat & Peduli Sesama', 'C7': '1', 'D7': '1', 'E7': '1', 'F7': '1', 'G7': '1', 'H7': '1', 'I7': '=SUM(C7:H7)',
      'A8': '7', 'B8': '7. Tidur Tepat Waktu (Disiplin)', 'C8': '1', 'D8': '1', 'E8': '1', 'F8': '0', 'G8': '1', 'H8': '1', 'I8': '=SUM(C8:H8)',
      'A9': '', 'B9': 'TOTAL KETERCAPAIAN KELAS', 'C9': '=SUM(C2:C8)', 'D9': '=SUM(D2:D8)', 'E9': '=SUM(E2:E8)', 'F9': '=SUM(F2:F8)', 'G9': '=SUM(G2:G8)', 'H9': '=SUM(H2:H8)', 'I9': '=SUM(I2:I8)'
    },
    formats: {
      'A1': { bold: true, align: 'center', bg: '#d1fae5' },
      'B1': { bold: true, align: 'left', bg: '#d1fae5' },
      'C1': { bold: true, align: 'center', bg: '#d1fae5' },
      'D1': { bold: true, align: 'center', bg: '#d1fae5' },
      'E1': { bold: true, align: 'center', bg: '#d1fae5' },
      'F1': { bold: true, align: 'center', bg: '#d1fae5' },
      'G1': { bold: true, align: 'center', bg: '#d1fae5' },
      'H1': { bold: true, align: 'center', bg: '#d1fae5' },
      'I1': { bold: true, align: 'center', bg: '#a7f3d0' },
      'A9': { bold: true, bg: '#fef3c7' },
      'B9': { bold: true, bg: '#fef3c7' },
      'C9': { bold: true, align: 'center', bg: '#fef3c7' },
      'D9': { bold: true, align: 'center', bg: '#fef3c7' },
      'E9': { bold: true, align: 'center', bg: '#fef3c7' },
      'F9': { bold: true, align: 'center', bg: '#fef3c7' },
      'G9': { bold: true, align: 'center', bg: '#fef3c7' },
      'H9': { bold: true, align: 'center', bg: '#fef3c7' },
      'I9': { bold: true, align: 'center', bg: '#fde68a' }
    }
  },
  tabungan: {
    sheetTitle: 'Sheet1 - Kas & Tabungan Siswa',
    fileName: 'BukuKas_Tabungan_Kelas4.xlsx',
    chartLabelCol: 'C',
    chartValCol: 'F',
    chartTitle: 'Sisa Tabungan Harian Siswa (Rp)',
    maxVal: 20000,
    rowCount: 7,
    cells: {
      'A1': 'No', 'B1': 'Catatan Keuangan Siswa', 'C1': 'Hari / Tanggal', 'D1': 'Uang Masuk (Saku)', 'E1': 'Uang Jajan', 'F1': 'Tabungan Sisa',
      'A2': '1', 'B2': 'Bekal Hari Senin', 'C2': 'Senin', 'D2': '15000', 'E2': '5000', 'F2': '=D2-E2',
      'A3': '2', 'B3': 'Bekal Hari Selasa', 'C3': 'Selasa', 'D3': '15000', 'E3': '7000', 'F3': '=D3-E3',
      'A4': '3', 'B4': 'Bekal Hari Rabu', 'C4': 'Rabu', 'D4': '15000', 'E4': '5000', 'F4': '=D4-E4',
      'A5': '4', 'B5': 'Bekal Hari Kamis', 'C5': 'Kamis', 'D5': '15000', 'E5': '6000', 'F5': '=D5-E5',
      'A6': '5', 'B6': 'Bekal Hari Jumat', 'C6': 'Jumat', 'D6': '15000', 'E6': '4000', 'F6': '=D6-E6',
      'A7': '', 'B7': 'TOTAL TABUNGAN MINGGU INI', 'C7': '5 Hari', 'D7': '=SUM(D2:D6)', 'E7': '=SUM(E2:E6)', 'F7': '=SUM(F2:F6)'
    },
    formats: {
      'A1': { bold: true, align: 'center', bg: '#dbeafe' },
      'B1': { bold: true, align: 'left', bg: '#dbeafe' },
      'C1': { bold: true, align: 'center', bg: '#dbeafe' },
      'D1': { bold: true, align: 'right', bg: '#dbeafe' },
      'E1': { bold: true, align: 'right', bg: '#dbeafe' },
      'F1': { bold: true, align: 'right', bg: '#bfdbfe' },
      'D2': { numFormat: 'rupiah', align: 'right' }, 'E2': { numFormat: 'rupiah', align: 'right' }, 'F2': { numFormat: 'rupiah', align: 'right', bold: true },
      'D3': { numFormat: 'rupiah', align: 'right' }, 'E3': { numFormat: 'rupiah', align: 'right' }, 'F3': { numFormat: 'rupiah', align: 'right', bold: true },
      'D4': { numFormat: 'rupiah', align: 'right' }, 'E4': { numFormat: 'rupiah', align: 'right' }, 'F4': { numFormat: 'rupiah', align: 'right', bold: true },
      'D5': { numFormat: 'rupiah', align: 'right' }, 'E5': { numFormat: 'rupiah', align: 'right' }, 'F5': { numFormat: 'rupiah', align: 'right', bold: true },
      'D6': { numFormat: 'rupiah', align: 'right' }, 'E6': { numFormat: 'rupiah', align: 'right' }, 'F6': { numFormat: 'rupiah', align: 'right', bold: true },
      'A7': { bold: true, bg: '#fef3c7' },
      'B7': { bold: true, bg: '#fef3c7' },
      'C7': { bold: true, align: 'center', bg: '#fef3c7' },
      'D7': { numFormat: 'rupiah', bold: true, align: 'right', bg: '#fef3c7' },
      'E7': { numFormat: 'rupiah', bold: true, align: 'right', bg: '#fef3c7' },
      'F7': { numFormat: 'rupiah', bold: true, align: 'right', bg: '#fde68a' }
    }
  },
  nilai_siswa: {
    sheetTitle: 'Sheet1 - Daftar Nilai Siswa',
    fileName: 'DaftarNilai_Kelas4.xlsx',
    chartLabelCol: 'B',
    chartValCol: 'F',
    chartTitle: 'Rata-rata Nilai Pelajaran Kelas 4',
    maxVal: 100,
    rowCount: 7,
    cells: {
      'A1': 'No', 'B1': 'Mata Pelajaran', 'C1': 'Tugas 1', 'D1': 'Tugas 2', 'E1': 'Ulangan', 'F1': 'Rata-rata', 'G1': 'Tertinggi',
      'A2': '1', 'B2': 'Informatika (TIK)', 'C2': '90', 'D2': '95', 'E2': '92', 'F2': '=AVERAGE(C2:E2)', 'G2': '=MAX(C2:E2)',
      'A3': '2', 'B3': 'Matematika', 'C3': '85', 'D3': '88', 'E3': '90', 'F3': '=AVERAGE(C3:E3)', 'G3': '=MAX(C3:E3)',
      'A4': '3', 'B4': 'Ilmu Pengetahuan Alam', 'C4': '88', 'D4': '92', 'E4': '86', 'F4': '=AVERAGE(C4:E4)', 'G4': '=MAX(C4:E4)',
      'A5': '4', 'B5': 'Bahasa Indonesia', 'C5': '92', 'D5': '90', 'E5': '94', 'F5': '=AVERAGE(C5:E5)', 'G5': '=MAX(C5:E5)',
      'A6': '5', 'B6': 'Budi Pekerti Tzu Chi', 'C6': '95', 'D6': '98', 'E6': '96', 'F6': '=AVERAGE(C6:E6)', 'G6': '=MAX(C6:E6)',
      'A7': '', 'B7': 'RATA-RATA SEMUA MAPEL', 'C7': '=AVERAGE(C2:C6)', 'D7': '=AVERAGE(D2:D6)', 'E7': '=AVERAGE(E2:E6)', 'F7': '=AVERAGE(F2:F6)', 'G7': '=MAX(G2:G6)'
    },
    formats: {
      'A1': { bold: true, align: 'center', bg: '#ede9fe' },
      'B1': { bold: true, align: 'left', bg: '#ede9fe' },
      'C1': { bold: true, align: 'center', bg: '#ede9fe' },
      'D1': { bold: true, align: 'center', bg: '#ede9fe' },
      'E1': { bold: true, align: 'center', bg: '#ede9fe' },
      'F1': { bold: true, align: 'center', bg: '#ddd6fe' },
      'G1': { bold: true, align: 'center', bg: '#ede9fe' },
      'A7': { bold: true, bg: '#fef3c7' },
      'B7': { bold: true, bg: '#fef3c7' },
      'C7': { bold: true, align: 'center', bg: '#fef3c7' },
      'D7': { bold: true, align: 'center', bg: '#fef3c7' },
      'E7': { bold: true, align: 'center', bg: '#fef3c7' },
      'F7': { bold: true, align: 'center', bg: '#fde68a' },
      'G7': { bold: true, align: 'center', bg: '#fef3c7' }
    }
  },
  daur_ulang: {
    sheetTitle: 'Sheet1 - Bank Sampah Tzu Chi',
    fileName: 'BankSampah_TzuChi_Kelas4.xlsx',
    chartLabelCol: 'B',
    chartValCol: 'E',
    chartTitle: 'Hasil Donasi Kas Daur Ulang (Rp)',
    maxVal: 60000,
    rowCount: 6,
    cells: {
      'A1': 'No', 'B1': 'Jenis Sampah Daur Ulang', 'C1': 'Berat (Kg)', 'D1': 'Harga/Kg (Rp)', 'E1': 'Total Dana Donasi',
      'A2': '1', 'B2': 'Kardus Bekas Sekolah', 'C2': '12', 'D2': '2500', 'E2': '=C2*D2',
      'A3': '2', 'B3': 'Botol Plastik PET Bersih', 'C3': '8', 'D3': '4000', 'E3': '=C3*D3',
      'A4': '3', 'B4': 'Kertas HVS Bekas Latihan', 'C4': '15', 'D4': '2000', 'E4': '=C4*D4',
      'A5': '4', 'B5': 'Kaleng Minuman Bekas', 'C5': '5', 'D5': '12000', 'E5': '=C5*D5',
      'A6': '', 'B6': 'TOTAL DANA DAUR ULANG', 'C6': '=SUM(C2:C5)', 'D6': '-', 'E6': '=SUM(E2:E5)'
    },
    formats: {
      'A1': { bold: true, align: 'center', bg: '#d1fae5' },
      'B1': { bold: true, align: 'left', bg: '#d1fae5' },
      'C1': { bold: true, align: 'center', bg: '#d1fae5' },
      'D1': { bold: true, align: 'right', bg: '#d1fae5' },
      'E1': { bold: true, align: 'right', bg: '#a7f3d0' },
      'D2': { numFormat: 'rupiah', align: 'right' }, 'E2': { numFormat: 'rupiah', align: 'right', bold: true },
      'D3': { numFormat: 'rupiah', align: 'right' }, 'E3': { numFormat: 'rupiah', align: 'right', bold: true },
      'D4': { numFormat: 'rupiah', align: 'right' }, 'E4': { numFormat: 'rupiah', align: 'right', bold: true },
      'D5': { numFormat: 'rupiah', align: 'right' }, 'E5': { numFormat: 'rupiah', align: 'right', bold: true },
      'A6': { bold: true, bg: '#fef3c7' },
      'B6': { bold: true, bg: '#fef3c7' },
      'C6': { bold: true, align: 'center', bg: '#fef3c7' },
      'D6': { bold: true, align: 'center', bg: '#fef3c7' },
      'E6': { numFormat: 'rupiah', bold: true, align: 'right', bg: '#fde68a' }
    }
  }
};

// ==========================================
// KURIKULUM ELEMEN 1: PENGOLAHAN DATA & ANALISIS MASALAH
// TP 1.1 - TP 1.4
// ==========================================
let currentTPExcel = 'tp1_1';

const TP_EXCEL_DATA = {
  tp1_1: {
    code: 'TP 1.1',
    title: 'Mengenali Antarmuka Dasar Microsoft Excel & Masalah Pencatatan Data',
    desc: 'Peserta didik dapat mengenali antarmuka dasar Microsoft Excel (cell, row, column) dan mengidentifikasi masalah pencatatan data sederhana dalam kehidupan sehari-hari.',
    badgeColor: 'bg-emerald-600',
    anatomy: [
      { name: 'Menyeleksi Sel (+)', desc: 'Kotak pertemuan kolom & baris (Cell). Pointer mouse berbentuk plus putih tebal untuk memilih & memblok sel.', action: "pilihSelExcel('B2')" },
      { name: 'Melebarkan Kolom (↔)', desc: 'Tarik garis batas di kanan header kolom (A, B, C...) untuk melebarkan/menyempitkan kolom!', action: "autoFitColWidth('B')" },
      { name: 'Meninggikan Baris (↕)', desc: 'Tarik garis batas di bawah nomor baris (1, 2, 3...) untuk meninggikan/memendekkan baris!', action: "sorotBarisExcel(2)" },
      { name: 'Autofill Data (+)', desc: 'Tarik kotak hijau kecil di pojok kanan bawah sel untuk mengisi data berurutan secara otomatis!', action: "pilihSelExcel('C1')" }
    ],
    masalahNyata: '<b>⚠️ Masalah Pencatatan Manual di Kertas:</b> Catatan uang kas kelas atau tabungan di buku tulis mudah robek, basah, tercecer, dan rawan salah saat menghitung manual. Dengan Microsoft Excel, data tersimpan aman dan terstruktur rapi!',
    contohKasus: 'Mencatat jadwal 7 kebiasaan atau buku kas uang saku siswa secara digital.'
  },
  tp1_2: {
    code: 'TP 1.2',
    title: 'Memasukkan, Mengelompokkan, dan Merapikan Format Data Secara Sistematis',
    desc: 'Peserta didik dapat memasukkan, mengelompokkan, dan merapikan format data secara sistematis di Microsoft Excel.',
    badgeColor: 'bg-blue-600',
    anatomy: [
      { name: 'Input Teks & Angka', desc: 'Ketik langsung ke sel: teks untuk label nama, angka untuk jumlah atau harga.', action: "muatTemplateExcel('checklist_karakter')" },
      { name: 'Warna Sel (Fill Color)', desc: 'Beri warna pastel (hijau/kuning) pada baris judul untuk mengelompokkan data.', action: "beriWarnaLatarSelExcel('#d1fae5')" },
      { name: 'Bingkai Kotak (All Borders)', desc: 'Beri garis tepi kotak pada tabel agar mudah dibaca dan rapi saat dicetak.', action: "formatExcelSel('border-all')" },
      { name: 'Format Uang Rupiah (Rp)', desc: 'Ubah angka biasa (15000) menjadi format mata uang resmi (Rp 15.000).', action: "formatAngkaExcel('rupiah')" }
    ],
    masalahNyata: '<b>Mengapa Format Data Harus Rapi?</b> Data tanpa border dan warna membingungkan mata pembaca. Dengan pengelompokan warna dan garis pembatas, siapa pun bisa membaca tabelmu dengan mudah!',
    contohKasus: 'Merapikan tabel buku tabungan siswa lengkap dengan judul hijau, garis tepi, dan simbol Rp.'
  },
  tp1_3: {
    code: 'TP 1.3',
    title: 'Menganalisis Data Sederhana Menggunakan Fungsi Dasar (SUM, AVERAGE, COUNT)',
    desc: 'Peserta didik dapat menganalisis data sederhana menggunakan fungsi dasar (SUM, AVERAGE, COUNT) untuk menyelesaikan masalah sehari-hari.',
    badgeColor: 'bg-amber-500',
    anatomy: [
      { name: 'Fungsi =SUM(Rentang)', desc: 'Menjumlahkan semua angka dalam rentang sel, contoh: =SUM(C2:H2).', action: "masukkanAutoSumExcel('SUM')" },
      { name: 'Fungsi =AVERAGE(Rentang)', desc: 'Mencari nilai rata-rata ulangan atau rata-rata uang saku harian.', action: "masukkanAutoSumExcel('AVERAGE')" },
      { name: 'Fungsi =COUNT(Rentang)', desc: 'Menghitung berapa banyak sel yang berisi angka di dalam tabel.', action: "masukkanAutoSumExcel('COUNT')" },
      { name: 'Aturan Tanda Sama Dengan (=)', desc: 'Semua rumus komputasional wajib diawali tanda = agar Excel menghitung otomatis!', action: "fokusFormulaBarExcel()" }
    ],
    masalahNyata: '<b>Memecahkan Masalah Hitungan Sehari-hari:</b> Guru ingin tahu rata-rata nilai kelas, siswa ingin tahu total tabungan seminggu, dan relawan ingin tahu berat total daur ulang. Semua selesai dalam 1 detik dengan =SUM, =AVERAGE, dan =COUNT!',
    contohKasus: 'Menghitung total ketercapaian 7 Kebiasaan Anak Hebat dan rata-rata nilai siswa kelas 4.'
  },
  tp1_4: {
    code: 'TP 1.4',
    title: 'Menyajikan Data Hasil Analisis dalam Bentuk Grafik/Diagram Batang Sederhana',
    desc: 'Peserta didik dapat menyajikan data hasil analisis dalam bentuk grafik/diagram batang sederhana di Microsoft Excel.',
    badgeColor: 'bg-purple-600',
    anatomy: [
      { name: 'Diagram Batang Visual', desc: 'Mengubah deretan angka rumit menjadi grafik batang berwarna yang komunikatif.', action: "aktifkanExcelChart('bar')" },
      { name: 'Live Update Interaktif', desc: 'Ketika angka di tabel diubah, tinggi batang grafik langsung bergerak otomatis!', action: "ubahSampelDataGrafik()" },
      { name: 'Perbandingan Cepat', desc: 'Audiens bisa langsung melihat capaian tertinggi dan terendah tanpa membaca angka satu per satu.', action: "renderExcelMiniChart()" },
      { name: 'Unduh File Excel (.xlsx/.csv)', desc: 'Menyimpan dokumen spreadsheet ke komputer untuk ditunjukkan kepada guru dan orang tua.', action: "unduhFileExcel()" }
    ],
    masalahNyata: '<b>Kekuatan Komunikasi Visual:</b> Grafik batang membuat data lebih menarik dan mudah dimengerti orang lain dibandingkan hanya melihat kumpulan angka biasa.',
    contohKasus: 'Menyajikan grafik perbandingan ketercapaian karakter 7 Kebiasaan Anak Indonesia Hebat.'
  }
};

function pilihTPExcel(tpKey) {
  currentTPExcel = tpKey;
  ['tp1_1', 'tp1_2', 'tp1_3', 'tp1_4'].forEach(k => {
    const btn = document.getElementById(`btn-tp-${k}`);
    if (btn) {
      if (k === tpKey) {
        btn.className = 'excel-tp-tab active-excel-tp p-3 rounded-2xl border-2 border-emerald-500 bg-emerald-50 text-left transition flex flex-col justify-between shadow-xs';
      } else {
        btn.className = 'excel-tp-tab p-3 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-emerald-50 text-left transition flex flex-col justify-between';
      }
    }
  });

  renderTPExcelContent(tpKey);
  playSound('click');
}

function renderTPExcelContent(tpKey) {
  const container = document.getElementById('tp-excel-content-area');
  if (!container) return;

  const data = TP_EXCEL_DATA[tpKey] || TP_EXCEL_DATA.tp1_1;

  let anatomyHtml = '';
  data.anatomy.forEach(item => {
    anatomyHtml += `<div class="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
      <div>
        <b class="text-slate-800 text-xs block mb-1 font-title">${item.name}</b>
        <p class="text-[11px] text-slate-600 leading-snug">${item.desc}</p>
      </div>
      <div class="mt-2.5 pt-2 border-t border-slate-100">
        <button onclick="${item.action}" class="text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg w-full transition flex items-center justify-center gap-1">
          <i class="fa-solid fa-hand-pointer text-[9px]"></i> Coba di Excel
        </button>
      </div>
    </div>`;
  });

  container.innerHTML = `
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/70 pb-3">
      <div>
        <div class="flex items-center gap-2">
          <span class="text-[11px] font-black text-white px-2 py-0.5 rounded ${data.badgeColor}">${data.code}</span>
          <h4 class="font-title font-bold text-slate-800 text-sm sm:text-base">${data.title}</h4>
        </div>
        <p class="text-xs text-slate-500 mt-1">${data.desc}</p>
      </div>
      <div class="shrink-0 flex items-center gap-1.5">
        <span class="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-300">
          Misi Aktif ✨
        </span>
      </div>
    </div>

    <!-- Grid Eksplorasi Materi TP -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 my-2">
      ${anatomyHtml}
    </div>

    <!-- Kotak Masalah Sehari-hari & Studi Kasus Berpikir Komputasional -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
      <div class="bg-amber-50 p-3 rounded-xl border border-amber-200 text-amber-950 text-[11px] leading-relaxed">
        <div class="flex items-center gap-1.5 font-title font-bold text-amber-900 mb-1">
          <i class="fa-solid fa-lightbulb text-amber-600"></i> Masalah Nyata Sehari-hari:
        </div>
        <p>${data.masalahNyata}</p>
      </div>
      <div class="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-emerald-950 text-[11px] leading-relaxed">
        <div class="flex items-center gap-1.5 font-title font-bold text-emerald-900 mb-1">
          <i class="fa-solid fa-circle-check text-emerald-600"></i> Solusi dengan Berpikir Komputasional:
        </div>
        <p>Contoh Kasus: <b>${data.contohKasus}</b>. Data diolah sistematis, dihitung otomatis dengan rumus, dan divisualisasikan dalam bentuk grafik batang.</p>
      </div>
    </div>
  `;
}

function sorotBarisExcel(rowNum) {
  pilihSelExcel(`B${rowNum}`);
  showToast(`Baris ${rowNum} dipilih! Perhatikan nomor baris horizontal mendatar di sisi kiri.`);
}

function sorotKolomExcel(colLetter) {
  pilihSelExcel(`${colLetter}2`);
  showToast(`Kolom ${colLetter} dipilih! Perhatikan huruf kolom vertikal tegak di bagian atas.`);
}

function fokusFormulaBarExcel() {
  const fi = document.getElementById('excel-formula-input');
  if (fi) {
    fi.focus();
    fi.select();
    showToast('Formula Bar aktif! Ketik rumus diawali tanda = (contoh: =SUM(C2:H2))');
  }
}

function ubahSampelDataGrafik() {
  // Ubah nilai di sel C4 atau sel aktif untuk menunjukkan live update diagram batang
  if (excelState.cells['C4'] !== undefined) {
    const curVal = excelState.cells['C4'] === '1' ? '0' : '1';
    excelState.cells['C4'] = curVal;
    renderExcelGrid();
    renderExcelMiniChart();
    updateExcelStats();
    showToast(`Nilai sel C4 diubah menjadi ${curVal}! Perhatikan grafik batang langsung bergerak otomatis! 📊`, 'success');
  } else {
    showToast('Silakan pilih salah satu template dan ubah angkanya!');
  }
}

function initExcelSpreadsheet() {
  attachExcelKeyboardListener();
  setExcelViewMode(excelState.viewMode || 'full');
  if (Object.keys(excelState.cells).length === 0) {
    muatTemplateExcel('checklist_karakter', false);
  } else {
    renderExcelGrid();
    renderExcelMiniChart();
    updateExcelStats();
  }
  renderTPExcelContent(currentTPExcel);
}

function muatTemplateExcel(tplKey, notify = true) {
  const tpl = EXCEL_TEMPLATES[tplKey];
  if (!tpl) return;

  excelState.activeTemplate = tplKey;
  excelState.rowCount = 25; // 25 baris lembar dokumen penuh Excel
  excelState.cells = JSON.parse(JSON.stringify(tpl.cells));
  excelState.formats = JSON.parse(JSON.stringify(tpl.formats || {}));
  excelState.activeCell = 'B2';

  // Update header text
  const fnEl = document.getElementById('excel-active-filename');
  if (fnEl) fnEl.innerText = tpl.fileName;
  const sheetEl = document.getElementById('excel-active-sheet-label');
  if (sheetEl) sheetEl.innerText = tpl.sheetTitle;

  // Update template buttons
  ['checklist_karakter', 'tabungan', 'nilai_siswa', 'daur_ulang'].forEach(k => {
    const btn = document.getElementById(`tpl-btn-${k}`);
    if (btn) {
      if (k === tplKey) {
        btn.className = 'excel-tpl-btn active-excel-tpl p-3 rounded-2xl border-2 border-emerald-500 bg-emerald-50/80 hover:bg-emerald-100/80 text-left transition flex flex-col justify-between shadow-sm';
      } else {
        btn.className = 'excel-tpl-btn p-3 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-emerald-50 text-left transition flex flex-col justify-between';
      }
    }
  });

  renderExcelGrid();
  pilihSelExcel('B2');
  renderExcelMiniChart();
  updateExcelStats();

  if (notify) {
    playSound('success');
    showToast(`Template "${tpl.sheetTitle.split('- ')[1]}" berhasil dibuka! 📊`, 'success');
  }
}

function parseCellCoord(coord) {
  const match = coord.match(/^([A-Z]+)([0-9]+)$/);
  if (!match) return null;
  return { col: match[1], row: parseInt(match[2], 10) };
}

function getCellsInRange(rangeStr) {
  const parts = rangeStr.split(':');
  if (parts.length !== 2) return [rangeStr.trim()];

  const start = parseCellCoord(parts[0].trim().toUpperCase());
  const end = parseCellCoord(parts[1].trim().toUpperCase());
  if (!start || !end) return [];

  const startColCode = start.col.charCodeAt(0);
  const endColCode = end.col.charCodeAt(0);
  const minCol = Math.min(startColCode, endColCode);
  const maxCol = Math.max(startColCode, endColCode);

  const minRow = Math.min(start.row, end.row);
  const maxRow = Math.max(start.row, end.row);

  const result = [];
  for (let r = minRow; r <= maxRow; r++) {
    for (let c = minCol; c <= maxCol; c++) {
      result.push(String.fromCharCode(c) + r);
    }
  }
  return result;
}

// Helper menghitung daftar sel dalam area persegi panjang (misal C2:E5)
function getRectangularRange(coord1, coord2) {
  const p1 = parseCellCoord(coord1);
  const p2 = parseCellCoord(coord2);
  if (!p1 || !p2) return [coord1];

  const col1Idx = excelState.cols.indexOf(p1.col);
  const col2Idx = excelState.cols.indexOf(p2.col);
  if (col1Idx === -1 || col2Idx === -1) return [coord1];

  const minColIdx = Math.min(col1Idx, col2Idx);
  const maxColIdx = Math.max(col1Idx, col2Idx);
  const minRow = Math.min(p1.row, p2.row);
  const maxRow = Math.max(p1.row, p2.row);

  const cells = [];
  for (let r = minRow; r <= maxRow; r++) {
    for (let c = minColIdx; c <= maxColIdx; c++) {
      cells.push(`${excelState.cols[c]}${r}`);
    }
  }
  return cells;
}

// Helper membuat string rentang (misal C2:C8 atau C2)
function getRangeString(coord1, coord2) {
  if (!coord1 || !coord2) return coord1 || '';
  if (coord1 === coord2) return coord1;

  const p1 = parseCellCoord(coord1);
  const p2 = parseCellCoord(coord2);
  if (!p1 || !p2) return coord1;

  const col1Idx = excelState.cols.indexOf(p1.col);
  const col2Idx = excelState.cols.indexOf(p2.col);
  if (col1Idx === -1 || col2Idx === -1) return `${coord1}:${coord2}`;

  const minCol = excelState.cols[Math.min(col1Idx, col2Idx)];
  const maxCol = excelState.cols[Math.max(col1Idx, col2Idx)];
  const minRow = Math.min(p1.row, p2.row);
  const maxRow = Math.max(p1.row, p2.row);

  return `${minCol}${minRow}:${maxCol}${maxRow}`;
}

// Helper parsing daftar argumen rumus Excel (mendukung range ':' serta pemisah koma ',' atau titik koma ';')
function parseFormulaArgList(argStr) {
  if (!argStr) return [];
  const tokens = argStr.split(/[,;]/);
  const cells = [];
  tokens.forEach(tok => {
    const trimmed = tok.trim();
    if (!trimmed) return;
    if (trimmed.includes(':')) {
      cells.push(...getCellsInRange(trimmed));
    } else {
      cells.push(trimmed.toUpperCase());
    }
  });
  return cells;
}

// Helper mendapatkan nilai angka dari suatu koordinat sel atau nilai langsung
function getCellValueAsNumber(c, visited = new Set()) {
  if (typeof c === 'number') return isNaN(c) ? 0 : c;
  const str = String(c).trim();
  const coordUpper = str.toUpperCase();
  if (parseCellCoord(coordUpper)) {
    if (visited.has(coordUpper)) return 0; // cegah circular reference
    const rawVal = excelState.cells[coordUpper];
    const nextVisited = new Set(visited).add(coordUpper);
    const evalVal = evaluasiRumusExcel(rawVal, nextVisited);
    const num = parseFloat(String(evalVal).replace(/[^0-9.-]/g, ''));
    return isNaN(num) ? 0 : num;
  }
  const num = parseFloat(str.replace(/[^0-9.-]/g, ''));
  return isNaN(num) ? 0 : num;
}

function evaluasiRumusExcel(rawVal, visited = new Set()) {
  if (rawVal === undefined || rawVal === null) return '';
  const str = String(rawVal).trim();
  if (!str.startsWith('=')) return str;

  let formula = str.substring(1).trim();
  if (!formula) return '=';

  // Otomatis menutup tanda kurung yang belum ditutup (persis Microsoft Excel)
  // Contoh: =SUM(C2:C8 otomatis dievaluasi sebagai =SUM(C2:C8)
  const openCount = (formula.match(/\(/g) || []).length;
  const closeCount = (formula.match(/\)/g) || []).length;
  if (openCount > closeCount) {
    formula = formula + ')'.repeat(openCount - closeCount);
  }

  let upper = formula.toUpperCase();

  // 1. Pola =SUM(...)
  const sumMatch = upper.match(/^SUM\s*\(([^)]*)\)$/);
  if (sumMatch) {
    const arg = sumMatch[1].trim();
    if (!arg) return 0;
    const cells = parseFormulaArgList(arg);
    let total = 0;
    cells.forEach(c => {
      total += getCellValueAsNumber(c, visited);
    });
    return total;
  }

  // 2. Pola =AVERAGE(...) atau =AVG(...)
  const avgMatch = upper.match(/^(?:AVERAGE|AVG)\s*\(([^)]*)\)$/);
  if (avgMatch) {
    const arg = avgMatch[1].trim();
    if (!arg) return 0;
    const cells = parseFormulaArgList(arg);
    let total = 0;
    let count = 0;
    cells.forEach(c => {
      total += getCellValueAsNumber(c, visited);
      count++;
    });
    if (count === 0) return 0;
    const avg = total / count;
    return Number.isInteger(avg) ? avg : parseFloat(avg.toFixed(2));
  }

  // 3. Pola =COUNT(...)
  const countMatch = upper.match(/^COUNT\s*\(([^)]*)\)$/);
  if (countMatch) {
    const arg = countMatch[1].trim();
    if (!arg) return 0;
    const cells = parseFormulaArgList(arg);
    let count = 0;
    cells.forEach(c => {
      if (parseCellCoord(c)) {
        const val = excelState.cells[c];
        if (val !== undefined && val !== null && String(val).trim() !== '') {
          count++;
        }
      } else if (String(c).trim() !== '') {
        count++;
      }
    });
    return count;
  }

  // 4. Pola =MAX(...)
  const maxMatch = upper.match(/^MAX\s*\(([^)]*)\)$/);
  if (maxMatch) {
    const arg = maxMatch[1].trim();
    if (!arg) return 0;
    const cells = parseFormulaArgList(arg);
    let max = -Infinity;
    cells.forEach(c => {
      const n = getCellValueAsNumber(c, visited);
      if (n > max) max = n;
    });
    return max === -Infinity ? 0 : max;
  }

  // 5. Pola =MIN(...)
  const minMatch = upper.match(/^MIN\s*\(([^)]*)\)$/);
  if (minMatch) {
    const arg = minMatch[1].trim();
    if (!arg) return 0;
    const cells = parseFormulaArgList(arg);
    let min = Infinity;
    cells.forEach(c => {
      const n = getCellValueAsNumber(c, visited);
      if (n < min) min = n;
    });
    return min === Infinity ? 0 : min;
  }

  // 6. Pola Referensi Sel Tunggal: =B2 atau =C3
  if (/^[A-Z]+[0-9]+$/.test(upper)) {
    if (visited.has(upper)) return 0;
    return evaluasiRumusExcel(excelState.cells[upper], new Set(visited).add(upper));
  }

  // 7. Pola Ekspresi Matematika / Operasi Sel Berantai: =C2+C3+C4, =D2-E2, =C2*D2, =C2/2, =(C2+D2)*10
  try {
    let expr = upper.replace(/\b([A-Z]+[0-9]+)\b/g, (match) => {
      return getCellValueAsNumber(match, visited);
    });

    expr = expr.replace(/([0-9.]+)\s*%/g, '($1*0.01)');

    if (/^[0-9\.\+\-\*\/\(\)\s]+$/.test(expr)) {
      const res = Function('"use strict"; return (' + expr + ')')();
      if (typeof res === 'number' && !isNaN(res) && isFinite(res)) {
        return Number.isInteger(res) ? res : parseFloat(res.toFixed(2));
      }
    }
  } catch (err) {
    console.warn('Evaluasi formula error:', err);
  }

  return '#NAMA?';
}

// Sorot sel yang sedang dipilih oleh mouse untuk rumus (marching-ants style)
function highlightFormulaSelection(startCoord, endCoord) {
  document.querySelectorAll('.excel-formula-range-active').forEach(el => {
    el.classList.remove('excel-formula-range-active');
  });

  const cells = getRectangularRange(startCoord, endCoord);
  cells.forEach(c => {
    const el = document.getElementById(`excel-cell-${c}`);
    if (el) {
      el.classList.add('excel-formula-range-active');
    }
  });
}

// Sorot blok sel biasa saat mouse drag di spreadsheet
function highlightNormalRange(startCoord, endCoord) {
  document.querySelectorAll('.excel-range-selected').forEach(el => {
    el.classList.remove('excel-range-selected');
  });

  if (startCoord === endCoord) return;

  const cells = getRectangularRange(startCoord, endCoord);
  cells.forEach(c => {
    const el = document.getElementById(`excel-cell-${c}`);
    if (el && c !== excelState.activeCell) {
      el.classList.add('excel-range-selected');
    }
  });
}

// Hitung cepat statistik di status bar bawah ketika pengguna memblok sejumlah sel
function updateRangeStatsBar(startCoord, endCoord) {
  const statsEl = document.getElementById('excel-status-range-stats');
  if (!statsEl) return;

  if (startCoord === endCoord) {
    statsEl.classList.add('hidden');
    return;
  }

  const cells = getRectangularRange(startCoord, endCoord);
  let count = 0;
  let sum = 0;
  cells.forEach(c => {
    const raw = excelState.cells[c];
    if (raw !== undefined && raw !== null && String(raw).trim() !== '') {
      const computed = evaluasiRumusExcel(raw);
      const num = parseFloat(String(computed).replace(/[^0-9.-]/g, ''));
      if (!isNaN(num)) {
        sum += num;
        count++;
      }
    }
  });

  const avg = count > 0 ? (sum / count) : 0;
  statsEl.innerText = `JUMLAH: ${sum.toLocaleString('id-ID')} | RATA-RATA: ${(Number.isInteger(avg) ? avg : avg.toFixed(1))} | COUNT: ${count}`;
  statsEl.classList.remove('hidden');
}

// Sorot sel-sel rujukan dalam rumus yang diketik (Visual Reference)
function highlightFormulaReferences(formulaStr) {
  document.querySelectorAll('.excel-cell-referenced').forEach(el => {
    el.classList.remove('excel-cell-referenced');
  });

  if (!formulaStr || !String(formulaStr).startsWith('=')) return;

  const upper = String(formulaStr).substring(1).toUpperCase();
  const referencedCells = new Set();

  const rangeMatches = upper.match(/([A-Z]+[0-9]+):([A-Z]+[0-9]+)/g) || [];
  rangeMatches.forEach(rng => {
    getCellsInRange(rng).forEach(c => referencedCells.add(c));
  });

  const singleCells = upper.match(/\b([A-Z]+[0-9]+)\b/g) || [];
  singleCells.forEach(c => {
    if (parseCellCoord(c)) referencedCells.add(c);
  });

  referencedCells.forEach(c => {
    const el = document.getElementById(`excel-cell-${c}`);
    if (el && c !== excelState.activeCell) {
      el.classList.add('excel-cell-referenced');
    }
  });
}

function formatTampilanNilai(coord, computedVal) {
  if (computedVal === undefined || computedVal === null || computedVal === '') return '';
  const fmt = excelState.formats[coord] || {};
  const num = typeof computedVal === 'number' ? computedVal : parseFloat(String(computedVal).replace(/[^0-9.-]/g, ''));

  if (!isNaN(num) && typeof num === 'number') {
    if (fmt.numFormat === 'rupiah') {
      return 'Rp ' + num.toLocaleString('id-ID');
    }
    if (fmt.numFormat === 'persen') {
      return num + '%';
    }
    if (fmt.numFormat === 'ribuan') {
      return num.toLocaleString('id-ID');
    }
  }

  return computedVal;
}

// Mengambil teks rumus/nilai yang sedang diedit pengguna saat ini
function getCurrentEditingFormula() {
  const inlineInput = document.getElementById('excel-inline-input');
  if (inlineInput) return inlineInput.value;
  const formulaInput = document.getElementById('excel-formula-input');
  if (formulaInput) return formulaInput.value;
  return excelState.cells[excelState.activeCell] || '';
}

// Memperbarui nilai input yang sedang diedit (baik di sel maupun di formula bar)
function updateCurrentEditingFormula(newVal) {
  excelState.cells[excelState.activeCell] = newVal;
  const inlineInput = document.getElementById('excel-inline-input');
  if (inlineInput) {
    inlineInput.value = newVal;
  }
  const formulaInput = document.getElementById('excel-formula-input');
  if (formulaInput) {
    formulaInput.value = newVal;
  }
}

function focusCurrentEditingInput() {
  const inlineInput = document.getElementById('excel-inline-input');
  if (inlineInput) {
    inlineInput.focus();
    const len = inlineInput.value.length;
    inlineInput.setSelectionRange(len, len);
    return;
  }
  const formulaInput = document.getElementById('excel-formula-input');
  if (formulaInput) {
    formulaInput.focus();
    const len = formulaInput.value.length;
    formulaInput.setSelectionRange(len, len);
  }
}

// Cek apakah rumus sedang dalam posisi menunggu koordinat sel (setelah '=', '(', ',', ';', '+', '-', '*', '/')
function isFormulaExpectingReference(formulaStr) {
  if (!formulaStr || !String(formulaStr).startsWith('=')) return false;
  const str = String(formulaStr).trim();
  if (/(=|\(|\+|-|\*|\/|,|;)$/.test(str)) return true;
  if (/=(SUM|AVERAGE|AVG|MAX|MIN|COUNT)$/i.test(str)) return true;
  if (excelState.formulaSelectAnchor !== null) return true;
  return false;
}

// Ekstrak prefix rumus sebelum koordinat sel terakhir
function extractFormulaPrefix(formula) {
  if (!formula) return '=';
  let str = String(formula);
  if (/=(SUM|AVERAGE|AVG|MAX|MIN|COUNT)$/i.test(str)) {
    return str + '(';
  }
  const match = str.match(/^(.*?)([A-Za-z]+[0-9]+(?::[A-Za-z]+[0-9]+)?)?$/);
  if (match && match[1]) {
    return match[1];
  }
  return str;
}

// RENDER GRID EXCEL: Lembaran Dokumen Excel Asli (Sticky Panes, Header Kolom & Baris, Resize Kolom & Baris, Autofill Handle)
function renderExcelGrid() {
  const thead = document.getElementById('excel-grid-thead');
  const tbody = document.getElementById('excel-grid-tbody');
  if (!thead || !tbody) return;

  // Header Kolom Huruf (A, B, C, ..., W)
  let thHtml = `<tr class="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
    <th onclick="pilihSemuaSelExcel()" class="w-10 sm:w-12 py-1.5 px-1 text-center border-r border-slate-300 select-none excel-sticky-corner cursor-pointer hover:bg-slate-300 transition" title="Pilih Seluruh Lembar (Ctrl+A)">
      <i class="fa-solid fa-play rotate-45 text-[9px] text-slate-500"></i>
    </th>`;
  
  excelState.cols.forEach(col => {
    const defaultW = (col === 'B') ? 220 : (col === 'A' ? 48 : 88);
    const colWidth = excelState.colWidths[col] || defaultW;
    thHtml += `<th class="py-1.5 px-2 text-center border-r border-slate-300 tracking-wider text-xs excel-sticky-header hover:bg-slate-200 transition select-none relative"
      data-col="${col}"
      style="width: ${colWidth}px; min-width: ${colWidth}px; max-width: ${colWidth}px;"
      onmousedown="handleColHeaderMouseDown('${col}', event)"
      title="Kolom ${col} (Klik untuk memblok kolom, seret garis batas kanan untuk melebarkan ↔)">
      <span class="pointer-events-none">${col}</span>
      <div class="excel-col-resizer"
        onmousedown="startColResize('${col}', event)"
        ondblclick="autoFitColWidth('${col}', event)"
        title="Tarik untuk melebarkan/menyempitkan kolom ${col} (Klik 2x untuk pas otomatis)"></div>
    </th>`;
  });
  thHtml += `</tr>`;
  thead.innerHTML = thHtml;

  // Body Baris Nomor (1, 2, ..., 25)
  let tbHtml = '';
  for (let r = 1; r <= excelState.rowCount; r++) {
    const defaultH = 28;
    const rowHeight = excelState.rowHeights[r] || defaultH;
    tbHtml += `<tr id="excel-row-${r}" class="border-b border-slate-200 hover:bg-slate-50/50" style="height: ${rowHeight}px;">
      <td class="excel-sticky-row text-slate-600 font-bold text-center py-1.5 px-1 border-r border-slate-300 select-none text-[11px] hover:bg-slate-200 transition relative"
        data-row="${r}"
        style="height: ${rowHeight}px;"
        onmousedown="handleRowHeaderMouseDown(${r}, event)"
        title="Baris ${r} (Klik untuk memblok baris, seret garis batas bawah untuk meninggikan ↕)">
        <span class="pointer-events-none">${r}</span>
        <div class="excel-row-resizer"
          onmousedown="startRowResize(${r}, event)"
          ondblclick="resetRowHeight(${r}, event)"
          title="Tarik untuk meninggikan/memendekkan baris ${r}"></div>
      </td>`;

    excelState.cols.forEach(col => {
      const defaultW = (col === 'B') ? 220 : (col === 'A' ? 48 : 88);
      const colWidth = excelState.colWidths[col] || defaultW;
      const coord = `${col}${r}`;
      const raw = excelState.cells[coord] || '';
      const computed = evaluasiRumusExcel(raw);
      const display = formatTampilanNilai(coord, computed);
      const fmt = excelState.formats[coord] || {};
      const isActive = (coord === excelState.activeCell);
      const isEditing = (isActive && excelState.isEditing);
      const isCopied = excelState.clipboardCells && excelState.clipboardCells.includes(coord);

      let inlineStyle = '';
      if (fmt.bold) inlineStyle += 'font-weight: bold; ';
      if (fmt.italic) inlineStyle += 'font-style: italic; ';
      if (fmt.underline) inlineStyle += 'text-decoration: underline; ';
      if (fmt.align) inlineStyle += `text-align: ${fmt.align}; `;
      if (fmt.valign) inlineStyle += `vertical-align: ${fmt.valign}; `;
      if (fmt.wrapText) inlineStyle += 'white-space: normal !important; word-break: break-word; ';
      if (fmt.border === 'all') inlineStyle += 'border: 1.5px solid #0f172a !important; outline: 1px solid #0f172a !important; ';
      if (fmt.bg) inlineStyle += `background-color: ${fmt.bg} !important; `;
      if (fmt.color) inlineStyle += `color: ${fmt.color} !important; `;
      if (fmt.fontFamily) inlineStyle += `font-family: ${fmt.fontFamily} !important; `;
      if (fmt.fontSize) inlineStyle += `font-size: ${fmt.fontSize}px !important; `;

      let activeClasses = isActive 
        ? 'ring-2 ring-emerald-600 border-2 border-emerald-600 z-20 relative font-medium excel-cell-active-indicator' 
        : 'border-r border-slate-200 hover:bg-emerald-50/20';
      if (isCopied) {
        activeClasses += ' excel-clipboard-active';
      }

      let cellContent = '';
      if (isEditing) {
        const rawEscaped = String(raw).replace(/"/g, '&quot;');
        cellContent = `<input id="excel-inline-input"
          type="text"
          value="${rawEscaped}"
          class="w-full h-full bg-white text-slate-900 font-mono text-xs px-1.5 py-0.5 outline-none border border-emerald-500 rounded shadow-xs select-text cursor-text"
          autocomplete="off"
          spellcheck="false"
          oninput="handleInlineInputChange(this.value)"
          onkeydown="handleInlineInputKey(event)"
          onblur="handleInlineInputBlur()"
        />`;
      } else {
        cellContent = display !== '' ? display : '&nbsp;';
      }

      // Handle autofill pojok kanan bawah sel aktif (persis icon plus hitam kecil di materi poster kelas 4)
      const autofillHandle = (isActive && !isEditing)
        ? `<div class="excel-autofill-handle" onmousedown="startExcelAutofill(event)" title="Plus hitam kecil (+): Tarik ke bawah atau ke kanan untuk menyalin/mengisi data berurutan (Autofill)"></div>`
        : '';

      tbHtml += `<td id="excel-cell-${coord}"
        data-coord="${coord}"
        data-col="${col}"
        data-row="${r}"
        onmousedown="handleCellMouseDown('${coord}', event)"
        onmouseenter="handleCellMouseEnter('${coord}', event)"
        onclick="handleCellClick('${coord}', event)"
        ondblclick="editLangsungSelExcel('${coord}')"
        oncontextmenu="handleCellContextMenu('${coord}', event)"
        style="width: ${colWidth}px; min-width: ${colWidth}px; max-width: ${colWidth}px; height: ${rowHeight}px; ${inlineStyle}"
        class="py-1 px-2 text-xs text-slate-800 transition whitespace-nowrap overflow-hidden text-ellipsis select-none relative ${activeClasses}">
        ${cellContent}
        ${autofillHandle}
      </td>`;
    });

    tbHtml += `</tr>`;
  }
  tbody.innerHTML = tbHtml;

  // Fokuskan input inline jika sedang dalam mode edit
  if (excelState.isEditing) {
    const inlineInput = document.getElementById('excel-inline-input');
    if (inlineInput) {
      inlineInput.focus();
      if (excelState.cursorAtEnd) {
        const len = inlineInput.value.length;
        inlineInput.setSelectionRange(len, len);
      } else {
        inlineInput.select();
      }
    }
  }
}

// Beralih Mode Tampilan: Dokumen Excel Penuh (Worksheet View) vs Split View (dengan Diagram Batang)
function setExcelViewMode(mode) {
  excelState.viewMode = mode;
  const gridCol = document.getElementById('excel-grid-container-col');
  const chartCol = document.getElementById('excel-side-chart-col');
  const btnFull = document.getElementById('btn-view-full');
  const btnSplit = document.getElementById('btn-view-split');

  if (mode === 'full') {
    if (gridCol) {
      gridCol.className = 'lg:col-span-12 p-3 sm:p-4 overflow-x-auto';
    }
    if (chartCol) {
      chartCol.classList.add('hidden');
    }
    if (btnFull) {
      btnFull.className = 'px-2.5 py-1 rounded text-[11px] font-bold transition flex items-center gap-1.5 bg-[#107c41] text-white shadow-xs';
    }
    if (btnSplit) {
      btnSplit.className = 'px-2.5 py-1 rounded text-[11px] font-bold transition flex items-center gap-1.5 bg-white hover:bg-slate-200 text-slate-700 border border-slate-300';
    }
    showToast('Mode Lembar Excel Penuh (Worksheet View) aktif! 📑');
  } else {
    if (gridCol) {
      gridCol.className = 'lg:col-span-8 p-3 sm:p-4 overflow-x-auto border-b lg:border-b-0 lg:border-r border-slate-200';
    }
    if (chartCol) {
      chartCol.classList.remove('hidden');
    }
    if (btnFull) {
      btnFull.className = 'px-2.5 py-1 rounded text-[11px] font-bold transition flex items-center gap-1.5 bg-white hover:bg-slate-200 text-slate-700 border border-slate-300';
    }
    if (btnSplit) {
      btnSplit.className = 'px-2.5 py-1 rounded text-[11px] font-bold transition flex items-center gap-1.5 bg-[#107c41] text-white shadow-xs';
    }
    showToast('Mode Tampilan Bersama Diagram Batang aktif! 📊');
  }
}

let isExcelFullscreenActive = false;

// Fitur Layar Penuh (Fullscreen) Sejati untuk Microsoft Excel (Dual-Mode: Native HTML5 API + Viewport Desktop Isolation)
function toggleExcelFullscreen(forceState = null) {
  const win = document.getElementById('excel-main-window');
  if (!win) return;

  const nextState = (forceState !== null) ? forceState : !isExcelFullscreenActive;
  isExcelFullscreenActive = nextState;
  playSound('click');

  const labelEl = document.getElementById('excel-fullscreen-label');
  const iconFs = document.getElementById('excel-fullscreen-icon');
  const btnTitle = document.getElementById('btn-excel-fullscreen-title');
  const btnRibbon = document.getElementById('btn-excel-fullscreen-ribbon');
  const restoreIcon = document.getElementById('btn-excel-window-restore-icon');
  const floatingBtn = document.getElementById('excel-floating-exit-btn');

  if (isExcelFullscreenActive) {
    win.classList.add('excel-fullscreen-mode');
    document.body.classList.add('excel-fs-active');

    // Coba Browser Native Fullscreen (F11 sejati) jika didukung
    if (!document.fullscreenElement && win.requestFullscreen) {
      win.requestFullscreen().catch(() => {});
    }

    if (labelEl) labelEl.innerText = 'Keluar Penuh (Esc)';
    if (iconFs) iconFs.className = 'fa-solid fa-compress text-xs text-amber-300';
    if (btnTitle) {
      btnTitle.className = 'bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-amber-400 flex items-center gap-1.5 transition shadow-sm hover:scale-105 active:scale-95 shrink-0 whitespace-nowrap';
      btnTitle.innerHTML = '<i class="fa-solid fa-compress text-xs text-amber-300"></i> <span>Keluar Penuh (Esc)</span>';
    }
    if (btnRibbon) {
      btnRibbon.className = 'px-2.5 py-1 rounded text-[11px] font-bold transition flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white shadow-xs';
      btnRibbon.innerHTML = '<i class="fa-solid fa-compress"></i> <span>Keluar Penuh (Esc)</span>';
    }
    if (restoreIcon) {
      restoreIcon.className = 'fa-solid fa-compress text-xs';
    }
    if (floatingBtn) {
      floatingBtn.classList.remove('hidden');
    }

    showToast('Mode Layar Penuh Sejati Excel aktif! 🖥️ Tekan Esc atau klik tombol merah di pojok kanan bawah untuk keluar.', 'success');
  } else {
    win.classList.remove('excel-fullscreen-mode');
    document.body.classList.remove('excel-fs-active');

    // Keluar dari native fullscreen jika aktif
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }

    if (labelEl) labelEl.innerText = 'Layar Penuh';
    if (iconFs) iconFs.className = 'fa-solid fa-expand text-xs';
    if (btnTitle) {
      btnTitle.className = 'bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-emerald-500/70 flex items-center gap-1.5 transition shadow-sm hover:scale-105 active:scale-95 shrink-0 whitespace-nowrap';
      btnTitle.innerHTML = '<i class="fa-solid fa-expand text-xs"></i> <span>Layar Penuh</span>';
    }
    if (btnRibbon) {
      btnRibbon.className = 'px-2.5 py-1 rounded text-[11px] font-bold transition flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-900 text-white shadow-xs';
      btnRibbon.innerHTML = '<i class="fa-solid fa-expand"></i> <span>Layar Penuh</span>';
    }
    if (restoreIcon) {
      restoreIcon.className = 'fa-regular fa-window-restore text-xs';
    }
    if (floatingBtn) {
      floatingBtn.classList.add('hidden');
    }

    showToast('Kembali ke tampilan standar Excel.');
  }
}

function closeExcelWindowOrExitFs() {
  if (isExcelFullscreenActive) {
    toggleExcelFullscreen(false);
  } else {
    showToast('Gunakan tab navigasi di atas untuk berpindah modul atau beranda.', 'info');
  }
}

function handleCellMouseDown(coord, event) {
  if (event.button !== 0) return; // Hanya proses klik kiri

  const currentFormula = getCurrentEditingFormula();
  const isExpectingRef = isFormulaExpectingReference(currentFormula);

  if (excelState.isEditing && isExpectingRef) {
    // Mode Formula Point & Range Drag (Blok Sel untuk Rumus)
    event.preventDefault();
    excelState.isMouseDown = true;
    excelState.formulaSelecting = true;
    excelState.formulaSelectAnchor = coord;
    excelState.formulaSelectCurrent = coord;
    excelState.formulaPrefix = extractFormulaPrefix(currentFormula);

    const rangeStr = coord;
    const newFormula = excelState.formulaPrefix + rangeStr;
    updateCurrentEditingFormula(newFormula);
    highlightFormulaSelection(coord, coord);
    return;
  }

  // Seleksi blok sel biasa saat tidak sedang mengetik rumus
  excelState.isMouseDown = true;
  excelState.normalSelecting = true;
  excelState.rangeSelectAnchor = coord;
  excelState.rangeSelectCurrent = coord;

  if (!excelState.isEditing) {
    pilihSelExcel(coord);
    highlightNormalRange(coord, coord);
  }
}

function handleCellMouseEnter(coord, event) {
  if (excelState.isAutofilling && excelState.autofillAnchor) {
    excelState.autofillCurrent = coord;
    highlightAutofillRange(excelState.autofillAnchor, coord);
    return;
  }

  if (!excelState.isMouseDown) return;

  if (excelState.formulaSelecting && excelState.formulaSelectAnchor) {
    excelState.formulaSelectCurrent = coord;
    const rangeStr = getRangeString(excelState.formulaSelectAnchor, coord);
    const newFormula = excelState.formulaPrefix + rangeStr;
    updateCurrentEditingFormula(newFormula);
    highlightFormulaSelection(excelState.formulaSelectAnchor, coord);
    return;
  }

  if (excelState.normalSelecting && excelState.rangeSelectAnchor) {
    excelState.rangeSelectCurrent = coord;
    highlightNormalRange(excelState.rangeSelectAnchor, coord);
    updateRangeStatsBar(excelState.rangeSelectAnchor, coord);
  }
}

function handleGridMouseUp(event) {
  excelState.isMouseDown = false;
  if (excelState.isAutofilling) {
    excelState.isAutofilling = false;
    applyExcelAutofill(excelState.autofillAnchor, excelState.autofillCurrent);
    excelState.autofillAnchor = null;
    excelState.autofillCurrent = null;
    document.querySelectorAll('.excel-autofill-target-range').forEach(el => el.classList.remove('excel-autofill-target-range'));
  }
  if (excelState.formulaSelecting) {
    excelState.formulaSelecting = false;
    focusCurrentEditingInput();
  }
  if (excelState.normalSelecting) {
    excelState.normalSelecting = false;
  }
}

// ==========================================
// FITUR AUTOFILL (MENYALIN SEL DENGAN PLUS HITAM KECIL)
// ==========================================
function startExcelAutofill(event) {
  event.stopPropagation();
  event.preventDefault();
  excelState.isAutofilling = true;
  excelState.autofillAnchor = excelState.activeCell;
  excelState.autofillCurrent = excelState.activeCell;
  highlightAutofillRange(excelState.activeCell, excelState.activeCell);
}

function highlightAutofillRange(startCoord, endCoord) {
  document.querySelectorAll('.excel-autofill-target-range').forEach(el => {
    el.classList.remove('excel-autofill-target-range');
  });

  if (!startCoord || !endCoord) return;
  const cells = getRectangularRange(startCoord, endCoord);
  cells.forEach(c => {
    const el = document.getElementById(`excel-cell-${c}`);
    if (el) {
      el.classList.add('excel-autofill-target-range');
    }
  });
}

function applyExcelAutofill(anchorCoord, currentCoord) {
  if (!anchorCoord || !currentCoord) return;
  if (anchorCoord === currentCoord) return;

  const a = parseCellCoord(anchorCoord);
  const c = parseCellCoord(currentCoord);
  if (!a || !c) return;

  const aColIdx = excelState.cols.indexOf(a.col);
  const cColIdx = excelState.cols.indexOf(c.col);

  const rawSource = excelState.cells[anchorCoord] || '';
  const sourceFmt = Object.assign({}, excelState.formats[anchorCoord] || {});

  const HARI_LIST = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
  const BULAN_LIST = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  let count = 0;

  // 1. Seret Vertikal (ke bawah atau ke atas)
  if (a.col === c.col || Math.abs(c.row - a.row) >= Math.abs(cColIdx - aColIdx)) {
    const minRow = Math.min(a.row, c.row);
    const maxRow = Math.max(a.row, c.row);

    for (let r = minRow; r <= maxRow; r++) {
      if (r === a.row) continue;
      const targetCoord = `${a.col}${r}`;
      const diff = r - a.row;

      let nextVal = rawSource;

      // Formula Excel (=SUM, dll) - sesuaikan nomor baris
      if (String(rawSource).startsWith('=')) {
        nextVal = String(rawSource).replace(/([A-Z]+)([0-9]+)/g, (match, colName, rowNum) => {
          const newRowNum = Math.max(1, parseInt(rowNum, 10) + diff);
          return `${colName}${newRowNum}`;
        });
      }
      // Angka murni berurutan: 1, 2, 3...
      else if (/^-?[0-9]+$/.test(String(rawSource).trim())) {
        nextVal = String(parseInt(rawSource, 10) + diff);
      }
      // Pola teks bernomor: "1. Bangun Pagi" -> "2. Bangun Pagi"
      else if (/^([0-9]+)(\..*)$/.test(String(rawSource).trim())) {
        const m = String(rawSource).trim().match(/^([0-9]+)(\..*)$/);
        const nextNum = parseInt(m[1], 10) + diff;
        nextVal = `${nextNum}${m[2]}`;
      }
      // Nama hari berurutan: Senin, Selasa, Rabu...
      else if (HARI_LIST.includes(String(rawSource).trim())) {
        const idx = HARI_LIST.indexOf(String(rawSource).trim());
        const nextIdx = (idx + diff) % HARI_LIST.length;
        nextVal = HARI_LIST[nextIdx >= 0 ? nextIdx : nextIdx + HARI_LIST.length];
      }
      // Nama bulan berurutan
      else if (BULAN_LIST.includes(String(rawSource).trim())) {
        const idx = BULAN_LIST.indexOf(String(rawSource).trim());
        const nextIdx = (idx + diff) % BULAN_LIST.length;
        nextVal = BULAN_LIST[nextIdx >= 0 ? nextIdx : nextIdx + BULAN_LIST.length];
      }

      excelState.cells[targetCoord] = nextVal;
      if (Object.keys(sourceFmt).length > 0) {
        excelState.formats[targetCoord] = Object.assign({}, sourceFmt);
      }
      count++;
    }
  }
  // 2. Seret Horizontal (ke kanan atau ke kiri)
  else {
    const minColIdx = Math.min(aColIdx, cColIdx);
    const maxColIdx = Math.max(aColIdx, cColIdx);

    for (let cIdx = minColIdx; cIdx <= maxColIdx; cIdx++) {
      if (cIdx === aColIdx) continue;
      const targetCol = excelState.cols[cIdx];
      const targetCoord = `${targetCol}${a.row}`;
      const diff = cIdx - aColIdx;

      let nextVal = rawSource;

      if (String(rawSource).startsWith('=')) {
        nextVal = String(rawSource).replace(/([A-Z]+)([0-9]+)/g, (match, colName, rowNum) => {
          const oldColIdx = excelState.cols.indexOf(colName);
          if (oldColIdx !== -1 && oldColIdx + diff >= 0 && oldColIdx + diff < excelState.cols.length) {
            return `${excelState.cols[oldColIdx + diff]}${rowNum}`;
          }
          return match;
        });
      } else if (/^-?[0-9]+$/.test(String(rawSource).trim())) {
        nextVal = String(parseInt(rawSource, 10) + diff);
      } else if (HARI_LIST.includes(String(rawSource).trim())) {
        const idx = HARI_LIST.indexOf(String(rawSource).trim());
        const nextIdx = (idx + diff) % HARI_LIST.length;
        nextVal = HARI_LIST[nextIdx >= 0 ? nextIdx : nextIdx + HARI_LIST.length];
      } else if (BULAN_LIST.includes(String(rawSource).trim())) {
        const idx = BULAN_LIST.indexOf(String(rawSource).trim());
        const nextIdx = (idx + diff) % BULAN_LIST.length;
        nextVal = BULAN_LIST[nextIdx >= 0 ? nextIdx : nextIdx + BULAN_LIST.length];
      }

      excelState.cells[targetCoord] = nextVal;
      if (Object.keys(sourceFmt).length > 0) {
        excelState.formats[targetCoord] = Object.assign({}, sourceFmt);
      }
      count++;
    }
  }

  playSound('success');
  renderExcelGrid();
  renderExcelMiniChart();
  updateExcelStats();
  showToast(`Autofill berhasil mengisi ${count} sel secara berurutan! 🌟`, 'success');
}

// ==========================================
// FITUR RESIZE KOLOM & BARIS (MELEBARKAN & MENINGGIKAN)
// ==========================================
function startColResize(col, event) {
  event.stopPropagation();
  event.preventDefault();
  excelState.isResizingCol = true;
  excelState.resizeColLetter = col;
  excelState.resizeColStartX = event.clientX;
  const curW = excelState.colWidths[col] || (col === 'B' ? 220 : (col === 'A' ? 48 : 88));
  excelState.resizeColStartWidth = curW;
  document.body.style.cursor = 'col-resize';
  showResizeTooltip(event.clientX, event.clientY, `Lebar Kolom ${col}: ${curW}px ↔`);
}

function startRowResize(row, event) {
  event.stopPropagation();
  event.preventDefault();
  excelState.isResizingRow = true;
  excelState.resizeRowNumber = row;
  excelState.resizeRowStartY = event.clientY;
  const curH = excelState.rowHeights[row] || 28;
  excelState.resizeRowStartHeight = curH;
  document.body.style.cursor = 'row-resize';
  showResizeTooltip(event.clientX, event.clientY, `Tinggi Baris ${row}: ${curH}px ↕`);
}

function applyLiveColWidth(col, width) {
  document.querySelectorAll(`[data-col="${col}"]`).forEach(el => {
    el.style.width = `${width}px`;
    el.style.minWidth = `${width}px`;
    el.style.maxWidth = `${width}px`;
  });
}

function applyLiveRowHeight(row, height) {
  const rowEl = document.getElementById(`excel-row-${row}`);
  if (rowEl) {
    rowEl.style.height = `${height}px`;
    const tdRow = rowEl.querySelector('td.excel-sticky-row');
    if (tdRow) tdRow.style.height = `${height}px`;
  }
}

function showResizeTooltip(x, y, text) {
  let tip = document.getElementById('excel-resize-tip');
  if (!tip) {
    tip = document.createElement('div');
    tip.id = 'excel-resize-tip';
    tip.className = 'excel-resize-tooltip';
    document.body.appendChild(tip);
  }
  tip.innerText = text;
  tip.style.left = `${x + 14}px`;
  tip.style.top = `${y - 28}px`;
  tip.classList.remove('hidden');
}

function hideResizeTooltip() {
  const tip = document.getElementById('excel-resize-tip');
  if (tip) tip.classList.add('hidden');
}

function autoFitColWidth(col, event) {
  if (event) event.stopPropagation();
  let maxLen = col.length;
  for (let r = 1; r <= excelState.rowCount; r++) {
    const raw = excelState.cells[`${col}${r}`] || '';
    const computed = evaluasiRumusExcel(raw);
    const display = formatTampilanNilai(`${col}${r}`, computed);
    const len = String(display).length;
    if (len > maxLen) maxLen = len;
  }
  const optimalW = Math.max(50, Math.min(480, maxLen * 8.5 + 32));
  excelState.colWidths[col] = Math.round(optimalW);
  renderExcelGrid();
  showToast(`Lebar kolom ${col} disesuaikan otomatis (Auto-fit): ${excelState.colWidths[col]}px ↔️`, 'success');
}

function resetRowHeight(row, event) {
  if (event) event.stopPropagation();
  delete excelState.rowHeights[row];
  renderExcelGrid();
  showToast(`Tinggi baris ${row} dikembalikan ke default (28px) ↕️`);
}

function handleColHeaderMouseDown(col, event) {
  if (event.target.classList.contains('excel-col-resizer')) return;
  excelState.isMouseDown = true;
  excelState.normalSelecting = true;
  excelState.rangeSelectAnchor = `${col}1`;
  excelState.rangeSelectCurrent = `${col}${excelState.rowCount}`;
  pilihSelExcel(`${col}1`);
  highlightNormalRange(`${col}1`, `${col}${excelState.rowCount}`);
  updateRangeStatsBar(`${col}1`, `${col}${excelState.rowCount}`);
  showToast(`Seluruh Kolom ${col} dipilih (Blok Kolom) ⬇️`);
}

function handleRowHeaderMouseDown(row, event) {
  if (event.target.classList.contains('excel-row-resizer')) return;
  const lastCol = excelState.cols[excelState.cols.length - 1];
  excelState.isMouseDown = true;
  excelState.normalSelecting = true;
  excelState.rangeSelectAnchor = `A${row}`;
  excelState.rangeSelectCurrent = `${lastCol}${row}`;
  pilihSelExcel(`A${row}`);
  highlightNormalRange(`A${row}`, `${lastCol}${row}`);
  updateRangeStatsBar(`A${row}`, `${lastCol}${row}`);
  showToast(`Seluruh Baris ${row} dipilih (Blok Baris) ➡️`);
}

function pilihSelExcel(coord) {
  if (excelState.isEditing && excelState.activeCell !== coord) {
    terapkanFormulaExcel(false);
  }
  excelState.activeCell = coord;
  excelState.isEditing = false;
  excelState.savedValBeforeEdit = null;
  excelState.formulaSelectAnchor = null;
  excelState.formulaSelectCurrent = null;

  if (formatPainterActive && formatPainterSavedFormat) {
    excelState.formats[coord] = Object.assign({}, formatPainterSavedFormat);
    formatPainterActive = false;
    showToast(`Format sel disalin ke ${coord}! ✨`, 'success');
  }

  const coordInput = document.getElementById('excel-cell-coord');
  if (coordInput) coordInput.value = coord;

  const formulaInput = document.getElementById('excel-formula-input');
  if (formulaInput) {
    formulaInput.value = excelState.cells[coord] || '';
  }

  const statusSel = document.getElementById('excel-status-sel');
  if (statusSel) statusSel.innerText = `Sel: ${coord}`;

  // Sinkronkan toolbar ribbon dengan format sel aktif
  const fmt = excelState.formats[coord] || {};
  const fontFamilySel = document.getElementById('excel-font-family');
  if (fontFamilySel && fmt.fontFamily) {
    fontFamilySel.value = fmt.fontFamily;
  }
  const fontSizeSel = document.getElementById('excel-font-size');
  if (fontSizeSel && fmt.fontSize) {
    fontSizeSel.value = String(fmt.fontSize);
  }
  const fillIndicator = document.getElementById('excel-fill-indicator');
  if (fillIndicator) {
    fillIndicator.style.backgroundColor = fmt.bg || '#facc15';
  }
  const fontIndicator = document.getElementById('excel-font-indicator');
  if (fontIndicator) {
    fontIndicator.style.backgroundColor = fmt.color || '#dc2626';
  }

  highlightFormulaReferences('');
  renderExcelGrid();
}

function handleCellClick(coord, event) {
  if (excelState.formulaSelectAnchor !== null) {
    return;
  }

  if (excelState.isEditing) {
    if (coord === excelState.activeCell) {
      return;
    }
    const currentFormula = getCurrentEditingFormula();
    if (isFormulaExpectingReference(currentFormula)) {
      return;
    }
    terapkanFormulaExcel(false);
    pilihSelExcel(coord);
    return;
  }

  // Jika klik pada sel yang sudah aktif, masuk mode edit langsung (seperti MS Excel)
  if (coord === excelState.activeCell) {
    editLangsungSelExcel(coord);
    return;
  }

  pilihSelExcel(coord);
}

function editLangsungSelExcel(coord) {
  if (coord) excelState.activeCell = coord;
  excelState.savedValBeforeEdit = excelState.cells[excelState.activeCell] || '';
  excelState.isEditing = true;
  excelState.cursorAtEnd = true;

  const formulaInput = document.getElementById('excel-formula-input');
  if (formulaInput) {
    formulaInput.value = excelState.cells[excelState.activeCell] || '';
  }

  renderExcelGrid();
  highlightFormulaReferences(excelState.cells[excelState.activeCell] || '');
}

function mulaiKetikLangsungSel(coord, initialChar) {
  if (coord) excelState.activeCell = coord;
  excelState.savedValBeforeEdit = excelState.cells[excelState.activeCell] || '';
  excelState.cells[excelState.activeCell] = initialChar !== undefined ? initialChar : (excelState.cells[excelState.activeCell] || '');
  excelState.isEditing = true;
  excelState.cursorAtEnd = true;

  const formulaInput = document.getElementById('excel-formula-input');
  if (formulaInput) {
    formulaInput.value = excelState.cells[excelState.activeCell];
  }

  renderExcelGrid();
  highlightFormulaReferences(excelState.cells[excelState.activeCell]);
}

function handleInlineInputChange(val) {
  excelState.cells[excelState.activeCell] = val;
  const formulaInput = document.getElementById('excel-formula-input');
  if (formulaInput) {
    formulaInput.value = val;
  }
  highlightFormulaReferences(val);
}

function handleInlineInputKey(event) {
  if (event.key === 'Enter') {
    event.preventDefault();
    terapkanFormulaExcel(true);
  } else if (event.key === 'Tab') {
    event.preventDefault();
    terapkanFormulaExcel(false);
    navigasiSelExcel('right');
  } else if (event.key === 'Escape') {
    event.preventDefault();
    batalkanFormulaExcel();
  }
}

function handleInlineInputBlur() {
  setTimeout(() => {
    if (excelState.isEditing) {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.id === 'excel-formula-input' || activeEl.id === 'excel-inline-input')) {
        return;
      }
      if (excelState.formulaSelecting || excelState.formulaSelectAnchor !== null) {
        return;
      }
      terapkanFormulaExcel(false);
    }
  }, 220);
}

function handleFormulaInputFocus() {
  const fi = document.getElementById('excel-formula-input');
  if (fi) {
    highlightFormulaReferences(fi.value);
  }
}

function handleFormulaInputChange(val) {
  excelState.cells[excelState.activeCell] = val;
  const inlineInput = document.getElementById('excel-inline-input');
  if (inlineInput) {
    inlineInput.value = val;
  } else {
    const cellEl = document.getElementById(`excel-cell-${excelState.activeCell}`);
    if (cellEl) {
      cellEl.innerText = val !== '' ? val : '';
    }
  }
  highlightFormulaReferences(val);
  renderExcelMiniChart();
  updateExcelStats();
}

function handleFormulaInputKey(event) {
  if (event.key === 'Enter') {
    event.preventDefault();
    terapkanFormulaExcel(true);
  } else if (event.key === 'Escape') {
    event.preventDefault();
    batalkanFormulaExcel();
  }
}

function terapkanFormulaExcel(pindahBawah = true) {
  const coord = excelState.activeCell;
  const inlineInput = document.getElementById('excel-inline-input');
  const formulaInput = document.getElementById('excel-formula-input');

  let val = '';
  if (inlineInput) {
    val = inlineInput.value;
  } else if (formulaInput) {
    val = formulaInput.value;
  } else {
    val = excelState.cells[coord] || '';
  }

  // Jika berupa rumus diawali =, lakukan auto-close kurung jika belum lengkap (seperti pada Microsoft Excel)
  if (String(val).startsWith('=')) {
    let strVal = String(val).trim();
    const openCount = (strVal.match(/\(/g) || []).length;
    const closeCount = (strVal.match(/\)/g) || []).length;
    if (openCount > closeCount) {
      strVal = strVal + ')'.repeat(openCount - closeCount);
      val = strVal;
    }
  }

  excelState.cells[coord] = val;
  excelState.isEditing = false;
  excelState.savedValBeforeEdit = null;
  excelState.formulaSelectAnchor = null;
  excelState.formulaSelectCurrent = null;
  excelState.rangeSelectAnchor = null;
  excelState.rangeSelectCurrent = null;

  document.querySelectorAll('.excel-formula-range-active, .excel-range-selected').forEach(el => {
    el.classList.remove('excel-formula-range-active', 'excel-range-selected');
  });

  playSound('click');

  if (String(val).startsWith('=')) {
    const hasil = evaluasiRumusExcel(val);
    showToast(`Rumus ${val} di sel ${coord} = ${hasil} ✨`, 'success');
  }

  renderExcelGrid();
  renderExcelMiniChart();
  updateExcelStats();

  if (pindahBawah) {
    const cur = parseCellCoord(coord);
    if (cur && cur.row < excelState.rowCount) {
      pilihSelExcel(`${cur.col}${cur.row + 1}`);
    }
  }
}

function batalkanFormulaExcel() {
  const coord = excelState.activeCell;
  if (excelState.savedValBeforeEdit !== null && excelState.savedValBeforeEdit !== undefined) {
    excelState.cells[coord] = excelState.savedValBeforeEdit;
  }
  excelState.isEditing = false;
  excelState.savedValBeforeEdit = null;
  excelState.formulaSelectAnchor = null;
  excelState.formulaSelectCurrent = null;
  excelState.rangeSelectAnchor = null;
  excelState.rangeSelectCurrent = null;

  document.querySelectorAll('.excel-formula-range-active, .excel-range-selected').forEach(el => {
    el.classList.remove('excel-formula-range-active', 'excel-range-selected');
  });

  const formulaInput = document.getElementById('excel-formula-input');
  if (formulaInput) {
    formulaInput.value = excelState.cells[coord] || '';
  }

  showToast('Pengeditan sel dibatalkan');
  renderExcelGrid();
}

function navigasiSelExcel(arah) {
  const cur = parseCellCoord(excelState.activeCell);
  if (!cur) return;
  const colIndex = excelState.cols.indexOf(cur.col);

  let newCol = cur.col;
  let newRow = cur.row;

  if (arah === 'up' && newRow > 1) newRow--;
  if (arah === 'down' && newRow < excelState.rowCount) newRow++;
  if (arah === 'left' && colIndex > 0) newCol = excelState.cols[colIndex - 1];
  if (arah === 'right' && colIndex < excelState.cols.length - 1) newCol = excelState.cols[colIndex + 1];

  pilihSelExcel(`${newCol}${newRow}`);
}

let excelKeyboardListenerAttached = false;
function attachExcelKeyboardListener() {
  if (excelKeyboardListenerAttached) return;
  excelKeyboardListenerAttached = true;

  // Global mousemove listener untuk dragging resize kolom & baris
  window.addEventListener('mousemove', function(event) {
    if (excelState.isResizingCol) {
      const deltaX = event.clientX - excelState.resizeColStartX;
      const newWidth = Math.max(35, Math.min(600, excelState.resizeColStartWidth + deltaX));
      excelState.colWidths[excelState.resizeColLetter] = newWidth;
      applyLiveColWidth(excelState.resizeColLetter, newWidth);
      showResizeTooltip(event.clientX, event.clientY, `Lebar Kolom ${excelState.resizeColLetter}: ${newWidth}px ↔`);
    } else if (excelState.isResizingRow) {
      const deltaY = event.clientY - excelState.resizeRowStartY;
      const newHeight = Math.max(22, Math.min(300, excelState.resizeRowStartHeight + deltaY));
      excelState.rowHeights[excelState.resizeRowNumber] = newHeight;
      applyLiveRowHeight(excelState.resizeRowNumber, newHeight);
      showResizeTooltip(event.clientX, event.clientY, `Tinggi Baris ${excelState.resizeRowNumber}: ${newHeight}px ↕`);
    }
  });

  // Global mouseup listener untuk drag range selection, autofill, dan resize
  window.addEventListener('mouseup', function(event) {
    if (excelState.isResizingCol) {
      const col = excelState.resizeColLetter;
      const w = excelState.colWidths[col];
      excelState.isResizingCol = false;
      document.body.style.cursor = '';
      hideResizeTooltip();
      renderExcelGrid();
      showToast(`Lebar kolom ${col} berhasil diubah: ${w} piksel ↔️`);
    }
    if (excelState.isResizingRow) {
      const r = excelState.resizeRowNumber;
      const h = excelState.rowHeights[r];
      excelState.isResizingRow = false;
      document.body.style.cursor = '';
      hideResizeTooltip();
      renderExcelGrid();
      showToast(`Tinggi baris ${r} berhasil diubah: ${h} piksel ↕️`);
    }
    if (excelState.isMouseDown || excelState.isAutofilling) {
      handleGridMouseUp(event);
    }
  });

  // Global click listener untuk menutup palet warna & context menu jika klik di luar
  document.addEventListener('click', function(event) {
    tutupExcelContextMenu();
    const fillPicker = document.getElementById('excel-fill-picker');
    const fontPicker = document.getElementById('excel-font-picker');
    const fillBtn = event.target.closest('#excel-fill-picker-btn');
    const fontBtn = event.target.closest('#excel-font-picker-btn');

    if (fillPicker && !fillPicker.classList.contains('hidden')) {
      if (!fillPicker.contains(event.target) && !fillBtn) {
        fillPicker.classList.add('hidden');
      }
    }
    if (fontPicker && !fontPicker.classList.contains('hidden')) {
      if (!fontPicker.contains(event.target) && !fontBtn) {
        fontPicker.classList.add('hidden');
      }
    }
  });

  window.addEventListener('keydown', function(event) {
    if (state.currentTab !== 'msexcel') return;

    const activeEl = document.activeElement;
    const isFormulaInput = activeEl && activeEl.id === 'excel-formula-input';
    const isInlineInput = activeEl && activeEl.id === 'excel-inline-input';

    if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA') && !isFormulaInput && !isInlineInput) {
      return;
    }

    if (excelState.isEditing || isInlineInput) {
      return;
    }

    if (isFormulaInput) {
      return;
    }

    if (event.key === 'Escape') {
      tutupExcelContextMenu();
      const win = document.getElementById('excel-main-window');
      if (win && win.classList.contains('excel-fullscreen-mode')) {
        event.preventDefault();
        toggleExcelFullscreen(false);
        return;
      }
    }

    // Shortcut Keyboard Kombinasi Ctrl (Copy, Paste, Cut, Select All, Bold, dll)
    if (event.ctrlKey || event.metaKey) {
      const k = event.key.toLowerCase();
      if (k === 'c') {
        event.preventDefault();
        salinSelExcel();
        return;
      } else if (k === 'v') {
        event.preventDefault();
        tempelSelExcel();
        return;
      } else if (k === 'x') {
        event.preventDefault();
        potongSelExcel();
        return;
      } else if (k === 'a') {
        event.preventDefault();
        pilihSemuaSelExcel();
        return;
      } else if (k === 'b') {
        event.preventDefault();
        formatExcelSel('bold');
        return;
      } else if (k === 'i') {
        event.preventDefault();
        formatExcelSel('italic');
        return;
      } else if (k === 'u') {
        event.preventDefault();
        formatExcelSel('underline');
        return;
      }
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      navigasiSelExcel('up');
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      navigasiSelExcel('down');
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      navigasiSelExcel('left');
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      navigasiSelExcel('right');
    } else if (event.key === 'Enter' || event.key === 'F2') {
      event.preventDefault();
      editLangsungSelExcel(excelState.activeCell);
    } else if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      hapusIsiSelExcel(true);
    } else if (event.key.length === 1 && !event.ctrlKey && !event.altKey && !event.metaKey) {
      event.preventDefault();
      mulaiKetikLangsungSel(excelState.activeCell, event.key);
    }
  });
}

function getSelectedExcelCells() {
  if (excelState.rangeSelectAnchor && excelState.rangeSelectCurrent) {
    return getRectangularRange(excelState.rangeSelectAnchor, excelState.rangeSelectCurrent);
  }
  return [excelState.activeCell];
}

function formatExcelSel(type) {
  const cells = getSelectedExcelCells();
  cells.forEach(coord => {
    if (!excelState.formats[coord]) excelState.formats[coord] = {};
    const f = excelState.formats[coord];

    if (type === 'bold') f.bold = !f.bold;
    else if (type === 'italic') f.italic = !f.italic;
    else if (type === 'underline') f.underline = !f.underline;
    else if (type === 'align-left') f.align = 'left';
    else if (type === 'align-center') f.align = 'center';
    else if (type === 'align-right') f.align = 'right';
    else if (type === 'align-top') f.valign = 'top';
    else if (type === 'align-middle') f.valign = 'middle';
    else if (type === 'align-bottom') f.valign = 'bottom';
    else if (type === 'wrap-text') f.wrapText = !f.wrapText;
    else if (type === 'border-all') f.border = 'all';
    else if (type === 'border-none') delete f.border;
    else if (type === 'merge') {
      f.align = 'center';
      f.bold = true;
    }
  });

  playSound('click');
  renderExcelGrid();

  const msgMap = {
    'bold': `Format Tebal (Bold) diterapkan (${cells.length} sel)`,
    'italic': `Format Miring (Italic) diterapkan (${cells.length} sel)`,
    'underline': `Format Garis Bawah (Underline) diterapkan (${cells.length} sel)`,
    'border-all': `Garis tabel (All Borders) berhasil dibuat (${cells.length} sel)! ⊞`,
    'border-none': `Garis tabel dihapus (${cells.length} sel)`,
    'align-left': `Rata Kiri diterapkan (${cells.length} sel)`,
    'align-center': `Rata Tengah diterapkan (${cells.length} sel)`,
    'align-right': `Rata Kanan diterapkan (${cells.length} sel)`,
    'merge': `Sel digabungkan & Rata Tengah (Merge & Center)!`
  };
  showToast(msgMap[type] || 'Format diterapkan');
}

function potongSelExcel() {
  salinSelExcel();
  hapusIsiSelExcel(true);
  showToast(`Teks sel dipotong (Cut) ke Clipboard! ✂`);
}

let formatPainterActive = false;
let formatPainterSavedFormat = null;
function formatPainterExcel() {
  const coord = excelState.activeCell;
  formatPainterSavedFormat = Object.assign({}, excelState.formats[coord] || {});
  formatPainterActive = true;
  playSound('click');
  showToast('Format Painter Aktif! 🖌 Klik sel mana pun untuk menyalin format font, warna, dan perataan.', 'info');
}

function tambahFontSizeDelta(delta) {
  const cells = getSelectedExcelCells();
  let firstSize = 14;
  cells.forEach(coord => {
    if (!excelState.formats[coord]) excelState.formats[coord] = {};
    const curSize = parseInt(excelState.formats[coord].fontSize) || 14;
    const newSize = Math.max(8, Math.min(72, curSize + delta));
    excelState.formats[coord].fontSize = newSize;
    firstSize = newSize;
  });
  const sizeSelect = document.getElementById('excel-font-size');
  if (sizeSelect) sizeSelect.value = String(firstSize);
  playSound('click');
  renderExcelGrid();
  showToast(`Ukuran font diubah ke: ${firstSize}pt (${cells.length} sel)`);
}

function formatNumberExcelDropdown(val) {
  if (val === 'rupiah' || val === 'accounting') {
    formatAngkaExcel('rupiah');
  } else if (val === 'persen') {
    formatAngkaExcel('persen');
  } else if (val === 'ribuan') {
    formatAngkaExcel('ribuan');
  } else if (val === 'general') {
    const cells = getSelectedExcelCells();
    cells.forEach(coord => {
      if (excelState.formats[coord]) delete excelState.formats[coord].numFormat;
    });
    renderExcelGrid();
    showToast(`Format General (Umum) diterapkan (${cells.length} sel)`);
  } else {
    showToast(`Format ${val} diterapkan`);
  }
}

function ubahFontFamilyExcel(font) {
  const cells = getSelectedExcelCells();
  cells.forEach(coord => {
    if (!excelState.formats[coord]) excelState.formats[coord] = {};
    excelState.formats[coord].fontFamily = font;
  });
  playSound('click');
  renderExcelGrid();
  showToast(`Jenis huruf diubah ke: ${font.split(',')[0]} (${cells.length} sel)`, 'success');
}

function ubahFontSizeExcel(size) {
  const numSize = parseInt(size) || 14;
  const cells = getSelectedExcelCells();
  cells.forEach(coord => {
    if (!excelState.formats[coord]) excelState.formats[coord] = {};
    excelState.formats[coord].fontSize = numSize;
  });
  playSound('click');
  renderExcelGrid();
  showToast(`Ukuran font diubah ke: ${numSize}pt (${cells.length} sel)`, 'success');
}

function bukaExcelColorPalette(type) {
  const picker = document.getElementById(type === 'fill' ? 'excel-fill-picker' : 'excel-font-picker');
  const otherPicker = document.getElementById(type === 'fill' ? 'excel-font-picker' : 'excel-fill-picker');
  if (otherPicker) otherPicker.classList.add('hidden');
  if (picker) {
    picker.classList.toggle('hidden');
  }
}

function beriWarnaLatarSelExcel(color) {
  const cells = getSelectedExcelCells();
  cells.forEach(coord => {
    if (!excelState.formats[coord]) excelState.formats[coord] = {};
    if (color) {
      excelState.formats[coord].bg = color;
    } else {
      delete excelState.formats[coord].bg;
    }
  });

  const indicator = document.getElementById('excel-fill-indicator');
  if (indicator) indicator.style.backgroundColor = color || '#facc15';

  document.getElementById('excel-fill-picker')?.classList.add('hidden');
  playSound('click');
  renderExcelGrid();
  showToast(color ? `Warna latar diterapkan (${cells.length} sel)! 🎨` : `Warna latar dihapus (${cells.length} sel)`, 'success');
}

function beriWarnaHurufExcel(color) {
  const cells = getSelectedExcelCells();
  cells.forEach(coord => {
    if (!excelState.formats[coord]) excelState.formats[coord] = {};
    if (color) {
      excelState.formats[coord].color = color;
    } else {
      delete excelState.formats[coord].color;
    }
  });

  const indicator = document.getElementById('excel-font-indicator');
  if (indicator) indicator.style.backgroundColor = color || '#dc2626';

  document.getElementById('excel-font-picker')?.classList.add('hidden');
  playSound('click');
  renderExcelGrid();
  showToast(color ? `Warna teks diterapkan (${cells.length} sel)!` : `Warna teks otomatis (${cells.length} sel)`, 'success');
}

function formatAngkaExcel(type) {
  const cells = getSelectedExcelCells();
  cells.forEach(coord => {
    if (!excelState.formats[coord]) excelState.formats[coord] = {};
    const f = excelState.formats[coord];
    if (type === 'rupiah') {
      f.numFormat = 'rupiah';
      f.align = 'right';
    } else if (type === 'persen') {
      f.numFormat = 'persen';
      f.align = 'center';
    } else if (type === 'ribuan') {
      f.numFormat = 'ribuan';
      f.align = 'right';
    }
  });
  if (type === 'tambah-desimal') {
    showToast('Format desimal diperluas (.00)');
  } else if (type === 'kurang-desimal') {
    showToast('Format desimal disederhanakan (.0)');
  } else {
    showToast(`Format ${type} diterapkan (${cells.length} sel)`);
  }
  playSound('click');
  renderExcelGrid();
}

function masukkanAutoSumExcel(funcName = 'SUM') {
  const coord = excelState.activeCell;
  const cur = parseCellCoord(coord);
  if (!cur) return;

  // Deteksi cerdas: jika ada angka di kiri (misal C2:H2), gunakan baris.
  // Jika ada angka di atas (misal C2:C8), gunakan kolom.
  let rangeStr = '';
  if (cur.col !== 'A') {
    // Cek sel di sebelah kiri
    const leftCol = String.fromCharCode(cur.col.charCodeAt(0) - 1);
    rangeStr = `C${cur.row}:${leftCol}${cur.row}`;
  } else {
    rangeStr = `A1:A${cur.row - 1}`;
  }

  // Jika sel berada di baris total bawah (misal baris 9 atau baris 7)
  if (cur.row >= 7) {
    rangeStr = `${cur.col}2:${cur.col}${cur.row - 1}`;
  }

  const formulaStr = `=${funcName}(${rangeStr})`;
  excelState.cells[coord] = formulaStr;

  const formulaInput = document.getElementById('excel-formula-input');
  if (formulaInput) formulaInput.value = formulaStr;

  playSound('success');
  showToast(`Rumus ${formulaStr} berhasil disisipkan! ✨`, 'success');

  renderExcelGrid();
  renderExcelMiniChart();
  updateExcelStats();
}

function hapusIsiSelExcel(onlyContents = true) {
  const cells = getSelectedExcelCells();
  if (cells.length === 0) return;

  cells.forEach(coord => {
    delete excelState.cells[coord];
    if (!onlyContents) {
      delete excelState.formats[coord];
    }
  });

  const formulaInput = document.getElementById('excel-formula-input');
  if (formulaInput && cells.includes(excelState.activeCell)) {
    formulaInput.value = '';
  }

  const inlineInput = document.getElementById('excel-inline-input');
  if (inlineInput && cells.includes(excelState.activeCell)) {
    inlineInput.value = '';
  }

  playSound('trash');
  renderExcelGrid();
  renderExcelMiniChart();
  updateExcelStats();

  const msg = onlyContents
    ? (cells.length === 1 ? `Isi sel ${cells[0]} berhasil dihapus (Delete) 🗑️` : `Isi ${cells.length} sel berhasil dihapus (Delete) 🗑️`)
    : `Semua isi & format ${cells.length} sel berhasil dibersihkan! 🧹`;
  showToast(msg);
}

function resetTabelExcel() {
  if (confirm('Apakah kamu yakin ingin mengembalikan tabel ke bentuk awal template?')) {
    muatTemplateExcel(excelState.activeTemplate);
  }
}

function switchExcelRibbonTab(tabName) {
  const allTabs = ['file', 'home', 'insert', 'pagelayout', 'formulas', 'data', 'review', 'view', 'developer', 'help'];
  allTabs.forEach(t => {
    const btn = document.getElementById(`excel-tab-${t}`);
    const content = document.getElementById(`excel-ribbon-content-${t}`);
    if (btn) {
      if (t === tabName) {
        btn.className = 'excel-ribbon-tab-btn active-tab';
      } else {
        btn.className = 'excel-ribbon-tab-btn';
      }
    }
    if (content) {
      if (t === tabName) content.classList.remove('hidden');
      else content.classList.add('hidden');
    }
  });
  playSound('click');
  if (tabName !== 'home' && tabName !== 'file') {
    showToast(`Tab ${tabName.toUpperCase()} aktif! Tab Home berisi perlengkapan utama Microsoft Excel.`, 'info');
  }
}

function renderExcelMiniChart() {
  const chartBox = document.getElementById('excel-chart-container');
  if (!chartBox) return;

  const tpl = EXCEL_TEMPLATES[excelState.activeTemplate] || EXCEL_TEMPLATES.checklist_karakter;
  const labelCol = tpl.chartLabelCol || 'B';
  const valCol = tpl.chartValCol || 'I';
  const maxVal = tpl.maxVal || 100;

  // Baca data baris 2 sampai batas template (abaikan baris total dan baris kosong di bawah)
  const items = [];
  const limitRow = tpl.rowCount ? tpl.rowCount - 1 : 8;

  for (let r = 2; r <= limitRow; r++) {
    const labelCell = `${labelCol}${r}`;
    const valCell = `${valCol}${r}`;
    const rawLabel = excelState.cells[labelCell] || `Data ${r}`;
    const rawVal = excelState.cells[valCell] || 0;
    const computedVal = evaluasiRumusExcel(rawVal);
    const num = parseFloat(String(computedVal).replace(/[^0-9.-]/g, '')) || 0;

    items.push({
      label: rawLabel.replace(/^[0-9]+\.\s*/, ''), // potong nomor depan agar rapi
      val: num,
      formatted: formatTampilanNilai(valCell, computedVal)
    });
  }

  const colors = [
    'from-emerald-500 to-teal-500',
    'from-blue-500 to-indigo-500',
    'from-amber-500 to-orange-500',
    'from-purple-500 to-pink-500',
    'from-rose-500 to-red-500',
    'from-teal-500 to-cyan-500',
    'from-indigo-500 to-blue-600'
  ];

  let html = `<div class="text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
    <span>${tpl.chartTitle}</span>
    <span class="text-[10px] text-emerald-600 font-mono">Max Skala: ${maxVal.toLocaleString('id-ID')}</span>
  </div>
  <div class="space-y-2">`;

  items.forEach((item, idx) => {
    const pct = Math.min(Math.max((item.val / maxVal) * 100, 4), 100);
    const grad = colors[idx % colors.length];

    html += `<div>
      <div class="flex justify-between items-center text-[10px] text-slate-600 mb-0.5 font-medium">
        <span class="truncate max-w-[170px]" title="${item.label}">${item.label}</span>
        <span class="font-mono font-bold text-slate-800 ml-1">${item.formatted || item.val}</span>
      </div>
      <div class="w-full bg-slate-200/80 rounded-full h-2.5 overflow-hidden shadow-inner">
        <div class="bg-gradient-to-r ${grad} h-2.5 rounded-full transition-all duration-500 shadow-sm" style="width: ${pct}%"></div>
      </div>
    </div>`;
  });

  html += `</div>`;
  chartBox.innerHTML = html;
}

function updateExcelStats() {
  const tpl = EXCEL_TEMPLATES[excelState.activeTemplate] || EXCEL_TEMPLATES.checklist_karakter;
  const valCol = tpl.chartValCol || 'I';
  const limitRow = tpl.rowCount ? tpl.rowCount - 1 : 8;

  let count = 0;
  let sum = 0;
  let max = -Infinity;
  let min = Infinity;

  for (let r = 2; r <= limitRow; r++) {
    const coord = `${valCol}${r}`;
    const raw = excelState.cells[coord];
    if (raw !== undefined && raw !== null && raw !== '') {
      const computed = evaluasiRumusExcel(raw);
      const num = parseFloat(String(computed).replace(/[^0-9.-]/g, ''));
      if (!isNaN(num)) {
        count++;
        sum += num;
        if (num > max) max = num;
        if (num < min) min = num;
      }
    }
  }

  const avg = count > 0 ? (sum / count) : 0;
  const isRp = tpl.formats && Object.values(tpl.formats).some(f => f.numFormat === 'rupiah');

  const fmt = val => isRp ? 'Rp ' + Math.round(val).toLocaleString('id-ID') : val.toLocaleString('id-ID');

  const countEl = document.getElementById('excel-stat-count');
  if (countEl) countEl.innerText = `${count} Data Terhitung`;

  const sumEl = document.getElementById('excel-stat-sum');
  if (sumEl) sumEl.innerText = fmt(sum);

  const avgEl = document.getElementById('excel-stat-avg');
  if (avgEl) avgEl.innerText = fmt(Number.isInteger(avg) ? avg : parseFloat(avg.toFixed(1)));

  const maxEl = document.getElementById('excel-stat-max');
  if (maxEl) maxEl.innerText = max === -Infinity ? '0' : fmt(max);

  const minEl = document.getElementById('excel-stat-min');
  if (minEl) minEl.innerText = min === Infinity ? '0' : fmt(min);
}

function unduhFileExcel() {
  playSound('success');
  const tpl = EXCEL_TEMPLATES[excelState.activeTemplate] || EXCEL_TEMPLATES.checklist_karakter;
  
  // Buat isi CSV dengan delimiter ; (titik koma agar kompatibel dengan Excel di Windows Indonesia/Eropa)
  let csvContent = '\uFEFF'; // UTF-8 BOM agar aksen dan karakter Indonesia tidak rusak
  
  for (let r = 1; r <= excelState.rowCount; r++) {
    const rowValues = [];
    excelState.cols.forEach(col => {
      const coord = `${col}${r}`;
      const raw = excelState.cells[coord] || '';
      const computed = evaluasiRumusExcel(raw);
      const display = formatTampilanNilai(coord, computed);
      // Escape petik dua
      const escaped = String(display).replace(/"/g, '""');
      rowValues.push(`"${escaped}"`);
    });
    csvContent += rowValues.join(';') + '\r\n';
  }

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const filename = tpl.fileName.replace('.xlsx', '.csv');
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  beriPoinPraktik('excel', `Buku kerja "${filename}" berhasil diunduh ke komputermu!`);
}

function cetakLembarExcel() {
  playSound('click');
  window.print();
}

function salinSelExcel() {
  const cells = getSelectedExcelCells();
  if (cells.length === 0) return;

  const coords = cells.map(parseCellCoord).filter(Boolean);
  let minColIdx = Infinity, maxColIdx = -Infinity, minRow = Infinity, maxRow = -Infinity;
  coords.forEach(c => {
    const colIdx = excelState.cols.indexOf(c.col);
    if (colIdx < minColIdx) minColIdx = colIdx;
    if (colIdx > maxColIdx) maxColIdx = colIdx;
    if (c.row < minRow) minRow = c.row;
    if (c.row > maxRow) maxRow = c.row;
  });

  const textRows = [];
  for (let r = minRow; r <= maxRow; r++) {
    const rowVals = [];
    for (let c = minColIdx; c <= maxColIdx; c++) {
      const colLetter = excelState.cols[c];
      const coord = `${colLetter}${r}`;
      const rawVal = excelState.cells[coord];
      const valStr = rawVal !== undefined && rawVal !== null ? String(rawVal) : '';
      rowVals.push(valStr);
    }
    textRows.push(rowVals.join('\t'));
  }

  const tsvText = textRows.join('\n');
  excelState.clipboardVal = (cells.length === 1) ? (excelState.cells[cells[0]] || '') : tsvText;
  excelState.clipboardCells = [...cells];

  // Tulis ke clipboard OS (agar bisa dipaste di Microsoft Word, Notepad, dll)
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(excelState.clipboardVal).catch(() => {});
  }

  playSound('click');
  renderExcelGrid();

  const label = cells.length === 1 ? `Sel ${cells[0]}` : `${cells.length} sel`;
  showToast(`Teks ${label} berhasil disalin (Copy) ke Clipboard! 📋`, 'success');
}

async function tempelSelExcel() {
  let text = '';
  // Coba baca dari sistem clipboard jika peramban mengizinkan
  if (navigator.clipboard && navigator.clipboard.readText) {
    try {
      text = await navigator.clipboard.readText();
    } catch (e) {
      text = excelState.clipboardVal || '';
    }
  } else {
    text = excelState.clipboardVal || '';
  }

  if (!text && excelState.clipboardVal) {
    text = excelState.clipboardVal;
  }

  if (!text) {
    showToast('Clipboard kosong. Silakan salin (Copy) sel terlebih dahulu.', 'info');
    return;
  }

  const startCoord = parseCellCoord(excelState.activeCell);
  if (!startCoord) return;
  const startColIdx = excelState.cols.indexOf(startCoord.col);
  const startRow = startCoord.row;

  const rows = text.replace(/\r/g, '').split('\n');
  if (rows.length > 1 && rows[rows.length - 1] === '') {
    rows.pop();
  }

  let pastedCount = 0;
  const selectedCells = getSelectedExcelCells();
  if (rows.length === 1 && !rows[0].includes('\t') && selectedCells.length > 1) {
    selectedCells.forEach(coord => {
      excelState.cells[coord] = rows[0];
      pastedCount++;
    });
  } else {
    rows.forEach((rowStr, rIdx) => {
      const targetRow = startRow + rIdx;
      if (targetRow > excelState.rowCount) return;
      const cols = rowStr.split('\t');
      cols.forEach((colVal, cIdx) => {
        const targetColIdx = startColIdx + cIdx;
        if (targetColIdx >= excelState.cols.length) return;
        const targetCol = excelState.cols[targetColIdx];
        const coord = `${targetCol}${targetRow}`;
        excelState.cells[coord] = colVal;
        pastedCount++;
      });
    });
  }

  playSound('click');
  renderExcelGrid();
  renderExcelMiniChart();
  updateExcelStats();

  const formulaInput = document.getElementById('excel-formula-input');
  if (formulaInput) {
    formulaInput.value = excelState.cells[excelState.activeCell] || '';
  }

  showToast(`Teks berhasil ditempel (Paste) ke ${pastedCount} sel! 📋✨`, 'success');
}

function pilihSemuaSelExcel() {
  const lastCol = excelState.cols[excelState.cols.length - 1];
  const lastRow = excelState.rowCount;
  excelState.activeCell = 'A1';
  excelState.rangeSelectAnchor = 'A1';
  excelState.rangeSelectCurrent = `${lastCol}${lastRow}`;
  excelState.isEditing = false;
  highlightNormalRange('A1', `${lastCol}${lastRow}`);
  updateRangeStatsBar('A1', `${lastCol}${lastRow}`);
  renderExcelGrid();
  showToast(`Seluruh lembar kerja dipilih (${excelState.cols.length * lastRow} sel) 📑`);
}

function handleCellContextMenu(coord, event) {
  event.preventDefault();
  const selectedCells = getSelectedExcelCells();
  if (!selectedCells.includes(coord)) {
    pilihSelExcel(coord);
  }

  const menu = document.getElementById('excel-context-menu');
  if (!menu) return;

  menu.style.left = `${Math.min(event.clientX, window.innerWidth - 210)}px`;
  menu.style.top = `${Math.min(event.clientY, window.innerHeight - 280)}px`;
  menu.classList.remove('hidden');
}

function tutupExcelContextMenu() {
  const menu = document.getElementById('excel-context-menu');
  if (menu) menu.classList.add('hidden');
}

function undoExcelAction() {
  showToast('Fitur Undo siap!');
}

function redoExcelAction() {
  showToast('Fitur Redo siap!');
}

function toggleExcelAutoSave() {
  excelState.autoSave = !excelState.autoSave;
  const btn = document.getElementById('btn-excel-autosave');
  if (btn) {
    if (excelState.autoSave) {
      btn.className = 'w-8 h-4 bg-emerald-300 rounded-full p-0.5 transition flex items-center justify-end';
      showToast('AutoSave Excel diaktifkan (Tersimpan otomatis)');
    } else {
      btn.className = 'w-8 h-4 bg-slate-400 rounded-full p-0.5 transition flex items-center justify-start';
      showToast('AutoSave dinonaktifkan');
    }
  }
}

function aktifkanExcelChart(type) {
  excelState.chartType = type;
  showToast(`Tampilan grafik diatur ke mode ${type === 'bar' ? 'batang vertikal' : 'batang horizontal'}`);
}

function tambahBarisExcel() {
  excelState.rowCount += 1;
  renderExcelGrid();
  showToast(`Baris baru ke-${excelState.rowCount} berhasil ditambahkan!`);
}

function salinSemuaDataExcel() {
  let text = '';
  for (let r = 1; r <= excelState.rowCount; r++) {
    const rowVals = [];
    excelState.cols.forEach(col => {
      const coord = `${col}${r}`;
      rowVals.push(evaluasiRumusExcel(excelState.cells[coord]) || '');
    });
    text += rowVals.join('\t') + '\n';
  }
  navigator.clipboard.writeText(text).then(() => {
    showToast('Seluruh tabel berhasil disalin ke Clipboard!');
  }).catch(() => {
    showToast('Tabel siap disalin');
  });
}

// ==========================================
// 18. SIMULATOR ROBOMIND 7.0 DESKTOP (DEMO PRAKTIK SEMESTER 2)
// ==========================================

// Membuka Aplikasi Simulator RoboMind 7.0 secara langsung (Materi Semester 2)
function bukaRoboMindLangsung() {
  playSound('click');
  // Pastikan sistem beralih ke Semester 2
  if (state.currentSemester !== 2) {
    pilihSemester(2);
  }
  // Pastikan konten demo semester 2 tampil dan demo semester 1 disembunyikan
  const sem1Demos = document.querySelectorAll('#tab-demo .sem1-content');
  const sem2Demos = document.querySelectorAll('#tab-demo .sem2-content');
  sem1Demos.forEach(el => el.classList.add('hidden'));
  sem2Demos.forEach(el => el.classList.remove('hidden'));

  // Switch tab ke demo
  switchTab('demo');

  // Set subdemo aktif ke RoboMind 7.0
  if (typeof setSubDemoSem2 === 'function') {
    setSubDemoSem2('robomind');
  }

  setTimeout(() => {
    if (typeof initRoboMindSimulator === 'function') {
      initRoboMindSimulator();
    }
  }, 100);

  const msg = state.currentLang === 'en' 
    ? 'Semester 2: RoboMind 7.0 Desktop Simulator Opened! 🤖' 
    : 'Semester 2: Aplikasi Simulator RoboMind 7.0 Dibuka! 🤖';
  showToast(msg, 'success');
}
window.bukaRoboMindLangsung = bukaRoboMindLangsung;

function setSubDemoSem2(demoKey) {
  playSound('click');
  const panelRobo = document.getElementById('subdemo-robomind-panel');
  const panelVision = document.getElementById('subdemo-vision-panel');
  const btnRobo = document.getElementById('btn-subdemo-robomind');
  const btnVision = document.getElementById('btn-subdemo-vision');

  if (demoKey === 'robomind') {
    if (panelRobo) panelRobo.classList.remove('hidden');
    if (panelVision) panelVision.classList.add('hidden');
    if (btnRobo) {
      btnRobo.className = 'sem2-demo-tab-btn active-sem2-subdemo px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-blue-600 text-white shadow-md flex items-center gap-2 transition';
    }
    if (btnVision) {
      btnVision.className = 'sem2-demo-tab-btn px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center gap-2 transition';
    }
    setTimeout(initRoboMindSimulator, 50);
  } else {
    if (panelRobo) panelRobo.classList.add('hidden');
    if (panelVision) panelVision.classList.remove('hidden');
    if (btnRobo) {
      btnRobo.className = 'sem2-demo-tab-btn px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center gap-2 transition';
    }
    if (btnVision) {
      btnVision.className = 'sem2-demo-tab-btn active-sem2-subdemo px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-purple-600 text-white shadow-md flex items-center gap-2 transition';
    }
  }
}

const ROBOMIND_PRESETS = {
  misi_beacon: `# Misi 1: Ambil & Tempatkan Beacon
# 1. Maju dan dekati Beacon di samping peti kayu
forward(2)
right()
forward(3)
# 2. Ambil Beacon ke dalam muatan robot!
pickUp()
say("Beacon berhasil kuambil! 💠")
# 3. Pindahkan Beacon ke area pasir baru
left()
forward(3)
# 4. Tempatkan Beacon di posisi baru!
putDown()
say("Beacon berhasil kutempatkan! 📥")`,

  misi_jejak: `# Misi 2: Telusuri Jalur Cat Putih Gurun
# Robot melintasi pasir gurun mengikuti jejak
forward(3)
right()
forward(7)
right()
forward(4)
say("Jalur pasir gurun berhasil ditelusuri!")`,

  misi_plateau: `# Misi 3: Menuju Beacon Plateau Kanan Atas
# Menjelajahi arena menuju plateau atas
forward(5)
right()
forward(8)
left()
forward(2)
pickUp()
say("Beacon Plateau Kanan Atas berhasil kuambil! 💠")`,

  misi_patroli: `# Misi 4: Patroli Persegi (Loop repeat 4)
# Robot berpatroli mengelilingi kotak
paintWhite()
repeat(4) {
  forward(3)
  right()
}
say("Patroli keliling persegi selesai dikerjakan!")`,

  custom: `# Tulis Kodemu Sendiri!
# Perintah yang dapat kamu gunakan:
# - forward(n)      : Maju n langkah
# - backward(n)     : Mundur n langkah
# - left()          : Belok kiri 90°
# - right()         : Belok kanan 90°
# - pickUp()        : Ambil Beacon di depan / bawah robot 💠
# - putDown()       : Tempatkan Beacon yang sedang dibawa 📥
# - paintWhite()    : Kuas cat putih ON
# - paintBlack()    : Kuas cat hitam ON
# - stopPainting()  : Kuas cat OFF
# - say("pesan")    : Robot berbicara
# - repeat(n) { }   : Ulangi instruksi

forward(2)
right()
forward(3)
pickUp()
say("Halo RoboMind!")`
};

const robomindState = {
  gridCols: 22,
  gridRows: 14,
  cellPx: 30,
  robotX: 6,
  robotY: 9,
  startX: 6,
  startY: 9,
  robotDir: 0, // 0: Utara (N), 1: Timur (E), 2: Selatan (S), 3: Barat (W)
  startDir: 0,
  isPainting: false,
  paintColor: 'white',
  heldBeacons: 0, // Jumlah beacon yang sedang dibawa robot
  paintedCells: {}, // format key: "x,y" => 'white' | 'black'
  beacons: [
    { id: 'beacon-top', x: 19, y: 2, name: 'Beacon Plateau Kanan Atas' },
    { id: 'beacon-bottom', x: 10, y: 11, name: 'Beacon Pasir Bawah' }
  ],
  initialBeacons: [
    { id: 'beacon-top', x: 19, y: 2, name: 'Beacon Plateau Kanan Atas' },
    { id: 'beacon-bottom', x: 10, y: 11, name: 'Beacon Pasir Bawah' }
  ],
  mapElements: {},
  instructions: [],
  stepIndex: 0,
  isRunning: false,
  isPaused: false,
  timerId: null,
  speedMs: 450,
  zoomScale: 1.0,
  currentMission: 'misi_beacon',
  history: [],
  historyIndex: -1,
  initialized: false
};

// Pemetaan Elemen Peta Otentik RoboMind (Sesuai Gambar)
function buildRoboMindWorldMap() {
  const map = {};

  // 1. Tembok Pembatas Batu Keliling Luar (Border Wall)
  for (let x = 0; x < robomindState.gridCols; x++) {
    for (let y = 0; y < robomindState.gridRows; y++) {
      if (y === 0 || y === 12 || y === 13 || x === 0 || x === 1 || x === 20 || x === 21) {
        map[`${x},${y}`] = { type: 'wall' };
      } else if (y === 1 && x !== 10) {
        map[`${x},${y}`] = { type: 'wall' };
      }
    }
  }

  // 2. Plateau Kanan Atas (x: 14..19, y: 1..3)
  for (let x = 14; x <= 19; x++) {
    for (let y = 1; y <= 3; y++) {
      map[`${x},${y}`] = { type: 'stone' };
    }
  }
  map['15,2'] = { type: 'tree', onStone: true };
  map['17,2'] = { type: 'water', onStone: true };

  // 3. Pohon di Dinding Atas Dekat Celah
  map['9,2'] = { type: 'tree', onStone: true };
  map['11,2'] = { type: 'tree', onStone: true };

  // 4. Plateau Kiri Atas (x: 4..7, y: 3..6)
  for (let x = 4; x <= 7; x++) {
    for (let y = 3; y <= 6; y++) {
      if (!(x === 7 && y === 3) && !(x === 4 && y === 6)) {
        map[`${x},${y}`] = { type: 'stone' };
      }
    }
  }
  map['5,4'] = { type: 'water', onStone: true };
  map['6,5'] = { type: 'water', onStone: true };

  // 5. Tembok Kiri Dalam (Pohon & Kolam Air)
  map['2,7'] = { type: 'tree', onStone: true };
  map['2,8'] = { type: 'water', onStone: true };
  map['2,9'] = { type: 'water', onStone: true };
  map['2,10'] = { type: 'tree', onStone: true };

  // 6. Plateau Tengah (Salib Batu RoboMind)
  for (let x = 11; x <= 16; x++) {
    for (let y = 6; y <= 7; y++) {
      map[`${x},${y}`] = { type: 'stone' };
    }
  }
  map['12,5'] = { type: 'stone' };
  map['13,5'] = { type: 'stone' };
  map['13,8'] = { type: 'stone' };
  map['14,8'] = { type: 'stone' };
  map['15,8'] = { type: 'stone' };
  map['14,7'] = { type: 'water', onStone: true };

  // 7. Peti Kayu (Crates)
  map['16,7'] = { type: 'crate' };
  map['18,7'] = { type: 'crate' };
  map['19,7'] = { type: 'crate' };
  map['16,9'] = { type: 'crate' };
  map['17,10'] = { type: 'crate' };
  map['11,11'] = { type: 'crate' };

  robomindState.mapElements = map;
}

// Inisialisasi Jejak Cat Putih Bawaan Peta (Sesuai Screenshot Asli)
function initDefaultWhiteTrail() {
  const trail = {};
  // Dari atas celah (10, 1) turun ke (10, 3)
  for (let y = 1; y <= 3; y++) trail[`10,${y}`] = 'white';
  // Belok kanan ke (17, 3)
  for (let x = 10; x <= 17; x++) trail[`${x},3`] = 'white';
  // Turun ke (17, 8)
  for (let y = 3; y <= 8; y++) trail[`17,${y}`] = 'white';
  // Belok kiri ke (14, 9)
  trail['16,9'] = 'white';
  trail['15,9'] = 'white';
  trail['14,9'] = 'white';

  robomindState.paintedCells = trail;
}

function initRoboMindSimulator() {
  const gridContainer = document.getElementById('robomind-grid');
  const editorEl = document.getElementById('robomind-script-editor');
  if (!gridContainer || !editorEl) return;

  // 1. Bangun peta map otentik dan jejak jalur cat
  buildRoboMindWorldMap();
  if (Object.keys(robomindState.paintedCells).length === 0) {
    initDefaultWhiteTrail();
  }

  // 2. Render Grid Arena Gurun Pasir
  renderRoboMindGrid();

  // 3. Isi script editor jika masih kosong
  if (!editorEl.value.trim()) {
    editorEl.value = ROBOMIND_PRESETS[robomindState.currentMission] || ROBOMIND_PRESETS.misi_beacon;
  }
  updateRoboLineNumbers();

  // 4. Simpan state history pertama kali
  if (robomindState.history.length === 0) {
    robomindState.history.push(editorEl.value);
    robomindState.historyIndex = 0;
  }

  // 5. Update Posisi Robot, Status Beacon & Minimap
  updateRoboMindRobotSprite();
  updateRoboMinimap();
  updateRoboBeaconUI();

  robomindState.initialized = true;
}

function renderRoboMindGrid() {
  const gridContainer = document.getElementById('robomind-grid');
  if (!gridContainer) return;

  const robotSprite = document.getElementById('robomind-robot-sprite');
  gridContainer.innerHTML = '';

  for (let y = 0; y < robomindState.gridRows; y++) {
    for (let x = 0; x < robomindState.gridCols; x++) {
      const cell = document.createElement('div');
      cell.id = `robo-cell-${x}-${y}`;
      cell.className = 'relative flex items-center justify-center select-none overflow-hidden';
      cell.style.width = `${robomindState.cellPx}px`;
      cell.style.height = `${robomindState.cellPx}px`;

      const mapElem = robomindState.mapElements[`${x},${y}`];

      if (mapElem) {
        if (mapElem.type === 'wall') {
          // Dinding Batu Border Luar
          cell.className += ' bg-[#475569] border border-[#334155] shadow-inner';
          cell.innerHTML = '<div class="w-full h-full bg-[#475569] border border-[#64748b]/40"></div>';
        } else if (mapElem.type === 'stone') {
          // Plateau Batu Bertingkat
          cell.className += ' bg-[#64748b] border border-[#475569] shadow-sm';
          cell.innerHTML = '<div class="w-full h-full bg-[#64748b] border border-[#94a3b8]/30"></div>';
        } else if (mapElem.type === 'water') {
          // Kolam Air Biru Jernih
          cell.className += ' bg-[#64748b] border border-[#475569] p-0.5';
          cell.innerHTML = '<div class="w-full h-full rounded bg-sky-400 border border-sky-200 shadow-inner flex items-center justify-center text-[10px] text-white">💧</div>';
        } else if (mapElem.type === 'tree') {
          // Pohon Hijau di Atas Batu
          cell.className += ' bg-[#64748b] border border-[#475569] flex items-center justify-center';
          cell.innerHTML = '<span class="text-base sm:text-lg drop-shadow-md select-none transform hover:scale-125 transition">🌳</span>';
        } else if (mapElem.type === 'crate') {
          // Peti Kayu Cokelat
          cell.className += ' bg-[#e69138] border border-amber-800/20 flex items-center justify-center p-0.5';
          cell.innerHTML = '<div class="w-full h-full rounded bg-[#92400e] border border-[#b45309] shadow flex items-center justify-center text-[10px] text-amber-200 font-bold select-none">📦</div>';
        }
      } else {
        // Pasir Oranye Gurun RoboMind
        cell.className += ' bg-[#e69138] border border-[#ffffff]/20';
      }

      // Layer Cat Putih / Hitam
      const paintLayer = document.createElement('div');
      paintLayer.id = `robo-paint-${x}-${y}`;
      paintLayer.className = 'absolute inset-0 pointer-events-none transition-all duration-200 flex items-center justify-center';
      
      const cellColor = robomindState.paintedCells[`${x},${y}`];
      if (cellColor === 'white') {
        paintLayer.innerHTML = '<div class="w-3.5 h-3.5 rounded-full bg-white/95 border border-amber-100 shadow-sm"></div>';
      } else if (cellColor === 'black') {
        paintLayer.innerHTML = '<div class="w-3.5 h-3.5 rounded-full bg-slate-950/95 border border-slate-700 shadow-sm"></div>';
      }
      cell.appendChild(paintLayer);

      // Cek apakah ada BEACON di petak ini
      const beacon = robomindState.beacons.find(b => b.x === x && b.y === y);
      if (beacon) {
        const beaconEl = document.createElement('div');
        beaconEl.id = `robo-beacon-${beacon.id}`;
        beaconEl.className = 'absolute z-10 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer transform hover:scale-125 transition duration-200 animate-pulse drop-shadow-md';
        beaconEl.title = `Beacon (${x}, ${y}) - Klik untuk berinteraksi!`;
        beaconEl.onclick = () => interaksiKlikBeacon(beacon);
        beaconEl.innerHTML = `
          <div class="relative w-5 h-5 flex items-center justify-center">
            <div class="absolute inset-0 rounded-full bg-cyan-400/50 animate-ping"></div>
            <div class="relative w-4 h-4 rounded-full bg-gradient-to-tr from-cyan-600 via-teal-400 to-emerald-300 border-2 border-white shadow-md flex items-center justify-center text-[8px] text-white font-bold">
              💠
            </div>
          </div>
        `;
        cell.appendChild(beaconEl);
      }

      gridContainer.appendChild(cell);
    }
  }

  // Masukkan kembali sprite robot ke grid
  if (robotSprite) {
    gridContainer.appendChild(robotSprite);
  }
}

function updateRoboMindRobotSprite() {
  const sprite = document.getElementById('robomind-robot-sprite');
  const posLabel = document.getElementById('robomind-pos-label');
  const dirLabel = document.getElementById('robomind-dir-label');
  const compassIcon = document.getElementById('robomind-compass-icon');
  const paintInd = document.getElementById('robomind-paint-indicator');
  const paintText = document.getElementById('robomind-paint-text');
  const brushSvg = document.getElementById('robomind-svg-brush');
  const heldBeaconSvg = document.getElementById('robomind-svg-held-beacon');
  const heldBeaconCore = document.getElementById('robomind-svg-held-beacon-core');

  if (!sprite) return;

  const leftPx = robomindState.robotX * robomindState.cellPx;
  const topPx = robomindState.robotY * robomindState.cellPx;
  const rotDeg = robomindState.robotDir * 90;

  sprite.style.left = `${leftPx}px`;
  sprite.style.top = `${topPx}px`;
  sprite.style.transform = `rotate(${rotDeg}deg)`;

  if (posLabel) {
    posLabel.innerText = `X:${robomindState.robotX} Y:${robomindState.robotY}`;
  }

  // Label & Kompas Arah
  const dirNames = ['Utara (N)', 'Timur (E)', 'Selatan (S)', 'Barat (W)'];
  if (dirLabel) {
    dirLabel.innerText = dirNames[robomindState.robotDir] || 'Utara (N)';
  }
  if (compassIcon) {
    compassIcon.style.transform = `rotate(${rotDeg - 45}deg)`;
  }

  // Indikator Beacon yang Sedang Dibawa Robot
  if (heldBeaconSvg && heldBeaconCore) {
    if (robomindState.heldBeacons > 0) {
      heldBeaconSvg.classList.remove('hidden');
      heldBeaconCore.classList.remove('hidden');
    } else {
      heldBeaconSvg.classList.add('hidden');
      heldBeaconCore.classList.add('hidden');
    }
  }

  // Indikator Kuas Cat
  if (paintInd && paintText) {
    if (robomindState.isPainting) {
      if (robomindState.paintColor === 'white') {
        paintInd.className = 'inline-block w-2.5 h-2.5 rounded-full bg-white border border-slate-300 shadow-xs';
        paintText.innerText = 'Putih';
        if (brushSvg) brushSvg.setAttribute('fill', '#ffffff');
      } else {
        paintInd.className = 'inline-block w-2.5 h-2.5 rounded-full bg-slate-900 border border-white/60 shadow-xs';
        paintText.innerText = 'Hitam';
        if (brushSvg) brushSvg.setAttribute('fill', '#0f172a');
      }
    } else {
      paintInd.className = 'inline-block w-2.5 h-2.5 rounded-full bg-slate-600 border border-white/40';
      paintText.innerText = 'Mati';
      if (brushSvg) brushSvg.setAttribute('fill', '#64748b');
    }
  }

  updateRoboMinimap();
  updateRoboBeaconUI();
}

function updateRoboBeaconUI() {
  const badge = document.getElementById('robomind-beacon-badge');
  const status = document.getElementById('robomind-beacon-status');
  if (badge) {
    badge.innerText = robomindState.heldBeacons;
    badge.className = robomindState.heldBeacons > 0 
      ? 'font-bold text-white bg-cyan-500 px-1.5 py-0.2 rounded-full text-[9px] shadow-sm animate-pulse'
      : 'font-bold text-white bg-cyan-800 px-1.5 py-0.2 rounded-full text-[9px]';
  }
  if (status) {
    status.innerText = robomindState.heldBeacons > 0 ? 'Membawa 💠' : 'Tidak Membawa';
    status.className = robomindState.heldBeacons > 0 ? 'text-cyan-300 font-bold' : 'text-slate-300';
  }
}

function updateRoboMinimap() {
  const dot = document.getElementById('robomind-minimap-dot');
  if (!dot) return;

  const pctX = (robomindState.robotX / (robomindState.gridCols - 1)) * 80 + 10;
  const pctY = (robomindState.robotY / (robomindState.gridRows - 1)) * 80 + 10;

  dot.style.left = `calc(${pctX}% - 4px)`;
  dot.style.top = `calc(${pctY}% - 4px)`;
}

function onRoboScriptInput() {
  updateRoboLineNumbers();

  const editorEl = document.getElementById('robomind-script-editor');
  if (editorEl) {
    if (robomindState.historyIndex < robomindState.history.length - 1) {
      robomindState.history = robomindState.history.slice(0, robomindState.historyIndex + 1);
    }
    robomindState.history.push(editorEl.value);
    if (robomindState.history.length > 25) robomindState.history.shift();
    robomindState.historyIndex = robomindState.history.length - 1;
  }
}

function updateRoboLineNumbers(activeLineIndex = -1) {
  const editorEl = document.getElementById('robomind-script-editor');
  const linesEl = document.getElementById('robomind-line-numbers');
  if (!editorEl || !linesEl) return;

  const lines = editorEl.value.split('\n');
  const count = Math.max(22, lines.length);

  let html = '';
  for (let i = 1; i <= count; i++) {
    if (i === activeLineIndex + 1) {
      html += `<div class="bg-amber-400 text-slate-900 font-bold px-1 rounded-sm flex items-center justify-between"><span>▶</span><span>${i}</span></div>`;
    } else {
      html += `<div class="px-1">${i}</div>`;
    }
  }
  linesEl.innerHTML = html;
}

function gantiMisiRoboMind(misiKey) {
  playSound('click');
  resetRoboMind();
  robomindState.currentMission = misiKey;

  const editorEl = document.getElementById('robomind-script-editor');
  const titleEl = document.getElementById('robomind-window-title');
  if (editorEl) {
    editorEl.value = ROBOMIND_PRESETS[misiKey] || ROBOMIND_PRESETS.misi_beacon;
    updateRoboLineNumbers();
  }

  const fileNames = {
    misi_beacon: 'Misi_Ambil_Beacon.irobo',
    misi_jejak: 'Jelajah_Gurun.irobo',
    misi_plateau: 'Beacon_Plateau.irobo',
    misi_patroli: 'Patroli_Persegi.irobo',
    custom: 'Skrip_Mandiri.irobo'
  };

  if (titleEl) {
    titleEl.innerText = `RoboMind 7.0 - [${fileNames[misiKey] || 'script.irobo'}]`;
  }

  logKonsolRobo(`📂 Memuat misi "${fileNames[misiKey] || misiKey}". Klik [Play / Run] untuk memulai!`, 'info');
}

function sisipkanPerintahRobo(cmd) {
  playSound('click');
  const editorEl = document.getElementById('robomind-script-editor');
  if (!editorEl) return;

  const start = editorEl.selectionStart || editorEl.value.length;
  const end = editorEl.selectionEnd || editorEl.value.length;
  const text = editorEl.value;

  const needNewline = (start > 0 && text[start - 1] !== '\n') ? '\n' : '';
  const insertion = `${needNewline}${cmd}\n`;

  editorEl.value = text.substring(0, start) + insertion + text.substring(end);
  editorEl.selectionStart = editorEl.selectionEnd = start + insertion.length;
  editorEl.focus();

  onRoboScriptInput();
}

function bersihkanEditorRobo() {
  playSound('click');
  const editorEl = document.getElementById('robomind-script-editor');
  if (editorEl) {
    editorEl.value = '';
    onRoboScriptInput();
    logKonsolRobo('Editor skrip dikosongkan. Kamu bisa menyusun instruksi baru!', 'info');
  }
}

function bersihkanKonsolRobo() {
  playSound('click');
  const consoleLog = document.getElementById('robomind-console-log');
  if (consoleLog) {
    consoleLog.innerHTML = '<div class="text-slate-600 italic">Log konsol dibersihkan. RoboMind siap menerima perintah berikutnya.</div>';
  }
}

function logKonsolRobo(pesan, tipe = 'normal') {
  const consoleLog = document.getElementById('robomind-console-log');
  if (!consoleLog) return;

  const entry = document.createElement('div');
  if (tipe === 'success') {
    entry.className = 'text-emerald-900 font-bold';
  } else if (tipe === 'warn') {
    entry.className = 'text-rose-900 font-bold';
  } else if (tipe === 'robot') {
    entry.className = 'text-blue-900 font-semibold';
  } else {
    entry.className = 'text-slate-800';
  }

  entry.innerText = pesan;
  consoleLog.appendChild(entry);
  consoleLog.scrollTop = consoleLog.scrollHeight;
}

// ==========================================
// PARSER INSTRUKSI ROBOMIND (MENDUKUNG BEACON)
// ==========================================
function parseRoboScript(scriptText) {
  const rawLines = scriptText.split('\n');
  const instructions = [];

  for (let i = 0; i < rawLines.length; i++) {
    const rawLine = rawLines[i].trim();
    if (!rawLine || rawLine.startsWith('#') || rawLine.startsWith('//')) {
      continue;
    }

    // Deteksi blok perulangan repeat(n) { ... }
    const repeatMatch = rawLine.match(/^repeat\s*\(\s*(\d+)\s*\)\s*\{/i);
    if (repeatMatch) {
      const times = parseInt(repeatMatch[1], 10);
      const innerCommands = [];
      let j = i + 1;
      let depth = 1;

      while (j < rawLines.length && depth > 0) {
        const subLine = rawLines[j].trim();
        if (subLine.includes('{')) depth++;
        if (subLine.includes('}')) {
          depth--;
          if (depth === 0) break;
        }
        if (!subLine.startsWith('#') && !subLine.startsWith('//') && subLine !== '}') {
          innerCommands.push({ text: subLine, lineNum: j });
        }
        j++;
      }

      // Duplikasi perintah repeat
      for (let t = 0; t < times; t++) {
        for (const cmdObj of innerCommands) {
          uraiPerintahRobo(cmdObj.text, cmdObj.lineNum, instructions);
        }
      }

      i = j; // Loncat ke akhir kurung kurawal
      continue;
    }

    // Perintah satu baris biasa
    uraiPerintahRobo(rawLine, i, instructions);
  }

  return instructions;
}

function uraiPerintahRobo(lineText, lineIndex, instructions) {
  const line = lineText.replace(/;$/, '').trim();

  // 1. forward(n)
  let m = line.match(/^forward(?:\s*\(\s*(\d*)\s*\))?/i);
  if (m) {
    const count = parseInt(m[1] || '1', 10) || 1;
    for (let c = 0; c < count; c++) {
      instructions.push({ action: 'forward', lineIndex, raw: line, stepPart: c + 1, totalParts: count });
    }
    return;
  }

  // 2. backward(n)
  m = line.match(/^backward(?:\s*\(\s*(\d*)\s*\))?/i);
  if (m) {
    const count = parseInt(m[1] || '1', 10) || 1;
    for (let c = 0; c < count; c++) {
      instructions.push({ action: 'backward', lineIndex, raw: line, stepPart: c + 1, totalParts: count });
    }
    return;
  }

  // 3. left()
  if (/^left(?:\s*\(\s*\))?/i.test(line)) {
    instructions.push({ action: 'left', lineIndex, raw: line });
    return;
  }

  // 4. right()
  if (/^right(?:\s*\(\s*\))?/i.test(line)) {
    instructions.push({ action: 'right', lineIndex, raw: line });
    return;
  }

  // 5. pickUp() - Ambil Beacon
  if (/^pickUp(?:\s*\(\s*\))?/i.test(line)) {
    instructions.push({ action: 'pickUp', lineIndex, raw: line });
    return;
  }

  // 6. putDown() - Tempatkan Beacon
  if (/^putDown(?:\s*\(\s*\))?/i.test(line)) {
    instructions.push({ action: 'putDown', lineIndex, raw: line });
    return;
  }

  // 7. paintWhite()
  if (/^paintWhite(?:\s*\(\s*\))?/i.test(line)) {
    instructions.push({ action: 'paintWhite', lineIndex, raw: line });
    return;
  }

  // 8. paintBlack()
  if (/^paintBlack(?:\s*\(\s*\))?/i.test(line)) {
    instructions.push({ action: 'paintBlack', lineIndex, raw: line });
    return;
  }

  // 9. stopPainting()
  if (/^stopPainting(?:\s*\(\s*\))?/i.test(line)) {
    instructions.push({ action: 'stopPainting', lineIndex, raw: line });
    return;
  }

  // 10. say("pesan")
  m = line.match(/^say\s*\(\s*["']([^"']*)["']\s*\)/i);
  if (m) {
    instructions.push({ action: 'say', text: m[1], lineIndex, raw: line });
    return;
  }
}

// ==========================================
// ENGINE EKSEKUSI ROBOMIND & LOGIKA BEACON
// ==========================================
function jalankanRoboMind() {
  if (robomindState.isRunning) return;

  const editorEl = document.getElementById('robomind-script-editor');
  if (!editorEl || !editorEl.value.trim()) {
    showToast('Ketik perintah atau pilih salah satu misi terlebih dahulu!', 'info');
    return;
  }

  playSound('click');

  if (!robomindState.isPaused || robomindState.stepIndex >= robomindState.instructions.length) {
    resetRoboMindStateOnly();
    robomindState.instructions = parseRoboScript(editorEl.value);
    robomindState.stepIndex = 0;

    if (robomindState.instructions.length === 0) {
      logKonsolRobo('⚠️ Tidak ada instruksi yang valid untuk dijalankan.', 'warn');
      return;
    }
    logKonsolRobo(`▶ Memulai eksekusi skrip (${robomindState.instructions.length} langkah)...`, 'normal');
  }

  robomindState.isRunning = true;
  robomindState.isPaused = false;

  const runBtn = document.getElementById('btn-robomind-run');
  const statusTag = document.getElementById('robomind-status-tag');
  if (runBtn) {
    runBtn.className = 'bg-amber-600 hover:bg-amber-500 text-white font-title font-bold px-4 py-1.5 rounded-xl shadow-md transition flex items-center gap-2 text-xs sm:text-sm animate-pulse';
    runBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Berjalan...</span>';
  }
  if (statusTag) {
    statusTag.className = 'ml-2 bg-amber-500/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded text-[11px] font-bold';
    statusTag.innerText = 'Sedang Berjalan';
  }

  eksekusiLoopRoboMind();
}

function eksekusiLoopRoboMind() {
  if (!robomindState.isRunning) return;

  if (robomindState.stepIndex >= robomindState.instructions.length) {
    selesaikanEksekusiRoboMind();
    return;
  }

  const inst = robomindState.instructions[robomindState.stepIndex];
  eksekusiSatuInstruksiRobo(inst);
  robomindState.stepIndex++;

  robomindState.timerId = setTimeout(() => {
    eksekusiLoopRoboMind();
  }, robomindState.speedMs);
}

function langkahRoboMind() {
  playSound('click');
  const editorEl = document.getElementById('robomind-script-editor');
  if (!editorEl) return;

  if (robomindState.isRunning) {
    pauseRoboMind();
    return;
  }

  if (robomindState.instructions.length === 0 || robomindState.stepIndex >= robomindState.instructions.length) {
    robomindState.instructions = parseRoboScript(editorEl.value);
    robomindState.stepIndex = 0;
    if (robomindState.instructions.length === 0) {
      showToast('Tulis perintah skrip terlebih dahulu!', 'info');
      return;
    }
  }

  const inst = robomindState.instructions[robomindState.stepIndex];
  eksekusiSatuInstruksiRobo(inst);
  robomindState.stepIndex++;

  if (robomindState.stepIndex >= robomindState.instructions.length) {
    selesaikanEksekusiRoboMind(false);
  }
}

function eksekusiSatuInstruksiRobo(inst) {
  updateRoboLineNumbers(inst.lineIndex);

  // Arah delta: [dx, dy] untuk Utara (0), Timur (1), Selatan (2), Barat (3)
  const dirDelta = [
    { dx: 0, dy: -1 }, // Utara
    { dx: 1, dy: 0 },  // Timur
    { dx: 0, dy: 1 },  // Selatan
    { dx: -1, dy: 0 }  // Barat
  ];

  if (inst.action === 'forward' || inst.action === 'backward') {
    const curDelta = dirDelta[robomindState.robotDir];
    const mult = (inst.action === 'forward') ? 1 : -1;
    const nx = robomindState.robotX + (curDelta.dx * mult);
    const ny = robomindState.robotY + (curDelta.dy * mult);

    // Cek batas arena (0 s/d 21 horizontal, 0 s/d 13 vertikal)
    if (nx < 0 || nx >= robomindState.gridCols || ny < 0 || ny >= robomindState.gridRows) {
      logKonsolRobo(`⚠️ Robot menabrak batas arena di (${nx}, ${ny})!`, 'warn');
      playSound('error');
      return;
    }

    // Cek tabrakan rintangan tembok / plateau / kolam / pohon / peti
    const mapObj = robomindState.mapElements[`${nx},${ny}`];
    if (mapObj && (mapObj.type === 'wall' || mapObj.type === 'stone' || mapObj.type === 'water' || mapObj.type === 'tree' || mapObj.type === 'crate')) {
      const namaRintangan = {
        wall: 'Tembok Batu Border',
        stone: 'Plateau Batu',
        water: 'Kolam Air',
        tree: 'Pohon Hijau',
        crate: 'Peti Kayu'
      }[mapObj.type] || 'Rintangan';

      logKonsolRobo(`⚠️ Gerakan terhalang oleh ${namaRintangan} di (${nx}, ${ny})!`, 'warn');
      playSound('error');
      return;
    }

    // Jika kuas cat aktif, cat sel sebelumnya dan sel tujuan
    if (robomindState.isPainting) {
      terapkanCatDiSel(robomindState.robotX, robomindState.robotY, robomindState.paintColor);
      terapkanCatDiSel(nx, ny, robomindState.paintColor);
    }

    robomindState.robotX = nx;
    robomindState.robotY = ny;
    updateRoboMindRobotSprite();
    playSound('click');

    const arahKata = (inst.action === 'forward') ? 'maju' : 'mundur';
    logKonsolRobo(`> [Baris ${inst.lineIndex + 1}] Robot ${arahKata} ke (${nx}, ${ny})`, 'robot');

  } else if (inst.action === 'left') {
    robomindState.robotDir = (robomindState.robotDir + 3) % 4;
    updateRoboMindRobotSprite();
    playSound('click');
    logKonsolRobo(`> [Baris ${inst.lineIndex + 1}] left() - Robot belok kiri 90°`, 'robot');

  } else if (inst.action === 'right') {
    robomindState.robotDir = (robomindState.robotDir + 1) % 4;
    updateRoboMindRobotSprite();
    playSound('click');
    logKonsolRobo(`> [Baris ${inst.lineIndex + 1}] right() - Robot belok kanan 90°`, 'robot');

  } else if (inst.action === 'pickUp') {
    robotAmbilBeacon(inst.lineIndex);

  } else if (inst.action === 'putDown') {
    robotLetakkanBeacon(inst.lineIndex);

  } else if (inst.action === 'paintWhite') {
    robomindState.isPainting = true;
    robomindState.paintColor = 'white';
    terapkanCatDiSel(robomindState.robotX, robomindState.robotY, 'white');
    updateRoboMindRobotSprite();
    playSound('click');
    logKonsolRobo(`> [Baris ${inst.lineIndex + 1}] paintWhite() - Kuas cat putih diaktifkan ⬜`, 'robot');

  } else if (inst.action === 'paintBlack') {
    robomindState.isPainting = true;
    robomindState.paintColor = 'black';
    terapkanCatDiSel(robomindState.robotX, robomindState.robotY, 'black');
    updateRoboMindRobotSprite();
    playSound('click');
    logKonsolRobo(`> [Baris ${inst.lineIndex + 1}] paintBlack() - Kuas cat hitam diaktifkan ⬛`, 'robot');

  } else if (inst.action === 'stopPainting') {
    robomindState.isPainting = false;
    updateRoboMindRobotSprite();
    playSound('click');
    logKonsolRobo(`> [Baris ${inst.lineIndex + 1}] stopPainting() - Kuas cat dimatikan`, 'robot');

  } else if (inst.action === 'say') {
    const bubble = document.getElementById('robomind-speech-bubble');
    const speechText = document.getElementById('robomind-speech-text');
    if (bubble && speechText) {
      speechText.innerText = inst.text;
      bubble.classList.remove('hidden');
      setTimeout(() => {
        bubble.classList.add('hidden');
      }, 2500);
    }
    playSound('success');
    logKonsolRobo(`💬 Robot berkata: "${inst.text}"`, 'success');
  }
}

// ==========================================
// OPERASI PENGAMBILAN & PENEMPATAN BEACON
// ==========================================
function robotAmbilBeacon(lineIndex = 0) {
  if (robomindState.heldBeacons >= 1) {
    logKonsolRobo(`⚠️ [Baris ${lineIndex + 1}] Robot sudah membawa Beacon! Gunakan putDown() untuk menaruhnya terlebih dahulu.`, 'warn');
    playSound('error');
    return;
  }

  const dirDelta = [
    { dx: 0, dy: -1 }, // Utara
    { dx: 1, dy: 0 },  // Timur
    { dx: 0, dy: 1 },  // Selatan
    { dx: -1, dy: 0 }  // Barat
  ];
  const curDelta = dirDelta[robomindState.robotDir];
  const frontX = robomindState.robotX + curDelta.dx;
  const frontY = robomindState.robotY + curDelta.dy;

  // Cek beacon di petak depan atau tepat di petak robot berdiri
  let targetIdx = robomindState.beacons.findIndex(b => b.x === frontX && b.y === frontY);
  let ambilPosisi = 'depan';
  if (targetIdx === -1) {
    targetIdx = robomindState.beacons.findIndex(b => b.x === robomindState.robotX && b.y === robomindState.robotY);
    ambilPosisi = 'bawah';
  }

  if (targetIdx !== -1) {
    const takenBeacon = robomindState.beacons.splice(targetIdx, 1)[0];
    robomindState.heldBeacons = 1;

    // Hapus elemen beacon dari grid UI
    renderRoboMindGrid();
    updateRoboMindRobotSprite();

    logKonsolRobo(`> [Baris ${lineIndex + 1}] pickUp() - 💠 Robot berhasil mengambil Beacon dari ${ambilPosisi}nya di (${takenBeacon.x}, ${takenBeacon.y})!`, 'success');
    playSound('fanfare');

    const bubble = document.getElementById('robomind-speech-bubble');
    const speechText = document.getElementById('robomind-speech-text');
    if (bubble && speechText) {
      speechText.innerText = 'Beacon kuambil! 💠';
      bubble.classList.remove('hidden');
      setTimeout(() => bubble.classList.add('hidden'), 2000);
    }
    tambahPoin(15);
  } else {
    logKonsolRobo(`⚠️ [Baris ${lineIndex + 1}] pickUp() - Tidak ada Beacon di depan atau di posisi robot untuk diambil.`, 'warn');
    playSound('error');
  }
}

function robotLetakkanBeacon(lineIndex = 0) {
  if (robomindState.heldBeacons <= 0) {
    logKonsolRobo(`⚠️ [Baris ${lineIndex + 1}] putDown() - Robot tidak sedang membawa Beacon untuk ditempatkan!`, 'warn');
    playSound('error');
    return;
  }

  const dirDelta = [
    { dx: 0, dy: -1 }, // Utara
    { dx: 1, dy: 0 },  // Timur
    { dx: 0, dy: 1 },  // Selatan
    { dx: -1, dy: 0 }  // Barat
  ];
  const curDelta = dirDelta[robomindState.robotDir];
  const frontX = robomindState.robotX + curDelta.dx;
  const frontY = robomindState.robotY + curDelta.dy;

  // Cek apakah petak depan adalah pasir bebas
  let targetX = frontX;
  let targetY = frontY;
  const mapObj = robomindState.mapElements[`${frontX},${frontY}`];
  const beaconAtFront = robomindState.beacons.some(b => b.x === frontX && b.y === frontY);

  if (frontX < 0 || frontX >= robomindState.gridCols || frontY < 0 || frontY >= robomindState.gridRows || (mapObj && mapObj.type === 'wall') || beaconAtFront) {
    // Jika depan terhalang, tempatkan di petak tempat robot berdiri saat ini
    targetX = robomindState.robotX;
    targetY = robomindState.robotY;
  }

  robomindState.beacons.push({
    id: 'beacon-' + Date.now(),
    x: targetX,
    y: targetY,
    name: 'Beacon Ditempatkan'
  });
  robomindState.heldBeacons = 0;

  renderRoboMindGrid();
  updateRoboMindRobotSprite();

  logKonsolRobo(`> [Baris ${lineIndex + 1}] putDown() - 📥 Robot meletakkan Beacon di koordinat (${targetX}, ${targetY})!`, 'success');
  playSound('success');

  const bubble = document.getElementById('robomind-speech-bubble');
  const speechText = document.getElementById('robomind-speech-text');
  if (bubble && speechText) {
    speechText.innerText = 'Beacon diletakkan! 📥';
    bubble.classList.remove('hidden');
    setTimeout(() => bubble.classList.add('hidden'), 2000);
  }
  tambahPoin(20);
  showToast(`Beacon berhasil ditempatkan di (${targetX}, ${targetY})! 💠 (+20 Bintang)`, 'success');
}

function interaksiKlikBeacon(beacon) {
  playSound('click');
  const dist = Math.abs(beacon.x - robomindState.robotX) + Math.abs(beacon.y - robomindState.robotY);
  if (dist <= 1) {
    // Robot berada tepat di sebelah beacon, ambil langsung!
    robotAmbilBeacon();
  } else {
    logKonsolRobo(`💠 Beacon terdeteksi di koordinat (${beacon.x}, ${beacon.y}). Jalankan robot mendekat lalu gunakan perintah pickUp()!`, 'info');
    showToast(`Beacon ada di X:${beacon.x} Y:${beacon.y}. Dekati lalu jalankan pickUp()! 💠`, 'info');
  }
}

function selesaikanEksekusiRoboMind(autoToast = true) {
  if (robomindState.timerId) {
    clearTimeout(robomindState.timerId);
    robomindState.timerId = null;
  }
  robomindState.isRunning = false;
  robomindState.isPaused = false;

  const runBtn = document.getElementById('btn-robomind-run');
  const statusTag = document.getElementById('robomind-status-tag');
  if (runBtn) {
    runBtn.className = 'bg-emerald-600 hover:bg-emerald-500 text-white font-title font-bold px-4 py-1.5 rounded-xl shadow-md transition flex items-center gap-2 text-xs sm:text-sm';
    runBtn.innerHTML = '<i class="fa-solid fa-play"></i> <span>Play / Run</span>';
  }
  if (statusTag) {
    statusTag.className = 'ml-2 bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 px-2 py-0.5 rounded text-[11px] font-bold';
    statusTag.innerText = 'Misi Selesai';
  }

  updateRoboLineNumbers(-1);
  logKonsolRobo('🎉 Seluruh instruksi RoboMind selesai dieksekusi dengan sukses!', 'success');
  playSound('fanfare');
  tambahPoin(20);

  if (autoToast) {
    showToast('Hebat! Skrip RoboMind berhasil dijalankan! 🤖🏆 (+20 Bintang)', 'success');
  }
}

function resetRoboMindStateOnly() {
  if (robomindState.timerId) {
    clearTimeout(robomindState.timerId);
    robomindState.timerId = null;
  }
  robomindState.robotX = robomindState.startX;
  robomindState.robotY = robomindState.startY;
  robomindState.robotDir = robomindState.startDir;
  robomindState.isPainting = false;
  robomindState.paintColor = 'white';
  robomindState.heldBeacons = 0;
  robomindState.stepIndex = 0;
  robomindState.isRunning = false;
  robomindState.isPaused = false;

  // Kembalikan posisi beacon ke kondisi awal
  robomindState.beacons = JSON.parse(JSON.stringify(robomindState.initialBeacons));

  // Kembalikan jejak cat putih asli bawaan map
  initDefaultWhiteTrail();

  // Render ulang grid dengan posisi beacon dan jejak awal
  renderRoboMindGrid();

  const bubble = document.getElementById('robomind-speech-bubble');
  if (bubble) bubble.classList.add('hidden');

  updateRoboMindRobotSprite();
  updateRoboBeaconUI();
  updateRoboLineNumbers(-1);
}

function resetRoboMind() {
  playSound('click');
  resetRoboMindStateOnly();

  const runBtn = document.getElementById('btn-robomind-run');
  const statusTag = document.getElementById('robomind-status-tag');
  if (runBtn) {
    runBtn.className = 'bg-emerald-600 hover:bg-emerald-500 text-white font-title font-bold px-4 py-1.5 rounded-xl shadow-md transition flex items-center gap-2 text-xs sm:text-sm';
    runBtn.innerHTML = '<i class="fa-solid fa-play"></i> <span>Play / Run</span>';
  }
  if (statusTag) {
    statusTag.className = 'ml-2 bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 px-2 py-0.5 rounded text-[11px] font-bold';
    statusTag.innerText = 'Siap Dijalankan';
  }

  logKonsolRobo('⏹ Posisi robot dan arena gurun RoboMind telah di-reset ke kondisi awal.', 'normal');
}

function resetRoboMindScript() {
  playSound('click');
  gantiMisiRoboMind('custom');
}

function ubahKecepatanRoboMind(speedMs) {
  robomindState.speedMs = parseInt(speedMs, 10) || 450;
  logKonsolRobo(`⏱ Kecepatan eksekusi diatur ke ${robomindState.speedMs} ms per langkah`, 'normal');
}

function zoomRoboArena(mode) {
  playSound('click');
  const vp = document.getElementById('robomind-world-viewport');
  if (!vp) return;

  if (mode === 'in') {
    robomindState.zoomScale = Math.min(1.4, robomindState.zoomScale + 0.1);
  } else if (mode === 'out') {
    robomindState.zoomScale = Math.max(0.7, robomindState.zoomScale - 0.1);
  } else {
    robomindState.zoomScale = 1.0;
  }

  vp.style.transform = `scale(${robomindState.zoomScale})`;
  showToast(`Zoom Arena: ${Math.round(robomindState.zoomScale * 100)}%`);
}

let isRoboFullscreenActive = false;

function toggleRoboFullscreen(forceState = null) {
  playSound('click');
  const frame = document.getElementById('robomind-window-frame');
  const iconFs = document.getElementById('icon-robomind-fs');
  const textFs = document.getElementById('text-robomind-fs');
  const btnWinMax = document.getElementById('robomind-btn-win-max');

  if (!frame) return;

  const nextState = (forceState !== null) ? forceState : !isRoboFullscreenActive;
  isRoboFullscreenActive = nextState;

  if (isRoboFullscreenActive) {
    frame.classList.add('robomind-fullscreen-mode');
    document.body.style.overflow = 'hidden';

    // Coba native requestFullscreen pada frame
    if (!document.fullscreenElement && frame.requestFullscreen) {
      frame.requestFullscreen().catch(() => {});
    }

    if (iconFs) iconFs.className = 'fa-solid fa-compress text-xs text-amber-300';
    if (textFs) textFs.innerText = 'Keluar Layar Penuh';
    if (btnWinMax) {
      btnWinMax.innerText = '🗗';
      btnWinMax.title = 'Pulihkan Ukuran Jendela';
    }

    showToast('Mode Layar Penuh Aktif! Anak dapat melihat satu layar penuh ⛶ (Tekan ESC untuk kembali)', 'info');
  } else {
    frame.classList.remove('robomind-fullscreen-mode');
    document.body.style.overflow = '';

    // Keluar dari native fullscreen jika sedang aktif
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }

    if (iconFs) iconFs.className = 'fa-solid fa-expand text-xs';
    if (textFs) textFs.innerText = 'Layar Penuh';
    if (btnWinMax) {
      btnWinMax.innerText = '□';
      btnWinMax.title = 'Layar Penuh (Full Screen)';
    }

    showToast('Kembali ke tampilan standar jendela.');
  }
}

function closeRoboWindowOrExitFs() {
  if (isRoboFullscreenActive) {
    toggleRoboFullscreen(false);
  } else {
    showToast('Gunakan tab navigasi di atas untuk berpindah menu', 'info');
  }
}

// Deteksi tombol Escape dan perubahan event native fullscreen browser
document.addEventListener('fullscreenchange', () => {
  if (!document.fullscreenElement) {
    if (isRoboFullscreenActive) toggleRoboFullscreen(false);
    if (isExcelFullscreenActive) toggleExcelFullscreen(false);
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (isRoboFullscreenActive) toggleRoboFullscreen(false);
    if (isExcelFullscreenActive) toggleExcelFullscreen(false);
  }
});

function undoRoboScript() {
  if (robomindState.historyIndex > 0) {
    playSound('click');
    robomindState.historyIndex--;
    const editorEl = document.getElementById('robomind-script-editor');
    if (editorEl) {
      editorEl.value = robomindState.history[robomindState.historyIndex];
      updateRoboLineNumbers();
    }
  }
}

function redoRoboScript() {
  if (robomindState.historyIndex < robomindState.history.length - 1) {
    playSound('click');
    robomindState.historyIndex++;
    const editorEl = document.getElementById('robomind-script-editor');
    if (editorEl) {
      editorEl.value = robomindState.history[robomindState.historyIndex];
      updateRoboLineNumbers();
    }
  }
}

function simpanScriptRoboMind() {
  playSound('fanfare');
  const editorEl = document.getElementById('robomind-script-editor');
  const content = editorEl ? editorEl.value : '';

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const link = document.createElement('a');
  link.download = `RoboMind-Script-${Date.now()}.irobo`;
  link.href = URL.createObjectURL(blob);
  link.click();

  tambahPoin(15);
  showToast('File skrip RoboMind (.irobo) berhasil disimpan ke komputer! 💾 (+15 Bintang)', 'success');
}

function bukaModalMisiRobo() {
  playSound('click');
  const selectEl = document.getElementById('robomind-mission-select');
  if (selectEl) {
    selectEl.focus();
    showToast('Pilih salah satu dari 4 misi petualangan RoboMind di menu dropdown!');
  }
}

function bukaRoboMenu(menu) {
  playSound('click');
  const menuInfo = {
    file: '📁 Menu File: Buat Skrip Baru, Buka Misi, atau Simpan Skrip .irobo ke komputermu!',
    edit: '✏️ Menu Edit: Gunakan Undo, Redo, atau sisipkan perintah cepat RoboMind.',
    view: '🔍 Menu View: Perbesar (Zoom In), Perkecil (Zoom Out), atau Reset pandangan arena.',
    run: '▶️ Menu Run: Klik Play (F5) untuk jalankan penuh, atau Step untuk selangkah demi selangkah.',
    help: '❓ Menu Help: RoboMind mendukung perintah forward(n), backward(n), left(), right(), paintWhite(), paintBlack(), stopPainting(), say("..."), dan repeat(n) { ... }'
  };
  showToast(menuInfo[menu] || 'Menu RoboMind 7.0 Aktif');
}

// Inisialisasi Event Listener Dokumen
document.addEventListener('DOMContentLoaded', () => {
  try { renderP1TextPreview(); } catch (e) { console.warn('renderP1TextPreview init:', e); }
  try { loadQuizQuestion(); } catch (e) { console.warn('loadQuizQuestion init:', e); }
  try { updateStudioPoster(); } catch (e) { console.warn('updateStudioPoster init:', e); }
  try { 
    if (wordElements.length === 0) {
      loadPresetPosterLingkungan('indonesia_hebat');
    } else {
      renderWordElements(); 
    }
  } catch (e) { console.warn('renderWordElements init:', e); }
  try { muatContohCoding('salam'); } catch (e) { console.warn('muatContohCoding init:', e); }
  try { initExcelSpreadsheet(); } catch (e) { console.warn('initExcelSpreadsheet init:', e); }
  try { initRoboMindSimulator(); } catch (e) { console.warn('initRoboMindSimulator init:', e); }
  try { pilihSemester(state.currentSemester || 1); } catch (e) { console.warn('pilihSemester init:', e); }
  try { terapkanBahasa(); } catch (e) { console.warn('terapkanBahasa init:', e); }

  // Cek apakah ada navigasi dari hash URL (contoh: #tab-modul, #tab-msword, atau #tab-msexcel)
  const hash = window.location.hash.replace('#', '').replace('tab-', '');
  if (hash && ['beranda', 'modul', 'msword', 'msexcel', 'demo', 'praktik', 'kuis', 'antariksa'].includes(hash)) {
    switchTab(hash);
  } else {
    setHeaderNavMode('utama');
  }
});

window.addEventListener('hashchange', () => {
  const hash = window.location.hash.replace('#', '').replace('tab-', '');
  if (hash && ['beranda', 'modul', 'msword', 'msexcel', 'demo', 'praktik', 'kuis', 'antariksa'].includes(hash)) {
    switchTab(hash);
  }
});

// ========================================================
// 15. INTERAKSI SUARA MASKOT ROBOT (SAPA "HALO ROBO" DENGAN SUARA JAWABAN)
// ========================================================

function playRoboChime() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    // Bleep-bloop robotic chord (C5 -> E5 -> G5 -> C6)
    const freqs = [523.25, 659.25, 783.99, 1046.50];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);
      gain.gain.setValueAtTime(0.18, now + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.24);
    });
  } catch (e) {
    // Audio fallback safe
  }
}

let roboJawabanIndex = 0;
const daftarJawabanRobo = [
  "Halo teman pintar! Aku Robo-Tzu Chi! Senang sekali kamu menyapaku! Ayo kita belajar coding dan MS Word dengan gembira!",
  "Bip bop! Halo sobat cilik! Aku siap menemanimu belajar teknologi, logika, dan budi pekerti hari ini di SDS Cinta Kasih Tzu Chi!",
  "Halo kawan hebat! Semangat belajarnya ya! Klik tombol Semester 1 atau Semester 2 untuk mulai petualangan seru kita!",
  "Halo! Aku robot asisten belajarmu. Ayo raih bintang sebanyak-banyaknya di Lab MS Word dan MS Excel!"
];

function sapaRobotHalo(customGreetingOrEvent) {
  // Jika dipanggil dari event onclick, hindari bubbling
  if (customGreetingOrEvent && typeof customGreetingOrEvent === 'object' && customGreetingOrEvent.stopPropagation) {
    customGreetingOrEvent.stopPropagation();
  }

  // Bunyikan chime robotik futuristik
  playRoboChime();

  const bubbleText = document.getElementById('robot-speech-text');
  const robotCard = document.getElementById('robot-mascot-card');
  const waveIndicator = document.getElementById('robo-speaking-wave');
  const mascotImg = document.getElementById('robot-mascot-img');

  // Tentukan teks jawaban
  let pesanJawab = '';
  if (typeof customGreetingOrEvent === 'string' && customGreetingOrEvent.trim().length > 0) {
    pesanJawab = customGreetingOrEvent;
  } else {
    pesanJawab = daftarJawabanRobo[roboJawabanIndex % daftarJawabanRobo.length];
    roboJawabanIndex++;
  }

  // Update teks pada balon ucapan
  if (bubbleText) {
    bubbleText.innerText = pesanJawab;
  }

  // Animasi ekspresi robot
  if (robotCard) {
    robotCard.classList.add('scale-105');
    setTimeout(() => robotCard.classList.remove('scale-105'), 400);
  }
  if (mascotImg) {
    mascotImg.classList.add('animate-bounce');
    setTimeout(() => mascotImg.classList.remove('animate-bounce'), 1200);
  }

  // Tampilkan indikator suara sedang berbicara
  if (waveIndicator) {
    waveIndicator.classList.remove('hidden');
  }

  // Tambahkan poin bintang siswa
  tambahPoin(5);
  if (typeof customGreetingOrEvent === 'string' && customGreetingOrEvent.trim().length > 0) {
    showToast('Robo-Tzu Chi menjawab pertanyaanmu! 🤖✨ (+5 Bintang)', 'success');
  } else {
    showToast('Robo-Tzu Chi: "Halo sobat cilik!" 🤖✨ (+5 Bintang)', 'success');
  }

  const isEnglish = (state && state.currentLang === 'en');

  // Suarakan jawaban robot secara nyata menggunakan Web Speech API
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(pesanJawab);
    utterance.lang = isEnglish ? 'en-US' : 'id-ID';
    
    // Karakteristik Suara Anak Kecil Cowok (Laki-laki Cilik Ceria & Imut):
    utterance.pitch = 1.35; 
    utterance.rate = 1.08;

    // Cari dan pilih profil suara yang cocok untuk anak laki-laki / anak kecil ceria sesuai bahasa aktif
    const voices = window.speechSynthesis.getVoices();
    let boyVoice = null;

    if (voices && voices.length > 0) {
      if (isEnglish) {
        // Mode ENGLISH: Cari suara anak laki-laki / English boy/child/male
        boyVoice = voices.find(v => {
          const name = (v.name || '').toLowerCase();
          const isEn = v.lang.includes('en') || v.lang.includes('EN');
          return isEn && (name.includes('child') || name.includes('boy') || name.includes('junior') || name.includes('kid'));
        });
        if (!boyVoice) {
          boyVoice = voices.find(v => {
            const name = (v.name || '').toLowerCase();
            const isEn = v.lang.includes('en') || v.lang.includes('EN');
            return isEn && (name.includes('male') || name.includes('george') || name.includes('david') || name.includes('guy') || name.includes('mark'));
          });
        }
        if (!boyVoice) {
          boyVoice = voices.find(v => v.lang.includes('en') || v.lang.includes('EN'));
        }
      } else {
        // Mode INDONESIAN: Cari suara anak laki-laki Bahasa Indonesia
        boyVoice = voices.find(v => {
          const name = (v.name || '').toLowerCase();
          const isIndo = (v.lang.includes('id') || v.lang.includes('ID'));
          return isIndo && (name.includes('child') || name.includes('boy') || name.includes('junior') || name.includes('kid'));
        });
        if (!boyVoice) {
          boyVoice = voices.find(v => {
            const name = (v.name || '').toLowerCase();
            const isIndo = (v.lang.includes('id') || v.lang.includes('ID'));
            return isIndo && (name.includes('ardi') || name.includes('andika') || name.includes('male') || name.includes('pria'));
          });
        }
        if (!boyVoice) {
          boyVoice = voices.find(v => v.lang.includes('id') || v.lang.includes('ID'));
        }
      }
    }

    if (boyVoice) {
      utterance.voice = boyVoice;
    }

    utterance.onend = () => {
      if (waveIndicator) waveIndicator.classList.add('hidden');
      const modalSpeaking = document.getElementById('voice-modal-speaking');
      if (modalSpeaking) modalSpeaking.classList.add('hidden');
      const bubbleBadge = document.getElementById('speech-bubble-badge');
      if (bubbleBadge) {
        bubbleBadge.innerText = 'Robo-Tzu Chi';
        bubbleBadge.className = 'text-[11px] font-title font-black text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200';
      }
    };
    utterance.onerror = () => {
      if (waveIndicator) waveIndicator.classList.add('hidden');
      const modalSpeaking = document.getElementById('voice-modal-speaking');
      if (modalSpeaking) modalSpeaking.classList.add('hidden');
      const bubbleBadge = document.getElementById('speech-bubble-badge');
      if (bubbleBadge) {
        bubbleBadge.innerText = 'Robo-Tzu Chi';
        bubbleBadge.className = 'text-[11px] font-title font-black text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200';
      }
    };

    window.speechSynthesis.speak(utterance);
  } else {
    setTimeout(() => {
      if (waveIndicator) waveIndicator.classList.add('hidden');
      const modalSpeaking = document.getElementById('voice-modal-speaking');
      if (modalSpeaking) modalSpeaking.classList.add('hidden');
      const bubbleBadge = document.getElementById('speech-bubble-badge');
      if (bubbleBadge) {
        bubbleBadge.innerText = 'Robo-Tzu Chi';
        bubbleBadge.className = 'text-[11px] font-title font-black text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200';
      }
    }, 3500);
  }
}

// Kompatibilitas untuk pemanggil sapaRobotLucu
function sapaRobotLucu() {
  sapaRobotHalo();
}

// ========================================================
// 16. MESIN KECERDASAN TANYA-JAWAB ROBO-TZU CHI (AI TUTOR KELAS 4 SD)
// Menjawab Pertanyaan Apapun dari Siswa (Teks & Suara Mikrofon)
// ========================================================

function pilihPertanyaanCepat(teks, event) {
  if (event && event.stopPropagation) event.stopPropagation();
  const inputEl = document.getElementById('input-tanya-robo');
  if (inputEl) {
    inputEl.value = teks;
  }
  prosesPertanyaanKeRobo(teks);
}

function kirimPertanyaanKeRobo(event) {
  if (event && event.stopPropagation) event.stopPropagation();
  const inputEl = document.getElementById('input-tanya-robo');
  if (!inputEl) return;
  const teksTanya = inputEl.value.trim();
  if (!teksTanya) {
    showToast('Tulis pertanyaanmu dulu di kolom tanya ya! 💬', 'info');
    inputEl.focus();
    return;
  }
  prosesPertanyaanKeRobo(teksTanya);
  inputEl.value = '';
}

function prosesPertanyaanKeRobo(rawQuestion) {
  const q = rawQuestion.toLowerCase().trim();
  console.log('Pertanyaan untuk Robo:', q);

  let jawaban = '';

  // 1. Cek Pertanyaan Hitungan / Matematika Cepat
  // Contoh: "berapa 12 + 15", "10 * 5", "50 dibagi 2", "100 - 30", "15 x 4"
  const mathRegex = /(\d+)\s*([\+\-\*\/xX]|tambah|kurang|kali|bagi|dibagi)\s*(\d+)/i;
  const mathMatch = q.match(mathRegex);

  if (mathMatch) {
    const num1 = parseFloat(mathMatch[1]);
    const op = mathMatch[2].toLowerCase();
    const num2 = parseFloat(mathMatch[3]);
    let hasil = 0;
    let namaOp = '';

    if (op === '+' || op === 'tambah') {
      hasil = num1 + num2;
      namaOp = 'ditambah';
    } else if (op === '-' || op === 'kurang') {
      hasil = num1 - num2;
      namaOp = 'dikurang';
    } else if (op === '*' || op === 'x' || op === 'kali') {
      hasil = num1 * num2;
      namaOp = 'dikali';
    } else if (op === '/' || op === 'bagi' || op === 'dibagi') {
      hasil = num2 !== 0 ? Math.round((num1 / num2) * 100) / 100 : 'tidak terhingga';
      namaOp = 'dibagi';
    }

    jawaban = `Hasil dari ${num1} ${namaOp} ${num2} adalah ${hasil}! Hebat sekali, kamu anak pintar yang suka berhitung! ✨`;
  }
  // 2. Kecerdasan Buatan (AI) & Coding
  else if (q.includes('apa itu ai') || q.includes('arti ai') || q.includes('artificial intelligence') || q.includes('kecerdasan buatan')) {
    jawaban = 'AI atau Artificial Intelligence adalah Kecerdasan Buatan! Komputer dilatih agar bisa berpikir, mengenali gambar, dan membantu manusia menyelesaikan tugas dengan cepat dan cerdas!';
  } else if (q.includes('coding') || q.includes('pemrograman') || q.includes('koding')) {
    jawaban = 'Coding adalah cara kita memberi petunjuk langkah demi langkah kepada komputer menggunakan bahasa kode, agar komputer bisa membuat game, animasi, dan aplikasi keren!';
  } else if (q.includes('algoritma')) {
    jawaban = 'Algoritma adalah urutan langkah logis dan teratur untuk menyelesaikan suatu masalah! Contoh sederhananya adalah langkah membuat mie instan atau menyusun balok lego!';
  } else if (q.includes('scratch') || q.includes('blockly')) {
    jawaban = 'Scratch adalah platform coding visual yang sangat seru! Kita tidak perlu mengetik teks rumit, cukup menyusun balok-balok warna-warni seperti puzzle untuk membuat game!';
  } else if (q.includes('robomind') || q.includes('robot')) {
    jawaban = 'Robot adalah mesin pintar yang diprogram untuk bekerja secara otomatis! Di Semester 2, kita bisa memprogram robot RoboMind menjelajahi labirin dan mengambil barang!';
  }
  // 3. Microsoft Word
  else if (q.includes('word') || q.includes('pengolah kata')) {
    jawaban = 'Microsoft Word adalah aplikasi pengolah kata untuk mengetik tugas sekolah, membuat surat, poster kreatif, dan merapikan tulisan dengan berbagai warna dan font!';
  } else if (q.includes('bold') || q.includes('tebal')) {
    jawaban = 'Tombol Bold dengan huruf B tebal digunakan untuk menebalkan teks agar judul atau kata penting lebih jelas terlihat! Shortcut-nya adalah tombol Ctrl + B.';
  } else if (q.includes('italic') || q.includes('miring')) {
    jawaban = 'Tombol Italic dengan huruf I miring digunakan untuk membuat tulisan menjadi miring, biasanya untuk istilah asing atau penekanan kata!';
  } else if (q.includes('underline') || q.includes('garis bawah')) {
    jawaban = 'Tombol Underline dengan huruf U bergaris bawah berfungsi memberi garis di bawah kata penting agar pembaca langsung memperhatikannya!';
  } else if (q.includes('font') || q.includes('huruf')) {
    jawaban = 'Font adalah jenis gaya huruf! Di menu Home MS Word, kamu bisa memilih jenis huruf seperti Arial, Times New Roman, serta mengatur ukuran besarnya huruf!';
  } else if (q.includes('simpan') || q.includes('save')) {
    jawaban = 'Untuk menyimpan dokumen hasil karyamu, klik menu File lalu pilih Save, atau tekan tombol cepat Ctrl + S di keyboard agar dokumen tidak hilang!';
  }
  // 4. Microsoft Excel
  else if (q.includes('excel') || q.includes('pengolah angka')) {
    jawaban = 'Microsoft Excel adalah lembar kerja berupa tabel kotak-kotak (kolom dan baris) yang sangat hebat untuk mengolah angka, membuat grafik, dan menghitung otomatis!';
  } else if (q.includes('sum') || q.includes('tambah di excel') || q.includes('penjumlahan di excel') || q.includes('rumus excel') || q.includes('rumus penjumlahan')) {
    jawaban = 'Di Excel, semua rumus diawali tanda sama dengan (=). Untuk menjumlahkan banyak angka sekaligus, gunakan rumus =SUM(sel_awal:sel_akhir)! Praktis dan cepat!';
  } else if (q.includes('average') || q.includes('rata-rata')) {
    jawaban = 'Rumus =AVERAGE(sel_awal:sel_akhir) di Excel digunakan untuk mencari nilai rata-rata dari sekelompok angka dengan cepat!';
  } else if (q.includes('max') || q.includes('min') || q.includes('terbesar') || q.includes('terkecil')) {
    jawaban = 'Gunakan rumus =MAX untuk mencari angka terbesar, dan gunakan rumus =MIN untuk mencari angka terkecil di lembar kerja Excel!';
  } else if (q.includes('sel') || q.includes('cell') || q.includes('kolom') || q.includes('baris')) {
    jawaban = 'Cell atau sel adalah kotak pertemuan antara kolom huruf (seperti A, B, C) dan baris angka (seperti 1, 2, 3), contohnya sel A1 atau sel B5!';
  }
  // 5. BUDAYA HUMANIS TZU CHI & BUDI PEKERTI LUHUR
  else if (q.includes('budaya humanis') || q.includes('humanis') || q.includes('budaya tzu chi') || q.includes('humanis tzu chi')) {
    jawaban = 'Budaya Humanis Tzu Chi adalah pendidikan karakter berbasis cinta kasih universal yang tercermin dalam empat pilar luhur: Gan En (Bersyukur), Zun Zhong (Menghormati), dan Ai Xin (Saling Mengasihi)! Budaya ini diwujudkan dalam setiap tutur kata, tata krama, dan tindakan nyata sehari-hari!';
  } else if (q.includes('misi') && (q.includes('tzu chi') || q.includes('suci') || q.includes('cuci') || q.includes('empat') || q.includes('4'))) {
    jawaban = 'Yayasan Buddha Tzu Chi memiliki Empat Misi Utama: 1. Misi Amal (menolong sesama yang membutuhkan), 2. Misi Kesehatan (rumah sakit dan pengobatan gratis), 3. Misi Pendidikan (sekolah berkarakter humanis seperti SDS Cinta Kasih), dan 4. Misi Budaya Humanis (menyebarkan pesan kebajikan melalui media DAAI TV)!';
  } else if (q.includes('gan en') || q.includes('ganen') || q.includes('bersyukur')) {
    jawaban = 'Gan En artinya bersyukur dengan sepenuh hati! Di Tzu Chi, kita selalu mengucapkan "Gan En" kepada siapa pun, karena bersyukur membuat batin kita tenang, penuh penghargaan, dan selalu merasa cukup!';
  } else if (q.includes('hu ai') || q.includes('huai') || q.includes('saling mengasihi') || q.includes('da ai') || q.includes('daai') || q.includes('cinta kasih universal')) {
    jawaban = 'Da Ai adalah Cinta Kasih Universal tanpa membeda-bedakan suku, agama, dan bangsa! Sedangkan Hu Ai adalah sikap saling mengasihi, tolong-menolong, dan peduli kepada sesama teman serta makhluk hidup di bumi!';
  } else if (q.includes('celengan bambu') || q.includes('celengan') || q.includes('bambu')) {
    jawaban = 'Celengan Bambu adalah awal mula berdirinya Yayasan Tzu Chi pada tahun 1966! Tiga puluh ibu rumah tangga menyisihkan sedikit uang belanja 50 sen setiap hari ke tabung bambu untuk menolong orang susah. Niat baik kecil yang dilakukan setiap hari akan berbuah kebajikan raksasa!';
  } else if (q.includes('pelestarian lingkungan') || q.includes('daur ulang') || q.includes('posko')) {
    jawaban = 'Pelestarian Lingkungan Tzu Chi bermula dari ajakan Master Cheng Yen: "Gunakan sepasang tangan yang bertepuk tangan untuk melakukan daur ulang!" Di posko pelestarian lingkungan, kita memilah botol plastik, kertas, dan sampah untuk menyelamatkan bumi kita tercinta!';
  } else if (q.includes('isyarat tangan') || q.includes('shou yu') || q.includes('shouyu') || q.includes('bahasa isyarat')) {
    jawaban = 'Bahasa Isyarat Tangan (Shou Yu) di Tzu Chi adalah lagu cinta kasih yang diperagakan dengan gerakan tangan indah dan anggun, untuk menyampaikan pesan kebaikan, kedamaian, dan ketulusan hati tanpa kata-kata!';
  } else if (q.includes('tata krama') || q.includes('berjalan') || q.includes('duduk') || q.includes('makan') || q.includes('naga memainkan mutiara')) {
    jawaban = 'Tata Krama Budaya Humanis Tzu Chi melatih keanggunan diri: "Berdiri bagai pohon pinus yang tegak, Duduk bagai lonceng yang kokoh, Berjalan bagai semilir angin yang anggun, dan Tidur bagai busur panah yang tenang!" Saat makan, kita memegang mangkuk dengan anggun bagai "Naga Memainkan Mutiara"!';
  } else if (q.includes('daai tv') || q.includes('televisi daai')) {
    jawaban = 'DAAI TV adalah stasiun televisi cinta kasih dari Yayasan Tzu Chi yang menayangkan program-program inspiratif, jernih, dan mendidik untuk menyebarkan energi positif bagi seluruh keluarga!';
  } else if (q.includes('perenungan') || q.includes('jing si yu') || q.includes('master cheng yen') || q.includes('kata bijak tzu chi')) {
    jawaban = 'Master Cheng Yen berpesan dalam Kata Perenungan: "Ada dua hal yang tidak boleh ditunda dalam hidup: berbakti kepada orang tua dan berbuat kebajikan." Mari kita selalu mengamalkan cinta kasih setiap hari!';
  } else if (q.includes('tzu chi') || q.includes('suci') || q.includes('cuci') || q.includes('cinta kasih')) {
    jawaban = 'Yayasan Buddha Tzu Chi berlandaskan cinta kasih universal untuk semua manusia tanpa memandang perbedaan! Master Cheng Yen mengajarkan kita untuk selalu bersyukur, menghormati, dan saling mengasihi!';
  } else if (q.includes('sekolah') || q.includes('sds cinta kasih')) {
    jawaban = 'SDS Cinta Kasih Tzu Chi adalah sekolah unggulan yang berlandaskan Budaya Humanis, memadukan ilmu teknologi modern dengan budi pekerti luhur agar murid-murid tumbuh menjadi generasi cerdas dan berhati mulia!';
  } else if (q.includes('hemat') || q.includes('lingkungan') || q.includes('sampah')) {
    jawaban = 'Menjaga bumi adalah tanggung jawab kita! Mari hemat listrik, matikan keran air setelah digunakan, bawa botol minum sendiri, dan kurangi penggunaan plastik sekali pakai!';
  }
  // 6. Sains, Planet & Luar Angkasa
  else if (q.includes('bumi') || q.includes('earth')) {
    jawaban = 'Bumi adalah planet indah tempat tinggal kita! Bumi berputar pada porosnya (rotasi) menghasilkan siang dan malam, serta mengelilingi matahari (revolusi) selama 365 seperempat hari!';
  } else if (q.includes('komet')) {
    jawaban = 'Komet adalah bola salju kosmik dari es dan debu batu di antariksa! Saat mendekati matahari, esnya menguap dan membentuk ekor bercahaya spektakuler!';
  } else if (q.includes('saturnus') || q.includes('cincin')) {
    jawaban = 'Saturnus adalah planet tercantik di tata surya dengan ribuan cincin memukau yang terbuat dari bongkahan es dan debu angkasa!';
  } else if (q.includes('gravitasi')) {
    jawaban = 'Gravitasi adalah gaya tarik bumi yang membuat kita dan benda-benda di sekitar tetap menapak di lantai dan tidak melayang-layang ke angkasa!';
  } else if (q.includes('matahari') || q.includes('bintang')) {
    jawaban = 'Matahari adalah bintang raksasa paling dekat dengan bumi yang memberikan cahaya, kehangatan, dan energi untuk seluruh kehidupan di planet kita!';
  } else if (q.includes('pelangi')) {
    jawaban = 'Pelangi terbentuk saat sinar matahari melewati butir-butir air hujan di udara, sehingga cahayanya dibiaskan menjadi 7 warna indah: merah, jingga, kuning, hijau, biru, nila, dan ungu!';
  } else if (q.includes('bulan') || q.includes('fase bulan')) {
    jawaban = 'Bulan adalah satelit alami Bumi yang tidak memancarkan cahaya sendiri, melainkan memantulkan cahaya matahari! Bentuk bulan tampak berubah-ubah karena revolusi bulan mengelilingi Bumi.';
  }

  // 7. ILMU PENGETAHUAN ALAM (IPA KELAS 4 SD)
  // Fotosintesis, Bagian Tumbuhan, Wujud Benda, Energi, Metamorfosis, Rantai Makanan
  else if (q.includes('fotosintesis') || q.includes('tumbuhan memasak')) {
    jawaban = 'Fotosintesis adalah proses tumbuhan hijau memasak makanannya sendiri menggunakan bantuan cahaya matahari, air dari tanah, dan karbon dioksida di udara! Proses ini menghasilkan oksigen segar untuk kita bernapas!';
  } else if (q.includes('klorofil') || q.includes('zat hijau')) {
    jawaban = 'Klorofil adalah zat hijau daun pada tumbuhan yang berfungsi menyerap energi cahaya matahari untuk proses fotosintesis!';
  } else if (q.includes('bagian tumbuhan') || q.includes('akar') || q.includes('batang') || q.includes('daun')) {
    jawaban = 'Tumbuhan memiliki akar untuk menyerap air dan mineral, batang untuk menyalurkan sari makanan, daun untuk tempat fotosintesis, serta bunga dan buah untuk perkembangbiakan!';
  } else if (q.includes('wujud benda') || q.includes('padat') || q.includes('cair') || q.includes('gas')) {
    jawaban = 'Ada 3 wujud benda utama: Padat (bentuk dan volumenya tetap seperti batu), Cair (bentuk mengikuti wadah seperti air), dan Gas (mengisi seluruh ruangan seperti udara dan uap)!';
  } else if (q.includes('mencair') || q.includes('membeku') || q.includes('menguap') || q.includes('mengembun') || q.includes('menyublim')) {
    jawaban = 'Perubahan wujud benda terjadi karena panas atau dingin: Mencair (es jadi air), Membeku (air jadi es), Menguap (air jadi uap), Mengembun (uap jadi tetes air), dan Menyublim (kapur barus padat jadi gas)!';
  } else if (q.includes('energi') || q.includes('sumber energi') || q.includes('kekekalan energi')) {
    jawaban = 'Energi adalah kemampuan untuk melakukan usaha. Energi tidak dapat diciptakan atau dimusnahkan, tapi dapat berubah bentuk! Contoh: energi listrik berubah jadi energi gerak pada kipas angin.';
  } else if (q.includes('rantai makanan') || q.includes('ekosistem') || q.includes('jaring-jaring makanan')) {
    jawaban = 'Rantai makanan adalah peristiwa makan dan dimakan antar makhluk hidup! Dimulai dari produsen (tumbuhan hijau), konsumen 1 (herbivora seperti ulat), konsumen 2 (karnivora seperti burung), hingga pengurai (jamur/bakteri)!';
  } else if (q.includes('metamorfosis') || q.includes('kupu-kupu') || q.includes('katak')) {
    jawaban = 'Metamorfosis sempurna pada kupu-kupu melalui 4 tahap: Telur menjadi Ulat (larva), menjadi Kepompong (pupa), lalu keluar menjadi Kupu-kupu cantik yang bersayap indah!';
  } else if (q.includes('bunyi') || q.includes('suara merambat')) {
    jawaban = 'Bunyi dihasilkan dari benda yang bergetar! Bunyi merambat melalui media padat, cair, dan gas, tapi tidak dapat merambat di ruang hampa udara.';
  } else if (q.includes('cahaya') || q.includes('sifat cahaya')) {
    jawaban = 'Sifat-sifat cahaya antara lain: merambat lurus, dapat dipantulkan (pada cermin), dapat dibiaskan (seperti sendok bengkok di gelas air), dan menembus benda bening!';
  }

  // 8. ILMU PENGETAHUAN SOSIAL (IPS KELAS 4 SD) & GEOGRAFI
  // Kenampakan Alam, Peta, Profesi, Kebutuhan Ekonomi, Lingkungan Tempat Tinggal
  else if (q.includes('kenampakan alam') || q.includes('dataran tinggi') || q.includes('dataran rendah') || q.includes('gunung') || q.includes('pantai')) {
    jawaban = 'Kenampakan alam terdiri dari daratan (dataran rendah, dataran tinggi, bukit, dan gunung) serta perairan (sungai, danau, selat, dan laut). Wilayah pantai cocok untuk nelayan dan pariwisata, sedangkan dataran tinggi cocok untuk kebun teh dan sayuran!';
  } else if (q.includes('peta') || q.includes('skala') || q.includes('arah mata angin') || q.includes('kompas')) {
    jawaban = 'Peta adalah gambaran permukaan bumi pada bidang datar dengan skala tertentu. Kompas memiliki 8 arah mata angin dengan arah utama: Utara, Timur, Selatan, dan Barat!';
  } else if (q.includes('kebutuhan manusia') || q.includes('primer') || q.includes('sekunder') || q.includes('tersier')) {
    jawaban = 'Kebutuhan manusia dibagi menjadi: Kebutuhan Primer yang wajib dipenuhi (pangan/makan, sandang/pakaian, papan/rumah), Kebutuhan Sekunder (seperti meja belajar dan sepeda), dan Kebutuhan Tersier (barang mewah)!';
  } else if (q.includes('kegiatan ekonomi') || q.includes('produksi') || q.includes('distribusi') || q.includes('konsumsi')) {
    jawaban = 'Kegiatan ekonomi meliputi 3 tahapan: Produksi (menghasilkan barang oleh produsen), Distribusi (menyalurkan barang oleh distributor), dan Konsumsi (menggunakan/memakai barang oleh konsumen seperti kita)!';
  } else if (q.includes('provinsi') || q.includes('ibu kota indonesia') || q.includes('nusantara') || q.includes('ikn')) {
    jawaban = 'Indonesia adalah negara kepulauan yang memiliki 38 provinsi membentang dari Sabang sampai Merauke! Ibu Kota Negara baru Indonesia bernama Nusantara (IKN) yang terletak di Pulau Kalimantan!';
  }

  // 9. KEBUDAYAAN, BHINNEKA TUNGGAL IKA, PANCASILA & SEJARAH INDONESIA
  // Keragaman Suku, Tari, Rumah Adat, Alat Musik, Sila Pancasila, Pahlawan
  else if (q.includes('pancasila') || q.includes('lambang negara') || q.includes('garuda')) {
    jawaban = 'Pancasila adalah dasar negara kita dengan lambang Garuda Pancasila! Ada 5 sila: 1. Bintang (Ketuhanan), 2. Rantai (Kemanusiaan), 3. Pohon Beringin (Persatuan), 4. Kepala Banteng (Musyawarah), 5. Padi dan Kapas (Keadilan Sosial)!';
  } else if (q.includes('bhinneka tunggal ika') || q.includes('arti bhinneka')) {
    jawaban = 'Bhinneka Tunggal Ika adalah semboyan bangsa Indonesia yang berasal dari kitab Sutasoma karya Mpu Tantular, artinya "Berbeda-beda tetapi tetap satu jua!" Kita harus saling menghargai walau berbeda suku dan agama!';
  } else if (q.includes('suku') || q.includes('keragaman budaya') || q.includes('budaya indonesia')) {
    jawaban = 'Indonesia sangat kaya budaya dengan lebih dari 1.300 suku bangsa! Mulai dari suku Jawa, Sunda, Batak, Minang, Dayak, Bugis, Asmat, hingga Tionghoa yang hidup rukun berdampingan!';
  } else if (q.includes('rumah adat') || q.includes('gadang') || q.includes('joglo') || q.includes('tongkonan')) {
    jawaban = 'Indonesia punya aneka rumah adat unik: Rumah Gadang dengan atap melengkung dari Sumatera Barat, Rumah Joglo dari Jawa Tengah, Tongkonan dari Toraja, dan Honai dari Papua!';
  } else if (q.includes('alat musik') || q.includes('angklung') || q.includes('gamelan') || q.includes('sasando') || q.includes('kolintang')) {
    jawaban = 'Alat musik tradisional Indonesia sangat mendunia! Angklung dari bambu (Jawa Barat), Gamelan (Jawa & Bali), Sasando dari daun lontar (NTT), dan Kolintang (Sulawesi Utara)!';
  } else if (q.includes('tari daerah') || q.includes('tari saman') || q.includes('tari kecak') || q.includes('tari piring') || q.includes('tari jaipong')) {
    jawaban = 'Tari tradisional kita sangat mempesona: Tari Saman yang kompak dari Aceh, Tari Piring dari Minangkabau, Tari Jaipong dari Jawa Barat, dan Tari Kecak dari Bali!';
  } else if (q.includes('batik')) {
    jawaban = 'Batik adalah warisan budaya asli Indonesia yang diakui UNESCO! Dibuat dengan menorehkan cairan lilin malam menggunakan canting pada kain membentuk motif khas Nusantara yang sangat anggun!';
  } else if (q.includes('pahlawan') || q.includes('kartini') || q.includes('soekarno') || q.includes('ki hajar dewantara')) {
    jawaban = 'Kita harus meneladani para pahlawan bangsa! Ir. Soekarno (Proklamator), R.A. Kartini (pejuang emansipasi wanita), dan Ki Hajar Dewantara (Bapak Pendidikan Nasional dengan semboyan Tut Wuri Handayani)!';
  } else if (q.includes('kemerdekaan') || q.includes('17 agustus') || q.includes('proklamasi')) {
    jawaban = 'Hari Kemerdekaan Indonesia diperingati setiap tanggal 17 Agustus 1945, saat teks Proklamasi dibacakan oleh Ir. Soekarno dan Drs. Mohammad Hatta di Jalan Pegangsaan Timur No. 56 Jakarta!';
  }

  // 10. DUNIA OLAHRAGA (PJOK)
  else if (q.includes('sepak bola') || q.includes('sepakbola') || q.includes('futsal')) {
    jawaban = 'Sepak bola dimainkan oleh 2 tim yang masing-masing beranggotakan 11 pemain di lapangan rumput! Tujuannya mencetak gol ke gawang lawan menggunakan kaki atau sundulan kepala!';
  } else if (q.includes('bulu tangkis') || q.includes('badminton')) {
    jawaban = 'Bulu tangkis adalah olahraga kebanggaan Indonesia! Dimainkan menggunakan raket untuk memukul kok (shuttlecock) melewati jaring net, baik di nomor tunggal maupun ganda!';
  } else if (q.includes('bola basket') || q.includes('basket')) {
    jawaban = 'Bola basket dimainkan oleh 2 tim dengan masing-masing 5 pemain. Pemain menggiring bola (dribble) dan berusaha melempar bola masuk ke dalam ring keranjang lawan!';
  } else if (q.includes('renang') || q.includes('berenang')) {
    jawaban = 'Berenang adalah olahraga air yang sangat bagus untuk melatih seluruh otot tubuh dan pernapasan! Ada 4 gaya utama: gaya dada (katak), gaya bebas, gaya punggung, dan gaya kupu-kupu!';
  } else if (q.includes('senam') || q.includes('pemanasan') || q.includes('olahraga')) {
    jawaban = 'Berolahraga secara teratur membuat tubuh kita bugar, sehat, dan berenergi! Jangan lupa melakukan pemanasan sebelum berolahraga agar otot tidak cedera!';
  }

  // 11. KOMPUTER, PERANGKAT KERAS & INTERNET
  else if (q.includes('komputer') || q.includes('perangkat komputer')) {
    jawaban = 'Komputer terdiri dari 3 bagian penting: Hardware (perangkat keras fisik), Software (program aplikasi), dan Brainware (manusia cerdas yang mengoperasikannya seperti kamu)!';
  } else if (q.includes('cpu') || q.includes('otak komputer')) {
    jawaban = 'CPU (Central Processing Unit) adalah otak dari komputer! CPU bertugas memproses semua instruksi, logika, dan perhitungan di dalam sistem komputer!';
  } else if (q.includes('mouse') || q.includes('tetikus')) {
    jawaban = 'Mouse adalah alat penunjuk untuk menggerakkan kursor di layar monitor. Memiliki tombol klik kiri, klik kanan, dan roda scroll untuk menggulir halaman ke atas dan ke bawah!';
  } else if (q.includes('keyboard') || q.includes('papan ketik')) {
    jawaban = 'Keyboard adalah papan ketik berisi huruf, angka, dan tombol fungsi seperti Enter, Spasi, Backspace, dan Shift untuk memasukkan tulisan dan perintah ke komputer!';
  } else if (q.includes('monitor') || q.includes('layar')) {
    jawaban = 'Monitor adalah perangkat keluaran (output) berupa layar yang menampilkan gambar, tulisan, animasi, dan video hasil kerja komputer!';
  } else if (q.includes('internet') || q.includes('website') || q.includes('web')) {
    jawaban = 'Internet adalah jaringan komputer raksasa di seluruh dunia yang saling terhubung! Lewat internet, kita bisa mencari ilmu pengetahuan, menonton video belajar, dan berkirim pesan dengan cepat!';
  }

  // 12. BAHASA INGGRIS (ENGLISH FOR KIDS)
  else if (q.includes('bahasa inggris') || q.includes('terjemah') || q.includes('translate') || q.includes('english')) {
    if (q.includes('selamat pagi')) {
      jawaban = 'Bahasa Inggris dari "Selamat Pagi" adalah "Good morning!" Semangat menyambut hari baru!';
    } else if (q.includes('selamat siang') || q.includes('selamat sore')) {
      jawaban = '"Good afternoon" untuk selamat siang/sore, dan "Good evening" untuk selamat petang!';
    } else if (q.includes('terima kasih')) {
      jawaban = 'Bahasa Inggris dari "Terima kasih" adalah "Thank you!" atau "Thanks a lot!"';
    } else if (q.includes('sama-sama')) {
      jawaban = 'Bahasa Inggris dari "Sama-sama" adalah "You\'re welcome!"';
    } else if (q.includes('buku')) {
      jawaban = 'Buku dalam bahasa Inggris adalah "Book", dan membaca buku adalah "Reading a book"!';
    } else if (q.includes('sekolah')) {
      jawaban = 'Sekolah dalam bahasa Inggris adalah "School", dan siswa adalah "Student"!';
    } else {
      jawaban = 'Belajar Bahasa Inggris itu sangat menyenangkan! Kata-kata dasar penting: "Hello" (Halo), "Friend" (Teman), "Teacher" (Guru), "Study" (Belajar), dan "Smart" (Pintar)! Keep practicing every day!';
    }
  }

  // 13. PENDIDIKAN AGAMA & MODERASI BERAGAMA
  // A. Agama Buddha
  else if (q.includes('buddha') || q.includes('tri ratna') || q.includes('waisak') || q.includes('vihara')) {
    jawaban = 'Agama Buddha berpedoman pada kitab suci Tripitaka. Tempat ibadahnya adalah Vihara, hari raya utamanya adalah Hari Raya Tri Suci Waisak, dan menghormati Tri Ratna (Buddha, Dharma, Sangha). Serta meneladani cinta kasih universal (Metta & Karuna)!';
  }
  // B. Agama Islam
  else if (q.includes('islam') || q.includes('muslim') || q.includes('idul fitri') || q.includes('masjid') || q.includes('al-quran') || q.includes('alquran')) {
    jawaban = 'Agama Islam berpedoman pada kitab suci Al-Qur\'an. Tempat ibadahnya adalah Masjid, menjalankan rukun Islam (seperti salat dan puasa), dengan hari raya besar Idul Fitri dan Idul Adha yang penuh rasa syukur dan silaturahmi!';
  }
  // C. Agama Kristen Protestan
  else if (q.includes('kristen') || q.includes('natal') || q.includes('paskah')) {
    jawaban = 'Agama Kristen berpedoman pada kitab suci Alkitab (Injil). Tempat ibadahnya adalah Gereja, dengan hari raya besar Hari Natal (kelahiran Yesus Kristus) dan Paskah, mengajarkan kasih kepada sesama manusia!';
  }
  // D. Agama Katolik
  else if (q.includes('katolik') || q.includes('paus') || q.includes('ekaristi')) {
    jawaban = 'Agama Katolik berpedoman pada kitab suci Alkitab. Beribadah di Gereja Katolik dipimpin oleh Pastor/Romo, dipimpin oleh Paus di Vatikan, merayakan hari raya Natal dan Paskah, serta menjunjung tinggi sakramen dan cinta kasih!';
  }
  // E. Agama Hindu
  else if (q.includes('hindu') || q.includes('nyepi') || q.includes('pura') || q.includes('weda')) {
    jawaban = 'Agama Hindu berpedoman pada kitab suci Weda. Tempat ibadahnya adalah Pura, dengan hari raya suci Nyepi, Galungan, dan Kuningan, mengamalkan ajaran Tri Hita Karana (harmoni dengan Tuhan, sesama, dan alam)!';
  }
  // F. Agama Konghucu & Moderasi Toleransi Beragama
  else if (q.includes('konghucu') || q.includes('klenteng') || q.includes('imlek')) {
    jawaban = 'Agama Konghucu berpedoman pada kitab suci Si Shu dan Wu Jing. Tempat ibadahnya adalah Klenteng atau Litang, dengan hari raya Tahun Baru Imlek, mengajarkan bakti dan kebajikan!';
  } else if (q.includes('agama') || q.includes('toleransi') || q.includes('rukun')) {
    jawaban = 'Di Indonesia terdapat 6 agama resmi: Islam, Kristen, Katolik, Hindu, Buddha, dan Konghucu. Kita semua adalah saudara sebangsa yang wajib saling menyayangi, menghormati, dan hidup rukun berdampingan!';
  }

  // 14. GEOGRAFI NUSANTARA & DUNIA
  else if (q.includes('geografi') || q.includes('samudra') || q.includes('benua') || q.includes('pulau')) {
    if (q.includes('samudra')) {
      jawaban = 'Indonesia diapit oleh 2 samudra besar dunia: Samudra Pasifik di timur dan Samudra Hindia di barat dan selatan! Samudra adalah lautan yang sangat luas dan dalam!';
    } else if (q.includes('benua')) {
      jawaban = 'Dunia memiliki 7 benua: Asia (terbesar, tempat tinggal kita), Afrika, Amerika Utara, Amerika Selatan, Antartika, Eropa, dan Australia!';
    } else {
      jawaban = 'Geografi adalah ilmu tentang permukaan bumi, iklim, dan bentang alam! Indonesia adalah negara kepulauan terbesar di dunia dengan lebih dari 17.000 pulau, diapit oleh 2 benua (Asia & Australia) dan 2 samudra!';
    }
  } else if (q.includes('iklim') || q.includes('cuaca') || q.includes('musim')) {
    jawaban = 'Indonesia terletak di garis Khatulistiwa dan memiliki iklim Tropis dengan 2 musim: Musim Hujan dan Musim Kemarau! Cuaca adalah keadaan udara di suatu tempat dalam waktu singkat.';
  }
  // 7. Sapaan Ramah & Percakapan dengan Karakter Robo
  else if (q.includes('siapa kamu') || q.includes('nama kamu') || q.includes('siapa namamu')) {
    jawaban = 'Aku adalah Robo-Tzu Chi, maskot robot cerdas SDS Cinta Kasih Tzu Chi! Aku diciptakan untuk menjadi sahabat setiamu dalam belajar coding, AI, dan teknologi!';
  } else if (q.includes('kabar') || q.includes('apa kabar')) {
    jawaban = 'Kabarku sangat luar biasa dan sistem bateraiku terisi penuh 100%! Aku siap menjawab pertanyaan dan belajar bersamamu!';
  } else if (q.includes('terima kasih') || q.includes('makasih')) {
    jawaban = 'Sama-sama teman baik! Senang sekali bisa membantu anak pintar sepertimu. Jika ada yang ingin ditanyakan lagi, jangan ragu ya!';
  } else if (q.includes('lucu') || q.includes('tebak') || q.includes('lelucon')) {
    jawaban = 'Mau tebak-tebakan? Kenapa komputer suka kedinginan? Karena dia punya banyak Windows (jendela) yang terbuka! Hehehe, lucu kan?';
  } else if (q.includes('semangat') || q.includes('motivasi') || q.includes('malas')) {
    jawaban = 'Jangan menyerah ya! Setiap langkah kecil dalam belajar akan membuatmu menjadi anak yang semakin hebat di masa depan!';
  }
  // 8. Jawaban Cerdas & Informatif (Jika Pertanyaan Belum Terjangkau Keyword Khusus)
  else {
    // Bersihkan kata tanya umum agar Robo tidak hanya mengulang kalimat siswa
    const kataKunciBersih = rawQuestion
      .replace(/^(apakah|kenapa|mengapa|bagaimana|apa itu|sebutkan|jelaskan|tahukah kamu|siapakah)\s+/gi, '')
      .replace(/[\?\!\.]/g, '')
      .trim();

    const variasiJawaban = [
      `Itu pertanyaan yang sangat bagus! Dalam sains dan pengetahuan, hal tentang "${kataKunciBersih}" sangat menarik untuk dipelajari. Kamu anak yang cerdas dan kritis, ayo terus bereksplorasi dan catat pertanyaan ini untuk dibahas bersama bapak/ibu guru di kelas ya!`,
      `Pertanyaan hebat! Rasa ingin tahu kamu tentang "${kataKunciBersih}" menunjukkan bahwa kamu gemar belajar. Terus kembangkan wawasanmu di SDS Cinta Kasih Tzu Chi, kamu pasti bisa jadi juara!`,
      `Wah, kamu sangat bersemangat! Mengenai "${kataKunciBersih}", selalu ada banyak hal baru yang seru untuk digali lewat buku dan modul belajarmu. Tetap semangat membaca ya!`,
      `Bip bop! Aku bangga dengan semangat belajarmu tentang "${kataKunciBersih}"! Teruslah rajin bertanya, karena bertanya adalah awal dari kepintaran!`
    ];
    jawaban = variasiJawaban[Math.floor(Math.random() * variasiJawaban.length)];
  }

  // Dukungan Dwibahasa (Bilingual): Jika mode English aktif, sesuaikan jawaban Robo ke English
  if (state && state.currentLang === 'en') {
    if (mathMatch) {
      const num1 = parseFloat(mathMatch[1]);
      const op = mathMatch[2].toLowerCase();
      const num2 = parseFloat(mathMatch[3]);
      let hasil = 0;
      let namaOpEn = '';
      if (op === '+' || op === 'tambah') { hasil = num1 + num2; namaOpEn = 'plus'; }
      else if (op === '-' || op === 'kurang') { hasil = num1 - num2; namaOpEn = 'minus'; }
      else if (op === '*' || op === 'x' || op === 'kali') { hasil = num1 * num2; namaOpEn = 'multiplied by'; }
      else if (op === '/' || op === 'bagi' || op === 'dibagi') { hasil = num2 !== 0 ? (num1 / num2) : 'infinity'; namaOpEn = 'divided by'; }
      jawaban = `Beep boop! The calculation result of ${num1} ${namaOpEn} ${num2} equals ${hasil}! You are a true math champ!`;
    } else if (q.includes('who are you') || q.includes('what is your name')) {
      jawaban = 'I am Robo-Tzu Chi, the smart mascot of SDS Cinta Kasih Tzu Chi! I am here to help you learn coding, AI, and good character!';
    } else if (q.includes('how are you')) {
      jawaban = 'I am feeling great and my batteries are at 100%! Ready to explore science and coding with you!';
    } else if (q.includes('thank')) {
      jawaban = 'You are very welcome! Keep up the great spirit in learning!';
    } else if (q.includes('tzu chi') || q.includes('compassion')) {
      jawaban = 'Buddhist Tzu Chi Foundation is founded on Great Love and universal compassion! Master Cheng Yen teaches us gratitude, respect, and love for everyone!';
    } else if (q.includes('ai') || q.includes('artificial intelligence')) {
      jawaban = 'Artificial Intelligence (AI) is smart technology that helps computers learn and solve problems to make our world better!';
    } else if (q.includes('coding') || q.includes('scratch')) {
      jawaban = 'Coding is like giving instructions to computers! With Scratch, you can make games, animations, and robotic commands easily!';
    } else if (!jawaban || jawaban.startsWith('Itu pertanyaan')) {
      const cleanKeyEn = rawQuestion.replace(/^(what is|who is|can you|how to|explain|tell me about)\s+/gi, '').replace(/[\?\!\.]/g, '').trim();
      jawaban = `That is an awesome question about "${cleanKeyEn}"! Keep exploring, stay curious, and ask your teacher to learn even more!`;
    }
  }

  // Simpan jawaban terakhir untuk tombol ulangi suara
  window._jawabanTerakhirRobo = jawaban;

  // Tampilkan pertanyaan siswa di balon teks
  const userBox = document.getElementById('speech-bubble-user-box');
  const userText = document.getElementById('speech-bubble-user-text');
  if (userBox && userText) {
    userText.innerText = `"${rawQuestion}"`;
    userBox.classList.remove('hidden');
  }

  // Update status badge di atas balon
  const bubbleBadge = document.getElementById('speech-bubble-badge');
  if (bubbleBadge) {
    const isEn = (state && state.currentLang === 'en');
    bubbleBadge.innerText = isEn ? 'Robo Answered 🔊' : 'Robo Menjawab 🔊';
    bubbleBadge.className = 'text-[11px] font-title font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200';
  }

  // Tampilkan di balon maskot utama dan suarakan jawaban via TTS
  sapaRobotHalo(jawaban);
}

// Global Recognition Instance untuk kontrol buka/tutup
let roboActiveRecognition = null;
let isRoboListening = false;
window._jawabanTerakhirRobo = "Halo sobat cilik! Aku Robo-Tzu Chi! Senang sekali bisa mengobrol denganmu! Klik tombol Bicara 🎙️ jika mau bertanya padaku!";

// Fungsi Utama: Siswa Menekan Tombol "Bicara 🎙️" untuk Bertanya ke Robo
function bukaModalBicaraRobo(event) {
  mulaiBicaraKeRobo(event);
}

function mulaiBicaraKeRobo(event) {
  if (event && event.stopPropagation) event.stopPropagation();

  // Buka akses audio di event gesture pengguna (unlock SpeechSynthesis)
  if ('speechSynthesis' in window) {
    window.speechSynthesis.resume();
  }
  playRoboChime();

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const micBtn = document.getElementById('btn-mic-robo');
  const micText = document.getElementById('mic-robo-text');
  const speechBubbleText = document.getElementById('robot-speech-text');
  const userBox = document.getElementById('speech-bubble-user-box');
  const userText = document.getElementById('speech-bubble-user-text');
  const bubbleBadge = document.getElementById('speech-bubble-badge');

  if (!SpeechRecognition) {
    showToast('Browser belum mendukung mikrofon langsung. Silakan ketik atau klik topik pertanyaan!', 'info');
    if (speechBubbleText) {
      speechBubbleText.innerText = 'Browser belum mendukung mikrofon langsung. Silakan ketik pertanyaanmu di kolom bawah ya! 😊';
    }
    return;
  }

  // Jika sedang mendengarkan, hentikan / toggle off
  if (isRoboListening && roboActiveRecognition) {
    try {
      roboActiveRecognition.stop();
    } catch(e) {}
    isRoboListening = false;
    if (micText) micText.innerText = 'Bicara 🎙️';
    if (micBtn) micBtn.classList.remove('ring-4', 'ring-rose-500', 'animate-pulse', 'bg-rose-500', 'text-white');
    return;
  }

  try {
    const recognition = new SpeechRecognition();
    recognition.lang = (state && state.currentLang === 'en') ? 'en-US' : 'id-ID';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    roboActiveRecognition = recognition;

    recognition.onstart = () => {
      isRoboListening = true;
      if (micText) micText.innerText = 'Mendengar... 🔴';
      if (micBtn) {
        micBtn.classList.add('ring-4', 'ring-rose-500', 'animate-pulse', 'bg-rose-500', 'text-white');
      }
      if (bubbleBadge) {
        bubbleBadge.innerText = '🎙️ Robo Mendengarkan...';
        bubbleBadge.className = 'text-[11px] font-title font-black text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200 animate-pulse';
      }
      if (speechBubbleText) {
        speechBubbleText.innerHTML = '<span class="text-rose-600 font-bold">Aku sedang mendengarkan suaramu...</span> Katakan pertanyaanmu sekarang! 🎙️';
      }
      showToast('Robo sedang mendengarkan... Silakan katakan pertanyaanmu! 🎙️', 'info');
    };

    recognition.onresult = (e) => {
      const hasil = e.results[0][0].transcript;
      console.log('Suara siswa berhasil ditangkap:', hasil);
      isRoboListening = false;

      if (micText) micText.innerText = 'Bicara 🎙️';
      if (micBtn) {
        micBtn.classList.remove('ring-4', 'ring-rose-500', 'animate-pulse', 'bg-rose-500', 'text-white');
      }

      // Tampilkan pertanyaan siswa di balon atas robot
      if (userBox && userText) {
        userText.innerText = `"${hasil}"`;
        userBox.classList.remove('hidden');
      }

      // Update kolom input tanya juga
      const inputEl = document.getElementById('input-tanya-robo');
      if (inputEl) inputEl.value = hasil;

      // Robo memproses pertanyaan dan MENJAWAB DENGAN SUARA & DITAMPILKAN DI ATAS MASKOT!
      prosesPertanyaanKeRobo(hasil);
    };

    recognition.onerror = (e) => {
      console.warn('SpeechRecognition error:', e.error);
      isRoboListening = false;
      if (micText) micText.innerText = 'Bicara 🎙️';
      if (micBtn) {
        micBtn.classList.remove('ring-4', 'ring-rose-500', 'animate-pulse', 'bg-rose-500', 'text-white');
      }
      if (bubbleBadge) {
        bubbleBadge.innerText = 'Robo-Tzu Chi';
        bubbleBadge.className = 'text-[11px] font-title font-black text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200';
      }

      if (e.error === 'not-allowed') {
        if (speechBubbleText) speechBubbleText.innerText = 'Izin mikrofon belum aktif di browser. Klik izin mikrofon atau ketik pertanyaanmu ya!';
        showToast('Izin mikrofon belum aktif. Izinkan akses mikrofon di browser.', 'warning');
      } else if (e.error === 'no-speech') {
        if (speechBubbleText) speechBubbleText.innerText = 'Belum ada suara terdengar. Klik tombol "Bicara 🎙️" lagi dan coba bicara lebih dekat ya!';
      } else {
        if (speechBubbleText) speechBubbleText.innerText = 'Klik tombol "Bicara 🎙️" untuk memberi pertanyaan lewat suara padaku!';
      }
    };

    recognition.onend = () => {
      isRoboListening = false;
      if (micText) micText.innerText = 'Bicara 🎙️';
      if (micBtn) {
        micBtn.classList.remove('ring-4', 'ring-rose-500', 'animate-pulse', 'bg-rose-500', 'text-white');
      }
    };

    recognition.start();
  } catch(err) {
    console.error('Error memulai SpeechRecognition:', err);
    if (speechBubbleText) {
      speechBubbleText.innerText = 'Klik tombol "Bicara 🎙️" untuk bertanya padaku!';
    }
  }
}

// Tutup Modal Suara jika dipanggil
function tutupModalBicaraRobo() {
  if (roboActiveRecognition) {
    try {
      roboActiveRecognition.abort();
    } catch(e) {}
    roboActiveRecognition = null;
  }
  isRoboListening = false;
}

// Bertanya langsung dengan memilih salah satu kartu pertanyaan (dijawab suara)
function tanyaVoiceLangsung(pertanyaan) {
  const inputEl = document.getElementById('input-tanya-robo');
  if (inputEl) {
    inputEl.value = pertanyaan;
  }
  prosesPertanyaanKeRobo(pertanyaan);
}

// Mengulangi suara jawaban terakhir Robo
function ulangiSuaraJawabanTerakhir() {
  if (window._jawabanTerakhirRobo) {
    sapaRobotHalo(window._jawabanTerakhirRobo);
  }
}

// Backward compatibility untuk pemanggil lama
function mulaiDengarSuaraSiswa(event) {
  mulaiBicaraKeRobo(event);
}

// ==========================================================================
// 12. SISTEM DATABASE GURU & DASBOR PEMANTAUAN LATIHAN SISWA (SDS TZU CHI)
// ==========================================================================

// Catatan: Konstanta DB_STORAGE_KEY, ACTIVE_STUDENT_KEY, dsb. dideklarasikan di bagian paling atas skrip.

// Default konfigurasi penyimpanan Google Sheets per kelas
const DEFAULT_CLASS_SHEETS_CONFIG = {
  '4A': { label: 'Kelas 4A', sheetUrl: '', tabName: '4A', tingkat: '4', count: 0 },
  '4B': { label: 'Kelas 4B', sheetUrl: '', tabName: '4B', tingkat: '4', count: 0 },
  '4C': { label: 'Kelas 4C', sheetUrl: '', tabName: '4C', tingkat: '4', count: 0 },
  '4D': { label: 'Kelas 4D', sheetUrl: '', tabName: '4D', tingkat: '4', count: 0 },
  '4E': { label: 'Kelas 4E', sheetUrl: '', tabName: '4E', tingkat: '4', count: 0 },
  '5D': { label: 'Kelas 5D', sheetUrl: '', tabName: '5D', tingkat: '5', count: 0 },
  '6A': { label: 'Kelas 6A', sheetUrl: '', tabName: '6A', tingkat: '6', count: 0 },
  '6B': { label: 'Kelas 6B', sheetUrl: '', tabName: '6B', tingkat: '6', count: 0 },
  '6C': { label: 'Kelas 6C', sheetUrl: '', tabName: '6C', tingkat: '6', count: 0 },
  '6D': { label: 'Kelas 6D', sheetUrl: '', tabName: '6D', tingkat: '6', count: 0 },
  '6E': { label: 'Kelas 6E', sheetUrl: '', tabName: '6E', tingkat: '6', count: 0 }
};

// Inisialisasi State Dasbor Guru
state.isGuruLoggedIn = false;
state.subTabGuru = 'gradebook';
state.filterKelasGuru = 'semua';
state.selectedStudentId = null;

// Database Siswa Bawaan (SDS Cinta Kasih Tzu Chi - Kelas 4A, 4B, 4C)
const SEED_STUDENTS = [
  {
    id: 'STD-4A-01',
    nis: '4101',
    nama: 'Aditya Pratama',
    kelas: '4A',
    absen: '01',
    kuisSem1: 100,
    kuisSem2: 90,
    tpSelesai: ['TP 1.1', 'TP 1.2', 'TP 1.3', 'TP 1.4', 'TP 2.1'],
    posterWord: 3,
    excelTabel: 4,
    poinBintang: 325,
    statusKkm: 'Tuntas',
    terakhirAktif: '08 Okt 2026, 10:15',
    catatanGuru: 'Sangat mandiri dan teliti merumuskan tabel Excel dan desain poster.'
  },
  {
    id: 'STD-4A-05',
    nis: '4105',
    nama: 'Bella Angelique',
    kelas: '4A',
    absen: '05',
    kuisSem1: 95,
    kuisSem2: 100,
    tpSelesai: ['TP 1.1', 'TP 1.2', 'TP 1.3', 'TP 2.1'],
    posterWord: 4,
    excelTabel: 3,
    poinBintang: 290,
    statusKkm: 'Tuntas',
    terakhirAktif: '08 Okt 2026, 11:20',
    catatanGuru: 'Kreativitas desain poster luar biasa bernuansa budaya kasih.'
  },
  {
    id: 'STD-4A-08',
    nis: '4108',
    nama: 'Christian Tan',
    kelas: '4A',
    absen: '08',
    kuisSem1: 85,
    kuisSem2: 80,
    tpSelesai: ['TP 1.1', 'TP 1.2', 'TP 2.1'],
    posterWord: 2,
    excelTabel: 2,
    poinBintang: 195,
    statusKkm: 'Tuntas',
    terakhirAktif: '07 Okt 2026, 14:05',
    catatanGuru: 'Cepat tanggap, perlu penguatan pada fungsi =AVERAGE().'
  },
  {
    id: 'STD-4A-12',
    nis: '4112',
    nama: 'Devina Putri',
    kelas: '4A',
    absen: '12',
    kuisSem1: 70,
    kuisSem2: 75,
    tpSelesai: ['TP 1.1', 'TP 2.1'],
    posterWord: 1,
    excelTabel: 1,
    poinBintang: 120,
    statusKkm: 'Remedial',
    terakhirAktif: '06 Okt 2026, 09:30',
    catatanGuru: 'Perlu bimbingan remedial rumus penjumlahan dasar Excel.'
  },
  {
    id: 'STD-4A-15',
    nis: '4115',
    nama: 'Ethan Lim',
    kelas: '4A',
    absen: '15',
    kuisSem1: 90,
    kuisSem2: 85,
    tpSelesai: ['TP 1.1', 'TP 1.2', 'TP 1.3', 'TP 1.4', 'TP 2.1'],
    posterWord: 3,
    excelTabel: 3,
    poinBintang: 255,
    statusKkm: 'Tuntas',
    terakhirAktif: '08 Okt 2026, 08:45',
    catatanGuru: 'Aktif bertanya dan suka membantu teman sekelompok.'
  },
  {
    id: 'STD-4B-02',
    nis: '4202',
    nama: 'Felicia Aurelia',
    kelas: '4B',
    absen: '02',
    kuisSem1: 100,
    kuisSem2: 95,
    tpSelesai: ['TP 1.1', 'TP 1.2', 'TP 1.3', 'TP 1.4', 'TP 2.1'],
    posterWord: 4,
    excelTabel: 4,
    poinBintang: 340,
    statusKkm: 'Tuntas',
    terakhirAktif: '08 Okt 2026, 13:10',
    catatanGuru: 'Sempurna dalam pemformatan border tabel dan poster lingkungan.'
  },
  {
    id: 'STD-4B-07',
    nis: '4207',
    nama: 'Gilbert Chandra',
    kelas: '4B',
    absen: '07',
    kuisSem1: 80,
    kuisSem2: 85,
    tpSelesai: ['TP 1.1', 'TP 1.2', 'TP 1.3', 'TP 2.1'],
    posterWord: 2,
    excelTabel: 3,
    poinBintang: 210,
    statusKkm: 'Tuntas',
    terakhirAktif: '07 Okt 2026, 15:20',
    catatanGuru: 'Mampu menyusun grafik batang Excel dengan rapi.'
  },
  {
    id: 'STD-4B-10',
    nis: '4210',
    nama: 'Helena Wijaya',
    kelas: '4B',
    absen: '10',
    kuisSem1: 90,
    kuisSem2: 90,
    tpSelesai: ['TP 1.1', 'TP 1.2', 'TP 1.4', 'TP 2.1'],
    posterWord: 3,
    excelTabel: 2,
    poinBintang: 240,
    statusKkm: 'Tuntas',
    terakhirAktif: '08 Okt 2026, 11:00',
    catatanGuru: 'Teliti dalam penataan layout font dan warna.'
  },
  {
    id: 'STD-4B-14',
    nis: '4214',
    nama: 'Ignatius Hartono',
    kelas: '4B',
    absen: '14',
    kuisSem1: 65,
    kuisSem2: 70,
    tpSelesai: ['TP 1.1'],
    posterWord: 1,
    excelTabel: 1,
    poinBintang: 95,
    statusKkm: 'Remedial',
    terakhirAktif: '05 Okt 2026, 10:15',
    catatanGuru: 'Dijadwalkan pendampingan guru untuk pengenalan Ribbon Excel.'
  },
  {
    id: 'STD-4B-18',
    nis: '4218',
    nama: 'Jonathan Kusuma',
    kelas: '4B',
    absen: '18',
    kuisSem1: 85,
    kuisSem2: 90,
    tpSelesai: ['TP 1.1', 'TP 1.2', 'TP 1.3', 'TP 2.1'],
    posterWord: 2,
    excelTabel: 2,
    poinBintang: 220,
    statusKkm: 'Tuntas',
    terakhirAktif: '07 Okt 2026, 13:45',
    catatanGuru: 'Logika berpikir komputasional sangat baik.'
  },
  {
    id: 'STD-4C-03',
    nis: '4303',
    nama: 'Katherine Setiawan',
    kelas: '4C',
    absen: '03',
    kuisSem1: 95,
    kuisSem2: 90,
    tpSelesai: ['TP 1.1', 'TP 1.2', 'TP 1.3', 'TP 1.4', 'TP 2.1'],
    posterWord: 3,
    excelTabel: 3,
    poinBintang: 280,
    statusKkm: 'Tuntas',
    terakhirAktif: '08 Okt 2026, 12:40',
    catatanGuru: 'Penyajian diagram batang sangat informatif.'
  },
  {
    id: 'STD-4C-06',
    nis: '4306',
    nama: 'Lucas Surya',
    kelas: '4C',
    absen: '06',
    kuisSem1: 80,
    kuisSem2: 80,
    tpSelesai: ['TP 1.1', 'TP 1.2', 'TP 2.1'],
    posterWord: 2,
    excelTabel: 2,
    poinBintang: 180,
    statusKkm: 'Tuntas',
    terakhirAktif: '06 Okt 2026, 11:15',
    catatanGuru: 'Perlu sedikit latihan pada pengaturan border tebal sel.'
  },
  {
    id: 'STD-4C-09',
    nis: '4309',
    nama: 'Michelle Natalie',
    kelas: '4C',
    absen: '09',
    kuisSem1: 100,
    kuisSem2: 100,
    tpSelesai: ['TP 1.1', 'TP 1.2', 'TP 1.3', 'TP 1.4', 'TP 2.1'],
    posterWord: 5,
    excelTabel: 4,
    poinBintang: 360,
    statusKkm: 'Tuntas',
    terakhirAktif: '08 Okt 2026, 14:05',
    catatanGuru: 'Ketuntasan sempurna, layak menjadi tutor sebaya kelas.'
  },
  {
    id: 'STD-4C-15',
    nis: '4315',
    nama: 'Nicholas Alexander',
    kelas: '4C',
    absen: '15',
    kuisSem1: 75,
    kuisSem2: 80,
    tpSelesai: ['TP 1.1', 'TP 1.2', 'TP 2.1'],
    posterWord: 2,
    excelTabel: 1,
    poinBintang: 160,
    statusKkm: 'Tuntas',
    terakhirAktif: '07 Okt 2026, 09:50',
    catatanGuru: 'Tuntas KKM, terus tingkatkan antusiasme belajar.'
  },
  {
    id: 'STD-4C-20',
    nis: '4320',
    nama: 'Olivia Florencia',
    kelas: '4C',
    absen: '20',
    kuisSem1: 90,
    kuisSem2: 85,
    tpSelesai: ['TP 1.1', 'TP 1.2', 'TP 1.3', 'TP 2.1'],
    posterWord: 3,
    excelTabel: 2,
    poinBintang: 235,
    statusKkm: 'Tuntas',
    terakhirAktif: '08 Okt 2026, 10:55',
    catatanGuru: 'Karya poster sangat harmonis dan rapi.'
  },
  // --- KELAS 4D ---
  {
    id: 'STD-4D-01',
    nis: '4401',
    nama: 'Patrick Jonathan',
    kelas: '4D',
    absen: '01',
    kuisSem1: 90,
    kuisSem2: 85,
    tpSelesai: ['TP 1.1', 'TP 1.2', 'TP 2.1'],
    posterWord: 3,
    excelTabel: 2,
    poinBintang: 230,
    statusKkm: 'Tuntas',
    terakhirAktif: '08 Okt 2026, 10:15',
    catatanGuru: 'Kreatif dan aktif bertanya saat praktik Word dan Excel.'
  },
  {
    id: 'STD-4D-05',
    nis: '4405',
    nama: 'Queen Olivia',
    kelas: '4D',
    absen: '05',
    kuisSem1: 95,
    kuisSem2: 90,
    tpSelesai: ['TP 1.1', 'TP 1.2', 'TP 1.3', 'TP 2.1'],
    posterWord: 4,
    excelTabel: 3,
    poinBintang: 285,
    statusKkm: 'Tuntas',
    terakhirAktif: '08 Okt 2026, 11:20',
    catatanGuru: 'Desain poster sangat rapi dan estetik.'
  },
  // --- KELAS 4E ---
  {
    id: 'STD-4E-01',
    nis: '4501',
    nama: 'Rafael Santoso',
    kelas: '4E',
    absen: '01',
    kuisSem1: 85,
    kuisSem2: 85,
    tpSelesai: ['TP 1.1', 'TP 1.2', 'TP 2.1'],
    posterWord: 2,
    excelTabel: 2,
    poinBintang: 200,
    statusKkm: 'Tuntas',
    terakhirAktif: '07 Okt 2026, 13:30',
    catatanGuru: 'Pemahaman materi tabel Excel dan rumus penjumlahan baik.'
  },
  {
    id: 'STD-4E-05',
    nis: '4505',
    nama: 'Stella Angeline',
    kelas: '4E',
    absen: '05',
    kuisSem1: 100,
    kuisSem2: 95,
    tpSelesai: ['TP 1.1', 'TP 1.2', 'TP 1.3', 'TP 1.4', 'TP 2.1'],
    posterWord: 4,
    excelTabel: 4,
    poinBintang: 330,
    statusKkm: 'Tuntas',
    terakhirAktif: '08 Okt 2026, 14:10',
    catatanGuru: 'Sangat mandiri dan teliti merumuskan tabel Excel.'
  },
  // --- KELAS 5D ---
  {
    id: 'STD-5D-01',
    nis: '5401',
    nama: 'Ahmad Fauzan',
    kelas: '5D',
    absen: '01',
    kuisSem1: 95,
    kuisSem2: 90,
    tpSelesai: ['TP 1.1', 'TP 1.2', 'TP 1.3', 'TP 2.1'],
    posterWord: 3,
    excelTabel: 2,
    poinBintang: 250,
    statusKkm: 'Tuntas',
    terakhirAktif: '08 Okt 2026, 09:15',
    catatanGuru: 'Pemahaman logika pemrograman Scratch sangat kuat.'
  },
  {
    id: 'STD-5D-05',
    nis: '5405',
    nama: 'Clarissa Valerie',
    kelas: '5D',
    absen: '05',
    kuisSem1: 100,
    kuisSem2: 95,
    tpSelesai: ['TP 1.1', 'TP 1.2', 'TP 1.3', 'TP 1.4', 'TP 2.1'],
    posterWord: 4,
    excelTabel: 3,
    poinBintang: 320,
    statusKkm: 'Tuntas',
    terakhirAktif: '08 Okt 2026, 11:30',
    catatanGuru: 'Sangat mandiri dan teliti dalam membuat animasi cerita.'
  },
  {
    id: 'STD-5D-08',
    nis: '5408',
    nama: 'Darren Salim',
    kelas: '5D',
    absen: '08',
    kuisSem1: 85,
    kuisSem2: 90,
    tpSelesai: ['TP 1.1', 'TP 1.2', 'TP 2.1'],
    posterWord: 2,
    excelTabel: 3,
    poinBintang: 210,
    statusKkm: 'Tuntas',
    terakhirAktif: '07 Okt 2026, 14:10',
    catatanGuru: 'Aktif bereksplorasi sensor kamera dan logika robot.'
  },
  // --- KELAS 6 ---
  {
    id: 'STD-6A-01',
    nis: '6101',
    nama: 'Gabriel Christian',
    kelas: '6A',
    absen: '01',
    kuisSem1: 100,
    kuisSem2: 100,
    tpSelesai: ['TP 1.1', 'TP 1.2', 'TP 1.3', 'TP 1.4', 'TP 2.1'],
    posterWord: 5,
    excelTabel: 4,
    poinBintang: 380,
    statusKkm: 'Tuntas',
    terakhirAktif: '08 Okt 2026, 13:45',
    catatanGuru: 'Pemimpin kelompok yang bijaksana dan mahir logika komputasi.'
  },
  {
    id: 'STD-6A-07',
    nis: '6107',
    nama: 'Helena Susanto',
    kelas: '6A',
    absen: '07',
    kuisSem1: 95,
    kuisSem2: 90,
    tpSelesai: ['TP 1.1', 'TP 1.2', 'TP 1.3', 'TP 2.1'],
    posterWord: 4,
    excelTabel: 3,
    poinBintang: 300,
    statusKkm: 'Tuntas',
    terakhirAktif: '07 Okt 2026, 15:30',
    catatanGuru: 'Mampu menyusun presentasi multimedia interaktif dengan sangat baik.'
  },
  {
    id: 'STD-6B-03',
    nis: '6203',
    nama: 'Jonathan Liu',
    kelas: '6B',
    absen: '03',
    kuisSem1: 85,
    kuisSem2: 90,
    tpSelesai: ['TP 1.1', 'TP 1.2', 'TP 2.1'],
    posterWord: 2,
    excelTabel: 3,
    poinBintang: 220,
    statusKkm: 'Tuntas',
    terakhirAktif: '08 Okt 2026, 09:40',
    catatanGuru: 'Tekun dan antusias dalam memecahkan studi kasus robotik.'
  },
  {
    id: 'STD-6B-09',
    nis: '6209',
    nama: 'Keisha Natalie',
    kelas: '6B',
    absen: '09',
    kuisSem1: 90,
    kuisSem2: 95,
    tpSelesai: ['TP 1.1', 'TP 1.2', 'TP 1.3', 'TP 2.1'],
    posterWord: 3,
    excelTabel: 3,
    poinBintang: 275,
    statusKkm: 'Tuntas',
    terakhirAktif: '08 Okt 2026, 11:15',
    catatanGuru: 'Sangat teliti dalam pengolahan data tabel dan grafik.'
  },
  // --- KELAS 6C, 6D, 6E ---
  {
    id: 'STD-6C-01',
    nis: '6301',
    nama: 'Leonhart Surya',
    kelas: '6C',
    absen: '01',
    kuisSem1: 95,
    kuisSem2: 90,
    tpSelesai: ['TP 1.1', 'TP 1.2', 'TP 2.1'],
    posterWord: 3,
    excelTabel: 3,
    poinBintang: 260,
    statusKkm: 'Tuntas',
    terakhirAktif: '08 Okt 2026, 09:50',
    catatanGuru: 'Pemahaman logika berpikir komputasional sangat baik.'
  },
  {
    id: 'STD-6C-05',
    nis: '6305',
    nama: 'Megan Florencia',
    kelas: '6C',
    absen: '05',
    kuisSem1: 100,
    kuisSem2: 95,
    tpSelesai: ['TP 1.1', 'TP 1.2', 'TP 1.3', 'TP 2.1'],
    posterWord: 4,
    excelTabel: 3,
    poinBintang: 310,
    statusKkm: 'Tuntas',
    terakhirAktif: '08 Okt 2026, 11:40',
    catatanGuru: 'Teliti dan kreatif dalam pembuatan dokumen multimedia.'
  },
  {
    id: 'STD-6D-01',
    nis: '6401',
    nama: 'Nathaniel Hartono',
    kelas: '6D',
    absen: '01',
    kuisSem1: 90,
    kuisSem2: 90,
    tpSelesai: ['TP 1.1', 'TP 1.2', 'TP 2.1'],
    posterWord: 3,
    excelTabel: 2,
    poinBintang: 240,
    statusKkm: 'Tuntas',
    terakhirAktif: '07 Okt 2026, 13:20',
    catatanGuru: 'Mampu memecahkan studi kasus robotik dengan cepat.'
  },
  {
    id: 'STD-6D-05',
    nis: '6405',
    nama: 'Patricia Tan',
    kelas: '6D',
    absen: '05',
    kuisSem1: 95,
    kuisSem2: 95,
    tpSelesai: ['TP 1.1', 'TP 1.2', 'TP 1.3', 'TP 2.1'],
    posterWord: 4,
    excelTabel: 3,
    poinBintang: 295,
    statusKkm: 'Tuntas',
    terakhirAktif: '08 Okt 2026, 10:35',
    catatanGuru: 'Sangat rapi dalam penyusunan grafik dan diagram.'
  },
  {
    id: 'STD-6E-01',
    nis: '6501',
    nama: 'Reinhard Wijaya',
    kelas: '6E',
    absen: '01',
    kuisSem1: 90,
    kuisSem2: 95,
    tpSelesai: ['TP 1.1', 'TP 1.2', 'TP 2.1'],
    posterWord: 3,
    excelTabel: 3,
    poinBintang: 270,
    statusKkm: 'Tuntas',
    terakhirAktif: '08 Okt 2026, 09:15',
    catatanGuru: 'Kemampuan analisis komputasi dan pemrograman baik.'
  },
  {
    id: 'STD-6E-05',
    nis: '6505',
    nama: 'Sharon Valerie',
    kelas: '6E',
    absen: '05',
    kuisSem1: 100,
    kuisSem2: 100,
    tpSelesai: ['TP 1.1', 'TP 1.2', 'TP 1.3', 'TP 1.4', 'TP 2.1'],
    posterWord: 5,
    excelTabel: 4,
    poinBintang: 375,
    statusKkm: 'Tuntas',
    terakhirAktif: '08 Okt 2026, 14:00',
    catatanGuru: 'Prestasi luar biasa, mandiri dan berkarakter luhur.'
  }
];

// Helper: Normalisasi nama kelas ke standar (4A, 4B, 4C, 4D, 4E, 5D, 6A, 6B, 6C, 6D, 6E)
function normalisasiNamaKelas(raw, fallback = '4A') {
  if (!raw) return fallback;
  const str = raw.toString().trim();
  const clean = str.toUpperCase().replace(/\s+/g, '').replace(/[-._]/g, '');

  const m = clean.match(/([4-6])([A-E])/);
  if (m) return `${m[1]}${m[2]}`;

  const mRom = clean.match(/(IV|VI|V)([A-E])/);
  if (mRom) {
    const num = mRom[1] === 'IV' ? '4' : mRom[1] === 'VI' ? '6' : '5';
    return `${num}${mRom[2]}`;
  }

  if (clean.length === 1 && 'ABCDE'.includes(clean)) {
    const tgk = fallback ? fallback.charAt(0) : '4';
    return `${tgk}${clean}`;
  }

  const validClasses = ['4A', '4B', '4C', '4D', '4E', '5D', '6A', '6B', '6C', '6D', '6E'];
  if (validClasses.includes(clean)) {
    return clean;
  }

  return fallback;
}
window.normalisasiNamaKelas = normalisasiNamaKelas;

// Helper: Ambil Database Siswa dari localStorage
function getStudentDatabase() {
  try {
    const raw = localStorage.getItem(DB_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(SEED_STUDENTS));
      return JSON.parse(JSON.stringify(SEED_STUDENTS));
    }
    let parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      let changed = false;

      // Bersihkan siswa dummy otomatis jika pernah terbuat dari input sembarang (misal Siswa 4A (1234))
      const originalLen = parsed.length;
      parsed = parsed.filter(s => {
        if (!s || !s.nama) return false;
        if (s.nama.startsWith('Siswa ') && s.nama.includes('(')) return false;
        return true;
      });
      if (parsed.length !== originalLen) {
        changed = true;
      }

      // Pastikan seluruh 11 kelas terisi jika belum ada di database
      const classesNeeded = ['4A', '4B', '4C', '4D', '4E', '5D', '6A', '6B', '6C', '6D', '6E'];
      classesNeeded.forEach(cn => {
        const hasClass = parsed.some(s => s.kelas === cn);
        if (!hasClass) {
          SEED_STUDENTS.filter(s => s.kelas === cn).forEach(ns => {
            if (!parsed.some(p => p.id === ns.id)) parsed.push(ns);
          });
          changed = true;
        }
      });

      parsed.forEach(s => {
        // Pulihkan kelas jika tertimpa 4A padahal NIS atau ID berasal dari kelas lain
        if (s.id && s.id.includes('4B-')) {
          if (s.kelas !== '4B') { s.kelas = '4B'; changed = true; }
        } else if (s.id && s.id.includes('4C-')) {
          if (s.kelas !== '4C') { s.kelas = '4C'; changed = true; }
        } else if (s.id && s.id.includes('4D-')) {
          if (s.kelas !== '4D') { s.kelas = '4D'; changed = true; }
        } else if (s.id && s.id.includes('4E-')) {
          if (s.kelas !== '4E') { s.kelas = '4E'; changed = true; }
        } else if (s.id && s.id.includes('5D-')) {
          if (s.kelas !== '5D') { s.kelas = '5D'; changed = true; }
        } else if (s.id && s.id.includes('6A-')) {
          if (s.kelas !== '6A') { s.kelas = '6A'; changed = true; }
        } else if (s.id && s.id.includes('6B-')) {
          if (s.kelas !== '6B') { s.kelas = '6B'; changed = true; }
        } else if (s.id && s.id.includes('6C-')) {
          if (s.kelas !== '6C') { s.kelas = '6C'; changed = true; }
        } else if (s.id && s.id.includes('6D-')) {
          if (s.kelas !== '6D') { s.kelas = '6D'; changed = true; }
        } else if (s.id && s.id.includes('6E-')) {
          if (s.kelas !== '6E') { s.kelas = '6E'; changed = true; }
        } else if (s.nis && s.nis.startsWith('42')) {
          if (s.kelas !== '4B') { s.kelas = '4B'; changed = true; }
        } else if (s.nis && s.nis.startsWith('43')) {
          if (s.kelas !== '4C') { s.kelas = '4C'; changed = true; }
        } else if (s.nis && s.nis.startsWith('44')) {
          if (s.kelas !== '4D') { s.kelas = '4D'; changed = true; }
        } else if (s.nis && s.nis.startsWith('45')) {
          if (s.kelas !== '4E') { s.kelas = '4E'; changed = true; }
        } else if (s.nis && s.nis.startsWith('54')) {
          if (s.kelas !== '5D') { s.kelas = '5D'; changed = true; }
        } else if (s.nis && s.nis.startsWith('61')) {
          if (s.kelas !== '6A') { s.kelas = '6A'; changed = true; }
        } else if (s.nis && s.nis.startsWith('62')) {
          if (s.kelas !== '6B') { s.kelas = '6B'; changed = true; }
        } else if (s.nis && s.nis.startsWith('63')) {
          if (s.kelas !== '6C') { s.kelas = '6C'; changed = true; }
        } else if (s.nis && s.nis.startsWith('64')) {
          if (s.kelas !== '6D') { s.kelas = '6D'; changed = true; }
        } else if (s.nis && s.nis.startsWith('65')) {
          if (s.kelas !== '6E') { s.kelas = '6E'; changed = true; }
        } else if (s.kelas) {
          const norm = normalisasiNamaKelas(s.kelas, '4A');
          if (s.kelas !== norm) { s.kelas = norm; changed = true; }
        }
        // Perbaiki jika absen rusak / terisi huruf (misal 0P atau 0L)
        if (s.absen && /[a-zA-Z]/.test(s.absen)) {
          s.absen = (s.absen.replace(/[^0-9]/g, '') || '01');
          if (s.absen.length === 1) s.absen = '0' + s.absen;
          changed = true;
        }
        // Perbaiki jika NIS rusak / terisi huruf P atau L
        if (s.nis && (s.nis === 'P' || s.nis === 'L' || s.nis.length < 3)) {
          const matchSeed = SEED_STUDENTS.find(seed => seed.id === s.id);
          if (matchSeed && matchSeed.nis) {
            s.nis = matchSeed.nis;
          } else {
            const m = (s.id || '').match(/(\d{4})/);
            s.nis = m ? m[1] : (s.absen ? `41${s.absen}` : '4101');
          }
          changed = true;
        }
        if (!s.nis) {
          const matchSeed = SEED_STUDENTS.find(seed => seed.id === s.id);
          if (matchSeed && matchSeed.nis) {
            s.nis = matchSeed.nis;
          } else {
            const clsMap = { '4A': '41', '4B': '42', '4C': '43', '4D': '44', '4E': '45', '5D': '54', '6A': '61', '6B': '62', '6C': '63', '6D': '64', '6E': '65' };
            const clsPrefix = clsMap[s.kelas] || '41';
            s.nis = `${clsPrefix}${s.absen || '01'}`;
          }
          changed = true;
        }
        if (s.nilaiPoster === undefined) s.nilaiPoster = (s.posterWord > 0 ? 90 : 0);
        if (s.nilaiExcel === undefined) s.nilaiExcel = (s.excelTabel > 0 ? 88 : 0);
        if (s.nilaiScratch === undefined) {
          s.nilaiScratch = (s.projekScratch > 0 ? 92 : (s.kuisSem2 ? Math.max(78, s.kuisSem2) : 88));
          changed = true;
        }
        if (s.projekScratch === undefined) {
          s.projekScratch = 2;
          changed = true;
        }
        if (s.nilaiRoboMind === undefined) {
          s.nilaiRoboMind = (s.misiRobo > 0 ? 90 : (s.kuisSem2 ? Math.max(76, s.kuisSem2 - 2) : 86));
          changed = true;
        }
        if (s.misiRobo === undefined) {
          s.misiRobo = 3;
          changed = true;
        }

        // Sinkronisasi status KKM dengan standar KKM 80
        const p1_s1 = s.nilaiPoster !== undefined ? s.nilaiPoster : (s.posterWord > 0 ? 90 : 85);
        const p2_s1 = s.nilaiExcel !== undefined ? s.nilaiExcel : (s.excelTabel > 0 ? 88 : 85);
        const p1_s2 = s.nilaiScratch !== undefined ? s.nilaiScratch : 90;
        const p2_s2 = s.nilaiRoboMind !== undefined ? s.nilaiRoboMind : 88;
        const k1 = s.kuisSem1 !== undefined ? s.kuisSem1 : 80;
        const k2 = s.kuisSem2 !== undefined ? s.kuisSem2 : 80;
        const avgTotal = Math.round((p1_s1 + p2_s1 + p1_s2 + p2_s2 + k1 + k2) / 6);
        const newStatus = avgTotal >= 80 ? 'Tuntas' : 'Remedial';
        if (s.statusKkm !== newStatus) {
          s.statusKkm = newStatus;
          changed = true;
        }
      });
      if (changed) {
        localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(parsed));
      }
      return parsed;
    }
    return JSON.parse(JSON.stringify(SEED_STUDENTS));
  } catch (e) {
    console.error('Error membaca database siswa:', e);
    return JSON.parse(JSON.stringify(SEED_STUDENTS));
  }
}

// Helper: Simpan Database Siswa ke localStorage
function saveStudentDatabase(students) {
  try {
    localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(students));
  } catch (e) {
    console.error('Error menyimpan database siswa:', e);
  }
}

// Helper: Ambil Profil Siswa Aktif (Dukungan Sesi Ganda localStorage & sessionStorage)
// Catatan: getActiveStudentProfile juga didefinisikan di bagian atas skrip agar aman dari TDZ.
if (typeof window.getActiveStudentProfile !== 'function') {
  window.getActiveStudentProfile = getActiveStudentProfile;
}

// Inisialisasi Database Guru & Pemulihan Sesi Siswa saat aplikasi dimuat
function initTeacherDatabase() {
  try {
    getStudentDatabase();
  } catch (eDb) {
    console.warn('Inisialisasi database siswa:', eDb);
  }
  
  try {
    const savedWebhook = localStorage.getItem(WEBHOOK_KEY);
    const webhookInput = document.getElementById('guru-webhook-url');
    if (webhookInput && savedWebhook) {
      webhookInput.value = savedWebhook;
    }
    
    if (typeof renderTabsKelasSheet === 'function') renderTabsKelasSheet();
    if (typeof renderRingkasanKoneksiKelas === 'function') renderRingkasanKoneksiKelas();
    updateStatusKoneksiGoogleSheet();
    perbaruiTampilanStatusPinGuru();
    state.zoomTabelGuru = localStorage.getItem('educode_table_zoom_v1') || 'besar';
  } catch (eSheet) {
    console.warn('Inisialisasi tampilan sheet guru:', eSheet);
  }

  // PEMULIHAN SESI OTOMATIS:
  // 1. PRIORITAS TERTINGGI: Jika sesi Guru aktif (Ibu Darningsih, S.T.), pertahankan Dasbor Guru saat refresh / F5!
  if (typeof isTeacherSessionActive === 'function' && isTeacherSessionActive()) {
    try {
      state.isGuruLoggedIn = true;
      setHeaderNavMode('guru');
      switchTab('guru');
      if (typeof pilihKelasGuruNav === 'function') {
        pilihKelasGuruNav(state.tingkatKelasGuru || '4');
      }
      if (typeof renderDasborGuru === 'function') {
        renderDasborGuru();
      }
      return;
    } catch (eGuru) {
      console.error('Error saat pemulihan sesi guru:', eGuru);
    }
  }

  // 2. PEMULIHAN SESI SISWA:
  // Jika siswa masih login dan halaman ter-refresh saat berada di modul, kuis, latihan, ataupun beranda,
  // kembalikan siswa tepat ke tab & semester yang sedang dibukanya tanpa pernah logout otomatis!
  try {
    const activeStudent = getActiveStudentProfile();
    if (activeStudent) {
      const savedSem = localStorage.getItem(ACTIVE_SEM_KEY) || sessionStorage.getItem(ACTIVE_SEM_KEY);
      if (savedSem) {
        const parsedSem = parseInt(savedSem);
        if (parsedSem === 1 || parsedSem === 2) {
          state.currentSemester = parsedSem;
        }
      }

      const savedTab = localStorage.getItem(ACTIVE_TAB_KEY) || sessionStorage.getItem(ACTIVE_TAB_KEY);
      // Sertakan 'beranda' agar jika siswa membuka beranda lalu me-refresh, login tetap aktif di tab beranda!
      const validTabs = ['beranda', 'modul', 'msword', 'msexcel', 'demo', 'praktik', 'kuis', 'antariksa'];
      
      const targetTab = (savedTab && validTabs.includes(savedTab)) ? savedTab : 'beranda';
      switchTab(targetTab);
      setHeaderNavMode('sem1');
      updateNavSemesterVisibility();
      updateLabelSemesterSiswa();
      muatProfilSiswa();
    } else {
      // Mode Guest / Sudah Keluar: Tampilkan beranda utama dengan menu tamu
      setHeaderNavMode('utama');
      switchTab('beranda');
      muatProfilSiswa();
    }
  } catch (eSesi) {
    console.error('Error saat pemulihan sesi siswa:', eSesi);
  }
}
window.initTeacherDatabase = initTeacherDatabase;

// --------------------------------------------------------------------------
// AUTENTIKASI PIN GURU
// --------------------------------------------------------------------------
function bukaModalLoginGuru() {
  try { playSound('click'); } catch (e) {}
  const modal = document.getElementById('modal-login-guru');
  const inputPin = document.getElementById('input-pin-guru');
  const errorMsg = document.getElementById('pesan-error-pin');
  if (errorMsg) errorMsg.classList.add('hidden');
  if (inputPin) {
    inputPin.value = '';
    setTimeout(() => inputPin.focus(), 150);
  }
  try { perbaruiTampilanStatusPinGuru(); } catch (e) {}
  if (modal) {
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
  }
}
window.bukaModalLoginGuru = bukaModalLoginGuru;

function tutupModalLoginGuru() {
  try { playSound('click'); } catch (e) {}
  const modal = document.getElementById('modal-login-guru');
  if (modal) {
    modal.classList.add('hidden');
    modal.style.display = 'none';
  }
}
window.tutupModalLoginGuru = tutupModalLoginGuru;

function toggleLihatPinGuru() {
  const input = document.getElementById('input-pin-guru');
  const icon = document.getElementById('icon-lihat-pin');
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    if (icon) icon.className = 'fa-solid fa-eye-slash';
  } else {
    input.type = 'password';
    if (icon) icon.className = 'fa-solid fa-eye';
  }
}

function tekanKeypadGuru(char) {
  playSound('click');
  const err = document.getElementById('pesan-error-pin');
  if (err) err.classList.add('hidden');
  const input = document.getElementById('input-pin-guru');
  if (input && input.value.length < 6) {
    input.value += char;
  }
}

function hapusKeypadGuru() {
  playSound('click');
  const err = document.getElementById('pesan-error-pin');
  if (err) err.classList.add('hidden');
  const input = document.getElementById('input-pin-guru');
  if (input && input.value.length > 0) {
    input.value = input.value.slice(0, -1);
  }
}

function verifikasiPinGuru() {
  const input = document.getElementById('input-pin-guru');
  const errorMsg = document.getElementById('pesan-error-pin');
  const enteredPin = input ? input.value.trim() : '';
  const storedPin = localStorage.getItem(GURU_PIN_KEY) || DEFAULT_GURU_PIN;

  if (!enteredPin) {
    playSound('error');
    if (errorMsg) {
      errorMsg.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Masukkan PIN terlebih dahulu!';
      errorMsg.classList.remove('hidden');
    }
    if (input) {
      input.classList.add('border-rose-500', 'animate-shake');
      setTimeout(() => input.classList.remove('animate-shake', 'border-rose-500'), 500);
      input.focus();
    }
    showToast('⚠️ Masukkan PIN Guru terlebih dahulu!', 'warning');
    return;
  }

  if (enteredPin === storedPin) {
    playSound('success');
    if (errorMsg) errorMsg.classList.add('hidden');
    state.isGuruLoggedIn = true;
    if (typeof setTeacherSessionActive === 'function') {
      setTeacherSessionActive(true); // Persistensi sesi guru di localStorage, sessionStorage, cookie
    }
    tutupModalLoginGuru();
    setHeaderNavMode('guru');
    switchTab('guru');
    if (typeof pilihKelasGuruNav === 'function') {
      pilihKelasGuruNav('4');
    }
    showToast('Akses Guru Terverifikasi! Selamat datang Ibu Darningsih, S.T. 👩‍🏫', 'success');
  } else {
    playSound('error');
    if (errorMsg) {
      errorMsg.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> PIN salah! Akses dasbor guru ditolak.';
      errorMsg.classList.remove('hidden');
    }
    if (input) {
      input.classList.add('border-rose-500', 'animate-shake');
      setTimeout(() => input.classList.remove('animate-shake', 'border-rose-500'), 500);
      input.value = '';
      input.focus();
    }
    showToast('❌ PIN Guru salah! Akses Dasbor ditolak.', 'error');
  }
}

function keluarModeGuru() {
  playSound('click');
  if (typeof setTeacherSessionActive === 'function') {
    setTeacherSessionActive(false); // Hapus persistensi sesi guru dari localStorage, sessionStorage, cookie
  }
  state.isGuruLoggedIn = false;
  const student = getActiveStudentProfile();
  if (student) {
    setHeaderNavMode('sem1');
  } else {
    setHeaderNavMode('utama');
  }
  switchTab('beranda');
  showToast('Telah keluar dari mode Dasbor Guru 🔒', 'info');
}

// --------------------------------------------------------------------------
// PENGATURAN & KEAMANAN PIN DASBOR GURU
// --------------------------------------------------------------------------
function perbaruiTampilanStatusPinGuru() {
  const currentPin = localStorage.getItem(GURU_PIN_KEY);
  const badgeLogin = document.getElementById('badge-login-pin-default');
  const badgeSettings = document.getElementById('badge-status-pin-guru');

  if (badgeLogin) {
    badgeLogin.remove();
  }

  if (currentPin && currentPin !== DEFAULT_GURU_PIN) {
    if (badgeSettings) {
      badgeSettings.innerText = 'PIN Kustom Aktif';
      badgeSettings.className = 'self-start sm:self-auto px-3 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200';
    }
  } else {
    if (badgeSettings) {
      badgeSettings.innerText = 'PIN Terlindungi';
      badgeSettings.className = 'self-start sm:self-auto px-3 py-1 rounded-xl text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200';
    }
  }
}
window.perbaruiTampilanStatusPinGuru = perbaruiTampilanStatusPinGuru;

function toggleLihatInputPin(inputId, iconId) {
  const inp = document.getElementById(inputId);
  const ico = document.getElementById(iconId);
  if (!inp) return;
  if (inp.type === 'password') {
    inp.type = 'text';
    if (ico) ico.className = 'fa-solid fa-eye-slash';
  } else {
    inp.type = 'password';
    if (ico) ico.className = 'fa-solid fa-eye';
  }
}
window.toggleLihatInputPin = toggleLihatInputPin;

function bukaModalUbahPinGuru() {
  playSound('click');
  const modal = document.getElementById('modal-ubah-pin-guru');
  const err = document.getElementById('pesan-error-ubah-pin');
  const inOld = document.getElementById('input-pin-lama');
  const inNew = document.getElementById('input-pin-baru');
  const inConf = document.getElementById('input-pin-konfirmasi');

  if (err) err.classList.add('hidden');
  if (inOld) inOld.value = '';
  if (inNew) inNew.value = '';
  if (inConf) inConf.value = '';

  if (modal) modal.classList.remove('hidden');
  setTimeout(() => { if (inOld) inOld.focus(); }, 150);
}
window.bukaModalUbahPinGuru = bukaModalUbahPinGuru;

function tutupModalUbahPinGuru() {
  playSound('click');
  const modal = document.getElementById('modal-ubah-pin-guru');
  if (modal) modal.classList.add('hidden');
}
window.tutupModalUbahPinGuru = tutupModalUbahPinGuru;

function simpanPinGuruBaru() {
  const inOld = document.getElementById('input-pin-lama');
  const inNew = document.getElementById('input-pin-baru');
  const inConf = document.getElementById('input-pin-konfirmasi');
  const err = document.getElementById('pesan-error-ubah-pin');

  const oldPin = inOld ? inOld.value.trim() : '';
  const newPin = inNew ? inNew.value.trim() : '';
  const confPin = inConf ? inConf.value.trim() : '';

  const storedPin = localStorage.getItem(GURU_PIN_KEY) || DEFAULT_GURU_PIN;

  const tampilkanError = (pesan, targetInput) => {
    playSound('error');
    if (err) {
      const span = err.querySelector('span');
      if (span) span.innerText = pesan;
      err.classList.remove('hidden');
    }
    if (targetInput) {
      targetInput.classList.add('border-rose-500', 'animate-shake');
      setTimeout(() => targetInput.classList.remove('animate-shake', 'border-rose-500'), 500);
      targetInput.focus();
    }
    showToast(pesan, 'warning');
  };

  if (!oldPin) {
    tampilkanError('Masukkan PIN lama saat ini terlebih dahulu!', inOld);
    return;
  }
  if (oldPin !== storedPin) {
    tampilkanError('PIN lama salah! Harap periksa kembali.', inOld);
    return;
  }
  if (!newPin) {
    tampilkanError('Masukkan PIN baru (4 - 6 digit angka)!', inNew);
    return;
  }
  if (!/^\d{4,6}$/.test(newPin)) {
    tampilkanError('PIN baru harus berupa 4 sampai 6 digit angka!', inNew);
    return;
  }
  if (newPin !== confPin) {
    tampilkanError('Konfirmasi PIN baru tidak sama!', inConf);
    return;
  }

  // Simpan PIN baru ke localStorage
  try {
    localStorage.setItem(GURU_PIN_KEY, newPin);
    playSound('success');
    tutupModalUbahPinGuru();
    perbaruiTampilanStatusPinGuru();
    showToast('✅ Berhasil! PIN Dasbor Guru telah diperbarui.', 'success');
  } catch (e) {
    console.error('Gagal menyimpan PIN baru:', e);
    tampilkanError('Gagal menyimpan PIN ke penyimpanan browser.', inNew);
  }
}
window.simpanPinGuruBaru = simpanPinGuruBaru;

function resetPinGuruKeDefault() {
  playSound('click');
  const storedPin = localStorage.getItem(GURU_PIN_KEY);
  if (!storedPin || storedPin === DEFAULT_GURU_PIN) {
    showToast('PIN Dasbor Guru saat ini sudah menggunakan default (1234).', 'info');
    return;
  }

  if (confirm('Apakah Anda yakin ingin mengembalikan PIN Dasbor Guru ke default (1234)?')) {
    localStorage.removeItem(GURU_PIN_KEY);
    playSound('success');
    perbaruiTampilanStatusPinGuru();
    showToast('🔄 PIN Dasbor Guru berhasil dikembalikan ke default (1234)!', 'success');
  }
}
window.resetPinGuruKeDefault = resetPinGuruKeDefault;

// --------------------------------------------------------------------------
// PROFIL SISWA AKTIF & KARTU PELAJAR DIGITAL (AUTO-SYNC)
// --------------------------------------------------------------------------
function bukaModalProfilSiswa() {
  playSound('click');
  const profile = getActiveStudentProfile();
  if (!profile) {
    bukaPilihSiswaCepat();
    return;
  }
  const db = getStudentDatabase();
  const student = db.find(s => s.id === profile.id || (s.nama.toLowerCase() === profile.nama.toLowerCase() && s.kelas === profile.kelas)) || {
    id: profile.id,
    nama: profile.nama,
    kelas: profile.kelas,
    absen: profile.absen,
    kuisSem1: 0,
    kuisSem2: 0,
    posterWord: 0,
    excelTabel: 0,
    poinBintang: state.userPoints || 0,
    statusKkm: 'Tuntas',
    catatanGuru: 'Semangat belajar, rajin berlatih dan teliti!'
  };

  // Isi data ke Kartu Pelajar & Rapor Digital Siswa
  const elAvatar = document.getElementById('card-siswa-avatar');
  const elNama = document.getElementById('card-siswa-nama');
  const elNis = document.getElementById('card-siswa-nis');
  const elKelas = document.getElementById('card-siswa-kelas');
  const elAbsen = document.getElementById('card-siswa-absen');
  const elStatusKkm = document.getElementById('card-siswa-status-kkm');
  const elKuis1 = document.getElementById('card-siswa-kuis1');
  const elKuis2 = document.getElementById('card-siswa-kuis2');
  const elPoster = document.getElementById('card-siswa-poster');
  const elExcel = document.getElementById('card-siswa-excel');
  const elBintang = document.getElementById('card-siswa-bintang');
  const elCatatan = document.getElementById('card-siswa-catatan');

  if (elAvatar) elAvatar.innerText = student.nama ? student.nama.charAt(0).toUpperCase() : 'S';
  if (elNama) elNama.innerText = student.nama;
  if (elNis) elNis.innerText = `NIS: ${student.nis || '-'}`;
  if (elKelas) elKelas.innerText = `Kelas ${student.kelas}`;
  if (elAbsen) elAbsen.innerText = `No. Absen: ${student.absen || '-'}`;
  if (elStatusKkm) {
    const isTuntas = (student.statusKkm === 'Tuntas' || (!student.statusKkm && (student.kuisSem1 >= 75 || student.kuisSem1 === 0)));
    elStatusKkm.innerText = isTuntas ? 'TUNTAS KKM' : 'REMEDIAL';
    elStatusKkm.className = isTuntas ? 'px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-900 shadow-2xs' : 'px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white shadow-2xs';
  }
  if (elKuis1) elKuis1.innerText = student.kuisSem1 || 0;
  const elPosterSub = document.getElementById('card-siswa-poster-sub');
  const elExcelSub = document.getElementById('card-siswa-excel-sub');
  if (elPoster) elPoster.innerText = student.nilaiPoster !== undefined ? student.nilaiPoster : (student.posterWord > 0 ? 90 : 0);
  if (elPosterSub) elPosterSub.innerText = `${student.posterWord || 0} Karya`;
  if (elExcel) elExcel.innerText = student.nilaiExcel !== undefined ? student.nilaiExcel : (student.excelTabel > 0 ? 88 : 0);
  if (elExcelSub) elExcelSub.innerText = `${student.excelTabel || 0} Latihan`;
  if (elBintang) elBintang.innerText = `${Math.max(student.poinBintang || 0, state.userPoints || 0)} ⭐`;
  if (elCatatan) {
    elCatatan.innerText = student.catatanGuru ? `"${student.catatanGuru}"` : '"Teruslah tekun berlatih, jadilah insan yang cerdas dan berbudi pekerti luhur."';
  }

  // Tampilkan Tampilan Kartu Pelajar
  tampilkanKartuSiswa();

  const modal = document.getElementById('modal-profil-siswa');
  if (modal) {
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
  }
}
window.bukaModalProfilSiswa = bukaModalProfilSiswa;

function tutupModalProfilSiswa() {
  try { playSound('click'); } catch (e) {}
  const modal = document.getElementById('modal-profil-siswa');
  if (modal) {
    modal.classList.add('hidden');
    modal.style.display = 'none';
  }
}
window.tutupModalProfilSiswa = tutupModalProfilSiswa;

function tampilkanKartuSiswa() {
  const cardView = document.getElementById('profil-view-card');
  const formView = document.getElementById('profil-view-form');
  if (cardView) {
    cardView.classList.remove('hidden');
    cardView.style.display = 'block';
  }
  if (formView) {
    formView.classList.add('hidden');
    formView.style.display = 'none';
  }
}
window.tampilkanKartuSiswa = tampilkanKartuSiswa;

function tampilkanFormGantiSiswa() {
  try { playSound('click'); } catch (e) {}
  const cardView = document.getElementById('profil-view-card');
  const formView = document.getElementById('profil-view-form');
  const errorEl = document.getElementById('pesan-error-login-nis');
  if (cardView) {
    cardView.classList.add('hidden');
    cardView.style.display = 'none';
  }
  if (formView) {
    formView.classList.remove('hidden');
    formView.style.display = 'block';
  }
  if (errorEl) {
    errorEl.classList.add('hidden');
    errorEl.innerHTML = '';
  }

  renderOpsiPilihSiswa();

  const inputNis = document.getElementById('input-login-nis');
  if (inputNis) {
    inputNis.value = '';
    inputNis.classList.remove('border-rose-500', 'bg-rose-50', 'animate-shake');
    setTimeout(() => inputNis.focus(), 150);
  }

  const profile = getActiveStudentProfile() || { nama: '', kelas: '4A', absen: '01' };
  const inputNama = document.getElementById('input-profil-nama');
  const inputKelas = document.getElementById('input-profil-kelas');
  const inputAbsen = document.getElementById('input-profil-absen');
  if (inputNama) inputNama.value = profile.nama || '';
  if (inputKelas) inputKelas.value = profile.kelas || '4A';
  if (inputAbsen) inputAbsen.value = profile.absen || '01';
}
window.tampilkanFormGantiSiswa = tampilkanFormGantiSiswa;

function bukaPilihSiswaCepat() {
  try { playSound('click'); } catch (e) {}
  const modal = document.getElementById('modal-profil-siswa');
  if (modal) {
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
  }
  tampilkanFormGantiSiswa();
}
window.bukaPilihSiswaCepat = bukaPilihSiswaCepat;

// ==========================================
// SISTEM MASUK SISWA MENGGUNAKAN NIS
// ==========================================
async function loginDenganNis() {
  const inputEl = document.getElementById('input-login-nis');
  const btnEl = document.getElementById('btn-submit-login-nis');
  const errorEl = document.getElementById('pesan-error-login-nis');
  const nisVal = inputEl ? inputEl.value.trim() : '';

  if (errorEl) {
    errorEl.classList.add('hidden');
    errorEl.innerHTML = '';
  }

  if (!nisVal) {
    playSound('error');
    if (errorEl) {
      errorEl.innerHTML = '<i class="fa-solid fa-circle-exclamation text-amber-500"></i> Ketik nomor NIS kamu terlebih dahulu ya!';
      errorEl.classList.remove('hidden');
    }
    showToast('⚠️ Ketik nomor NIS kamu terlebih dahulu ya!', 'warning');
    if (inputEl) inputEl.focus();
    return;
  }

  // Tampilkan efek memeriksa
  const originalBtnHtml = btnEl ? btnEl.innerHTML : '';
  if (btnEl) {
    btnEl.disabled = true;
    btnEl.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Memeriksa NIS di Google Sheet...</span>';
  }

  try {
    const student = await cekNisGoogleSheet(nisVal);

    if (!student) {
      playSound('error');
      const msgHtml = `
        <div class="flex items-center justify-center gap-1.5 text-rose-700 font-bold mb-1">
          <i class="fa-solid fa-circle-xmark text-rose-600 text-sm"></i>
          <span>Akses Masuk Ditolak!</span>
        </div>
        <div class="text-xs text-rose-800 font-semibold leading-snug">
          Nomor NIS <strong>"${nisVal}"</strong> tidak terdaftar di database Google Sheet sekolah!
        </div>
        <div class="text-[11px] text-slate-500 font-normal mt-1.5 pt-1.5 border-t border-rose-200">
          Periksa kembali nomor NIS kamu atau tanyakan ke <strong>Ibu Guru Darningsih, S.T.</strong> ya.
        </div>
      `;
      if (errorEl) {
        errorEl.innerHTML = msgHtml;
        errorEl.classList.remove('hidden');
      }
      showToast(`❌ Nomor NIS "${nisVal}" tidak ada di database Google Sheet! Akses ditolak.`, 'error');
      if (inputEl) {
        inputEl.classList.add('border-rose-500', 'bg-rose-50', 'animate-shake');
        setTimeout(() => {
          if (inputEl) inputEl.classList.remove('border-rose-500', 'bg-rose-50', 'animate-shake');
        }, 1000);
        inputEl.value = '';
        inputEl.focus();
      }
      return;
    }

    // Berhasil masuk!
    if (errorEl) errorEl.classList.add('hidden');
    playSound('fanfare');
    const profile = {
      id: student.id || `STD-${student.kelas || '4A'}-${student.absen || student.nis}`,
      nis: student.nis,
      nama: student.nama,
      kelas: student.kelas || '4A',
      absen: student.absen || '01'
    };
    saveActiveStudentSession(profile, 'modul');

    state.userPoints = student.poinBintang || 0;
    const p1 = document.getElementById('user-points');
    const p2 = document.getElementById('user-points-sem1');
    if (p1) p1.innerText = state.userPoints;
    if (p2) p2.innerText = state.userPoints;

    muatProfilSiswa();
    setHeaderNavMode('sem1');
    tutupModalProfilSiswa();
    switchTab('modul');
    showToast(`Selamat datang, ${student.nama}! (Kelas ${student.kelas} • NIS: ${student.nis}) 🎉`, 'success');
  } catch (err) {
    console.error('Error saat verifikasi NIS:', err);
    if (errorEl) {
      errorEl.innerHTML = '<i class="fa-solid fa-triangle-exclamation text-amber-500"></i> Terjadi gangguan saat memverifikasi NIS. Periksa koneksi internet Anda.';
      errorEl.classList.remove('hidden');
    }
    showToast('Terjadi gangguan saat memvalidasi NIS. Silakan coba kembali.', 'error');
  } finally {
    if (btnEl) {
      btnEl.disabled = false;
      btnEl.innerHTML = originalBtnHtml;
    }
  }
}

// ==========================================
// SISTEM SIGN OUT / KELUAR AKUN SISWA
// ==========================================
function konfirmasiKeluarSiswa() {
  try { playSound('click'); } catch (e) {}
  const profile = getActiveStudentProfile();
  const elWelcomeNama = document.getElementById('welcome-siswa-nama');
  const elWelcomeKelas = document.getElementById('welcome-siswa-kelas');

  const nama = profile ? profile.nama : (elWelcomeNama ? elWelcomeNama.innerText.trim() : 'Siswa');
  const kelas = profile ? profile.kelas : (elWelcomeKelas ? elWelcomeKelas.innerText.trim() : '');

  // Konfirmasi langsung dengan modal konfirmasi browser yang ramah anak
  const targetLabel = (kelas && !kelas.includes('Belum')) ? `${nama} (${kelas})` : nama;
  const yakin = confirm(`Apakah kamu ingin keluar (Sign Out) dari akun ${targetLabel}?`);
  if (yakin) {
    eksekusiLogoutSiswa();
  }
}
window.konfirmasiKeluarSiswa = konfirmasiKeluarSiswa;

function tutupModalKonfirmasiLogoutSiswa() {
  try { playSound('click'); } catch (e) {}
  const modalLogout = document.getElementById('modal-konfirmasi-logout-siswa');
  if (modalLogout) {
    modalLogout.classList.add('hidden');
    modalLogout.style.display = 'none';
  }
}
window.tutupModalKonfirmasiLogoutSiswa = tutupModalKonfirmasiLogoutSiswa;

function eksekusiLogoutSiswa() {
  try { playSound('click'); } catch (e) {}
  const profile = getActiveStudentProfile();
  const elWelcomeNama = document.getElementById('welcome-siswa-nama');
  const nama = profile ? profile.nama : (elWelcomeNama ? elWelcomeNama.innerText.trim() : 'Siswa');

  // Bersihkan data sesi siswa di seluruh lapisan penyimpanan secara tuntas
  clearActiveStudentSession();
  state.userPoints = 0;

  // Tutup semua modal terkait
  tutupModalKonfirmasiLogoutSiswa();
  const modalProfil = document.getElementById('modal-profil-siswa');
  if (modalProfil) {
    modalProfil.classList.add('hidden');
    modalProfil.style.display = 'none';
  }

  // Reset poin di layar
  const p1 = document.getElementById('user-points');
  const p2 = document.getElementById('user-points-sem1');
  const pWelcome = document.getElementById('welcome-siswa-bintang');
  if (p1) p1.innerText = '0';
  if (p2) p2.innerText = '0';
  if (pWelcome) pWelcome.innerText = '0';

  // Muat ulang tampilan ke mode Belum Masuk / Tamu
  muatProfilSiswa();
  setHeaderNavMode('utama');
  switchTab('beranda');

  showToast(`Akun ${nama} berhasil keluar! Sesi telah diamankan 🔒`, 'info');
}
window.eksekusiLogoutSiswa = eksekusiLogoutSiswa;

function renderOpsiPilihSiswa() {
  const dropdown = document.getElementById('pilih-cepat-siswa-dropdown');
  if (!dropdown) return;

  const db = getStudentDatabase();
  const currentProfile = getActiveStudentProfile() || {};

  dropdown.innerHTML = '<option value="">-- Pilih Nama Siswa dari Database Kelas --</option>';

  const classes = ['4A', '4B', '4C', '4D', '4E', '5D', '6A', '6B', '6C', '6D', '6E'];
  classes.forEach(cls => {
    const group = document.createElement('optgroup');
    group.label = `Kelas ${cls}`;
    const studentsInClass = db.filter(s => s.kelas === cls);
    studentsInClass.sort((a, b) => parseInt(a.absen || '0') - parseInt(b.absen || '0'));

    studentsInClass.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.innerText = `NIS: ${s.nis || '-'} • No.${s.absen || '-'} - ${s.nama}`;
      if (s.id === currentProfile.id || (currentProfile.nis && s.nis === currentProfile.nis)) {
        opt.selected = true;
      }
      group.appendChild(opt);
    });

    dropdown.appendChild(group);
  });
}

function pilihSiswaDariDropdown(studentId) {
  if (!studentId) return;
  playSound('success');
  const db = getStudentDatabase();
  const student = db.find(s => s.id === studentId);
  if (!student) return;

  const profile = {
    id: student.id,
    nis: student.nis || '4101',
    nama: student.nama,
    kelas: student.kelas,
    absen: student.absen
  };
  saveActiveStudentSession(profile, 'modul');

  // Perbarui poin aktif sesuai poin tersimpan siswa
  state.userPoints = student.poinBintang || 0;
  const p1 = document.getElementById('user-points');
  const p2 = document.getElementById('user-points-sem1');
  if (p1) p1.innerText = state.userPoints;
  if (p2) p2.innerText = state.userPoints;

  muatProfilSiswa();
  setHeaderNavMode('sem1');
  tutupModalProfilSiswa();
  switchTab('modul');
  showToast(`Berhasil masuk sebagai ${student.nama} (${student.kelas} • NIS: ${student.nis})! 🎉`, 'success');
}

function simpanProfilSiswa() {
  const inputNama = document.getElementById('input-profil-nama');
  const inputNis = document.getElementById('input-profil-nis');
  const inputKelas = document.getElementById('input-profil-kelas');
  const inputAbsen = document.getElementById('input-profil-absen');

  const nama = inputNama ? inputNama.value.trim() : '';
  const kelas = inputKelas ? inputKelas.value : '4A';
  let absen = inputAbsen ? inputAbsen.value.trim() : '01';
  if (absen.length === 1) absen = '0' + absen;
  let nis = inputNis ? inputNis.value.trim() : '';
  if (!nis) {
    const clsMap = { '4A': '41', '4B': '42', '4C': '43', '4D': '44', '4E': '45', '5D': '54', '6A': '61', '6B': '62', '6C': '63', '6D': '64', '6E': '65' };
    const clsCode = clsMap[kelas] || '41';
    nis = `${clsCode}${absen}`;
  }

  if (!nama) {
    showToast('Silakan masukkan nama lengkap siswa!', 'error');
    return;
  }

  const id = `STD-${kelas}-${absen}`;
  const profile = { id, nis, nama, kelas, absen };
  saveActiveStudentSession(profile, 'modul');

  // Pastikan siswa ini ada di database guru
  const db = getStudentDatabase();
  const existIdx = db.findIndex(s => s.id === id || s.nis === nis || (s.nama.toLowerCase() === nama.toLowerCase() && s.kelas === kelas));
  if (existIdx >= 0) {
    db[existIdx].nama = nama;
    db[existIdx].nis = nis;
    db[existIdx].kelas = kelas;
    db[existIdx].absen = absen;
    db[existIdx].poinBintang = Math.max(db[existIdx].poinBintang, state.userPoints);
    db[existIdx].terakhirAktif = 'Baru saja';
  } else {
    db.push({
      id: id,
      nis: nis,
      nama: nama,
      kelas: kelas,
      absen: absen,
      kuisSem1: 0,
      kuisSem2: 0,
      tpSelesai: ['TP 1.1'],
      posterWord: 0,
      excelTabel: 0,
      poinBintang: state.userPoints || 0,
      statusKkm: 'Tuntas',
      terakhirAktif: 'Baru saja',
      catatanGuru: 'Siswa baru terdaftar.'
    });
  }
  saveStudentDatabase(db);

  muatProfilSiswa();
  setHeaderNavMode('sem1');
  tutupModalProfilSiswa();
  switchTab('modul');
  showToast(`Halo ${nama}! Profilmu (${kelas} • NIS: ${nis}) berhasil disimpan & aktif 🎉`, 'success');
}

function muatProfilSiswa() {
  const profile = getActiveStudentProfile();
  const db = getStudentDatabase();
  const student = profile ? db.find(s => s.id === profile.id || (s.nama.toLowerCase() === profile.nama.toLowerCase() && s.kelas === profile.kelas)) : null;

  const firstName = (profile && profile.nama) ? profile.nama.split(' ')[0] : 'Siswa';
  const labelUtama = document.getElementById('label-profil-siswa');
  if (labelUtama) {
    labelUtama.innerText = profile ? `${firstName} (${profile.kelas})` : 'Belum Masuk';
  }
  document.querySelectorAll('.label-profil-siswa-sync').forEach(el => {
    el.innerText = profile ? `${firstName} (${profile.kelas})` : 'Belum Masuk';
  });

  // Perbarui Bar Sambutan Siswa di Beranda
  const welcomeAvatar = document.getElementById('welcome-siswa-avatar');
  const welcomeNama = document.getElementById('welcome-siswa-nama');
  const welcomeKelas = document.getElementById('welcome-siswa-kelas');
  const welcomeBintang = document.getElementById('welcome-siswa-bintang');
  const welcomeSubText = document.getElementById('welcome-siswa-sub-text');
  const welcomePing = document.getElementById('welcome-siswa-ping');
  const btnRapor = document.getElementById('btn-welcome-rapor');
  const btnGanti = document.getElementById('btn-welcome-ganti');
  const btnLogout = document.getElementById('btn-welcome-logout');
  const btnLogin = document.getElementById('btn-welcome-login');
  const bintangWrap = document.getElementById('welcome-siswa-bintang-wrap');

  const heroSemBtns = document.getElementById('hero-sem-buttons');
  const heroGuestBtn = document.getElementById('hero-guest-btn');

  const btnSemToggle = document.getElementById('btn-toggle-sem-siswa');

  if (!profile) {
    // Mode Guest / Signed Out
    if (heroSemBtns) heroSemBtns.classList.add('hidden');
    if (heroGuestBtn) heroGuestBtn.classList.remove('hidden');
    if (welcomeAvatar) {
      welcomeAvatar.innerText = '👤';
      welcomeAvatar.className = 'w-11 h-11 rounded-2xl bg-slate-200 text-slate-500 flex items-center justify-center font-black text-lg shadow-inner flex-shrink-0';
    }
    if (welcomeSubText) welcomeSubText.innerText = 'Lab Komputer • Belum Masuk Akun';
    if (welcomePing) welcomePing.classList.add('hidden');
    if (welcomeNama) welcomeNama.innerText = 'Belum Ada Siswa Masuk';
    if (welcomeKelas) {
      welcomeKelas.innerText = 'Akun Belum Aktif';
      welcomeKelas.className = 'px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-500 border border-slate-300';
    }
    if (welcomeBintang) welcomeBintang.innerText = '0';
    if (bintangWrap) bintangWrap.classList.add('hidden');
    if (btnSemToggle) btnSemToggle.classList.add('hidden');
    if (btnRapor) { btnRapor.classList.add('hidden'); btnRapor.style.display = 'none'; }
    if (btnGanti) { btnGanti.classList.add('hidden'); btnGanti.style.display = 'none'; }
    if (btnLogout) { btnLogout.classList.add('hidden'); btnLogout.style.display = 'none'; }
    if (btnLogin) { btnLogin.classList.remove('hidden'); btnLogin.style.display = ''; }

    const cardsSiswa = document.getElementById('beranda-fitur-cards-siswa');
    if (cardsSiswa) cardsSiswa.classList.add('hidden');

    state.userPoints = 0;
    const p1 = document.getElementById('user-points');
    const p2 = document.getElementById('user-points-sem1');
    if (p1) p1.innerText = 0;
    if (p2) p2.innerText = 0;
    setHeaderNavMode('utama');
  } else {
    // Mode Siswa Aktif (Tampilkan Dock Navigasi Siswa Sesuai Gambar User)
    if (heroSemBtns) heroSemBtns.classList.remove('hidden');
    if (heroGuestBtn) heroGuestBtn.classList.add('hidden');
    const cardsSiswa = document.getElementById('beranda-fitur-cards-siswa');
    if (cardsSiswa) cardsSiswa.classList.remove('hidden');
    setHeaderNavMode('sem1');
    if (welcomeAvatar) {
      welcomeAvatar.innerText = profile.nama ? profile.nama.charAt(0).toUpperCase() : 'S';
      welcomeAvatar.className = 'w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center font-black text-base shadow-md flex-shrink-0';
    }
    if (welcomeSubText) welcomeSubText.innerText = 'Selamat Belajar di Tzu Chi';
    if (welcomePing) welcomePing.classList.remove('hidden');
    if (welcomeNama) welcomeNama.innerText = profile.nama;
    if (welcomeKelas) {
      welcomeKelas.innerText = `Kelas ${profile.kelas} • Absen ${profile.absen || '-'}`;
      welcomeKelas.className = 'px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-300';
    }
    const activePoints = student ? (student.poinBintang || 0) : (state.userPoints || 0);
    state.userPoints = activePoints;
    if (welcomeBintang) welcomeBintang.innerText = activePoints;
    const p1 = document.getElementById('user-points');
    const p2 = document.getElementById('user-points-sem1');
    if (p1) p1.innerText = activePoints;
    if (p2) p2.innerText = activePoints;
    if (bintangWrap) bintangWrap.classList.remove('hidden');
    if (btnSemToggle) {
      if (isSemester2Unlocked()) {
        btnSemToggle.classList.remove('hidden');
        btnSemToggle.style.display = '';
      } else {
        btnSemToggle.classList.add('hidden');
        btnSemToggle.style.display = 'none';
      }
    }
    if (btnRapor) { btnRapor.classList.remove('hidden'); btnRapor.style.display = ''; }
    if (btnGanti) { btnGanti.classList.remove('hidden'); btnGanti.style.display = ''; }
    if (btnLogout) { btnLogout.classList.remove('hidden'); btnLogout.style.display = ''; }
    if (btnLogin) { btnLogin.classList.add('hidden'); btnLogin.style.display = 'none'; }
    updateNavSemesterVisibility();
    updateLabelSemesterSiswa();
  }
}
window.muatProfilSiswa = muatProfilSiswa;

function syncPoinSiswaKeDb(poin) {
  try {
    const profile = getActiveStudentProfile();
    if (!profile) return;
    const db = getStudentDatabase();
    const student = db.find(s => s.id === profile.id || (s.nama.toLowerCase() === profile.nama.toLowerCase() && s.kelas === profile.kelas));
    if (student) {
      student.poinBintang = poin;
      student.terakhirAktif = 'Baru saja';
      saveStudentDatabase(db);
    }
  } catch (e) {}
}

function catatHasilKuisSiswa(semNumber, score) {
  try {
    const profile = getActiveStudentProfile();
    if (!profile) {
      showToast('⚠️ Silakan masuk/pilih akun siswa terlebih dahulu agar skor kuismu tercatat!', 'warning');
      bukaPilihSiswaCepat();
      return;
    }
    const db = getStudentDatabase();
    let student = db.find(s => s.id === profile.id || (s.nama.toLowerCase() === profile.nama.toLowerCase() && s.kelas === profile.kelas));
    if (!student) {
      student = {
        id: profile.id,
        nama: profile.nama,
        kelas: profile.kelas,
        absen: profile.absen,
        kuisSem1: 0,
        kuisSem2: 0,
        tpSelesai: ['TP 1.1', 'TP 2.1'],
        posterWord: 0,
        excelTabel: 0,
        poinBintang: state.userPoints,
        statusKkm: 'Tuntas',
        terakhirAktif: 'Baru saja',
        catatanGuru: ''
      };
      db.push(student);
    }

    if (semNumber === 1) {
      student.kuisSem1 = Math.max(student.kuisSem1 || 0, score);
    } else {
      student.kuisSem2 = Math.max(student.kuisSem2 || 0, score);
    }

    const avg = ((student.kuisSem1 || 0) + (student.kuisSem2 || 0)) / ((student.kuisSem1 ? 1 : 0) + (student.kuisSem2 ? 1 : 0) || 1);
    student.statusKkm = avg >= 80 ? 'Tuntas' : 'Remedial';
    student.terakhirAktif = 'Baru saja';
    saveStudentDatabase(db);

    // Kirim sinkronisasi otomatis ke Google Sheets jika webhook aktif
    kirimKeWebhookSheets({
      event: 'kuis_selesai',
      nama: student.nama,
      kelas: student.kelas,
      absen: student.absen,
      semester: semNumber,
      skor: score,
      statusKkm: student.statusKkm,
      poinBintang: state.userPoints,
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    console.warn('Gagal mencatat kuis siswa ke database:', e);
  }
}

// ==========================================================================
// SISTEM PENILAIAN OTOMATIS BERBASIS RUBRIK (POSTER WORD & TABEL EXCEL)
// ==========================================================================

// 1. Rubrik Penilaian Otomatis Poster Word (0-100)
function hitungRubrikOtomatisPosterWord(elements = [], title = '', bgColor = '#ffffff', borderStyle = 'solid') {
  const currentEls = Array.isArray(elements) && elements.length > 0 ? elements : (typeof wordElements !== 'undefined' ? wordElements : []);
  const curTitle = title || (typeof currentWordDocTitle !== 'undefined' ? currentWordDocTitle : 'Poster Digital');
  const curBg = bgColor || (typeof wordPageBgColor !== 'undefined' ? wordPageBgColor : '#ffffff');
  const curBorder = borderStyle || (typeof wordPageBorderStyle !== 'undefined' ? wordPageBorderStyle : 'solid');

  // Aspek 1: Kelengkapan Elemen Konten (Maks 25 Poin)
  let aspek1 = 0;
  const hasJudul = currentEls.some(e => e.type === 'teks' && (e.subtype === 'judul' || (e.fontSizePx && e.fontSizePx >= 20) || e.isBold));
  const hasSlogan = currentEls.some(e => e.type === 'teks' && (e.subtype === 'slogan' || (e.text && e.text.length > 8 && e.subtype !== 'judul')));
  const hasGambar = currentEls.some(e => e.type === 'gambar' || e.type === 'shape' || e.type === 'gambar_luar');

  if (hasJudul) aspek1 += 10;
  if (hasSlogan) aspek1 += 8;
  if (hasGambar) aspek1 += 7;
  if (aspek1 === 0 && currentEls.length > 0) aspek1 = 15;

  // Aspek 2: Kesesuaian Tema Budi Pekerti (Maks 25 Poin)
  let aspek2 = 12;
  const combinedText = (curTitle + ' ' + currentEls.filter(e => e.type === 'teks').map(e => e.text || '').join(' ')).toLowerCase();
  const keywords = ['hemat', 'energi', 'listrik', 'air', 'bumi', 'lestari', 'tzu chi', 'cinta', 'kasih', 'lingkungan', 'daur ulang', 'karakter', 'kebiasaan', 'hebat', 'hijau', 'pohon', 'sampah', 'disiplin', 'sayang', 'belajar', 'bersih'];
  let matchCount = 0;
  keywords.forEach(kw => {
    if (combinedText.includes(kw)) matchCount++;
  });
  if (matchCount >= 3) aspek2 = 25;
  else if (matchCount === 2) aspek2 = 22;
  else if (matchCount === 1) aspek2 = 18;
  else aspek2 = 14;

  // Aspek 3: Kerapian Tata Letak & Variasi (Maks 25 Poin)
  let aspek3 = 15;
  if (currentEls.length >= 2) {
    const yPos = currentEls.map(e => e.y || 0);
    const spreadY = Math.max(...yPos) - Math.min(...yPos);
    if (spreadY > 200) aspek3 = 25;
    else if (spreadY > 100) aspek3 = 21;
    else aspek3 = 17;
  }

  // Aspek 4: Harmonisasi Warna & Bingkai (Maks 25 Poin)
  let aspek4 = 15;
  if (curBorder && curBorder !== 'none') aspek4 += 5;
  if (curBg && curBg !== '#ffffff') aspek4 += 5;
  if (currentEls.length >= 4) aspek4 = Math.min(25, aspek4 + 3);

  const totalSkor = Math.min(100, Math.max(50, aspek1 + aspek2 + aspek3 + aspek4));
  return {
    totalSkor,
    aspek1,
    aspek2,
    aspek3,
    aspek4,
    grade: totalSkor >= 90 ? 'Sangat Baik (A)' : totalSkor >= 75 ? 'Baik (B)' : 'Cukup (C)'
  };
}

// 2. Rubrik Penilaian Otomatis Tabel Excel (0-100)
function hitungRubrikOtomatisExcel() {
  const tpl = (typeof excelState !== 'undefined' && EXCEL_TEMPLATES && EXCEL_TEMPLATES[excelState.activeTemplate]) || {};
  const cells = (typeof excelState !== 'undefined' && excelState.cells) ? excelState.cells : {};
  const rowCount = (typeof excelState !== 'undefined' && excelState.rowCount) ? excelState.rowCount : 7;
  const formats = (typeof excelState !== 'undefined' && excelState.formats) || tpl.formats || {};

  // Aspek 1: Struktur Kolom & Header Tabel (Maks 25 Poin)
  let aspek1 = 16;
  if (rowCount >= 5) aspek1 = 25;
  else if (rowCount >= 3) aspek1 = 21;

  // Aspek 2: Penggunaan Formula Rumus (Maks 25 Poin)
  let aspek2 = 15;
  let formulaCount = 0;
  Object.values(cells).forEach(val => {
    if (typeof val === 'string' && val.trim().startsWith('=')) {
      formulaCount++;
    }
  });
  if (formulaCount >= 3) aspek2 = 25;
  else if (formulaCount >= 1) aspek2 = 22;
  else aspek2 = 18;

  // Aspek 3: Format Sel & Garis Border (Maks 25 Poin)
  let aspek3 = 18;
  const hasFormats = Object.keys(formats).length > 0;
  if (hasFormats) {
    const hasBold = Object.values(formats).some(f => f.bold);
    const hasBg = Object.values(formats).some(f => f.bg);
    if (hasBold && hasBg) aspek3 = 25;
    else if (hasBold || hasBg) aspek3 = 22;
  }

  // Aspek 4: Kerapian Tipe Data & Angka (Maks 25 Poin)
  let aspek4 = 18;
  const hasNumFormat = Object.values(formats).some(f => f.numFormat || f.align === 'right' || f.align === 'center');
  if (hasNumFormat) aspek4 = 25;
  else aspek4 = 20;

  const totalSkor = Math.min(100, Math.max(60, aspek1 + aspek2 + aspek3 + aspek4));
  return {
    totalSkor,
    aspek1,
    aspek2,
    aspek3,
    aspek4,
    grade: totalSkor >= 90 ? 'Sangat Baik (A)' : totalSkor >= 75 ? 'Baik (B)' : 'Cukup (C)'
  };
}

// 3. Notifikasi Feedback AI & Rincian 4 Aspek ke Siswa
function tampilkanHasilPenilaianOtomatis(tipe, evaluasi, judul) {
  playSound('fanfare');
  const namaAspek = (tipe === 'poster') ? 'Poster Word (TP 2.1)' : 'Tabel Excel (TP 1.2 - 1.4)';

  const existingAlert = document.getElementById('toast-evaluasi-ai');
  if (existingAlert) existingAlert.remove();

  const el = document.createElement('div');
  el.id = 'toast-evaluasi-ai';
  el.className = 'fixed bottom-6 right-6 z-50 bg-slate-900/95 border-2 border-indigo-400 text-white p-4 sm:p-5 rounded-2xl shadow-2xl max-w-sm backdrop-blur-md transition-all duration-300';

  const aspek1Label = (tipe === 'poster') ? 'Kelengkapan Elemen' : 'Struktur Kolom & Header';
  const aspek2Label = (tipe === 'poster') ? 'Budi Pekerti & Tema' : 'Formula Rumus (=SUM/AVG)';
  const aspek3Label = (tipe === 'poster') ? 'Kerapian Tata Letak' : 'Format Sel & Border';
  const aspek4Label = (tipe === 'poster') ? 'Warna & Bingkai' : 'Kerapian Data & Angka';

  el.innerHTML = `
    <div class="flex items-start justify-between gap-3 mb-2.5">
      <div class="flex items-center gap-2">
        <span class="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-sky-400 text-white flex items-center justify-center text-sm font-bold shadow-md">🤖</span>
        <div>
          <h5 class="font-title font-bold text-xs text-indigo-300 leading-tight">Penilaian Otomatis Sistem (AI)</h5>
          <span class="text-[10px] text-slate-400">${namaAspek}</span>
        </div>
      </div>
      <button onclick="document.getElementById('toast-evaluasi-ai').remove()" class="w-6 h-6 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs transition">✕</button>
    </div>
    <div class="p-2.5 rounded-xl bg-slate-800/90 border border-slate-700 mb-2.5 flex items-center justify-between">
      <div>
        <div class="text-[11px] text-slate-400 truncate max-w-[170px]" title="${judul}">${judul}</div>
        <div class="text-xs font-bold text-emerald-400">${evaluasi.grade}</div>
      </div>
      <div class="text-right">
        <span class="text-2xl font-black font-mono text-amber-300">${evaluasi.totalSkor}</span>
        <span class="text-xs text-slate-400">/100</span>
      </div>
    </div>
    <div class="grid grid-cols-2 gap-1.5 text-[10px] text-slate-300 pt-2 border-t border-slate-700/80">
      <div class="bg-slate-800/60 p-1.5 rounded-lg border border-slate-700/50">
        <span class="text-slate-400 block">${aspek1Label}:</span>
        <b class="text-white text-xs">${evaluasi.aspek1}</b>/25
      </div>
      <div class="bg-slate-800/60 p-1.5 rounded-lg border border-slate-700/50">
        <span class="text-slate-400 block">${aspek2Label}:</span>
        <b class="text-white text-xs">${evaluasi.aspek2}</b>/25
      </div>
      <div class="bg-slate-800/60 p-1.5 rounded-lg border border-slate-700/50">
        <span class="text-slate-400 block">${aspek3Label}:</span>
        <b class="text-white text-xs">${evaluasi.aspek3}</b>/25
      </div>
      <div class="bg-slate-800/60 p-1.5 rounded-lg border border-slate-700/50">
        <span class="text-slate-400 block">${aspek4Label}:</span>
        <b class="text-white text-xs">${evaluasi.aspek4}</b>/25
      </div>
    </div>
    <div class="mt-2.5 text-[10px] text-emerald-300 flex items-center gap-1.5 font-medium">
      <i class="fa-solid fa-circle-check text-emerald-400"></i>
      <span>Nilai otomatis dicatat ke Dasbor Guru (+25 ⭐)</span>
    </div>
  `;
  document.body.appendChild(el);
  setTimeout(() => {
    const b = document.getElementById('toast-evaluasi-ai');
    if (b) b.remove();
  }, 7500);
}

// 4. Catat Poster Siswa ke Database Guru dengan Nilai Otomatis
function catatPosterSiswa(title, previewDataUrl) {
  try {
    const profile = getActiveStudentProfile();
    if (!profile) {
      showToast('⚠️ Silakan masuk/pilih akun siswa terlebih dahulu agar karya poster tersimpan ke buku nilai!', 'warning');
      bukaPilihSiswaCepat();
      return;
    }
    const db = getStudentDatabase();
    let student = db.find(s => s.id === profile.id || (s.nama.toLowerCase() === profile.nama.toLowerCase() && s.kelas === profile.kelas));

    const evaluasi = hitungRubrikOtomatisPosterWord(wordElements, title, wordPageBgColor, wordPageBorderStyle);

    if (student) {
      student.posterWord = (student.posterWord || 0) + 1;
      student.nilaiPoster = Math.max(student.nilaiPoster || 0, evaluasi.totalSkor);
      if (!student.tpSelesai.includes('TP 2.1')) student.tpSelesai.push('TP 2.1');
      student.poinBintang = (student.poinBintang || 0) + 25;
      student.terakhirAktif = 'Baru saja';
      saveStudentDatabase(db);
    }

    tampilkanHasilPenilaianOtomatis('poster', evaluasi, title || 'Poster Word TP 2.1');
  } catch (e) {
    console.warn('Gagal mencatat poster siswa:', e);
  }
}

// 5. Catat Latihan Excel Siswa ke Database Guru dengan Nilai Otomatis
function catatLatihanExcelSiswa(namaLatihan = 'Praktik Spreadsheet Excel') {
  try {
    const profile = getActiveStudentProfile();
    if (!profile) {
      showToast('⚠️ Silakan masuk/pilih akun siswa terlebih dahulu agar latihan tersimpan ke buku nilai!', 'warning');
      bukaPilihSiswaCepat();
      return;
    }
    const db = getStudentDatabase();
    let student = db.find(s => s.id === profile.id || (s.nama.toLowerCase() === profile.nama.toLowerCase() && s.kelas === profile.kelas));

    const evaluasi = hitungRubrikOtomatisExcel();

    if (student) {
      student.excelTabel = (student.excelTabel || 0) + 1;
      student.nilaiExcel = Math.max(student.nilaiExcel || 0, evaluasi.totalSkor);
      if (!student.tpSelesai.includes('TP 1.2')) student.tpSelesai.push('TP 1.2');
      if (!student.tpSelesai.includes('TP 1.3')) student.tpSelesai.push('TP 1.3');
      student.poinBintang = (student.poinBintang || 0) + 25;
      student.terakhirAktif = 'Baru saja';
      saveStudentDatabase(db);
    }

    tampilkanHasilPenilaianOtomatis('excel', evaluasi, namaLatihan);
  } catch (e) {
    console.warn('Gagal mencatat excel siswa:', e);
  }
}

// 6. Action Triggers untuk Tombol Cepat di UI
async function evaluasiDanNilaiOtomatisPosterWord() {
  playSound('click');
  const inputEl = document.getElementById('word-doc-name-input');
  const title = (inputEl && inputEl.value.trim()) ? inputEl.value.trim() : (currentWordDocTitle || 'Poster Lingkungan Hidup');

  if (wordElements.length === 0) {
    wordElements = getPosterPresetElements('lingkungan');
    renderWordElements();
  }

  await simpanPosterKeGaleriWord();
}

function simpanDanNilaiExcel() {
  playSound('click');
  const tpl = (typeof excelState !== 'undefined' && EXCEL_TEMPLATES && EXCEL_TEMPLATES[excelState.activeTemplate]) || {};
  const namaLatihan = tpl.sheetTitle || 'Latihan Tabel Spreadsheet';
  catatLatihanExcelSiswa(namaLatihan);
}

// --------------------------------------------------------------------------
// RENDERING DASBOR GURU & KPI METRICS
// --------------------------------------------------------------------------
function renderDasborGuru() {
  const db = getStudentDatabase();

  // Hitung KPI
  const totalSiswa = db.length;
  let totalKuisSkor = 0;
  let countKuis = 0;
  let totalPoster = 0;
  let totalExcel = 0;
  let countTuntas = 0;

  db.forEach(s => {
    if (s.kuisSem1 > 0) {
      totalKuisSkor += s.kuisSem1;
      countKuis++;
    }
    if (s.kuisSem2 > 0) {
      totalKuisSkor += s.kuisSem2;
      countKuis++;
    }
    totalPoster += (s.posterWord || 0);
    totalExcel += (s.excelTabel || 0);
    if (s.statusKkm === 'Tuntas' || (!s.statusKkm && s.kuisSem1 >= 80)) {
      countTuntas++;
    }
  });

  const rataKuis = countKuis > 0 ? (totalKuisSkor / countKuis).toFixed(1) : '0';
  const kkmRate = totalSiswa > 0 ? Math.round((countTuntas / totalSiswa) * 100) : 0;

  // Render KPI Cards
  const elTotalSiswa = document.getElementById('guru-stat-total-siswa');
  const elRataKuis = document.getElementById('guru-stat-rata-kuis');
  const elTotalPoster = document.getElementById('guru-stat-total-poster');
  const elTotalExcel = document.getElementById('guru-stat-total-excel');
  const elKkmRate = document.getElementById('guru-stat-kkm-rate');

  if (elTotalSiswa) elTotalSiswa.innerText = totalSiswa;
  if (elRataKuis) elRataKuis.innerText = rataKuis;
  if (elTotalPoster) elTotalPoster.innerText = totalPoster;
  if (elTotalExcel) elTotalExcel.innerText = totalExcel;
  if (elKkmRate) elKkmRate.innerText = `${kkmRate}%`;

  // Render SubTab yang aktif
  if (state.subTabGuru === 'gradebook') {
    filterDanCariSiswa();
  } else if (state.subTabGuru === 'galeri') {
    renderGaleriGuru();
  } else if (state.subTabGuru === 'cloud') {
    if (typeof renderTabsKelasSheet === 'function') renderTabsKelasSheet();
    if (typeof renderRingkasanKoneksiKelas === 'function') renderRingkasanKoneksiKelas();
  }

  // Render Panel Kontrol Pengaturan Periode Semester 2
  if (typeof renderPanelPengaturanSemesterGuru === 'function') {
    renderPanelPengaturanSemesterGuru();
  }
}

function muatUlangDataDasbor() {
  playSound('click');
  renderDasborGuru();
  showToast('Data Dasbor Guru berhasil disegarkan 🔄', 'info');
}

// --------------------------------------------------------------------------
// KONTROL DOCK GURU & FILTER KELAS (DARNINGSIH, S.T. | KELAS 4 | KELAS 5 | KELAS 6)
// --------------------------------------------------------------------------
function pilihKelasGuruNav(tingkat) {
  playSound('click');
  state.tingkatKelasGuru = tingkat;

  // Pastikan berada di tab guru & gradebook
  if (state.currentTab !== 'guru') {
    switchTab('guru');
  }
  if (state.subTabGuru !== 'gradebook') {
    pilihSubTabGuru('gradebook');
  }

  // Update styling tombol dock guru desktop
  const btnK4 = document.getElementById('nav-guru-k4');
  const btnK5 = document.getElementById('nav-guru-k5');
  const btnK6 = document.getElementById('nav-guru-k6');
  const btnProf = document.getElementById('nav-guru-profil');

  const inactiveCls = 'nav-btn nav-btn-3d px-3.5 sm:px-4 py-2 rounded-full font-title font-semibold text-xs sm:text-sm transition-all duration-200 flex items-center gap-2 text-slate-300 hover:text-white shrink-0 cursor-pointer';
  const activeCls = 'nav-btn nav-btn-3d active-tab px-4.5 sm:px-5 py-2 rounded-full font-title font-bold text-xs sm:text-sm transition-all duration-200 flex items-center gap-2 shrink-0 cursor-pointer';

  if (btnK4) btnK4.className = (tingkat === '4') ? activeCls : inactiveCls;
  if (btnK5) btnK5.className = (tingkat === '5') ? activeCls : inactiveCls;
  if (btnK6) btnK6.className = (tingkat === '6') ? activeCls : inactiveCls;
  if (btnProf) {
    if (tingkat === 'all') {
      btnProf.className = 'nav-btn nav-btn-3d active-tab px-4.5 sm:px-5 py-2 rounded-full font-title font-bold text-xs sm:text-sm transition-all duration-200 flex items-center gap-2 shrink-0 cursor-pointer';
    } else {
      btnProf.className = 'nav-btn nav-btn-3d px-3.5 sm:px-4 py-2 rounded-full font-title font-bold text-xs sm:text-sm transition-all duration-200 flex items-center gap-2 text-amber-300 hover:text-white shrink-0 cursor-pointer';
    }
  }

  // Mobile styling
  const mBtnK4 = document.getElementById('m-nav-guru-k4');
  const mBtnK5 = document.getElementById('m-nav-guru-k5');
  const mBtnK6 = document.getElementById('m-nav-guru-k6');
  const mBtnProf = document.getElementById('m-nav-guru-profil');

  if (mBtnK4) mBtnK4.className = (tingkat === '4') ? 'nav-btn-mobile flex flex-col items-center text-xs font-bold text-blue-400 scale-105' : 'nav-btn-mobile flex flex-col items-center text-xs font-semibold text-slate-400';
  if (mBtnK5) mBtnK5.className = (tingkat === '5') ? 'nav-btn-mobile flex flex-col items-center text-xs font-bold text-blue-400 scale-105' : 'nav-btn-mobile flex flex-col items-center text-xs font-semibold text-slate-400';
  if (mBtnK6) mBtnK6.className = (tingkat === '6') ? 'nav-btn-mobile flex flex-col items-center text-xs font-bold text-blue-400 scale-105' : 'nav-btn-mobile flex flex-col items-center text-xs font-semibold text-slate-400';
  if (mBtnProf) mBtnProf.className = (tingkat === 'all') ? 'nav-btn-mobile flex flex-col items-center text-xs font-bold text-amber-300 scale-105' : 'nav-btn-mobile flex flex-col items-center text-xs font-semibold text-amber-300/70';

  if (tingkat === 'all') {
    state.filterKelasGuru = 'semua';
    updateFilterKelasTabs('all');
    filterDanCariSiswa();
    showToast('Menampilkan Seluruh Siswa Pengampu Darningsih, S.T. 👩‍🏫', 'info');
  } else {
    state.filterKelasGuru = `tingkat_${tingkat}`;
    updateFilterKelasTabs(tingkat);
    filterDanCariSiswa();
    showToast(`Menampilkan Data Siswa Kelas ${tingkat} • Pengampu Darningsih, S.T. 🎓`, 'success');
  }
}
window.pilihKelasGuruNav = pilihKelasGuruNav;

function updateFilterKelasTabs(tingkat) {
  const container = document.getElementById('guru-filter-kelas-container');
  if (!container) return;

  const classMap = {
    '4': ['4A', '4B', '4C', '4D', '4E'],
    '5': ['5D'],
    '6': ['6A', '6B', '6C', '6D', '6E']
  };

  if (tingkat === 'all') {
    container.innerHTML = `
      <span class="text-xs font-bold text-slate-400 uppercase mr-1">Kelas:</span>
      <button onclick="setFilterKelasGuru('semua')" id="btn-filter-kelas-semua" class="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-100 text-indigo-700 transition">Semua</button>
      <button onclick="setFilterKelasGuru('4A')" id="btn-filter-kelas-4A" class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition">4A</button>
      <button onclick="setFilterKelasGuru('4B')" id="btn-filter-kelas-4B" class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition">4B</button>
      <button onclick="setFilterKelasGuru('4C')" id="btn-filter-kelas-4C" class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition">4C</button>
      <button onclick="setFilterKelasGuru('4D')" id="btn-filter-kelas-4D" class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition">4D</button>
      <button onclick="setFilterKelasGuru('4E')" id="btn-filter-kelas-4E" class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition">4E</button>
      <button onclick="setFilterKelasGuru('5D')" id="btn-filter-kelas-5D" class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition">5D</button>
      <button onclick="setFilterKelasGuru('6A')" id="btn-filter-kelas-6A" class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition">6A</button>
      <button onclick="setFilterKelasGuru('6B')" id="btn-filter-kelas-6B" class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition">6B</button>
      <button onclick="setFilterKelasGuru('6C')" id="btn-filter-kelas-6C" class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition">6C</button>
      <button onclick="setFilterKelasGuru('6D')" id="btn-filter-kelas-6D" class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition">6D</button>
      <button onclick="setFilterKelasGuru('6E')" id="btn-filter-kelas-6E" class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition">6E</button>
    `;
  } else {
    const list = classMap[tingkat] || ['4A', '4B', '4C', '4D', '4E'];
    let btns = `
      <span class="text-xs font-bold text-slate-400 uppercase mr-1">Tingkat ${tingkat}:</span>
      <button onclick="setFilterKelasGuru('tingkat_${tingkat}')" id="btn-filter-kelas-tingkat_${tingkat}" class="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-100 text-indigo-700 transition">Semua Kelas ${tingkat}</button>
    `;
    list.forEach(clsName => {
      btns += `<button onclick="setFilterKelasGuru('${clsName}')" id="btn-filter-kelas-${clsName}" class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition">${clsName}</button>`;
    });
    container.innerHTML = btns;
  }
}
window.updateFilterKelasTabs = updateFilterKelasTabs;

// --------------------------------------------------------------------------
// KONTROL SUB-TAB DASBOR GURU
// --------------------------------------------------------------------------
function pilihSubTabGuru(tabName) {
  playSound('click');
  state.subTabGuru = tabName;

  const tabs = ['gradebook', 'analisis', 'galeri', 'cloud'];
  tabs.forEach(t => {
    const view = document.getElementById(`guru-view-${t}`);
    const btn = document.getElementById(`guru-subtab-btn-${t}`);
    if (view) {
      if (t === tabName) {
        view.classList.remove('hidden');
      } else {
        view.classList.add('hidden');
      }
    }
    if (btn) {
      if (t === tabName) {
        btn.className = 'px-4 py-2 rounded-xl text-xs font-bold font-title transition flex items-center gap-2 bg-indigo-600 text-white shadow-xs';
      } else {
        btn.className = 'px-4 py-2 rounded-xl text-xs font-semibold font-title text-slate-600 hover:bg-slate-100 transition flex items-center gap-2';
      }
    }
  });

  if (tabName === 'gradebook') {
    filterDanCariSiswa();
  } else if (tabName === 'galeri') {
    renderGaleriGuru();
  } else if (tabName === 'cloud') {
    if (typeof renderTabsKelasSheet === 'function') renderTabsKelasSheet();
    if (typeof renderRingkasanKoneksiKelas === 'function') renderRingkasanKoneksiKelas();
  }
}

function setFilterKelasGuru(kelas) {
  playSound('click');
  state.filterKelasGuru = kelas;

  const container = document.getElementById('guru-filter-kelas-container');
  if (container) {
    container.querySelectorAll('button').forEach(btn => {
      if (btn.id === `btn-filter-kelas-${kelas}`) {
        btn.className = 'px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-100 text-indigo-700 transition';
      } else {
        btn.className = 'px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition';
      }
    });
  }

  filterDanCariSiswa();

  // Jika kelas spesifik (seperti '4B') belum memiliki data di lokal, otomatis coba tarik dari Google Sheets
  if (kelas && kelas !== 'semua' && !kelas.startsWith('tingkat_')) {
    const db = getStudentDatabase();
    const studentsInClass = db.filter(s => s.kelas === kelas);
    if (studentsInClass.length === 0 && typeof sinkronkanDataSiswaPerKelas === 'function') {
      sinkronkanDataSiswaPerKelas(kelas, true).then(res => {
        if (res && res.length > 0) {
          filterDanCariSiswa();
        }
      }).catch(err => console.warn('Auto-sync kelas info:', err));
    }
  }
}

// --------------------------------------------------------------------------
// PENGATURAN MODE PENILAIAN GURU (SEMESTER 1 vs SEMESTER 2 vs REKAP LENGKAP)
// --------------------------------------------------------------------------
function setModePenilaianGuru(mode) {
  playSound('click');
  state.modePenilaianGuru = mode;

  const btnSem1 = document.getElementById('btn-penilaian-sem1');
  const btnSem2 = document.getElementById('btn-penilaian-sem2');
  const btnSemua = document.getElementById('btn-penilaian-semua');
  const labelDesc = document.getElementById('penilaian-desc-label');

  if (btnSem1) {
    btnSem1.className = (mode === 1)
      ? 'px-3.5 py-1.5 rounded-lg text-xs font-title font-bold transition flex items-center gap-1.5 bg-indigo-600 text-white shadow-xs cursor-pointer'
      : 'px-3.5 py-1.5 rounded-lg text-xs font-title font-bold transition flex items-center gap-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer';
  }
  if (btnSem2) {
    btnSem2.className = (mode === 2)
      ? 'px-3.5 py-1.5 rounded-lg text-xs font-title font-bold transition flex items-center gap-1.5 bg-purple-600 text-white shadow-xs cursor-pointer'
      : 'px-3.5 py-1.5 rounded-lg text-xs font-title font-bold transition flex items-center gap-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer';
  }
  if (btnSemua) {
    btnSemua.className = (mode === 'semua')
      ? 'px-3.5 py-1.5 rounded-lg text-xs font-title font-bold transition flex items-center gap-1.5 bg-emerald-600 text-white shadow-xs cursor-pointer'
      : 'px-3.5 py-1.5 rounded-lg text-xs font-title font-bold transition flex items-center gap-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer';
  }

  filterDanCariSiswa();
}
window.setModePenilaianGuru = setModePenilaianGuru;

// --------------------------------------------------------------------------
// FILTER & PENCARIAN SISWA DI GRADEBOOK
// --------------------------------------------------------------------------
function filterDanCariSiswa() {
  const db = getStudentDatabase();
  const searchInput = document.getElementById('guru-cari-siswa');
  const filterKkmSelect = document.getElementById('guru-filter-kkm');
  const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
  const filterKkm = filterKkmSelect ? filterKkmSelect.value : 'semua';
  const mode = state.modePenilaianGuru || 1;

  const filtered = db.filter(s => {
    // Filter Kelas / Tingkat
    if (state.filterKelasGuru && state.filterKelasGuru.startsWith('tingkat_')) {
      const targetTingkat = state.filterKelasGuru.replace('tingkat_', '');
      if (!s.kelas.startsWith(targetTingkat)) return false;
    } else if (state.filterKelasGuru !== 'semua' && s.kelas !== state.filterKelasGuru) {
      return false;
    }

    // Hitung status nilai berdasarkan mode penilaian aktif
    let skorAktif = 80;
    if (mode === 1) {
      const p1 = s.nilaiPoster !== undefined ? s.nilaiPoster : (s.posterWord > 0 ? 90 : 85);
      const p2 = s.nilaiExcel !== undefined ? s.nilaiExcel : (s.excelTabel > 0 ? 88 : 85);
      skorAktif = Math.round(((s.kuisSem1 || 0) * 0.3) + (p1 * 0.35) + (p2 * 0.35));
    } else if (mode === 2) {
      const p1 = s.nilaiScratch !== undefined ? s.nilaiScratch : 90;
      const p2 = s.nilaiRoboMind !== undefined ? s.nilaiRoboMind : 88;
      skorAktif = Math.round(((s.kuisSem2 || 0) * 0.3) + (p1 * 0.35) + (p2 * 0.35));
    } else {
      const p1_s1 = s.nilaiPoster !== undefined ? s.nilaiPoster : 85;
      const p2_s1 = s.nilaiExcel !== undefined ? s.nilaiExcel : 85;
      const p1_s2 = s.nilaiScratch !== undefined ? s.nilaiScratch : 88;
      const p2_s2 = s.nilaiRoboMind !== undefined ? s.nilaiRoboMind : 86;
      skorAktif = Math.round((p1_s1 + p2_s1 + p1_s2 + p2_s2 + (s.kuisSem1 || 80) + (s.kuisSem2 || 80)) / 6);
    }

    // Filter KKM
    if (filterKkm === 'tuntas') {
      if (skorAktif < 80) return false;
    } else if (filterKkm === 'remedial') {
      if (skorAktif >= 80) return false;
    }

    // Search query
    if (query) {
      const matchNama = s.nama.toLowerCase().includes(query);
      const matchAbsen = (s.absen || '').includes(query);
      const matchNis = (s.nis || '').toLowerCase().includes(query);
      if (!matchNama && !matchAbsen && !matchNis) return false;
    }
    return true;
  });

  // Urutkan berdasarkan nomor absen
  filtered.sort((a, b) => parseInt(a.absen || '0') - parseInt(b.absen || '0'));

  renderTabelGradebook(filtered, db.length);
}

function setZoomTabelGuru(level) {
  state.zoomTabelGuru = level;
  try { localStorage.setItem('educode_table_zoom_v1', level); } catch(e){}
  
  const bNormal = document.getElementById('btn-zoom-normal');
  const bBesar = document.getElementById('btn-zoom-besar');
  const bEkstra = document.getElementById('btn-zoom-ekstra');
  
  if (bNormal) bNormal.className = (level === 'normal') ? 'px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-600 text-white shadow-xs transition cursor-pointer' : 'px-2.5 py-1 rounded-md text-xs font-bold text-slate-600 hover:text-slate-800 transition cursor-pointer';
  if (bBesar) bBesar.className = (level === 'besar') ? 'px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-600 text-white shadow-xs transition cursor-pointer' : 'px-2.5 py-1 rounded-md text-xs font-bold text-slate-600 hover:text-slate-800 transition cursor-pointer';
  if (bEkstra) bEkstra.className = (level === 'ekstra') ? 'px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-600 text-white shadow-xs transition cursor-pointer' : 'px-2.5 py-1 rounded-md text-xs font-bold text-slate-600 hover:text-slate-800 transition cursor-pointer';

  filterDanCariSiswa();
}
window.setZoomTabelGuru = setZoomTabelGuru;

function renderTabelGradebook(students, totalAll) {
  const tbody = document.getElementById('guru-tbody-siswa');
  const thead = document.getElementById('guru-thead-penilaian');
  const emptyState = document.getElementById('guru-empty-state');
  const tampilCount = document.getElementById('guru-tampil-count');
  const totalCount = document.getElementById('guru-total-count');
  const mode = state.modePenilaianGuru || 1;

  if (tampilCount) tampilCount.innerText = students.length;
  if (totalCount) totalCount.innerText = totalAll;

  // Level Zoom Teks: Default 'besar' (Sangat Ramah Mata Plus & Jelas)
  const zoom = state.zoomTabelGuru || 'besar';

  // Sinkronkan tombol zoom aktif di antarmuka
  const bNormal = document.getElementById('btn-zoom-normal');
  const bBesar = document.getElementById('btn-zoom-besar');
  const bEkstra = document.getElementById('btn-zoom-ekstra');
  if (bNormal && bBesar && bEkstra) {
    bNormal.className = (zoom === 'normal') ? 'px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-600 text-white shadow-xs transition cursor-pointer' : 'px-2.5 py-1 rounded-md text-xs font-bold text-slate-600 hover:text-slate-800 transition cursor-pointer';
    bBesar.className = (zoom === 'besar') ? 'px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-600 text-white shadow-xs transition cursor-pointer' : 'px-2.5 py-1 rounded-md text-xs font-bold text-slate-600 hover:text-slate-800 transition cursor-pointer';
    bEkstra.className = (zoom === 'ekstra') ? 'px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-600 text-white shadow-xs transition cursor-pointer' : 'px-2.5 py-1 rounded-md text-xs font-bold text-slate-600 hover:text-slate-800 transition cursor-pointer';
  }

  // Pengaturan Tipografi & Spasi Berdasarkan Tingkat Zoom (Sangat Ramah Mata Plus)
  let szNo = 'text-sm font-black';
  let szNama = 'text-sm sm:text-base font-black';
  let szSub = 'text-xs font-bold';
  let szBadge = 'text-xs sm:text-sm font-black';
  let szAngka = 'text-base sm:text-lg font-black';
  let szTag = 'text-xs font-black';
  let szCatatan = 'text-xs sm:text-sm font-semibold';
  let szAksi = 'w-9 h-9 sm:w-10 sm:h-10 text-sm';
  let szAvatar = 'w-10 h-10 sm:w-11 sm:h-11 text-base font-black';
  let padRow = 'py-3.5 sm:py-4';

  if (zoom === 'ekstra') {
    szNo = 'text-base sm:text-lg font-black';
    szNama = 'text-base sm:text-lg font-black';
    szSub = 'text-xs sm:text-sm font-black';
    szBadge = 'text-sm sm:text-base font-black';
    szAngka = 'text-lg sm:text-xl font-black';
    szTag = 'text-xs sm:text-sm font-black';
    szCatatan = 'text-sm sm:text-base font-bold';
    szAksi = 'w-11 h-11 text-base';
    szAvatar = 'w-12 h-12 text-lg font-black';
    padRow = 'py-4 sm:py-5';
  } else if (zoom === 'normal') {
    szNo = 'text-xs font-bold';
    szNama = 'text-xs sm:text-sm font-bold';
    szSub = 'text-[11px] font-semibold';
    szBadge = 'text-xs font-bold';
    szAngka = 'text-sm sm:text-base font-bold';
    szTag = 'text-[10px] font-bold';
    szCatatan = 'text-xs font-medium';
    szAksi = 'w-8 h-8 text-xs';
    szAvatar = 'w-8 h-8 text-sm font-bold';
    padRow = 'py-2.5';
  }

  // 1. Render Header Tabel Sesuai Mode Penilaian
  if (thead) {
    if (mode === 1) {
      thead.innerHTML = `
        <tr id="guru-table-head-row" class="bg-gradient-to-r from-indigo-100 via-sky-100 to-purple-100 border-b-2 border-indigo-200 text-indigo-950 font-title font-black text-xs sm:text-sm tracking-wider uppercase">
          <th class="py-4 px-3 text-center w-12">No</th>
          <th class="py-4 px-3 min-w-[210px]">Data Siswa</th>
          <th class="py-4 px-2 text-center w-20">Kelas</th>
          <th class="py-4 px-2 text-center w-28">Kuis Sem 1</th>
          <th class="py-4 px-2 text-center w-32">1. Poster Word</th>
          <th class="py-4 px-2 text-center w-32">2. Tabel Excel</th>
          <th class="py-4 px-2 text-center w-28">Nilai Sem 1</th>
          <th class="py-4 px-2 text-center w-32">Status KKM</th>
          <th class="py-4 px-3 min-w-[170px]">Catatan Guru</th>
          <th class="py-4 px-2 text-center w-24">Aksi</th>
        </tr>
      `;
    } else if (mode === 2) {
      thead.innerHTML = `
        <tr id="guru-table-head-row" class="bg-gradient-to-r from-purple-100 via-pink-100 to-sky-100 border-b-2 border-purple-200 text-purple-950 font-title font-black text-xs sm:text-sm tracking-wider uppercase">
          <th class="py-4 px-3 text-center w-12">No</th>
          <th class="py-4 px-3 min-w-[210px]">Data Siswa</th>
          <th class="py-4 px-2 text-center w-20">Kelas</th>
          <th class="py-4 px-2 text-center w-28">Kuis Sem 2</th>
          <th class="py-4 px-2 text-center w-32">1. Scratch Coding</th>
          <th class="py-4 px-2 text-center w-32">2. RoboMind & AI</th>
          <th class="py-4 px-2 text-center w-28">Nilai Sem 2</th>
          <th class="py-4 px-2 text-center w-32">Status KKM</th>
          <th class="py-4 px-3 min-w-[170px]">Catatan Guru</th>
          <th class="py-4 px-2 text-center w-24">Aksi</th>
        </tr>
      `;
    } else {
      thead.innerHTML = `
        <tr id="guru-table-head-row" class="bg-gradient-to-r from-slate-100 via-indigo-100 to-emerald-100 border-b-2 border-indigo-200 text-indigo-950 font-title font-black text-xs sm:text-sm tracking-wider uppercase">
          <th class="py-4 px-3 text-center w-12">No</th>
          <th class="py-4 px-3 min-w-[200px]">Data Siswa</th>
          <th class="py-4 px-2 text-center w-16">Kelas</th>
          <th class="py-4 px-2 text-center w-24">Sem 1 Word</th>
          <th class="py-4 px-2 text-center w-24">Sem 1 Excel</th>
          <th class="py-4 px-2 text-center w-24">Sem 2 Scratch</th>
          <th class="py-4 px-2 text-center w-24">Sem 2 Robo</th>
          <th class="py-4 px-2 text-center w-28">Kuis (S1/S2)</th>
          <th class="py-4 px-2 text-center w-24">Rata-Rata</th>
          <th class="py-4 px-2 text-center w-28">Status KKM</th>
          <th class="py-4 px-2 text-center w-24">Aksi</th>
        </tr>
      `;
    }
  }

  if (!tbody) return;
  tbody.innerHTML = '';

  if (students.length === 0) {
    if (emptyState) {
      emptyState.classList.remove('hidden');
      const searchInput = document.getElementById('guru-cari-siswa');
      const hasSearch = searchInput && searchInput.value.trim() !== '';
      const targetClass = (state.filterKelasGuru && state.filterKelasGuru !== 'semua' && !state.filterKelasGuru.startsWith('tingkat_')) ? state.filterKelasGuru : null;

      if (!hasSearch && targetClass) {
        const cfg = (typeof getClassSheetsConfig === 'function') ? getClassSheetsConfig() : {};
        const classCfg = cfg[targetClass] || {};
        const currentTabName = classCfg.tabName || targetClass;
        emptyState.innerHTML = `
          <div class="py-6 px-4 max-w-lg mx-auto text-center space-y-3.5">
            <div class="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto text-2xl shadow-inner border border-indigo-100">
              <i class="fa-solid fa-cloud-arrow-down"></i>
            </div>
            <div>
              <h4 class="font-title font-bold text-slate-800 text-base">Data Siswa Kelas ${targetClass} Belum Ditampilkan</h4>
              <p class="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Data siswa diambil langsung dari Google Sheets. Pastikan tab sheet di file Google Sheets Anda bernama <strong class="text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">${currentTabName}</strong> atau <strong class="text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">Kelas ${targetClass}</strong>.
              </p>
            </div>
            <div class="flex flex-wrap items-center justify-center gap-2.5 pt-1">
              <button onclick="sinkronkanDataSiswaPerKelas('${targetClass}')" class="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-title text-xs font-bold shadow-lg shadow-blue-500/25 flex items-center gap-2 cursor-pointer transition active:scale-95">
                <i class="fa-solid fa-arrows-rotate"></i> Tarik Data Google Sheets Kelas ${targetClass} Sekarang
              </button>
              <button onclick="pilihSubTabGuru('cloud'); if(typeof pilihKelasSheetConfigTab==='function') pilihKelasSheetConfigTab('${targetClass}');" class="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-title text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">
                <i class="fa-solid fa-link"></i> Atur Link / Tab Sheet
              </button>
            </div>
          </div>
        `;
      } else {
        emptyState.innerHTML = `
          <div class="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-2xl">
            <i class="fa-solid fa-magnifying-glass"></i>
          </div>
          <h4 class="font-title font-bold text-slate-700 text-sm">Tidak ada data siswa ditemukan</h4>
          <p class="text-xs text-slate-500 max-w-sm mx-auto">
            Coba sesuaikan kata kunci pencarian atau ubah filter kelas di atas.
          </p>
        `;
      }
    }
    return;
  }
  if (emptyState) emptyState.classList.add('hidden');

  students.forEach((s, idx) => {
    const tr = document.createElement('tr');
    tr.className = 'even:bg-slate-50/70 hover:bg-gradient-to-r hover:from-indigo-50/90 hover:via-purple-50/50 hover:to-indigo-50/30 transition-all border-b border-slate-200/90';

    const initial = s.nama ? s.nama.charAt(0).toUpperCase() : 'S';

    // Perhitungan Nilai Semester 1 (2 Penilaian Praktik + Kuis 1)
    const p1_s1 = s.nilaiPoster !== undefined ? s.nilaiPoster : (s.posterWord > 0 ? 90 : 85);
    const p2_s1 = s.nilaiExcel !== undefined ? s.nilaiExcel : (s.excelTabel > 0 ? 88 : 85);
    const nilaiSem1 = Math.round(((s.kuisSem1 || 0) * 0.3) + (p1_s1 * 0.35) + (p2_s1 * 0.35));
    const isSem1Pass = (nilaiSem1 >= 80);

    // Perhitungan Nilai Semester 2 (2 Penilaian Praktik + Kuis 2)
    const p1_s2 = s.nilaiScratch !== undefined ? s.nilaiScratch : 90;
    const p2_s2 = s.nilaiRoboMind !== undefined ? s.nilaiRoboMind : 88;
    const nilaiSem2 = Math.round(((s.kuisSem2 || 0) * 0.3) + (p1_s2 * 0.35) + (p2_s2 * 0.35));
    const isSem2Pass = (nilaiSem2 >= 80);

    // Rata-rata Gabungan
    const nilaiGabungan = Math.round((nilaiSem1 + nilaiSem2) / 2);
    const isGabunganPass = (nilaiGabungan >= 80);

    const isKuis1Pass = (s.kuisSem1 >= 80);
    const isKuis2Pass = (s.kuisSem2 >= 80);

    if (mode === 1) {
      // Baris Mode Penilaian Semester 1
      tr.innerHTML = `
        <td class="${padRow} px-3 text-center text-slate-800 font-title font-black ${szNo}">${idx + 1}</td>
        <td class="${padRow} px-3 min-w-[210px]">
          <div class="flex items-center gap-3">
            <div class="${szAvatar} rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 text-white flex items-center justify-center font-title shadow-md shrink-0">
              ${initial}
            </div>
            <div class="min-w-0 flex-1">
              <div class="font-title font-black text-slate-900 hover:text-indigo-600 transition cursor-pointer ${szNama} leading-tight" onclick="bukaModalDetailSiswa('${s.id}')" title="${s.nama}">
                ${s.nama}
              </div>
              <div class="flex items-center gap-2 mt-1.5 flex-wrap">
                <span class="px-2.5 py-0.5 rounded-lg font-mono font-black ${szSub} bg-indigo-100 text-indigo-950 border border-indigo-300 shadow-2xs" title="Nomor Induk Siswa">NIS: ${s.nis || '-'}</span>
                <span class="${szSub} text-slate-700">Absen: <strong class="text-slate-950 font-black">${s.absen || '-'}</strong></span>
              </div>
            </div>
          </div>
        </td>
        <td class="${padRow} px-2 text-center">
          <span class="px-3 py-1.5 rounded-xl font-title font-black ${szBadge} shadow-2xs inline-block ${s.kelas.includes('A') ? 'bg-blue-100 text-blue-900 border-2 border-blue-300' : s.kelas.includes('B') ? 'bg-purple-100 text-purple-900 border-2 border-purple-300' : 'bg-emerald-100 text-emerald-900 border-2 border-emerald-300'}">
            ${s.kelas}
          </span>
        </td>
        <td class="${padRow} px-2 text-center">
          <div class="inline-flex flex-col items-center leading-tight">
            <span class="font-title font-black ${szAngka} ${isKuis1Pass ? 'text-slate-900' : 'text-rose-600'}">${s.kuisSem1 || 0}</span>
            <span class="font-title font-black ${szTag} px-2.5 py-0.5 rounded-lg mt-1 inline-flex items-center gap-1 shadow-2xs ${isKuis1Pass ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-rose-100 text-rose-800 border border-rose-300'}">
              ${isKuis1Pass ? 'TUNTAS' : 'REMEDIAL'}
            </span>
          </div>
        </td>
        <td class="${padRow} px-2 text-center">
          <div class="inline-flex flex-col items-center leading-tight">
            <span class="font-title font-black ${szAngka} text-indigo-700">${p1_s1}</span>
            <span class="font-title font-bold ${szSub} text-slate-700 mt-1">${s.posterWord || 0} Poster</span>
          </div>
        </td>
        <td class="${padRow} px-2 text-center">
          <div class="inline-flex flex-col items-center leading-tight">
            <span class="font-title font-black ${szAngka} text-emerald-700">${p2_s1}</span>
            <span class="font-title font-bold ${szSub} text-slate-700 mt-1">${s.excelTabel || 0} Latihan</span>
          </div>
        </td>
        <td class="${padRow} px-2 text-center">
          <span class="inline-block px-3.5 py-1.5 rounded-xl font-title font-black ${szAngka} bg-indigo-100 text-indigo-950 border-2 border-indigo-300 shadow-2xs">${nilaiSem1}</span>
        </td>
        <td class="${padRow} px-2 text-center">
          <span class="font-title font-black ${szTag} px-3 py-1.5 rounded-xl shadow-2xs inline-flex items-center gap-1.5 ${isSem1Pass ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}">
            ${isSem1Pass ? '✅ TUNTAS' : '⚠️ REMEDIAL'}
          </span>
        </td>
        <td class="${padRow} px-3">
          <div class="${szCatatan} text-slate-700 font-semibold leading-relaxed max-w-[200px]" title="${s.catatanGuru || 'Belum ada catatan'}">
            ${s.catatanGuru ? `"${s.catatanGuru}"` : '<span class="text-slate-400 font-normal italic">-</span>'}
          </div>
        </td>
        <td class="${padRow} px-2 text-center">
          <div class="flex items-center justify-center gap-1.5">
            <button onclick="bukaModalDetailSiswa('${s.id}')" title="Detail & Nilai Guru" class="${szAksi} rounded-xl bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 border border-indigo-200 transition flex items-center justify-center shadow-xs cursor-pointer">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button onclick="hapusSiswaById('${s.id}')" title="Hapus Siswa" class="${szAksi} rounded-xl bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 border border-rose-200 transition flex items-center justify-center shadow-xs cursor-pointer">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </td>
      `;
    } else if (mode === 2) {
      // Baris Mode Penilaian Semester 2
      tr.innerHTML = `
        <td class="${padRow} px-3 text-center text-slate-800 font-title font-black ${szNo}">${idx + 1}</td>
        <td class="${padRow} px-3 min-w-[210px]">
          <div class="flex items-center gap-3">
            <div class="${szAvatar} rounded-2xl bg-gradient-to-tr from-purple-600 via-pink-600 to-sky-500 text-white flex items-center justify-center font-title shadow-md shrink-0">
              ${initial}
            </div>
            <div class="min-w-0 flex-1">
              <div class="font-title font-black text-slate-900 hover:text-purple-600 transition cursor-pointer ${szNama} leading-tight" onclick="bukaModalDetailSiswa('${s.id}')" title="${s.nama}">
                ${s.nama}
              </div>
              <div class="flex items-center gap-2 mt-1.5 flex-wrap">
                <span class="px-2.5 py-0.5 rounded-lg font-mono font-black ${szSub} bg-purple-100 text-purple-950 border border-purple-300 shadow-2xs" title="Nomor Induk Siswa">NIS: ${s.nis || '-'}</span>
                <span class="${szSub} text-slate-700">Absen: <strong class="text-slate-950 font-black">${s.absen || '-'}</strong></span>
              </div>
            </div>
          </div>
        </td>
        <td class="${padRow} px-2 text-center">
          <span class="px-3 py-1.5 rounded-xl font-title font-black ${szBadge} shadow-2xs inline-block ${s.kelas.includes('A') ? 'bg-blue-100 text-blue-900 border-2 border-blue-300' : s.kelas.includes('B') ? 'bg-purple-100 text-purple-900 border-2 border-purple-300' : 'bg-emerald-100 text-emerald-900 border-2 border-emerald-300'}">
            ${s.kelas}
          </span>
        </td>
        <td class="${padRow} px-2 text-center">
          <div class="inline-flex flex-col items-center leading-tight">
            <span class="font-title font-black ${szAngka} ${isKuis2Pass ? 'text-slate-900' : 'text-rose-600'}">${s.kuisSem2 || 0}</span>
            <span class="font-title font-black ${szTag} px-2.5 py-0.5 rounded-lg mt-1 inline-flex items-center gap-1 shadow-2xs ${isKuis2Pass ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-rose-100 text-rose-800 border border-rose-300'}">
              ${isKuis2Pass ? 'TUNTAS' : 'REMEDIAL'}
            </span>
          </div>
        </td>
        <td class="${padRow} px-2 text-center">
          <div class="inline-flex flex-col items-center leading-tight">
            <span class="font-title font-black ${szAngka} text-purple-700">${p1_s2}</span>
            <span class="font-title font-bold ${szSub} text-slate-700 mt-1">${s.projekScratch || 2} Projek</span>
          </div>
        </td>
        <td class="${padRow} px-2 text-center">
          <div class="inline-flex flex-col items-center leading-tight">
            <span class="font-title font-black ${szAngka} text-sky-700">${p2_s2}</span>
            <span class="font-title font-bold ${szSub} text-slate-700 mt-1">${s.misiRobo || 3} Misi</span>
          </div>
        </td>
        <td class="${padRow} px-2 text-center">
          <span class="inline-block px-3.5 py-1.5 rounded-xl font-title font-black ${szAngka} bg-purple-100 text-purple-950 border-2 border-purple-300 shadow-2xs">${nilaiSem2}</span>
        </td>
        <td class="${padRow} px-2 text-center">
          <span class="font-title font-black ${szTag} px-3 py-1.5 rounded-xl shadow-2xs inline-flex items-center gap-1.5 ${isSem2Pass ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}">
            ${isSem2Pass ? '✅ TUNTAS' : '⚠️ REMEDIAL'}
          </span>
        </td>
        <td class="${padRow} px-3">
          <div class="${szCatatan} text-slate-700 font-semibold leading-relaxed max-w-[200px]" title="${s.catatanGuru || 'Belum ada catatan'}">
            ${s.catatanGuru ? `"${s.catatanGuru}"` : '<span class="text-slate-400 font-normal italic">-</span>'}
          </div>
        </td>
        <td class="${padRow} px-2 text-center">
          <div class="flex items-center justify-center gap-1.5">
            <button onclick="bukaModalDetailSiswa('${s.id}')" title="Detail & Nilai Guru" class="${szAksi} rounded-xl bg-purple-50 hover:bg-purple-600 hover:text-white text-purple-700 border border-purple-200 transition flex items-center justify-center shadow-xs cursor-pointer">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button onclick="hapusSiswaById('${s.id}')" title="Hapus Siswa" class="${szAksi} rounded-xl bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 border border-rose-200 transition flex items-center justify-center shadow-xs cursor-pointer">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </td>
      `;
    } else {
      // Baris Mode Rekap Lengkap (Sem 1 & 2)
      tr.innerHTML = `
        <td class="${padRow} px-3 text-center text-slate-800 font-title font-black ${szNo}">${idx + 1}</td>
        <td class="${padRow} px-3 min-w-[200px]">
          <div class="flex items-center gap-3">
            <div class="${szAvatar} rounded-2xl bg-gradient-to-tr from-indigo-600 to-emerald-500 text-white flex items-center justify-center font-title shadow-md shrink-0">
              ${initial}
            </div>
            <div class="min-w-0 flex-1">
              <div class="font-title font-black text-slate-900 hover:text-indigo-600 transition cursor-pointer ${szNama} leading-tight" onclick="bukaModalDetailSiswa('${s.id}')" title="${s.nama}">
                ${s.nama}
              </div>
              <div class="flex items-center gap-2 mt-1.5 flex-wrap">
                <span class="px-2 py-0.5 rounded-lg font-mono font-black ${szSub} bg-indigo-100 text-indigo-950 border border-indigo-300">NIS: ${s.nis || '-'}</span>
                <span class="${szSub} text-slate-700">Absen: <strong class="text-slate-950 font-black">${s.absen || '-'}</strong></span>
              </div>
            </div>
          </div>
        </td>
        <td class="${padRow} px-2 text-center font-title font-black ${szBadge} text-slate-800">${s.kelas}</td>
        <td class="${padRow} px-2 text-center font-title font-black ${szAngka} text-indigo-700">${p1_s1}</td>
        <td class="${padRow} px-2 text-center font-title font-black ${szAngka} text-emerald-700">${p2_s1}</td>
        <td class="${padRow} px-2 text-center font-title font-black ${szAngka} text-purple-700">${p1_s2}</td>
        <td class="${padRow} px-2 text-center font-title font-black ${szAngka} text-sky-700">${p2_s2}</td>
        <td class="${padRow} px-2 text-center font-title font-black ${szAngka} text-slate-800">${s.kuisSem1 || 0} / ${s.kuisSem2 || 0}</td>
        <td class="${padRow} px-2 text-center">
          <span class="inline-block px-3 py-1 rounded-xl font-title font-black ${szAngka} bg-indigo-100 text-indigo-950 border border-indigo-300 shadow-2xs">${nilaiGabungan}</span>
        </td>
        <td class="${padRow} px-2 text-center">
          <span class="font-title font-black ${szTag} px-3 py-1 rounded-xl shadow-2xs inline-flex items-center gap-1 ${isGabunganPass ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}">
            ${isGabunganPass ? 'TUNTAS' : 'REMED'}
          </span>
        </td>
        <td class="${padRow} px-2 text-center">
          <div class="flex items-center justify-center gap-1.5">
            <button onclick="bukaModalDetailSiswa('${s.id}')" title="Detail & Nilai Guru" class="${szAksi} rounded-xl bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 border border-indigo-200 transition flex items-center justify-center shadow-xs cursor-pointer">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button onclick="hapusSiswaById('${s.id}')" title="Hapus Siswa" class="${szAksi} rounded-xl bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 border border-rose-200 transition flex items-center justify-center shadow-xs cursor-pointer">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </td>
      `;
    }

    tbody.appendChild(tr);
  });
}

// --------------------------------------------------------------------------
// MODAL DETAIL & EVALUASI SISWA
// --------------------------------------------------------------------------
function bukaModalDetailSiswa(studentId) {
  playSound('click');
  const db = getStudentDatabase();
  const student = db.find(s => s.id === studentId);
  if (!student) return;

  state.selectedStudentId = studentId;

  const modal = document.getElementById('modal-detail-siswa');
  const inputNama = document.getElementById('modal-edit-nama');
  const inputNis = document.getElementById('modal-edit-nis');
  const inputKelas = document.getElementById('modal-edit-kelas');
  const inputAbsen = document.getElementById('modal-edit-absen');
  const inputKuis1 = document.getElementById('modal-edit-kuis1');
  const inputKuis2 = document.getElementById('modal-edit-kuis2');
  const inputNilaiPoster = document.getElementById('modal-edit-nilai-poster');
  const inputPoster = document.getElementById('modal-edit-poster');
  const inputNilaiExcel = document.getElementById('modal-edit-nilai-excel');
  const inputExcel = document.getElementById('modal-edit-excel');
  const inputNilaiScratch = document.getElementById('modal-edit-nilai-scratch');
  const inputScratch = document.getElementById('modal-edit-scratch');
  const inputNilaiRoboMind = document.getElementById('modal-edit-nilai-robomind');
  const inputRoboMind = document.getElementById('modal-edit-robomind');
  const inputBintang = document.getElementById('modal-edit-bintang');
  const inputCatatan = document.getElementById('modal-detail-catatan');

  if (inputNama) inputNama.value = student.nama || '';
  if (inputNis) inputNis.value = student.nis || '';
  if (inputKelas) inputKelas.value = student.kelas || '4A';
  if (inputAbsen) inputAbsen.value = student.absen || '01';
  if (inputKuis1) inputKuis1.value = student.kuisSem1 !== undefined ? student.kuisSem1 : 0;
  if (inputKuis2) inputKuis2.value = student.kuisSem2 !== undefined ? student.kuisSem2 : 0;
  if (inputNilaiPoster) inputNilaiPoster.value = student.nilaiPoster !== undefined ? student.nilaiPoster : (student.posterWord > 0 ? 90 : 85);
  if (inputPoster) inputPoster.value = student.posterWord !== undefined ? student.posterWord : 0;
  if (inputNilaiExcel) inputNilaiExcel.value = student.nilaiExcel !== undefined ? student.nilaiExcel : (student.excelTabel > 0 ? 88 : 85);
  if (inputExcel) inputExcel.value = student.excelTabel !== undefined ? student.excelTabel : 0;
  if (inputNilaiScratch) inputNilaiScratch.value = student.nilaiScratch !== undefined ? student.nilaiScratch : 90;
  if (inputScratch) inputScratch.value = student.projekScratch !== undefined ? student.projekScratch : 2;
  if (inputNilaiRoboMind) inputNilaiRoboMind.value = student.nilaiRoboMind !== undefined ? student.nilaiRoboMind : 88;
  if (inputRoboMind) inputRoboMind.value = student.misiRobo !== undefined ? student.misiRobo : 3;
  if (inputBintang) inputBintang.value = student.poinBintang !== undefined ? student.poinBintang : 0;
  if (inputCatatan) inputCatatan.value = student.catatanGuru || '';

  if (modal) modal.classList.remove('hidden');
}

function tutupModalDetailSiswa() {
  playSound('click');
  const modal = document.getElementById('modal-detail-siswa');
  if (modal) modal.classList.add('hidden');
  state.selectedStudentId = null;
}

// --------------------------------------------------------------------------
// MODAL RUBRIK PENILAIAN OTOMATIS (DASBOR GURU)
// --------------------------------------------------------------------------
function bukaModalRubrikPenilaian() {
  playSound('click');
  const modal = document.getElementById('modal-rubrik-penilaian');
  if (modal) modal.classList.remove('hidden');
}

function tutupModalRubrikPenilaian() {
  playSound('click');
  const modal = document.getElementById('modal-rubrik-penilaian');
  if (modal) modal.classList.add('hidden');
}

function simpanPerubahanDataSiswaModal() {
  if (!state.selectedStudentId) return;

  const inputNama = document.getElementById('modal-edit-nama');
  const inputNis = document.getElementById('modal-edit-nis');
  const inputKelas = document.getElementById('modal-edit-kelas');
  const inputAbsen = document.getElementById('modal-edit-absen');
  const inputKuis1 = document.getElementById('modal-edit-kuis1');
  const inputKuis2 = document.getElementById('modal-edit-kuis2');
  const inputNilaiPoster = document.getElementById('modal-edit-nilai-poster');
  const inputPoster = document.getElementById('modal-edit-poster');
  const inputNilaiExcel = document.getElementById('modal-edit-nilai-excel');
  const inputExcel = document.getElementById('modal-edit-excel');
  const inputNilaiScratch = document.getElementById('modal-edit-nilai-scratch');
  const inputScratch = document.getElementById('modal-edit-scratch');
  const inputNilaiRoboMind = document.getElementById('modal-edit-nilai-robomind');
  const inputRoboMind = document.getElementById('modal-edit-robomind');
  const inputBintang = document.getElementById('modal-edit-bintang');
  const inputCatatan = document.getElementById('modal-detail-catatan');

  const nama = inputNama ? inputNama.value.trim() : '';
  const kelas = inputKelas ? inputKelas.value : '4A';
  let absen = inputAbsen ? inputAbsen.value.trim() : '01';
  if (absen.length === 1) absen = '0' + absen;
  let nis = inputNis ? inputNis.value.trim() : '';
  if (!nis) {
    const clsCode = kelas.startsWith('5') ? (kelas === '5A' ? '51' : '52') : kelas.startsWith('6') ? (kelas === '6A' ? '61' : '62') : (kelas === '4A' ? '41' : kelas === '4B' ? '42' : '43');
    nis = `${clsCode}${absen}`;
  }
  const kuis1 = inputKuis1 ? parseInt(inputKuis1.value) || 0 : 0;
  const kuis2 = inputKuis2 ? parseInt(inputKuis2.value) || 0 : 0;
  const nilaiPoster = inputNilaiPoster ? parseInt(inputNilaiPoster.value) || 0 : 0;
  const poster = inputPoster ? parseInt(inputPoster.value) || 0 : 0;
  const nilaiExcel = inputNilaiExcel ? parseInt(inputNilaiExcel.value) || 0 : 0;
  const excel = inputExcel ? parseInt(inputExcel.value) || 0 : 0;
  const nilaiScratch = inputNilaiScratch ? parseInt(inputNilaiScratch.value) || 0 : 0;
  const projekScratch = inputScratch ? parseInt(inputScratch.value) || 0 : 0;
  const nilaiRoboMind = inputNilaiRoboMind ? parseInt(inputNilaiRoboMind.value) || 0 : 0;
  const misiRobo = inputRoboMind ? parseInt(inputRoboMind.value) || 0 : 0;
  const bintang = inputBintang ? parseInt(inputBintang.value) || 0 : 0;
  const catatan = inputCatatan ? inputCatatan.value.trim() : '';

  if (!nama) {
    showToast('Nama siswa tidak boleh kosong!', 'error');
    return;
  }

  const db = getStudentDatabase();
  const student = db.find(s => s.id === state.selectedStudentId);
  if (student) {
    student.nama = nama;
    student.nis = nis;
    student.kelas = kelas;
    student.absen = absen;
    student.kuisSem1 = kuis1;
    student.kuisSem2 = kuis2;
    student.nilaiPoster = nilaiPoster;
    student.posterWord = poster;
    student.nilaiExcel = nilaiExcel;
    student.excelTabel = excel;
    student.nilaiScratch = nilaiScratch;
    student.projekScratch = projekScratch;
    student.nilaiRoboMind = nilaiRoboMind;
    student.misiRobo = misiRobo;
    student.poinBintang = bintang;
    student.catatanGuru = catatan;
    student.terakhirAktif = 'Diedit Guru';

    const avg = Math.round((kuis1 + kuis2 + nilaiPoster + nilaiExcel + nilaiScratch + nilaiRoboMind) / 6);
    student.statusKkm = avg >= 80 ? 'Tuntas' : 'Remedial';

    saveStudentDatabase(db);

    // Sinkronkan juga jika siswa ini sedang aktif/login
    const currentActive = getActiveStudentProfile();
    if (currentActive && (currentActive.id === student.id || currentActive.nama.toLowerCase() === nama.toLowerCase())) {
      localStorage.setItem(ACTIVE_STUDENT_KEY, JSON.stringify({
        id: student.id,
        nis: nis,
        nama: nama,
        kelas: kelas,
        absen: absen
      }));
      muatProfilSiswa();
    }

    playSound('success');
    showToast(`Data & nilai "${nama}" (NIS: ${nis}) berhasil diperbarui! 🎉`, 'success');
    tutupModalDetailSiswa();
    renderDasborGuru();
  }
}

// Alias backward compatibility
function simpanCatatanGuruModal() {
  simpanPerubahanDataSiswaModal();
}

function hapusSiswaTerpilih() {
  if (!state.selectedStudentId) return;
  hapusSiswaById(state.selectedStudentId);
  tutupModalDetailSiswa();
}

function hapusSiswaById(studentId) {
  playSound('click');
  const db = getStudentDatabase();
  const student = db.find(s => s.id === studentId);
  if (!student) return;

  if (confirm(`Yakin ingin menghapus data siswa "${student.nama}"?`)) {
    const updated = db.filter(s => s.id !== studentId);
    saveStudentDatabase(updated);
    playSound('success');
    showToast(`Data siswa "${student.nama}" berhasil dihapus 🗑️`, 'info');
    renderDasborGuru();
  }
}

// --------------------------------------------------------------------------
// MODAL TAMBAH SISWA MANUAL
// --------------------------------------------------------------------------
function bukaModalTambahSiswa() {
  playSound('click');
  const inputNama = document.getElementById('tambah-siswa-nama');
  const inputNis = document.getElementById('tambah-siswa-nis');
  const inputAbsen = document.getElementById('tambah-siswa-absen');
  if (inputNama) inputNama.value = '';
  if (inputNis) inputNis.value = '';
  if (inputAbsen) inputAbsen.value = '';

  const modal = document.getElementById('modal-tambah-siswa');
  if (modal) modal.classList.remove('hidden');
}

function tutupModalTambahSiswa() {
  playSound('click');
  const modal = document.getElementById('modal-tambah-siswa');
  if (modal) modal.classList.add('hidden');
}

function simpanSiswaBaruManual() {
  const inputNama = document.getElementById('tambah-siswa-nama');
  const inputNis = document.getElementById('tambah-siswa-nis');
  const inputKelas = document.getElementById('tambah-siswa-kelas');
  const inputAbsen = document.getElementById('tambah-siswa-absen');
  const inputKuis1 = document.getElementById('tambah-siswa-kuis1');
  const inputKuis2 = document.getElementById('tambah-siswa-kuis2');

  const nama = inputNama ? inputNama.value.trim() : '';
  const kelas = inputKelas ? inputKelas.value : '4A';
  let absen = inputAbsen ? inputAbsen.value.trim() : '01';
  if (absen.length === 1) absen = '0' + absen;
  let nis = inputNis ? inputNis.value.trim() : '';
  if (!nis) {
    const clsMap = { '4A': '41', '4B': '42', '4C': '43', '4D': '44', '4E': '45', '5D': '54', '6A': '61', '6B': '62', '6C': '63', '6D': '64', '6E': '65' };
    const clsCode = clsMap[kelas] || '41';
    nis = `${clsCode}${absen}`;
  }
  const kuis1 = inputKuis1 ? parseInt(inputKuis1.value) || 0 : 0;
  const kuis2 = inputKuis2 ? parseInt(inputKuis2.value) || 0 : 0;

  if (!nama) {
    showToast('Nama siswa wajib diisi!', 'error');
    return;
  }

  const id = `STD-${kelas}-${absen}-${Date.now().toString().slice(-4)}`;
  const avg = (kuis1 + kuis2) / 2;
  const statusKkm = avg >= 80 ? 'Tuntas' : 'Remedial';

  const newStudent = {
    id: id,
    nis: nis,
    nama: nama,
    kelas: kelas,
    absen: absen,
    kuisSem1: kuis1,
    kuisSem2: kuis2,
    tpSelesai: ['TP 1.1', 'TP 1.2'],
    posterWord: 1,
    excelTabel: 1,
    poinBintang: 150,
    statusKkm: statusKkm,
    terakhirAktif: 'Baru saja',
    catatanGuru: 'Siswa baru terdaftar di sistem pembelajaran.'
  };

  const db = getStudentDatabase();
  db.push(newStudent);
  saveStudentDatabase(db);

  playSound('success');
  tutupModalTambahSiswa();

  if (state.isGuruLoggedIn) {
    showToast(`Siswa "${nama}" (NIS: ${nis}) berhasil ditambahkan ke Kelas ${kelas}! 🎉`, 'success');
    renderDasborGuru();
  } else {
    // Siswa mendaftar mandiri: langsung aktifkan sesi login siswa!
    saveActiveStudentSession({
      id: newStudent.id,
      nis: newStudent.nis,
      nama: newStudent.nama,
      kelas: newStudent.kelas,
      absen: newStudent.absen
    }, 'modul');
    state.userPoints = newStudent.poinBintang;
    const p1 = document.getElementById('user-points');
    const p2 = document.getElementById('user-points-sem1');
    if (p1) p1.innerText = state.userPoints;
    if (p2) p2.innerText = state.userPoints;
    muatProfilSiswa();
    setHeaderNavMode('sem1');
    bukaModalProfilSiswa();
    showToast(`Pendaftaran Berhasil! Selamat datang, ${nama} (Kelas ${kelas} • NIS: ${nis}) 🚀`, 'success');
  }
}

// --------------------------------------------------------------------------
// EKSPOR REKAP NILAI KE MICROSOFT EXCEL (.CSV)
// --------------------------------------------------------------------------
function eksporNilaiCSV() {
  playSound('click');
  const db = getStudentDatabase();
  if (db.length === 0) {
    showToast('Database siswa masih kosong!', 'error');
    return;
  }

  // Header CSV
  const headers = [
    'No',
    'NIS',
    'No. Absen',
    'Nama Lengkap Siswa',
    'Kelas',
    'Nilai Kuis Sem 1',
    'Penilaian 1 Sem 1: Poster Word (0-100)',
    'Jumlah Poster Word',
    'Penilaian 2 Sem 1: Tabel Excel (0-100)',
    'Jumlah Latihan Excel',
    'Nilai Akhir Sem 1',
    'Status KKM Sem 1',
    'Nilai Kuis Sem 2',
    'Penilaian 1 Sem 2: Scratch Coding (0-100)',
    'Jumlah Projek Scratch',
    'Penilaian 2 Sem 2: RoboMind 7.0 & AI (0-100)',
    'Jumlah Misi RoboMind',
    'Nilai Akhir Sem 2',
    'Status KKM Sem 2',
    'Rata-Rata Gabungan (Rapor)',
    'Total Poin Bintang',
    'Status KKM Akhir',
    'Catatan Guru & Evaluasi Budi Pekerti',
    'Waktu Aktivitas Terakhir'
  ];

  const escapeCSV = (str) => {
    if (str === null || str === undefined) return '""';
    const clean = String(str).replace(/"/g, '""');
    return `"${clean}"`;
  };

  const rows = db.map((s, idx) => {
    // Sem 1
    const p1_s1 = s.nilaiPoster !== undefined ? s.nilaiPoster : (s.posterWord > 0 ? 90 : 85);
    const p2_s1 = s.nilaiExcel !== undefined ? s.nilaiExcel : (s.excelTabel > 0 ? 88 : 85);
    const nilaiSem1 = Math.round(((s.kuisSem1 || 0) * 0.3) + (p1_s1 * 0.35) + (p2_s1 * 0.35));
    const kkmSem1 = nilaiSem1 >= 80 ? 'TUNTAS' : 'REMEDIAL';

    // Sem 2
    const p1_s2 = s.nilaiScratch !== undefined ? s.nilaiScratch : 90;
    const p2_s2 = s.nilaiRoboMind !== undefined ? s.nilaiRoboMind : 88;
    const nilaiSem2 = Math.round(((s.kuisSem2 || 0) * 0.3) + (p1_s2 * 0.35) + (p2_s2 * 0.35));
    const kkmSem2 = nilaiSem2 >= 80 ? 'TUNTAS' : 'REMEDIAL';

    // Gabungan
    const nilaiGabungan = Math.round((nilaiSem1 + nilaiSem2) / 2);
    const kkmGabungan = nilaiGabungan >= 80 ? 'TUNTAS' : 'REMEDIAL';

    return [
      idx + 1,
      escapeCSV(s.nis || '-'),
      escapeCSV(s.absen || '-'),
      escapeCSV(s.nama),
      escapeCSV(s.kelas),
      s.kuisSem1 || 0,
      p1_s1,
      s.posterWord || 0,
      p2_s1,
      s.excelTabel || 0,
      nilaiSem1,
      escapeCSV(kkmSem1),
      s.kuisSem2 || 0,
      p1_s2,
      s.projekScratch || 2,
      p2_s2,
      s.misiRobo || 3,
      nilaiSem2,
      escapeCSV(kkmSem2),
      nilaiGabungan,
      s.poinBintang || 0,
      escapeCSV(kkmGabungan),
      escapeCSV(s.catatanGuru || '-'),
      escapeCSV(s.terakhirAktif || '-')
    ].join(',');
  });

  // Gabungkan BOM UTF-8 (\uFEFF) agar Microsoft Excel membuka teks Indonesia dengan sempurna
  const csvContent = '\uFEFF' + headers.join(',') + '\r\n' + rows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const filename = `Rekap_Nilai_Kelas4_SDSCintaKasihTzuChi_${new Date().toISOString().slice(0, 10)}.csv`;

  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast(`Rekap nilai "${filename}" berhasil diunduh! 📊`, 'success');
}

// --------------------------------------------------------------------------
// GALERI KARYA SISWA DI DASBOR GURU
// --------------------------------------------------------------------------
function renderGaleriGuru() {
  const grid = document.getElementById('guru-galeri-grid');
  if (!grid) return;
  grid.innerHTML = '';

  // Ambil poster yang tersimpan dari lemari galeri siswa
  let posters = [];
  try {
    const raw = localStorage.getItem('kreator_cilik_word_posters');
    if (raw) posters = JSON.parse(raw);
  } catch (e) {}

  // Buat item sampel jika poster masih sedikit
  if (posters.length === 0) {
    posters = [
      {
        id: 'sample_1',
        title: 'Poster Hemat Energi Listrik Tzu Chi',
        date: '08 Okt 2026',
        author: 'Aditya Pratama (4A)',
        image: 'materi_word_tp2_1_poster.jpg',
        bintang: 5
      },
      {
        id: 'sample_2',
        title: 'Tabel Inventaris Alat Komputer',
        date: '07 Okt 2026',
        author: 'Felicia Aurelia (4B)',
        image: 'materi_excel_tp1_2_tabel.png',
        bintang: 5
      },
      {
        id: 'sample_3',
        title: 'Diagram Penjualan Koperasi Sekolah',
        date: '06 Okt 2026',
        author: 'Michelle Natalie (4C)',
        image: 'materi_excel_tp1_4_diagram.png',
        bintang: 5
      }
    ];
  }

  posters.forEach(p => {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col';
    card.innerHTML = `
      <div class="h-44 bg-slate-900 relative overflow-hidden flex items-center justify-center cursor-pointer" onclick="bukaModalGambarMateriDariSrc('${p.image || 'materi_word_tp2_1_poster.jpg'}', '${p.title}')">
        <img src="${p.image || 'materi_word_tp2_1_poster.jpg'}" alt="${p.title}" class="max-h-full w-auto object-contain hover:scale-105 transition duration-300">
        <div class="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-black/60 text-amber-300 text-[10px] font-bold backdrop-blur-xs flex items-center gap-1">
          <i class="fa-solid fa-star"></i> Bintang 5
        </div>
      </div>
      <div class="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <h4 class="font-title font-bold text-slate-800 text-xs sm:text-sm line-clamp-1">${p.title}</h4>
          <div class="text-[11px] text-slate-500 mt-0.5 flex items-center justify-between">
            <span><i class="fa-solid fa-user-pen text-indigo-500 mr-1"></i> ${p.author || 'Siswa Kelas 4'}</span>
            <span>${p.date || '08 Okt 2026'}</span>
          </div>
        </div>
        <div class="pt-2 border-t border-slate-100 flex items-center justify-between">
          <button onclick="bukaModalGambarMateriDariSrc('${p.image || 'materi_word_tp2_1_poster.jpg'}', '${p.title}')" class="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition flex items-center gap-1">
            <i class="fa-solid fa-expand text-xs"></i> Pratinjau
          </button>
          <button onclick="beriNilaiKaryaGuru('${p.title}', '${p.author || 'Siswa'}')" class="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs transition flex items-center gap-1">
            <i class="fa-solid fa-award text-xs"></i> Beri Nilai (0-100)
          </button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

function beriNilaiKaryaGuru(title, author) {
  playSound('click');
  const skorInput = prompt(`Beri Nilai Angka (0-100) untuk karya "${title}" (${author}):`, "95");
  if (skorInput === null) return;
  const numScore = parseInt(skorInput);
  if (isNaN(numScore) || numScore < 0 || numScore > 100) {
    showToast('Nilai harus berupa angka antara 0 sampai 100!', 'error');
    return;
  }

  const db = getStudentDatabase();
  const student = db.find(s => (author || '').toLowerCase().includes(s.nama.toLowerCase()));
  if (student) {
    student.nilaiPoster = numScore;
    saveStudentDatabase(db);
    renderDasborGuru();
  }

  playSound('success');
  showToast(`Nilai ${numScore} berhasil disimpan untuk "${title}"! 🏆`, 'success');
}

function beriBintangKaryaGuru(title) {
  playSound('success');
  showToast(`Apresiasi Bintang 5 Guru diberikan untuk "${title}"! ⭐⭐⭐⭐⭐`, 'success');
}

// --------------------------------------------------------------------------
// CLOUD GOOGLE SPREADSHEET (TAB "DATA SISWA LMS") & WEBHOOK
// --------------------------------------------------------------------------

function extractGoogleSpreadsheetId(input) {
  if (!input) return '';
  const trimmed = input.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  if (/^[a-zA-Z0-9-_]{20,}$/.test(trimmed)) {
    return trimmed;
  }
  return trimmed;
}

function getClassSheetsConfig() {
  try {
    const raw = localStorage.getItem(CLASS_SHEETS_KEY);
    const cfg = raw ? JSON.parse(raw) : {};
    const merged = {};
    Object.keys(DEFAULT_CLASS_SHEETS_CONFIG).forEach(k => {
      merged[k] = { ...DEFAULT_CLASS_SHEETS_CONFIG[k], ...(cfg[k] || {}) };
    });
    // Migrasi jika pengguna sebelumnya menyimpan di SPREADSHEET_ID_KEY single
    const oldSheet = localStorage.getItem(SPREADSHEET_ID_KEY);
    if (oldSheet && !merged['4A'].sheetUrl) {
      Object.keys(merged).forEach(k => {
        if (!merged[k].sheetUrl) merged[k].sheetUrl = oldSheet;
      });
    }
    return merged;
  } catch (e) {
    return { ...DEFAULT_CLASS_SHEETS_CONFIG };
  }
}

function saveClassSheetsConfig(cfg) {
  try {
    localStorage.setItem(CLASS_SHEETS_KEY, JSON.stringify(cfg));
  } catch (e) {
    console.error('Error menyimpan konfigurasi sheet kelas:', e);
  }
}

function getActiveSheetClassKey() {
  return localStorage.getItem(CLASS_SHEET_ACTIVE_TAB_KEY) || '4A';
}

function setActiveSheetClassKey(key) {
  localStorage.setItem(CLASS_SHEET_ACTIVE_TAB_KEY, key);
}

function pilihKelasSheetConfigTab(key) {
  playSound('click');
  setActiveSheetClassKey(key);
  renderTabsKelasSheet();
}
window.pilihKelasSheetConfigTab = pilihKelasSheetConfigTab;

function renderTabsKelasSheet() {
  const container = document.getElementById('sheet-class-tabs-container');
  if (!container) return;

  const cfg = getClassSheetsConfig();
  const activeKey = getActiveSheetClassKey();
  const classes = ['4A', '4B', '4C', '4D', '4E', '5D', '6A', '6B', '6C', '6D', '6E'];

  container.innerHTML = classes.map(cls => {
    const isActive = cls === activeKey;
    const hasUrl = Boolean(cfg[cls] && cfg[cls].sheetUrl);
    const activeCls = isActive 
      ? 'bg-emerald-600 text-white font-bold shadow-xs' 
      : 'bg-white hover:bg-slate-200 text-slate-700 font-semibold';
    const dotColor = hasUrl ? 'bg-emerald-400' : 'bg-slate-300';
    return `
      <button type="button" onclick="pilihKelasSheetConfigTab('${cls}')" 
        class="px-3 py-1.5 rounded-xl text-xs font-title transition flex items-center gap-1.5 cursor-pointer ${activeCls}">
        <span class="w-2 h-2 rounded-full ${dotColor}"></span>
        <span>Kelas ${cls}</span>
      </button>
    `;
  }).join('');

  const activeConf = cfg[activeKey] || DEFAULT_CLASS_SHEETS_CONFIG[activeKey] || { sheetUrl: '', tabName: activeKey };
  const lblActive = document.getElementById('label-active-class-config');
  const lblTargetClass = document.getElementById('form-target-class-label');
  const lblTargetTab = document.getElementById('form-target-tab-label');
  const inputUrl = document.getElementById('guru-sheet-url-id-kelas');
  const inputTab = document.getElementById('guru-sheet-tab-name-kelas');
  const statusEl = document.getElementById('guru-sheet-sync-status-kelas');

  if (lblActive) lblActive.innerText = `Mengatur: Kelas ${activeKey}`;
  if (lblTargetClass) lblTargetClass.innerText = `Kelas ${activeKey}`;
  if (lblTargetTab) lblTargetTab.innerText = `Kelas ${activeKey}`;
  if (inputUrl) inputUrl.value = activeConf.sheetUrl || '';
  if (inputTab) inputTab.value = activeConf.tabName || activeKey;

  if (statusEl) {
    const db = getStudentDatabase();
    const countInDb = db.filter(s => s.kelas === activeKey).length;
    if (activeConf.sheetUrl) {
      statusEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Terhubung: ${countInDb} Siswa (Tab: ${activeConf.tabName || activeKey})`;
      statusEl.className = 'px-3 py-2 rounded-xl text-xs bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 truncate flex items-center gap-1.5';
    } else {
      statusEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-amber-400"></span> Belum Ada Link Khusus (${countInDb} Siswa Lokal)`;
      statusEl.className = 'px-3 py-2 rounded-xl text-xs bg-slate-100 text-slate-600 font-semibold border border-slate-200 truncate flex items-center gap-1.5';
    }
  }
}
window.renderTabsKelasSheet = renderTabsKelasSheet;

function renderRingkasanKoneksiKelas() {
  const container = document.getElementById('tabel-ringkasan-koneksi-kelas');
  if (!container) return;

  const cfg = getClassSheetsConfig();
  const db = getStudentDatabase();
  const classes = ['4A', '4B', '4C', '4D', '4E', '5D', '6A', '6B', '6C', '6D', '6E'];

  container.innerHTML = classes.map(cls => {
    const c = cfg[cls] || DEFAULT_CLASS_SHEETS_CONFIG[cls] || { sheetUrl: '', tabName: cls };
    const countInDb = db.filter(s => s.kelas === cls).length;
    const hasUrl = Boolean(c.sheetUrl);
    const badge = hasUrl
      ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Terhubung</span>`
      : `<span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">Belum Ada Link</span>`;

    return `
      <div class="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2 flex flex-col justify-between">
        <div class="flex items-center justify-between">
          <div class="font-title font-bold text-slate-800 text-xs">Kelas ${cls}</div>
          ${badge}
        </div>
        <div class="text-[11px] text-slate-500 space-y-0.5">
          <div>Tab Sheet: <strong class="text-slate-700 font-mono">${c.tabName || cls}</strong></div>
          <div>Database: <strong class="text-indigo-600">${countInDb} Siswa</strong> ${c.lastSynced ? `• <span class="text-[10px] text-slate-400">${c.lastSynced}</span>` : ''}</div>
        </div>
        <div class="pt-1.5 border-t border-slate-100 flex items-center justify-between">
          <button type="button" onclick="pilihKelasSheetConfigTab('${cls}')" class="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer">
            Atur Link
          </button>
          <button type="button" onclick="sinkronkanDataSiswaPerKelas('${cls}')" class="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] transition flex items-center gap-1 cursor-pointer">
            <i class="fa-solid fa-arrows-rotate text-[10px]"></i> Sinkron
          </button>
        </div>
      </div>
    `;
  }).join('');
}
window.renderRingkasanKoneksiKelas = renderRingkasanKoneksiKelas;

function simpanPengaturanSheetKelasAktif() {
  const activeKey = getActiveSheetClassKey();
  const inputUrl = document.getElementById('guru-sheet-url-id-kelas');
  const inputTab = document.getElementById('guru-sheet-tab-name-kelas');

  const rawUrl = inputUrl ? inputUrl.value.trim() : '';
  const tabName = inputTab ? inputTab.value.trim() : activeKey;

  const cfg = getClassSheetsConfig();
  if (!cfg[activeKey]) cfg[activeKey] = { ...DEFAULT_CLASS_SHEETS_CONFIG[activeKey] };
  cfg[activeKey].sheetUrl = rawUrl;
  cfg[activeKey].tabName = tabName || activeKey;
  saveClassSheetsConfig(cfg);

  playSound('success');
  renderTabsKelasSheet();
  renderRingkasanKoneksiKelas();
  showToast(`Pengaturan Google Sheet untuk Kelas ${activeKey} berhasil disimpan! ☁️`, 'success');
}
window.simpanPengaturanSheetKelasAktif = simpanPengaturanSheetKelasAktif;

function updateStatusKoneksiGoogleSheet() {
  renderTabsKelasSheet();
  renderRingkasanKoneksiKelas();
}

// Helper JSONP untuk Google Sheets (100% bebas hambatan CORS peramban)
function queryGoogleSheetJsonp(sheetId, tabName, timeoutMs = 9000) {
  return new Promise((resolve, reject) => {
    const callbackName = 'gviz_jsonp_cb_' + Date.now() + '_' + Math.floor(Math.random() * 100000);
    let timer = null;

    const cleanup = () => {
      if (timer) clearTimeout(timer);
      try { delete window[callbackName]; } catch (e) { window[callbackName] = undefined; }
      const el = document.getElementById(callbackName);
      if (el && el.parentNode) el.parentNode.removeChild(el);
    };

    window[callbackName] = function(data) {
      cleanup();
      resolve(data);
    };

    const script = document.createElement('script');
    script.id = callbackName;
    const tabParam = tabName ? `&sheet=${encodeURIComponent(tabName)}` : '';
    script.src = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=responseHandler:${callbackName}${tabParam}&headers=1`;
    
    script.onerror = function() {
      cleanup();
      reject(new Error('Akses Google Sheet ditolak. Pastikan izin akses disetel ke "Siapa saja yang memiliki link dapat melihat".'));
    };

    timer = setTimeout(() => {
      cleanup();
      reject(new Error('Waktu tunggu koneksi ke Google Sheet habis (Timeout).'));
    }, timeoutMs);

    document.head.appendChild(script);
  });
}

// Helper: Parsing tabel JSON Google Sheets menjadi objek siswa (Mendukung Format Buku Nilai Sekolah)
function parseGoogleSheetTable(parsed, defaultKelas = '4A') {
  if (!parsed || !parsed.table || !Array.isArray(parsed.table.rows)) return [];
  const cols = parsed.table.cols || [];
  const rows = parsed.table.rows || [];
  let colMap = { nis: -1, nama: -1, kelas: -1, absen: -1, jk: -1, tempatLahir: -1, tanggalLahir: -1 };

  const checkHeaderField = (txt, idx) => {
    const t = (txt || '').toLowerCase().trim();
    if (!t) return;
    
    // 1. Jenis Kelamin (Cek lebih dulu agar kata 'jeNIS' tidak memicu deteksi NIS!)
    if (t.includes('kelamin') || t.includes('gender') || t === 'jk' || t === 'l/p' || t.includes('jenis')) {
      if (colMap.jk === -1) colMap.jk = idx;
    } 
    // 2. NIS (HANYA jika bukan jenis kelamin, dan mengandung kata 'nis' atau 'induk')
    else if (!t.includes('jenis') && (t === 'nis' || t.startsWith('nis') || t.endsWith('nis') || t.includes('no. induk') || t.includes('nomor induk') || t.includes('induk'))) {
      if (colMap.nis === -1) colMap.nis = idx;
    } 
    // 3. Nama Siswa
    else if (t.includes('nama')) {
      if (colMap.nama === -1) colMap.nama = idx;
    } 
    // 4. Nomor Urut / Absen
    else if (t.includes('urut') || t.includes('absen') || t === 'no' || t === 'no.' || t.startsWith('no.') || t.startsWith('no ')) {
      if (colMap.absen === -1) colMap.absen = idx;
    } 
    // 5. Kelas
    else if (t.includes('kelas') || t.includes('rombel')) {
      if (colMap.kelas === -1) colMap.kelas = idx;
    } 
    // 6. Tempat Lahir
    else if (t.includes('tempat')) {
      if (colMap.tempatLahir === -1) colMap.tempatLahir = idx;
    } 
    // 7. Tanggal Lahir
    else if (t.includes('tanggal') || t.includes('tgl') || (t.includes('lahir') && !t.includes('tempat'))) {
      if (colMap.tanggalLahir === -1) colMap.tanggalLahir = idx;
    }
  };

  // 1. Cek metadata kolom jika tersedia
  cols.forEach((col, idx) => {
    const label = ((col.label || '') + ' ' + (col.id || '')).trim();
    checkHeaderField(label, idx);
  });

  // 2. Cek baris pertama untuk deteksi judul kolom
  let startIndex = 0;
  if (rows.length > 0) {
    const firstRow = rows[0].c || [];
    firstRow.forEach((cell, idx) => {
      if (!cell) return;
      const txt = ((cell.f || cell.v || '') + '').trim();
      checkHeaderField(txt, idx);
    });

    const firstRowHasHeader = firstRow.some(cell => {
      if (!cell) return false;
      const str = ((cell.f || cell.v || '') + '').toLowerCase();
      return str.includes('nis') || str.includes('nama') || str.includes('urut') || str.includes('kelamin') || str.includes('lahir');
    });

    if (firstRowHasHeader) {
      startIndex = 1;
    }
  }

  // 3. Fallback cerdas untuk format Buku Nilai (A: Urut, B: NIS, C: Nama Siswa)
  if (colMap.nis === -1 && colMap.nama === -1) {
    colMap.absen = 0; // Kolom A: Urut
    colMap.nis = 1;   // Kolom B: NIS
    colMap.nama = 2;  // Kolom C: Nama Siswa
  } else {
    if (colMap.absen === -1) colMap.absen = 0;
    if (colMap.nis === -1) colMap.nis = (colMap.absen === 0 ? 1 : 0);
    if (colMap.nama === -1) colMap.nama = (colMap.nis === 1 ? 2 : 1);
  }

  const result = [];
  for (let i = startIndex; i < rows.length; i++) {
    const r = rows[i];
    if (!r || !r.c) continue;
    const getVal = (idx) => {
      if (idx < 0 || !r.c[idx]) return '';
      const cell = r.c[idx];
      if (cell.f !== undefined && cell.f !== null) return (cell.f + '').trim();
      if (cell.v !== undefined && cell.v !== null) return (cell.v + '').trim();
      return '';
    };

    const nis = getVal(colMap.nis);
    // Lewati baris kosong atau header yang terulang (NIS harus berupa angka)
    if (!nis || nis.toLowerCase() === 'nis' || !/^\d+/.test(nis)) continue;

    const nama = getVal(colMap.nama) || `Siswa ${nis}`;
    let rawKelas = colMap.kelas !== -1 ? getVal(colMap.kelas) : '';
    let kelas = normalisasiNamaKelas(rawKelas, defaultKelas || '4A');
    if (defaultKelas && (!rawKelas || rawKelas.length > 8)) {
      kelas = defaultKelas.toUpperCase();
    }

    let rawAbsen = colMap.absen !== -1 ? getVal(colMap.absen) : (i + 1 - startIndex).toString();
    let absen = rawAbsen.replace(/[^0-9]/g, '');
    if (!absen) absen = (i + 1 - startIndex).toString();
    if (absen.length === 1) absen = `0${absen}`;

    const jk = colMap.jk !== -1 ? getVal(colMap.jk) : '';
    const tempatLahir = colMap.tempatLahir !== -1 ? getVal(colMap.tempatLahir) : '';
    const tanggalLahir = colMap.tanggalLahir !== -1 ? getVal(colMap.tanggalLahir) : '';

    result.push({
      id: `STD-${kelas.toUpperCase()}-${nis}`,
      nis: nis,
      nama: nama,
      kelas: kelas.toUpperCase(),
      absen: absen,
      jenisKelamin: jk,
      tempatLahir: tempatLahir,
      tanggalLahir: tanggalLahir,
      kuisSem1: 0,
      kuisSem2: 0,
      posterWord: 0,
      excelTabel: 0,
      poinBintang: 0,
      statusKkm: 'Tuntas',
      catatanGuru: 'Data resmi tersinkron dari Buku Nilai Google Sheet'
    });
  }
  return result;
}

// --------------------------------------------------------------------------
// SINKRONISASI DATA SISWA GOOGLE SHEETS MULTI-KELAS (PENYIMPANAN BERBEDA PER KELAS)
// --------------------------------------------------------------------------

// 1. Sinkronisasi Data Siswa Per Kelas Spesifik
async function sinkronkanDataSiswaPerKelas(kelasKey, silent = false) {
  const cfg = getClassSheetsConfig();
  const c = cfg[kelasKey] || DEFAULT_CLASS_SHEETS_CONFIG[kelasKey] || { sheetUrl: '', tabName: kelasKey };

  let rawSheet = (c.sheetUrl || '').trim();
  // 1. Fallback ke master SPREADSHEET_ID_KEY jika link khusus kelas belum diisi
  if (!rawSheet) {
    rawSheet = (localStorage.getItem(SPREADSHEET_ID_KEY) || '').trim();
  }
  // 2. Fallback: Cari link dari rombel lain di tingkat yang sama (misal 4A jika sedang sync 4B)
  if (!rawSheet) {
    const tingkat = kelasKey.charAt(0);
    const siblings = Object.keys(cfg).filter(k => k.startsWith(tingkat) && cfg[k].sheetUrl);
    if (siblings.length > 0) {
      rawSheet = (cfg[siblings[0]].sheetUrl || '').trim();
      if (rawSheet) {
        c.sheetUrl = rawSheet;
        cfg[kelasKey].sheetUrl = rawSheet;
        saveClassSheetsConfig(cfg);
      }
    }
  }
  // 3. Fallback: Cari link dari kelas mana pun yang sudah pernah diisi
  if (!rawSheet) {
    const anyClass = Object.keys(cfg).find(k => cfg[k].sheetUrl);
    if (anyClass) {
      rawSheet = (cfg[anyClass].sheetUrl || '').trim();
    }
  }

  if (!rawSheet) {
    if (!silent) {
      playSound('error');
      showToast(`Masukkan Link Google Spreadsheet untuk Kelas ${kelasKey} terlebih dahulu! ☁️`, 'warning');
      setActiveSheetClassKey(kelasKey);
      renderTabsKelasSheet();
      pilihSubTabGuru('cloud');
      const input = document.getElementById('guru-sheet-url-id-kelas');
      if (input) input.focus();
    }
    return [];
  }

  const sheetId = extractGoogleSpreadsheetId(rawSheet);
  const primaryTab = (c.tabName || kelasKey).trim();
  let fetchedStudents = [];

  // Daftar variasi nama tab yang sering dibuat guru di Google Sheets
  const candidateTabs = [
    primaryTab,
    kelasKey,
    `Kelas ${kelasKey}`,
    `KELAS ${kelasKey}`,
    `Kelas ${kelasKey.charAt(0)} ${kelasKey.charAt(1)}`,
    `${kelasKey.charAt(0)} ${kelasKey.charAt(1)}`,
    `${kelasKey.charAt(0)}-${kelasKey.charAt(1)}`,
    `Kelas ${kelasKey.charAt(0)}-${kelasKey.charAt(1)}`,
    kelasKey.toLowerCase(),
    `DATA SISWA ${kelasKey}`,
    `DATA SISWA KELAS ${kelasKey}`,
    'DATA SISWA LMS',
    'Sheet2',
    'Sheet 2',
    'Lembar 2',
    '' // Tab pertama/aktif spreadsheet
  ];

  const uniqueTabs = [...new Set(candidateTabs.map(t => (t || '').trim()))];
  let resolvedTab = primaryTab;

  // Coba query setiap variasi nama tab hingga berhasil menemukan siswa
  for (const tName of uniqueTabs) {
    try {
      const parsedData = await queryGoogleSheetJsonp(sheetId, tName, 5000);
      const parsed = parseGoogleSheetTable(parsedData, kelasKey);
      if (parsed && parsed.length > 0) {
        fetchedStudents = parsed;
        resolvedTab = tName;
        // Jika nama tab yang berhasil berbeda dengan konfigurasi awal, simpan nama tab yang valid
        if (tName && tName !== c.tabName) {
          c.tabName = tName;
          cfg[kelasKey].tabName = tName;
          saveClassSheetsConfig(cfg);
        }
        break;
      }
    } catch (eTry) {
      // Lanjut coba kandidat nama tab berikutnya
    }
  }

  if (fetchedStudents.length === 0) {
    console.warn(`Tidak dapat menemukan data pada tab Google Sheets untuk Kelas ${kelasKey}.`);
    if (!silent) {
      playSound('error');
      alert(`⚠️ Data untuk Kelas ${kelasKey} belum berhasil ditarik dari Google Spreadsheet!\n\nPastikan hal berikut:\n1. Hak Akses: Klik tombol 'Bagikan (Share)' di Google Sheets, pastikan Akses Umum adalah 'Siapa saja yang memiliki link dapat melihat' (Anyone with the link can view).\n2. Nama Tab: Pastikan ada tab sheet bernama '${primaryTab}' atau 'Kelas ${kelasKey}' di file Google Sheet Anda.\n3. Kolom: Pastikan ada Kolom Urut, NIS, dan Nama Siswa.`);
    }
    return [];
  }

  if (fetchedStudents.length > 0) {
    const existingDb = getStudentDatabase();

    // Simpan siswa dari kelas lain, perbarui siswa kelas ini
    const mergedDb = existingDb.filter(s => s.kelas !== kelasKey);

    fetchedStudents.forEach(newS => {
      const match = existingDb.find(ex => ex.kelas === kelasKey && ((ex.nis && ex.nis.toString().toLowerCase() === newS.nis.toLowerCase()) || (ex.nama && ex.nama.toLowerCase() === newS.nama.toLowerCase())));
      if (match) {
        mergedDb.push({
          ...newS,
          kuisSem1: match.kuisSem1 || 0,
          kuisSem2: match.kuisSem2 || 0,
          posterWord: match.posterWord || 0,
          nilaiPoster: match.nilaiPoster !== undefined ? match.nilaiPoster : 0,
          excelTabel: match.excelTabel || 0,
          nilaiExcel: match.nilaiExcel !== undefined ? match.nilaiExcel : 0,
          nilaiScratch: match.nilaiScratch !== undefined ? match.nilaiScratch : 0,
          nilaiRoboMind: match.nilaiRoboMind !== undefined ? match.nilaiRoboMind : 0,
          poinBintang: match.poinBintang || 0,
          statusKkm: match.statusKkm || 'Tuntas',
          catatanGuru: match.catatanGuru || newS.catatanGuru
        });
      } else {
        mergedDb.push(newS);
      }
    });

    saveStudentDatabase(mergedDb);

    // Perbarui riwayat kelas di cfg
    if (!cfg[kelasKey]) cfg[kelasKey] = { ...DEFAULT_CLASS_SHEETS_CONFIG[kelasKey] };
    cfg[kelasKey].count = fetchedStudents.length;
    cfg[kelasKey].lastSynced = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
    saveClassSheetsConfig(cfg);

    renderTabsKelasSheet();
    renderRingkasanKoneksiKelas();
    if (typeof filterDanCariSiswa === 'function') filterDanCariSiswa();
    if (typeof renderDasborGuru === 'function') renderDasborGuru();

    if (!silent) {
      playSound('success');
      showToast(`Berhasil menyinkronkan ${fetchedStudents.length} siswa Kelas ${kelasKey} dari Google Sheet "${resolvedTab || primaryTab || kelasKey}"! 🎉`, 'success');
    }
    return fetchedStudents;
  } else {
    if (!silent) {
      playSound('error');
      showToast(`Tidak ditemukan data siswa valid di tab "${resolvedTab || primaryTab || kelasKey}" Kelas ${kelasKey}!`, 'warning');
    }
    return [];
  }
}
window.sinkronkanDataSiswaPerKelas = sinkronkanDataSiswaPerKelas;

// 2. Sinkronkan Rombel per Tingkat (Contoh: Tingkat 4 -> 4A-4E, Tingkat 5 -> 5D, Tingkat 6 -> 6A-6E)
async function sinkronkanRombelTingkat(tingkat, silent = false) {
  const rombels = (tingkat === '4') ? ['4A', '4B', '4C', '4D', '4E'] : (tingkat === '5') ? ['5D'] : ['6A', '6B', '6C', '6D', '6E'];
  let total = 0;
  for (const r of rombels) {
    const res = await sinkronkanDataSiswaPerKelas(r, true);
    if (res && res.length > 0) total += res.length;
  }
  renderTabsKelasSheet();
  renderRingkasanKoneksiKelas();
  if (typeof renderDasborGuru === 'function') renderDasborGuru();

  if (!silent) {
    if (total > 0) {
      playSound('success');
      showToast(`Berhasil menyinkronkan total ${total} siswa Tingkat ${tingkat} (${rombels.join(', ')})! 🎉`, 'success');
    } else {
      playSound('warning');
      showToast(`Pastikan link Google Sheets untuk Kelas ${tingkat} sudah diatur.`, 'warning');
    }
  }
}
window.sinkronkanRombelTingkat = sinkronkanRombelTingkat;

// 3. Sinkronkan Semua Kelas Sekaligus dari Google Sheets Masing-Masing
async function sinkronkanSemuaKelasGoogleSheet(silent = false) {
  const cfg = getClassSheetsConfig();
  const classes = ['4A', '4B', '4C', '4D', '4E', '5D', '6A', '6B', '6C', '6D', '6E'];
  let totalSynced = 0;
  let syncedClasses = [];

  if (!silent) {
    showToast('Memulai sinkronisasi data seluruh kelas dari Google Sheets... ⏳', 'info');
  }

  for (const cls of classes) {
    const hasUrl = Boolean(cfg[cls] && cfg[cls].sheetUrl) || Boolean(localStorage.getItem(SPREADSHEET_ID_KEY));
    if (hasUrl) {
      try {
        const res = await sinkronkanDataSiswaPerKelas(cls, true);
        if (res && res.length > 0) {
          totalSynced += res.length;
          syncedClasses.push(`${cls} (${res.length})`);
        }
      } catch (e) {
        console.warn(`Sinkronisasi ${cls} gagal:`, e);
      }
    }
  }

  renderTabsKelasSheet();
  renderRingkasanKoneksiKelas();
  if (typeof renderDasborGuru === 'function') renderDasborGuru();

  if (syncedClasses.length > 0) {
    if (!silent) {
      playSound('success');
      showToast(`Selesai! Berhasil sinkronisasi ${totalSynced} siswa dari kelas: ${syncedClasses.join(', ')} 🎉`, 'success');
    }
  } else {
    if (!silent) {
      playSound('error');
      showToast('Belum ada Link Google Sheets yang terhubung untuk kelas manapun!', 'warning');
    }
  }
}
window.sinkronkanSemuaKelasGoogleSheet = sinkronkanSemuaKelasGoogleSheet;

// 4. Tombol Cepat di Header Dasbor Guru: Sinkronkan Sesuai Kelas yang Sedang Ditampilkan
async function sinkronkanDataSiswaGoogleSheetAktif() {
  playSound('click');
  const t = state.tingkatKelasGuru || 'all';
  const f = state.filterKelasGuru || 'semua';

  if (['4A', '4B', '4C', '4D', '4E', '5D', '6A', '6B', '6C', '6D', '6E'].includes(f)) {
    return await sinkronkanDataSiswaPerKelas(f);
  }

  if (t === '4') {
    return await sinkronkanRombelTingkat('4');
  } else if (t === '5') {
    return await sinkronkanRombelTingkat('5');
  } else if (t === '6') {
    return await sinkronkanRombelTingkat('6');
  } else {
    return await sinkronkanSemuaKelasGoogleSheet();
  }
}
window.sinkronkanDataSiswaGoogleSheetAktif = sinkronkanDataSiswaGoogleSheetAktif;

// 5. Tombol Form Detail di Tab Cloud
async function sinkronkanDataSiswaKelasAktifForm() {
  const activeKey = getActiveSheetClassKey();
  const inputUrl = document.getElementById('guru-sheet-url-id-kelas');
  const inputTab = document.getElementById('guru-sheet-tab-name-kelas');

  if (inputUrl && inputTab) {
    const cfg = getClassSheetsConfig();
    if (!cfg[activeKey]) cfg[activeKey] = { ...DEFAULT_CLASS_SHEETS_CONFIG[activeKey] };
    cfg[activeKey].sheetUrl = inputUrl.value.trim();
    cfg[activeKey].tabName = inputTab.value.trim() || activeKey;
    saveClassSheetsConfig(cfg);
  }

  await sinkronkanDataSiswaPerKelas(activeKey);
}
window.sinkronkanDataSiswaKelasAktifForm = sinkronkanDataSiswaKelasAktifForm;

// Fungsi lama untuk kompatibilitas
async function sinkronkanDataSiswaGoogleSheet(silent = false) {
  return await sinkronkanSemuaKelasGoogleSheet(silent);
}
window.sinkronkanDataSiswaGoogleSheet = sinkronkanDataSiswaGoogleSheet;

// 6. Cek NIS Siswa terhadap Database Lokal & Google Sheets Multi-Kelas
async function cekNisGoogleSheet(nisVal) {
  if (!nisVal) return null;
  const targetVal = nisVal.toString().trim().toLowerCase();

  // 1. Cek di cache database lokal terlebih dahulu (sangat cepat & tanpa latensi jaringan)
  const db = getStudentDatabase();
  let student = db.find(s => 
    (s.nis && s.nis.toString().trim().toLowerCase() === targetVal) ||
    (s.nama && s.nama.toLowerCase() === targetVal) ||
    (s.id && s.id.toLowerCase() === targetVal)
  );
  if (student) return student;

  // Cek pencarian nama parsial (misal mengetik nama depan)
  student = db.find(s => s.nama && s.nama.toLowerCase().includes(targetVal) && targetVal.length >= 3);
  if (student) return student;

  // 2. Jika tidak ada di lokal, tebak kelas dari awalan NIS dan lakukan sinkronisasi live
  const cfg = getClassSheetsConfig();
  const guessClass = targetVal.startsWith('41') ? '4A' 
    : targetVal.startsWith('42') ? '4B' 
    : targetVal.startsWith('43') ? '4C'
    : targetVal.startsWith('44') ? '4D'
    : targetVal.startsWith('45') ? '4E'
    : targetVal.startsWith('54') ? '5D'
    : targetVal.startsWith('61') ? '6A'
    : targetVal.startsWith('62') ? '6B'
    : targetVal.startsWith('63') ? '6C'
    : targetVal.startsWith('64') ? '6D'
    : targetVal.startsWith('65') ? '6E'
    : null;

  if (guessClass && cfg[guessClass] && cfg[guessClass].sheetUrl) {
    try {
      const synced = await sinkronkanDataSiswaPerKelas(guessClass, true);
      student = synced.find(s => 
        (s.nis && s.nis.toString().trim().toLowerCase() === targetVal) ||
        (s.nama && s.nama.toLowerCase() === targetVal)
      );
      if (student) return student;
    } catch (e) {}
  }

  // 3. Sinkronisasi seluruh kelas yang terhubung
  try {
    await sinkronkanSemuaKelasGoogleSheet(true);
    const freshDb = getStudentDatabase();
    student = freshDb.find(s => 
      (s.nis && s.nis.toString().trim().toLowerCase() === targetVal) ||
      (s.nama && s.nama.toLowerCase() === targetVal)
    );
    if (student) return student;
  } catch (e) {}

  // 4. Jika NIS tidak ditemukan di cache lokal maupun Google Sheet resmi sekolah: Tolak akses!
  return null;
}

// Uji Cek NIS oleh Guru di Dasbor Guru
async function ujiCekNisGuru() {
  playSound('click');
  const tabName = localStorage.getItem(SHEET_TAB_NAME_KEY) || DEFAULT_SHEET_TAB_NAME;
  const nisTest = prompt(`Masukkan nomor NIS siswa yang ingin diuji di Google Sheet "${tabName}":`, "4101");
  if (!nisTest) return;

  showToast(`Memeriksa NIS "${nisTest}" di Google Sheet...`, 'info');
  const student = await cekNisGoogleSheet(nisTest);

  if (student) {
    playSound('success');
    alert(`✅ NIS "${nisTest}" TERDAFTAR!\n\nNama: ${student.nama}\nKelas: ${student.kelas}\nNo. Absen: ${student.absen}\nSheet: ${tabName}`);
  } else {
    playSound('error');
    alert(`❌ NIS "${nisTest}" TIDAK DITEMUKAN di sheet "${tabName}"!\n\nPastikan nomor NIS sudah terdaftar di baris Google Spreadsheet Anda.`);
  }
}

// Salin Kode Google Apps Script Siap Pakai
function salinKodeAppsScript() {
  playSound('click');
  const scriptCode = `// ========================================================
// GOOGLE APPS SCRIPT: EDUCODE LMS KELAS 4 - SDS CINTA KASIH TZU CHI
// Tab Wajib: "DATA SISWA LMS"
// Tab Rekap: "REKAP NILAI SISWA"
// ========================================================

function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("DATA SISWA LMS");
  
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: "Sheet 'DATA SISWA LMS' tidak ditemukan!"
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      students: []
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  var headers = data[0].map(function(h) { return h.toString().toLowerCase().trim(); });
  var nisIdx = headers.indexOf("nis");
  var namaIdx = headers.indexOf("nama");
  if (namaIdx === -1) namaIdx = headers.indexOf("nama siswa");
  var kelasIdx = headers.indexOf("kelas");
  var absenIdx = headers.indexOf("absen");
  if (absenIdx === -1) absenIdx = headers.indexOf("no. absen");
  if (absenIdx === -1) absenIdx = headers.indexOf("no absen");
  
  if (nisIdx === -1) nisIdx = 0;
  if (namaIdx === -1) namaIdx = 1;
  if (kelasIdx === -1) kelasIdx = 2;
  if (absenIdx === -1) absenIdx = 3;
  
  var students = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var nis = row[nisIdx] ? row[nisIdx].toString().trim() : "";
    if (nis) {
      students.push({
        id: "STD-" + (row[kelasIdx] || "4") + "-" + nis,
        nis: nis,
        nama: row[namaIdx] ? row[namaIdx].toString().trim() : "Siswa " + nis,
        kelas: row[kelasIdx] ? row[kelasIdx].toString().trim() : "4A",
        absen: row[absenIdx] ? row[absenIdx].toString().trim() : "01"
      });
    }
  }
  
  var queryNis = e && e.parameter && e.parameter.nis ? e.parameter.nis.toString().trim() : null;
  if (queryNis) {
    var match = students.filter(function(s) { return s.nis.toLowerCase() === queryNis.toLowerCase(); });
    return ContentService.createTextOutput(JSON.stringify({
      status: match.length > 0 ? "found" : "not_found",
      student: match.length > 0 ? match[0] : null
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    status: "success",
    count: students.length,
    students: students
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetRekap = ss.getSheetByName("REKAP NILAI SISWA");
    
    if (!sheetRekap) {
      sheetRekap = ss.insertSheet("REKAP NILAI SISWA");
      sheetRekap.appendRow(["Waktu", "NIS", "Nama Siswa", "Kelas", "No. Absen", "Aktivitas", "Nilai", "Status KKM"]);
    }
    
    var payload = JSON.parse(e.postData.contents);
    sheetRekap.appendRow([
      new Date(),
      payload.nis || "-",
      payload.nama || "-",
      payload.kelas || "-",
      payload.absen || "-",
      payload.event || payload.aktivitas || "Latihan",
      payload.nilai || payload.kuisSem1 || payload.kuisSem2 || 0,
      payload.statusKkm || "Tuntas"
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Nilai berhasil direkam!"
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}`;

  if (navigator.clipboard) {
    navigator.clipboard.writeText(scriptCode).then(() => {
      showToast('Kode Google Apps Script berhasil disalin ke clipboard! 📋', 'success');
      alert('Kode Google Apps Script telah disalin!\n\nCara pasang:\n1. Di Google Sheets, klik Extensions > Apps Script.\n2. Tempel kode ini lalu Deploy > New deployment > Web app (Anyone can access).\n3. Salin URL Web app-nya ke aplikasi.');
    }).catch(() => {
      prompt('Salin manual skrip ini:', scriptCode);
    });
  } else {
    prompt('Salin manual skrip ini:', scriptCode);
  }
}

function ujiKirimWebhookGuru() {
  const url = localStorage.getItem(WEBHOOK_KEY);
  if (!url) {
    showToast('Silakan masukkan dan simpan URL Webhook Google Apps Script terlebih dahulu.', 'error');
    return;
  }

  showToast('Mengirim data sampel ke Google Sheets...', 'info');
  kirimKeWebhookSheets({
    event: 'uji_coba_koneksi',
    nis: '4101',
    nama: 'Aditya Pratama (Uji Coba)',
    kelas: '4A',
    absen: '01',
    kuisSem1: 100,
    statusKkm: 'Tuntas',
    timestamp: new Date().toISOString()
  });
}

function kirimKeWebhookSheets(payload) {
  const url = localStorage.getItem(WEBHOOK_KEY);
  if (!url) return;

  fetch(url, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).then(() => {
    showToast('Data berhasil disinkronkan ke Google Sheets! ✅', 'success');
  }).catch(err => {
    console.warn('Gagal sinkronisasi Google Sheets:', err);
  });
}

function eksporDatabaseJSON() {
  playSound('click');
  const db = getStudentDatabase();
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(db, null, 2));
  const link = document.createElement('a');
  link.setAttribute('href', dataStr);
  link.setAttribute('download', `Database_Siswa_Kelas4_TzuChi_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('Cadangan Database JSON berhasil diunduh! 💾', 'success');
}

function imporDatabaseJSON(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      if (Array.isArray(data)) {
        saveStudentDatabase(data);
        playSound('success');
        showToast(`Berhasil memulihkan ${data.length} data siswa! 🎉`, 'success');
        renderDasborGuru();
      } else {
        showToast('Format berkas JSON tidak sesuai!', 'error');
      }
    } catch (err) {
      showToast('Gagal membaca berkas JSON!', 'error');
    }
  };
  reader.readAsText(file);
}

function konfirmasiResetDatabase() {
  playSound('click');
  if (confirm('Kembalikan seluruh database ke data bawaan Kelas 4 SDS Cinta Kasih Tzu Chi? Data manual akan tergantikan.')) {
    localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(SEED_STUDENTS));
    playSound('success');
    showToast('Database berhasil dipulihkan ke data sampel Tzu Chi! 🔄', 'success');
    renderDasborGuru();
  }
}

// Expose fungsi rubrik dan modal secara global
window.bukaModalRubrikPenilaian = bukaModalRubrikPenilaian;
window.tutupModalRubrikPenilaian = tutupModalRubrikPenilaian;
window.evaluasiDanNilaiOtomatisPosterWord = evaluasiDanNilaiOtomatisPosterWord;
window.simpanDanNilaiExcel = simpanDanNilaiExcel;
window.hitungRubrikOtomatisPosterWord = hitungRubrikOtomatisPosterWord;
window.hitungRubrikOtomatisExcel = hitungRubrikOtomatisExcel;
window.loginDenganNis = loginDenganNis;
window.simpanPengaturanGoogleSheet = simpanPengaturanGoogleSheet;
window.sinkronkanDataSiswaGoogleSheet = sinkronkanDataSiswaGoogleSheet;
window.ujiCekNisGuru = ujiCekNisGuru;
window.salinKodeAppsScript = salinKodeAppsScript;
window.bukaModalProfilSiswa = bukaModalProfilSiswa;
window.tutupModalProfilSiswa = tutupModalProfilSiswa;
window.konfirmasiKeluarSiswa = konfirmasiKeluarSiswa;
window.eksekusiLogoutSiswa = eksekusiLogoutSiswa;
window.tutupModalKonfirmasiLogoutSiswa = tutupModalKonfirmasiLogoutSiswa;

// Panggil inisialisasi Database Guru & Pemulihan Sesi saat skrip dieksekusi dan saat DOM siap
try {
  initTeacherDatabase();
} catch (eInitEarly) {}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTeacherDatabase);
}

window.addEventListener('load', function() {
  try {
    if (typeof isTeacherSessionActive === 'function' && isTeacherSessionActive()) {
      state.isGuruLoggedIn = true;
      setHeaderNavMode('guru');
      switchTab('guru');
      if (typeof pilihKelasGuruNav === 'function') {
        pilihKelasGuruNav(state.tingkatKelasGuru || '4');
      }
      if (typeof renderDasborGuru === 'function') {
        renderDasborGuru();
      }
    } else {
      const student = getActiveStudentProfile();
      if (student) {
        setHeaderNavMode('sem1');
        muatProfilSiswa();
      }
    }
  } catch (eLoad) {}
  if (typeof updateSemesterAccessUI === 'function') {
    updateSemesterAccessUI();
  }
  if (typeof updateScrollNavVisibility === 'function') {
    updateScrollNavVisibility();
  }
});

// ========================================================
// SISTEM NAVIGASI GULIR CEPAT (SCROLL TO TOP & BOTTOM)
// ========================================================
function gulirKeAtas() {
  try { playSound('click'); } catch (e) {}

  // 1. Scroll window halus
  try {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  } catch (e) {
    window.scrollTo(0, 0);
  }

  // 2. Scroll documentElement halus
  if (document.documentElement) {
    try {
      document.documentElement.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    } catch (e) {
      document.documentElement.scrollTop = 0;
    }
  }

  // 3. Scroll body halus
  if (document.body) {
    try {
      document.body.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    } catch (e) {
      document.body.scrollTop = 0;
    }
  }

  // 4. Targetkan elemen paling atas secara langsung
  const topAnchor = document.querySelector('header') || document.getElementById('navbar-tampilan-utama') || document.body;
  if (topAnchor && typeof topAnchor.scrollIntoView === 'function') {
    topAnchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // 5. Cadangan instan jika smooth scroll terhambat
  setTimeout(() => {
    window.scrollTo(0, 0);
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
  }, 250);
}
window.gulirKeAtas = gulirKeAtas;

function gulirKeBawah() {
  try { playSound('click'); } catch (e) {}

  const maxScroll = Math.max(
    document.body.scrollHeight || 0,
    document.documentElement.scrollHeight || 0,
    document.body.offsetHeight || 0,
    document.documentElement.offsetHeight || 0
  );

  // 1. Scroll window ke bawah
  try {
    window.scrollTo({ top: maxScroll, left: 0, behavior: 'smooth' });
  } catch (e) {
    window.scrollTo(0, maxScroll);
  }

  // 2. Scroll documentElement & body
  if (document.documentElement) {
    try {
      document.documentElement.scrollTo({ top: maxScroll, left: 0, behavior: 'smooth' });
    } catch (e) {
      document.documentElement.scrollTop = maxScroll;
    }
  }
  if (document.body) {
    try {
      document.body.scrollTo({ top: maxScroll, left: 0, behavior: 'smooth' });
    } catch (e) {
      document.body.scrollTop = maxScroll;
    }
  }

  // 3. Scroll ke footer
  const footer = document.querySelector('footer');
  if (footer && typeof footer.scrollIntoView === 'function') {
    footer.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }
}
window.gulirKeBawah = gulirKeBawah;

function gulirKeTabelGuru() {
  try { playSound('click'); } catch (e) {}
  const target = document.getElementById('tabel-gradebook-guru') || document.getElementById('guru-view-gradebook');
  if (target && typeof target.scrollIntoView === 'function') {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    gulirKeAtas();
  }
}
window.gulirKeTabelGuru = gulirKeTabelGuru;

function updateScrollNavVisibility() {
  const btnTabel = document.getElementById('btn-scroll-tabel');

  // Tombol ke Tabel: Tampilkan jika sedang berada di Dasbor Guru
  if (btnTabel) {
    const tabGuru = document.getElementById('tab-guru');
    const isGuruTabActive = tabGuru && !tabGuru.classList.contains('hidden');
    if (isGuruTabActive) {
      btnTabel.classList.remove('hidden');
    } else {
      btnTabel.classList.add('hidden');
    }
  }
}
window.updateScrollNavVisibility = updateScrollNavVisibility;

window.addEventListener('scroll', updateScrollNavVisibility, { passive: true });
window.addEventListener('resize', updateScrollNavVisibility, { passive: true });
document.addEventListener('DOMContentLoaded', updateScrollNavVisibility);
setTimeout(updateScrollNavVisibility, 300);


