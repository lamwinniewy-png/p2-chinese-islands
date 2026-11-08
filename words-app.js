'use strict';
/* 詞語星星島 + 兩本貼紙簿（在 app.js 之前載入，只定義函數） */

/* ---------- 字形資料：《香港小學學習字詞表》筆順（hk/），後備 hz/ ---------- */
const _glyph = {};
function getGlyph(c) {
  if (!_glyph[c]) {
    const hex = c.codePointAt(0).toString(16);
    _glyph[c] = fetch(`hk/${hex}.json`).then(r => { if (!r.ok) throw 0; return r.json(); })
      .then(d => ({ strokes: d.s, medians: d.m, hk: true }))
      .catch(() => fetch(`hz/${encodeURIComponent(c)}.json`).then(r => { if (!r.ok) throw 0; return r.json(); }).then(d => ({ strokes: d.strokes, medians: d.medians, hk: false })));
  }
  return _glyph[c];
}
const hzLoader = (c, ok, fail) => getGlyph(c).then(ok).catch(fail);
/* 標準字形 SVG（田字格內）*/
function glyphBox(c, cls = '') { return `<span class="gbox ${cls}" data-g="${c}"><svg viewBox="0 0 1024 1024" aria-label="${c}"><g class="tz"><path d="M512 0V1024M0 512H1024"/></g><g class="gs" transform="translate(0,900) scale(1,-1)"></g></svg><b class="gfb">${c}</b></span>`; }
function fillGlyphs(root) {
  root.querySelectorAll('.gbox[data-g]').forEach(el => {
    const c = el.dataset.g; el.removeAttribute('data-g');
    getGlyph(c).then(g => { el.querySelector('.gs').innerHTML = g.strokes.map(d => `<path d="${d}"/>`).join(''); el.classList.add('ok'); }).catch(() => { });
  });
}

/* ---------- 站點 ---------- */
const STATION_NAMES = ['鬼臉星', '雞腿星', '家務星', '旅遊星', '藍色河流星', '表揚星', '神氣星', '歡呼星'];
const STATION_GUIDE = ['susu', 'qing', 'susu', 'qing', 'susu', 'qing', 'susu', 'qing'];
const stWords = n => WORDS.slice((n - 1) * 5, n * 5);
const W_ = () => (S.words = S.words || {});
const stState = n => (W_()[n] = W_()[n] || { heard: [], wrote: [], quiz: 0, dict: 0, done: [0, 0, 0, 0] });
const stUnlocked = n => true; // 八站全部開放
const stepOpen = (n, k) => k === 0 || stState(n).done[k - 1];
const stDoneCount = () => [1, 2, 3, 4, 5, 6, 7, 8].filter(n => stState(n).done[2]).length;
const STEP_LBL = ['① 讀一讀', '② 寫一寫', '③ 考一考', '④ 聽寫挑戰'];

