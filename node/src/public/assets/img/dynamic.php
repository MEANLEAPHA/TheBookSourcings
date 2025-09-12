<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <style>
        
  #bookList {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 20px;
    margin-top: 20px;
  }
  .bookCard {
    border: 1px solid #ddd;
    padding: 10px;
    border-radius: 8px;
    text-align: center;
  }
  .bookCard img {
    max-width: 100px;
  }


    </style>
</head>
<body>
   <main>
  <h1>Book Explorer</h1>
  <input type="text" id="searchInput" placeholder="Search books..." />
  <button id="searchBtn">Search</button>
  
  <div id="bookList"></div>

  <div id="pagination">
    <button id="prevBtn">Previous</button>
    <span id="pageNum">1</span>
    <button id="nextBtn">Next</button>
  </div>
</main>

<script>
    let currentPage = 1;
    const maxResults = 10;
    let currentQuery = 'rich dad';

    document.getElementById('searchBtn').addEventListener('click', () => {
    currentPage = 1;
    currentQuery = document.getElementById('searchInput').value.toLowerCase().trim() || 'rich dad';
    loadBooks(currentQuery);
    });

document.getElementById('prevBtn').addEventListener('click', () => {
  if (currentPage > 1) {
    currentPage--;
    loadBooks(currentQuery);
  }
});

document.getElementById('nextBtn').addEventListener('click', () => {
  currentPage++;
  loadBooks(currentQuery);
});

async function loadBooks(query = "rich dad") {
  const startIndex = (currentPage - 1) * maxResults;
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURLComponent(query)}&startIndex=${startIndex}&maxResults=${maxResults}`;
  
  try {
    const res = await fetch(url);
    const data = await res.json();

    if (!data.items) {
      document.getElementById('bookList').innerHTML = "<p>No books found.</p>";
      return;
    }

    renderBooks(data.items);
    document.getElementById('pageNum').innerText = currentPage;
  } catch (err) {
    console.error(err);
  }
}

function renderBooks(books) {
  const bookList = document.getElementById('bookList');
  bookList.innerHTML = "";

  books.forEach(book => {
    const info = book.volumeInfo;
    const div = document.createElement("div");
    div.className = "bookCard";
    div.innerHTML = `
      <img src="${info.imageLinks?.thumbnail || ''}" alt="Book cover">
      <h3>${info.title}</h3>
      <p><strong>Author:</strong> ${info.authors?.join(", ") || "Unknown"}</p>
    `;
    bookList.appendChild(div);
  });
}

// Load default books on first load
loadBooks();

</script>

</body>
</html>