
// ============================
// STATE
// ============================
let items = JSON.parse(localStorage.getItem('lf_items') || '[]');
let adminMode = false;
let currentPage = 'browse';
let formType = 'lost';
let editingId = null;

// Seed demo data
if (items.length === 0) {
  items = [
    { id: uid(), type: 'lost', name: 'Black Leather Wallet', location: 'Main Library, 2nd Floor', date: today(-1), desc: 'Contains ID, bank cards, and some cash. Has a small "R" engraved at the back.', contactName: 'Ramon Santos', contact: '09171234567', image: '', status: 'pending', createdAt: Date.now()-86400000 },
    { id: uid(), type: 'found', name: 'iPhone 14 (Black)', location: 'Cafeteria near entrance', date: today(0), desc: 'Screen cracked slightly on corner. Found under table during lunch.', contactName: 'Maria Cruz', contact: 'maria.cruz@email.com', image: '', status: 'verified', createdAt: Date.now()-3600000 },
    { id: uid(), type: 'lost', name: 'Blue JanSport Backpack', location: 'Gate 3 / Parking Area', date: today(-2), desc: 'Contains laptop, notebooks, and charger. Has keychain of a panda attached.', contactName: 'Josh Reyes', contact: 'josh.r / FB Messenger', image: '', status: 'pending', createdAt: Date.now()-172800000 },
    { id: uid(), type: 'found', name: 'Student ID Card', location: 'Engineering Bldg Hallway', date: today(0), desc: 'Found on the floor near the engineering bulletin board.', contactName: 'Security Office', contact: 'security@campus.edu', image: '', status: 'pending', createdAt: Date.now()-1800000 },
    { id: uid(), type: 'lost', name: 'Airpods Pro (White Case)', location: 'Science Lab Room 204', date: today(-3), desc: 'Left during afternoon session. Case has a small yellow sticker.', contactName: 'Ana Mendoza', contact: '09987654321', image: '', status: 'claimed', createdAt: Date.now()-259200000 },
  ];
  save();
}

function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }
function today(offset=0) {
  const d = new Date(); d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0,10);
}
function save() { localStorage.setItem('lf_items', JSON.stringify(items)); }
function formatDate(s) {
  if (!s) return '—';
  const d = new Date(s + 'T00:00:00');
  return d.toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' });
}

// ============================
// NAVIGATION
// ============================
const pageTitles = { browse:'Browse Items', lost:'Lost Items', found:'Found Items', claimed:'Claimed Items', admin:'Admin Panel' };

function showPage(page, btn) {
  document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  if (btn) btn.classList.add('active');
  document.getElementById('pageTitle').textContent = pageTitles[page] || 'Portal';
  currentPage = page;
  renderAll();
}

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
  const searchId = { browse: 'searchInput', lost: 'searchLost', found: 'searchFound' };
  const gridId = page + '-grid';
  const emptyId = page + '-empty';

  if (page === 'claimed') {
    filtered = filtered.filter(i => i.status === 'claimed');
  } else if (page === 'lost') {
    filtered = filtered.filter(i => i.type === 'lost' && i.status !== 'claimed');
    const q = document.getElementById('searchLost')?.value.toLowerCase() || '';
    if (q) filtered = filtered.filter(i => (i.name+i.location+i.desc).toLowerCase().includes(q));
  } else if (page === 'found') {
    filtered = filtered.filter(i => i.type === 'found' && i.status !== 'claimed');
    const q = document.getElementById('searchFound')?.value.toLowerCase() || '';
    if (q) filtered = filtered.filter(i => (i.name+i.location+i.desc).toLowerCase().includes(q));
  } else if (page === 'browse') {
    const q = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const t = document.getElementById('filterType')?.value || 'all';
    const dateF = document.getElementById('filterDate')?.value || 'all';
    if (q) filtered = filtered.filter(i => (i.name+i.location+i.desc+i.contact).toLowerCase().includes(q));
    if (t !== 'all') filtered = filtered.filter(i => i.type === t);
    if (dateF !== 'all') {
      const now = new Date(); now.setHours(0,0,0,0);
      filtered = filtered.filter(i => {
        const d = new Date(i.date + 'T00:00:00');
        if (dateF === 'today') return d >= now;
        if (dateF === 'week') { const w = new Date(now); w.setDate(w.getDate()-7); return d >= w; }
        if (dateF === 'month') { const m = new Date(now); m.setDate(m.getDate()-30); return d >= m; }
        return true;
      });
    }
  }

  filtered.sort((a,b) => b.createdAt - a.createdAt);

  const grid = document.getElementById(gridId);
  const empty = document.getElementById(emptyId);
  if (!grid) return;

  if (filtered.length === 0) {
    grid.innerHTML = '';
    if (empty) empty.style.display = 'block';
  } else {
    if (empty) empty.style.display = 'none';
    grid.innerHTML = filtered.map(i => cardHTML(i)).join('');
  }
}

