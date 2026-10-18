const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

/* ---------- settings ---------- */
const store = {
  get(k){ try { return localStorage.getItem(k) || ''; } catch(e){ return ''; } },
  set(k,v){ try { localStorage.setItem(k,v); } catch(e){} }
};
$('#openSet').onclick = () => {
  $('#sEnd').value = store.get('vv_end'); $('#sKey').value = store.get('vv_key'); $('#sMod').value = store.get('vv_mod');
  $('#dlg').showModal();
};
$('#sClose').onclick = () => $('#dlg').close();
$('#sSave').onclick = () => {
  store.set('vv_end', $('#sEnd').value.trim()); store.set('vv_key', $('#sKey').value.trim()); store.set('vv_mod', $('#sMod').value.trim());
  $('#dlg').close();
};

/* ---------- AI call ---------- */
async function ai(messages){
  const base = (window.VV_CONFIG && window.VV_CONFIG.apiBase) || '';
  const url = base ? base + '/api/chat' : (store.get('vv_end') || 'https://text.pollinations.ai/openai');
  const key = store.get('vv_key');
  const headers = {'Content-Type':'application/json'};
  if (key && !base) headers.Authorization = 'Bearer ' + key;
  const res = await fetch(url, {
    method:'POST', headers,
    body: JSON.stringify({ model: store.get('vv_mod') || 'openai', messages })
  });
  if (!res.ok) throw new Error('Server membalas ' + res.status + '. Cek endpoint, key, atau coba lagi.');
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}
const esc = s => s.replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const busy = (btn, on, label) => { btn.disabled = on; btn.textContent = on ? '…' : label; };

/* ---------- tabs ---------- */
$$('.tab').forEach(t => t.onclick = () => {
  $$('.tab').forEach(x => x.setAttribute('aria-selected', x === t));
  $$('section').forEach(s => s.classList.toggle('on', s.id === t.dataset.t));
});

/* ---------- chat ---------- */
const history = [{ role:'system', content:'Kamu Void, asisten AI di Void AI Vusion. Jawab dalam bahasa yang dipakai pengguna, santai, jelas, dan to the point.' }];
function bubble(cls, html){
  const d = document.createElement('div'); d.className = 'msg ' + cls; d.innerHTML = html;
  $('#log').appendChild(d); $('#log').scrollTop = 1e9; return d;
}
function md(t){
  return esc(t).replace(/```(?:\w+)?\n?([\s\S]*?)```/g, (_,c) => '<pre>' + c + '</pre>').replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
}
async function sendChat(text){
  text = (text || $('#chatIn').value).trim(); if (!text) return;
  $('#hero')?.remove(); $('#chatIn').value = '';
  bubble('u', esc(text)); history.push({ role:'user', content:text });
  const wait = bubble('a', '…'); busy($('#chatGo'), true);
  try {
    const out = await ai(history);
    history.push({ role:'assistant', content:out }); wait.innerHTML = md(out);
  } catch(e){ wait.textContent = 'Gagal: ' + e.message; history.pop(); }
  busy($('#chatGo'), false, 'Kirim'); $('#log').scrollTop = 1e9;
}
$('#chatGo').onclick = () => sendChat();
$('#chatIn').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); sendChat(); } });
$$('.chip').forEach(c => c.onclick = () => sendChat(c.textContent));

