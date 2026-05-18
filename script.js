// ── Настоящая загрузка перед FATHER_OS: прелоадим все картинки ──
(function bootLoader() {
  const MIN_MS = 800;    // минимум показа экрана, чтобы не моргнуло на быстрой сети
  const MAX_MS = 45000;  // потолок — если что-то зависло, не висим вечно

  document.addEventListener('DOMContentLoaded', () => {
    const screen = document.getElementById('boot-screen');
    const fill   = document.getElementById('boot-bar-fill');
    const txt    = document.getElementById('boot-pct');
    if (!screen) return;

    // Все картинки, нужные ивенту: арты, спам, коллаж, фон, кнопки
    const assets = [
      ...artAds.map(a => a.img),
      ...spamFiles,
      'pictures/spam/noise_collab.png',
      'pictures/spam/noise_background.png',
      'button.png',
      'button_back.png',
      'icon.png',
    ];
    const total = assets.length;
    let loaded  = 0;

    function refresh() {
      const pct = total ? Math.floor((loaded / total) * 100) : 100;
      if (fill) fill.style.width = pct + '%';
      if (txt)  txt.textContent  = pct + '%';
    }
    function bump() { loaded++; refresh(); }

    assets.forEach(src => {
      const img = new Image();
      img.onload  = bump;
      img.onerror = bump; // 404/ошибки не должны клинить буут
      img.src = src;
    });
    refresh();

    const start = performance.now();
    function check() {
      const elapsed = performance.now() - start;
      const done    = loaded >= total;
      if ((done && elapsed >= MIN_MS) || elapsed >= MAX_MS) {
        if (fill) fill.style.width = '100%';
        if (txt)  txt.textContent  = '100%';
        setTimeout(() => {
          screen.classList.add('hidden');
          setTimeout(() => screen.remove(), 600);
        }, 250);
      } else {
        requestAnimationFrame(check);
      }
    }
    requestAnimationFrame(check);
  });
})();

// ── Звуки: warn / click / hover / event_start ──────────
const SFX = {
  warn:       new Audio('sounds/sound_warn.mp3'),
  click:      new Audio('sounds/mouse_click.mp3'),
  hover:      new Audio('sounds/mouse_hover.mp3'),
  eventStart: new Audio('sounds/event_start.mp3'),
};
Object.values(SFX).forEach(a => { a.preload = 'auto'; });

const popSoundPool = [];

function playPopSound(pitch = 1.0) {
  const s = SFX.warn.cloneNode();
  s.volume = 0.5;
  s.preservesPitch = false;
  s.mozPreservesPitch = false;
  s.webkitPreservesPitch = false;
  s.playbackRate = pitch;
  s.play().catch(() => {});
  popSoundPool.push(s);
  s.addEventListener('ended', () => {
    const i = popSoundPool.indexOf(s);
    if (i !== -1) popSoundPool.splice(i, 1);
  }, { once: true });
}

function stopAllPopSounds() {
  popSoundPool.forEach(s => { try { s.pause(); } catch (e) {} });
  popSoundPool.length = 0;
}

function playClickSound() {
  const s = SFX.click.cloneNode();
  s.volume = 0.75;
  s.play().catch(() => {});
}

function playHoverSound() {
  const s = SFX.hover.cloneNode();
  s.volume = 0.75;
  s.play().catch(() => {});
}

function playEventStartSound(pitch = 1.0) {
  const s = SFX.eventStart;
  try { s.pause(); s.currentTime = 0; } catch (e) {}
  s.volume = 0.75;
  s.preservesPitch = false;
  s.mozPreservesPitch = false;
  s.webkitPreservesPitch = false;
  s.playbackRate = pitch;
  s.play().catch(() => {});
}

function attachHoverSound(el) {
  if (!el || el._hoverAttached) return;
  el._hoverAttached = true;
  el.addEventListener('mouseenter', playHoverSound);
}

