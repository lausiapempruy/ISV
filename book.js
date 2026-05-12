/* ================================================================
   ILMU SEJARAH VOC — IVH BATAVIA 1926
   book.js — complete rewrite, robust for GitHub Pages
   Part 1 = index.html | Part 2 = index2.html | Part 3 = index3.html
   ================================================================ */
(function () {
'use strict';

/* ----------------------------------------------------------------
   1. DETECT PART — safe for GitHub Pages paths
   ---------------------------------------------------------------- */
var href = window.location.href;
var PART = 1;
if (href.indexOf('index3') !== -1) { PART = 3; }
else if (href.indexOf('index2') !== -1) { PART = 2; }
else { PART = 1; }

var PART_FILES = { 1: 'index.html', 2: 'index2.html', 3: 'index3.html' };
var TOTAL_PAGES    = 80;
var PAGES_PER_PART = 30;
var partOffset     = (PART - 1) * PAGES_PER_PART;

/* ----------------------------------------------------------------
   2. CORE STATE
   ---------------------------------------------------------------- */
var currentIdx   = 0;
var filterOn     = true;
var isDragging   = false;
var dragStartX   = 0;
var DRAG_THR     = 60;
var touchStartX  = 0;
var touchStartY  = 0;

/* ----------------------------------------------------------------
   3. GRAB DOM — all optional-chained so missing elem won't crash
   ---------------------------------------------------------------- */
var pages         = [];
var btnPrev       = null;
var btnNext       = null;
var progressFill  = null;
var btnFilter     = null;
var btnExport     = null;
var btnFS         = null;
var tooltipBox    = null;
var exportOverlay = null;
var exportCancel  = null;
var exportPageNum = null;
var exportProgress= null;
var bookStage     = null;

function grabDOM() {
  pages         = Array.from(document.querySelectorAll('.page'));
  btnPrev       = document.getElementById('btn-prev');
  btnNext       = document.getElementById('btn-next');
  progressFill  = document.getElementById('progress-fill');
  btnFilter     = document.getElementById('btn-filter');
  btnExport     = document.getElementById('btn-export');
  btnFS         = document.getElementById('btn-fs');
  tooltipBox    = document.getElementById('tooltip-box');
  exportOverlay = document.getElementById('export-overlay');
  exportCancel  = document.getElementById('export-cancel');
  exportPageNum = document.getElementById('export-page-num');
  exportProgress= document.getElementById('export-progress');
  bookStage     = document.getElementById('book-stage');
}

/* ----------------------------------------------------------------
   4. NAVIGATION
   ---------------------------------------------------------------- */
function goTo(idx, dir) {
  if (idx < 0 || idx >= pages.length) return;
  var prev = pages[currentIdx];
  var next = pages[idx];
  prev.classList.add(dir === 'next' ? 'exit-left' : 'exit-right');
  prev.classList.remove('active');
  setTimeout(function() {
    prev.classList.remove('exit-left');
    prev.classList.remove('exit-right');
  }, 400);
  next.classList.remove('exit-left');
  next.classList.remove('exit-right');
  next.classList.add('active');
  currentIdx = idx;
  next.scrollTop = 0;
  updateUI();
}

function goNext() { goTo(currentIdx + 1, 'next'); }
function goPrev() { goTo(currentIdx - 1, 'prev'); }

function handleEdge(dir) {
  if (dir === 'next' && currentIdx === pages.length - 1) {
    if (PART < 3) { window.location.href = PART_FILES[PART + 1]; }
    return true;
  }
  if (dir === 'prev' && currentIdx === 0) {
    if (PART > 1) { window.location.href = PART_FILES[PART - 1]; }
    return true;
  }
  return false;
}

/* ----------------------------------------------------------------
   5. UPDATE UI
   ---------------------------------------------------------------- */
function updateUI() {
  var globalPage = partOffset + currentIdx + 1;

  /* page counter */
  var el = document.getElementById('page-counter');
  if (el) el.innerHTML = 'Hal. <span id="cur">' + globalPage + '</span> / ' + TOTAL_PAGES;

  /* progress bar */
  if (progressFill) {
    progressFill.style.width = ((globalPage / TOTAL_PAGES) * 100).toFixed(1) + '%';
  }

  /* prev/next disabled */
  if (btnPrev) btnPrev.disabled = (currentIdx === 0 && PART === 1);
  if (btnNext) btnNext.disabled = (currentIdx === pages.length - 1 && PART === 3);

  /* save position */
  try {
    localStorage.setItem('ivh_last_page', globalPage);
    localStorage.setItem('ivh_last_part', PART);
  } catch(e) {}
}

/* ----------------------------------------------------------------
   6. RESTORE LAST POSITION
   ---------------------------------------------------------------- */
function restorePosition() {
  try {
    var lastPart = parseInt(localStorage.getItem('ivh_last_part') || '1', 10);
    var lastPage = parseInt(localStorage.getItem('ivh_last_page') || '1', 10);
    if (lastPart === PART && lastPage > partOffset && lastPage <= partOffset + pages.length) {
      var idx = lastPage - partOffset - 1;
      if (idx > 0) goTo(idx, 'next');
    }
  } catch(e) {}
}

/* ----------------------------------------------------------------
   7. BUTTON CLICK HANDLERS
   ---------------------------------------------------------------- */
function bindButtons() {
  if (btnPrev) {
    btnPrev.addEventListener('click', function() {
      if (!handleEdge('prev')) goPrev();
    });
  }
  if (btnNext) {
    btnNext.addEventListener('click', function() {
      if (!handleEdge('next')) goNext();
    });
  }
}

/* ----------------------------------------------------------------
   8. KEYBOARD
   ---------------------------------------------------------------- */
function bindKeyboard() {
  document.addEventListener('keydown', function(e) {
    var tag = e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown') {
      e.preventDefault();
      if (!handleEdge('next')) goNext();
    }
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      e.preventDefault();
      if (!handleEdge('prev')) goPrev();
    }
  });
}

