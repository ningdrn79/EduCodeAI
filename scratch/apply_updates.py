import re
import subprocess

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update window.perbaruiRingkasanStatusP5
target_perbarui = """        window.perbaruiRingkasanStatusP5 = function() {
          try {
            var profile = (typeof getActiveStudentProfile === 'function') ? getActiveStudentProfile() : null;
            if (!profile) {
              try {
                var raw = localStorage.getItem('educode_active_student_v1');
                if (raw && raw !== 'LOGGED_OUT' && raw.indexOf('{') !== -1) profile = JSON.parse(raw);
              } catch(e) {}
            }
            var p5 = window._p5Data || {};
            var rubrik = (typeof hitungRubrikPenilaianKelas5 === 'function') ? hitungRubrikPenilaianKelas5(profile, p5) : null;
            var selesaiCount = rubrik ? rubrik.totalMenuSelesai : 0;
            var skorEl = document.getElementById('p5-skor-total');
            if (skorEl) skorEl.innerText = selesaiCount;
            var barEl = document.getElementById('p5-progress-bar');
            if (barEl) {
              var pct = Math.min(100, Math.round((selesaiCount / 4) * 100));
              barEl.style.width = pct + '%';
            }
            var lvlEl = document.getElementById('p5-level-label');
            if (lvlEl) {
              if (selesaiCount >= 4) {
                lvlEl.innerText = 'Master Kreator Digital Tzu Chi 🌟 (Lengkap 4/4)';
                lvlEl.className = 'text-[10px] text-yellow-300 font-bold mt-2';
              } else if (selesaiCount >= 3) {
                lvlEl.innerText = 'Kreator Digital Handal Tzu Chi ✨ (3/4 Selesai)';
                lvlEl.className = 'text-[10px] text-emerald-400 font-bold mt-2';
              } else if (selesaiCount >= 1) {
                lvlEl.innerText = 'Kreator Digital Cilik Tzu Chi ✨ (' + selesaiCount + '/4 Selesai)';
                lvlEl.className = 'text-[10px] text-cyan-300 font-bold mt-2';
              } else {
                lvlEl.innerText = 'Mulai Petualangan Misi Kelas 5 🚀 (0/4)';
                lvlEl.className = 'text-[10px] text-slate-400 font-bold mt-2';
              }
            }
          } catch(e) {}
        };"""