// ── Эмбиент: hello_menu (+ hello_event при старте) → menu ──
const AMB = {
  helloMenu:   new Audio('sounds/ambient/ambient_noise_hello_menu.mp3'),
  helloEvent:  new Audio('sounds/ambient/ambient_noise_hello_event.mp3'),
  menu:        new Audio('sounds/ambient/ambient_noise_menu.mp3'),
  jingleRetro: new Audio('sounds/ambient/noise_jingle_retro.mp3'),
};
const AMB_VOL = { helloMenu: 0.3, helloEvent: 0.2, menu: 0.3, jingleRetro: 0.75 };
const AMB_FADE_MS = 800;
Object.values(AMB).forEach(a => { a.loop = true; a.volume = 0; a.preload = 'auto'; });

function fadeAudio(audio, from, to, ms, onDone) {
  try { audio.volume = Math.max(0, Math.min(1, from)); } catch (e) {}
  const start = performance.now();
  function step(now) {
    const t = Math.min(1, (now - start) / ms);
    try { audio.volume = Math.max(0, Math.min(1, from + (to - from) * t)); } catch (e) {}
    if (t < 1) requestAnimationFrame(step);
    else if (onDone) onDone();
  }
  requestAnimationFrame(step);
}

function startAmbient(audio, target, fadeMs = AMB_FADE_MS) {
  audio.volume = 0;
  audio.play().catch(() => {});
  fadeAudio(audio, 0, target, fadeMs);
}

function stopAmbient(audio, fadeMs = AMB_FADE_MS) {
  const startVol = audio.volume;
  fadeAudio(audio, startVol, 0, fadeMs, () => {
    try { audio.pause(); audio.currentTime = 0; } catch (e) {}
  });
}

let _ambHelloStarted = false;
let _ambHelloAttempt = false;
function startHelloMenuAmbient() {
  if (_ambHelloStarted || _ambHelloAttempt) return;
  _ambHelloAttempt = true;
  AMB.helloMenu.volume = 0;
  Promise.resolve(AMB.helloMenu.play()).then(() => {
    _ambHelloStarted = true;
    _ambHelloAttempt = false;
    fadeAudio(AMB.helloMenu, 0, AMB_VOL.helloMenu, AMB_FADE_MS);
    _ambDetachUnlock();
  }).catch(() => {
    _ambHelloAttempt = false;
  });
}

function _ambUnlockOnce() { startHelloMenuAmbient(); }
function _ambDetachUnlock() {
  window.removeEventListener('pointerdown', _ambUnlockOnce);
  window.removeEventListener('touchstart',  _ambUnlockOnce);
  window.removeEventListener('keydown',     _ambUnlockOnce);
}
window.addEventListener('pointerdown', _ambUnlockOnce, { passive: true });
window.addEventListener('touchstart',  _ambUnlockOnce, { passive: true });
window.addEventListener('keydown',     _ambUnlockOnce);
// Пробуем сразу — если браузер не разрешит, сработает по первому жесту выше
document.addEventListener('DOMContentLoaded', () => { startHelloMenuAmbient(); });