function cardHTML(item) {
  const tagClass = item.status === 'claimed' ? 'tag-claimed' : (item.type === 'lost' ? 'tag-lost' : 'tag-found');
  const tagLabel = item.status === 'claimed' ? '🏷️ Claimed' : (item.type === 'lost' ? '😟 Lost' : '✅ Found');
  const imageSection = item.image
    ? `<div class="card-image"><img src="${item.image}" alt="${item.name}"/></div>`
    : `<div class="card-image">${item.type === 'lost' ? '😟' : '✅'}</div>`;
  const verifiedBadge = item.status === 'verified' ? `<span class="verified-badge">✔ Verified</span>` : '';
  const claimBtn = (item.status !== 'claimed' && !adminMode) ? `<button class="btn btn-outline btn-sm" onclick="claimItem('${item.id}')">🏷️ Claim</button>` : '';
  const adminBtns = adminMode && item.status !== 'removed' ? `
    ${item.status !== 'verified' ? `<button class="btn btn-success btn-sm" onclick="verifyItem('${item.id}')">✔ Verify</button>` : ''}
    <button class="btn btn-danger btn-sm" onclick="removeItem('${item.id}')">🗑 Remove</button>
  ` : '';

  return `<div class="item-card" id="card-${item.id}">
    ${imageSection}
    ${verifiedBadge}
    <div class="card-body">
      <span class="card-tag ${tagClass}">${tagLabel}</span>
      <div class="card-title">${escHtml(item.name)}</div>
      <div class="card-meta">
        <div class="card-meta-row"><span>📍</span>${escHtml(item.location)}</div>
        <div class="card-meta-row"><span>📅</span>${formatDate(item.date)}</div>
        ${item.desc ? `<div class="card-meta-row"><span>📝</span>${escHtml(item.desc).substring(0,80)}${item.desc.length>80?'…':''}</div>` : ''}
      </div>
      <div class="card-contact">👤 ${escHtml(item.contactName)} · ${escHtml(item.contact)}</div>
      <div class="card-actions">
        <button class="btn btn-outline btn-sm" onclick="showDetail('${item.id}')">👁 View Details</button>
        ${claimBtn}
        ${adminBtns}
      </div>
    </div>
  </div>`;
}

function escHtml(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ============================
// POST MODAL
// ============================
function openPostModal(type) {
  editingId = null;
  setFormType(type || 'lost');
  document.getElementById('f-name').value = '';
  document.getElementById('f-location').value = '';
  document.getElementById('f-date').value = today(0);
  document.getElementById('f-desc').value = '';
  document.getElementById('f-contact-name').value = '';
  document.getElementById('f-contact').value = '';
  document.getElementById('f-image').value = '';
  document.getElementById('f-image-preview').style.display = 'none';
  document.getElementById('postModalTitle').textContent = 'Post an Item';
  openModal('postModal');
}

function setFormType(type) {
  formType = type;
  document.querySelectorAll('.type-option').forEach(b => b.classList.remove('active'));
  document.getElementById('typeBtn-' + type).classList.add('active');
}

function previewImage(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const img = document.getElementById('f-image-preview');
    img.src = e.target.result;
    img.style.display = 'block';
  };
  reader.readAsDataURL(file);
}

