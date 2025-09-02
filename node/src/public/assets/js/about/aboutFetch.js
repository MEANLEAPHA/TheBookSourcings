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


 

  // ✅ Handle read & download
  const readBtn = document.querySelector("#read");
  const downloadBtn = document.querySelector("#download");

  if (book.read) {
    readBtn.href = book.read;
  } else {
    readBtn.removeAttribute("href");
    if (book.source === "Open Library") {
      readBtn.addEventListener("click", (e) => {
        e.preventDefault();
        showToast("❌ This book is not available to read.");
      });
    }
  }

  if (book.download) {
    downloadBtn.href = book.download;
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

  const fullText = book.description || "No description available.";
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

  const firstCategory = Array.isArray(book.categories)
    ? (book.categories[0] || "")
    : (book.categories || "");

  const categoryToUse = (firstCategory && String(firstCategory).trim()) ? firstCategory : "fiction";

  // call the loader with that category
  loadSimilarBooks(categoryToUse);
 
}

 // --- Call function ---
const similarLists = document.querySelector(".swiper-wrapper");


// --- Skeleton Loader (5 placeholders) ---
function showSkeletons(count = 5) {
  similarLists.innerHTML = "";
  for (let i = 0; i < count; i++) {
    similarLists.innerHTML += `
      <div class="swiper-slide skeleton-slide">
        <div class="skeleton skeleton-img"></div>
        <div class="skeleton skeleton-text"></div>
        <div class="skeleton skeleton-text short"></div>
      </div>
    `;
  }
}

// --- Cache helper ---
function getCachedSimilar(category) {
  const cached = localStorage.getItem(`similar_${category}`);
  if (!cached) return null;

  const { data, expiry } = JSON.parse(cached);
  if (Date.now() > expiry) {
    localStorage.removeItem(`similar_${category}`);
    return null;
  }
  return data;
}

function setCachedSimilar(category, data) {
  localStorage.setItem(
    `similar_${category}`,
    JSON.stringify({
      data,
      expiry: Date.now() + 1000 * 60 * 30 // cache 30 mins
    })
  );
}

// --- Fetch & Render ---
async function loadSimilarBooks(category) {
  // 1. Check cache first
  const cached = getCachedSimilar(category);
  if (cached) {
    renderSimilar(cached);
    return;
  }

  // 2. Show skeletons
  showSkeletons();

  try {
    const res = await fetch(`https://thebooksourcings.onrender.com/api/similar/${encodeURIComponent(category)}`);
    const { results } = await res.json();

    // Save in cache
    setCachedSimilar(category, results);

    // Render
    renderSimilar(results);
  } catch (err) {
    console.error(err);
    similarLists.innerHTML = "<p>Failed to load similar books.</p>";
  }
}

function renderSimilar(similarBooks) {
  similarLists.innerHTML = "";

  if (similarBooks.length > 0) {
    similarBooks.forEach(bk => {
      similarLists.innerHTML += `
        <div class="swiper-slide">
          <a href='aboutBook.html?bookId=${bk.bookId}'>
            <img 
              src="${bk.cover || 'placeholder-image.jpg'}" 
              class="BookCover lazyload"
              loading="lazy"
              alt="${bk.title}"
              onerror="this.src='placeholder-image.jpg'"
            >
            <div class="bookInfo">
              <p class="BookTitle">${bk.title}</p>
              <p class="BookAuthor">${bk.author}</p>
            </div>
          </a>
        </div>
      `;
    });
  } else {
    similarLists.innerHTML = "<p>No similar books found.</p>";
  }

  // Wait for DOM to update before initializing Swiper
  setTimeout(() => {
    initSwiper();
  }, 100);
}

function initSwiper() {
  // Destroy existing Swiper instance if it exists
  if (window.mySwiper && window.mySwiper.destroy) {
    window.mySwiper.destroy();
  }
  
  window.mySwiper = new Swiper('.swiper', {
    loop: true,
    autoplay: { delay: 1500 },
    slidesPerView: 'auto',
    spaceBetween: 15,
    pagination: { el: '.swiper-pagination', clickable: true },
    navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
    breakpoints: {
      640: { slidesPerView: 3, spaceBetween: 20 },
      768: { slidesPerView: 3, spaceBetween: 20 },
      1024: { slidesPerView: 5, spaceBetween: 15 }
    }
  });
}



// ✅ Show toast function
function showToast(message) {
  const toastEl = document.getElementById("bookToast");
  const toastMessage = document.getElementById("toastMessage");
  toastMessage.textContent = message;

  const toast = new bootstrap.Toast(toastEl);
  toast.show();
}