replacement_perbarui = """        window.perbaruiRingkasanStatusP5 = function() {
          try {
            var profile = (typeof getActiveStudentProfile === 'function') ? getActiveStudentProfile() : null;
            if (!profile) {
              try {
                var raw = localStorage.getItem('educode_active_student_v1');
                if (raw && raw !== 'LOGGED_OUT' && raw.indexOf('{') !== -1) profile = JSON.parse(raw);
              } catch(e) {}
            }
            if (!profile) {
              try {
                var raw2 = localStorage.getItem('active_student_profile');
                if (raw2 && raw2 !== 'LOGGED_OUT' && raw2.indexOf('{') !== -1) profile = JSON.parse(raw2);
              } catch(e) {}
            }
            var p5 = window._p5Data || {};
            var rubrik = (typeof hitungRubrikPenilaianKelas5 === 'function') ? hitungRubrikPenilaianKelas5(profile, p5) : null;
            var selesaiCount = rubrik ? rubrik.totalMenuSelesai : 0;
            var skorEl = document.getElementById('p5-skor-total');
            if (skorEl) skorEl.innerText = selesaiCount;
            var barEl = document.getElementById('p5-progress-bar');
            if (barEl) {
              var pct = Math.min(100, Math.round((selesaiCount / 4) * 100));
              barEl.style.width = pct + '%';
            }
            var lvlEl = document.getElementById('p5-level-label');
            if (lvlEl) {
              if (selesaiCount >= 4) {
                lvlEl.innerText = 'Master Kreator Digital Tzu Chi 🌟 (Lengkap 4/4)';
                lvlEl.className = 'text-[10px] text-yellow-300 font-bold mt-2';
              } else if (selesaiCount >= 3) {
                lvlEl.innerText = 'Kreator Digital Handal Tzu Chi ✨ (3/4 Selesai)';
                lvlEl.className = 'text-[10px] text-emerald-400 font-bold mt-2';
              } else if (selesaiCount >= 1) {
                lvlEl.innerText = 'Kreator Digital Cilik Tzu Chi ✨ (' + selesaiCount + '/4 Selesai)';
                lvlEl.className = 'text-[10px] text-cyan-300 font-bold mt-2';
              } else {
                lvlEl.innerText = 'Mulai Petualangan Misi Kelas 5 🚀 (0/4)';
                lvlEl.className = 'text-[10px] text-slate-400 font-bold mt-2';
              }
            }

            // Perbarui Nilai pada 4 Kartu Menu Atas Petualangan Kelas 5
            var nPpt = rubrik ? rubrik.nilaiPresentasi : (p5.nilaiPresentasi || (profile && profile.nilaiPresentasi) || 0);
            var cardPpt = document.getElementById('card-p5-score-presentasi');
            var valCardPpt = document.getElementById('val-card-score-ppt');
            if (cardPpt && valCardPpt) {
              if (nPpt > 0) {
                valCardPpt.innerText = nPpt;
                cardPpt.classList.remove('hidden');
              } else {
                cardPpt.classList.add('hidden');
              }
            }

            var nHoc = rubrik ? rubrik.nilaiSertifikat : (p5.nilaiSertifikat || (profile && profile.nilaiSertifikat) || 0);
            var cardHoc = document.getElementById('card-p5-score-sertifikat');
            var valCardHoc = document.getElementById('val-card-score-sertif');
            if (cardHoc && valCardHoc) {
              if (nHoc > 0) {
                valCardHoc.innerText = nHoc;
                cardHoc.classList.remove('hidden');
              } else {
                cardHoc.classList.add('hidden');
              }
            }

            var nPoster = rubrik ? rubrik.nilaiPosterCanva : (p5.nilaiPosterCanva || (profile && profile.nilaiPosterCanva) || 0);
            var cardPoster = document.getElementById('card-p5-score-poster');
            var valCardPoster = document.getElementById('val-card-score-poster');
            if (cardPoster && valCardPoster) {
              if (nPoster > 0) {
                valCardPoster.innerText = nPoster;
                cardPoster.classList.remove('hidden');
              } else {
                cardPoster.classList.add('hidden');
              }
            }

            var nScratch = rubrik ? rubrik.nilaiGameCoding : (p5.nilaiGameCoding || (profile && profile.nilaiGameCoding) || 0);
            var cardScratch = document.getElementById('card-p5-score-scratch');
            var valCardScratch = document.getElementById('val-card-score-scratch');
            if (cardScratch && valCardScratch) {
              if (nScratch > 0) {
                valCardScratch.innerText = nScratch;
                cardScratch.classList.remove('hidden');
              } else {
                cardScratch.classList.add('hidden');
              }
            }

            // Perbarui Badge & Status Terkirim di Kotak Penilaian Tiap Zona
            var valSistemPpt = document.getElementById('val-nilai-sistem-ppt');
            var stTerkirimPpt = document.getElementById('status-terkirim-ppt');
            if (valSistemPpt) valSistemPpt.innerText = nPpt || 0;
            if (stTerkirimPpt) {
              if (nPpt > 0) stTerkirimPpt.classList.remove('hidden');
              else stTerkirimPpt.classList.add('hidden');
            }

            var valSistemHoc = document.getElementById('val-nilai-sistem-hoc');
            var stTerkirimHoc = document.getElementById('status-terkirim-hoc');
            if (valSistemHoc) valSistemHoc.innerText = nHoc || 0;
            if (stTerkirimHoc) {
              if (nHoc > 0) stTerkirimHoc.classList.remove('hidden');
              else stTerkirimHoc.classList.add('hidden');
            }

            var valSistemPoster = document.getElementById('val-nilai-sistem-poster');
            var stTerkirimPoster = document.getElementById('status-terkirim-poster');
            if (valSistemPoster) valSistemPoster.innerText = nPoster || 0;
            if (stTerkirimPoster) {
              if (nPoster > 0) stTerkirimPoster.classList.remove('hidden');
              else stTerkirimPoster.classList.add('hidden');
            }

          } catch(e) {}
        };"""

assert target_perbarui in content, "target_perbarui not found!"
content = content.replace(target_perbarui, replacement_perbarui)