function submitPost() {
  const name = document.getElementById('f-name').value.trim();
  const location = document.getElementById('f-location').value.trim();
  const date = document.getElementById('f-date').value;
  const desc = document.getElementById('f-desc').value.trim();
  const contactName = document.getElementById('f-contact-name').value.trim();
  const contact = document.getElementById('f-contact').value.trim();
  const imgSrc = document.getElementById('f-image-preview').src || '';
  const imageData = document.getElementById('f-image-preview').style.display !== 'none' ? imgSrc : '';

  if (!name || !location || !date || !contactName || !contact) {
    toast('Please fill in all required fields.', 'error'); return;
  }

  const item = {
    id: editingId || uid(),
    type: formType,
    name, location, date, desc, contactName, contact,
    image: imageData,
    status: 'pending',
    createdAt: Date.now()
  };

  if (editingId) {
    const idx = items.findIndex(i => i.id === editingId);
    if (idx !== -1) { item.status = items[idx].status; items[idx] = item; }
    toast('Item updated successfully!', 'success');
  } else {
    items.unshift(item);
    toast('Your post has been submitted!', 'success');
  }

  save();
  closeModal('postModal');
  renderAll();
}

// ============================
// DETAIL MODAL
// ============================
function showDetail(id) {
  const item = items.find(i => i.id === id);
  if (!item) return;

  const tagClass = item.status === 'claimed' ? 'tag-claimed' : (item.type === 'lost' ? 'tag-lost' : 'tag-found');
  const tagLabel = item.status === 'claimed' ? '🏷️ Claimed' : (item.type === 'lost' ? '😟 Lost' : '✅ Found');

  document.getElementById('detailModalTitle').textContent = item.name;
  document.getElementById('detailModalBody').innerHTML = `
    ${item.image ? `<img src="${item.image}" class="detail-image" alt="${escHtml(item.name)}"/>` : ''}
    <span class="card-tag ${tagClass}" style="margin-bottom:16px; display:inline-flex;">${tagLabel}</span>
    ${item.status === 'verified' ? `<span class="verified-badge" style="position:static; margin-left:8px; display:inline-flex; vertical-align:middle;">✔ Verified</span>` : ''}
    <div class="detail-grid">
      <div class="detail-item"><div class="detail-label">Item Name</div><div class="detail-value">${escHtml(item.name)}</div></div>
      <div class="detail-item"><div class="detail-label">Type</div><div class="detail-value">${item.type.charAt(0).toUpperCase()+item.type.slice(1)}</div></div>
      <div class="detail-item"><div class="detail-label">Location</div><div class="detail-value">📍 ${escHtml(item.location)}</div></div>
      <div class="detail-item"><div class="detail-label">Date</div><div class="detail-value">📅 ${formatDate(item.date)}</div></div>
      <div class="detail-item"><div class="detail-label">Contact Name</div><div class="detail-value">👤 ${escHtml(item.contactName)}</div></div>
      <div class="detail-item"><div class="detail-label">Contact Info</div><div class="detail-value">${escHtml(item.contact)}</div></div>
    </div>
    ${item.desc ? `<div style="background:var(--blue-50); border-radius:var(--radius-sm); padding:12px 14px; font-size:14px; color:var(--gray-700);"><strong>Description:</strong><br/>${escHtml(item.desc)}</div>` : ''}
  `;

  let footerBtns = `<button class="btn btn-outline" onclick="closeModal('detailModal')">Close</button>`;
  if (item.status !== 'claimed' && !adminMode) {
    footerBtns += `<button class="btn btn-primary" onclick="claimItem('${item.id}'); closeModal('detailModal');">🏷️ Mark as Claimed</button>`;
  }
  if (adminMode && item.status !== 'removed') {
    if (item.status !== 'verified') footerBtns += `<button class="btn btn-success" onclick="verifyItem('${item.id}'); closeModal('detailModal');">✔ Verify</button>`;
    footerBtns += `<button class="btn btn-danger" onclick="removeItem('${item.id}'); closeModal('detailModal');">🗑 Remove Post</button>`;
  }
  document.getElementById('detailModalFooter').innerHTML = footerBtns;
  openModal('detailModal');
}

// ============================
// ACTIONS
// ============================
function claimItem(id) {
  const item = items.find(i => i.id === id);
  if (!item || item.status === 'claimed') return;
  item.status = 'claimed';
  save(); renderAll();
  toast(`"${item.name}" marked as claimed!`, 'success');
}

function verifyItem(id) {
  const item = items.find(i => i.id === id);
  if (!item) return;
  item.status = 'verified';
  save(); renderAll();
  toast(`"${item.name}" has been verified.`, 'success');
}

function removeItem(id) {
  const item = items.find(i => i.id === id);
  if (!item) return;
  if (!confirm(`Remove "${item.name}"? This will hide it from public view.`)) return;
  item.status = 'removed';
  save(); renderAll();
  toast(`Post removed.`, 'error');
}