// ── Пул 1: арт-работы коллабораторов ──────────────────
const artAds = [
  { name: 'RUSSIAN BORZOI', img: 'pictures/art_Borzoi.png',  link: 'https://t.me/r_borzoi' },
  { name: 'Rachok',         img: 'pictures/art_Rachok.png',  link: 'https://t.me/RachoksPromiseL' },
  { name: 'Jester',         img: 'pictures/art_Jester.png',  link: 'https://t.me/smugJester257' },
  { name: 'Myriam',         img: 'pictures/art_Mira.png',    link: 'https://t.me/Myriam_opyat_est_ludeiv' },
  { name: 'Baicherra',      img: 'pictures/art_Bai.PNG',     link: 'https://t.me/baicantdie' },
  { name: 'Turtix',         img: 'pictures/art_Turtix.png',  link: 'https://turtix.itch.io/' },
  { name: 'Berk',           img: 'pictures/art_Berk.png',    link: 'https://t.me/cursedabandoned' },
  { name: 'Vzoltus',        img: 'pictures/art_Vzoltus.png', link: 'https://t.me/youkhowDa' },
  { name: 'T2Rrr',          img: 'pictures/art_T2Rrr.png',   link: 'https://t.me/T2Rrrrr' },
  { name: 'xenoren575',     img: 'pictures/art_Xenoren.png', link: 'https://t.me/xenoren575' },
  { name: 'Anx_art',        img: 'pictures/art_Anx.png',     link: 'https://t.me/Anx_art' },
  { name: 'Pifagor',        img: 'pictures/art_Pifagor.png', link: 'https://t.me/pifagorsshelter' },
  { name: 'ERROR',          img: 'pictures/art_Error.png',   link: 'https://t.me/Rat_Tail_Eternity' },
  { name: 'ERROR',          img: 'pictures/art_Error2.png',  link: 'https://t.me/Rat_Tail_Eternity' },
  { name: 'nerdyyyy',       img: 'pictures/art_Nerdy.png',   link: 'https://t.me/nerdyyyytgk' },
  { name: 'Stas',           img: 'pictures/art_Stas.png',    link: 'https://t.me/Stas_boys' },
  { name: 'D(evil)',        img: 'pictures/art_D(evil).png', link: 'https://t.me/deeyavolskoe' },
  { name: 'YAMA',           img: 'pictures/art_Yama.png',    link: 'https://t.me/yamakartini' },
  { name: 'Father',         img: 'pictures/art_Father.png',  link: 'https://t.me/fatherplace' },
];

// ── Пул 2: спам-файлы ─────────────────────────────────
const spamFiles = [
  'pictures/spam/noise_art.png',
  'pictures/spam/noise_art2.png',
  'pictures/spam/noise_art3.png',
  'pictures/spam/noise_art4.png',
  'pictures/spam/noise_art5.png',
  'pictures/spam/noise_art6.png',
  'pictures/spam/noise_art7.png',
  'pictures/spam/noise_art8.png',
  'pictures/spam/noise_art9.png',
  'pictures/spam/noise_art10.png',
  'pictures/spam/noise_art11.png',
  'pictures/spam/noise_art12.png',
  'pictures/spam/noise_art13.png',
  'pictures/spam/noise_art14.png',
];

// ── Состояние ──────────────────────────────────────────
const activePopups    = [];
let artQueue          = [];
let closedCount       = 0;
let spamStarted       = false;
let performanceOver   = false;
let performanceActive = false;
let _topZ             = 9000;
const IS_MOBILE       = window.matchMedia('(pointer: coarse)').matches;

// ── Прогресс-бар ───────────────────────────────────────
let _pctDisplayed = 0;
let _pctTarget    = 0;

function _tickPct() {
  if (_pctDisplayed >= _pctTarget) return;
  _pctDisplayed++;
  document.getElementById('ad-progress-text').textContent = _pctDisplayed + '%';
  AMB.jingleRetro.volume = Math.max(0, Math.min(1, AMB_VOL.jingleRetro * (_pctDisplayed / 100)));
  requestAnimationFrame(_tickPct);
}

function updateProgress() {
  const pct = Math.min(100, Math.round(closedCount / artAds.length * 100));
  document.getElementById('ad-progress-fill').style.width = pct + '%';
  _pctTarget = pct;
  requestAnimationFrame(_tickPct);
}

