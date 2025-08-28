  function detectSource(bookId) {
    if (/^OL\d+(W|M|A)$/.test(bookId)) return "openlibrary";
    if (/^\d+$/.test(bookId)) return "gutenberg";
    return "google"; // fallback for Google Books
  }

  const urlParams = new URLSearchParams(window.location.search);
  const bookId = urlParams.get("bookId");
  const source = detectSource(bookId);

  // Fetch book from your backend unified endpoint
  fetch(`https://thebooksourcings.onrender.com/api/aboutBook/${source}/${bookId}`)
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
    document.querySelector(".BookUrl").src = data.cover;
    document.querySelector(".title").textContent = data.title;
    document.querySelector("#description").textContent = data.description;
    document.querySelector("#channelName").textContent = data.source;
    document.querySelector("#authorSurname").textContent = data.authors;
    document.querySelector("#titleBook").textContent = data.title;
    document.querySelector("#subTitle").textContent = data.subtitle;
    document.querySelector("#Category").textContent = data.categories;
    document.querySelector("#language").textContent = data.language;
    document.querySelector("#pageCount").textContent = data.page;
    document.querySelector("#ISBN10").textContent = data.ISBN_10;
    document.querySelector("#ISBN13").textContent = data.ISBN_13;
    document.querySelector("#publishData").textContent = data.publishDate;
    document.querySelector("#publisher").textContent = data.publisher;
  }