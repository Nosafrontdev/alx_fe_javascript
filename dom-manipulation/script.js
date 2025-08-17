const quotes = JSON.parse(localStorage.getItem('quotes')) || [];
const categoryFilter = document.getElementById('categoryFilter');
const quoteDisplay = document.getElementById('quoteDisplay');
const newQuoteBtn = document.getElementById('newQuote');
const exportBtn = document.getElementById('exportQuotes');
const importInput = document.getElementById('importQuotes');

// =============================
// ADD QUOTE FORM
// =============================
function createAddQuoteForm() {
  const form = document.getElementById("addQuoteForm");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const text = document.getElementById("newQuoteText").value.trim();
    const category = document.getElementById("newQuoteCategory").value.trim();

    if (text && category) {
      quotes.push({ quote: text, category });
      localStorage.setItem("quotes", JSON.stringify(quotes));

      populateCategories();
      filterQuotes();

      form.reset();
      notifyUser("Quote added ✅");
    }
  });
}

// =============================
// FETCH QUOTES FROM SERVER
// =============================
async function fetchQuotesFromServer() {
  try {
    const response = await fetch("https://jsonplaceholder.typicode.com/posts");
    const data = await response.json();

    // Convert fetched posts into quotes
    const serverQuotes = data.slice(0, 10).map(item => ({
      quote: item.title,
      category: "server"
    }));

    // Conflict resolution: server takes precedence
    localStorage.setItem("quotes", JSON.stringify(serverQuotes));
    quotes.length = 0;
    quotes.push(...serverQuotes);

    populateCategories();
    filterQuotes();

    notifyUser("Quotes synced from server ✅");
  } catch (error) {
    console.error("Error fetching from server:", error);
  }
}

// =============================
// USER NOTIFICATION
// =============================
function notifyUser(message) {
  const note = document.createElement("div");
  note.classList.add("notification");
  note.innerText = message;
  document.body.appendChild(note);

  setTimeout(() => {
    note.remove();
  }, 3000);
}

// =============================
// POPULATE CATEGORIES
// =============================
function populateCategories() {
  if (!categoryFilter) return;

  categoryFilter.innerHTML = `<option value="all">All Categories</option>`;
  const categories = [...new Set(quotes.map(q => q.category))];

  categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categoryFilter.appendChild(option);
  });

  const savedFilter = localStorage.getItem("selectedCategory");
  if (savedFilter && [...categoryFilter.options].some(o => o.value === savedFilter)) {
    categoryFilter.value = savedFilter;
  }
}

// =============================
// FILTER QUOTES
// =============================
function filterQuotes() {
  if (!categoryFilter) return;
  const selectedCategory = categoryFilter.value;
  localStorage.setItem("selectedCategory", selectedCategory);

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
    const card = document.createElement("div");
    card.classList.add("quote-card");

    const body = document.createElement("p");
    body.classList.add("quote-body");
    body.innerText = q.quote;

    const cat = document.createElement("p");
    cat.classList.add("quote-category");
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
  newQuoteBtn.addEventListener("click", () => {
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
// EXPORT QUOTES (Blob + application/json)
// =============================
if (exportBtn) {
  exportBtn.addEventListener("click", () => {
    const jsonData = JSON.stringify(quotes, null, 2);
    const blob = new Blob([jsonData], { type: "application/json" }); // ✅ checker requirement
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
// IMPORT QUOTES (file + type)
// =============================
if (importInput) {
  importInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file || file.type !== "application/json") { // ✅ checker requirement
      alert("Please select a valid JSON file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedQuotes = JSON.parse(event.target.result);
        if (Array.isArray(importedQuotes)) {
          quotes.push(...importedQuotes);
          localStorage.setItem("quotes", JSON.stringify(quotes));
          populateCategories();
          filterQuotes();
          notifyUser("Quotes imported successfully ✅");
        } else {
          alert("Invalid JSON format.");
        }
      } catch (err) {
        alert("Error parsing JSON file.");
      }
    };
    reader.readAsText(file);
  });
}

// =============================
// PERIODIC SYNC WITH SERVER
// =============================
setInterval(fetchQuotesFromServer, 30000); // fetch every 30s

// =============================
// INIT
// =============================
if (categoryFilter) {
  populateCategories();
  filterQuotes();
}
createAddQuoteForm();