// ── Перемешивание ──────────────────────────────────────
function shuffled(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Управление попапами ────────────────────────────────
function removePopup(popup) {
  popup.remove();
  const i = activePopups.indexOf(popup);
  if (i !== -1) activePopups.splice(i, 1);

  if (popup.dataset.type === 'art') {
    closedCount++;
    updateProgress();
  }

  if (activePopups.length > 0) return;

  if (artQueue.length > 0) {
    spawnGroup();
  } else if (!spamStarted) {
    spamStarted = true;
    setTimeout(beginSpamPhase, 1000);
  }
}

// ── Спам-фаза: спам + красный одновременно ────────────
function beginSpamPhase() {
  const statusEl = document.querySelector('.status-line');
  setItalicText(statusEl, '▌КРИТИЧЕСКАЯ ОШИБКА ▐');
  statusEl.className   = 'status-line critical';

  const overlay = document.getElementById('red-overlay');
  overlay.classList.add('filling');
  spawnAll();
  // Низкий event_start стартует заранее: tail из MP3 + pitch 0.4 ≈ 1.5s «разгона»
  // до бабаха — попадает в момент появления меню при endSpamPhase в +3000ms.
  setTimeout(() => playEventStartSound(0.4), 1500);
  setTimeout(endSpamPhase, 3000);
}

// ── Конец перформанса: очистка → карусель ─────────────
function endSpamPhase() {
  performanceOver = true;
  stopAllPopSounds();

  // эмбиент: hello-слои уходят, включается menu; джингл остаётся низким и тихим
  stopAmbient(AMB.helloMenu);
  stopAmbient(AMB.helloEvent);
  startAmbient(AMB.menu, AMB_VOL.menu);

  // Джингл продолжает играть в меню ШУМ — низкий pitch + 15% громкости
  AMB.jingleRetro.preservesPitch = false;
  AMB.jingleRetro.mozPreservesPitch = false;
  AMB.jingleRetro.webkitPreservesPitch = false;
  AMB.jingleRetro.playbackRate = 0.5;
  fadeAudio(AMB.jingleRetro, AMB.jingleRetro.volume, 0.15, AMB_FADE_MS);

  activePopups.forEach(p => p.remove());
  activePopups.length = 0;

  document.getElementById('ad-progress').style.display = 'none';
  document.querySelector('.desktop').style.display     = 'none';

  // Карусель появляется одновременно с затуханием красного
  const overlay = document.getElementById('red-overlay');
  overlay.classList.remove('filling');
  overlay.style.zIndex     = '200001'; // выше карусели, чтобы затухание было видно
  overlay.style.opacity    = '1';
  void overlay.offsetWidth;
  overlay.style.transition = 'opacity 0.8s ease';
  overlay.style.opacity    = '0';
  showMenu();
  setTimeout(() => { overlay.style.display = 'none'; }, 800);
}

// ── Меню ───────────────────────────────────────────────
function showMenu() {
  document.getElementById('menu-screen').classList.add('active');
  document.getElementById('collab-view').classList.remove('active');
  document.getElementById('carousel').classList.remove('active');
}

function showCollab() {
  playClickSound();
  document.getElementById('menu-screen').classList.remove('active');
  document.getElementById('collab-view').classList.add('active');
}

function showGallery() {
  playClickSound();
  document.getElementById('menu-screen').classList.remove('active');
  initCarousel();
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btn-collab').addEventListener('click', showCollab);
  document.getElementById('btn-gallery').addEventListener('click', showGallery);
  document.getElementById('btn-yandex').addEventListener('click', () => { playClickSound(); window.open('https://disk.yandex.ru/d/3IwFRMTWIP-kPg', '_blank'); });
  document.getElementById('collab-back').addEventListener('click', () => { playClickSound(); showMenu(); });
  document.getElementById('carousel-back').addEventListener('click', () => { playClickSound(); showMenu(); });
  [
    'logoutBtn','btn-collab','btn-gallery','btn-yandex',
    'collab-back','carousel-back','carousel-prev','carousel-next'
  ].forEach(id => attachHoverSound(document.getElementById(id)));
  italicizeUppercase(document.body);
});