/* ----------------------------------------------------------------
   9. MOUSE DRAG (PC hold+drag)
   ---------------------------------------------------------------- */
function bindMouseDrag() {
  if (!bookStage) return;
  bookStage.addEventListener('mousedown', function(e) {
    if (e.button === 2) e.preventDefault(); /* allow right-drag */
    isDragging = true;
    dragStartX = e.clientX;
    e.preventDefault();
  });
  bookStage.addEventListener('contextmenu', function(e) { e.preventDefault(); });

  document.addEventListener('mousemove', function(e) {
    if (isDragging) e.preventDefault();
  });

  document.addEventListener('mouseup', function(e) {
    if (!isDragging) return;
    isDragging = false;
    var dx = e.clientX - dragStartX;
    if (Math.abs(dx) > DRAG_THR) {
      if (dx < 0) { if (!handleEdge('next')) goNext(); }
      else        { if (!handleEdge('prev')) goPrev(); }
    }
  });
}

/* ----------------------------------------------------------------
   10. TOUCH SWIPE (mobile/tablet)
   ---------------------------------------------------------------- */
function bindTouch() {
  document.addEventListener('touchstart', function(e) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  document.addEventListener('touchend', function(e) {
    var dx = e.changedTouches[0].clientX - touchStartX;
    var dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > DRAG_THR) {
      if (dx < 0) { if (!handleEdge('next')) goNext(); }
      else        { if (!handleEdge('prev')) goPrev(); }
    }
  }, { passive: true });
}

/* ----------------------------------------------------------------
   11. TOOLTIP (.nl[data-tip])
   ---------------------------------------------------------------- */
function setupTooltips() {
  if (!tooltipBox) return;
  var els = document.querySelectorAll('.nl[data-tip]');
  for (var i = 0; i < els.length; i++) {
    (function(el) {
      el.addEventListener('mouseenter', function(e) {
        tooltipBox.textContent = el.getAttribute('data-tip');
        tooltipBox.classList.add('show');
        positionTip(e);
      });
      el.addEventListener('mousemove', positionTip);
      el.addEventListener('mouseleave', function() {
        tooltipBox.classList.remove('show');
      });
    })(els[i]);
  }
}

function positionTip(e) {
  if (!tooltipBox) return;
  var x = e.clientX + 14;
  var y = e.clientY - 6;
  var tw = tooltipBox.offsetWidth;
  var th = tooltipBox.offsetHeight;
  if (x + tw > window.innerWidth  - 8) x = e.clientX - tw - 14;
  if (y + th > window.innerHeight - 8) y = e.clientY - th - 6;
  tooltipBox.style.left = x + 'px';
  tooltipBox.style.top  = y + 'px';
}

/* ----------------------------------------------------------------
   12. FILTER TOGGLE
   ---------------------------------------------------------------- */
function bindFilter() {
  if (!btnFilter) return;
  btnFilter.addEventListener('click', function() {
    filterOn = !filterOn;
    document.body.classList.toggle('filter-off', !filterOn);
    btnFilter.textContent = filterOn ? '🎞 Filter' : '🎞 Normal';
  });
}

/* ----------------------------------------------------------------
   13. FULLSCREEN
   ---------------------------------------------------------------- */
function bindFullscreen() {
  if (!btnFS) return;
  btnFS.addEventListener('click', function() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(function(){});
      btnFS.textContent = '✕ Keluar';
    } else {
      document.exitFullscreen().catch(function(){});
      btnFS.textContent = '⛶';
    }
  });
}

/* ----------------------------------------------------------------
   14. EXPORT PNG
   ---------------------------------------------------------------- */
function loadH2C(cb) {
  if (window.html2canvas) { cb(); return; }
  var s = document.createElement('script');
  s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
  s.onload  = cb;
  s.onerror = function() { alert('Gagal memuat library ekspor. Cek koneksi internet.'); };
  document.head.appendChild(s);
}

