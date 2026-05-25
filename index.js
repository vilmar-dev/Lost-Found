
// ============================
// FIREBASE SETUP
// ============================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {
  getDatabase,
  ref,
  push,
  onValue,
  set
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

const firebaseConfig = {
 apiKey: "AIzaSyA6JK3uyqF6xCNe82DgIuOiu3K-iGZ1lUE",
  authDomain: "aisat-loss-and-found.firebaseapp.com",
  databaseURL: "https://aisat-loss-and-found-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "aisat-loss-and-found",
  storageBucket: "aisat-loss-and-found.firebasestorage.app",
    messagingSenderId: "208522574409",
    appId: "1:208522574409:web:0d0d412335eeca3a525d98"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const itemsRef = ref(db, "items");

console.log("Firebase Connected");

// ============================
// STATE
// ============================

let items = [];

let adminMode = false;
let currentPage = 'browse';
let formType = 'lost';
let editingId = null;

// ============================
// FIREBASE READ (REALTIME)
// ============================

onValue(itemsRef, (snapshot) => {
  const data = snapshot.val();

  if (data) {
    items = Object.entries(data).map(([id, value]) => ({
      id,
      ...value
    }));
  } else {
    items = [];
  }

  renderAll();
});

// ============================
// HELPERS
// ============================

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function today(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

function formatDate(s) {
  if (!s) return '—';
  const d = new Date(s + 'T00:00:00');
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// ============================
// NAVIGATION
// ============================

const pageTitles = {
  browse: 'Browse Items',
  lost: 'Lost Items',
  found: 'Found Items',
  claimed: 'Claimed Items',
  admin: 'Admin Panel'
};

function showPage(page, btn) {
  document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

  document.getElementById('page-' + page).classList.add('active');
  if (btn) btn.classList.add('active');

  document.getElementById('pageTitle').textContent = pageTitles[page] || 'Portal';

  currentPage = page;
  renderAll();
}

// ============================
// RENDER ALL
// ============================

function renderAll() {
  updateStats();
  renderCards('browse');
  renderCards('lost');
  renderCards('found');
  renderCards('claimed');
  renderAdmin();
}

// ============================
// STATS
// ============================

function updateStats() {
  const active = items.filter(i => i.status !== 'removed');

  const lostCount = active.filter(i => i.type === 'lost' && i.status !== 'claimed').length;
  const foundCount = active.filter(i => i.type === 'found' && i.status !== 'claimed').length;
  const claimedCount = active.filter(i => i.status === 'claimed').length;

  document.getElementById('stat-total').textContent = active.length;
  document.getElementById('stat-lost').textContent = lostCount;
  document.getElementById('stat-found').textContent = foundCount;
  document.getElementById('stat-claimed').textContent = claimedCount;
  document.getElementById('itemCount').textContent = active.length;
}

// ============================
// RENDER CARDS
// ============================

function renderCards(page) {
  let filtered = items.filter(i => i.status !== 'removed');

  if (page === 'claimed') {
    filtered = filtered.filter(i => i.status === 'claimed');
  } else if (page === 'lost') {
    filtered = filtered.filter(i => i.type === 'lost' && i.status !== 'claimed');
    const q = document.getElementById('searchLost')?.value.toLowerCase() || '';
    if (q) filtered = filtered.filter(i =>
      (i.name + i.location + i.desc).toLowerCase().includes(q)
    );
  } else if (page === 'found') {
    filtered = filtered.filter(i => i.type === 'found' && i.status !== 'claimed');
    const q = document.getElementById('searchFound')?.value.toLowerCase() || '';
    if (q) filtered = filtered.filter(i =>
      (i.name + i.location + i.desc).toLowerCase().includes(q)
    );
  } else if (page === 'browse') {
    const q = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const t = document.getElementById('filterType')?.value || 'all';

    if (q) {
      filtered = filtered.filter(i =>
        (i.name + i.location + i.desc + i.contact).toLowerCase().includes(q)
      );
    }

    if (t !== 'all') {
      filtered = filtered.filter(i => i.type === t);
    }
  }

  filtered.sort((a, b) => b.createdAt - a.createdAt);

  const grid = document.getElementById(page + '-grid');
  if (!grid) return;

  grid.innerHTML = filtered.map(cardHTML).join('');
}

// ============================
// CARD UI
// ============================

function cardHTML(item) {
  const tagClass = item.status === 'claimed'
    ? 'tag-claimed'
    : (item.type === 'lost' ? 'tag-lost' : 'tag-found');

  return `
  <div class="item-card">
    <div class="card-body">
      <span class="card-tag ${tagClass}">${item.status}</span>

      <div class="card-title">${escHtml(item.name)}</div>

      <div class="card-meta">
        <div>📍 ${escHtml(item.location)}</div>
        <div>📅 ${formatDate(item.date)}</div>
      </div>

      <div class="card-contact">
        👤 ${escHtml(item.contactName)} · ${escHtml(item.contact)}
      </div>

      <div class="card-actions">
        <button onclick="claimItem('${item.id}')">Claim</button>
        <button onclick="verifyItem('${item.id}')">Verify</button>
        <button onclick="removeItem('${item.id}')">Remove</button>
      </div>
    </div>
  </div>`;
}

function escHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ============================
// SUBMIT POST (FIXED)
// ============================

function submitPost() {
  const name = document.getElementById('f-name').value.trim();
  const location = document.getElementById('f-location').value.trim();
  const date = document.getElementById('f-date').value;
  const desc = document.getElementById('f-desc').value.trim();
  const contactName = document.getElementById('f-contact-name').value.trim();
  const contact = document.getElementById('f-contact').value.trim();

  if (!name || !location || !date || !contactName || !contact) {
    toast('Please fill in all required fields.', 'error');
    return;
  }

  const item = {
    type: formType,
    name,
    location,
    date,
    desc,
    contactName,
    contact,
    image: "",
    status: "pending",
    createdAt: Date.now()
  };

  push(itemsRef, item);

  closeModal('postModal');
  renderAll();
  toast('Your post has been submitted!', 'success');
}

// ============================
// ACTIONS (FIXED FIREBASE)
// ============================

function claimItem(id) {
  const item = items.find(i => i.id === id);
  if (!item) return;

  set(ref(db, "items/" + id), {
    ...item,
    status: "claimed"
  });
}

function verifyItem(id) {
  const item = items.find(i => i.id === id);
  if (!item) return;

  set(ref(db, "items/" + id), {
    ...item,
    status: "verified"
  });
}

function removeItem(id) {
  const item = items.find(i => i.id === id);
  if (!item) return;

  set(ref(db, "items/" + id), {
    ...item,
    status: "removed"
  });
}

// ============================
// INIT
// ============================

renderAll();




// ============================
// FIX GLOBAL BUTTON ACCESS
// ============================

window.showPage = showPage;
window.submitPost = submitPost;
window.claimItem = claimItem;
window.verifyItem = verifyItem;
window.removeItem = removeItem;




// ============================
// MAKE FUNCTIONS GLOBALLY ACCESSIBLE
// ============================

window.showPage = showPage;
window.renderCards = renderCards;
window.openPostModal = openPostModal;
window.setFormType = setFormType;
window.previewImage = previewImage;
window.submitPost = submitPost;
window.claimItem = claimItem;
window.verifyItem = verifyItem;
window.removeItem = removeItem;
window.openModal = openModal;
window.closeModal = closeModal;
window.toggleSidebar = toggleSidebar;
window.closeSidebar = closeSidebar;
window.toggleAdminMode = toggleAdminMode;
window.showDetail = showDetail; // IMPORTANT





// ============================
// GLOBAL EXPORT FIX
// ============================

window.showPage = showPage;
window.renderCards = renderCards;
window.openPostModal = openPostModal;
window.setFormType = setFormType;
window.previewImage = previewImage;
window.submitPost = submitPost;

window.claimItem = claimItem;
window.verifyItem = verifyItem;
window.removeItem = removeItem;

window.openModal = openModal;
window.closeModal = closeModal;

window.toggleSidebar = toggleSidebar;
window.closeSidebar = closeSidebar;

window.toggleAdminMode = toggleAdminMode;
window.showDetail = showDetail;

console.log("GLOBAL FUNCTIONS EXPOSED");



window.showDetail = window.showDetail || function () {
  console.error("showDetail not defined");
};

console.log("showPage:", typeof showPage);
console.log("renderCards:", typeof renderCards);






// ============================
// HARD GLOBAL FIX (FOR ALL FUNCTIONS)
// ============================

function bindToWindow(obj) {
  Object.keys(obj).forEach(key => {
    window[key] = obj[key];
  });
}

bindToWindow({
  showPage,
  renderCards,
  openPostModal,
  setFormType,
  previewImage,
  submitPost,
  claimItem,
  verifyItem,
  removeItem,
  openModal,
  closeModal,
  toggleSidebar,
  closeSidebar,
  toggleAdminMode,
  showDetail
});

console.log("ALL FUNCTIONS BOUND TO WINDOW");
