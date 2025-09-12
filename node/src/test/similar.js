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