function bindExport() {
  if (!btnExport) return;
  btnExport.addEventListener('click', function() {
    var gp = partOffset + currentIdx + 1;
    if (exportPageNum)  exportPageNum.textContent  = gp;
    if (exportProgress) exportProgress.textContent = 'Memuat library...';
    if (exportOverlay)  exportOverlay.classList.remove('hidden');

    loadH2C(function() {
      if (exportProgress) exportProgress.textContent = 'Merender...';
      html2canvas(pages[currentIdx], {
        scale: 2, useCORS: true, allowTaint: false,
        backgroundColor: '#e8dcc8', width: 720, height: 960, logging: false
      }).then(function(canvas) {
        if (exportProgress) exportProgress.textContent = 'Mengunduh...';
        canvas.toBlob(function(blob) {
          var url = URL.createObjectURL(blob);
          var a   = document.createElement('a');
          a.href = url;
          a.download = 'IVH-SejarahVOC-hal' + gp + '.png';
          a.click();
          URL.revokeObjectURL(url);
          if (exportOverlay) exportOverlay.classList.add('hidden');
        }, 'image/png');
      }).catch(function(err) {
        console.error(err);
        if (exportProgress) exportProgress.textContent = 'Gagal. Coba lagi.';
      });
    });
  });

  if (exportCancel) {
    exportCancel.addEventListener('click', function() {
      if (exportOverlay) exportOverlay.classList.add('hidden');
    });
  }
}

/* ----------------------------------------------------------------
   15. PILIHAN GANDA — click to reveal
   ---------------------------------------------------------------- */
function setupPG() {
  var items = document.querySelectorAll('.soal-item');
  for (var i = 0; i < items.length; i++) {
    (function(item) {
      var correct     = item.getAttribute('data-answer');
      var opts        = item.querySelectorAll('.opt');
      var explanation = item.querySelector('.soal-explanation');
      var answered    = false;

      for (var j = 0; j < opts.length; j++) {
        (function(opt) {
          opt.addEventListener('click', function() {
            if (answered) return;
            answered = true;
            if (opt.getAttribute('data-opt') === correct) {
              opt.classList.add('selected-correct');
            } else {
              opt.classList.add('selected-wrong');
              for (var k = 0; k < opts.length; k++) {
                if (opts[k].getAttribute('data-opt') === correct) {
                  opts[k].classList.add('selected-correct');
                }
              }
            }
            if (explanation) explanation.classList.remove('hidden');
          });
        })(opts[j]);
      }
    })(items[i]);
  }
}

/* ----------------------------------------------------------------
   16. GAME: TEBAK TOKOH
   ---------------------------------------------------------------- */
var TOKOH_DATA = [
  {
    clues: [
      'Lahir di kota kecil Holland, bukan dari keluarga bangsawan.',
      'Pernah magang akuntansi di Roma selama 6 tahun.',
      'Memerintahkan penghancuran sebuah kota Jawa dan membangun kota baru di atasnya.'
    ],
    answer: 'Jan Pieterszoon Coen',
    options: ['Johan van Oldenbarnevelt','Jan Pieterszoon Coen','Antonio van Diemen','Cornelis Speelman'],
    fact: 'J.P. Coen adalah GG VOC ke-4 & ke-6, pendiri Batavia (1619), arsitek pembantaian Banda (1621).'
  },
  {
    clues: [
      'Negarawan Belanda yang tidak pernah berlayar ke Hindia.',
      'Berhasil meyakinkan enam kongsi bersaing untuk bergabung menjadi satu.',
      'Namanya terhubung dengan wilayah yang menjadi nama ibu kota sebuah republik.'
    ],
    answer: 'Johan van Oldenbarnevelt',
    options: ['Pieter Both','Johan van Oldenbarnevelt','Jan Pieterszoon Coen','Wijbrand van Warwijck'],
    fact: 'Johan van Oldenbarnevelt adalah arsitek penggabungan voorcompagnieën menjadi VOC, 20 Maret 1602.'
  },
  {
    clues: [
      'GG VOC ke-16, menjabat lebih dari dua dekade.',
      'Di bawahnya, VOC merebut pelabuhan bebas terbesar di Sulawesi Selatan.',
      'Namanya terkait perjanjian 1667 yang menaklukkan "Ayam Jantan dari Timur".'
    ],
    answer: 'Joan Maetsuyker',
    options: ['Joan Maetsuyker','Rijklof van Goens','Adriaan Valckenier','Jacob Mossel'],
    fact: 'Joan Maetsuyker (GG 1653–1678) memimpin penaklukan Makassar dan memaksa Sultan Hasanuddin menandatangani Perjanjian Bongaya.'
  },
  {
    clues: [
      'Bukan orang Belanda, bukan orang Jawa.',
      'Memimpin kerajaan di Sulawesi Selatan yang menjadi surga pedagang bebas.',
      'Dijuluki "Ayam Jantan dari Timur" karena keberaniannya melawan VOC.'
    ],
    answer: 'Sultan Hasanuddin',
    options: ['Arung Palakka','Sultan Hasanuddin','Sultan Agung','Pangeran Wijayakrama'],
    fact: 'Sultan Hasanuddin dipaksa menandatangani Perjanjian Bongaya 1667 setelah dikalahkan koalisi VOC-Bone.'
  },
  {
    clues: [
      'Raja kerajaan terbesar di Jawa abad ke-17.',
      'Dua kali menyerang sebuah kota di pesisir utara Jawa — keduanya gagal.',
      'Meski gagal, ia tetap memperluas kerajaannya ke timur Jawa.'
    ],
    answer: 'Sultan Agung',
    options: ['Sultan Agung','Amangkurat I','Panembahan Senopati','Sultan Hamengkubuwono I'],
    fact: 'Sultan Agung menyerang Batavia dua kali (1628 & 1629) namun gagal karena kekurangan bekal.'
  }
];