// ── Курсив для заглавных букв (только в смешанных словах) ─
const UP_RE  = /[A-ZА-ЯЁ]/;
const LOW_RE = /[a-zа-яё]/;
function italicizeUppercase(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const p = node.parentNode;
      if (!p) return NodeFilter.FILTER_REJECT;
      const tag = p.nodeName;
      if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'TEXTAREA') return NodeFilter.FILTER_REJECT;
      if (p.classList && p.classList.contains('italic-up')) return NodeFilter.FILTER_REJECT;
      return UP_RE.test(node.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    }
  });
  const nodes = [];
  let n;
  while ((n = walker.nextNode())) nodes.push(n);
  for (const node of nodes) {
    const text   = node.nodeValue;
    const tokens = text.split(/(\s+)/);   // сохраняем пробелы между токенами
    const frag   = document.createDocumentFragment();
    for (const tok of tokens) {
      if (UP_RE.test(tok) && LOW_RE.test(tok)) {
        // смешанный регистр - курсивим заглавные побуквенно
        for (let i = 0; i < tok.length; i++) {
          if (UP_RE.test(tok[i])) {
            const sp = document.createElement('span');
            sp.className   = 'italic-up';
            sp.textContent = tok[i];
            frag.appendChild(sp);
          } else {
            frag.appendChild(document.createTextNode(tok[i]));
          }
        }
      } else {
        frag.appendChild(document.createTextNode(tok));
      }
    }
    node.parentNode.replaceChild(frag, node);
  }
}
function setItalicText(el, text) {
  el.textContent = text;
  italicizeUppercase(el);
}

// ── Карусель ───────────────────────────────────────────
// 5 элементов (ci-0..ci-4), слоты: -2 -1  0  +1 +2
// Все 5 едут вместе — плавный вход И плавный выход с обеих сторон.
// Элемент, оказавшийся на ±3 (полностью за экраном), тихо
// переносится на ∓2 с новым контентом после завершения анимации.

let carouselIndex = 0;
let ciSlots       = [-2, -1, 0, 1, 2];
let _carouselBusy = false;
const CI_STEP     = 30; // vw между центрами слотов
const CI_COUNT    = 5;

function getArtName(imgPath) {
  return imgPath.split('/').pop().replace(/^art_/i, '').replace(/\.[^.]+$/, '');
}

