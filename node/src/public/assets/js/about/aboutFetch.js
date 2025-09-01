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
  const book = data.book || data;
  const similarBooks = data.similarBooks || [];
  document.querySelector(".BookUrl").src = book.cover;
  document.querySelector(".title").textContent = book.title;
  document.querySelector("#channelName").textContent = book.source;
  document.querySelector("#authorSurname").textContent = book.authors;
  document.querySelector("#titleBook").textContent = book.title;
  document.querySelector("#subTitle").textContent = book.subtitle;
  document.querySelector("#Category").textContent = book.categories;
  document.querySelector("#language").textContent = book.language;
  document.querySelector("#pageCount").textContent = book.page;
  document.querySelector("#ISBN10").textContent = book.ISBN_10;
  document.querySelector("#ISBN13").textContent = book.ISBN_13;
  document.querySelector("#publishData").textContent = book.publishDate;
  document.querySelector("#publisher").textContent = book.publisher;


  const similarLists = document.querySelector(".swiper-wrapper");
  similarLists.innerHTML = "";
  if(similarBooks.length > 0) {
    similarBooks.forEach(bk => {
      similarLists.innerHTML += `
            <div class="swiper-slide">
              <a href='aboutBook.html?bookId=${bk.bookId}'>
                <img src="${bk.cover}" class="BookCover">
                <div class="bookInfo">
                  <p class="BookTitle">${bk.title}</p>
                  <p class="BookAuthor">${bk.author}</p>
                </div>
              </a>
            </div>
      `;
    })
  }
  else{
    similarLists.innerHTML = "<p>No similar books found.</p>";
  }

  // ✅ Handle read & download
  const readBtn = document.querySelector("#read");
  const downloadBtn = document.querySelector("#download");

  if (data.read) {
    readBtn.href = data.read;
  } else {
    readBtn.removeAttribute("href");
    if (data.source === "Open Library") {
      readBtn.addEventListener("click", (e) => {
        e.preventDefault();
        showToast("❌ This book is not available to read.");
      });
    }
  }

  if (data.download) {
    downloadBtn.href = data.download;
  } else {
    downloadBtn.removeAttribute("href");
    if (data.source === "Open Library") {
      downloadBtn.addEventListener("click", (e) => {
        e.preventDefault();
        showToast("❌ This book is not available for download.");
      });
    }
  }

  // ✅ Description + Read more / Read less
  const descriptionEl = document.getElementById('description');
  const seemore = document.getElementById('seemore');
  const seeless = document.getElementById('seeless');

  const fullText = data.description || "No description available.";
  if (fullText.length > 1000) {
    const shortText = fullText.slice(0, 1000) + "......";
    descriptionEl.innerText = shortText;
    seemore.style.display = "block";
    seeless.style.display = "none";

    seemore.onclick = () => {
      descriptionEl.innerText = fullText;
      seemore.style.display = "none";
      seeless.style.display = "block";
    };
    seeless.onclick = () => {
      descriptionEl.innerText = shortText;
      seemore.style.display = "block";
      seeless.style.display = "none";
    };
  } else {
    descriptionEl.innerText = fullText;
    seemore.style.display = "none";
    seeless.style.display = "none";
  }
}

// ✅ Show toast function
function showToast(message) {
  const toastEl = document.getElementById("bookToast");
  const toastMessage = document.getElementById("toastMessage");
  toastMessage.textContent = message;

  const toast = new bootstrap.Toast(toastEl);
  toast.show();
}
