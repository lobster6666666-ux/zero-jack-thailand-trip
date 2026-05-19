// Active nav link tracking
document.addEventListener('DOMContentLoaded', function() {
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', function() {
      if (!editMode) {
        navLinks.forEach(l => l.classList.remove('active'));
        this.classList.add('active');
      }
    });
  });
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href && href.includes(currentPage)) link.classList.add('active');
  });
});

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    if (editMode) return;
    const target = document.querySelector(this.getAttribute('href'));
    if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });
});

// Scroll reveal
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.1, rootMargin: '0px 0px -100px 0px' });
document.querySelectorAll('.card, .highlight-card, .prev-card, .hotel-item').forEach(el => observer.observe(el));

const revealStyle = document.createElement('style');
revealStyle.textContent = `
  .card,.highlight-card,.prev-card,.hotel-item{opacity:0;transform:translateY(20px);transition:opacity .6s ease,transform .6s ease}
  .card.visible,.highlight-card.visible,.prev-card.visible,.hotel-item.visible{opacity:1;transform:translateY(0)}
`;
document.head.appendChild(revealStyle);

// ─── EDIT MODE ───────────────────────────────────────────────────
let editMode = false;
const STORAGE_KEY = 'zerojack_edits';
const TIME_REGEX = /^(\d{1,2}:\d{2})/;
const TIME_RANGE_REGEX = /^(\d{1,2}:\d{2})\s*[-~]\s*(\d{1,2}:\d{2})(.*)/;
const DATE_REGEX = /(\d{1,2}\/\d{1,2})/;

function getPageKey() {
  return window.location.pathname.split('/').pop() || 'index.html';
}

function getEditables() {
  return document.querySelectorAll('.card, .food-card, .highlight-card, .prev-card, .hotel-content, .ov-card');
}

function assignEditIds() {
  getEditables().forEach((el, i) => {
    if (!el.dataset.editId) el.dataset.editId = `${getPageKey()}-${i}`;
  });
}

function loadSavedEdits() {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  getEditables().forEach(el => {
    const id = el.dataset.editId;
    if (id && saved[id] !== undefined) el.innerHTML = saved[id];
  });
}

function saveEdit(id, html) {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  saved[id] = html;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  showSaveToast();
}

function showSaveToast() {
  const toast = document.getElementById('edit-toast');
  if (!toast) return;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 1500);
}

// ─── TIME SELECT ─────────────────────────────────────────────────
function makeTimeSelect(currentTime) {
  const select = document.createElement('select');
  select.className = 'edit-select edit-time-select';
  for (let h = 0; h < 24; h++) {
    for (let m of [0, 10, 20, 30, 40, 50]) {
      const time = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
      const opt = document.createElement('option');
      opt.value = time;
      opt.textContent = time;
      if (time === currentTime) opt.selected = true;
      select.appendChild(opt);
    }
  }
  return select;
}

// Trip dates: May 30 – June 7
function makeDateSelect(currentDate) {
  const select = document.createElement('select');
  select.className = 'edit-select edit-date-select';
  const dates = [
    '5/30','5/31','6/1','6/2','6/3','6/4','6/5','6/6','6/7'
  ];
  dates.forEach(d => {
    const opt = document.createElement('option');
    opt.value = d;
    opt.textContent = d;
    if (d === currentDate) opt.selected = true;
    select.appendChild(opt);
  });
  return select;
}

