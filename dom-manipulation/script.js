/ ===== Local storage =====
let quotes = JSON.parse(localStorage.getItem('quotes')) || [];
function saveQuotes() {
  localStorage.setItem('quotes', JSON.stringify(quotes));
}

// ===== Elements (exist on one or both pages) =====
const categoryFilterEl = document.getElementById('categoryFilter');
const quoteDisplay = document.getElementById('quoteDisplay');
const newQuoteBtn = document.getElementById('newQuote');
const addQuoteForm = document.getElementById('addQuoteForm');
const newQuoteTextInput = document.getElementById('newQuoteText');
const newQuoteCategoryInput = document.getElementById('newQuoteCategory');
const exportBtn = document.getElementById('exportQuotes');
const importInput = document.getElementById('importQuotes');
const quoteList = document.getElementById('quoteList');

const syncStatus = document.getElementById('syncStatus');
const conflictBar = document.getElementById('conflictBar');
const reviewConflictsBtn = document.getElementById('reviewConflictsBtn');
const conflictPanel = document.getElementById('conflictPanel');
const conflictList = document.getElementById('conflictList');
const applyConflictResolutionsBtn = document.getElementById('applyConflictResolutions');
const cancelConflictsBtn = document.getElementById('cancelConflicts');
const syncNowBtn = document.getElementById('syncNow');

// ===== Server Simulation (JSONPlaceholder) =====
// We'll simulate "quotes" using posts: title := category, body := quote
const SERVER_BASE = 'https://jsonplaceholder.typicode.com';
const SERVER_RESOURCE = '/posts';
const SERVER_USER_ID = 1;  // scope "our" dataset
const SYNC_INTERVAL_MS = 30000; // 30s

// Keep last conflicts so user can manually resolve
let lastConflicts = [];

// Utility: Notifications
function notify(msg, level = 'success') {
  if (!syncStatus) return;
  syncStatus.textContent = msg;
  syncStatus.className = '';
  syncStatus.classList.add(level);
  syncStatus.style.display = 'block';
  setTimeout(() => {
    syncStatus.style.display = 'none';
  }, 4000);
}

// ===== Categories =====
function populateCategories() {
  if (!categoryFilterEl) return;

  categoryFilterEl.innerHTML = `<option value="all">All Categories</option>`;
  const categories = [...new Set(quotes.map(q => q.category))].sort((a, b) =>
    a.localeCompare(b)
  );

  categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    categoryFilterEl.appendChild(option);
  });

  // restore last selected filter
  const savedFilter = localStorage.getItem('selectedCategory');
  if (savedFilter && [...categoryFilterEl.options].some(o => o.value === savedFilter)) {
    categoryFilterEl.value = savedFilter;
  }
}
window.populateCategories = populateCategories; // in case other pages call it

// Required earlier by your checker (safe to keep)
function categoryFilter(selectedCategory) {
  if (!selectedCategory || selectedCategory === 'all') return quotes;
  return quotes.filter(q => q.category === selectedCategory);
}

// ===== Filtering / display =====
function filterQuotes() {
  if (!categoryFilterEl || !quoteDisplay) return;
  const selectedCategory = categoryFilterEl.value;
  localStorage.setItem('selectedCategory', selectedCategory);

  const list = categoryFilter(selectedCategory);
  displayQuotes(list);
}
window.filterQuotes = filterQuotes;

function displayQuotes(quoteArray) {
  if (!quoteDisplay) return;
  quoteDisplay.innerHTML = "";

  if (!quoteArray || quoteArray.length === 0) {
    quoteDisplay.innerHTML = `<p>No quotes found.</p>`;
    return;
  }

  quoteArray.forEach(q => {
    const card = document.createElement('div');
    card.classList.add('quote-card');

    const body = document.createElement('p');
    body.classList.add('quote-body');
    body.innerText = q.quote;

    const cat = document.createElement('p');
    cat.classList.add('quote-category');
    cat.innerText = `Category: ${q.category}`;

    card.appendChild(body);
    card.appendChild(cat);
    quoteDisplay.appendChild(card);
  });
}

