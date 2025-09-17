async function userDisplayBook() {
  try {
    const res = await fetch("https://thebooksourcings.onrender.com/api/books/displayUserUploadBook", {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("token")}` // JWT token
      }
    });

    if (!res.ok) throw new Error("Network response not ok");
    const response = await res.json();

    // Extract book array
    const books = response.data || [];

    const displayDiv = document.getElementById("userUpload");
    displayDiv.innerHTML = ""; // Clear old content

    if (books.length === 0) {
      displayDiv.innerHTML = `<p>No user uploaded book.</p>`;
      return;
    }

    books.forEach(book => {
      const cover = book.cover || "default.jpg";
      const author = book.author || "Unknown Author";
      const bookQid = book.bookQid;
      const title = book.title || "Untitled";
      const subtitle = book.subtitle ? `: ${book.subtitle}` : "";
      const view = book.view || 0;
      const channel = book.username || "Unknown User";
      const uploadDate = book.uploaded;
      const category = book.category || "Uncategorized";

      // Handle genre (string → array)
      let genres = [];
      if (book.genre) {
        if (Array.isArray(book.genre)) {
          genres = book.genre;
        } else {
          genres = book.genre.split(",").map(g => g.trim());
        }
      }

      const card = `     
        <div class="Book-card">
            <a href='aboutBook.html?bookId=${bookQid}'>
                <div class="thumbnail">
                    <img src="${cover}" class="bookCovers">
                </div>
                <div class="Book-info">
                    <div class="title">${title}${subtitle}</div>
                    <div class="byAuthor">${author}</div>
                    <div class="meta"><span class='viewsCount'>${view} views </span> · <span class='uploaded'>${uploadDate}</span></div>
                    <div class="channel">
                        <div class="avatar"></div>
                        <div class="channel-name">${channel}</div>
                    </div>
                    <div class="tags">
                        <div class="tag">#${category}</div>
                        ${genres.map(g => `<div class="tag">#${g}</div>`).join("")}
                    </div>
                </div>
            </a>
        </div>
      `;

      displayDiv.insertAdjacentHTML("beforeend", card);
    });

  } catch (err) {
    console.error("Error fetching user books:", err);
  }
}

// Load on page
userDisplayBook();