# 2. Update window.muatPortofolioKelas5Aktif to restore all 4 task scores & sync cloud
target_muat = """        window.muatPortofolioKelas5Aktif = function() {
          try {
            var profile = (typeof getActiveStudentProfile === 'function') ? getActiveStudentProfile() : null;
            if (!profile) {
              try {
                var raw = localStorage.getItem('educode_active_student_v1');
                if (raw) profile = JSON.parse(raw);
              } catch(e) {}
            }
            // Bersihkan struktur data in-memory terlebih dahulu agar karya siswa sebelumnya tidak tertinggal
            window._p5Data = {
              ppt1: null,
              ppt2: null,
              sertifikat: null,
              poster: null,
              scratch: null
            };
            if (profile && (profile.nis || profile.id)) {
              var sKey = profile.nis || profile.id;
              var rawSaved = localStorage.getItem('educode_p5_data_' + sKey);
              if (rawSaved) {
                var parsed = JSON.parse(rawSaved);
                if (parsed && typeof parsed === 'object') {
                  window._p5Data = Object.assign(window._p5Data, parsed);
                }
              } else if (profile.portofolioP5 && typeof profile.portofolioP5 === 'object') {
                window._p5Data = Object.assign(window._p5Data, profile.portofolioP5);
              } else {
                // Cadangan: Cek langsung dari database siswa
                try {
                  if (typeof getStudentDatabase === 'function') {
                    var db = getStudentDatabase();
                    var std = db.find(function(s) {
                      return (s.nis && String(s.nis) === String(sKey)) || (s.id && String(s.id) === String(sKey));
                    });
                    if (std && std.portofolioP5 && typeof std.portofolioP5 === 'object') {
                      window._p5Data = Object.assign(window._p5Data, std.portofolioP5);
                    }
                  }
                } catch(eDb) {}
              }
            }
            if (typeof window.renderStatusPpt === 'function') window.renderStatusPpt();
            if (typeof window.renderPosterPreview === 'function') window.renderPosterPreview();
            if (typeof window.renderScratchView === 'function') window.renderScratchView();
            if (typeof window.renderSertifikatView === 'function') window.renderSertifikatView();
            if (typeof window.perbaruiRingkasanStatusP5 === 'function') window.perbaruiRingkasanStatusP5();
          } catch(e) {}
        };"""

replacement_muat = """        window.muatPortofolioKelas5Aktif = function() {
          try {
            var profile = (typeof getActiveStudentProfile === 'function') ? getActiveStudentProfile() : null;
            if (!profile) {
              try {
                var raw = localStorage.getItem('educode_active_student_v1');
                if (raw) profile = JSON.parse(raw);
              } catch(e) {}
            }
            if (!profile) {
              try {
                var raw2 = localStorage.getItem('active_student_profile');
                if (raw2) profile = JSON.parse(raw2);
              } catch(e) {}
            }
            // Bersihkan struktur data in-memory terlebih dahulu agar karya siswa sebelumnya tidak tertinggal
            window._p5Data = {
              ppt1: null,
              ppt2: null,
              sertifikat: null,
              poster: null,
              scratch: null,
              nilaiPresentasi: null,
              nilaiSertifikat: null,
              nilaiPosterCanva: null,
              nilaiGameCoding: null
            };
            if (profile && (profile.nis || profile.id)) {
              var sKey = profile.nis || profile.id;
              var rawSaved = localStorage.getItem('educode_p5_data_' + sKey);
              if (rawSaved) {
                var parsed = JSON.parse(rawSaved);
                if (parsed && typeof parsed === 'object') {
                  window._p5Data = Object.assign(window._p5Data, parsed);
                }
              } else if (profile.portofolioP5 && typeof profile.portofolioP5 === 'object') {
                window._p5Data = Object.assign(window._p5Data, profile.portofolioP5);
              } else {
                // Cadangan: Cek langsung dari database siswa
                try {
                  if (typeof getStudentDatabase === 'function') {
                    var db = getStudentDatabase();
                    var std = db.find(function(s) {
                      return (s.nis && String(s.nis) === String(sKey)) || (s.id && String(s.id) === String(sKey));
                    });
                    if (std && std.portofolioP5 && typeof std.portofolioP5 === 'object') {
                      window._p5Data = Object.assign(window._p5Data, std.portofolioP5);
                    }
                  }
                } catch(eDb) {}
              }

              if (profile.nilaiPresentasi && !window._p5Data.nilaiPresentasi) window._p5Data.nilaiPresentasi = profile.nilaiPresentasi;
              if (profile.nilaiSertifikat && !window._p5Data.nilaiSertifikat) window._p5Data.nilaiSertifikat = profile.nilaiSertifikat;
              if (profile.nilaiPosterCanva && !window._p5Data.nilaiPosterCanva) window._p5Data.nilaiPosterCanva = profile.nilaiPosterCanva;
              if (profile.nilaiGameCoding && !window._p5Data.nilaiGameCoding) window._p5Data.nilaiGameCoding = profile.nilaiGameCoding;
            }
            if (typeof window.renderStatusPpt === 'function') window.renderStatusPpt();
            if (typeof window.renderPosterPreview === 'function') window.renderPosterPreview();
            if (typeof window.renderScratchView === 'function') window.renderScratchView();
            if (typeof window.renderSertifikatView === 'function') window.renderSertifikatView();
            if (typeof window.perbaruiRingkasanStatusP5 === 'function') window.perbaruiRingkasanStatusP5();

            if (typeof pulihkanPresentasiDariCloud === 'function') {
              pulihkanPresentasiDariCloud();
            }
          } catch(e) {}
        };"""

