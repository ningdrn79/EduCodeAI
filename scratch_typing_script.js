    (function() {
      'use strict';

      // 1. SOUND SYNTHESIZER (WEB AUDIO API - ZERO EXTERNAL ASSET)
      var audioCtx = null;
      function getAudioCtx() {
        if (!audioCtx) {
          var AudioCtxClass = window.AudioContext || window.webkitAudioContext;
          if (AudioCtxClass) {
            audioCtx = new AudioCtxClass();
          }
        }
        if (audioCtx && audioCtx.state === 'suspended') {
          audioCtx.resume().catch(function() {});
        }
        return audioCtx;
      }

      function safePlay(type) {
        try {
          var ctx = getAudioCtx();
          if (!ctx) return;
          var t = ctx.currentTime;
          var osc = ctx.createOscillator();
          var gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);

          if (type === 'type') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(650, t);
            osc.frequency.exponentialRampToValueAtTime(880, t + 0.05);
            gain.gain.setValueAtTime(0.15, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
            osc.start(t);
            osc.stop(t + 0.05);
          } else if (type === 'pop') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(450, t);
            osc.frequency.exponentialRampToValueAtTime(90, t + 0.16);
            gain.gain.setValueAtTime(0.35, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
            osc.start(t);
            osc.stop(t + 0.16);
          } else if (type === 'shortcut') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(523.25, t);
            osc.frequency.setValueAtTime(659.25, t + 0.08);
            osc.frequency.setValueAtTime(783.99, t + 0.16);
            gain.gain.setValueAtTime(0.25, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
            osc.start(t);
            osc.stop(t + 0.3);
          } else if (type === 'miss') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(190, t);
            osc.frequency.linearRampToValueAtTime(80, t + 0.22);
            gain.gain.setValueAtTime(0.25, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
            osc.start(t);
            osc.stop(t + 0.22);
          } else if (type === 'victory') {
            var notes = [523.25, 659.25, 783.99, 1046.50];
            notes.forEach(function(freq, idx) {
              var o = ctx.createOscillator();
              var g = ctx.createGain();
              o.connect(g);
              g.connect(ctx.destination);
              o.type = 'triangle';
              o.frequency.setValueAtTime(freq, t + idx * 0.11);
              g.gain.setValueAtTime(0.22, t + idx * 0.11);
              g.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.11 + 0.35);
              o.start(t + idx * 0.11);
              o.stop(t + idx * 0.11 + 0.35);
            });
          }
        } catch(e) {}
      }

      function safeToast(msg, type) {
        if (typeof window.tampilkanToast === 'function') {
          window.tampilkanToast(msg, type);
        }
      }

      // 2. DATA LEVEL & CONFIG
      var LEVEL_DATA = {
        1: {
          name: 'Pemula (Kata Pendek)',
          targetScore: 100,
          speed: 0.85,
          spawnInterval: 2800,
          words: [
            'BUKU', 'KATA', 'BACA', 'KITA', 'GURU', 'RAJIN', 'SANTUN', 'SOPAN',
            'RAMAH', 'PINTAR', 'BELAJAR', 'JUJUR', 'DAMAI', 'SAYANG', 'IKHLAS',
            'CERIA', 'HEBAT', 'BISA', 'ADIL', 'RUKUN', 'TERTIB', 'BERSIH'
          ]
        },
        2: {
          name: 'Tantangan Shortcut MS Word',
          targetScore: 120,
          speed: 0.80,
          spawnInterval: 3200,
          shortcuts: [
            { key: 'B', text: 'Ctrl+B', label: 'Bold (Tebal)' },
            { key: 'I', text: 'Ctrl+I', label: 'Italic (Miring)' },
            { key: 'U', text: 'Ctrl+U', label: 'Underline (Garis Bawah)' },
            { key: 'S', text: 'Ctrl+S', label: 'Save (Simpan)' },
            { key: 'Z', text: 'Ctrl+Z', label: 'Undo (Kembalikan)' },
            { key: 'C', text: 'Ctrl+C', label: 'Copy (Salin)' },
            { key: 'V', text: 'Ctrl+V', label: 'Paste (Tempel)' },
            { key: 'A', text: 'Ctrl+A', label: 'Select All' },
            { key: 'P', text: 'Ctrl+P', label: 'Print (Cetak)' },
            { key: 'N', text: 'Ctrl+N', label: 'New Document' }
          ]
        },
        3: {
          name: 'Juara 10 Jari Cepat',
          targetScore: 180,
          speed: 1.45,
          spawnInterval: 2200,
          words: [
            'KOMPUTER', 'KEYBOARD', 'DOKUMEN', 'PARAGRAF', 'INTERNET', 'TEKNOLOGI',
            'ALGORITMA', 'KREATIVITAS', 'TZU CHI', 'INDONESIA', 'CINTA KASIH',
            'BUDI PEKERTI', 'LESTARIKAN', 'BERSYUKUR', 'KOLABORASI', 'INFORMATIKA'
          ]
        }
      };

      // 3. FINGER GUIDE MAP
      var FINGER_MAP = {
        '1': { finger: 'Kelingking Kiri', color: 'bg-rose-500' },
        'Q': { finger: 'Kelingking Kiri', color: 'bg-rose-500' },
        'A': { finger: 'Kelingking Kiri', color: 'bg-rose-500' },
        'Z': { finger: 'Kelingking Kiri', color: 'bg-rose-500' },
        'CTRL': { finger: 'Kelingking Kiri', color: 'bg-rose-500' },

        '2': { finger: 'Jari Manis Kiri', color: 'bg-amber-500' },
        'W': { finger: 'Jari Manis Kiri', color: 'bg-amber-500' },
        'S': { finger: 'Jari Manis Kiri', color: 'bg-amber-500' },
        'X': { finger: 'Jari Manis Kiri', color: 'bg-amber-500' },

        '3': { finger: 'Jari Tengah Kiri', color: 'bg-yellow-500' },
        'E': { finger: 'Jari Tengah Kiri', color: 'bg-yellow-500' },
        'D': { finger: 'Jari Tengah Kiri', color: 'bg-yellow-500' },
        'C': { finger: 'Jari Tengah Kiri', color: 'bg-yellow-500' },

        '4': { finger: 'Telunjuk Kiri', color: 'bg-emerald-500' },
        '5': { finger: 'Telunjuk Kiri', color: 'bg-emerald-500' },
        'R': { finger: 'Telunjuk Kiri', color: 'bg-emerald-500' },
        'T': { finger: 'Telunjuk Kiri', color: 'bg-emerald-500' },
        'F': { finger: 'Telunjuk Kiri', color: 'bg-emerald-500' },
        'G': { finger: 'Telunjuk Kiri', color: 'bg-emerald-500' },
        'V': { finger: 'Telunjuk Kiri', color: 'bg-emerald-500' },
        'B': { finger: 'Telunjuk Kiri', color: 'bg-emerald-500' },

        ' ': { finger: 'Ibu Jari (Spasi)', color: 'bg-blue-500' },

        '6': { finger: 'Telunjuk Kanan', color: 'bg-teal-500' },
        '7': { finger: 'Telunjuk Kanan', color: 'bg-teal-500' },
        'Y': { finger: 'Telunjuk Kanan', color: 'bg-teal-500' },
        'U': { finger: 'Telunjuk Kanan', color: 'bg-teal-500' },
        'H': { finger: 'Telunjuk Kanan', color: 'bg-teal-500' },
        'J': { finger: 'Telunjuk Kanan', color: 'bg-teal-500' },
        'N': { finger: 'Telunjuk Kanan', color: 'bg-teal-500' },
        'M': { finger: 'Telunjuk Kanan', color: 'bg-teal-500' },

        '8': { finger: 'Jari Tengah Kanan', color: 'bg-sky-500' },
        'I': { finger: 'Jari Tengah Kanan', color: 'bg-sky-500' },
        'K': { finger: 'Jari Tengah Kanan', color: 'bg-sky-500' },
        ',': { finger: 'Jari Tengah Kanan', color: 'bg-sky-500' },

        '9': { finger: 'Jari Manis Kanan', color: 'bg-indigo-500' },
        'O': { finger: 'Jari Manis Kanan', color: 'bg-indigo-500' },
        'L': { finger: 'Jari Manis Kanan', color: 'bg-indigo-500' },
        '.': { finger: 'Jari Manis Kanan', color: 'bg-indigo-500' },

        '0': { finger: 'Kelingking Kanan', color: 'bg-purple-500' },
        'P': { finger: 'Kelingking Kanan', color: 'bg-purple-500' },
        ';': { finger: 'Kelingking Kanan', color: 'bg-purple-500' },
        '/': { finger: 'Kelingking Kanan', color: 'bg-purple-500' }
      };

      var BALLOON_PALETTES = [
        { bg: 'from-rose-500 to-red-600', border: 'border-rose-300', text: 'text-white' },
        { bg: 'from-amber-400 to-orange-500', border: 'border-amber-200', text: 'text-slate-950' },
        { bg: 'from-emerald-400 to-teal-600', border: 'border-emerald-200', text: 'text-white' },
        { bg: 'from-sky-400 to-blue-600', border: 'border-sky-200', text: 'text-white' },
        { bg: 'from-purple-500 to-indigo-600', border: 'border-purple-200', text: 'text-white' },
        { bg: 'from-pink-400 to-rose-500', border: 'border-pink-200', text: 'text-white' }
      ];

      // 4. GAME STATE
      var typingState = {
        level: 1,
        score: 0,
        lives: 3,
        combo: 0,
        maxCombo: 0,
        keystrokesTotal: 0,
        keystrokesCorrect: 0,
        wordsCompleted: 0,
        startTime: null,
        isPlaying: false,
        isPaused: false,
        balloons: [],
        activeBalloonId: null,
        nextBalloonId: 1,
        lastSpawnTime: 0,
        lastFrameTime: 0,
        animFrameId: null
      };

      // 5. VIRTUAL KEYBOARD
      var KEYBOARD_ROWS = [
        ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
        ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
        ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';'],
        ['Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.']
      ];

      function renderTypingVirtualKeyboard() {
        var container = document.getElementById('typing-virtual-keyboard');
        if (!container) return;

        var html = '';
        KEYBOARD_ROWS.forEach(function(row) {
          html += '<div class="flex items-center justify-center gap-1 sm:gap-1.5 w-full">';
          row.forEach(function(k) {
            var f = FINGER_MAP[k] || { finger: '', color: 'bg-slate-700' };
            var safeId = (k === ',' ? 'comma' : (k === '.' ? 'dot' : (k === ';' ? 'semicolon' : k)));
            html += '<button type="button" id="vkey-' + safeId + '" onclick="window.onVirtualKeyClick(\'' + k + '\')" class="vkey-btn w-6.5 h-7 sm:w-8 sm:h-8 rounded-lg font-mono font-bold text-xs text-white flex items-center justify-center transition-all duration-150 ' + f.color + ' shadow-2xs active:scale-95 border border-white/20 hover:brightness-110 cursor-pointer" title="' + k + ' (' + f.finger + ')">' + k + '</button>';
          });
          html += '</div>';
        });

        html += '<div class="flex items-center justify-center gap-1.5 w-full pt-0.5">';
        html += '<button type="button" id="vkey-CTRL" onclick="window.onVirtualKeyClick(\'CTRL\')" class="vkey-btn px-3 sm:px-4 h-7 sm:h-8 rounded-lg font-mono font-bold text-xs text-white bg-rose-500 shadow-2xs border border-white/20 cursor-pointer hover:brightness-110" title="Ctrl (Kelingking Kiri)">Ctrl</button>';
        html += '<button type="button" id="vkey-SPACE" onclick="window.onVirtualKeyClick(\' \')" class="vkey-btn flex-1 max-w-xs h-7 sm:h-8 rounded-lg font-mono font-bold text-xs text-white bg-blue-500 shadow-2xs border border-white/20 cursor-pointer hover:brightness-110" title="Spasi (Ibu Jari)">Spasi</button>';
        html += '</div>';

        container.innerHTML = html;
      }

      function highlightVirtualKey(key, isPressed) {
        if (!key) return;
        var cleanKey = key.toUpperCase();
        var idKey = (cleanKey === ',' ? 'comma' : (cleanKey === '.' ? 'dot' : (cleanKey === ';' ? 'semicolon' : (cleanKey === ' ' ? 'SPACE' : cleanKey))));
        var el = document.getElementById('vkey-' + idKey);
        if (!el) return;

        if (isPressed) {
          el.classList.add('ring-4', 'ring-yellow-300', 'scale-110', 'brightness-125');
          setTimeout(function() {
            if (el) el.classList.remove('ring-4', 'ring-yellow-300', 'scale-110', 'brightness-125');
          }, 150);
        }
      }

      function updateFingerGuide() {
        var pill = document.getElementById('typing-finger-name');
        if (!pill) return;

        var targetKey = null;
        var targetLabel = '';

        if (typingState.level === 2) {
          if (typingState.balloons.length > 0) {
            var activeB = typingState.balloons.find(function(b) { return b.id === typingState.activeBalloonId; }) || typingState.balloons[0];
            if (activeB && activeB.isShortcut) {
              targetKey = activeB.shortcutKey;
              var f = FINGER_MAP[targetKey] ? FINGER_MAP[targetKey].finger : 'Jari';
              targetLabel = 'Ctrl (Kelingking Kiri) + ' + targetKey + ' (' + f + ')';
            }
          }
        } else {
          if (typingState.balloons.length > 0) {
            var activeB = typingState.balloons.find(function(b) { return b.id === typingState.activeBalloonId; }) || typingState.balloons[0];
            if (activeB) {
              var nextChar = activeB.word.charAt(activeB.typedIndex);
              if (nextChar) {
                targetKey = nextChar.toUpperCase();
                var f = FINGER_MAP[targetKey] ? FINGER_MAP[targetKey].finger : 'Jari';
                targetLabel = targetKey + ' (' + f + ')';
              }
            }
          }
        }

        if (targetKey && targetLabel) {
          pill.innerText = targetLabel;
          var cleanKey = targetKey === ' ' ? 'SPACE' : (targetKey === ',' ? 'comma' : (targetKey === '.' ? 'dot' : (targetKey === ';' ? 'semicolon' : targetKey)));
          document.querySelectorAll('.vkey-btn').forEach(function(b) { b.classList.remove('ring-2', 'ring-yellow-400', 'animate-pulse'); });
          var targetEl = document.getElementById('vkey-' + cleanKey);
          if (targetEl) targetEl.classList.add('ring-2', 'ring-yellow-400', 'animate-pulse');
          if (typingState.level === 2) {
            var ctrlEl = document.getElementById('vkey-CTRL');
            if (ctrlEl) ctrlEl.classList.add('ring-2', 'ring-yellow-400', 'animate-pulse');
          }
        } else {
          pill.innerText = 'Siap Mengetik';
          document.querySelectorAll('.vkey-btn').forEach(function(b) { b.classList.remove('ring-2', 'ring-yellow-400', 'animate-pulse'); });
        }
      }

      // 6. SPAWN & DOM MANAGEMENT (SMOOTH & ZERO RECREATION)
      function spawnBalloon() {
        var layer = document.getElementById('typing-balloons-layer');
        if (!layer) return;

        var lvlConf = LEVEL_DATA[typingState.level] || LEVEL_DATA[1];
        var arenaWidth = (layer.clientWidth && layer.clientWidth > 100) ? layer.clientWidth : 600;

        var maxX = Math.max(50, arenaWidth - 140);
        var spawnX = 20 + Math.floor(Math.random() * (maxX - 20));

        var newBalloon = {
          id: typingState.nextBalloonId++,
          x: spawnX,
          y: 5,
          speed: lvlConf.speed * (0.85 + Math.random() * 0.3),
          typedIndex: 0,
          palette: BALLOON_PALETTES[Math.floor(Math.random() * BALLOON_PALETTES.length)],
          isShortcut: false
        };

        if (typingState.level === 2 && lvlConf.shortcuts) {
          var item = lvlConf.shortcuts[Math.floor(Math.random() * lvlConf.shortcuts.length)];
          newBalloon.isShortcut = true;
          newBalloon.shortcutKey = item.key.toUpperCase();
          newBalloon.word = item.text;
          newBalloon.label = item.label;
        } else {
          var wordPool = lvlConf.words;
          newBalloon.word = wordPool[Math.floor(Math.random() * wordPool.length)].toUpperCase();
        }

        typingState.balloons.push(newBalloon);

        var bDiv = document.createElement('div');
        bDiv.id = 'balloon-' + newBalloon.id;
        bDiv.className = 'typing-balloon absolute select-none z-10';
        bDiv.style.left = newBalloon.x + 'px';
        bDiv.style.top = newBalloon.y + 'px';
        bDiv.onclick = function() { window.onBalloonClick(newBalloon.id); };

        var wordHtml = '';
        if (newBalloon.isShortcut) {
          wordHtml = '<div class="flex items-center gap-1 font-mono font-black text-sm"><span class="text-yellow-200">Ctrl</span><span>+</span><span class="text-white bg-black/30 px-1.5 py-0.5 rounded border border-white/40">' + newBalloon.shortcutKey + '</span></div>' +
                     '<div class="text-[9px] text-amber-100 font-sans font-bold leading-tight mt-0.5 truncate max-w-[120px]">' + (newBalloon.label || '') + '</div>';
        } else {
          wordHtml = '<span class="balloon-word-label font-mono font-black text-sm tracking-wider text-white drop-shadow">' + newBalloon.word + '</span>';
        }

        bDiv.innerHTML = '<div class="relative flex flex-col items-center">' +
                         '  <div class="balloon-sphere px-4 py-2.5 rounded-3xl bg-gradient-to-tr ' + newBalloon.palette.bg + ' border-2 ' + newBalloon.palette.border + ' shadow-xl flex flex-col items-center justify-center text-center text-white min-w-[90px]">' +
                         '    ' + wordHtml +
                         '  </div>

  ' +
                         '  <div class="balloon-tail w-2.5 h-2.5 bg-amber-600 rotate-45 -mt-1.5 rounded-xs"></div>' +
                         '  <div class="balloon-string w-0.5 h-6 bg-slate-700/60 -mt-0.5"></div>' +
                         '</div>';

        layer.appendChild(bDiv);
        updateFingerGuide();
      }

      function updateBalloonDOM(b) {
        var el = document.getElementById('balloon-' + b.id);
        if (!el) return;

        var isActive = (b.id === typingState.activeBalloonId);
        if (isActive) {
          el.className = 'typing-balloon absolute select-none z-20 ring-4 ring-yellow-400 scale-105';
        } else {
          el.className = 'typing-balloon absolute select-none z-10';
        }

        var wordSpan = el.querySelector('.balloon-word-label');
        if (wordSpan && !b.isShortcut) {
          var typedPart = b.word.substring(0, b.typedIndex);
          var restPart = b.word.substring(b.typedIndex);
          wordSpan.innerHTML = '<span class="text-yellow-300 underline font-black drop-shadow">' + typedPart + '</span>' +
                               '<span class="text-white drop-shadow">' + restPart + '</span>';
        }

        var ind = document.getElementById('typing-target-indicator');
        var indWord = document.getElementById('typing-target-word');
        if (ind && indWord) {
          if (typingState.activeBalloonId === b.id) {
            ind.classList.remove('hidden');
            indWord.innerText = b.word;
          }
        }
      }

      // 7. GAME LOOP & ANIMATION
      function gameLoop(currentTime) {
        if (!typingState.isPlaying || typingState.isPaused) return;

        if (!typingState.lastFrameTime) typingState.lastFrameTime = currentTime;
        var dt = (currentTime - typingState.lastFrameTime) / 1000;
        if (dt > 0.1) dt = 0.1;
        typingState.lastFrameTime = currentTime;

        var lvlConf = LEVEL_DATA[typingState.level] || LEVEL_DATA[1];
        if (currentTime - typingState.lastSpawnTime > lvlConf.spawnInterval && typingState.balloons.length < 5) {
          spawnBalloon();
          typingState.lastSpawnTime = currentTime;
        }

        var layer = document.getElementById('typing-balloons-layer');
        var grassLimit = (layer && layer.clientHeight > 100) ? (layer.clientHeight - 70) : 340;

        for (var i = typingState.balloons.length - 1; i >= 0; i--) {
          var b = typingState.balloons[i];
          b.y += b.speed * 60 * dt;

          var el = document.getElementById('balloon-' + b.id);
          if (el) {
            el.style.top = Math.round(b.y) + 'px';
          }

          if (b.y >= grassLimit) {
            var missedB = typingState.balloons.splice(i, 1)[0];
            handleBalloonMissed(missedB);
          }
        }

        updateHUDLive();

        if (typingState.isPlaying && !typingState.isPaused) {
          typingState.animFrameId = requestAnimationFrame(gameLoop);
        }
      }

      function handleBalloonMissed(b) {
        safePlay('miss');
        var el = document.getElementById('balloon-' + b.id);
        if (el && el.parentNode) {
          el.parentNode.removeChild(el);
        }

        typingState.lives--;
        typingState.combo = 0;
        if (typingState.activeBalloonId === b.id) {
          typingState.activeBalloonId = null;
          var ind = document.getElementById('typing-target-indicator');
          if (ind) ind.classList.add('hidden');
        }

        updateFingerGuide();
        updateHUDLive();

        safeToast('🎈 Balon "' + b.word + '" jatuh ke rumput! Sisa Nyawa: ' + typingState.lives, 'warning');

        if (typingState.lives <= 0) {
          endGame(false);
        }
      }

      function popBalloon(b, pointsEarned) {
        safePlay(b.isShortcut ? 'shortcut' : 'pop');

        var el = document.getElementById('balloon-' + b.id);
        if (el) {
          el.classList.add('typing-balloon-pop');
          setTimeout(function() {
            if (el && el.parentNode) el.parentNode.removeChild(el);
          }, 350);
        }

        var layer = document.getElementById('typing-balloons-layer');
        if (layer) {
          var fx = document.createElement('div');
          fx.className = 'absolute pointer-events-none text-xl sm:text-2xl font-black text-yellow-300 animate-ping z-30 font-title';
          fx.style.left = (b.x + 10) + 'px';
          fx.style.top = (b.y + 10) + 'px';
          fx.innerText = b.isShortcut ? '⚡ +' + pointsEarned : '💥 +' + pointsEarned;
          layer.appendChild(fx);
          setTimeout(function() { if (fx.parentNode) fx.parentNode.removeChild(fx); }, 500);
        }

        typingState.score += pointsEarned;
        typingState.wordsCompleted++;
        typingState.combo++;
        if (typingState.combo > typingState.maxCombo) {
          typingState.maxCombo = typingState.combo;
        }

        typingState.balloons = typingState.balloons.filter(function(item) { return item.id !== b.id; });
        if (typingState.activeBalloonId === b.id) {
          typingState.activeBalloonId = null;
          var ind = document.getElementById('typing-target-indicator');
          if (ind) ind.classList.add('hidden');
        }

        updateFingerGuide();
        updateHUDLive();

        var lvlConf = LEVEL_DATA[typingState.level] || LEVEL_DATA[1];
        if (typingState.score >= lvlConf.targetScore) {
          endGame(true);
        }
      }

      // 8. KEYBOARD & INPUT LISTENER (LAYAR STATIS & ANTI-GESER)
      function handleKeyDown(e) {
        var tabKetik = document.getElementById('tab-ketik');
        if (!tabKetik || tabKetik.classList.contains('hidden')) return;

        // KUNCI PERAMBAN: CEGAH SCROLL / PERGESERAN LAYAR
        // Tombol Spasi, Panah Atas/Bawah/Kiri/Kanan, Tab, Backspace, PgUp, PgDn, Home, End
        var scrollKeys = ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab', 'PageUp', 'PageDown', 'Home', 'End'];
        if (scrollKeys.indexOf(e.code) !== -1 || e.key === ' ' || e.key === 'Tab') {
          e.preventDefault();
        }

        var isCtrl = e.ctrlKey || e.metaKey;
        var keyUpper = (e.key || '').toUpperCase();

        // Cegah shortcut bawaan browser yang memicu dialog (Print, Save, Find, Bookmark, dll)
        if (isCtrl && ['S', 'P', 'B', 'I', 'U', 'Z', 'C', 'V', 'A', 'N', 'F', 'O', 'K', 'D'].indexOf(keyUpper) !== -1) {
          e.preventDefault();
        }

        // Tuts Escape untuk keluar dari mode layar penuh
        if (e.key === 'Escape' && window.isTypingFullscreen) {
          window.toggleTypingFullscreen();
          return;
        }

        if (!typingState.isPlaying || typingState.isPaused) return;

        highlightVirtualKey(keyUpper, true);
        if (isCtrl) highlightVirtualKey('CTRL', true);

        // LEVEL 2: SHORTCUTS
        if (typingState.level === 2) {
          if (isCtrl) {
            var matchedBalloon = typingState.balloons.find(function(b) {
              return b.isShortcut && b.shortcutKey === keyUpper;
            });

            if (matchedBalloon) {
              typingState.keystrokesCorrect += 2;
              typingState.keystrokesTotal += 2;
              popBalloon(matchedBalloon, 30);
              safeToast('⚡ Pintasan Berhasil: Ctrl + ' + keyUpper + ' (' + (matchedBalloon.label || '') + ')!', 'success');
              return;
            } else {
              typingState.keystrokesTotal++;
            }
          }
          return;
        }

        // LEVEL 1 & 3: NORMAL WORDS (HURUF ATAU KATA BERTUKAR SPASI)
        if (e.key && e.key.length === 1 && !isCtrl) {
          e.preventDefault(); // Kunci pergerakan browser saat mengetik karakter apapun
          typingState.keystrokesTotal++;

          if (!typingState.activeBalloonId) {
            var candidate = typingState.balloons.find(function(b) {
              return b.word.charAt(0) === keyUpper;
            });
            if (candidate) {
              safePlay('type');
              typingState.activeBalloonId = candidate.id;
              candidate.typedIndex = 1;
              typingState.keystrokesCorrect++;

              if (candidate.typedIndex >= candidate.word.length) {
                popBalloon(candidate, 20);
              } else {
                updateBalloonDOM(candidate);
                updateFingerGuide();
              }
              return;
            }
          } else {
            var targetB = typingState.balloons.find(function(b) { return b.id === typingState.activeBalloonId; });
            if (targetB) {
              var expectedChar = targetB.word.charAt(targetB.typedIndex);
              if (keyUpper === expectedChar) {
                safePlay('type');
                targetB.typedIndex++;
                typingState.keystrokesCorrect++;

                if (targetB.typedIndex >= targetB.word.length) {
                  popBalloon(targetB, 20);
                } else {
                  updateBalloonDOM(targetB);
                  updateFingerGuide();
                }
                return;
              }
            }
          }
        }
      }

      window.onVirtualKeyClick = function(key) {
        if (!typingState.isPlaying || typingState.isPaused) return;

        if (key === 'CTRL') {
          safeToast('Tahan tombol Ctrl lalu tekan huruf yang sesuai di keyboard!', 'info');
          return;
        }

        var fakeEvent = {
          key: key,
          ctrlKey: false,
          metaKey: false,
          preventDefault: function() {}
        };
        handleKeyDown(fakeEvent);
      };

      window.onBalloonClick = function(balloonId) {
        if (!typingState.isPlaying || typingState.isPaused) return;

        var b = typingState.balloons.find(function(item) { return item.id === balloonId; });
        if (!b) return;

        if (b.isShortcut) {
          var fakeEvent = {
            key: b.shortcutKey,
            ctrlKey: true,
            metaKey: false,
            preventDefault: function() {}
          };
          handleKeyDown(fakeEvent);
        } else {
          var nextChar = b.word.charAt(b.typedIndex);
          if (nextChar) {
            var fakeEvent = {
              key: nextChar,
              ctrlKey: false,
              metaKey: false,
              preventDefault: function() {}
            };
            handleKeyDown(fakeEvent);
          }
        }
      };

      // 9. HUD & STATS
      function updateHUDLive() {
        var scoreEl = document.getElementById('typing-hud-score');
        var wpmEl = document.getElementById('typing-hud-wpm');
        var accEl = document.getElementById('typing-hud-acc');
        var comboWrap = document.getElementById('typing-hud-combo-wrap');
        var comboEl = document.getElementById('typing-hud-combo');
        var livesEl = document.getElementById('typing-hud-lives');

        if (scoreEl) scoreEl.innerText = typingState.score;

        var elapsedMin = typingState.startTime ? ((Date.now() - typingState.startTime) / 60000) : 0.05;
        if (elapsedMin < 0.05) elapsedMin = 0.05;
        var wordsTyped = (typingState.keystrokesCorrect / 5);
        var wpm = Math.max(0, Math.round(wordsTyped / elapsedMin));
        if (wpmEl) wpmEl.innerText = wpm;

        var acc = typingState.keystrokesTotal > 0
          ? Math.round((typingState.keystrokesCorrect / typingState.keystrokesTotal) * 100)
          : 100;
        if (accEl) accEl.innerText = acc + '%';

        if (comboWrap && comboEl) {
          if (typingState.combo >= 2) {
            comboWrap.classList.remove('hidden');
            comboEl.innerText = typingState.combo + 'x Combo!';
          } else {
            comboWrap.classList.add('hidden');
          }
        }

        if (livesEl) {
          var hearts = '';
          for (var i = 0; i < typingState.lives; i++) hearts += '❤️';
          for (var j = typingState.lives; j < 3; j++) hearts += '🖤';
          livesEl.innerText = hearts;
        }
      }

      // 10. GAME LIFECYCLE (START, PAUSE, RESTART, END)
      window.pilihLevelTypingHero = function(lvl) {
        typingState.level = lvl;
        for (var i = 1; i <= 3; i++) {
          var btn = document.getElementById('btn-typing-lvl-' + i);
          if (btn) {
            if (i === lvl) {
              btn.className = 'typing-lvl-btn px-3 py-1.5 rounded-xl text-xs font-bold transition bg-yellow-300 text-slate-950 shadow-xs scale-105';
            } else {
              btn.className = 'typing-lvl-btn px-3 py-1.5 rounded-xl text-xs font-bold transition text-white hover:text-yellow-200';
            }
          }
        }

        var lvlConf = LEVEL_DATA[lvl] || LEVEL_DATA[1];
        safeToast('Level aktif: ' + lvlConf.name + ' 🎯', 'info');
        window.mulaiTypingHeroGame();
      };

      window.mulaiTypingHeroGame = function() {
        var startOverlay = document.getElementById('typing-overlay-start');
        var endOverlay = document.getElementById('typing-overlay-gameover');
        if (startOverlay) startOverlay.classList.add('hidden');
        if (endOverlay) endOverlay.classList.add('hidden');

        var pauseIcon = document.getElementById('typing-pause-icon');
        if (pauseIcon) pauseIcon.className = 'fa-solid fa-pause';

        var layer = document.getElementById('typing-balloons-layer');
        if (layer) layer.innerHTML = '';

        var ind = document.getElementById('typing-target-indicator');
        if (ind) ind.classList.add('hidden');

        var now = performance.now();
        typingState.score = 0;
        typingState.lives = 3;
        typingState.combo = 0;
        typingState.maxCombo = 0;
        typingState.keystrokesTotal = 0;
        typingState.keystrokesCorrect = 0;
        typingState.wordsCompleted = 0;
        typingState.startTime = Date.now();
        typingState.isPlaying = true;
        typingState.isPaused = false;
        typingState.balloons = [];
        typingState.activeBalloonId = null;
        typingState.lastSpawnTime = now;
        typingState.lastFrameTime = now;

        if (typingState.animFrameId) {
          cancelAnimationFrame(typingState.animFrameId);
        }

        renderTypingVirtualKeyboard();
        updateHUDLive();

        // Spawn balon pertama seketika
        spawnBalloon();

        safeToast('🚀 Permainan dimulai! Siapkan jarimu pada keyboard!', 'success');
        typingState.animFrameId = requestAnimationFrame(gameLoop);
      };

      window.togglePauseTypingHero = function() {
        if (!typingState.isPlaying) {
          window.mulaiTypingHeroGame();
          return;
        }

        typingState.isPaused = !typingState.isPaused;
        var icon = document.getElementById('typing-pause-icon');
        if (icon) {
          icon.className = typingState.isPaused ? 'fa-solid fa-play text-emerald-400' : 'fa-solid fa-pause';
        }

        if (typingState.isPaused) {
          safeToast('Permainan dijeda ⏸️', 'info');
        } else {
          safeToast('Permainan dilanjutkan ▶️', 'info');
          typingState.lastFrameTime = performance.now();
          typingState.animFrameId = requestAnimationFrame(gameLoop);
        }
      };

      window.pauseTypingHeroGame = function() {
        if (typingState.isPlaying && !typingState.isPaused) {
          typingState.isPaused = true;
          var icon = document.getElementById('typing-pause-icon');
          if (icon) icon.className = 'fa-solid fa-play text-emerald-400';
        }
      };

      window.restartTypingHeroGame = function() {
        window.mulaiTypingHeroGame();
      };

      window.lanjutLevelTypingHeroBerikutnya = function() {
        var nextLvl = typingState.level < 3 ? (typingState.level + 1) : 1;
        window.pilihLevelTypingHero(nextLvl);
      };

      function endGame(isVictory) {
        typingState.isPlaying = false;
        if (typingState.animFrameId) {
          cancelAnimationFrame(typingState.animFrameId);
        }

        var endOverlay = document.getElementById('typing-overlay-gameover');
        var endIcon = document.getElementById('typing-end-icon');
        var endTitle = document.getElementById('typing-end-title');
        var endDesc = document.getElementById('typing-end-desc');
        var finalScore = document.getElementById('typing-final-score');
        var finalWpm = document.getElementById('typing-final-wpm');
        var finalAcc = document.getElementById('typing-final-acc');
        var btnNext = document.getElementById('btn-typing-next-level');

        var elapsedMin = typingState.startTime ? ((Date.now() - typingState.startTime) / 60000) : 0.05;
        if (elapsedMin < 0.05) elapsedMin = 0.05;
        var wpm = Math.max(0, Math.round((typingState.keystrokesCorrect / 5) / elapsedMin));
        var acc = typingState.keystrokesTotal > 0
          ? Math.round((typingState.keystrokesCorrect / typingState.keystrokesTotal) * 100)
          : 100;

        if (finalScore) finalScore.innerText = typingState.score;
        if (finalWpm) finalWpm.innerText = wpm + ' WPM';
        if (finalAcc) finalAcc.innerText = acc + '%';

        try {
          var bestScore = parseInt(localStorage.getItem('typing_hero_best_score') || '0', 10);
          var bestWpm = parseInt(localStorage.getItem('typing_hero_best_wpm') || '0', 10);
          if (typingState.score > bestScore) {
            localStorage.setItem('typing_hero_best_score', typingState.score);
          }
          if (wpm > bestWpm) {
            localStorage.setItem('typing_hero_best_wpm', wpm);
          }
          updateRecordDisplays();
        } catch(e) {}

        if (isVictory) {
          safePlay('victory');
          if (endIcon) endIcon.innerText = '🏆';
          if (endTitle) endTitle.innerText = 'Luar Biasa! Misi Level Tuntas!';
          if (endDesc) endDesc.innerText = 'Hebat sekali! Jarimu sangat lincah dan tepat mengetik kata & shortcut Word.';
          if (btnNext) btnNext.classList.remove('hidden');

          if (typeof window.tambahPoin === 'function') {
            window.tambahPoin(20);
          }
          safeToast('🎉 Selamat! Target level tercapai (+20 Poin Kebaikan)', 'success');
        } else {
          safePlay('miss');
          if (endIcon) endIcon.innerText = '💪';
          if (endTitle) endTitle.innerText = 'Tetap Semangat!';
          if (endDesc) endDesc.innerText = 'Jangan menyerah! Latih terus penempatan jarimu di keyboard agar semakin cepat.';
          if (btnNext) btnNext.classList.add('hidden');
        }

        if (endOverlay) endOverlay.classList.remove('hidden');
      }

      function updateRecordDisplays() {
        var recScore = document.getElementById('typing-record-score');
        var recWpm = document.getElementById('typing-record-wpm');
        var badge = document.getElementById('typing-best-badge');

        try {
          var s = localStorage.getItem('typing_hero_best_score') || '0';
          var w = localStorage.getItem('typing_hero_best_wpm') || '0';
          if (recScore) recScore.innerText = s;
          if (recWpm) recWpm.innerText = w + ' WPM';

          if (badge) {
            var wVal = parseInt(w, 10);
            if (wVal >= 35) {
              badge.innerText = 'Juara 10 Jari 🏆';
              badge.className = 'px-2.5 py-0.5 rounded-full bg-purple-200 text-purple-900 font-bold text-[10px]';
            } else if (wVal >= 20) {
              badge.innerText = 'Terampil ⚡';
              badge.className = 'px-2.5 py-0.5 rounded-full bg-blue-200 text-blue-900 font-bold text-[10px]';
            } else {
              badge.innerText = 'Pemula 🌱';
              badge.className = 'px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 font-bold text-[10px]';
            }
          }
        } catch(e) {}
      }

      // 11. MODAL PANDUAN
      window.bukaModalPanduanTypingHero = function() {
        var m = document.getElementById('modal-panduan-typing');
        if (m) m.classList.remove('hidden');
      };

      window.tutupModalPanduanTypingHero = function() {
        var m = document.getElementById('modal-panduan-typing');
        if (m) m.classList.add('hidden');
      };

      // 11B. MODE LAYAR STATIS & FULLSCREEN THEATER ARCADE
      window.isTypingFullscreen = false;
      window.toggleTypingFullscreen = function() {
        var tab = document.getElementById('tab-ketik');
        var icon = document.getElementById('icon-typing-fullscreen');
        var txt = document.getElementById('text-typing-fullscreen');
        if (!tab) return;

        window.isTypingFullscreen = !window.isTypingFullscreen;
        if (window.isTypingFullscreen) {
          tab.classList.add('tab-ketik-fullscreen');
          document.body.classList.add('typing-screen-locked');
          if (icon) icon.className = 'fa-solid fa-compress';
          if (txt) txt.innerText = 'Layar Normal 🗗';
          safeToast('Mode Layar Statis Penuh Aktif! Layar terkunci dan tidak akan bergeser 🔒 (Tekan ESC untuk kembali)', 'info');
        } else {
          tab.classList.remove('tab-ketik-fullscreen');
          if (icon) icon.className = 'fa-solid fa-expand';
          if (txt) txt.innerText = 'Layar Penuh ⛶';
          safeToast('Kembali ke tampilan standar jendela.', 'info');
        }
      };

      window.exitTypingFullscreen = function() {
        if (window.isTypingFullscreen) {
          window.toggleTypingFullscreen();
        }
      };

      // 12. INITIALIZATION
      window.initTypingHeroGame = function() {
        renderTypingVirtualKeyboard();
        updateRecordDisplays();
        updateFingerGuide();

        var startOverlay = document.getElementById('typing-overlay-start');
        if (!typingState.isPlaying && startOverlay) {
          startOverlay.classList.remove('hidden');
        }
      };

      window.addEventListener('keydown', handleKeyDown);

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
          setTimeout(window.initTypingHeroGame, 100);