function shuffleArr(arr) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
  }
  return a;
}

function setupGameTebakTokoh() {
  var container = document.getElementById('game-tebak-tokoh');
  if (!container) return;

  var score = 0, round = 0, cluesShown = 0, answered = false;

  var scoreEl    = document.getElementById('tbt-score');
  var roundEl    = document.getElementById('tbt-round');
  var cluesEl    = document.getElementById('tbt-clues');
  var optsEl     = document.getElementById('tbt-options');
  var feedbackEl = document.getElementById('tbt-feedback');
  var hintBtn    = document.getElementById('tbt-hint');
  var finalEl    = document.getElementById('tbt-final');
  var finalScore = document.getElementById('tbt-final-score');
  var gradeEl    = document.getElementById('tbt-grade');
  var cardEl     = document.getElementById('tbt-card');
  var restartBtn = document.getElementById('tbt-restart');
  var playAgain  = document.getElementById('tbt-play-again');

  function renderClues(q) {
    if (!cluesEl) return;
    cluesEl.innerHTML = '';
    for (var i = 0; i < cluesShown; i++) {
      var d = document.createElement('div');
      d.className = 'clue-item';
      d.innerHTML = '<span class="clue-num">Petunjuk ' + (i+1) + ':</span> ' + q.clues[i];
      cluesEl.appendChild(d);
    }
  }

  function loadRound() {
    if (round >= TOKOH_DATA.length) { showFinal(); return; }
    var q = TOKOH_DATA[round];
    cluesShown = 1; answered = false;
    if (feedbackEl) { feedbackEl.classList.add('hidden'); feedbackEl.textContent = ''; }
    if (hintBtn) hintBtn.disabled = false;
    renderClues(q);
    if (optsEl) {
      optsEl.innerHTML = '';
      var shuffled = shuffleArr(q.options);
      for (var i = 0; i < shuffled.length; i++) {
        (function(opt) {
          var btn = document.createElement('button');
          btn.className = 'tbt-option';
          btn.textContent = opt;
          btn.addEventListener('click', function() { handleAnswer(opt, q, btn); });
          optsEl.appendChild(btn);
        })(shuffled[i]);
      }
    }
    if (roundEl) roundEl.textContent = round + 1;
  }

  function handleAnswer(chosen, q, btnEl) {
    if (answered) return;
    answered = true;
    if (hintBtn) hintBtn.disabled = true;
    var pts = cluesShown === 1 ? 3 : cluesShown === 2 ? 2 : 1;
    if (chosen === q.answer) {
      score += pts;
      if (scoreEl) scoreEl.textContent = score;
      btnEl.classList.add('correct');
      if (feedbackEl) {
        feedbackEl.innerHTML = '&#10003; <strong>Benar!</strong> +' + pts + ' poin<br/><em>' + q.fact + '</em>';
        feedbackEl.classList.remove('hidden');
      }
    } else {
      btnEl.classList.add('wrong');
      var allBtns = optsEl ? optsEl.querySelectorAll('.tbt-option') : [];
      for (var i = 0; i < allBtns.length; i++) {
        if (allBtns[i].textContent === q.answer) allBtns[i].classList.add('correct');
      }
      if (feedbackEl) {
        feedbackEl.innerHTML = '&#10007; <strong>Salah.</strong> Jawaban: <em>' + q.answer + '</em><br/>' + q.fact;
        feedbackEl.classList.remove('hidden');
      }
    }
    setTimeout(function() { round++; loadRound(); }, 2500);
  }

  if (hintBtn) {
    hintBtn.addEventListener('click', function() {
      var q = TOKOH_DATA[round];
      if (cluesShown < q.clues.length) {
        cluesShown++;
        renderClues(q);
        if (cluesShown >= q.clues.length) hintBtn.disabled = true;
      }
    });
  }

  function showFinal() {
    if (cardEl) cardEl.classList.add('hidden');
    if (finalEl) finalEl.classList.remove('hidden');
    if (finalScore) finalScore.textContent = score;
    var max = TOKOH_DATA.length * 3;
    var grade = score >= max * 0.8
      ? '🏆 Sangat Baik — Layak jadi Commissaris VOC!'
      : score >= max * 0.5
        ? '👍 Cukup Baik — Terus belajar.'
        : '📚 Perlu Belajar Lagi — Baca ulang Bab 1.';
    if (gradeEl) gradeEl.textContent = grade;
  }

  function resetGame() {
    score = 0; round = 0;
    if (scoreEl) scoreEl.textContent = '0';
    if (cardEl)  cardEl.classList.remove('hidden');
    if (finalEl) finalEl.classList.add('hidden');
    loadRound();
  }

  if (restartBtn) restartBtn.addEventListener('click', resetGame);
  if (playAgain)  playAgain.addEventListener('click',  resetGame);
  loadRound();
}