/* ---------- image ---------- */
$('#imgGo').onclick = () => {
  const p = $('#imgIn').value.trim(); if (!p) return;
  const [w,h] = $('#imgRatio').value.split('x');
  const full = [p, $('#imgStyle').value].filter(Boolean).join(', ');
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(full)}?width=${w}&height=${h}&nologo=true&seed=${Math.floor(Math.random()*1e6)}`;
  const box = $('#imgbox'); box.textContent = 'Lagi dilukis…'; busy($('#imgGo'), true);
  const img = new Image(); img.alt = p;
  img.onload = () => { box.innerHTML = ''; box.appendChild(img); busy($('#imgGo'), false, 'Generate'); $('#imgDl').href = url; $('#imgDl').style.display = ''; };
  img.onerror = () => { box.textContent = 'Gambar gagal dibuat. Coba prompt lain.'; busy($('#imgGo'), false, 'Generate'); };
  img.src = url;
};

/* ---------- music (lyrics via AI + beat demo via WebAudio) ---------- */
let ac, timer, playing = false, step = 0, tempo = 100;
const eq = $('#eq'); eq.innerHTML = '<i></i>'.repeat(16);
const scale = [0,3,5,7,10,12,15];
function tone(f, t, d, type, vol){
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.value = f;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + d);
  o.connect(g).connect(ac.destination); o.start(t); o.stop(t + d);
}
function tick(){
  const t = ac.currentTime, root = 110;
  if (step % 4 === 0) tone(60, t, .25, 'sine', .7);
  if (step % 2 === 1) tone(6000, t, .04, 'square', .05);
  if (step % 8 === 0) tone(root * Math.pow(2, scale[(step/8|0) % 4 * 2 % 7] / 12), t, .5, 'sawtooth', .12);
  if (Math.random() > .35) tone(root * 4 * Math.pow(2, scale[Math.floor(Math.random()*7)] / 12), t, .2, 'triangle', .08);
  $$('#eq i').forEach(b => b.style.height = (6 + Math.random() * 38) + 'px');
  step++;
}
function stopBeat(){ clearInterval(timer); playing = false; $('#musPlay').textContent = '▶ Putar beat'; $$('#eq i').forEach(b => b.style.height = '6px'); }
$('#musPlay').onclick = () => {
  if (playing) return stopBeat();
  ac = ac || new (window.AudioContext || window.webkitAudioContext)();
  ac.resume(); playing = true; step = 0; $('#musPlay').textContent = '■ Stop';
  timer = setInterval(tick, 60000 / tempo / 2);
};
$('#musGo').onclick = async () => {
  const p = $('#musIn').value.trim(); if (!p) return;
  stopBeat(); busy($('#musGo'), true);
  try {
    const raw = await ai([
      { role:'system', content:'Balas HANYA JSON valid tanpa markdown: {"title":string,"bpm":number antara 70 dan 150,"lyrics":string}. Lirik memuat [Verse], [Chorus], [Verse 2], [Chorus]. Bahasa sesuai permintaan pengguna.' },
      { role:'user', content:`Genre: ${$('#musGenre').value}. Tema: ${p}` }
    ]);
    const j = JSON.parse(raw.replace(/```json|```/g, '').trim());
    tempo = Math.min(150, Math.max(70, +j.bpm || 100));
    $('#musTitle').textContent = j.title; $('#musLy').textContent = j.lyrics; $('#musOut').hidden = false;
  } catch(e){ $('#musTitle').textContent = 'Gagal bikin lagu'; $('#musLy').textContent = 'Coba lagi atau ubah deskripsinya.'; $('#musOut').hidden = false; }
  busy($('#musGo'), false, 'Buat lagu');
};

/* ---------- app builder ---------- */
let lastHtml = '';
function view(mode){
  $('#vPrev').setAttribute('aria-pressed', mode === 'prev'); $('#vCode').setAttribute('aria-pressed', mode === 'code');
  $('#frame').style.display = (mode === 'prev' && lastHtml) ? 'block' : 'none';
  $('#code').style.display = (mode === 'code' && lastHtml) ? 'block' : 'none';
  $('#bldEmpty').style.display = lastHtml ? 'none' : 'grid';
}
$('#vPrev').onclick = () => view('prev'); $('#vCode').onclick = () => view('code');
$('#code').oninput = () => { lastHtml = $('#code').value; $('#frame').srcdoc = lastHtml; };
$('#bldGo').onclick = async () => {
  const p = $('#bldIn').value.trim(); if (!p) return;
  busy($('#bldGo'), true); $('#bldEmpty').textContent = 'Lagi ngoding…'; if (!lastHtml) view('prev');
  try {
    const raw = await ai([
      { role:'system', content:'Kamu web developer. Balas HANYA satu file HTML lengkap (HTML+CSS+JS inline, tanpa library eksternal, responsif, desain modern). Tanpa penjelasan dan tanpa markdown.' },
      { role:'user', content: lastHtml ? `Ubah app ini sesuai permintaan: ${p}\n\nKode saat ini:\n${lastHtml}` : p }
    ]);
    lastHtml = raw.replace(/^```(?:html)?\s*/i, '').replace(/```\s*$/, '').trim();
    $('#frame').srcdoc = lastHtml; $('#code').value = lastHtml; view('prev');
  } catch(e){ $('#bldEmpty').textContent = 'Gagal: ' + e.message; }
  busy($('#bldGo'), false, 'Bangun');
};
$('#bldCopy').onclick = async () => { try { await navigator.clipboard.writeText(lastHtml); $('#bldCopy').textContent = 'Tersalin'; setTimeout(() => $('#bldCopy').textContent = 'Salin', 1500); } catch(e){} };
$('#bldDl').onclick = () => {
  if (!lastHtml) return;
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([lastHtml], { type:'text/html' })); a.download = 'app-void-vusion.html'; a.click();
};