function activateSelects() {
  // Time selects: li items starting with HH:MM or HH:MM - HH:MM
  document.querySelectorAll('.card li').forEach(li => {
    if (li.dataset.selectified) return;
    const text = li.textContent.trim();
    if (!text.match(TIME_REGEX)) return;

    li.dataset.selectified = 'true';
    const card = li.closest('.card');

    const rangeMatch = text.match(TIME_RANGE_REGEX);
    li.contentEditable = 'false';
    li.innerHTML = '';

    if (rangeMatch) {
      // Two time selects: startTime - endTime remainder
      const startSelect = makeTimeSelect(rangeMatch[1]);
      const sep = document.createElement('span');
      sep.textContent = ' - ';
      const endSelect = makeTimeSelect(rangeMatch[2]);
      const remainderSpan = document.createElement('span');
      remainderSpan.contentEditable = 'true';
      remainderSpan.className = 'edit-remainder';
      remainderSpan.textContent = rangeMatch[3];

      [startSelect, endSelect].forEach(s => s.addEventListener('change', () => {
        if (card) saveEdit(card.dataset.editId, card.innerHTML);
      }));
      remainderSpan.addEventListener('input', () => {
        if (card) saveEdit(card.dataset.editId, card.innerHTML);
      });

      li.appendChild(startSelect);
      li.appendChild(sep);
      li.appendChild(endSelect);
      li.appendChild(remainderSpan);
    } else {
      // Single time select
      const timeSelect = makeTimeSelect(text.match(TIME_REGEX)[1]);
      const remainderSpan = document.createElement('span');
      remainderSpan.contentEditable = 'true';
      remainderSpan.className = 'edit-remainder';
      remainderSpan.textContent = text.slice(text.match(TIME_REGEX)[0].length);

      timeSelect.addEventListener('change', () => {
        if (card) saveEdit(card.dataset.editId, card.innerHTML);
      });
      remainderSpan.addEventListener('input', () => {
        if (card) saveEdit(card.dataset.editId, card.innerHTML);
      });

      li.appendChild(timeSelect);
      li.appendChild(remainderSpan);
    }

    const delBtn = document.createElement('button');
    delBtn.className = 'del-item-btn';
    delBtn.textContent = '✕';
    delBtn.onclick = (e) => { e.preventDefault(); li.remove(); if (card) saveEdit(card.dataset.editId, card.innerHTML); };
    li.appendChild(delBtn);
  });

  // Date selects: h3 headers with M/D pattern
  document.querySelectorAll('.card h3').forEach(h3 => {
    if (h3.dataset.selectified) return;
    const text = h3.textContent;
    const match = text.match(DATE_REGEX);
    if (!match) return;

    h3.dataset.selectified = 'true';
    h3.dataset.originalHtml = h3.innerHTML;

    const dateStr = match[1];
    const parts = text.split(dateStr);

    const before = document.createElement('span');
    before.contentEditable = 'true';
    before.className = 'edit-remainder';
    before.textContent = parts[0];

    const dateSelect = makeDateSelect(dateStr);

    const after = document.createElement('span');
    after.contentEditable = 'true';
    after.className = 'edit-remainder';
    after.textContent = parts.slice(1).join(dateStr);

    const card = h3.closest('.card');
    dateSelect.addEventListener('change', () => {
      if (card) saveEdit(card.dataset.editId, card.innerHTML);
    });
    [before, after].forEach(s => s.addEventListener('input', () => {
      if (card) saveEdit(card.dataset.editId, card.innerHTML);
    }));

    h3.contentEditable = 'false';
    h3.innerHTML = '';
    h3.appendChild(before);
    h3.appendChild(dateSelect);
    h3.appendChild(after);
  });
}

function addNewTimeItem(ul, card) {
  const li = document.createElement('li');
  li.contentEditable = 'false';
  li.dataset.selectified = 'true';

  const startSelect = makeTimeSelect('08:00');
  const sep = document.createElement('span');
  sep.textContent = ' - ';
  const endSelect = makeTimeSelect('09:00');
  const remainderSpan = document.createElement('span');
  remainderSpan.contentEditable = 'true';
  remainderSpan.className = 'edit-remainder';
  remainderSpan.textContent = ' ';

  [startSelect, endSelect].forEach(s => s.addEventListener('change', () => {
    if (card) saveEdit(card.dataset.editId, card.innerHTML);
  }));
  remainderSpan.addEventListener('input', () => {
    if (card) saveEdit(card.dataset.editId, card.innerHTML);
  });

  const delBtn = document.createElement('button');
  delBtn.className = 'del-item-btn';
  delBtn.textContent = '✕';
  delBtn.onclick = (e) => { e.preventDefault(); li.remove(); if (card) saveEdit(card.dataset.editId, card.innerHTML); };

  li.appendChild(startSelect);
  li.appendChild(sep);
  li.appendChild(endSelect);
  li.appendChild(remainderSpan);
  li.appendChild(delBtn);

  // Insert before the add button
  const addBtn = ul.querySelector('.add-item-btn');
  ul.insertBefore(li, addBtn || null);

  // Focus the text span
  setTimeout(() => {
    remainderSpan.focus();
    const range = document.createRange();
    range.selectNodeContents(remainderSpan);
    range.collapse(false);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
  }, 50);

  if (card) saveEdit(card.dataset.editId, card.innerHTML);
}

function activateAddButtons() {
  document.querySelectorAll('.card').forEach(card => {
    card.querySelectorAll('ul').forEach(ul => {
      if (ul.querySelector('.add-item-btn')) return;
      const btn = document.createElement('button');
      btn.className = 'add-item-btn';
      btn.textContent = '＋ 新增行程';
      btn.onclick = (e) => { e.preventDefault(); addNewTimeItem(ul, card); };
      ul.appendChild(btn);
    });
  });
}

function deactivateAddButtons() {
  document.querySelectorAll('.add-item-btn').forEach(btn => btn.remove());
}