/* ----------------------------------------------------------------
   17. GAME: SIDANG RAAD VAN JUSTITIE
   ---------------------------------------------------------------- */
var SIDANG_CASES = [
  {
    title: 'Kasus I — Pedagang Tionghoa & Penjualan Cengkeh Gelap',
    desc: 'Tan Boen Siang ditangkap karena menjual 12 pikul cengkeh ke kapal Inggris. Ia mengaku tidak tahu ini melanggar monopoli VOC. Keluarganya miskin.',
    choices: [
      { text: 'Bebaskan — ketidaktahuan dalih masuk akal.', just: true },
      { text: 'Denda f.200 tanpa penjara — proporsional.', just: true },
      { text: 'Hukum mati — efek jera bagi pedagang lain.', just: false },
      { text: 'Kerja paksa 2 tahun di galangan kapal.', just: false }
    ],
    justOutcome: 'Proporsional. Raad van Justitie memang membedakan pelanggaran pertama dengan pelanggaran berulang.',
    unjustOutcome: 'Berlebihan. Hukuman berat untuk pelanggaran pertama mencerminkan sistem keadilan yang tidak seimbang.'
  },
  {
    title: 'Kasus II — Tentara VOC yang Desersi',
    desc: 'Hans Krug melarikan diri dari pos Amboina tiga bulan, lalu menyerahkan diri setelah ada amnesti. Ia mengklaim sakit.',
    choices: [
      { text: 'Bebaskan — menyerahkan diri sukarela dan sakit.', just: true },
      { text: 'Potong gaji 6 bulan — hukuman administratif.', just: true },
      { text: 'Cambuk 50 kali di depan umum.', just: false },
      { text: 'Eksekusi mati — desersi adalah pengkhianatan.', just: false }
    ],
    justOutcome: 'Berimbang. Penyerahan diri sukarela seharusnya jadi faktor keringanan hukuman.',
    unjustOutcome: 'Terlalu berat. Eksekusi atau hukuman fisik berlebihan melemahkan moral seluruh pasukan.'
  },
  {
    title: 'Kasus III — Pejabat VOC yang Korupsi',
    desc: 'Seorang boekhouder menggelapkan f.1.200 selama 3 tahun. Ia menantu anggota Raad van Indië.',
    choices: [
      { text: 'Pemecatan + kembalikan uang — tanpa hukuman lain.', just: false },
      { text: 'Penjara 2 tahun + pecat + kembalikan 3× lipat.', just: true },
      { text: 'Peringatan keras saja — ada koneksi keluarga.', just: false },
      { text: 'Kerja paksa seumur hidup.', just: false }
    ],
    justOutcome: 'Tepat. Anda tidak membiarkan koneksi keluarga mempengaruhi keadilan — hal langka di Batavia abad ke-18.',
    unjustOutcome: 'Keputusan dipengaruhi faktor non-hukum. Korupsi VOC subur karena impunitas bagi yang punya koneksi.'
  }
];

function setupGameSidang() {
  var container = document.getElementById('game-sidang');
  if (!container) return;

  var caseIdx = 0, justScore = 0;
  var caseEl     = document.getElementById('sidang-case');
  var curEl      = document.getElementById('sidang-cur');
  var scoreEl    = document.getElementById('sidang-score');
  var resultEl   = document.getElementById('sidang-result');
  var verdictEl  = document.getElementById('sidang-verdict');
  var restartBtn = document.getElementById('sidang-restart');

  function loadCase() {
    if (caseIdx >= SIDANG_CASES.length) { showVerdict(); return; }
    var c = SIDANG_CASES[caseIdx];
    if (curEl) curEl.textContent = caseIdx + 1;
    if (!caseEl) return;

    var choicesHTML = '';
    for (var i = 0; i < c.choices.length; i++) {
      choicesHTML += '<button class="sidang-choice" data-just="' + c.choices[i].just + '">' + c.choices[i].text + '</button>';
    }
    caseEl.innerHTML =
      '<div class="sidang-case-title">' + c.title + '</div>' +
      '<div class="sidang-desc">' + c.desc + '</div>' +
      '<div class="sidang-choices">' + choicesHTML + '</div>' +
      '<div class="sidang-outcome hidden" id="sidang-outcome-text"></div>';

    var btns = caseEl.querySelectorAll('.sidang-choice');
    for (var j = 0; j < btns.length; j++) {
      (function(btn, caseData) {
        btn.addEventListener('click', function() { handleChoice(btn, caseData); });
      })(btns[j], c);
    }
  }

  function handleChoice(btn, c) {
    var allBtns = caseEl.querySelectorAll('.sidang-choice');
    for (var i = 0; i < allBtns.length; i++) allBtns[i].disabled = true;
    var isJust = btn.getAttribute('data-just') === 'true';
    btn.classList.add(isJust ? 'just' : 'unjust');
    if (isJust) justScore++;
    if (scoreEl) scoreEl.textContent = justScore;
    var out = document.getElementById('sidang-outcome-text');
    if (out) { out.textContent = isJust ? c.justOutcome : c.unjustOutcome; out.classList.remove('hidden'); }
    setTimeout(function() { caseIdx++; loadCase(); }, 3000);
  }

  function showVerdict() {
    if (caseEl) caseEl.innerHTML = '';
    if (resultEl) resultEl.classList.remove('hidden');
    var msg = justScore === 3
      ? '⚖️ Sempurna — Hakim paling adil di Batavia!'
      : justScore === 2
        ? '⚖️ Cukup adil — 2 dari 3 keputusan berimbang.'
        : '⚖️ Sistem Anda tidak jauh berbeda dari VOC aslinya.';
    if (verdictEl) verdictEl.textContent = msg;
  }

  if (restartBtn) {
    restartBtn.addEventListener('click', function() {
      caseIdx = 0; justScore = 0;
      if (scoreEl) scoreEl.textContent = '0';
      if (resultEl) resultEl.classList.add('hidden');
      loadCase();
    });
  }
  loadCase();
}

