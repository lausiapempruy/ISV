// deteksi halaman mana yang lagi dibuka
const isAdmin = window.location.pathname.includes('admin.html');

// buat kirim pertanyaan
if (!isAdmin) {
  document.getElementById('kirim').onclick = () => {
    const teks = document.getElementById('pertanyaan').value.trim();
    if (!teks) return;
    
    let data = JSON.parse(localStorage.getItem('qna-bangji') || '[]');
    data.push({ 
      id: Date.now(), 
      tanya: teks, 
      jawab: '', 
      waktu: new Date().toLocaleString('id-ID')
    });
    localStorage.setItem('qna-bangji', JSON.stringify(data));
    
    document.getElementById('pertanyaan').value = '';
    document.getElementById('notif').innerText = 'udah kekirim bang!';
    setTimeout(() => document.getElementById('notif').innerText = '', 2000);
  }
}

// buat halaman admin
if (isAdmin) {
  const listQna = document.getElementById('list-qna');
  let data = JSON.parse(localStorage.getItem('qna-bangji') || '[]');
  
  function render() {
    listQna.innerHTML = '';
    data.reverse().forEach(item => {
      const card = document.createElement('div');
      card.className = 'qna-card';
      card.id = 'card-' + item.id;
      card.innerHTML = `
        <small>${item.waktu}</small>
        <p><b>q:</b> ${item.tanya}</p>
        <textarea placeholder="jawab disini bang...">${item.jawab}</textarea>
        <div class="tools">
          <button onclick="simpan(${item.id})">simpan jawaban</button>
          <button onclick="screenshot(${item.id})">download 1080p</button>
          <button onclick="hapus(${item.id})">hapus</button>
        </div>
      `;
      listQna.appendChild(card);
    });
  }
  
  window.simpan = (id) => {
    const card = document.getElementById('card-' + id);
    const jawaban = card.querySelector('textarea').value;
    data = data.map(d => d.id === id ? {...d, jawab: jawaban} : d);
    localStorage.setItem('qna-bangji', JSON.stringify(data));
    alert('kesimpen!');
  }
  
  window.screenshot = (id) => {
    const card = document.getElementById('card-' + id);
    html2canvas(card, {width: 1080, scale: 1}).then(canvas => {
      const link = document.createElement('a');
      link.download = 'qna-bangji-' + id + '.png';
      link.href = canvas.toDataURL();
      link.click();
    });
  }
  
  window.hapus = (id) => {
    data = data.filter(d => d.id !== id);
    localStorage.setItem('qna-bangji', JSON.stringify(data));
    render();
  }
  
  render();
}