/* ---------- 貼紙 ---------- */
const STICKS_A = ['蘇蘇大鉛筆', '晴晴愛閱讀', '星星燈籠', '魔法羽毛筆', '蘇蘇星星棒', '彩虹故事書', '晴晴聽聽聽', '月亮雲朵床', '粉紅心寶石', '開心墨水瓶', '好朋友擊掌', '彩虹流星', '博士貓頭鷹', '星星獎盃', '彩虹天橋', '詞語小公主'];
const AHINT = i => { const n = Math.floor(i / 2) + 1; return i % 2 ? `第 ${n} 站聽寫挑戰答對 4 個或以上` : `完成第 ${n} 站「讀、寫、考」`; };
const lessonIds = () => LESSONS.map(t => t.id), grammarIds = () => GRAMMAR.map(t => t.id);
const gemsN = () => Object.keys(ISLES).filter(gemGot).length;
const STICKS_B = [
  ['熱氣球出發', '完成第一個挑戰', () => Object.keys(S.best).length > 0],
  ['粉紅字寶石', '收集 1 顆字寶石', () => gemsN() >= 1],
  ['藍色字寶石', '收集 3 顆字寶石', () => gemsN() >= 3],
  ['綠色字寶石', '收集 5 顆字寶石', () => gemsN() >= 5],
  ['蘇蘇坐雲朵', '課文群島 5 顆寶石全收集', () => lessonIds().every(gemGot)],
  ['晴晴抱水晶', '語文魔法群島 5 顆寶石全收集', () => grammarIds().every(gemGot)],
  ['小小浮島', '收集全部 10 顆字寶石', () => gemsN() >= 10],
  ['音樂貝殼', '音樂貝殼島得 8 分或以上', () => (S.best.listen || 0) >= 8],
  ['水晶城堡', '模擬評估得 20 分或以上', () => (S.best.mock || 0) >= 20],
  ['魔法藥鍋', '兩個魔法鍋分類都答對 6 句或以上', () => (S.best.s_g2 || 0) >= 6 && (S.best.s_g19 || 0) >= 6],
  ['開心拼圖', '玩完 5 次不同的翻翻記憶卡', () => Object.keys(S.best).filter(k => k.startsWith('m_')).length >= 5],
  ['彩虹調色盤', '閱讀雲朵全部得 7 分或以上', () => READING.every(t => (S.best[t.id] || 0) >= 7)],
  ['寶藏箱', '收集 60 粒星星', () => S.stars >= 60],
  ['彩虹獨角獸', '在筆順魔法寫好 30 個字', () => Object.values(S.wrote).reduce((a, w) => a + w.length, 0) >= 30],
  ['好朋友抱抱', '詞語星星島 8 個站全部完成', () => stDoneCount() >= 8],
  ['魔法島皇冠', '集齊其他 31 張貼紙', () => STICKS_A.every((_, i) => gotS('a', i)) && STICKS_B.slice(0, 15).every((_, i) => gotS('b', i))],
];
const sid = (b, i) => b + String(i + 1).padStart(2, '0');
const gotS = (b, i) => !!(S.got || {})[sid(b, i)];
const gotCount = b => Object.keys(S.got || {}).filter(k => k[0] === b).length;
let _awardQ = [], _awardOn = false;
function giveSticker(b, i) {
  S.got = S.got || {}; const k = sid(b, i); if (S.got[k]) return false;
  S.got[k] = Date.now(); save(); _awardQ.push([b, i]); setTimeout(showAward, 700); return true;
}
function checkAwards() {
  for (let r = 0; r < 2; r++) STICKS_B.forEach(([, , ok], i) => { try { if (!gotS('b', i) && ok()) giveSticker('b', i); } catch (e) { } });
}
function showAward() {
  if (_awardOn || !_awardQ.length) return; _awardOn = true;
  const [b, i] = _awardQ.shift(); const name = b === 'a' ? STICKS_A[i] : STICKS_B[i][0];
  const m = document.createElement('div'); m.className = 'award';
  m.innerHTML = `<div class="award-card"><div class="rays"></div><p class="award-k">獲得新貼紙！</p><img src="img/stk/${sid(b, i)}.webp" alt="${name}"><h3>${name}</h3><small>${b === 'a' ? '已貼進「詞語星星貼紙簿」' : '已貼進「魔法島成就貼紙簿」'}</small>
    <div class="btns"><button class="pill next" data-x="ok">好開心！</button><button class="pill" data-x="book">看貼紙簿</button></div></div>`;
  document.body.appendChild(m); confetti(); setTimeout(confetti, 450);
  tone([[523, .1], [659, .1], [784, .1], [1047, .1], [1319, .35]]);
  setTimeout(() => say(`嘩！你得到新貼紙：${name}！`), 500);
  m.onclick = e => { const x = e.target.dataset.x; if (!x) return; m.remove(); _awardOn = false; if (x === 'book') { _awardQ = []; stickers(b === 'a' ? 0 : 1); } else showAward(); };
}

/* ---------- 首頁入口 ---------- */
function wordsBanner() {
  const d = stDoneCount();
  const dots = [1, 2, 3, 4, 5, 6, 7, 8].map(n => `<i class="${stState(n).done[2] ? 'on' : ''} ${stState(n).done[3] ? 'gold' : ''}">★</i>`).join('');
  return `<section class="archi">
    <h2 class="archi-title"><span>詞語星星島 <em class="new">NEW</em></span><small>40 個評估詞語 · 跟《香港小學學習字詞表》</small></h2>
    <button class="words-banner" id="wordsBtn">
      <div class="isle-bob"><div class="isle-3d"><img src="img/i-words.webp" alt="" draggable="false"></div></div>
      <div class="wb-txt"><b>讀好詞語、寫好詞語！</b><span>8 個星星站，每站讀一讀、寫一寫、考一考、聽寫挑戰</span>
        <div class="st-dots">${dots}</div>
        <span class="wb-prog">已完成 <b>${d}</b> / 8 站 · 詞語貼紙 <b>${gotCount('a')}</b> / 16</span>
        <span class="pill next">${d ? '繼續出發 →' : '出發！ →'}</span></div>
    </button></section>`;
}

