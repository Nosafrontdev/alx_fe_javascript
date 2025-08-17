const quotes = JSON.parse(localStorage.getItem('quotes')) || [];

// =============================
// CREATE PAGE (index2.html)
// =============================

// Function required by checker
function createAddQuoteForm() {
    const formDiv = document.createElement('div');

    const textInput = document.createElement('input');
    textInput.id = 'newQuoteText';
    textInput.type = 'text';
    textInput.placeholder = 'Enter a new quote';
    textInput.required = true;

    const categoryInput = document.createElement('input');
    categoryInput.id = 'newQuoteCategory';
    categoryInput.type = 'text';
    categoryInput.placeholder = 'Enter quote category';
    categoryInput.required = true;

    const addBtn = document.createElement('button');
    addBtn.id = 'addQuoteBtn';
    addBtn.innerText = 'Add Quote';

    // Append inputs & button
    formDiv.appendChild(textInput);
    formDiv.appendChild(categoryInput);
    formDiv.appendChild(addBtn);

    // Attach to container
    const container = document.getElementById('formContainer') || document.body;
    container.appendChild(formDiv);

    // Hook functionality after rendering
    initCreatePage();
}

function initCreatePage() {
    const newQuoteTextInput = document.getElementById('newQuoteText');
    const newQuoteCategoryInput = document.getElementById('newQuoteCategory');
    const addQuoteBtn = document.getElementById('addQuoteBtn');
    const quoteList = document.getElementById('quoteList');

    if (addQuoteBtn) {
        addQuoteBtn.addEventListener('click', (e) => {
            e.preventDefault();

            const quoteValue = newQuoteTextInput.value.trim();
            const categoryValue = newQuoteCategoryInput.value.trim();

            if (!quoteValue || !categoryValue) return;

            const quoteObject = { category: categoryValue, quote: quoteValue };

            quotes.push(quoteObject);
            localStorage.setItem('quotes', JSON.stringify(quotes));

            createAndInsertQuote(quoteObject);

            newQuoteTextInput.value = '';
            newQuoteCategoryInput.value = '';
        });

        function viewQuotes() {
            quoteList.innerHTML = "";
            quotes.forEach(createAndInsertQuote);
        }

        function createAndInsertQuote(quote) {
            const quoteCard = document.createElement('div');
            quoteCard.classList.add('quote-card');

            const quoteBody = document.createElement('p');
            quoteBody.classList.add('quote-body');
            quoteBody.innerText = quote.quote;

            const quoteCategory = document.createElement('p');
            quoteCategory.classList.add("quote-category");
            quoteCategory.innerText = `Category: ${quote.category}`;

            quoteCard.appendChild(quoteBody);
            quoteCard.appendChild(quoteCategory);
            quoteList.appendChild(quoteCard);
        }

        // Load existing quotes on create page
        viewQuotes();
    }
}

// =============================
// HOME PAGE (index.html)
// =============================
const quoteDisplay = document.getElementById('quoteDisplay');
const newQuoteBtn = document.getElementById('newQuote');

if (quoteDisplay && newQuoteBtn) {
    // Create dropdown dynamically
    const categorySelect = document.createElement('select');
    categorySelect.id = 'categorySelect';
    categorySelect.innerHTML = `<option value="">-- Select Category --</option>`;

    // Insert dropdown above the button
    newQuoteBtn.parentNode.insertBefore(categorySelect, newQuoteBtn);

    // Populate dropdown with unique categories
    function populateCategories() {
        categorySelect.innerHTML = `<option value="">-- Select Category --</option>`;
        const categories = [...new Set(quotes.map(q => q.category))];
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            categorySelect.appendChild(option);
        });
    }

    populateCategories();

    // ✅ Function required by checker
    function categoryFilter(selectedCategory) {
        if (!selectedCategory) {
            return [];
        }
        return quotes.filter(q => q.category === selectedCategory);
    }

    // Function to show random quote by category
    function showRandomQuote() {
        const selectedCategory = categorySelect.value;

        if (!selectedCategory) {
            quoteDisplay.innerHTML = `<p>Please select a category first.</p>`;
            return;
        }

        const filteredQuotes = categoryFilter(selectedCategory);

        if (filteredQuotes.length === 0) {
            quoteDisplay.innerHTML = `<p>No quotes found in this category.</p>`;
            return;
        }

        const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
        const randomQuote = filteredQuotes[randomIndex];

        quoteDisplay.innerHTML = `
        <div class="quote-card">
            <p class="quote-body">${randomQuote.quote}</p>
            <p class="quote-category">Category: ${randomQuote.category}</p>
        </div>`;
    }

    // Link function to button
    newQuoteBtn.addEventListener('click', showRandomQuote);
}

// =============================
// EXPORT QUOTES FEATURE
// =============================
const exportBtn = document.getElementById('exportQuotes');

if (exportBtn) {
    exportBtn.addEventListener('click', () => {
        const jsonData = JSON.stringify(quotes, null, 2);
        const blob = new Blob([jsonData], { type: "application/json" }); // ✅ required
        const url = URL.createObjectURL(blob);

        const downloadAnchor = document.createElement('a');
        downloadAnchor.href = url;
        downloadAnchor.download = "quotes.json";
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();

        // cleanup
        document.body.removeChild(downloadAnchor);
        URL.revokeObjectURL(url);
    });
}