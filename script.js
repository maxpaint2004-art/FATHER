// ── Звук появления попапа ──────────────────────────────
const popSound    = new Audio('windows-7-ding.wav');
const navSound    = new Audio('windows-7-navigation-start.wav');
const popSoundPool = [];

function playPopSound(pitch = 1.0) {
  const s = popSound.cloneNode();
  s.volume = 0.6;
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

function playNavSound() {
  const s = navSound.cloneNode();
  s.volume = 0.6;
  s.play().catch(() => {});
}

// ── Пул 1: арт-работы коллабораторов ──────────────────
const artAds = [
  { img: 'pictures/art_Borzoi.png',  link: 'https://t.me/r_borzoi' },
  { img: 'pictures/art_Rachok.png',  link: 'https://t.me/RachoksPromiseL' },
  { img: 'pictures/art_Jester.png',  link: 'https://t.me/smugJester257' },
  { img: 'pictures/art_Mira.png',    link: 'https://t.me/Myriam_opyat_est_ludeiv' },
  { img: 'pictures/art_Bai.PNG',     link: 'https://t.me/baicantdie' },
  { img: 'pictures/art_Turtix.png',  link: 'https://turtix.itch.io/' },
  { img: 'pictures/art_Berk.png',    link: 'https://t.me/cursedabandoned' },
  { img: 'pictures/art_Vzoltus.png', link: 'https://t.me/youkhowDa' },
  { img: 'pictures/art_T2Rrr.png',   link: 'https://t.me/T2Rrrrr' },
  { img: 'pictures/art_Xenoren.png', link: 'https://t.me/xenoren575' },
  { img: 'pictures/art_Anx.png',     link: 'https://t.me/Anx_art' },
  { img: 'pictures/art_Pifagor.png', link: 'https://t.me/pifagorsshelter' },
  { img: 'pictures/art_Error.png',   link: 'https://t.me/Rat_Tail_Eternity' },
  { img: 'pictures/art_Error2.png',  link: 'https://t.me/Rat_Tail_Eternity' },
  { img: 'pictures/art_Nerdy.png',   link: 'https://t.me/nerdyyyytgk' },
  { img: 'pictures/art_Stas.png',    link: 'https://t.me/Stas_boys' },
  { img: 'pictures/art_D(evil).png', link: 'https://t.me/deeyavolskoe' },
  { img: 'pictures/art_Yama.png',    link: 'https://t.me/yamakartini' },
  { img: 'pictures/art_Father.png',  link: 'https://t.me/baicantdie' },
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

// ── Прогресс-бар ───────────────────────────────────────
let _pctDisplayed = 0;
let _pctTarget    = 0;

function _tickPct() {
  if (_pctDisplayed >= _pctTarget) return;
  _pctDisplayed++;
  document.getElementById('ad-progress-text').textContent = _pctDisplayed + '%';
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
  statusEl.textContent = '▌КРИТИЧЕСКАЯ ОШИБКА ▐';
  statusEl.className   = 'status-line critical';

  const overlay = document.getElementById('red-overlay');
  overlay.classList.add('filling');
  spawnAll();
  setTimeout(endSpamPhase, 3000);
}

// ── Конец перформанса: очистка → карусель ─────────────
function endSpamPhase() {
  performanceOver = true;
  stopAllPopSounds();

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
  initCarousel();
  setTimeout(() => { overlay.style.display = 'none'; }, 800);
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
  img.onclick  = () => window.open(ad.link, '_blank');
  el.querySelector('.carousel-item-name').textContent = getArtName(ad.img);
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
    d.onclick   = () => jumpToArt(i);
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
  document.getElementById('carousel-prev').onclick = () => { playNavSound(); switchArt(-1); };
  document.getElementById('carousel-next').onclick = () => { playNavSound(); switchArt(1); };
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
    spawnOnePopup({ img: file, link: 'https://t.me/baicantdie' }, delay, 1.0, 'spam');
    delay   += interval;
    interval = Math.max(MIN, interval * DECAY);
  }
}

// ── Группа артов: 1 (60%), 2 (30%), 3 (10%) ───────────
function spawnGroup() {
  const r     = Math.random();
  const count = r < 0.10 ? 3 : r < 0.40 ? 2 : 1;
  const safe  = Math.min(count, artQueue.length); // не выйти за пределы очереди
  const pitch = safe === 3 ? 1.30 : safe === 2 ? 1.15 : 1.0;
  for (let i = 0; i < safe; i++) {
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
    img.title   = 'Перейти к автору';
    img.onclick = () => window.open(ad.link, '_blank');

    closeZone = document.createElement('div');
    closeZone.className = 'popup-close-zone';
    closeZone.onclick   = (e) => { e.stopPropagation(); playNavSound(); removePopup(popup); };
    inner.appendChild(closeZone);

    popup.addEventListener('mouseenter', () => { popup.style.zIndex = ++_topZ; });
    popup.addEventListener('mouseleave', () => { popup.style.zIndex = popup.dataset.baseZ || 1000; });
  } else {
    popup.style.pointerEvents = 'none';
  }

  popup.appendChild(inner);

  function calcSf() {
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
    const { sf } = calcSf();
    closeZone.style.top    = (15 * sf) + 'px';
    closeZone.style.right  = (17 * sf) + 'px';
    closeZone.style.width  = (61 * sf) + 'px';
    closeZone.style.height = (57 * sf) + 'px';
  }

  function place() {
    const { sf, rW, rH } = calcSf();
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

// ── Адаптация окна FATHER_OS под размер экрана ─────────
function adaptMainWin() {
  const wrapper = document.querySelector('.main-win-wrapper');
  if (!wrapper) return;
  const win = wrapper.querySelector('.main-win');
  wrapper.style.transform = '';
  const scaleW = Math.min(1, (window.innerWidth  * 0.92) / win.offsetWidth);
  const scaleH = Math.min(1, (window.innerHeight * 0.92) / win.offsetHeight);
  const scale  = Math.min(scaleW, scaleH);
  if (scale < 1) wrapper.style.transform = `scale(${scale.toFixed(4)})`;
}

// ── Адаптация попапов при изменении зума ───────────────
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

// ── Секретный скип арт-фазы (Z) ───────────────────────
document.addEventListener('keydown', (e) => {
  if (e.key !== 'z' && e.key !== 'Z') return;
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
  playNavSound();
  flashDesktopBg();
  btn.disabled      = true;
  btn.textContent   = '[ ЗАБЛОКИРОВАННО ]';
  document.getElementById('desktop-credits').style.display = 'none';

  const win = document.querySelector('.main-win');
  win.classList.remove('win-shake');
  void win.offsetWidth;
  win.classList.add('win-shake');

  const statusEl = document.querySelector('.status-line');
  statusEl.textContent = '▌ ОШИБКА ▐';
  statusEl.className   = 'status-line error';

  document.getElementById('ad-progress').style.display = 'block';

  artQueue          = shuffled(artAds);
  closedCount       = 0;
  spamStarted       = false;
  performanceActive = true;
  updateProgress();
  setTimeout(spawnGroup, 1000);
}

adaptMainWin();