/* ----------------------------------------------------------------
   18. GAME: PETA KONSEP
   ---------------------------------------------------------------- */
function setupGamePetaKonsep() {
  var container = document.getElementById('game-peta-konsep');
  if (!container) return;

  var items = [
    { id:'pk1', text:'Monopoli Rempah',         zone:'ekonomi'    },
    { id:'pk2', text:'Heeren XVII',              zone:'organisasi' },
    { id:'pk3', text:'Korupsi Internal',         zone:'kejatuhan'  },
    { id:'pk4', text:'Hongi Tochten',            zone:'ekonomi'    },
    { id:'pk5', text:'Octrooi 1602',             zone:'organisasi' },
    { id:'pk6', text:'Hutang f.134 Juta',        zone:'kejatuhan'  },
    { id:'pk7', text:'Preanger Stelsel',         zone:'ekonomi'    },
    { id:'pk8', text:'Gouverneur-Generaal',      zone:'organisasi' },
    { id:'pk9', text:'Perang Inggris-Belanda IV',zone:'kejatuhan'  }
  ];
  var zones = ['ekonomi','organisasi','kejatuhan'];
  var labels = { ekonomi:'📊 Sistem Ekonomi', organisasi:'🏛 Struktur Organisasi', kejatuhan:'💸 Faktor Kejatuhan' };
  var placements = {}, checked = false, selected = null;

  function render() {
    var cardsHTML = '';
    for (var i = 0; i < items.length; i++) {
      cardsHTML += '<div class="pk-card" data-id="' + items[i].id + '">' + items[i].text + '</div>';
    }
    var zonesHTML = '';
    for (var z = 0; z < zones.length; z++) {
      zonesHTML += '<div class="pk-zone" data-zone="' + zones[z] + '"><div class="pk-zone-label">' + labels[zones[z]] + '</div><div class="pk-zone-content" id="pkz-' + zones[z] + '"></div></div>';
    }
    container.innerHTML =
      '<div class="pk-instruction">Klik kartu lalu klik zona tujuan.</div>' +
      '<div class="pk-cards-pool" id="pk-pool">' + cardsHTML + '</div>' +
      '<div class="pk-zones">' + zonesHTML + '</div>' +
      '<div class="pk-actions"><button class="game-btn" id="pk-check">✅ Periksa</button><button class="game-btn" id="pk-reset">↺ Ulang</button></div>' +
      '<div class="pk-result hidden" id="pk-result"></div>';

    var cards = container.querySelectorAll('.pk-card');
    for (var i = 0; i < cards.length; i++) {
      (function(card) {
        card.addEventListener('click', function() {
          if (checked) return;
          var all = container.querySelectorAll('.pk-card');
          for (var j = 0; j < all.length; j++) all[j].classList.remove('pk-selected');
          if (selected === card) { selected = null; return; }
          selected = card;
          card.classList.add('pk-selected');
        });
      })(cards[i]);
    }

    var zoneEls = container.querySelectorAll('.pk-zone');
    for (var z = 0; z < zoneEls.length; z++) {
      (function(zone) {
        zone.addEventListener('click', function() {
          if (!selected || checked) return;
          var zName = zone.getAttribute('data-zone');
          var id    = selected.getAttribute('data-id');
          placements[id] = zName;
          selected.classList.remove('pk-selected');
          var zc = document.getElementById('pkz-' + zName);
          if (zc) zc.appendChild(selected);
          selected = null;
        });
      })(zoneEls[z]);
    }

    var checkBtn = document.getElementById('pk-check');
    if (checkBtn) {
      checkBtn.addEventListener('click', function() {
        if (checked) return;
        checked = true;
        var correct = 0;
        for (var i = 0; i < items.length; i++) {
          var card = container.querySelector('[data-id="' + items[i].id + '"]');
          if (!card) continue;
          if (placements[items[i].id] === items[i].zone) { card.classList.add('pk-correct'); correct++; }
          else card.classList.add('pk-wrong');
        }
        var res = document.getElementById('pk-result');
        if (res) {
          res.classList.remove('hidden');
          res.innerHTML = '<strong>' + correct + '/' + items.length + ' benar.</strong> ' +
            (correct >= 7 ? '🏆 Luar biasa!' : correct >= 4 ? '👍 Cukup baik!' : '📚 Pelajari ulang materi VOC.');
        }
      });
    }

    var resetBtn = document.getElementById('pk-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', function() { placements={}; checked=false; selected=null; render(); });
    }
  }
  render();
}

