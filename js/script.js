// Active nav link tracking
document.addEventListener('DOMContentLoaded', function() {
  const navLinks = document.querySelectorAll('.nav-link');

  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      if (!editMode) {
        navLinks.forEach(l => l.classList.remove('active'));
        this.classList.add('active');
      }
    });
  });

  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href && href.includes(currentPage)) {
      link.classList.add('active');
    }
  });
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    if (editMode) return;
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// Scroll reveal animation
const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -100px 0px' };
const observer = new IntersectionObserver(function(entries) {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, observerOptions);

document.querySelectorAll('.card, .highlight-card, .prev-card, .hotel-item').forEach(el => {
  observer.observe(el);
});

const style = document.createElement('style');
style.textContent = `
  .card, .highlight-card, .prev-card, .hotel-item {
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 0.6s ease, transform 0.6s ease;
  }
  .card.visible, .highlight-card.visible, .prev-card.visible, .hotel-item.visible {
    opacity: 1;
    transform: translateY(0);
  }
`;
document.head.appendChild(style);

// ─── EDIT MODE ───────────────────────────────────────────────────
let editMode = false;
const STORAGE_KEY = 'zerojack_edits';

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
    if (id && saved[id] !== undefined) {
      el.innerHTML = saved[id];
    }
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

function toggleEditMode() {
  editMode = !editMode;
  const btn = document.getElementById('edit-toggle-btn');
  const banner = document.getElementById('edit-banner');

  getEditables().forEach(el => {
    el.contentEditable = editMode ? 'true' : 'false';
    el.classList.toggle('editable-active', editMode);

    if (editMode) {
      el.addEventListener('input', onEditInput);
    } else {
      el.removeEventListener('input', onEditInput);
    }
  });

  if (editMode) {
    btn.innerHTML = '✅ 完成編輯';
    btn.classList.add('editing');
    banner.style.display = 'flex';
  } else {
    btn.innerHTML = '✏️ 編輯頁面';
    btn.classList.remove('editing');
    banner.style.display = 'none';
  }
}

function onEditInput(e) {
  const id = e.currentTarget.dataset.editId;
  if (id) saveEdit(id, e.currentTarget.innerHTML);
}

function clearPageEdits() {
  if (!confirm('確定要清除這頁的所有修改，恢復原始內容嗎？')) return;
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  getEditables().forEach(el => {
    const id = el.dataset.editId;
    if (id) delete saved[id];
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  location.reload();
}

// Init edit mode UI
document.addEventListener('DOMContentLoaded', function () {
  assignEditIds();
  loadSavedEdits();

  // Floating edit button
  const btn = document.createElement('button');
  btn.id = 'edit-toggle-btn';
  btn.innerHTML = '✏️ 編輯頁面';
  btn.onclick = toggleEditMode;
  document.body.appendChild(btn);

  // Edit banner
  const banner = document.createElement('div');
  banner.id = 'edit-banner';
  banner.innerHTML = `
    <span>✏️ 編輯模式 — 直接點擊文字修改，自動儲存</span>
    <button onclick="clearPageEdits()">🗑️ 清除這頁修改</button>
  `;
  banner.style.display = 'none';
  document.body.appendChild(banner);

  // Save toast
  const toast = document.createElement('div');
  toast.id = 'edit-toast';
  toast.textContent = '✅ 已儲存';
  document.body.appendChild(toast);
});
