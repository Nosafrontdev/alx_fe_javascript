/ =============================
// GLOBAL STATE & ELEMENTS
// =============================
const quotes = JSON.parse(localStorage.getItem('quotes')) || [];

const categoryFilterEl = document.getElementById('categoryFilter');
const quoteDisplay = document.getElementById('quoteDisplay');
const newQuoteBtn = document.getElementById('newQuote');
const exportBtn = document.getElementById('exportQuotes');
const importInput = document.getElementById('importQuotes');

// =============================
// UTIL
// =============================
function saveQuotes() {
  localStorage.setItem('quotes', JSON.stringify(quotes));
}

function notifyUser(message) {
  const note = document.createElement('div');
  note.classList.add('notification');
  note.style.position = 'fixed';
  note.style.bottom = '16px';
  note.style.right = '16px';
  note.style.padding = '10px 14px';
  note.style.background = '#222';
  note.style.color = '#fff';
  note.style.borderRadius = '8px';
  note.style.zIndex = '9999';
  note.textContent = message;
  document.body.appendChild(note);
  setTimeout(() => note.remove(), 3000);
}

// =============================
// REQUIRED: createAddQuoteForm
// =============================
function createAddQuoteForm() {
  const form = document.getElementById('addQuoteForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const textEl = document.getElementById('newQuoteText');
    const catEl = document.getElementById('newQuoteCategory');

    const text = (textEl?.value || '').trim();
    const category = (catEl?.value || '').trim();
    if (!text || !category) return;

    const newObj = { quote: text, category, _serverId: null };
    quotes.push(newObj);
    saveQuotes();
    notifyUser('Quote saved locally ✅');

    const quoteList = document.getElementById('quoteList');
    if (quoteList) {
      const card = document.createElement('div');
      card.classList.add('quote-card');
      card.innerHTML = `
        <p class="quote-body">${newObj.quote}</p>
        <p class="quote-category">Category: ${newObj.category}</p>
      `;
      quoteList.prepend(card);
    }

    if (categoryFilterEl) {
      populateCategories();
      filterQuotes();
    }

    form.reset();

    // Simulated POST
    try {
      const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newObj.category,
          body: newObj.quote,
          userId: 1
        })
      });
      if (response.ok) {
        const created = await response.json();
        newObj._serverId = created.id;
        saveQuotes();
        notifyUser('Quote synced to server (simulated) ✅');
      } else {
        notifyUser('Server rejected the quote (simulated). It will stay local.');
      }
    } catch {
      notifyUser('Could not reach server (simulated). Will try again later.');
    }
  });
}

// =============================
// REQUIRED: fetchQuotesFromServer
// =============================
async function fetchQuotesFromServer() {
  try {
    const res = await fetch('https://jsonplaceholder.typicode.com/posts?userId=1');
    const data = await res.json();

    const serverQuotes = data.slice(0, 15).map(item => ({
      quote: String(item.body || item.title || '').trim(),
      category: String(item.title || 'Server').trim() || 'Server',
      _serverId: item.id
    }));

    const localById = new Map();
    quotes.forEach((q, i) => {
      if (q._serverId != null) localById.set(q._serverId, i);
    });

    serverQuotes.forEach(sq => {
      const idx = localById.has(sq._serverId)
        ? localById.get(sq._serverId)
        : quotes.findIndex(q => q.quote === sq.quote && q.category === sq.category);

      if (idx === -1) {
        quotes.push({ ...sq });
      } else {
        quotes[idx] = { ...sq };
      }
    });

    saveQuotes();
    if (categoryFilterEl) {
      populateCategories();
      filterQuotes();
    }
    notifyUser('Synced with server (simulated) ✅');
  } catch {
    // ignore silent errors
  }
}

// =============================
// REQUIRED: syncQuotes (wrapper)
// =============================
async function syncQuotes() {
  await fetchQuotesFromServer();
}
window.syncQuotes = syncQuotes;

// =============================
// REQUIRED: populateCategories
// =============================
function populateCategories() {
  if (!categoryFilterEl) return;

  categoryFilterEl.innerHTML = `<option value="all">All Categories</option>`;
  const categories = [...new Set(quotes.map(q => q.category))].sort((a, b) => a.localeCompare(b));
  categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    categoryFilterEl.appendChild(opt);
  });

  const saved = localStorage.getItem('selectedCategory');
  if (saved && [...categoryFilterEl.options].some(o => o.value === saved)) {
    categoryFilterEl.value = saved;
  }
}

// =============================
// REQUIRED: categoryFilter
// =============================
function categoryFilter(selectedCategory) {
  if (!selectedCategory || selectedCategory === 'all') return quotes;
  return quotes.filter(q => q.category === selectedCategory);
}

// =============================
// REQUIRED: filterQuotes
// =============================
function filterQuotes() {
  if (!categoryFilterEl || !quoteDisplay) return;
  const selected = categoryFilterEl.value;
  localStorage.setItem('selectedCategory', selected);
  const list = categoryFilter(selected);
  displayQuotes(list);
}
window.filterQuotes = filterQuotes;

// =============================
// RENDERING
// =============================
function displayQuotes(arr) {
  if (!quoteDisplay) return;
  quoteDisplay.innerHTML = '';
  if (!arr || arr.length === 0) {
    quoteDisplay.innerHTML = `<p>No quotes found.</p>`;
    return;
  }
  arr.forEach(q => {
    const card = document.createElement('div');
    card.classList.add('quote-card');
    const body = document.createElement('p');
    body.classList.add('quote-body');
    body.textContent = q.quote;
    const cat = document.createElement('p');
    cat.classList.add('quote-category');
    cat.textContent = `Category: ${q.category}`;
    card.appendChild(body);
    card.appendChild(cat);
    quoteDisplay.appendChild(card);
  });
}

// Random quote
if (newQuoteBtn) {
  newQuoteBtn.addEventListener('click', () => {
    const selected = categoryFilterEl ? categoryFilterEl.value : 'all';
    const list = categoryFilter(selected);
    if (list.length === 0) {
      if (quoteDisplay) quoteDisplay.innerHTML = `<p>No quotes in this category.</p>`;
      return;
    }
    const random = list[Math.floor(Math.random() * list.length)];
    displayQuotes([random]);
  });
}

// =============================
// EXPORT
// =============================
if (exportBtn) {
  exportBtn.addEventListener('click', () => {
    const data = JSON.stringify(quotes, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quotes.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
}

// =============================
// IMPORT
// =============================
if (importInput) {
  importInput.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== 'application/json') {
      alert('Please select a JSON file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = JSON.parse(reader.result);
        if (!Array.isArray(imported)) throw new Error('Invalid JSON');
        const cleaned = imported
          .filter(it => it && typeof it === 'object' && 'quote' in it && 'category' in it)
          .map(it => ({
            quote: String(it.quote),
            category: String(it.category),
            _serverId: it._serverId ?? null
          }));
        quotes.push(...cleaned);
        saveQuotes();
        if (categoryFilterEl) { populateCategories(); filterQuotes(); }
        notifyUser(`Imported ${cleaned.length} quotes ✅`);
      } catch {
        alert('Invalid JSON structure.');
      }
    };
    reader.readAsText(file);
    importInput.value = '';
  });
}

// =============================
// PERIODIC SYNC
// =============================
setInterval(syncQuotes, 30000);

// =============================
// INIT
// =============================
(function init() {
  if (categoryFilterEl) {
    populateCategories();
    filterQuotes();
  }
  createAddQuoteForm();
  setTimeout(syncQuotes, 800);
})();