/* ----------------------------------------------------------------
   19. GAME: TIMELINE SORT
   ---------------------------------------------------------------- */
function setupGameTimeline() {
  var container = document.getElementById('game-timeline');
  if (!container) return;

  var events = [
    { year:1511, text:'Portugis merebut Malaka' },
    { year:1596, text:'Ekspedisi de Houtman tiba di Banten' },
    { year:1602, text:'VOC resmi berdiri' },
    { year:1619, text:'Batavia didirikan di atas Jayakarta' },
    { year:1621, text:'Pembantaian Banda oleh J.P. Coen' },
    { year:1667, text:'Perjanjian Bongaya — Makassar takluk' },
    { year:1740, text:'Pembantaian Cina di Batavia' },
    { year:1799, text:'VOC resmi dibubarkan' }
  ];

  var userOrder = shuffleArr(events.slice());
  var draggingIdx = null, overIdx = null;

  function render() {
    var listHTML = '';
    for (var i = 0; i < userOrder.length; i++) {
      listHTML += '<div class="tl-item" data-idx="' + i + '" draggable="true"><span class="tl-drag">⋮⋮</span><span class="tl-text">' + userOrder[i].text + '</span></div>';
    }
    container.innerHTML =
      '<div class="tl-instruction">Urutkan dari paling awal (atas) ke paling akhir (bawah). Seret ikon ⋮⋮.</div>' +
      '<div class="tl-list" id="tl-list">' + listHTML + '</div>' +
      '<div class="tl-actions"><button class="game-btn" id="tl-check">✅ Periksa</button><button class="game-btn" id="tl-reset">↺ Acak Ulang</button></div>' +
      '<div class="tl-result hidden" id="tl-result"></div>';

    var list = document.getElementById('tl-list');
    var tItems = list.querySelectorAll('.tl-item');
    for (var i = 0; i < tItems.length; i++) {
      (function(item, idx) {
        item.addEventListener('dragstart', function() { draggingIdx = idx; item.classList.add('tl-dragging'); });
        item.addEventListener('dragend',   function() { draggingIdx = null; item.classList.remove('tl-dragging'); render(); });
        item.addEventListener('dragover',  function(e) { e.preventDefault(); overIdx = idx; item.classList.add('tl-over'); });
        item.addEventListener('dragleave', function() { item.classList.remove('tl-over'); });
        item.addEventListener('drop', function() {
          if (draggingIdx === null || draggingIdx === idx) return;
          var moved = userOrder.splice(draggingIdx, 1)[0];
          userOrder.splice(idx, 0, moved);
          draggingIdx = null; overIdx = null;
          render();
        });
      })(tItems[i], i);
    }

    var chk = document.getElementById('tl-check');
    if (chk) {
      chk.addEventListener('click', function() {
        var sorted = events.slice().sort(function(a,b){ return a.year - b.year; });
        var correct = 0;
        var tItems2 = list.querySelectorAll('.tl-item');
        for (var i = 0; i < tItems2.length; i++) {
          if (userOrder[i].year === sorted[i].year) { tItems2[i].classList.add('tl-correct'); correct++; }
          else tItems2[i].classList.add('tl-wrong');
        }
        var res = document.getElementById('tl-result');
        if (res) {
          res.classList.remove('hidden');
          res.innerHTML = '<strong>' + correct + '/' + events.length + ' urutan benar.</strong> ' +
            (correct === events.length ? '🏆 Sempurna!' : 'Coba lagi setelah reset.');
        }
      });
    }

    var rst = document.getElementById('tl-reset');
    if (rst) { rst.addEventListener('click', function() { userOrder = shuffleArr(events.slice()); render(); }); }
  }
  render();
}

/* ----------------------------------------------------------------
   20. GAME: KALKULATOR MONOPOLI
   ---------------------------------------------------------------- */