function ciLoadContent(i, artIdx) {
  const n   = artAds.length;
  const ad  = artAds[((artIdx % n) + n) % n];
  const el  = document.getElementById('ci-' + i);
  const img = el.querySelector('.carousel-img');
  img.src      = ad.img;
  img.onclick  = () => { playClickSound(); window.open(ad.link, '_blank'); };
  attachHoverSound(img);
  setItalicText(el.querySelector('.carousel-item-name'), ad.name || getArtName(ad.img));
  const lnk = el.querySelector('.carousel-item-link');
  lnk.href        = ad.link;
  lnk.textContent = ad.link.replace(/^https?:\/\//, '');
}

function ciPlace(i, slot, instant) {
  const el  = document.getElementById('ci-' + i);
  const img = el.querySelector('.carousel-img');
  if (instant) {
    el.style.transition  = 'none';
    img.style.transition = 'none';
  }
  el.classList.toggle('ci-center', slot === 0);
  el.classList.toggle('ci-side',   slot !== 0);
  el.style.zIndex    = slot === 0 ? '2' : '1';
  el.style.transform = `translateX(${slot * CI_STEP}vw)`;
  el.style.opacity   = slot === 0 ? '1' : Math.abs(slot) === 1 ? '0.45' : '0';
  if (instant) {
    void el.offsetWidth;
    el.style.transition  = '';
    img.style.transition = '';
  }
}

function updateDots() {
  const box = document.getElementById('carousel-dots');
  box.innerHTML = '';
  artAds.forEach((_, i) => {
    const d = document.createElement('div');
    d.className = 'carousel-dot' + (i === carouselIndex ? ' active' : '');
    d.onclick   = () => { playClickSound(); jumpToArt(i); };
    attachHoverSound(d);
    box.appendChild(d);
  });
}

function jumpToArt(targetIdx) {
  if (_carouselBusy || targetIdx === carouselIndex) return;
  _carouselBusy = true;
  for (let i = 0; i < CI_COUNT; i++) document.getElementById('ci-' + i).style.opacity = '0';
  setTimeout(() => {
    carouselIndex = targetIdx;
    ciSlots = [-2, -1, 0, 1, 2];
    for (let i = 0; i < CI_COUNT; i++) {
      ciLoadContent(i, carouselIndex + (i - 2));
      ciPlace(i, i - 2, true);
    }
    updateDots();
    setTimeout(() => { _carouselBusy = false; }, 380);
  }, 280);
}

function initCarousel() {
  document.getElementById('carousel').classList.add('active');
  ciSlots = [-2, -1, 0, 1, 2];
  for (let i = 0; i < CI_COUNT; i++) {
    ciLoadContent(i, carouselIndex + (i - 2));
    ciPlace(i, i - 2, true);
  }
  document.getElementById('carousel-prev').onclick = () => { playClickSound(); switchArt(-1); };
  document.getElementById('carousel-next').onclick = () => { playClickSound(); switchArt(1); };
  updateDots();
}

function switchArt(dir) {
  if (_carouselBusy) return;
  _carouselBusy = true;

  carouselIndex = (carouselIndex + dir + artAds.length) % artAds.length;

  // Все 5 плавно едут на один слот
  for (let i = 0; i < CI_COUNT; i++) {
    ciSlots[i] -= dir;
    ciPlace(i, ciSlots[i], false);
  }

  updateDots();

  // После анимации: элемент на ±3 переносится на ∓2 с новым контентом
  setTimeout(() => {
    const farSlot  = -(dir * 3); // куда уехал выбывший элемент
    const toSlot   =  dir * 2;   // куда его поместить
    const recycleI = ciSlots.indexOf(farSlot);
    if (recycleI !== -1) {
      ciLoadContent(recycleI, carouselIndex + toSlot);
      ciPlace(recycleI, toSlot, true);
      ciSlots[recycleI] = toSlot;
    }
    _carouselBusy = false;
  }, 500);
}

// ── Спам: разгоняющийся поток ─────────────────────────
// Начинает медленно (~250ms между попапами), каждый шаг
// интервал умножается на 0.75 — быстро выходит на 5ms.
function spawnAll() {
  let delay    = 0;
  let interval = 250;
  const MIN    = 2;
  const DECAY  = 0.75;

  for (let i = 0; i < 500; i++) {
    const file = spamFiles[Math.floor(Math.random() * spamFiles.length)];
    const pitch = 1.0 + i * 0.01; // 1.0 → 6.0 — нарастающая истерика
    spawnOnePopup({ img: file, link: 'https://t.me/baicantdie' }, delay, pitch, 'spam');
    delay   += interval;
    interval = Math.max(MIN, interval * DECAY);
  }
}

// ── Группа артов: 1 (60%), 2 (30%), 3 (10%) ───────────
function spawnGroup() {
  const r     = Math.random();
  const count = r < 0.10 ? 3 : r < 0.40 ? 2 : 1;
  const safe  = Math.min(count, artQueue.length); // не выйти за пределы очереди
  for (let i = 0; i < safe; i++) {
    const pitch = 0.80 + Math.random() * 0.40; // 0.80 - 1.20
    spawnOnePopup(artQueue.pop(), i * 160, pitch, 'art');
  }
}

// ── Создание одного попапа ─────────────────────────────
function spawnOnePopup(ad, delay, pitch = 1.0, type = 'art') {
  const scale = 0.75 + Math.random() * 0.25;

  const popup = document.createElement('div');
  popup.className   = 'popup';
  popup.dataset.type = type;

  const inner = document.createElement('div');
  inner.className        = 'popup-inner';
  inner.style.transform  = `scale(${scale})`;
  inner.style.transformOrigin = 'top left';

  const img = document.createElement('img');
  img.src       = ad.img;
  img.draggable = false;
  img.alt       = '';

  inner.appendChild(img);

  let closeZone = null;

  if (type === 'art') {
    if (!IS_MOBILE) {
      img.title   = 'Перейти к автору';
      img.onclick = () => { playClickSound(); window.open(ad.link, '_blank'); };
    } else {
      img.style.cursor = 'default';
    }

    closeZone = document.createElement('div');
    closeZone.className = 'popup-close-zone';
    closeZone.onclick   = (e) => { e.stopPropagation(); playClickSound(); removePopup(popup); };
    inner.appendChild(closeZone);

    popup.addEventListener('mouseenter', () => { playHoverSound(); popup.style.zIndex = ++_topZ; });
    popup.addEventListener('mouseleave', () => { popup.style.zIndex = popup.dataset.baseZ || 1000; });
  } else {
    popup.style.pointerEvents = 'none';
  }

  popup.appendChild(inner);

  function calcFit() {
    const maxCssW = window.innerWidth  * 0.86;
    const maxCssH = window.innerHeight * 0.80;
    let rW = img.naturalWidth  || 300;
    let rH = img.naturalHeight || 300;
    if (rW > maxCssW) { rH = rH * maxCssW / rW; rW = maxCssW; }
    if (rH > maxCssH) { rW = rW * maxCssH / rH; rH = maxCssH; }
    return { sf: rW / (img.naturalWidth || rW), rW, rH };
  }

  function applyCloseZone() {
    if (!closeZone) return;
    const { sf } = calcFit();
    closeZone.style.top    = (15 * sf) + 'px';
    closeZone.style.right  = (17 * sf) + 'px';
    closeZone.style.width  = (61 * sf) + 'px';
    closeZone.style.height = (57 * sf) + 'px';
  }

  function place() {
    const { sf, rW, rH } = calcFit();
    if (closeZone) {
      closeZone.style.top    = (15 * sf) + 'px';
      closeZone.style.right  = (17 * sf) + 'px';
      closeZone.style.width  = (61 * sf) + 'px';
      closeZone.style.height = (57 * sf) + 'px';
    }

    const scaledW = rW * scale;
    const scaledH = rH * scale;
    const maxX = Math.max(10, window.innerWidth  - scaledW - 20);
    const maxY = Math.max(10, window.innerHeight - scaledH - 20);

    setTimeout(() => {
      if (performanceOver) return;
      popup.style.left = Math.floor(Math.random() * maxX) + 'px';
      popup.style.top  = Math.floor(Math.random() * maxY) + 'px';
      const zi = 1000 + activePopups.length;
      popup.style.zIndex   = zi;
      popup.dataset.baseZ  = zi;
      document.body.appendChild(popup);
      activePopups.push(popup);
      playPopSound(pitch);

      // ── Оптимизация: чистим старые спам-окна ────────
      if (type === 'spam') {
        const MAX_SPAM = 40;
        let count = 0;
        for (let i = activePopups.length - 1; i >= 0; i--) {
          if (activePopups[i].dataset.type === 'spam') {
            count++;
            if (count > MAX_SPAM) {
              const old = activePopups[i];
              old.classList.add('fading-out');
              setTimeout(() => { old.remove(); }, 260);
              activePopups.splice(i, 1);
            }
          }
        }
      }

      if (type === 'art') {
        document.body.classList.remove('site-shake');
        void document.body.offsetWidth;
        document.body.classList.add('site-shake');
      }
    }, delay);
  }

  popup._applyCloseZone = applyCloseZone;

  if (img.complete && img.naturalWidth > 0) place();
  else img.onload = place;
}

// ── Адаптация окна FATHER_OS под любой viewport ────────
function adaptMainWin() {
  const wrapper = document.querySelector('.main-win-wrapper');
  if (!wrapper) return;
  const win = wrapper.querySelector('.main-win');
  wrapper.style.transform = '';
  const sW  = (window.innerWidth  * 0.92) / win.offsetWidth;
  const sH  = (window.innerHeight * 0.85) / win.offsetHeight;
  const fit = Math.min(sW, sH);
  let scale = 1;
  if (fit < 1)        scale = fit;                          // не помещается — сжать
  else if (fit > 3.5) scale = Math.min(2.5, fit / 2);       // viewport огромный — увеличить
  if (scale !== 1) wrapper.style.transform = `scale(${scale.toFixed(4)})`;
}

// ── Resize: окно + close-zone + клэмп позиций попапов ──
let _resizeTimer = null;
window.addEventListener('resize', () => {
  clearTimeout(_resizeTimer);
  _resizeTimer = setTimeout(() => {
    adaptMainWin();
    activePopups.forEach(p => {
      p._applyCloseZone && p._applyCloseZone();
      const rect    = p.getBoundingClientRect();
      const curLeft = parseFloat(p.style.left) || 0;
      const curTop  = parseFloat(p.style.top)  || 0;
      const maxLeft = Math.max(0, window.innerWidth  - rect.width);
      const maxTop  = Math.max(0, window.innerHeight - rect.height);
      p.style.left  = Math.min(curLeft, maxLeft) + 'px';
      p.style.top   = Math.min(curTop,  maxTop)  + 'px';
    });
  }, 80);
});

adaptMainWin();

// ── Случайный красный флик фона ────────────────────────
function scheduleBgFlicker() {
  const delay = 500 + Math.random() * 2200; // 0.5 - 2.7s
  setTimeout(() => {
    const f    = document.getElementById('bg-flicker');
    const menu = document.getElementById('menu-screen');
    if (f && menu && menu.classList.contains('active')) {
      f.style.opacity = '1';
      setTimeout(() => { f.style.opacity = '0'; }, 20 + Math.random() * 35);
    }
    scheduleBgFlicker();
  }, delay);
}
scheduleBgFlicker();

// ── Секретный скип арт-фазы (Z) ───────────────────────
document.addEventListener('keydown', (e) => {
  if (e.code !== 'KeyZ') return;
  if (!performanceActive || spamStarted || performanceOver) return;

  activePopups.forEach(p => p.remove());
  activePopups.length = 0;
  artQueue.length     = 0;

  spamStarted = true;
  beginSpamPhase();
});

// ── Вспышка фона при старте ────────────────────────────
function flashDesktopBg() {
  const body = document.body;
  body.style.transition  = 'none';
  body.style.background  = '#cc0000';
  requestAnimationFrame(() => requestAnimationFrame(() => {
    body.style.transition = 'background 0.7s ease-out';
    body.style.background = '#120000';
  }));
}

// ── Старт ──────────────────────────────────────────────
function startAds(btn) {
  startHelloMenuAmbient();
  playClickSound();
  playEventStartSound();
  startAmbient(AMB.helloEvent, AMB_VOL.helloEvent);
  // Ретро-джингл: стартует с нулевой громкостью, нарастает в _tickPct по прогрессу
  AMB.jingleRetro.volume = 0;
  AMB.jingleRetro.playbackRate = 1.0; // сброс на случай повторного ивента
  try { AMB.jingleRetro.currentTime = 0; } catch (e) {}
  AMB.jingleRetro.play().catch(() => {});
  flashDesktopBg();
  btn.disabled      = true;
  setItalicText(btn, '[ ЗАБЛОКИРОВАННО ]');
  document.getElementById('desktop-credits').style.display = 'none';

  const win = document.querySelector('.main-win');
  win.classList.remove('win-shake');
  void win.offsetWidth;
  win.classList.add('win-shake');

  const statusEl = document.querySelector('.status-line');
  setItalicText(statusEl, '▌ ОШИБКА ▐');
  statusEl.className   = 'status-line error';

  document.getElementById('ad-progress').style.display = 'block';

  artQueue          = shuffled(artAds);
  closedCount       = 0;
  spamStarted       = false;
  performanceActive = true;
  updateProgress();
  setTimeout(spawnGroup, 1000);
}