/* ---------- 島嶼頁（站點地圖） ---------- */
function wordIsle() {
  const nextN = [1, 2, 3, 4, 5, 6, 7, 8].find(n => !stState(n).done[3] && stUnlocked(n)) || 1;
  const hello = '我哋一齊去詞語星星島！每個星星站有五個詞語，讀好、寫好，就可以得到貼紙㗎！';
  view(`<button class="back" id="bk">← 返回天空</button>
  <section class="isle-hero" style="--gem:#B58CF0">
    <div class="isle-stage"><div class="isle-bob"><div class="isle-3d spin"><img src="img/i-words.webp" alt="" draggable="false"></div></div><span class="isle-shadow"></span></div>
    <div class="isle-info"><span class="tag">評估詞語 40 個</span><h2>詞語星星島</h2>
      <p class="isle-name">字形和筆順跟《香港小學學習字詞表》<small>完成「讀、寫、考」得一張貼紙，聽寫挑戰再得一張！</small></p>
      <button class="guide" id="hello">${DOLL('qing', 'happy')}<span class="bubble"><b>晴晴：</b>${hello} <span class="spk">🔈</span></span></button></div>
  </section>
  <div class="st-map">${[1, 2, 3, 4, 5, 6, 7, 8].map(n => {
    const s = stState(n), open = stUnlocked(n);
    return `<button class="st ${open ? '' : 'lock'} ${s.done[2] ? 'clear' : ''} ${n === nextN ? 'cur' : ''}" data-n="${n}" style="--i:${n}">
      <span class="st-star">${open ? n : '🔒'}</span>
      <span class="st-body"><b>第 ${n} 站 · ${STATION_NAMES[n - 1]}</b><span class="st-words">${stWords(n).map(w => `<span>${w.w}</span>`).join('')}</span>
      <span class="st-steps">${s.done.map((d, k) => `<i class="${d ? 'on' : ''}">${'讀寫考聽'[k]}</i>`).join('')}</span></span>
      <span class="st-stk">${[2 * n - 2, 2 * n - 1].map(i => gotS('a', i) ? `<img src="img/stk/${sid('a', i)}.webp" alt="">` : '<i></i>').join('')}</span>
    </button>`;
  }).join('')}</div>`);
  $('#bk').onclick = home;
  $('#hello').onclick = () => say(hello);
  app.querySelectorAll('.st').forEach(b => b.onclick = () => {
    const n = +b.dataset.n; if (!stUnlocked(n)) { sBad(); popText(`先完成第 ${n - 1} 站的「考一考」`); return; }
    sTap(); const s = stState(n); wordStation(n, s.done[2] ? (s.done[3] ? 0 : 3) : s.done.findIndex(d => !d));
  });
  if (!S.heard.words) { S.heard.words = 1; save(); setTimeout(() => say(hello), 300); }
}

function wordStation(n, step) {
  const ws = stWords(n), s = stState(n), g = STATION_GUIDE[n - 1];
  view(`<button class="back" id="bk">← 返回星星島</button>
  <div class="st-head">${DOLL(g, 'happy', 'th-doll')}<div><p>詞語星星島 · 第 ${n} 站</p><h2>${STATION_NAMES[n - 1]}</h2></div>
    <span class="st-stk big">${[2 * n - 2, 2 * n - 1].map(i => gotS('a', i) ? `<img src="img/stk/${sid('a', i)}.webp" alt="">` : '<i></i>').join('')}</span></div>
  <div class="mode-row" style="--n:4">${STEP_LBL.map((l, k) => `<button class="mode-btn ${['c-sky', 'c-butter', 'c-pink', 'c-lav'][k]} ${k === step ? 'on' : ''} ${stepOpen(n, k) ? '' : 'locked'}" data-k="${k}">${stepOpen(n, k) ? '' : '🔒 '}${l}${s.done[k] ? ' ✓' : ''}</button>`).join('')}</div>
  <div id="sbody"></div>`);
  $('#bk').onclick = wordIsle;
  app.querySelectorAll('[data-k]').forEach(b => b.onclick = () => {
    const k = +b.dataset.k; if (!stepOpen(n, k)) { sBad(); popText(`先完成「${STEP_LBL[k - 1].slice(2)}」`); return; }
    sTap(); wordStation(n, k);
  });
  const body = $('#sbody');
  [stRead, stWrite, stQuiz, stDict][step](n, ws, s, body, g);
}
const markStep = (n, k) => { const s = stState(n); if (!s.done[k]) { s.done[k] = 1; save(); return true; } return false; };
const nextBtn = (n, k, label) => `<div class="qbar"><button class="pill next" id="goNext">${label}</button></div>`;