function setupGameKalkulator() {
  var container = document.getElementById('game-kalkulator');
  if (!container) return;

  container.innerHTML =
    '<div style="font-family:var(--font-body);font-size:0.82rem;line-height:1.6;color:var(--ink);margin-bottom:12px">' +
    '<p>Kamu adalah <em>koopman</em> VOC. Beli cengkeh di Ambon, jual di Amsterdam. Hitung keuntungannya.</p></div>' +
    '<div style="display:flex;flex-direction:column;gap:8px;margin-bottom:12px">' +
    '<div style="display:flex;justify-content:space-between;align-items:center"><label style="font-family:var(--font-body);font-size:0.8rem">Berat (pikul):</label><input type="number" id="kk-berat" value="100" min="1" style="width:80px;padding:3px 6px;font-family:var(--font-body);border:1px solid var(--gold-dark);background:var(--paper-light)"/></div>' +
    '<div style="display:flex;justify-content:space-between;align-items:center"><label style="font-family:var(--font-body);font-size:0.8rem">Harga beli Ambon (f./pikul):</label><input type="number" id="kk-beli" value="3" min="0.5" step="0.5" style="width:80px;padding:3px 6px;font-family:var(--font-body);border:1px solid var(--gold-dark);background:var(--paper-light)"/></div>' +
    '<div style="display:flex;justify-content:space-between;align-items:center"><label style="font-family:var(--font-body);font-size:0.8rem">Harga jual Amsterdam (f./pikul):</label><input type="number" id="kk-jual" value="20" min="0.5" step="0.5" style="width:80px;padding:3px 6px;font-family:var(--font-body);border:1px solid var(--gold-dark);background:var(--paper-light)"/></div>' +
    '<div style="display:flex;justify-content:space-between;align-items:center"><label style="font-family:var(--font-body);font-size:0.8rem">Biaya operasional (f.):</label><input type="number" id="kk-biaya" value="500" min="0" style="width:80px;padding:3px 6px;font-family:var(--font-body);border:1px solid var(--gold-dark);background:var(--paper-light)"/></div>' +
    '</div>' +
    '<button class="game-btn" id="kk-hitung">🧮 Hitung Keuntungan</button>' +
    '<div class="hidden" id="kk-result" style="margin-top:10px"></div>';

  var btn = document.getElementById('kk-hitung');
  if (btn) {
    btn.addEventListener('click', function() {
      var berat = parseFloat(document.getElementById('kk-berat').value) || 0;
      var beli  = parseFloat(document.getElementById('kk-beli').value)  || 0;
      var jual  = parseFloat(document.getElementById('kk-jual').value)  || 0;
      var biaya = parseFloat(document.getElementById('kk-biaya').value) || 0;
      var totalBeli = berat * beli;
      var totalJual = berat * jual;
      var profit    = totalJual - totalBeli - biaya;
      var margin    = (totalBeli + biaya) > 0 ? ((profit / (totalBeli + biaya)) * 100).toFixed(1) : 0;
      var res = document.getElementById('kk-result');
      if (res) {
        res.classList.remove('hidden');
        res.innerHTML =
          '<table class="data-table">' +
          '<tr><td>Modal beli</td><td><strong>f. ' + totalBeli.toLocaleString('nl-NL') + ',–</strong></td></tr>' +
          '<tr><td>Hasil jual</td><td><strong>f. ' + totalJual.toLocaleString('nl-NL') + ',–</strong></td></tr>' +
          '<tr><td>Biaya operasional</td><td><strong>f. ' + biaya.toLocaleString('nl-NL') + ',–</strong></td></tr>' +
          '<tr><td><strong>Keuntungan bersih</strong></td><td><strong style="color:' + (profit > 0 ? '#004400' : '#7a1f1f') + '">f. ' + profit.toLocaleString('nl-NL') + ',–</strong></td></tr>' +
          '<tr><td>Margin</td><td><strong>' + margin + '%</strong></td></tr>' +
          '</table>' +
          '<p style="margin-top:8px;font-style:italic;font-size:0.78rem;color:var(--ink-fade)">' +
          (profit > 5000 ? '🏆 Sangat menguntungkan! Inilah mengapa VOC bisa membayar dividen 40–75%.' :
           profit > 0    ? '👍 Untung, tapi tipis.' :
                           '❌ Merugi — inilah yang menenggelamkan VOC.') +
          '</p>';
      }
    });
  }
}

/* ----------------------------------------------------------------
   21. SWIPE HINT
   ---------------------------------------------------------------- */
function showSwipeHint() {
  try { if (localStorage.getItem('ivh_swipe_hint') === '1') return; } catch(e) {}
  var el = document.getElementById('swipe-hint');
  if (!el) {
    el = document.createElement('div');
    el.id = 'swipe-hint';
    el.textContent = 'PC: klik-tahan + geser  ·  HP/Tablet: swipe';
    document.body.appendChild(el);
  }
  el.classList.add('show');
  setTimeout(function() { el.classList.remove('show'); }, 3000);
  try { localStorage.setItem('ivh_swipe_hint', '1'); } catch(e) {}
}

/* ----------------------------------------------------------------
   22. MAIN INIT
   ---------------------------------------------------------------- */
function init() {
  grabDOM();

  /* activate first page */
  if (pages.length > 0) pages[0].classList.add('active');

  /* restore last saved position */
  restorePosition();

  /* bind everything */
  updateUI();
  bindButtons();
  bindKeyboard();
  bindMouseDrag();
  bindTouch();
  bindFilter();
  bindFullscreen();
  bindExport();

  /* interactive features */
  setupTooltips();
  setupPG();
  setupGameTebakTokoh();
  setupGameSidang();
  setupGamePetaKonsep();
  setupGameTimeline();
  setupGameKalkulator();

  /* swipe hint after short delay */
  setTimeout(showSwipeHint, 1800);

  /* re-init tooltips & PG after each page turn */
  if (btnPrev) btnPrev.addEventListener('click', function() { setTimeout(function(){ setupTooltips(); setupPG(); }, 150); });
  if (btnNext) btnNext.addEventListener('click', function() { setTimeout(function(){ setupTooltips(); setupPG(); }, 150); });
}

/* ----------------------------------------------------------------
   23. ENTRY POINT
   ---------------------------------------------------------------- */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

})();