function deactivateSelects() {
  document.querySelectorAll('[data-selectified]').forEach(el => {
    const timeSelects = el.querySelectorAll('.edit-time-select');
    const dateSelect = el.querySelector('.edit-date-select');
    const remainder = el.querySelector('.edit-remainder');

    if (timeSelects.length === 2) {
      const remainText = remainder ? remainder.textContent : '';
      el.textContent = timeSelects[0].value + ' - ' + timeSelects[1].value + remainText;
    } else if (timeSelects.length === 1) {
      const remainText = remainder ? remainder.textContent : '';
      el.textContent = timeSelects[0].value + remainText;
    } else if (dateSelect) {
      const before = el.querySelectorAll('.edit-remainder')[0];
      const after = el.querySelectorAll('.edit-remainder')[1];
      el.textContent = (before ? before.textContent : '') + dateSelect.value + (after ? after.textContent : '');
    }

    delete el.dataset.selectified;
  });
}

// ─── TOGGLE EDIT MODE ────────────────────────────────────────────
function toggleEditMode() {
  editMode = !editMode;
  const btn = document.getElementById('edit-toggle-btn');
  const banner = document.getElementById('edit-banner');

  const fontCtrl = document.getElementById('font-ctrl');

  if (editMode) {
    activateSelects();
    activateAddButtons();
    getEditables().forEach(el => {
      el.contentEditable = 'true';
      el.classList.add('editable-active');
      el.addEventListener('input', onEditInput);
    });
    btn.innerHTML = '✅ 完成編輯';
    btn.classList.add('editing');
    banner.style.display = 'flex';
    if (fontCtrl) fontCtrl.style.display = 'flex';
  } else {
    deactivateAddButtons();
    deactivateSelects();
    getEditables().forEach(el => {
      el.contentEditable = 'false';
      el.classList.remove('editable-active');
      el.removeEventListener('input', onEditInput);
      saveEdit(el.dataset.editId, el.innerHTML);
    });
    btn.innerHTML = '✏️ 編輯頁面';
    btn.classList.remove('editing');
    banner.style.display = 'none';
    if (fontCtrl) fontCtrl.style.display = 'none';
  }
}

let _activateDebounce = null;

function onEditInput(e) {
  const id = e.currentTarget.dataset.editId;
  if (id) saveEdit(id, e.currentTarget.innerHTML);
  clearTimeout(_activateDebounce);
  _activateDebounce = setTimeout(activateSelects, 600);
}

function clearPageEdits() {
  if (!confirm('確定要清除這頁的所有修改，恢復原始內容嗎？')) return;
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  getEditables().forEach(el => { const id = el.dataset.editId; if (id) delete saved[id]; });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  location.reload();
}

// ─── FONT SIZE ───────────────────────────────────────────────────
const FONT_KEY = 'zerojack_fontsize';
const FONT_STEPS = [14, 16, 18, 21, 24];

function applyFontSize(size) {
  document.documentElement.style.fontSize = size + 'px';
  localStorage.setItem(FONT_KEY, size);
  const label = document.getElementById('font-size-label');
  if (label) label.textContent = size + 'px';
}

function changeFontSize(delta) {
  const current = parseInt(localStorage.getItem(FONT_KEY) || 16);
  const idx = FONT_STEPS.indexOf(current);
  const next = FONT_STEPS[Math.min(Math.max(idx + delta, 0), FONT_STEPS.length - 1)];
  applyFontSize(next);
}

// ─── INIT ────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  assignEditIds();
  loadSavedEdits();

  // Font size controls
  const savedSize = parseInt(localStorage.getItem(FONT_KEY) || 16);
  applyFontSize(savedSize);

  const fontCtrl = document.createElement('div');
  fontCtrl.id = 'font-ctrl';
  fontCtrl.innerHTML = `
    <button onclick="changeFontSize(-1)" title="縮小字體">A−</button>
    <span id="font-size-label">${savedSize}px</span>
    <button onclick="changeFontSize(1)" title="放大字體">A+</button>
  `;
  fontCtrl.style.display = 'none';
  document.body.appendChild(fontCtrl);

  const btn = document.createElement('button');
  btn.id = 'edit-toggle-btn';
  btn.innerHTML = '✏️ 編輯頁面';
  btn.onclick = toggleEditMode;
  document.body.appendChild(btn);

  const banner = document.createElement('div');
  banner.id = 'edit-banner';
  banner.innerHTML = `
    <span>✏️ 編輯模式 — 時間/日期用下拉選單選擇，其他文字直接點擊修改</span>
    <button onclick="clearPageEdits()">🗑️ 清除這頁修改</button>
  `;
  banner.style.display = 'none';
  document.body.appendChild(banner);

  const toast = document.createElement('div');
  toast.id = 'edit-toast';
  toast.textContent = '✅ 已儲存';
  document.body.appendChild(toast);
});
