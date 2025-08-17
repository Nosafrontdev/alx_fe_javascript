// Load quotes from storage
const quotes = JSON.parse(localStorage.getItem('quotes')) || [];

// DOM elements
const categoryFilter = document.getElementById('categoryFilter');
const quoteDisplay = document.getElementById('quoteDisplay');
const newQuoteBtn = document.getElementById('newQuote');
const addQuoteForm = document.getElementById('addQuoteForm');
const newQuoteTextInput = document.getElementById('newQuoteText');
const newQuoteCategoryInput = document.getElementById('newQuoteCategory');
const exportBtn = document.getElementById('exportQuotes');
const importInput = document.getElementById('importQuotes');
const quoteList = document.getElementById('quoteList');

// =============================
// POPULATE CATEGORIES
// =============================
function populateCategories() {
  if (!categoryFilter) return;

  categoryFilter.innerHTML = `<option value="all">All Categories</option>`;
  const categories = [...new Set(quotes.map(q => q.category))];

  categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    categoryFilter.appendChild(option);
  });

  // ✅ restore last selected filter
  const savedFilter = localStorage.getItem('selectedCategory');
  if (savedFilter && [...categoryFilter.options].some(o => o.value === savedFilter)) {
    categoryFilter.value = savedFilter;
  }
}

// =============================
// FILTER QUOTES FUNCTION
// =============================
function filterQuotes() {
  if (!categoryFilter) return;

  const selectedCategory = categoryFilter.value;
  localStorage.setItem('selectedCategory', selectedCategory);

  let filteredQuotes = quotes;
  if (selectedCategory !== "all") {
    filteredQuotes = quotes.filter(q => q.category === selectedCategory);
  }

  displayQuotes(filteredQuotes);
}

// =============================
// DISPLAY QUOTES
// =============================
function displayQuotes(quoteArray) {
  if (!quoteDisplay) return;
  quoteDisplay.innerHTML = "";

  if (quoteArray.length === 0) {
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

// =============================
// SHOW RANDOM QUOTE
// =============================
if (newQuoteBtn) {
  newQuoteBtn.addEventListener('click', () => {
    const selectedCategory = categoryFilter.value;
    let filteredQuotes = quotes;

    if (selectedCategory !== "all") {
      filteredQuotes = quotes.filter(q => q.category === selectedCategory);
    }

    if (filteredQuotes.length === 0) {
      quoteDisplay.innerHTML = `<p>No quotes in this category.</p>`;
      return;
    }

    const randomQuote = filteredQuotes[Math.floor(Math.random() * filteredQuotes.length)];
    displayQuotes([randomQuote]);
  });
}

// =============================
// ADD QUOTE (index2.html)
// =============================
if (addQuoteForm) {
  addQuoteForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = newQuoteTextInput.value.trim();
    const category = newQuoteCategoryInput.value.trim();

    if (!text || !category) return;

    const quoteObject = { quote: text, category: category };
    quotes.push(quoteObject);
    localStorage.setItem('quotes', JSON.stringify(quotes));

    // update UI
    newQuoteTextInput.value = "";
    newQuoteCategoryInput.value = "";

    renderQuoteList();
    if (typeof populateCategories === 'function') populateCategories();
  });
}

function renderQuoteList() {
  if (!quoteList) return;
  quoteList.innerHTML = "";

  quotes.forEach((q, index) => {
    const li = document.createElement('li');
    li.innerText = `${q.quote} (${q.category})`;
    quoteList.appendChild(li);
  });
}

// =============================
// EXPORT QUOTES (Blob + application/json)
// =============================
if (exportBtn) {
  exportBtn.addEventListener('click', () => {
    const jsonData = JSON.stringify(quotes, null, 2);
    const blob = new Blob([jsonData], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = url;
    downloadAnchor.download = "quotes.json";
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();

    document.body.removeChild(downloadAnchor);
    URL.revokeObjectURL(url);
  });
}

// =============================
// IMPORT QUOTES (from JSON file)
// =============================
if (importInput) {
  importInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedQuotes = JSON.parse(e.target.result);
        if (Array.isArray(importedQuotes)) {
          quotes.push(...importedQuotes);
          localStorage.setItem('quotes', JSON.stringify(quotes));
          filterQuotes();
          if (typeof populateCategories === 'function') populateCategories();
        }
      } catch (err) {
        alert("Invalid file format");
      }
    };
    reader.readAsText(file);
  });
}

// =============================
// INIT
// =============================
if (categoryFilter) {
  populateCategories();
  filterQuotes();
}

if (quoteList) {
  renderQuoteList();
}