assert target_muat in content, "target_muat not found!"
content = content.replace(target_muat, replacement_muat)

# 3. Update pulihkanPresentasiDariCloud and add system evaluation functions
target_pulihkan = """        // Pulihkan Tugas Presentasi dari Cloud jika ada
        async function pulihkanPresentasiDariCloud() {
          try {
            var db = null;
            if (typeof getInlineFirestore === 'function') db = getInlineFirestore();
            if (!db && typeof firebase !== 'undefined' && firebase.firestore) db = firebase.firestore();
            if (!db) return;

            var student = null;
            try {
              if (typeof getActiveStudentProfile === 'function') student = getActiveStudentProfile();
              if (!student) {
                var sess = localStorage.getItem('educode_active_student_v1');
                if (sess) student = JSON.parse(sess);
              }
            } catch(e) {}
            var studentNis = student ? (student.nis || student.id || '3000') : '3000';

            var docSnap = await db.collection('karya_presentasi_kelas5').doc(String(studentNis)).get();
            if (docSnap && docSnap.exists) {
              var cData = docSnap.data();
              if (cData) {
                var changed = false;
                if (cData.ppt1 && !window._p5Data.ppt1) {
                  window._p5Data.ppt1 = cData.ppt1;
                  window._p5Data.ppt1.isCloudSaved = true;
                  changed = true;
                }
                if (cData.ppt2 && !window._p5Data.ppt2) {
                  window._p5Data.ppt2 = cData.ppt2;
                  window._p5Data.ppt2.isCloudSaved = true;
                  changed = true;
                }
                if (changed) {
                  simpanKeStorage();
                  window.renderStatusPpt();
                }
              }
            }
          } catch(e) {}
        }"""