/* ① 讀一讀 */
function stRead(n, ws, s, body, g) {
  const draw = () => {
    const all = ws.every((_, i) => s.heard.includes(i));
    body.innerHTML = `<div class="game-how">${DOLL(g, 'think')}<p>按 🔈 聽每個詞語和例句，留意紅色提示，不要寫錯字！<br><small>聽了 <b>${s.heard.length}</b> / 5 個詞語</small></p></div>
    <div class="wcards">${ws.map((w, i) => `<div class="wcard ${s.heard.includes(i) ? 'heard' : ''}">
      <div class="wc-top"><div class="wc-glyphs">${[...w.w].map((c, j) => `<span class="gcol">${glyphBox(c)}<small>${w.jp.split(' ')[j] || ''}</small></span>`).join('')}</div>
        <div class="wc-btns"><button class="pill c-sky" data-say="${i}">🔈 詞語</button><button class="pill c-mint" data-sent="${i}">🔈 例句</button></div></div>
      <p class="wc-sent">${esc(w.sent).replace(w.w, `<b>${w.w}</b>`)}</p>
      <div class="wc-tip"><span class="tipk">記字小貼士</span>${esc(w.tip)}</div>
      <div class="wc-wrong">不要寫成：<s>${esc(w.wrong)}</s> ✗</div>
    </div>`).join('')}</div>
    ${all ? nextBtn(n, 0, '讀好了！去寫一寫 →') : ''}`;
    fillGlyphs(body);
    const hear = i => { if (!s.heard.includes(i)) { s.heard.push(i); save(); const c = body.querySelectorAll('.wcard')[i]; c.classList.add('heard'); if (s.heard.length === 5) { markStep(n, 0); sGood(); popText('五個詞語都聽完了！'); setTimeout(draw, 900); } } };
    body.querySelectorAll('[data-say]').forEach(b => b.onclick = () => { const i = +b.dataset.say; say(ws[i].w + '。' + ws[i].w); hear(i); });
    body.querySelectorAll('[data-sent]').forEach(b => b.onclick = () => { const i = +b.dataset.sent; say(ws[i].sent); hear(i); });
    if ($('#goNext')) $('#goNext').onclick = () => wordStation(n, 1);
  };
  draw();
}

/* ② 寫一寫：有描紅 */
function stWrite(n, ws, s, body, g) { writeWords(n, ws, s, body, g, false); }
/* ④ 聽寫挑戰：沒有描紅 */
function stDict(n, ws, s, body, g) { writeWords(n, ws, s, body, g, true); }

