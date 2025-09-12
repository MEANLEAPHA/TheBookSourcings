async function fetchTrendingBooks() {
  try {
    const res = await fetch('https://thebooksourcings.onrender.com/api/trending');
    const result = await res.json();

    // ✅ Flatten all sources into one array
    const books = [
      ...(result.data.google || []),
      ...(result.data.gutenberg || []),
      ...(result.data.openLibrary || [])
    ];

    const container = document.getElementById('BookContent');
    container.innerHTML = ''; // Clear old content

    if (books.length === 0) {
      container.innerHTML = `<p>No trending books found right now.</p>`;
      return;
    }

    books.forEach(book => {
      // ✅ Get cover
      const cover = book.cover || "default.jpg";
      // ✅ Get authors
      const author = book.authors && book.authors.length ? book.authors.join(", ") : "No Data";
      // ✅ Get source
      const source = book.source || "No Data";

      // get boook id
      const bookId = book.bookId;

      // ✅ Tags: only first 4
      const tags = (book.categories && book.categories.length ? book.categories.slice(0, 4) : ["General"]);

      // ✅ Build HTML
      const card = `
        <div class="Book-card">
          <a href='aboutBook.html?bookId=${bookId}'>
            <div class="thumbnail">
              <img src="${cover}" class="bookCovers">
            </div>
            <div class="Book-info">
              <div class="title">${book.title || "Untitled"}</div>
              <div class="byAuthor">${author}</div>
              <div class="meta">1.2M views · 3 days ago</div>
              <div class="channel">
                <div class="avatar"></div>
                <div class="channel-name">${source}</div>
              </div>
              <div class="tags">
                ${tags.map(tag => `<div class="tag">#${tag}</div>`).join("")}
              </div>
            </div>
          </a>
        </div>
      `;

      container.insertAdjacentHTML('beforeend', card);
    });
  } catch (err) {
    console.error("Error fetching trending books:", err);
  }
}

// Load on page
fetchTrendingBooks();