replacement_pulihkan = """        // Pulihkan Tugas & Nilai Kelas 5 dari Cloud Firestore jika ada
        async function pulihkanPresentasiDariCloud() {
          try {
            var db = null;
            if (typeof getInlineFirestore === 'function') db = getInlineFirestore();
            if (!db && typeof firebase !== 'undefined' && firebase.firestore) db = firebase.firestore();
            if (!db) return;

            var student = null;
            try {
              if (typeof getActiveStudentProfile === 'function') student = getActiveStudentProfile();
              if (!student) {
                var sess = localStorage.getItem('educode_active_student_v1');
                if (sess) student = JSON.parse(sess);
              }
            } catch(e) {}
            var studentNis = student ? (student.nis || student.id || '3000') : '3000';

            var docSnap = await db.collection('karya_presentasi_kelas5').doc(String(studentNis)).get();
            if (docSnap && docSnap.exists) {
              var cData = docSnap.data();
              if (cData) {
                var changed = false;
                if (cData.ppt1 && !window._p5Data.ppt1) {
                  window._p5Data.ppt1 = cData.ppt1;
                  window._p5Data.ppt1.isCloudSaved = true;
                  changed = true;
                }
                if (cData.ppt2 && !window._p5Data.ppt2) {
                  window._p5Data.ppt2 = cData.ppt2;
                  window._p5Data.ppt2.isCloudSaved = true;
                  changed = true;
                }
                if (cData.sertifikat && !window._p5Data.sertifikat) {
                  window._p5Data.sertifikat = cData.sertifikat;
                  changed = true;
                }
                if (cData.poster && !window._p5Data.poster) {
                  window._p5Data.poster = cData.poster;
                  changed = true;
                }
                if (cData.nilaiPresentasi !== undefined && cData.nilaiPresentasi !== null && !window._p5Data.nilaiPresentasi) {
                  window._p5Data.nilaiPresentasi = cData.nilaiPresentasi;
                  changed = true;
                }
                if (cData.nilaiSertifikat !== undefined && cData.nilaiSertifikat !== null && !window._p5Data.nilaiSertifikat) {
                  window._p5Data.nilaiSertifikat = cData.nilaiSertifikat;
                  changed = true;
                }
                if (cData.nilaiPosterCanva !== undefined && cData.nilaiPosterCanva !== null && !window._p5Data.nilaiPosterCanva) {
                  window._p5Data.nilaiPosterCanva = cData.nilaiPosterCanva;
                  changed = true;
                }
                if (cData.nilaiGameCoding !== undefined && cData.nilaiGameCoding !== null && !window._p5Data.nilaiGameCoding) {
                  window._p5Data.nilaiGameCoding = cData.nilaiGameCoding;
                  changed = true;
                }
                if (changed) {
                  simpanKeStorage();
                  if (typeof window.renderStatusPpt === 'function') window.renderStatusPpt();
                  if (typeof window.renderSertifikatView === 'function') window.renderSertifikatView();
                  if (typeof window.renderPosterPreview === 'function') window.renderPosterPreview();
                  if (typeof window.perbaruiRingkasanStatusP5 === 'function') window.perbaruiRingkasanStatusP5();
                }
              }
            }
          } catch(e) {}
        }

        // =========================================================================
        // TOMBOL PENILAIAN DARI SISTEM & TERKIRIM KE BUKU NILAI & PROGRESS KELAS 5
        // =========================================================================

        // Penilaian Sistem untuk Presentasi (Menu 1)
        window.nilaiSistemPresentasiP5 = async function(isSilent) {
          var p5 = window._p5Data || {};
          var inLink1 = document.getElementById('input-ppt1-gdrive') ? document.getElementById('input-ppt1-gdrive').value.trim() : '';
          var inLink2 = document.getElementById('input-ppt2-gdrive') ? document.getElementById('input-ppt2-gdrive').value.trim() : '';
          if (inLink1) { if (!p5.ppt1) p5.ppt1 = {}; p5.ppt1.gdriveLink = inLink1; }
          if (inLink2) { if (!p5.ppt2) p5.ppt2 = {}; p5.ppt2.gdriveLink = inLink2; }

          var hasFile1 = !!(p5.ppt1 && (p5.ppt1.dataUrl || p5.ppt1.gdriveLink || p5.ppt1.name));
          var hasFile2 = !!(p5.ppt2 && (p5.ppt2.dataUrl || p5.ppt2.gdriveLink || p5.ppt2.name || p5.ppt2.prompt));

          if (!hasFile1 && !hasFile2) {
            if (!isSilent) {
              try { if (typeof playSound === 'function') playSound('warning'); } catch(e){}
              if (typeof showToast === 'function') showToast('⚠️ Unggah berkas PPT Manual / Gemini AI atau isi link Google Drive terlebih dahulu!', 'warning');
              alert('⚠️ BERKAS PRESENTASI BELUM DIUNGGAH:\\n\\nSilakan unggah minimal salah satu berkas (File 1 PPT Manual atau File 2 PPT Gemini AI) atau cantumkan tautan Google Drive sebelum meminta penilaian sistem.');
            }
            return false;
          }

          var score = (hasFile1 && hasFile2) ? 100 : 85;
          p5.nilaiPresentasi = score;

          var student = (typeof getActiveStudentProfile === 'function') ? getActiveStudentProfile() : null;
          if (!student) {
            try { var raw = localStorage.getItem('educode_active_student_v1'); if (raw) student = JSON.parse(raw); } catch(e){}
          }
          if (student) {
            student.nilaiPresentasi = score;
            student.isManualNilaiPpt = true;
          }

          simpanKeStorage();

          // Sinkronisasi realtime ke Cloud Firestore karya_presentasi_kelas5
          try {
            var db = null;
            if (typeof getInlineFirestore === 'function') db = getInlineFirestore();
            if (!db && typeof firebase !== 'undefined' && firebase.firestore) db = firebase.firestore();
            if (db && student) {
              var sKey = String(student.nis || student.id || '3000');
              var payload = {
                nis: sKey,
                nama: student.nama || 'Siswa Kelas 5',
                kelas: student.kelas || '5A',
                nilaiPresentasi: score,
                isManualNilaiPpt: true,
                updatedAt: new Date().toISOString(),
                status: 'Dinilai Sistem'
              };
              if (p5.ppt1) payload.ppt1 = { name: p5.ppt1.name || '', size: p5.ppt1.size || '', gdriveLink: p5.ppt1.gdriveLink || '', isCloudSaved: true };
              if (p5.ppt2) payload.ppt2 = { name: p5.ppt2.name || '', size: p5.ppt2.size || '', gdriveLink: p5.ppt2.gdriveLink || '', isCloudSaved: true };
              await db.collection('karya_presentasi_kelas5').doc(sKey).set(payload, { merge: true });
            }
          } catch(errCloud) {
            console.warn('Sync cloud nilai presentasi error:', errCloud);
          }

          if (typeof window.perbaruiRingkasanStatusP5 === 'function') window.perbaruiRingkasanStatusP5();
          if (typeof window.renderStatusPpt === 'function') window.renderStatusPpt();

          if (!isSilent) {
            try { if (typeof playSound === 'function') playSound('fanfare'); } catch(e){}
            if (typeof tambahPoin === 'function') tambahPoin(20);
            var pesanDetail = (score === 100) 
              ? '🌟 Sempurna! Kamu telah mengumpulkan kedua tugas (File 1 Manual & File 2 Gemini AI).' 
              : '👍 Bagus! Kamu telah mengumpulkan 1 tugas presentasi. Kumpulkan kedua file untuk meraih nilai 100!';
            alert('🎉 PENILAIAN SISTEM BERHASIL!\\n\\n' +
                  '• Nilai Presentasi: ' + score + ' / 100\\n' +
                  '• Rubrik: ' + pesanDetail + '\\n' +
                  '• Status: Terkirim ke Buku Nilai Guru & Rapor Progress Siswa! 🚀');
            if (typeof showToast === 'function') showToast('⭐ Nilai Presentasi: ' + score + '/100 berhasil disimpan ke Buku Nilai! (+20 Bintang)', 'success');
          }
          return true;
        };

        // Penilaian Sistem untuk Sertifikat Hour of Code (Menu 2)
        window.nilaiSistemSertifikatP5 = async function(isSilent) {
          var p5 = window._p5Data || {};
          var hasCert = !!(p5.sertifikat && (p5.sertifikat.dataUrl || p5.sertifikat.name || p5.sertifikat.aktivitas));

          if (!hasCert) {
            if (!isSilent) {
              try { if (typeof playSound === 'function') playSound('warning'); } catch(e){}
              if (typeof showToast === 'function') showToast('⚠️ Unggah berkas sertifikat Hour of Code terlebih dahulu!', 'warning');
              alert('⚠️ BERKAS SERTIFIKAT BELUM DIUNGGAH:\\n\\nSilakan unggah sertifikat kelulusan coding resmi dari Code.org sebelum meminta penilaian sistem.');
            }
            return false;
          }

          var score = 100;
          p5.nilaiSertifikat = score;

          var student = (typeof getActiveStudentProfile === 'function') ? getActiveStudentProfile() : null;
          if (!student) {
            try { var raw = localStorage.getItem('educode_active_student_v1'); if (raw) student = JSON.parse(raw); } catch(e){}
          }
          if (student) {
            student.nilaiSertifikat = score;
            student.isManualNilaiSertifikat = true;
          }

          simpanKeStorage();

          // Sinkronisasi realtime ke Cloud Firestore
          try {
            var db = null;
            if (typeof getInlineFirestore === 'function') db = getInlineFirestore();
            if (!db && typeof firebase !== 'undefined' && firebase.firestore) db = firebase.firestore();
            if (db && student) {
              var sKey = String(student.nis || student.id || '3000');
              var payload = {
                nis: sKey,
                nama: student.nama || 'Siswa Kelas 5',
                kelas: student.kelas || '5A',
                nilaiSertifikat: score,
                isManualNilaiSertifikat: true,
                sertifikat: {
                  name: p5.sertifikat.name || 'Sertifikat_Hour_of_Code',
                  size: p5.sertifikat.size || '',
                  time: p5.sertifikat.time || '',
                  aktivitas: p5.sertifikat.aktivitas || '',
                  kesan: p5.sertifikat.kesan || ''
                },
                updatedAt: new Date().toISOString()
              };
              await db.collection('karya_presentasi_kelas5').doc(sKey).set(payload, { merge: true });
            }
          } catch(errCloud) {
            console.warn('Sync cloud nilai sertifikat error:', errCloud);
          }

          if (typeof window.perbaruiRingkasanStatusP5 === 'function') window.perbaruiRingkasanStatusP5();
          if (typeof window.renderSertifikatView === 'function') window.renderSertifikatView();

          if (!isSilent) {
            try { if (typeof playSound === 'function') playSound('fanfare'); } catch(e){}
            if (typeof tambahPoin === 'function') tambahPoin(20);
            alert('🎉 PENILAIAN SISTEM BERHASIL!\\n\\n' +
                  '• Nilai Sertifikat Hour of Code: ' + score + ' / 100\\n' +
                  '• Keterangan: Sertifikat Resmi Coding Terverifikasi Valid 🏆\\n' +
                  '• Status: Terkirim ke Buku Nilai Guru & Rapor Progress Siswa! 🚀');
            if (typeof showToast === 'function') showToast('⭐ Nilai Sertifikat: ' + score + '/100 berhasil disimpan ke Buku Nilai! (+20 Bintang)', 'success');
          }
          return true;
        };

        // Penilaian Sistem untuk Poster Canva (Menu 3)
        window.nilaiSistemPosterP5 = async function(isSilent) {
          var p5 = window._p5Data || {};
          var hasPoster = !!(p5.poster && (p5.poster.dataUrl || p5.poster.name || p5.poster.judul));

          if (!hasPoster) {
            if (!isSilent) {
              try { if (typeof playSound === 'function') playSound('warning'); } catch(e){}
              if (typeof showToast === 'function') showToast('⚠️ Unggah gambar desain poster Canva (PNG) terlebih dahulu!', 'warning');
              alert('⚠️ BERKAS POSTER BELUM DIUNGGAH:\\n\\nSilakan pilih dan unggah file gambar poster PNG hasil unduhan dari Canva sebelum meminta penilaian sistem.');
            }
            return false;
          }

          var j = document.getElementById('judul-poster-canva') ? document.getElementById('judul-poster-canva').value.trim() : (p5.poster.judul || '');
          var p = document.getElementById('pesan-poster-canva') ? document.getElementById('pesan-poster-canva').value.trim() : (p5.poster.pesan || '');
          var score = (j || p) ? 100 : 95;
          p5.nilaiPosterCanva = score;
          if (j) p5.poster.judul = j;
          if (p) p5.poster.pesan = p;

          var student = (typeof getActiveStudentProfile === 'function') ? getActiveStudentProfile() : null;
          if (!student) {
            try { var raw = localStorage.getItem('educode_active_student_v1'); if (raw) student = JSON.parse(raw); } catch(e){}
          }
          if (student) {
            student.nilaiPosterCanva = score;
            student.isManualNilaiPoster = true;
          }

          simpanKeStorage();

          // Sinkronisasi realtime ke Cloud Firestore
          try {
            var db = null;
            if (typeof getInlineFirestore === 'function') db = getInlineFirestore();
            if (!db && typeof firebase !== 'undefined' && firebase.firestore) db = firebase.firestore();
            if (db && student) {
              var sKey = String(student.nis || student.id || '3000');
              var payload = {
                nis: sKey,
                nama: student.nama || 'Siswa Kelas 5',
                kelas: student.kelas || '5A',
                nilaiPosterCanva: score,
                isManualNilaiPoster: true,
                poster: {
                  name: p5.poster.name || 'Poster_Canva_Lingkungan.png',
                  size: p5.poster.size || '',
                  time: p5.poster.time || '',
                  judul: p5.poster.judul || '',
                  pesan: p5.poster.pesan || ''
                },
                updatedAt: new Date().toISOString()
              };
              await db.collection('karya_presentasi_kelas5').doc(sKey).set(payload, { merge: true });
            }
          } catch(errCloud) {
            console.warn('Sync cloud nilai poster error:', errCloud);
          }

          if (typeof window.perbaruiRingkasanStatusP5 === 'function') window.perbaruiRingkasanStatusP5();
          if (typeof window.renderPosterPreview === 'function') window.renderPosterPreview();

          if (!isSilent) {
            try { if (typeof playSound === 'function') playSound('fanfare'); } catch(e){}
            if (typeof tambahPoin === 'function') tambahPoin(20);
            var pesanDetail = (score === 100)
              ? '🎨 Sangat Kreatif! Poster Canva dilengkapi judul dan pesan ajakan lingkungan.'
              : '👍 Bagus! Poster Canva berhasil diverifikasi. Lengkapi judul dan pesan untuk nilai 100!';
            alert('🎉 PENILAIAN SISTEM BERHASIL!\\n\\n' +
                  '• Nilai Poster Canva: ' + score + ' / 100\\n' +
                  '• Rubrik: ' + pesanDetail + '\\n' +
                  '• Status: Terkirim ke Buku Nilai Guru & Rapor Progress Siswa! 🚀');
            if (typeof showToast === 'function') showToast('⭐ Nilai Poster: ' + score + '/100 berhasil disimpan ke Buku Nilai! (+20 Bintang)', 'success');
          }
          return true;
        };"""