function writeWords(n, ws, s, body, g, dict) {
  let wi = 0, ci = 0, writer = null, wordMiss = 0, peeked = false;
  const res = [];   // 聽寫：每個詞語是否過關
  const doneKey = i => ws[i].w;
  const draw = () => {
    const w = ws[wi], c = w.w[ci];
    body.innerHTML = `<div class="writebox wwrite">
      <div class="wb-left">
        <div class="tianzi" id="hzStage"></div>
        <div class="wb-ctrl">${dict ? `<button class="pill c-sky" id="again">🔈 再聽一次</button><button class="pill" id="peek">💡 偷看一下</button>` : `<button class="pill c-sky" id="hzPlay">▶ 看筆順</button><button class="pill" id="hzSay">🔈 讀音</button>`}</div>
      </div>
      <div class="wb-right">
        <p class="ww-k">${dict ? '聽寫挑戰' : '寫一寫'} · 第 ${wi + 1} / 5 個詞語</p>
        <div class="ww-slots">${[...w.w].map((x, j) => j < ci ? glyphBox(x, 'done') : j === ci ? `<span class="slot cur">${dict ? '?' : x}</span>` : `<span class="slot">${dict ? '' : x}</span>`).join('')}</div>
        ${dict ? `<p class="wb-word">聽聽句子：<b>${esc(w.sent.replace(w.w, '＿'.repeat(w.w.length)))}</b></p>` : `<p class="wb-word">${w.jp} · ${esc(w.tip)}</p>`}
        <p class="wb-tip" id="hzMsg">${dict ? '聽清楚詞語，在田字格寫出來。寫錯三次會有提示，四次會自動完成這一筆。' : '跟着淡淡的字一筆一筆寫，寫錯兩次會有提示，寫錯三次會自動幫你完成這一筆。'}</p>
        <div class="char-strip">${ws.map((x, i) => `<span class="wchip wide ${i === wi ? 'on' : ''} ${i < wi ? 'ok' : ''}">${dict && i >= wi ? '？'.repeat(x.w.length) : x.w}</span>`).join('')}</div>
        <p class="wb-note">筆順跟《香港小學學習字詞表》；如與老師所教不同，以老師及課本為準。</p>
      </div></div>`;
    fillGlyphs(body);
    const st = $('#hzStage'); const size = Math.min(300, st.clientWidth || 280);
    writer = HanziWriter.create(st, c, {
      width: size, height: size, padding: 18, showOutline: !dict, showCharacter: false,
      strokeColor: '#FF5C93', outlineColor: '#F4DCE8', drawingColor: '#4A3446', drawingWidth: 26,
      highlightColor: '#8B6FE0', showHintAfterMisses: dict ? 3 : 2, strokeAnimationSpeed: 1, delayBetweenStrokes: 220,
      charDataLoader: hzLoader,
    });
    const speak = () => say(dict ? `${w.w}。${w.sent}。${w.w}` : `${c}，${w.w}`);
    if (dict) {
      $('#again').onclick = speak;
      $('#peek').onclick = () => { peeked = true; wordMiss += 2; writer.showOutline(); setTimeout(() => writer.hideOutline(), 1400); };
      if (ci === 0) setTimeout(speak, 350);
    } else {
      $('#hzPlay').onclick = () => { sTap(); writer.cancelQuiz(); writer.animateCharacter({ onComplete: () => { writer.hideCharacter(); quiz(); } }); };
      $('#hzSay').onclick = speak; if (ci === 0) setTimeout(speak, 300);
    }
    const quiz = () => writer.quiz({
      leniency: 1.8, acceptBackwardsStrokes: true, markStrokeCorrectAfterMisses: dict ? 4 : 3,
      onMistake: () => { sBad(); wordMiss++; }, onCorrectStroke: () => sTap(),
      onComplete: () => {
        sGood(); ci++;
        if (ci < w.w.length) { popText(pick(['寫得好！', '好靚呀！', '繼續！'])); setTimeout(draw, 650); return; }
        // 一個詞語寫完
        const good = wordMiss <= w.w.length * 5;
        if (dict) { res.push({ w, good, miss: wordMiss }); if (good) { S.stars++; updStars(true); checkSticker(); } }
        else if (!s.wrote.includes(wi)) { s.wrote.push(wi); S.stars++; updStars(true); checkSticker(); }
        save(); confetti(); popText(dict ? (good ? '答對了！' : '寫完了！') : '詞語寫好了！');
        say(w.w); wi++; ci = 0; wordMiss = 0; peeked = false;
        setTimeout(() => wi < ws.length ? draw() : finish(), 1100);
      },
    });
    quiz();
  };
  const finish = () => {
    if (!dict) {
      markStep(n, 1);
      body.innerHTML = `<div class="game-done">${DOLL(g, 'cheer')}<div><h3>五個詞語都寫好了！</h3><p>下一步：考一考，答對 4 題或以上就有貼紙。</p>
        <div class="btns"><button class="pill next" id="goNext">去考一考 →</button><button class="pill" id="re">再寫一次</button></div></div></div>`;
      $('#goNext').onclick = () => wordStation(n, 2); $('#re').onclick = () => wordStation(n, 1);
      return;
    }
    const ok = res.filter(r => r.good).length; s.dict = Math.max(s.dict || 0, ok);
    if (ok >= 4) { markStep(n, 3); giveSticker('a', 2 * n - 1); checkAwards(); confetti(); setTimeout(confetti, 400); }
    save();
    body.innerHTML = `<div class="game-done">${DOLL(g, ok >= 4 ? 'cheer' : 'happy')}<div><h3>${ok === 5 ? '聽寫滿分！太厲害了！' : ok >= 4 ? '聽寫過關！' : '差少少，再試一次！'}</h3><p>寫得好的詞語：<b>${ok}</b> / 5${ok < 4 ? '（4 個或以上就有貼紙）' : ''}</p>
      <div class="dict-res">${res.map(r => `<div class="${r.good ? 'good' : 'bad'}">${[...r.w.w].map(c => glyphBox(c)).join('')}<span>${r.good ? '✓' : '再練習'}</span></div>`).join('')}</div>
      <div class="btns">${n < 8 && stUnlocked(n + 1) ? `<button class="pill next" id="nx">去第 ${n + 1} 站 →</button>` : ''}<button class="pill" id="re">再聽寫一次</button><button class="pill" id="map">返回星星島</button></div></div></div>`;
    fillGlyphs(body);
    if ($('#nx')) $('#nx').onclick = () => wordStation(n + 1, stState(n + 1).done.findIndex(d => !d) < 0 ? 0 : stState(n + 1).done.findIndex(d => !d));
    $('#re').onclick = () => wordStation(n, 3); $('#map').onclick = wordIsle;
  };
  if (typeof HanziWriter === 'undefined') { body.innerHTML = '<p>筆順功能未能載入，請重新整理頁面。</p>'; return; }
  draw();
}

