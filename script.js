/* ═══════════════════════════════════════════════════════════
   ILMU SEJARAH VOC — IVH BATAVIA 1926
   book.js — Navigation, Games, Tooltip, Swipe, Export
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ──────────────────────────────────────────────
     CONFIG — detect which part file we're on
  ────────────────────────────────────────────── */
  const filename = location.pathname.split('/').pop() || 'part1.html';
  const PART = filename.includes('part2') ? 2 : filename.includes('part3') ? 3 : 1;
  const PAGES_PER_PART = 30;
  const TOTAL_PAGES = 80;
  const partOffset = (PART - 1) * PAGES_PER_PART; // 0, 30, 60

  /* ──────────────────────────────────────────────
     STATE
  ────────────────────────────────────────────── */
  let currentIdx = 0; // index in THIS part's pages array (0-based)
  let isDragging = false;
  let dragStartX = 0;
  let dragThreshold = 60;
  let swipeHintShown = localStorage.getItem('ivh_swipe_hint') === '1';

  /* ──────────────────────────────────────────────
     DOM REFS
  ────────────────────────────────────────────── */
  const pages       = Array.from(document.querySelectorAll('.page'));
  const btnPrev     = document.getElementById('btn-prev');
  const btnNext     = document.getElementById('btn-next');
  const curEl       = document.getElementById('cur');
  const progressFill= document.getElementById('progress-fill');
  const btnFilter   = document.getElementById('btn-filter');
  const btnExport   = document.getElementById('btn-export');
  const btnFS       = document.getElementById('btn-fs');
  const tooltipBox  = document.getElementById('tooltip-box');
  const exportOverlay  = document.getElementById('export-overlay');
  const exportCancel   = document.getElementById('export-cancel');
  const exportPageNum  = document.getElementById('export-page-num');
  const exportProgress = document.getElementById('export-progress');
  const bookStage   = document.getElementById('book-stage');

  const totalLocal  = pages.length; // pages in this part

  /* ──────────────────────────────────────────────
     SWIPE HINT
  ────────────────────────────────────────────── */
  function injectSwipeHint() {
    if (document.getElementById('swipe-hint')) return;
    const el = document.createElement('div');
    el.id = 'swipe-hint';
    el.textContent = 'PC: klik-tahan + geser  ·  HP/Tablet: swipe';
    document.body.appendChild(el);
  }
  function showSwipeHint() {
    if (swipeHintShown) return;
    injectSwipeHint();
    const el = document.getElementById('swipe-hint');
    el.classList.add('show');
    setTimeout(() => { el.classList.remove('show'); }, 3000);
    swipeHintShown = true;
    localStorage.setItem('ivh_swipe_hint', '1');
  }

  /* ──────────────────────────────────────────────
     NAVIGATE
  ────────────────────────────────────────────── */
  function goTo(idx, dir) {
    if (idx < 0 || idx >= totalLocal) return;
    const prev = pages[currentIdx];
    const next = pages[idx];

    prev.classList.add(dir === 'next' ? 'exit-left' : 'exit-right');
    prev.classList.remove('active');
    setTimeout(() => prev.classList.remove('exit-left', 'exit-right'), 400);

    next.classList.remove('exit-left', 'exit-right');
    next.classList.add('active');
    currentIdx = idx;
    updateUI();
    window.scrollTo(0, 0);
    next.scrollTop = 0;
  }

  function goNext() { goTo(currentIdx + 1, 'next'); }
  function goPrev() { goTo(currentIdx - 1, 'prev'); }

  /* ──────────────────────────────────────────────
     UPDATE UI
  ────────────────────────────────────────────── */
  function updateUI() {
    const localPage = currentIdx + 1; // 1-based local
    const globalPage = partOffset + localPage; // 1-based global

    if (curEl) curEl.textContent = globalPage;

    // progress = globalPage / TOTAL_PAGES * 100
    if (progressFill) {
      progressFill.style.width = ((globalPage / TOTAL_PAGES) * 100).toFixed(2) + '%';
    }

    if (btnPrev) btnPrev.disabled = (currentIdx === 0 && PART === 1);
    if (btnNext) btnNext.disabled = (currentIdx === totalLocal - 1 && PART === 3);

    // Update page counter label
    const counterEl = document.getElementById('page-counter');
    if (counterEl) counterEl.innerHTML = `Hal. <span id="cur">${globalPage}</span> / ${TOTAL_PAGES}`;

    // localStorage bookmark
    localStorage.setItem('ivh_last_page', globalPage);
    localStorage.setItem('ivh_last_part', PART);
  }

  /* ──────────────────────────────────────────────
     CROSS-PART NAVIGATION (prev/next part)
  ────────────────────────────────────────────── */
  function handleEdgeNavigation(dir) {
    if (dir === 'next' && currentIdx === totalLocal - 1) {
      if (PART < 3) { location.href = 'part' + (PART + 1) + '.html'; }
      return true;
    }
    if (dir === 'prev' && currentIdx === 0) {
      if (PART > 1) { location.href = 'part' + (PART - 1) + '.html'; }
      return true;
    }
    return false;
  }

  /* ──────────────────────────────────────────────
     BUTTON CLICKS
  ────────────────────────────────────────────── */
  if (btnPrev) btnPrev.addEventListener('click', () => {
    if (!handleEdgeNavigation('prev')) goPrev();
  });
  if (btnNext) btnNext.addEventListener('click', () => {
    if (!handleEdgeNavigation('next')) goNext();
  });

  /* ──────────────────────────────────────────────
     KEYBOARD
  ────────────────────────────────────────────── */
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown') {
      e.preventDefault();
      if (!handleEdgeNavigation('next')) goNext();
    }
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      e.preventDefault();
      if (!handleEdgeNavigation('prev')) goPrev();
    }
  });

  /* ──────────────────────────────────────────────
     MOUSE DRAG SWIPE (PC: click-hold + drag)
  ────────────────────────────────────────────── */
  if (bookStage) {
    bookStage.addEventListener('mousedown', (e) => {
      if (e.button !== 0 && e.button !== 2) return;
      isDragging = true;
      dragStartX = e.clientX;
      e.preventDefault();
    });

    document.addEventListener('mouseup', (e) => {
      if (!isDragging) return;
      isDragging = false;
      const dx = e.clientX - dragStartX;
      if (Math.abs(dx) > dragThreshold) {
        if (dx < 0) { if (!handleEdgeNavigation('next')) goNext(); }
        else { if (!handleEdgeNavigation('prev')) goPrev(); }
      }
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      e.preventDefault();
    });

    // Prevent context menu on right-click drag
    bookStage.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  /* ──────────────────────────────────────────────
     TOUCH SWIPE (HP/Tablet)
  ────────────────────────────────────────────── */
  let touchStartX = 0;
  let touchStartY = 0;

  document.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  document.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    // Only swipe if horizontal > vertical (not a scroll)
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > dragThreshold) {
      if (dx < 0) { if (!handleEdgeNavigation('next')) goNext(); }
      else { if (!handleEdgeNavigation('prev')) goPrev(); }
    }
  }, { passive: true });

  /* ──────────────────────────────────────────────
     TOOLTIP (.nl elements)
  ────────────────────────────────────────────── */
  function setupTooltips() {
    if (!tooltipBox) return;
    document.querySelectorAll('.nl[data-tip]').forEach(el => {
      el.addEventListener('mouseenter', (e) => {
        tooltipBox.textContent = el.dataset.tip;
        tooltipBox.classList.add('show');
        positionTooltip(e);
      });
      el.addEventListener('mousemove', positionTooltip);
      el.addEventListener('mouseleave', () => tooltipBox.classList.remove('show'));
    });
  }

  function positionTooltip(e) {
    if (!tooltipBox) return;
    const x = e.clientX + 12;
    const y = e.clientY - 8;
    const tw = tooltipBox.offsetWidth;
    const th = tooltipBox.offsetHeight;
    tooltipBox.style.left = (x + tw > window.innerWidth - 10 ? x - tw - 20 : x) + 'px';
    tooltipBox.style.top  = (y + th > window.innerHeight - 10 ? y - th - 10 : y) + 'px';
  }

  /* ──────────────────────────────────────────────
     FILTER TOGGLE (sepia / normal)
  ────────────────────────────────────────────── */
  let filterOn = true;
  if (btnFilter) btnFilter.addEventListener('click', () => {
    filterOn = !filterOn;
    document.body.classList.toggle('filter-off', !filterOn);
    btnFilter.textContent = filterOn ? '🎞 Filter' : '🎞 Normal';
  });

  /* ──────────────────────────────────────────────
     FULLSCREEN
  ────────────────────────────────────────────── */
  if (btnFS) btnFS.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      btnFS.textContent = '✕ Keluar';
    } else {
      document.exitFullscreen().catch(() => {});
      btnFS.textContent = '⛶';
    }
  });

  /* ──────────────────────────────────────────────
     EXPORT PNG (html2canvas via CDN)
  ────────────────────────────────────────────── */
  function loadHtml2Canvas(cb) {
    if (window.html2canvas) { cb(); return; }
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    s.onload = cb;
    s.onerror = () => { alert('Gagal memuat library ekspor. Periksa koneksi internet.'); };
    document.head.appendChild(s);
  }

  if (btnExport) btnExport.addEventListener('click', () => {
    const globalPage = partOffset + currentIdx + 1;
    if (exportPageNum) exportPageNum.textContent = globalPage;
    if (exportProgress) exportProgress.textContent = 'Memuat library...';
    if (exportOverlay) exportOverlay.classList.remove('hidden');

    loadHtml2Canvas(() => {
      if (exportProgress) exportProgress.textContent = 'Merender halaman...';
      const activePage = pages[currentIdx];
      html2canvas(activePage, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#e8dcc8',
        width: 720,
        height: 960,
        logging: false
      }).then(canvas => {
        if (exportProgress) exportProgress.textContent = 'Mengunduh...';
        canvas.toBlob(blob => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `IVH-SejarahVOC-hal${globalPage}.png`;
          a.click();
          URL.revokeObjectURL(url);
          if (exportOverlay) exportOverlay.classList.add('hidden');
        }, 'image/png');
      }).catch(err => {
        console.error(err);
        if (exportProgress) exportProgress.textContent = 'Gagal mengekspor. Coba lagi.';
      });
    });
  });

  if (exportCancel) exportCancel.addEventListener('click', () => {
    if (exportOverlay) exportOverlay.classList.add('hidden');
  });

  /* ──────────────────────────────────────────────
     PILIHAN GANDA (click-to-reveal mode)
  ────────────────────────────────────────────── */
  function setupPG() {
    document.querySelectorAll('.soal-item').forEach(item => {
      const correct = item.dataset.answer;
      const opts = item.querySelectorAll('.opt');
      const explanation = item.querySelector('.soal-explanation');
      let answered = false;
      opts.forEach(opt => {
        opt.addEventListener('click', () => {
          if (answered) return;
          answered = true;
          const chosen = opt.dataset.opt;
          if (chosen === correct) {
            opt.classList.add('selected-correct');
          } else {
            opt.classList.add('selected-wrong');
            opts.forEach(o => {
              if (o.dataset.opt === correct) o.classList.add('selected-correct');
            });
          }
          if (explanation) explanation.classList.remove('hidden');
        });
      });
    });
  }

  /* ──────────────────────────────────────────────
     GAME: TEBAK TOKOH VOC
  ────────────────────────────────────────────── */
  const TOKOH_DATA = [
    {
      clues: [
        'Lahir di kota kecil Holland, bukan dari keluarga bangsawan.',
        'Pernah magang akuntansi di Roma selama 6 tahun.',
        'Memerintahkan penghancuran sebuah kota Jawa dan membangun kota baru di atasnya.'
      ],
      answer: 'Jan Pieterszoon Coen',
      options: ['Johan van Oldenbarnevelt', 'Jan Pieterszoon Coen', 'Antonio van Diemen', 'Cornelis Speelman'],
      fact: 'J.P. Coen adalah GG VOC ke-4 & ke-6, pendiri Batavia (1619), dan arsitek pembantaian Banda (1621).'
    },
    {
      clues: [
        'Seorang negarawan Belanda yang tidak pernah berlayar ke Hindia.',
        'Berhasil meyakinkan enam kongsi bersaing untuk bergabung menjadi satu.',
        'Nama lengkapnya terhubung dengan sebuah wilayah di Belanda yang juga menjadi nama ibu kota sebuah republik.'
      ],
      answer: 'Johan van Oldenbarnevelt',
      options: ['Pieter Both', 'Johan van Oldenbarnevelt', 'Jan Pieterszoon Coen', 'Wijbrand van Warwijck'],
      fact: 'Johan van Oldenbarnevelt adalah arsitek penggabungan voorcompagnieën menjadi VOC pada 20 Maret 1602.'
    },
    {
      clues: [
        'GG VOC ke-16, menjabat sangat lama — lebih dari dua dekade.',
        'Di bawah kepemimpinannya, VOC merebut sebuah pelabuhan bebas di Sulawesi Selatan.',
        'Namanya terkait erat dengan sebuah perjanjian pada tahun 1667 yang membubarkan perlawanan "Ayam Jantan dari Timur".'
      ],
      answer: 'Joan Maetsuyker',
      options: ['Joan Maetsuyker', 'Rijklof van Goens', 'Adriaan Valckenier', 'Jacob Mossel'],
      fact: 'Joan Maetsuyker (GG 1653–1678) memimpin penaklukan Makassar dan memaksa Sultan Hasanuddin menandatangani Perjanjian Bongaya.'
    },
    {
      clues: [
        'Tokoh ini bukan orang Belanda dan bukan pula orang Jawa.',
        'Ia memimpin kerajaan di Sulawesi Selatan yang lama menjadi surga bagi pedagang bebas.',
        'Dijuluki "Ayam Jantan dari Timur" karena keberaniannya melawan VOC meski akhirnya kalah.'
      ],
      answer: 'Sultan Hasanuddin',
      options: ['Arung Palakka', 'Sultan Hasanuddin', 'Sultan Agung', 'Pangeran Wijayakrama'],
      fact: 'Sultan Hasanuddin adalah Raja Gowa-Tallo yang dipaksa menandatangani Perjanjian Bongaya 1667 setelah dikalahkan koalisi VOC-Bone.'
    },
    {
      clues: [
        'Raja dari kerajaan terbesar di Jawa pada abad ke-17.',
        'Melakukan dua kali serangan besar ke sebuah kota di pesisir utara Jawa — keduanya gagal.',
        'Meski gagal dalam serangan itu, ia tetap berhasil memperluas kerajaannya ke timur Jawa.'
      ],
      answer: 'Sultan Agung',
      options: ['Sultan Agung', 'Amangkurat I', 'Panembahan Senopati', 'Sultan Hamengkubuwono I'],
      fact: 'Sultan Agung dari Mataram menyerang Batavia dua kali (1628 & 1629) namun gagal — kekurangan bekal menjadi penyebab utama kegagalan.'
    }
  ];

  function setupGameTebakTokoh() {
    const container = document.getElementById('game-tebak-tokoh');
    if (!container) return;

    let score = 0;
    let round = 0;
    let cluesShown = 0;
    let answered = false;

    const scoreEl   = document.getElementById('tbt-score');
    const roundEl   = document.getElementById('tbt-round');
    const cluesEl   = document.getElementById('tbt-clues');
    const optsEl    = document.getElementById('tbt-options');
    const feedbackEl= document.getElementById('tbt-feedback');
    const hintBtn   = document.getElementById('tbt-hint');
    const finalEl   = document.getElementById('tbt-final');
    const finalScore= document.getElementById('tbt-final-score');
    const gradeEl   = document.getElementById('tbt-grade');
    const cardEl    = document.getElementById('tbt-card');
    const restartBtn= document.getElementById('tbt-restart');
    const playAgain = document.getElementById('tbt-play-again');

    function shuffle(arr) {
      return [...arr].sort(() => Math.random() - 0.5);
    }

    function loadRound() {
      if (round >= TOKOH_DATA.length) { showFinal(); return; }
      const q = TOKOH_DATA[round];
      cluesShown = 1;
      answered = false;
      if (feedbackEl) { feedbackEl.classList.add('hidden'); feedbackEl.textContent = ''; }
      if (hintBtn) hintBtn.disabled = false;

      // Render clues
      renderClues(q);

      // Render options
      if (optsEl) {
        optsEl.innerHTML = '';
        shuffle(q.options).forEach(opt => {
          const btn = document.createElement('button');
          btn.className = 'tbt-option';
          btn.textContent = opt;
          btn.addEventListener('click', () => handleAnswer(opt, q, btn));
          optsEl.appendChild(btn);
        });
      }
      if (roundEl) roundEl.textContent = round + 1;
    }

    function renderClues(q) {
      if (!cluesEl) return;
      cluesEl.innerHTML = '';
      for (let i = 0; i < cluesShown; i++) {
        const div = document.createElement('div');
        div.className = 'clue-item';
        div.innerHTML = `<span class="clue-num">Petunjuk ${i+1}:</span> ${q.clues[i]}`;
        cluesEl.appendChild(div);
      }
    }

    function handleAnswer(chosen, q, btnEl) {
      if (answered) return;
      answered = true;
      if (hintBtn) hintBtn.disabled = true;
      const pts = cluesShown === 1 ? 3 : cluesShown === 2 ? 2 : 1;
      if (chosen === q.answer) {
        score += pts;
        if (scoreEl) scoreEl.textContent = score;
        btnEl.classList.add('correct');
        if (feedbackEl) {
          feedbackEl.innerHTML = `✅ <strong>Benar!</strong> +${pts} poin<br/><em>${q.fact}</em>`;
          feedbackEl.classList.remove('hidden');
        }
      } else {
        btnEl.classList.add('wrong');
        // Show correct
        if (optsEl) Array.from(optsEl.children).forEach(b => {
          if (b.textContent === q.answer) b.classList.add('correct');
        });
        if (feedbackEl) {
          feedbackEl.innerHTML = `❌ <strong>Salah.</strong> Jawaban yang benar: <em>${q.answer}</em><br/>${q.fact}`;
          feedbackEl.classList.remove('hidden');
        }
      }
      setTimeout(() => { round++; loadRound(); }, 2500);
    }

    if (hintBtn) hintBtn.addEventListener('click', () => {
      const q = TOKOH_DATA[round];
      if (cluesShown < q.clues.length) {
        cluesShown++;
        renderClues(q);
        if (cluesShown >= q.clues.length) hintBtn.disabled = true;
      }
    });

    function showFinal() {
      if (cardEl) cardEl.classList.add('hidden');
      if (finalEl) finalEl.classList.remove('hidden');
      if (finalScore) finalScore.textContent = score;
      const maxScore = TOKOH_DATA.length * 3;
      let grade = '';
      if (score >= maxScore * 0.8) grade = '🏆 Sangat Baik — Anda layak menjadi Commissaris VOC!';
      else if (score >= maxScore * 0.5) grade = '👍 Cukup Baik — Terus pelajari sejarah VOC.';
      else grade = '📚 Perlu Belajar Lagi — Baca ulang materi Bab 1.';
      if (gradeEl) gradeEl.textContent = grade;
    }

    function resetGame() {
      score = 0; round = 0;
      if (scoreEl) scoreEl.textContent = '0';
      if (cardEl) cardEl.classList.remove('hidden');
      if (finalEl) finalEl.classList.add('hidden');
      loadRound();
    }

    if (restartBtn) restartBtn.addEventListener('click', resetGame);
    if (playAgain) playAgain.addEventListener('click', resetGame);

    loadRound();
  }

  /* ──────────────────────────────────────────────
     GAME: SIDANG RAAD VAN JUSTITIE
  ────────────────────────────────────────────── */
  const SIDANG_CASES = [
    {
      title: 'Kasus I — Pedagang Tionghoa & Penjualan Cengkeh Gelap',
      desc: 'Seorang pedagang Tionghoa bernama Tan Boen Siang ditangkap karena menjual 12 pikul cengkeh kepada kapal Inggris yang bersandar diam-diam di Ommelanden. Ia mengaku tidak tahu bahwa ini melanggar monopoli VOC. Keluarganya miskin dan ia menjual cengkeh untuk membayar hutang.',
      choices: [
        { text: 'Bebaskan — ketidaktahuan adalah dalih yang masuk akal untuk kasus pertama.', just: true },
        { text: 'Denda berat (f. 200) tanpa penjara — hukuman proporsional.', just: true },
        { text: 'Hukum mati — sebagai efek jera bagi pedagang lain.', just: false },
        { text: 'Kerja paksa 2 tahun di galangan kapal VOC.', just: false }
      ],
      justOutcome: 'Keputusan Anda dinilai proporsional. Catatan sejarah menunjukkan bahwa Raad van Justitie abad ke-17 memang sering membedakan pelanggaran pertama dengan pelanggaran berulang.',
      unjustOutcome: 'Keputusan Anda berlebihan. Hukuman berat untuk pelanggaran pertama tanpa bukti niat jahat mencerminkan sistem keadilan yang tidak seimbang — salah satu faktor yang memperkuat perlawanan terhadap VOC.'
    },
    {
      title: 'Kasus II — Tentara VOC yang Desersi',
      desc: 'Seorang serdadu bayaran Jerman bernama Hans Krug melarikan diri dari pos di Amboina dan tinggal tiga bulan bersama komunitas lokal. Ia menyerahkan diri secara sukarela setelah mengetahui bahwa ada amnesti. Ia mengklaim sakit saat melarikan diri.',
      choices: [
        { text: 'Bebaskan sepenuhnya karena ia menyerahkan diri dan sakit.', just: true },
        { text: 'Pemotongan gaji 6 bulan — hukuman administratif yang wajar.', just: true },
        { text: 'Cambuk 50 kali di depan umum.', just: false },
        { text: 'Eksekusi mati — desersi adalah pengkhianatan.', just: false }
      ],
      justOutcome: 'Keputusan yang berimbang. Desersi memang serius, namun penyerahan diri sukarela seharusnya menjadi faktor keringanan hukuman.',
      unjustOutcome: 'Hukuman ini sangat berat. Dalam catatan historis, tentara bayaran VOC yang kelelahan sering dieksekusi tanpa proses adil — praktik yang melemahkan moral pasukan secara keseluruhan.'
    },
    {
      title: 'Kasus III — Pejabat VOC yang Korupsi',
      desc: 'Seorang boekhouder (pemegang buku) tingkat menengah terbukti menggelapkan f. 1.200 selama tiga tahun dengan cara memanipulasi catatan persediaan. Ia adalah menantu dari seorang anggota Raad van Indië.',
      choices: [
        { text: 'Pemecatan dan pengembalian uang penuh — tanpa hukuman lain.', just: false },
        { text: 'Penjara 2 tahun, pemecatan, dan pengembalian uang 3× lipat.', just: true },
        { text: 'Hanya peringatan keras — mengingat koneksi keluarganya.', just: false },
        { text: 'Kerja paksa seumur hidup.', just: false }
      ],
      justOutcome: 'Keputusan yang tepat. Anda tidak membiarkan koneksi keluarga mempengaruhi keadilan — sayangnya, hal ini justru sangat langka di Batavia abad ke-18.',
      unjustOutcome: 'Keputusan Anda dipengaruhi oleh faktor non-hukum (koneksi keluarga atau hukuman berlebihan). Korupsi sistemik VOC tumbuh subur karena impunitas bagi yang punya koneksi — atau karena hukuman tidak konsisten.'
    }
  ];

  function setupGameSidang() {
    const container = document.getElementById('game-sidang');
    if (!container) return;

    let caseIdx = 0;
    let justScore = 0;

    const caseEl   = document.getElementById('sidang-case');
    const curEl2   = document.getElementById('sidang-cur');
    const scoreEl2 = document.getElementById('sidang-score');
    const resultEl = document.getElementById('sidang-result');
    const verdictEl= document.getElementById('sidang-verdict');
    const restartBtn= document.getElementById('sidang-restart');

    function loadCase() {
      if (caseIdx >= SIDANG_CASES.length) { showVerdict(); return; }
      const c = SIDANG_CASES[caseIdx];
      if (curEl2) curEl2.textContent = caseIdx + 1;
      if (!caseEl) return;
      caseEl.innerHTML = `
        <div class="sidang-case-title">${c.title}</div>
        <div class="sidang-desc">${c.desc}</div>
        <div class="sidang-choices">
          ${c.choices.map((ch, i) =>
            `<button class="sidang-choice" data-just="${ch.just}" data-idx="${i}">${ch.text}</button>`
          ).join('')}
        </div>
        <div class="sidang-outcome hidden" id="sidang-outcome-text"></div>
      `;
      caseEl.querySelectorAll('.sidang-choice').forEach(btn => {
        btn.addEventListener('click', () => handleChoice(btn, c));
      });
    }

    function handleChoice(btn, c) {
      caseEl.querySelectorAll('.sidang-choice').forEach(b => b.disabled = true);
      const isJust = btn.dataset.just === 'true';
      btn.classList.add(isJust ? 'just' : 'unjust');
      if (isJust) justScore++;
      if (scoreEl2) scoreEl2.textContent = justScore;

      const outcomeEl = document.getElementById('sidang-outcome-text');
      if (outcomeEl) {
        outcomeEl.textContent = isJust ? c.justOutcome : c.unjustOutcome;
        outcomeEl.classList.remove('hidden');
      }
      setTimeout(() => { caseIdx++; loadCase(); }, 3000);
    }

    function showVerdict() {
      if (caseEl) caseEl.innerHTML = '';
      if (resultEl) resultEl.classList.remove('hidden');
      let msg = '';
      if (justScore === 3) msg = '⚖️ Sempurna — Anda adalah hakim yang adil! Sayangnya, hakim seperti Anda sangat langka di Batavia abad ke-18.';
      else if (justScore === 2) msg = '⚖️ Cukup adil — dua dari tiga keputusan Anda berimbang. Satu keputusan yang kurang adil sudah cukup untuk mengubah nasib seseorang.';
      else msg = '⚖️ Sistem yang Anda jalankan tidak jauh berbeda dari VOC yang sebenarnya — keadilan dikompromikan oleh kepentingan atau kekuasaan.';
      if (verdictEl) verdictEl.textContent = msg;
    }

    if (restartBtn) restartBtn.addEventListener('click', () => {
      caseIdx = 0; justScore = 0;
      if (scoreEl2) scoreEl2.textContent = '0';
      if (resultEl) resultEl.classList.add('hidden');
      loadCase();
    });

    loadCase();
  }

  /* ──────────────────────────────────────────────
     GAME: PETA KONSEP DRAG-AND-DROP (Part 2)
  ────────────────────────────────────────────── */
  function setupGamePetaKonsep() {
    const container = document.getElementById('game-peta-konsep');
    if (!container) return;

    const items = [
      { id: 'pk1', text: 'Monopoli Rempah', zone: 'ekonomi' },
      { id: 'pk2', text: 'Heeren XVII', zone: 'organisasi' },
      { id: 'pk3', text: 'Korupsi Internal', zone: 'kejatuhan' },
      { id: 'pk4', text: 'Hongi Tochten', zone: 'ekonomi' },
      { id: 'pk5', text: 'Octrooi 1602', zone: 'organisasi' },
      { id: 'pk6', text: 'Hutang f.134 Juta', zone: 'kejatuhan' },
      { id: 'pk7', text: 'Preanger Stelsel', zone: 'ekonomi' },
      { id: 'pk8', text: 'Gouverneur-Generaal', zone: 'organisasi' },
      { id: 'pk9', text: 'Perang Inggris-Belanda IV', zone: 'kejatuhan' }
    ];

    const zones = ['ekonomi', 'organisasi', 'kejatuhan'];
    const zoneLabels = { ekonomi: '📊 Sistem Ekonomi', organisasi: '🏛 Struktur Organisasi', kejatuhan: '💸 Faktor Kejatuhan' };
    const placements = {}; // id -> zone
    let checked = false;

    container.innerHTML = `
      <div class="pk-instruction">Seret setiap kartu ke kategori yang tepat. Klik kartu lalu klik zona tujuan.</div>
      <div class="pk-cards-pool" id="pk-pool">
        ${items.map(i => `<div class="pk-card" data-id="${i.id}" tabindex="0">${i.text}</div>`).join('')}
      </div>
      <div class="pk-zones">
        ${zones.map(z => `
          <div class="pk-zone" data-zone="${z}">
            <div class="pk-zone-label">${zoneLabels[z]}</div>
            <div class="pk-zone-content" id="pkz-${z}"></div>
          </div>
        `).join('')}
      </div>
      <div class="pk-actions">
        <button class="game-btn" id="pk-check">✅ Periksa Jawaban</button>
        <button class="game-btn" id="pk-reset">↺ Ulang</button>
      </div>
      <div class="pk-result hidden" id="pk-result"></div>
    `;

    let selected = null;

    // Click a card to select
    container.querySelectorAll('.pk-card').forEach(card => {
      card.addEventListener('click', () => {
        if (checked) return;
        container.querySelectorAll('.pk-card').forEach(c => c.classList.remove('pk-selected'));
        if (selected === card) { selected = null; return; }
        selected = card;
        card.classList.add('pk-selected');
      });
    });

    // Click a zone to place
    container.querySelectorAll('.pk-zone').forEach(zone => {
      zone.addEventListener('click', () => {
        if (!selected || checked) return;
        const zName = zone.dataset.zone;
        const id = selected.dataset.id;
        const zoneContent = document.getElementById('pkz-' + zName);
        placements[id] = zName;

        // Move card visually
        selected.classList.remove('pk-selected');
        zoneContent.appendChild(selected);
        selected = null;

        // Remove from other zones if re-placing
        zones.forEach(z => {
          if (z !== zName) {
            const other = document.getElementById('pkz-' + z);
            if (other) Array.from(other.children).forEach(c => {
              if (c.dataset.id === id && other.contains(c)) {
                // don't remove — it's in correct place already handled
              }
            });
          }
        });
      });
    });

    // Check
    const checkBtn = document.getElementById('pk-check');
    if (checkBtn) checkBtn.addEventListener('click', () => {
      if (checked) return;
      checked = true;
      let correct = 0;
      items.forEach(item => {
        const card = container.querySelector(`[data-id="${item.id}"]`);
        if (!card) return;
        const placed = placements[item.id];
        if (placed === item.zone) {
          card.classList.add('pk-correct');
          correct++;
        } else {
          card.classList.add('pk-wrong');
        }
      });
      const resEl = document.getElementById('pk-result');
      if (resEl) {
        resEl.classList.remove('hidden');
        resEl.innerHTML = `<strong>${correct}/${items.length} benar.</strong> ${correct >= 7 ? '🏆 Luar biasa!' : correct >= 4 ? '👍 Cukup baik, coba lagi!' : '📚 Pelajari ulang materi VOC.'}`;
      }
    });

    // Reset
    const resetBtn = document.getElementById('pk-reset');
    if (resetBtn) resetBtn.addEventListener('click', () => {
      checked = false;
      selected = null;
      placements = {};
      setupGamePetaKonsep(); // re-init
    });
  }

  /* ──────────────────────────────────────────────
     GAME: TIMELINE SORT (Part 2/3)
  ────────────────────────────────────────────── */
  function setupGameTimeline() {
    const container = document.getElementById('game-timeline');
    if (!container) return;

    const events = [
      { year: 1511, text: 'Portugis merebut Malaka' },
      { year: 1596, text: 'Ekspedisi de Houtman tiba di Banten' },
      { year: 1602, text: 'VOC resmi berdiri' },
      { year: 1619, text: 'Batavia didirikan di atas Jayakarta' },
      { year: 1621, text: 'Pembantaian Banda oleh J.P. Coen' },
      { year: 1667, text: 'Perjanjian Bongaya — Makassar takluk' },
      { year: 1740, text: 'Pembantaian Cina di Batavia' },
      { year: 1799, text: 'VOC resmi dibubarkan' }
    ];

    const shuffled = [...events].sort(() => Math.random() - 0.5);
    let userOrder = [...shuffled];
    let draggingIdx = null;
    let overIdx = null;

    function render() {
      container.innerHTML = `
        <div class="tl-instruction">Urutkan peristiwa berikut dari yang paling awal (atas) ke paling akhir (bawah).</div>
        <div class="tl-list" id="tl-list">
          ${userOrder.map((e, i) => `
            <div class="tl-item" data-idx="${i}" draggable="true">
              <span class="tl-drag">⋮⋮</span>
              <span class="tl-text">${e.text}</span>
            </div>
          `).join('')}
        </div>
        <div class="tl-actions">
          <button class="game-btn" id="tl-check">✅ Periksa Urutan</button>
          <button class="game-btn" id="tl-reset">↺ Acak Ulang</button>
        </div>
        <div class="tl-result hidden" id="tl-result"></div>
      `;

      // Drag events
      const list = document.getElementById('tl-list');
      list.querySelectorAll('.tl-item').forEach((item, i) => {
        item.addEventListener('dragstart', () => { draggingIdx = i; item.classList.add('tl-dragging'); });
        item.addEventListener('dragend', () => { draggingIdx = null; item.classList.remove('tl-dragging'); render(); });
        item.addEventListener('dragover', (e) => { e.preventDefault(); item.classList.add('tl-over'); overIdx = i; });
        item.addEventListener('dragleave', () => { item.classList.remove('tl-over'); });
        item.addEventListener('drop', () => {
          if (draggingIdx === null || draggingIdx === overIdx) return;
          const moved = userOrder.splice(draggingIdx, 1)[0];
          userOrder.splice(overIdx, 0, moved);
          draggingIdx = null; overIdx = null;
          render();
        });
      });

      // Check
      const chk = document.getElementById('tl-check');
      if (chk) chk.addEventListener('click', () => {
        const isCorrect = userOrder.every((e, i) => e.year === events.sort((a,b) => a.year-b.year)[i].year);
        const sorted = [...events].sort((a,b) => a.year - b.year);
        let correct = 0;
        list.querySelectorAll('.tl-item').forEach((item, i) => {
          if (userOrder[i].year === sorted[i].year) { item.classList.add('tl-correct'); correct++; }
          else item.classList.add('tl-wrong');
        });
        const resEl = document.getElementById('tl-result');
        if (resEl) {
          resEl.classList.remove('hidden');
          resEl.innerHTML = `<strong>${correct}/${events.length} urutan benar.</strong> ${isCorrect ? '🏆 Sempurna!' : 'Lihat urutan yang benar setelah cek.'}`;
        }
      });

      // Reset
      const rst = document.getElementById('tl-reset');
      if (rst) rst.addEventListener('click', () => {
        userOrder = [...events].sort(() => Math.random() - 0.5);
        render();
      });
    }

    render();
  }

  /* ──────────────────────────────────────────────
     GAME: KALKULATOR MONOPOLI VOC (Part 2/3)
  ────────────────────────────────────────────── */
  function setupGameKalkulator() {
    const container = document.getElementById('game-kalkulator');
    if (!container) return;

    container.innerHTML = `
      <div class="kalku-desc">
        <p>Kamu adalah <em>koopman</em> (pedagang) VOC yang membeli cengkeh di Ambon dan menjualnya di Amsterdam. Hitung keuntungan per ekspedisi.</p>
      </div>
      <div class="kalku-form">
        <div class="kalku-row">
          <label>Berat cengkeh dibeli (pikul):</label>
          <input type="number" id="kk-berat" value="100" min="1" max="5000"/>
        </div>
        <div class="kalku-row">
          <label>Harga beli di Ambon (f./pikul):</label>
          <input type="number" id="kk-beli" value="3" min="1" step="0.5"/>
        </div>
        <div class="kalku-row">
          <label>Harga jual di Amsterdam (f./pikul):</label>
          <input type="number" id="kk-jual" value="20" min="1" step="0.5"/>
        </div>
        <div class="kalku-row">
          <label>Biaya kapal & awak (f. total):</label>
          <input type="number" id="kk-biaya" value="500" min="0"/>
        </div>
        <button class="game-btn" id="kk-hitung">🧮 Hitung Keuntungan</button>
      </div>
      <div class="kalku-result hidden" id="kk-result"></div>
    `;

    const hitungBtn = document.getElementById('kk-hitung');
    if (hitungBtn) hitungBtn.addEventListener('click', () => {
      const berat = parseFloat(document.getElementById('kk-berat').value) || 0;
      const beli  = parseFloat(document.getElementById('kk-beli').value)  || 0;
      const jual  = parseFloat(document.getElementById('kk-jual').value)  || 0;
      const biaya = parseFloat(document.getElementById('kk-biaya').value) || 0;

      const totalBeli = berat * beli;
      const totalJual = berat * jual;
      const profit    = totalJual - totalBeli - biaya;
      const margin    = ((profit / (totalBeli + biaya)) * 100).toFixed(1);

      const res = document.getElementById('kk-result');
      if (res) {
        res.classList.remove('hidden');
        res.innerHTML = `
          <table class="data-table" style="margin-top:8px">
            <tr><td>Modal beli</td><td><strong>f. ${totalBeli.toLocaleString('nl-NL')},–</strong></td></tr>
            <tr><td>Hasil jual</td><td><strong>f. ${totalJual.toLocaleString('nl-NL')},–</strong></td></tr>
            <tr><td>Biaya operasional</td><td><strong>f. ${biaya.toLocaleString('nl-NL')},–</strong></td></tr>
            <tr><td><strong>Keuntungan bersih</strong></td><td><strong style="color:${profit>0?'#004400':'#7a1f1f'}">f. ${profit.toLocaleString('nl-NL')},–</strong></td></tr>
            <tr><td>Margin keuntungan</td><td><strong>${margin}%</strong></td></tr>
          </table>
          <p style="margin-top:8px;font-style:italic;font-size:0.78rem">
            ${profit > 5000 ? '🏆 Ekspedisi sangat menguntungkan! Inilah mengapa VOC bisa membayar dividen 40–75% di masa kejayaannya.' :
              profit > 0   ? '👍 Untung, tapi tipis. Mungkin perlu negosiasi harga beli lebih rendah di Ambon.' :
                             '❌ Merugi. Korupsi dan biaya perang inilah yang menenggelamkan VOC pada abad ke-18.'}
          </p>
        `;
      }
    });
  }

  /* ──────────────────────────────────────────────
     INIT ALL
  ────────────────────────────────────────────── */
  function init() {
    // Set first page active
    if (pages.length > 0) {
      pages[0].classList.add('active');
    }

    // Restore last position if same part
    const lastPart = parseInt(localStorage.getItem('ivh_last_part') || '1');
    const lastPage = parseInt(localStorage.getItem('ivh_last_page') || '1');
    if (lastPart === PART && lastPage > partOffset && lastPage <= partOffset + totalLocal) {
      const targetIdx = lastPage - partOffset - 1;
      if (targetIdx > 0) goTo(targetIdx, 'next');
    }

    updateUI();
    setupTooltips();
    setupPG();
    setupGameTebakTokoh();
    setupGameSidang();
    setupGamePetaKonsep();
    setupGameTimeline();
    setupGameKalkulator();

    // Show swipe hint on first visit
    setTimeout(showSwipeHint, 1500);

    // Re-setup tooltips after page transitions (for dynamically added pages)
    document.getElementById('btn-prev')?.addEventListener('click', () => setTimeout(setupTooltips, 100));
    document.getElementById('btn-next')?.addEventListener('click', () => setTimeout(setupTooltips, 100));
  }

  // Wait for DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