assert target_pulihkan in content, "target_pulihkan not found!"
content = content.replace(target_pulihkan, replacement_pulihkan)

# 4. Hook system evaluation into simpanTugasPresentasiP5
target_simpan_ppt = """          // 3. Simpan ke Penyimpanan Lokal
          simpanKeStorage();
          window.renderStatusPpt();"""

replacement_simpan_ppt = """          // Otomatis lakukan penilaian dari sistem & kirim ke Buku Nilai
          try {
            if (typeof window.nilaiSistemPresentasiP5 === 'function') {
              await window.nilaiSistemPresentasiP5(true);
            }
          } catch(eGrade) {}

          // 3. Simpan ke Penyimpanan Lokal
          simpanKeStorage();
          window.renderStatusPpt();"""

assert target_simpan_ppt in content, "target_simpan_ppt not found!"
content = content.replace(target_simpan_ppt, replacement_simpan_ppt)

# 5. Hook system evaluation into simpanSertifikatHourOfCodeP5
target_simpan_hoc = """          window._p5Data.sertifikat.aktivitas = akt;
          window._p5Data.sertifikat.kesan = ksn;
          simpanKeStorage();"""

replacement_simpan_hoc = """          window._p5Data.sertifikat.aktivitas = akt;
          window._p5Data.sertifikat.kesan = ksn;

          // Otomatis berikan penilaian dari sistem & sinkron ke Buku Nilai
          try {
            if (typeof window.nilaiSistemSertifikatP5 === 'function') {
              window.nilaiSistemSertifikatP5(true);
            }
          } catch(eHocGrade) {}

          simpanKeStorage();"""

assert target_simpan_hoc in content, "target_simpan_hoc not found!"
content = content.replace(target_simpan_hoc, replacement_simpan_hoc)

# 6. Hook system evaluation into simpanPosterCanvaP5
target_simpan_poster = """          window._p5Data.poster.judul = j || 'Poster Pelestarian Lingkungan';
          window._p5Data.poster.pesan = p;
          simpanKeStorage();"""

replacement_simpan_poster = """          window._p5Data.poster.judul = j || 'Poster Pelestarian Lingkungan';
          window._p5Data.poster.pesan = p;

          // Otomatis berikan penilaian dari sistem & sinkron ke Buku Nilai
          try {
            if (typeof window.nilaiSistemPosterP5 === 'function') {
              window.nilaiSistemPosterP5(true);
            }
          } catch(ePosterGrade) {}

          simpanKeStorage();"""

assert target_simpan_poster in content, "target_simpan_poster not found!"
content = content.replace(target_simpan_poster, replacement_simpan_poster)

# 7. Bump cache buster in index.html
content = re.sub(r'app\.js\?v=[a-zA-Z0-9_\-\.]+', 'app.js?v=20261120_k5_penilaian_sistem_v224', content)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("index.html successfully updated!")