/* ③ 考一考 */
function stQuiz(n, ws, s, body, g) {
  const others = WORDS.filter(x => !ws.includes(x));
  const qs = shuffle(ws).map((w, i) => {
    const t = i % 3;
    if (t === 0) return { t, w, ask: '哪一個詞語寫對了？', sent: w.sent, opts: shuffle([w.w, w.wrong]), ans: w.w, sayIt: w.w };
    if (t === 1) return { t, w, ask: '聽一聽，選出你聽到的詞語。', opts: shuffle([w.w, ...shuffle(ws.filter(x => x !== w)).slice(0, 2).map(x => x.w)]), ans: w.w, sayIt: w.w + '。' + w.w };
    return { t, w, ask: '選出合適的詞語，填在橫線上。', sent: w.sent.replace(w.w, '＿＿'), opts: shuffle([w.w, w.wrong, pick(others).w]), ans: w.w, sayIt: w.sent.replace(w.w, '，空格，') };
  });
  let i = 0, score = 0, tries = 0;
  const draw = () => {
    const q = qs[i]; tries = 0;
    body.innerHTML = `<div class="qcard wq">
      <div class="qtop"><span class="chip c-pink">${['找正確字詞', '聽音選詞', '例句填充'][q.t]}</span><span class="qcount">${i + 1} / 5</span></div>
      <h3 class="wq-ask">${q.ask} <button class="speak" id="qs">🔈</button></h3>
      ${q.sent && q.t === 2 ? `<p class="wq-sent">${fmt(esc(q.sent))}</p>` : q.t === 1 ? '<div class="wq-ear">👂</div>' : `<p class="wq-sent soft">${esc(q.w.sent.replace(q.w.w, '＿＿'))}</p>`}
      <div class="wq-opts">${q.opts.map(o => `<button class="choice wopt" data-o="${esc(o)}">${o}</button>`).join('')}</div>
      <div id="qfb"></div></div>`;
    $('#qs').onclick = () => say(q.sayIt);
    setTimeout(() => say(q.t === 1 ? q.sayIt : q.ask.replace('？', '') + '。' + (q.t === 2 ? q.sayIt : '')), 250);
    body.querySelectorAll('.wopt').forEach(b => b.onclick = () => {
      if (body.querySelector('.wopt.right')) return;
      if (b.dataset.o === q.ans) {
        b.classList.add('right'); sGood(); if (!tries) { score++; S.stars++; updStars(true); checkSticker(); save(); }
        popText(pick(['答對了！', '好叻呀！', '正確！']));
        $('#qfb').innerHTML = `<div class="feedback good">${MASCOT.kitty}<div><b>${esc(q.w.sent)}</b><div class="exp">${esc(q.w.tip)}</div></div></div><div class="qbar"><button class="pill next" id="qn">${i < 4 ? '下一題 →' : '看結果 →'}</button></div>`;
        say(q.w.sent); $('#qn').onclick = () => { i++; i < qs.length ? draw() : done(); };
      } else {
        tries++; sBad(); b.classList.add('wrong'); b.disabled = true;
        $('#qfb').innerHTML = `<div class="feedback hint">${MASCOT.bunny}<div>${q.opts.includes(q.w.wrong) && b.dataset.o === q.w.wrong ? '小心！這是常見的錯字。' : '差一點點！'}${esc(q.w.tip)} 再試一次。</div></div>`;
      }
    });
  };
  const done = () => {
    s.quiz = Math.max(s.quiz || 0, score); const pass = score >= 4;
    if (pass) { markStep(n, 2); giveSticker('a', 2 * n - 2); checkAwards(); confetti(); setTimeout(confetti, 400); }
    save();
    body.innerHTML = `<div class="game-done">${DOLL(g, pass ? 'cheer' : 'happy')}<div><h3>${score === 5 ? '全部答對！' : pass ? '考一考過關！' : '慢慢來，再試一次！'}</h3><p>一次答對 <b>${score}</b> / 5 題${pass ? '' : '（4 題或以上就過關）'}。</p>
      <div class="btns">${pass ? `<button class="pill next" id="goNext">去聽寫挑戰 →</button>` : `<button class="pill next" id="re">再考一次</button>`}<button class="pill" id="rd">回去讀一讀</button></div></div></div>`;
    if ($('#goNext')) $('#goNext').onclick = () => wordStation(n, 3);
    if ($('#re')) $('#re').onclick = () => wordStation(n, 2);
    $('#rd').onclick = () => wordStation(n, 0);
  };
  draw();
}