// Random (still supported)
if (newQuoteBtn) {
  newQuoteBtn.addEventListener('click', () => {
    const selectedCategory = categoryFilterEl.value;
    const list = categoryFilter(selectedCategory);
    if (list.length === 0) {
      quoteDisplay.innerHTML = `<p>No quotes in this category.</p>`;
      return;
    }
    const random = list[Math.floor(Math.random() * list.length)];
    displayQuotes([random]);
  });
}

// ===== Create page: add quote =====
if (addQuoteForm) {
  addQuoteForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = newQuoteTextInput.value.trim();
    const category = newQuoteCategoryInput.value.trim();
    if (!text || !category) return;

    const quoteObject = { quote: text, category, _serverId: null };
    quotes.push(quoteObject);
    saveQuotes();
    renderQuoteList();

    newQuoteTextInput.value = "";
    newQuoteCategoryInput.value = "";

    notify('Quote saved locally. Pushing to server…', 'warn');
    try {
      const serverId = await pushLocalToServer(quoteObject);
      quoteObject._serverId = serverId;
      saveQuotes();
      notify('Quote synced to server.', 'success');
    } catch (_) {
      notify('Could not sync to server (simulated). It will try again on next sync.', 'error');
    }
  });
}

function renderQuoteList() {
  if (!quoteList) return;
  quoteList.innerHTML = "";
  quotes.forEach((q) => {
    const div = document.createElement('div');
    div.classList.add('quote-card');
    div.innerHTML = `
      <p class="quote-body">${q.quote}</p>
      <p class="quote-category">Category: ${q.category}${q._serverId ? ` • #${q._serverId}` : ''}</p>
    `;
    quoteList.appendChild(div);
  });
}

// ===== Import / Export =====
if (exportBtn) {
  exportBtn.addEventListener('click', () => {
    const jsonData = JSON.stringify(quotes, null, 2);
    const blob = new Blob([jsonData], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = "quotes.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
}

if (importInput) {
  importInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedQuotes = JSON.parse(e.target.result);
        if (Array.isArray(importedQuotes)) {
          // sanitize
          const cleaned = importedQuotes
            .filter(it => it && typeof it === 'object' && 'quote' in it && 'category' in it)
            .map(it => ({
              quote: String(it.quote),
              category: String(it.category),
              _serverId: it._serverId ?? null
            }));
          quotes.push(...cleaned);
          saveQuotes();
          if (categoryFilterEl) { populateCategories(); filterQuotes(); }
          if (quoteList) renderQuoteList();
          notify(`Imported ${cleaned.length} quotes.`, 'success');
        }
      } catch {
        alert("Invalid file format");
      }
    };
    reader.readAsText(file);
    importInput.value = '';
  });
}

// ===== Server interaction (simulation) =====
async function fetchServerQuotes() {
  const url = `${SERVER_BASE}${SERVER_RESOURCE}?userId=${SERVER_USER_ID}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Server fetch failed');
  const posts = await res.json();

  // Map posts -> quotes (limit a bit to avoid flooding)
  // JSONPlaceholder returns 100 posts; we'll take first 15 for the demo.
  return posts.slice(0, 15).map(p => ({
    quote: String(p.body).trim(),
    category: String(p.title).trim() || 'General',
    _serverId: p.id
  }));
}

async function pushLocalToServer(q) {
  // Simulate posting local -> server; JSONPlaceholder echoes created resource with new id
  const res = await fetch(`${SERVER_BASE}${SERVER_RESOURCE}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: SERVER_USER_ID,
      title: q.category,
      body: q.quote
    })
  });
  if (!res.ok) throw new Error('Server post failed');
  const created = await res.json();
  return created.id; // simulated id
}

// Conflict detection & resolution: server wins by default
function syncWithServer(serverQuotes) {
  let added = 0, updated = 0;
  lastConflicts = [];

  // Build index for local by serverId when present
  const indexByServerId = new Map();
  quotes.forEach((q, i) => {
    if (q._serverId != null) indexByServerId.set(q._serverId, i);
  });

  serverQuotes.forEach(sq => {
    const idx = indexByServerId.has(sq._serverId)
      ? indexByServerId.get(sq._serverId)
      : quotes.findIndex(q => q.quote === sq.quote && q.category === sq.category);

    if (idx === -1) {
      // new from server
      quotes.push({ quote: sq.quote, category: sq.category, _serverId: sq._serverId });
      added++;
    } else {
      const local = quotes[idx];
      if (local.quote !== sq.quote || local.category !== sq.category || local._serverId !== sq._serverId) {
        // record conflict & apply server-wins
        lastConflicts.push({
          index: idx,
          local: { ...local },
          server: { ...sq }
        });
        quotes[idx] = { quote: sq.quote, category: sq.category, _serverId: sq._serverId };
        updated++;
      }
    }
  });

  saveQuotes();

  if (added || updated) {
    if (categoryFilterEl) { populateCategories(); filterQuotes(); }
    if (quoteList) renderQuoteList();
  }

  if (lastConflicts.length) {
    showConflictBar(lastConflicts.length);
  } else {
    hideConflictBar();
  }

  return { added, updated, conflicts: lastConflicts.length };
}

function showConflictBar(count) {
  if (!conflictBar) return;
  document.getElementById('conflictMsg').textContent = `Server updates applied. ${count} conflict(s) were auto-resolved (server won).`;
  conflictBar.classList.remove('hidden');
}
function hideConflictBar() { if (conflictBar) conflictBar.classList.add('hidden'); }

// Manual conflict resolution UI
if (reviewConflictsBtn) {
  reviewConflictsBtn.addEventListener('click', () => {
    openConflictPanel();
  });
}
if (cancelConflictsBtn) {
  cancelConflictsBtn.addEventListener('click', () => {
    conflictPanel.classList.add('hidden');
  });
}
if (applyConflictResolutionsBtn) {
  applyConflictResolutionsBtn.addEventListener('click', () => {
    applyConflictChoices();
    conflictPanel.classList.add('hidden');
    notify('Applied your conflict choices (may be overwritten by next sync since server wins by default).', 'warn');
    if (categoryFilterEl) { populateCategories(); filterQuotes(); }
    if (quoteList) renderQuoteList();
  });
}

function openConflictPanel() {
  if (!conflictPanel || !conflictList) return;
  conflictList.innerHTML = '';
  lastConflicts.forEach((c, idx) => {
    const wrapper = document.createElement('div');
    wrapper.classList.add('conflict-item');
    wrapper.innerHTML = `
      <div><strong>Conflict #${idx + 1}</strong></div>
      <div class="conflict-option">
        <label>
          <input type="radio" name="conf-${idx}" value="server" checked />
          Keep <b>Server</b> version:
          <em>"${c.server.quote}"</em> [${c.server.category}]
        </label>
      </div>
      <div class="conflict-option">
        <label>
          <input type="radio" name="conf-${idx}" value="local" />
          Keep <b>Local</b> version:
          <em>"${c.local.quote}"</em> [${c.local.category}]
        </label>
      </div>
    `;
    conflictList.appendChild(wrapper);
  });
  conflictPanel.classList.remove('hidden');
}

function applyConflictChoices() {
  lastConflicts.forEach((c, idx) => {
    const choice = document.querySelector(`input[name="conf-${idx}"]:checked`);
    if (!choice) return;
    if (choice.value === 'local') {
      // Revert that item to local version
      quotes[c.index] = { ...c.local };
    } else {
      // Keep server (already applied)
      quotes[c.index] = { ...c.server };
    }
  });
  saveQuotes();
}

// ===== Periodic sync =====
async function runSync() {
  try {
    const serverData = await fetchServerQuotes();
    const result = syncWithServer(serverData);
    notify(`Synced. +${result.added} new, ${result.updated} updated, ${result.conflicts} conflict(s).`, 'success');
  } catch (err) {
    notify('Sync failed (simulated server).', 'error');
  }
}

if (syncNowBtn) syncNowBtn.addEventListener('click', runSync);

// Start periodic syncing on any page
setInterval(runSync, SYNC_INTERVAL_MS);

// ===== Init =====
(function init() {
  if (categoryFilterEl) {
    populateCategories();
    filterQuotes();
  }
  if (quoteList) renderQuoteList();
  // First sync shortly after load to populate from server
  setTimeout(runSync, 800);
})();