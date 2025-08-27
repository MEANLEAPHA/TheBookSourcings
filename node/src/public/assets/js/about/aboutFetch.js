  function detectSource(bookId) {
    if (/^OL\d+(W|M|A)$/.test(bookId)) return "openlibrary";
    if (/^\d+$/.test(bookId)) return "gutenberg";
    return "google"; // fallback for Google Books
  }

  const urlParams = new URLSearchParams(window.location.search);
  const bookId = urlParams.get("bookId");
  const source = detectSource(bookId);

  // Fetch book from your backend unified endpoint
  fetch(`/api/aboutBook/${source}/${bookId}`)
    .then(res => res.json())
    .then(renderBook)
    .catch(err => {
      console.error("Failed to fetch book:", err);
      document.querySelector("#title").textContent = "Book not found";
      document.querySelector("#description").textContent = "";
      document.querySelector("#cover").src = "fallback.jpg";
      document.querySelector("#author").textContent = "";
    });

  // Render book info
  function renderBook(data) {
    document.querySelector("#title").textContent = data.title || "No title";
    document.querySelector("#author").textContent = data.authors?.join(", ") || "Unknown author";
    document.querySelector("#description").innerHTML = data.description || "No description available.";
    document.querySelector("#cover").src = data.cover || "fallback.jpg";
  }