/* ---------- 兩本貼紙簿 ---------- */
function stickers(tab = 0) {
  checkAwards();
  const book = tab === 0
    ? STICKS_A.map((nm, i) => [sid('a', i), nm, AHINT(i), gotS('a', i)])
    : STICKS_B.map(([nm, h], i) => [sid('b', i), nm, h, gotS('b', i)]);
  const got = book.filter(x => x[3]).length;
  view(`<button class="back" id="bk">← 返回天空</button>
  <div class="topic-head">${DOLL(tab ? 'qing' : 'susu', 'cheer', 'th-doll')}<div><p>完成關卡，集齊 32 張貼紙！</p><h2>我的貼紙簿</h2></div></div>
  <div class="book-tabs"><button class="${tab === 0 ? 'on' : ''}" data-t="0">詞語星星貼紙簿 <b>${gotCount('a')}/16</b></button><button class="${tab === 1 ? 'on' : ''}" data-t="1">魔法島成就貼紙簿 <b>${gotCount('b')}/16</b></button></div>
  <div class="album ${tab ? 'b' : 'a'}">
    <div class="album-bar"><span style="width:${got / 16 * 100}%"></span><b>${got} / 16</b></div>
    <div class="album-grid">${book.map(([k, nm, h, ok]) => `<button class="stk ${ok ? 'got' : 'lock'}" data-nm="${esc(nm)}" data-h="${esc(h)}"><img src="img/stk/${k}.webp" alt="" draggable="false"><b>${ok ? nm : '？？？'}</b><small>${ok ? '' : h}</small></button>`).join('')}</div>
  </div>
  <h3 class="mini-title">星星小貼紙 <small>每得 5 粒星星就有一張（現有 ${S.stars} ★）</small></h3>
  <div class="sticker-grid mini">${STICKERS.map((s, i) => S.stars >= stickerAt(i) ? `<div class="sticker">${s}</div>` : `<div class="sticker lock">🔒<small>${stickerAt(i)} ★</small></div>`).join('')}</div>
  <div style="text-align:center;margin-top:20px"><button class="pill" id="rst">重設進度</button></div>`);
  $('#bk').onclick = home;
  app.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { sTap(); stickers(+b.dataset.t); });
  app.querySelectorAll('.stk').forEach(b => b.onclick = () => {
    if (b.classList.contains('got')) { b.classList.remove('wig'); void b.offsetWidth; b.classList.add('wig'); sGood(); say(b.dataset.nm); }
    else { sTap(); popText(b.dataset.h); say('要' + b.dataset.h + '，就可以得到呢張貼紙。'); }
  });
  let armed = false; $('#rst').onclick = () => { if (!armed) { armed = true; $('#rst').textContent = '再按一次確認清除所有進度'; return; } S.stars = 0; S.best = {}; S.mistakes = []; S.cards = {}; S.wrote = {}; S.heard = {}; S.words = {}; S.got = {}; save(); updStars(); stickers(tab); };
}
