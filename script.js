/* ═══════════════════════════════════════════════════════════
   ILMU SEJARAH VOC — IVH BATAVIA 1926
   book.js — Navigation, Games, Tooltip, Swipe, Export
   File mapping:
     Part 1 → index.html
     Part 2 → index2.html
     Part 3 → index3.html
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ──────────────────────────────────────────────
     DETECT WHICH PART WE'RE ON
  ────────────────────────────────────────────── */
  const filename = location.pathname.split('/').pop() || 'index.html';
  const PART = filename.includes('index3') ? 3 : filename.includes('index2') ? 2 : 1;

  const PAGES_PER_PART = 30;
  const TOTAL_PAGES    = 80;
  const partOffset     = (PART - 1) * PAGES_PER_PART; // 0 | 30 | 60

  /* ──────────────────────────────────────────────
     PART FILE NAMES — updated to index / index2 / index3
  ────────────────────────────────────────────── */
  const PART_FILES = {
    1: 'index.html',
    2: 'index2.html',
    3: 'index3.html'
  };

  /* ──────────────────────────────────────────────
     STATE
  ────────────────────────────────────────────── */
  let currentIdx   = 0;
  let isDragging   = false;
  let dragStartX   = 0;
  const DRAG_THRESHOLD = 60;
  let swipeHintShown = localStorage.getItem('ivh_swipe_hint') === '1';

  /* ──────────────────────────────────────────────
     DOM REFS
  ────────────────────────────────────────────── */
  const pages         = Array.from(document.querySelectorAll('.page'));
  const btnPrev       = document.getElementById('btn-prev');
  const btnNext       = document.getElementById('btn-next');
  const progressFill  = document.getElementById('progress-fill');
  const btnFilter     = document.getElementById('btn-filter');
  const btnExport     = document.getElementById('btn-export');
  const btnFS         = document.getElementById('btn-fs');
  const tooltipBox    = document.getElementById('tooltip-box');
  const exportOverlay = document.getElementById('export-overlay');
  const exportCancel  = document.getElementById('export-cancel');
  const exportPageNum = document.getElementById('export-page-num');
  const exportProgress= document.getElementById('export-progress');
  const bookStage     = document.getElementById('book-stage');

  const totalLocal = pages.length;

  /* ══════════════════════════════════════════════
     NAVIGATION CORE
  ══════════════════════════════════════════════ */
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
    next.scrollTop = 0;
  }

  function goNext() { goTo(currentIdx + 1, 'next'); }
  function goPrev() { goTo(currentIdx - 1, 'prev'); }

  /** Returns true if we jumped to another part file */
  function handleEdge(dir) {
    if (dir === 'next' && currentIdx === totalLocal - 1) {
      if (PART < 3) location.href = PART_FILES[PART + 1];
      return true;
    }
    if (dir === 'prev' && currentIdx === 0) {
      if (PART > 1) location.href = PART_FILES[PART - 1];
      return true;
    }
    return false;
  }

  /* ──────────────────────────────────────────────
     UPDATE UI
  ────────────────────────────────────────────── */
  function updateUI() {
    const globalPage = partOffset + currentIdx + 1;

    const counterEl = document.getElementById('page-counter');
    if (counterEl) {
      counterEl.innerHTML = `Hal. <span id="cur">${globalPage}</span> / ${TOTAL_PAGES}`;
    }

    if (progressFill) {
      progressFill.style.width = ((globalPage / TOTAL_PAGES) * 100).toFixed(2) + '%';
    }

    if (btnPrev) btnPrev.disabled = (currentIdx === 0 && PART === 1);
    if (btnNext) btnNext.disabled = (currentIdx === totalLocal - 1 && PART === 3);

    localStorage.setItem('ivh_last_page', globalPage);
    localStorage.setItem('ivh_last_part', PART);
  }

  /* ══════════════════════════════════════════════
     INPUT HANDLERS
  ══════════════════════════════════════════════ */

  // Buttons
  btnPrev?.addEventListener('click', () => { if (!handleEdge('prev')) goPrev(); });
  btnNext?.addEventListener('click', () => { if (!handleEdge('next')) goNext(); });

  // Keyboard
  document.addEventListener('keydown', (e) => {
    if (['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)) return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); if (!handleEdge('next')) goNext(); }
    if (e.key === 'ArrowLeft'  || e.key === 'PageUp')   { e.preventDefault(); if (!handleEdge('prev')) goPrev(); }
  });

  // Mouse drag (PC: click-hold + drag)
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
      if (Math.abs(dx) > DRAG_THRESHOLD) {
        if (dx < 0) { if (!handleEdge('next')) goNext(); }
        else         { if (!handleEdge('prev')) goPrev(); }
      }
    });
    document.addEventListener('mousemove', (e) => { if (isDragging) e.preventDefault(); });
    bookStage.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  // Touch swipe (mobile/tablet)
  let touchStartX = 0, touchStartY = 0;
  document.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });
  document.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > DRAG_THRESHOLD) {
      if (dx < 0) { if (!handleEdge('next')) goNext(); }
      else         { if (!handleEdge('prev')) goPrev(); }
    }
  }, { passive: true });

  /* ══════════════════════════════════════════════
     TOOLTIP
  ══════════════════════════════════════════════ */
  function setupTooltips() {
    if (!tooltipBox) return;
    document.querySelectorAll('.nl[data-tip]').forEach(el => {
      const fresh = el.cloneNode(true);
      el.replaceWith(fresh);
      fresh.addEventListener('mouseenter', (e) => {
        tooltipBox.textContent = fresh.dataset.tip;
        tooltipBox.classList.add('show');
        positionTip(e);
      });
      fresh.addEventListener('mousemove', positionTip);
      fresh.addEventListener('mouseleave', () => tooltipBox.classList.remove('show'));
    });
  }
  function positionTip(e) {
    if (!tooltipBox) return;
    const x = e.clientX + 12, y = e.clientY - 8;
    const tw = tooltipBox.offsetWidth, th = tooltipBox.offsetHeight;
    tooltipBox.style.left = (x + tw > window.innerWidth  - 10 ? x - tw - 20 : x) + 'px';
    tooltipBox.style.top  = (y + th > window.innerHeight - 10 ? y - th - 10 : y) + 'px';
  }

  /* ══════════════════════════════════════════════
     FILTER TOGGLE
  ══════════════════════════════════════════════ */
  let filterOn = true;
  btnFilter?.addEventListener('click', () => {
    filterOn = !filterOn;
    document.body.classList.toggle('filter-off', !filterOn);
    btnFilter.textContent = filterOn ? '🎞 Filter' : '🎞 Normal';
  });

  /* ══════════════════════════════════════════════
     FULLSCREEN
  ══════════════════════════════════════════════ */
  btnFS?.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      btnFS.textContent = '✕ Keluar';
    } else {
      document.exitFullscreen().catch(() => {});
      btnFS.textContent = '⛶';
    }
  });

  /* ══════════════════════════════════════════════
     EXPORT PNG
  ══════════════════════════════════════════════ */
  function loadH2C(cb) {
    if (window.html2canvas) { cb(); return; }
    const s = document.createElement('script');
    s.src     = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    s.onload  = cb;
    s.onerror = () => alert('Gagal memuat library ekspor. Periksa koneksi internet.');
    document.head.appendChild(s);
  }

  btnExport?.addEventListener('click', () => {
    const gp = partOffset + currentIdx + 1;
    if (exportPageNum)  exportPageNum.textContent  = gp;
    if (exportProgress) exportProgress.textContent = 'Memuat library...';
    if (exportOverlay)  exportOverlay.classList.remove('hidden');

    loadH2C(() => {
      if (exportProgress) exportProgress.textContent = 'Merender halaman...';
      html2canvas(pages[currentIdx], {
        scale: 2, useCORS: true, allowTaint: false,
        backgroundColor: '#e8dcc8', width: 720, height: 960, logging: false
      }).then(canvas => {
        if (exportProgress) exportProgress.textContent = 'Mengunduh...';
        canvas.toBlob(blob => {
          const url = URL.createObjectURL(blob);
          const a   = document.createElement('a');
          a.href = url; a.download = `IVH-SejarahVOC-hal${gp}.png`;
          a.click(); URL.revokeObjectURL(url);
          exportOverlay?.classList.add('hidden');
        }, 'image/png');
      }).catch(err => {
        console.error(err);
        if (exportProgress) exportProgress.textContent = 'Gagal. Coba lagi.';
      });
    });
  });
  exportCancel?.addEventListener('click', () => exportOverlay?.classList.add('hidden'));

  /* ══════════════════════════════════════════════
     PILIHAN GANDA — click-to-reveal
  ══════════════════════════════════════════════ */
  function setupPG() {
    document.querySelectorAll('.soal-item').forEach(item => {
      const correct     = item.dataset.answer;
      const opts        = item.querySelectorAll('.opt');
      const explanation = item.querySelector('.soal-explanation');
      let answered = false;
      opts.forEach(opt => {
        opt.addEventListener('click', () => {
          if (answered) return;
          answered = true;
          if (opt.dataset.opt === correct) {
            opt.classList.add('selected-correct');
          } else {
            opt.classList.add('selected-wrong');
            opts.forEach(o => { if (o.dataset.opt === correct) o.classList.add('selected-correct'); });
          }
          explanation?.classList.remove('hidden');
        });
      });
    });
  }

  /* ══════════════════════════════════════════════
     GAME: TEBAK TOKOH
  ══════════════════════════════════════════════ */
  const TOKOH_DATA = [
    {
      clues:[
        'Lahir di kota kecil Holland, bukan dari keluarga bangsawan.',
        'Pernah magang akuntansi di Roma selama 6 tahun.',
        'Memerintahkan penghancuran sebuah kota Jawa dan membangun kota baru di atasnya.'
      ],
      answer:'Jan Pieterszoon Coen',
      options:['Johan van Oldenbarnevelt','Jan Pieterszoon Coen','Antonio van Diemen','Cornelis Speelman'],
      fact:'J.P. Coen adalah GG VOC ke-4 & ke-6, pendiri Batavia (1619), dan arsitek pembantaian Banda (1621).'
    },
    {
      clues:[
        'Seorang negarawan Belanda yang tidak pernah berlayar ke Hindia.',
        'Berhasil meyakinkan enam kongsi bersaing untuk bergabung menjadi satu.',
        'Namanya terhubung dengan wilayah yang menjadi nama ibu kota sebuah republik.'
      ],
      answer:'Johan van Oldenbarnevelt',
      options:['Pieter Both','Johan van Oldenbarnevelt','Jan Pieterszoon Coen','Wijbrand van Warwijck'],
      fact:'Johan van Oldenbarnevelt adalah arsitek penggabungan voorcompagnieën menjadi VOC pada 20 Maret 1602.'
    },
    {
      clues:[
        'GG VOC ke-16, menjabat sangat lama — lebih dari dua dekade.',
        'Di bawah kepemimpinannya, VOC merebut pelabuhan bebas di Sulawesi Selatan.',
        'Namanya terkait erat dengan perjanjian 1667 yang menaklukkan "Ayam Jantan dari Timur".'
      ],
      answer:'Joan Maetsuyker',
      options:['Joan Maetsuyker','Rijklof van Goens','Adriaan Valckenier','Jacob Mossel'],
      fact:'Joan Maetsuyker (GG 1653–1678) memimpin penaklukan Makassar dan memaksa Sultan Hasanuddin menandatangani Perjanjian Bongaya.'
    },
    {
      clues:[
        'Tokoh ini bukan orang Belanda dan bukan orang Jawa.',
        'Ia memimpin kerajaan di Sulawesi Selatan yang menjadi surga pedagang bebas.',
        'Dijuluki "Ayam Jantan dari Timur" karena keberaniannya melawan VOC.'
      ],
      answer:'Sultan Hasanuddin',
      options:['Arung Palakka','Sultan Hasanuddin','Sultan Agung','Pangeran Wijayakrama'],
      fact:'Sultan Hasanuddin adalah Raja Gowa-Tallo yang dipaksa menandatangani Perjanjian Bongaya 1667 setelah dikalahkan koalisi VOC-Bone.'
    },
    {
      clues:[
        'Raja dari kerajaan terbesar di Jawa pada abad ke-17.',
        'Melakukan dua kali serangan besar ke sebuah kota di pesisir utara Jawa — keduanya gagal.',
        'Meski gagal, ia tetap memperluas kerajaannya ke timur Jawa.'
      ],
      answer:'Sultan Agung',
      options:['Sultan Agung','Amangkurat I','Panembahan Senopati','Sultan Hamengkubuwono I'],
      fact:'Sultan Agung dari Mataram menyerang Batavia dua kali (1628 & 1629) namun gagal — kekurangan bekal menjadi penyebab utamanya.'
    }
  ];

  function setupGameTebakTokoh() {
    const container = document.getElementById('game-tebak-tokoh');
    if (!container) return;

    let score=0, round=0, cluesShown=0, answered=false;
    const scoreEl=document.getElementById('tbt-score'), roundEl=document.getElementById('tbt-round');
    const cluesEl=document.getElementById('tbt-clues'), optsEl=document.getElementById('tbt-options');
    const feedbackEl=document.getElementById('tbt-feedback'), hintBtn=document.getElementById('tbt-hint');
    const finalEl=document.getElementById('tbt-final'), finalScore=document.getElementById('tbt-final-score');
    const gradeEl=document.getElementById('tbt-grade'), cardEl=document.getElementById('tbt-card');
    const restartBtn=document.getElementById('tbt-restart'), playAgain=document.getElementById('tbt-play-again');

    const shuffle = arr => [...arr].sort(()=>Math.random()-0.5);

    function loadRound(){
      if(round>=TOKOH_DATA.length){showFinal();return;}
      const q=TOKOH_DATA[round]; cluesShown=1; answered=false;
      if(feedbackEl){feedbackEl.classList.add('hidden');feedbackEl.textContent='';}
      if(hintBtn) hintBtn.disabled=false;
      renderClues(q);
      if(optsEl){
        optsEl.innerHTML='';
        shuffle(q.options).forEach(opt=>{
          const btn=document.createElement('button');
          btn.className='tbt-option'; btn.textContent=opt;
          btn.addEventListener('click',()=>handleAnswer(opt,q,btn));
          optsEl.appendChild(btn);
        });
      }
      if(roundEl) roundEl.textContent=round+1;
    }

    function renderClues(q){
      if(!cluesEl) return;
      cluesEl.innerHTML='';
      for(let i=0;i<cluesShown;i++){
        const d=document.createElement('div');
        d.className='clue-item';
        d.innerHTML=`<span class="clue-num">Petunjuk ${i+1}:</span> ${q.clues[i]}`;
        cluesEl.appendChild(d);
      }
    }

    function handleAnswer(chosen,q,btnEl){
      if(answered) return;
      answered=true;
      if(hintBtn) hintBtn.disabled=true;
      const pts=cluesShown===1?3:cluesShown===2?2:1;
      if(chosen===q.answer){
        score+=pts; if(scoreEl) scoreEl.textContent=score;
        btnEl.classList.add('correct');
        if(feedbackEl){feedbackEl.innerHTML=`✅ <strong>Benar!</strong> +${pts} poin<br/><em>${q.fact}</em>`;feedbackEl.classList.remove('hidden');}
      } else {
        btnEl.classList.add('wrong');
        if(optsEl) Array.from(optsEl.children).forEach(b=>{if(b.textContent===q.answer) b.classList.add('correct');});
        if(feedbackEl){feedbackEl.innerHTML=`❌ <strong>Salah.</strong> Jawaban benar: <em>${q.answer}</em><br/>${q.fact}`;feedbackEl.classList.remove('hidden');}
      }
      setTimeout(()=>{round++;loadRound();},2500);
    }

    hintBtn?.addEventListener('click',()=>{
      const q=TOKOH_DATA[round];
      if(cluesShown<q.clues.length){cluesShown++;renderClues(q);if(cluesShown>=q.clues.length) hintBtn.disabled=true;}
    });

    function showFinal(){
      cardEl?.classList.add('hidden'); finalEl?.classList.remove('hidden');
      if(finalScore) finalScore.textContent=score;
      const max=TOKOH_DATA.length*3;
      if(gradeEl) gradeEl.textContent=score>=max*0.8?'🏆 Sangat Baik — Layak jadi Commissaris VOC!':score>=max*0.5?'👍 Cukup Baik — Terus belajar.':'📚 Perlu Belajar Lagi.';
    }

    function reset(){
      score=0;round=0;if(scoreEl) scoreEl.textContent='0';
      cardEl?.classList.remove('hidden');finalEl?.classList.add('hidden');loadRound();
    }
    restartBtn?.addEventListener('click',reset);
    playAgain?.addEventListener('click',reset);
    loadRound();
  }

  /* ══════════════════════════════════════════════
     GAME: SIDANG RAAD VAN JUSTITIE
  ══════════════════════════════════════════════ */
  const SIDANG_CASES=[
    {title:'Kasus I — Pedagang Tionghoa & Penjualan Cengkeh Gelap',desc:'Tan Boen Siang ditangkap karena menjual 12 pikul cengkeh kepada kapal Inggris. Ia mengaku tidak tahu ini melanggar monopoli VOC. Keluarganya miskin.',
     choices:[{text:'Bebaskan — ketidaktahuan adalah dalih masuk akal.',just:true},{text:'Denda berat (f.200) tanpa penjara — proporsional.',just:true},{text:'Hukum mati — efek jera.',just:false},{text:'Kerja paksa 2 tahun.',just:false}],
     justOutcome:'Proporsional. Raad van Justitie abad ke-17 memang membedakan pelanggaran pertama dengan pelanggaran berulang.',
     unjustOutcome:'Berlebihan. Hukuman berat untuk pelanggaran pertama mencerminkan sistem keadilan tidak seimbang.'},
    {title:'Kasus II — Tentara VOC yang Desersi',desc:'Hans Krug melarikan diri dari pos di Amboina tiga bulan dan menyerahkan diri secara sukarela setelah mendengar amnesti. Ia mengklaim sakit.',
     choices:[{text:'Bebaskan — menyerahkan diri sukarela dan sakit.',just:true},{text:'Pemotongan gaji 6 bulan.',just:true},{text:'Cambuk 50 kali di depan umum.',just:false},{text:'Eksekusi mati.',just:false}],
     justOutcome:'Berimbang. Penyerahan diri sukarela seharusnya menjadi faktor keringanan.',
     unjustOutcome:'Terlalu berat. Hukuman tidak konsisten melemahkan moral pasukan secara keseluruhan.'},
    {title:'Kasus III — Pejabat VOC yang Korupsi',desc:'Seorang boekhouder terbukti menggelapkan f.1.200 selama tiga tahun. Ia adalah menantu anggota Raad van Indië.',
     choices:[{text:'Pemecatan dan pengembalian uang — tanpa hukuman lain.',just:false},{text:'Penjara 2 tahun, pemecatan, pengembalian 3× lipat.',just:true},{text:'Peringatan keras saja — ada koneksi keluarga.',just:false},{text:'Kerja paksa seumur hidup.',just:false}],
     justOutcome:'Tepat. Anda tidak membiarkan koneksi keluarga mempengaruhi keadilan.',
     unjustOutcome:'Dipengaruhi faktor non-hukum. Korupsi sistemik VOC tumbuh subur karena impunitas bagi yang punya koneksi.'}
  ];

  function setupGameSidang(){
    const container=document.getElementById('game-sidang');
    if(!container) return;
    let caseIdx=0,justScore=0;
    const caseEl=document.getElementById('sidang-case'),curEl2=document.getElementById('sidang-cur');
    const scoreEl2=document.getElementById('sidang-score'),resultEl=document.getElementById('sidang-result');
    const verdictEl=document.getElementById('sidang-verdict'),restartBtn=document.getElementById('sidang-restart');

    function loadCase(){
      if(caseIdx>=SIDANG_CASES.length){showVerdict();return;}
      const c=SIDANG_CASES[caseIdx];
      if(curEl2) curEl2.textContent=caseIdx+1;
      if(!caseEl) return;
      caseEl.innerHTML=`<div class="sidang-case-title">${c.title}</div><div class="sidang-desc">${c.desc}</div><div class="sidang-choices">${c.choices.map((ch,i)=>`<button class="sidang-choice" data-just="${ch.just}" data-idx="${i}">${ch.text}</button>`).join('')}</div><div class="sidang-outcome hidden" id="sidang-outcome-text"></div>`;
      caseEl.querySelectorAll('.sidang-choice').forEach(btn=>btn.addEventListener('click',()=>handleChoice(btn,c)));
    }

    function handleChoice(btn,c){
      caseEl.querySelectorAll('.sidang-choice').forEach(b=>b.disabled=true);
      const isJust=btn.dataset.just==='true';
      btn.classList.add(isJust?'just':'unjust');
      if(isJust) justScore++;
      if(scoreEl2) scoreEl2.textContent=justScore;
      const outcomeEl=document.getElementById('sidang-outcome-text');
      if(outcomeEl){outcomeEl.textContent=isJust?c.justOutcome:c.unjustOutcome;outcomeEl.classList.remove('hidden');}
      setTimeout(()=>{caseIdx++;loadCase();},3000);
    }

    function showVerdict(){
      if(caseEl) caseEl.innerHTML='';
      resultEl?.classList.remove('hidden');
      if(verdictEl) verdictEl.textContent=justScore===3?'⚖️ Sempurna — Hakim paling adil di Batavia!':justScore===2?'⚖️ Cukup adil — dua dari tiga keputusan berimbang.':'⚖️ Sistem yang Anda jalankan tidak jauh berbeda dari VOC aslinya.';
    }

    restartBtn?.addEventListener('click',()=>{
      caseIdx=0;justScore=0;if(scoreEl2) scoreEl2.textContent='0';
      resultEl?.classList.add('hidden');loadCase();
    });
    loadCase();
  }

  /* ══════════════════════════════════════════════
     GAME: PETA KONSEP
  ══════════════════════════════════════════════ */
  function setupGamePetaKonsep(){
    const container=document.getElementById('game-peta-konsep');
    if(!container) return;
    const items=[
      {id:'pk1',text:'Monopoli Rempah',zone:'ekonomi'},
      {id:'pk2',text:'Heeren XVII',zone:'organisasi'},
      {id:'pk3',text:'Korupsi Internal',zone:'kejatuhan'},
      {id:'pk4',text:'Hongi Tochten',zone:'ekonomi'},
      {id:'pk5',text:'Octrooi 1602',zone:'organisasi'},
      {id:'pk6',text:'Hutang f.134 Juta',zone:'kejatuhan'},
      {id:'pk7',text:'Preanger Stelsel',zone:'ekonomi'},
      {id:'pk8',text:'Gouverneur-Generaal',zone:'organisasi'},
      {id:'pk9',text:'Perang Inggris-Belanda IV',zone:'kejatuhan'}
    ];
    const zones=['ekonomi','organisasi','kejatuhan'];
    const zoneLabels={ekonomi:'📊 Sistem Ekonomi',organisasi:'🏛 Struktur Organisasi',kejatuhan:'💸 Faktor Kejatuhan'};
    let placements={},checked=false,selected=null;

    function render(){
      container.innerHTML=`
        <div class="pk-instruction">Klik kartu lalu klik zona tujuan untuk menempatkannya.</div>
        <div class="pk-cards-pool" id="pk-pool">${items.map(i=>`<div class="pk-card" data-id="${i.id}">${i.text}</div>`).join('')}</div>
        <div class="pk-zones">${zones.map(z=>`<div class="pk-zone" data-zone="${z}"><div class="pk-zone-label">${zoneLabels[z]}</div><div class="pk-zone-content" id="pkz-${z}"></div></div>`).join('')}</div>
        <div class="pk-actions"><button class="game-btn" id="pk-check">✅ Periksa</button><button class="game-btn" id="pk-reset">↺ Ulang</button></div>
        <div class="pk-result hidden" id="pk-result"></div>`;

      container.querySelectorAll('.pk-card').forEach(card=>{
        card.addEventListener('click',()=>{
          if(checked) return;
          container.querySelectorAll('.pk-card').forEach(c=>c.classList.remove('pk-selected'));
          if(selected===card){selected=null;return;}
          selected=card; card.classList.add('pk-selected');
        });
      });

      container.querySelectorAll('.pk-zone').forEach(zone=>{
        zone.addEventListener('click',()=>{
          if(!selected||checked) return;
          const zName=zone.dataset.zone,id=selected.dataset.id;
          placements[id]=zName;
          selected.classList.remove('pk-selected');
          document.getElementById('pkz-'+zName).appendChild(selected);
          selected=null;
        });
      });

      document.getElementById('pk-check')?.addEventListener('click',()=>{
        if(checked) return; checked=true; let correct=0;
        items.forEach(item=>{
          const card=container.querySelector(`[data-id="${item.id}"]`);
          if(!card) return;
          if(placements[item.id]===item.zone){card.classList.add('pk-correct');correct++;}
          else card.classList.add('pk-wrong');
        });
        const resEl=document.getElementById('pk-result');
        if(resEl){resEl.classList.remove('hidden');resEl.innerHTML=`<strong>${correct}/${items.length} benar.</strong> ${correct>=7?'🏆 Luar biasa!':correct>=4?'👍 Cukup baik!':'📚 Pelajari ulang.'}`;}
      });

      document.getElementById('pk-reset')?.addEventListener('click',()=>{placements={};checked=false;selected=null;render();});
    }
    render();
  }

  /* ══════════════════════════════════════════════
     GAME: TIMELINE SORT
  ══════════════════════════════════════════════ */
  function setupGameTimeline(){
    const container=document.getElementById('game-timeline');
    if(!container) return;
    const events=[
      {year:1511,text:'Portugis merebut Malaka'},
      {year:1596,text:'Ekspedisi de Houtman tiba di Banten'},
      {year:1602,text:'VOC resmi berdiri'},
      {year:1619,text:'Batavia didirikan di atas Jayakarta'},
      {year:1621,text:'Pembantaian Banda oleh J.P. Coen'},
      {year:1667,text:'Perjanjian Bongaya — Makassar takluk'},
      {year:1740,text:'Pembantaian Cina di Batavia'},
      {year:1799,text:'VOC resmi dibubarkan'}
    ];
    let userOrder=[...events].sort(()=>Math.random()-0.5);
    let draggingIdx=null,overIdx=null;

    function render(){
      container.innerHTML=`
        <div class="tl-instruction">Urutkan peristiwa dari paling awal (atas) ke paling akhir (bawah). Seret ikon ⋮⋮.</div>
        <div class="tl-list" id="tl-list">${userOrder.map((e,i)=>`<div class="tl-item" data-idx="${i}" draggable="true"><span class="tl-drag">⋮⋮</span><span class="tl-text">${e.text}</span></div>`).join('')}</div>
        <div class="tl-actions"><button class="game-btn" id="tl-check">✅ Periksa Urutan</button><button class="game-btn" id="tl-reset">↺ Acak Ulang</button></div>
        <div class="tl-result hidden" id="tl-result"></div>`;

      const list=document.getElementById('tl-list');
      list.querySelectorAll('.tl-item').forEach((item,i)=>{
        item.addEventListener('dragstart',()=>{draggingIdx=i;item.classList.add('tl-dragging');});
        item.addEventListener('dragend',()=>{draggingIdx=null;item.classList.remove('tl-dragging');render();});
        item.addEventListener('dragover',(e)=>{e.preventDefault();overIdx=i;item.classList.add('tl-over');});
        item.addEventListener('dragleave',()=>item.classList.remove('tl-over'));
        item.addEventListener('drop',()=>{
          if(draggingIdx===null||draggingIdx===overIdx) return;
          const moved=userOrder.splice(draggingIdx,1)[0];
          userOrder.splice(overIdx,0,moved);
          draggingIdx=null;overIdx=null;render();
        });
      });

      document.getElementById('tl-check')?.addEventListener('click',()=>{
        const sorted=[...events].sort((a,b)=>a.year-b.year);
        let correct=0;
        list.querySelectorAll('.tl-item').forEach((item,i)=>{
          if(userOrder[i].year===sorted[i].year){item.classList.add('tl-correct');correct++;}
          else item.classList.add('tl-wrong');
        });
        const resEl=document.getElementById('tl-result');
        if(resEl){resEl.classList.remove('hidden');resEl.innerHTML=`<strong>${correct}/${events.length} urutan benar.</strong> ${correct===events.length?'🏆 Sempurna!':'Coba lagi setelah reset.'}`;}
      });

      document.getElementById('tl-reset')?.addEventListener('click',()=>{userOrder=[...events].sort(()=>Math.random()-0.5);render();});
    }
    render();
  }

  /* ══════════════════════════════════════════════
     GAME: KALKULATOR MONOPOLI
  ══════════════════════════════════════════════ */
  function setupGameKalkulator(){
    const container=document.getElementById('game-kalkulator');
    if(!container) return;
    container.innerHTML=`
      <div style="font-family:var(--font-body);font-size:0.82rem;line-height:1.6;color:var(--ink);margin-bottom:12px"><p>Kamu adalah <em>koopman</em> VOC. Beli cengkeh di Ambon, jual di Amsterdam. Hitung keuntungannya.</p></div>
      <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:12px">
        ${[['kk-berat','Berat cengkeh (pikul):','100','1','5000','1'],['kk-beli','Harga beli di Ambon (f./pikul):','3','1','','0.5'],['kk-jual','Harga jual di Amsterdam (f./pikul):','20','1','','0.5'],['kk-biaya','Biaya kapal & awak (f. total):','500','0','','1']].map(([id,lbl,val,min,max,step])=>`<div style="display:flex;justify-content:space-between;align-items:center;font-family:var(--font-body);font-size:0.8rem;color:var(--ink)"><label>${lbl}</label><input type="number" id="${id}" value="${val}" min="${min}" ${max?`max="${max}"`:''}  step="${step}" style="width:80px;padding:3px 6px;font-family:var(--font-body);border:1px solid var(--gold-dark);background:var(--paper-light)"/></div>`).join('')}
      </div>
      <button class="game-btn" id="kk-hitung">🧮 Hitung Keuntungan</button>
      <div class="hidden" id="kk-result"></div>`;

    document.getElementById('kk-hitung')?.addEventListener('click',()=>{
      const berat=parseFloat(document.getElementById('kk-berat').value)||0;
      const beli=parseFloat(document.getElementById('kk-beli').value)||0;
      const jual=parseFloat(document.getElementById('kk-jual').value)||0;
      const biaya=parseFloat(document.getElementById('kk-biaya').value)||0;
      const totalBeli=berat*beli,totalJual=berat*jual;
      const profit=totalJual-totalBeli-biaya;
      const margin=((profit/(totalBeli+biaya))*100).toFixed(1);
      const res=document.getElementById('kk-result');
      if(res){
        res.classList.remove('hidden');
        res.innerHTML=`<table class="data-table" style="margin-top:10px">
          <tr><td>Modal beli</td><td><strong>f. ${totalBeli.toLocaleString('nl-NL')},–</strong></td></tr>
          <tr><td>Hasil jual</td><td><strong>f. ${totalJual.toLocaleString('nl-NL')},–</strong></td></tr>
          <tr><td>Biaya operasional</td><td><strong>f. ${biaya.toLocaleString('nl-NL')},–</strong></td></tr>
          <tr><td><strong>Keuntungan bersih</strong></td><td><strong style="color:${profit>0?'#004400':'#7a1f1f'}">f. ${profit.toLocaleString('nl-NL')},–</strong></td></tr>
          <tr><td>Margin</td><td><strong>${margin}%</strong></td></tr>
        </table>
        <p style="margin-top:8px;font-style:italic;font-size:0.78rem;color:var(--ink-fade)">${profit>5000?'🏆 Ekspedisi sangat menguntungkan! Inilah mengapa VOC bisa membayar dividen 40–75%.':profit>0?'👍 Untung, tapi tipis.':'❌ Merugi. Korupsi dan perang menghancurkan VOC.'}</p>`;
      }
    });
  }

  /* ══════════════════════════════════════════════
     SWIPE HINT
  ══════════════════════════════════════════════ */
  function showSwipeHintFn(){
    if(swipeHintShown) return;
    let el=document.getElementById('swipe-hint');
    if(!el){el=document.createElement('div');el.id='swipe-hint';el.textContent='PC: klik-tahan + geser  ·  HP/Tablet: swipe';document.body.appendChild(el);}
    el.classList.add('show');
    setTimeout(()=>el.classList.remove('show'),3000);
    swipeHintShown=true;
    localStorage.setItem('ivh_swipe_hint','1');
  }

  /* ══════════════════════════════════════════════
     INIT
  ══════════════════════════════════════════════ */
  function init(){
    if(pages.length>0) pages[0].classList.add('active');

    // Restore last position
    const lastPart=parseInt(localStorage.getItem('ivh_last_part')||'1');
    const lastPage=parseInt(localStorage.getItem('ivh_last_page')||'1');
    if(lastPart===PART && lastPage>partOffset && lastPage<=partOffset+totalLocal){
      const targetIdx=lastPage-partOffset-1;
      if(targetIdx>0) goTo(targetIdx,'next');
    }

    updateUI();
    setupTooltips();
    setupPG();
    setupGameTebakTokoh();
    setupGameSidang();
    setupGamePetaKonsep();
    setupGameTimeline();
    setupGameKalkulator();

    setTimeout(showSwipeHintFn, 1500);

    btnPrev?.addEventListener('click', ()=>setTimeout(setupTooltips,120));
    btnNext?.addEventListener('click', ()=>setTimeout(setupTooltips,120));
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
