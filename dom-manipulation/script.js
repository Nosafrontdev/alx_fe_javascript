const quotes = JSON.parse(localStorage.getItem('quotes')) || [];

// =============================
// CREATE PAGE (alxindex2.html)
// =============================
const newQuoteTextInput = document.getElementById('newQuoteText');
const newQuoteCategoryInput = document.getElementById('newQuoteCategory');
const addQuoteBtn = document.getElementById('addQuoteBtn');
const quoteList = document.getElementById('quoteList');

if (addQuoteBtn) {
    addQuoteBtn.addEventListener('click', (addQuote) => {
        addQuote.preventDefault();

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

// =============================
// HOME PAGE (alxindex.html)
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

    // Function to show random quote by category
    function showRandomQuote() {
        const selectedCategory = categorySelect.value;

        if (!selectedCategory) {
            quoteDisplay.innerHTML = `<p>Please select a category first.</p>`;
            return;
        }

        const filteredQuotes = quotes.filter(q => q.category === selectedCategory);

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