// ============================
// ADMIN
// ============================
function toggleAdminMode() {
  adminMode = !adminMode;
  const toggle = document.getElementById('adminToggle');
  const label = document.getElementById('adminToggleLabel');
  if (adminMode) {
    toggle.classList.add('active');
    label.textContent = 'Admin ON';
    document.getElementById('admin-lock').style.display = 'none';
    document.getElementById('admin-content').style.display = 'block';
    toast('Admin mode enabled.', 'success');
  } else {
    toggle.classList.remove('active');
    label.textContent = 'Admin Mode';
    document.getElementById('admin-lock').style.display = 'block';
    document.getElementById('admin-content').style.display = 'none';
  }
  renderAll();
}

function renderAdmin() {
  const tbody = document.getElementById('adminTableBody');
  if (!tbody) return;
  const adminEmpty = document.getElementById('admin-empty');
  const allItems = items;
  const pending = allItems.filter(i => i.status === 'pending').length;
  const verified = allItems.filter(i => i.status === 'verified').length;
  const removed = allItems.filter(i => i.status === 'removed').length;
  document.getElementById('admin-pending').textContent = pending;
  document.getElementById('admin-verified').textContent = verified;
  document.getElementById('admin-removed').textContent = removed;

  const rows = [...allItems].sort((a,b) => b.createdAt - a.createdAt);
  if (rows.length === 0) {
    tbody.innerHTML = '';
    if (adminEmpty) adminEmpty.style.display = 'block';
    return;
  }
  if (adminEmpty) adminEmpty.style.display = 'none';
  tbody.innerHTML = rows.map(item => {
    const statusPill = {
      pending: `<span class="status-pill status-pending">⏳ Pending</span>`,
      verified: `<span class="status-pill status-verified">✔ Verified</span>`,
      claimed: `<span class="status-pill status-verified">🏷️ Claimed</span>`,
      removed: `<span class="status-pill status-removed">✕ Removed</span>`
    }[item.status] || '';

    const typeTag = item.type === 'lost'
      ? `<span class="card-tag tag-lost" style="font-size:10px;">Lost</span>`
      : `<span class="card-tag tag-found" style="font-size:10px;">Found</span>`;

    const actions = item.status !== 'removed' ? `
      ${item.status === 'pending' ? `<button class="btn btn-success btn-sm" onclick="verifyItem('${item.id}')">✔</button>` : ''}
      ${item.status !== 'claimed' ? `<button class="btn btn-outline btn-sm" onclick="claimItem('${item.id}')">🏷️</button>` : ''}
      <button class="btn btn-danger btn-sm" onclick="removeItem('${item.id}')">🗑</button>
    ` : `<span style="color:var(--gray-400); font-size:12px;">Removed</span>`;

    return `<tr>
      <td><strong>${escHtml(item.name)}</strong></td>
      <td>${typeTag}</td>
      <td>${escHtml(item.location)}</td>
      <td>${formatDate(item.date)}</td>
      <td>${escHtml(item.contact)}</td>
      <td>${statusPill}</td>
      <td style="display:flex; gap:6px; flex-wrap:wrap;">${actions}</td>
    </tr>`;
  }).join('');
}

// ============================
// MODAL HELPERS
// ============================
function openModal(id) {
  document.getElementById(id).classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
  document.body.style.overflow = '';
}
document.querySelectorAll('.modal-overlay').forEach(o => {
  o.addEventListener('click', e => { if (e.target === o) closeModal(o.id); });
});

// ============================
// TOAST
// ============================
function toast(msg, type='info') {
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  const icons = { success:'✅', error:'❌', info:'ℹ️' };
  t.innerHTML = `<span>${icons[type]||'ℹ️'}</span><span>${msg}</span>`;
  document.getElementById('toastContainer').appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

// ============================
// SIDEBAR TOGGLE (mobile)
// ============================
function toggleSidebar() {
  const s = document.getElementById('sidebar');
  const o = document.getElementById('sidebarOverlay');
  s.classList.toggle('open');
  o.classList.toggle('open');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('open');
}

// Auto-close sidebar on nav click (mobile)
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (window.innerWidth <= 700) closeSidebar();
  });
});

// ============================
// INIT
// ============================
renderAll();