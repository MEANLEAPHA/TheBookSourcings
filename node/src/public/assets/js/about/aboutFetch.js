  function detectSource(bookId) {
    if (/^TB\d+S$/.test(bookId)) return "thebooksourcing";
    if (/^OL\d+(W|M|A)$/.test(bookId)) return "openlibrary";
    if (/^\d+$/.test(bookId)) return "gutenberg";
    return "google"; // fallback for Google Books
  }

  const urlParams = new URLSearchParams(window.location.search);
  const bookId = urlParams.get("bookId");
  const source = detectSource(bookId);


  // DOM elements
const likeBtn = document.querySelector('.like');
const readLaterBtn = document.querySelector('.readLater');
const likeIcon = document.querySelector('.likeIcon');
const readLaterIcon = document.querySelector('.readLaterIcon');
const likeCount = document.querySelector('.likeCount');
const readLaterCount = document.querySelector('.readLaterCount');

// Helper to fetch book status
async function fetchBookStatus() {
    try {
        const res = await fetch(`https://thebooksourcings.onrender.com/api/LAFbook/status/${bookId}`, {
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            }
        });
        if (!res.ok) throw new Error("Failed to fetch status");
        const data = await res.json();
        const { book, userStatus } = data;

        // Update counts
        likeCount.textContent = book.likeCount;
        readLaterCount.textContent = book.favoriteCount;

        // Update icon colors based on user status
        likeIcon.style.color = userStatus.liked ? "gold" : "black";
        readLaterIcon.style.color = userStatus.favorited ? "gold" : "black";
    } catch (err) {
        console.error(err);
    }
}

// Toggle like/favorite
async function toggleActivity(type) {
    try {
        const res = await fetch(`https://thebooksourcings.onrender.com/api/LAFbook/${type}/${bookId}`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json"
            }
        });
        if (!res.ok) throw new Error(`Failed to toggle ${type}`);
        const data = await res.json();

        // Update icons and counts
        if (type === "like") {
            likeIcon.style.color = data.liked ? "gold" : "black";
            likeCount.textContent = parseInt(likeCount.textContent) + (data.liked ? 1 : -1);
        } else if (type === "favorite") {
            readLaterIcon.style.color = data.favorited ? "gold" : "black";
            readLaterCount.textContent = parseInt(readLaterCount.textContent) + (data.favorited ? 1 : -1);
        }
    } catch (err) {
        console.error(err);
    }
}

// Event listeners
likeBtn.addEventListener("click", () => toggleActivity("like"));
readLaterBtn.addEventListener("click", () => toggleActivity("favorite"));

// Initial load
fetchBookStatus();






      // Call backend to add a view
    fetch(`https://thebooksourcings.onrender.com/api/books/view/${bookId}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json"
      }
    })
    .then(res => res.json())
    .then(data => console.log(data))
    .catch(err => console.error("Error recording view:", err));


    // READ, Share, Download
    const read = document.querySelector(".readBtn");
    const download = document.querySelector(".downloadBtn");
    const share = document.querySelector(".shareBtn");

    function recordActivity(type, bookId) {
      fetch(`https://thebooksourcings.onrender.com/api/books/${type}/${bookId}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json"
        }
      })
        .then(res => res.json())
        .then(data => console.log(`${type} recorded:`, data))
        .catch(err => console.error(`Error recording ${type} activity:`, err));
    }

    if (read) read.addEventListener("click", () => recordActivity("read", bookId));
    if (download) download.addEventListener("click", () => recordActivity("download", bookId));
    if (share) share.addEventListener("click", () => recordActivity("share", bookId));



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
  };









  const firstCategory = Array.isArray(book.categories)
    ? (book.categories[0] || "")
    : (book.categories || "");

  const categoryToUse = (firstCategory && String(firstCategory).trim()) ? firstCategory : "fiction";

  // call the loader with that category
  loadSimilarBooks(categoryToUse);


 const firstAuthor = Array.isArray(book.authors)
  ? (book.authors[0] || "") 
  : (book.authors || "");

  const authorNameToUse = (firstAuthor && String(firstAuthor).trim()) ? firstAuthor : "William Shakespeare";
  loadOtherBookByAuthor(authorNameToUse);



const authorNames = Array.isArray(book.authors) ? book.authors : [book.authors || 'William Shakespeare'];
loadAuthorInfo(authorNames);



}

 // --- Call function ---
const similarLists = document.querySelector(".swiper-wrapper");



// --- Skeleton Loader (5 placeholders) for similarBook---
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




// renderSimilar
function renderSimilar(similarBooks) {
  similarLists.innerHTML = "";

  if (similarBooks.length > 0) {
    similarBooks.forEach(bk => {
      similarLists.innerHTML += `
        <div class="swiper-slide">
          <a href='aboutBook.html?bookId=${bk.bookId}'>
            <img 
              src="${bk.cover || 'assets/img/noCoverFound.png'}" 
              class="BookCover lazyload"
              loading="lazy"
              alt="${bk.title}"
              onerror="this.src='assets/img/noCoverFound.png'"
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


// declare the bookList varible (otherBookByAuthor)
const otherBookByAuthorList = document.querySelector(".otherBookByAuthor");


// --- Skeleton Loader (3 placeholders) for otherBookByAuthor---
function showSkeletonOBBA(count = 3){
    otherBookByAuthorList.innerHTML = "";
    for(let j=0 ; j<count ; j++){
      otherBookByAuthorList.innerHTML +=`
        <div class="skeleton-books">
          <div class="skeleton skeleton-bookImg"></div>
          <div class="skeleton-info">
            <div class="skeleton skeleton-title"></div>
            <div class="skeleton skeleton-author"></div>
          </div>
      </div>
      `;
    }
}



// --- Cache helper OBBA---
function getCachedSimilarOBBA(authors) {
  const cached = localStorage.getItem(`name_${authors}`);
  if (!cached) return null;

  const { data, expiry } = JSON.parse(cached);
  if (Date.now() > expiry) {
    localStorage.removeItem(`name_${authors}`);
    return null;
  }
  return data;
}


// set CachedSimilarOBBA 
function setCachedSimilarOBBA(authors, data) {
  localStorage.setItem(
    `name_${authors}`,
    JSON.stringify({
      data,
      expiry: Date.now() + 1000 * 60 * 30 // cache 30 mins
    })
  );
}


// --- Fetch & Render --- obba
async function loadOtherBookByAuthor(authorName){
   const cached = getCachedSimilarOBBA(authorName);
   if(cached){
      renderSimilarOBBA(cached);
      return;
   }

   // show skeleton
   showSkeletonOBBA();

   try{
      const res = await fetch(`https://thebooksourcings.onrender.com/api/bookByAuthor/${encodeURIComponent(authorName)}`);
      if (!res.ok) throw new Error("Network response not ok");

      const { results } = await res.json();
      setCachedSimilarOBBA(authorName, results);

      renderSimilarOBBA(results);
   }
   catch(err){
      console.error(err);
      // only show message if results are truly empty or error
      otherBookByAuthorList.innerHTML = "<p>Failed to load book. Please try again.</p>";
   }
}



// renderSimilarOBBA

function renderSimilarOBBA(author){
  otherBookByAuthorList.innerHTML = "";

  if(author.length > 0){
    author.forEach(book => {
      otherBookByAuthorList.innerHTML += `
        <div class="books">
          <a href='aboutBook.html?bookId=${book.bookId}'>
              <img src="${book.cover || 'assets/img/noCoverFound.png'}" 
                   alt="${book.title}" 
                   class="bookImg lazyload" 
                   loading="lazy" 
                   onerror="this.src='assets/img/noCoverFound.png'">
              <div class="bookInfo">
                  <a id="OtherbookTitle">${book.title}</a>
                  <a id="OtherbookSubTitle">${book.author}</a>
              </div>
          </a>
        </div>
      `;
    });

    // ✅ Show more / Show less logic
    const showLessBook = document.getElementById("showLessBook");
    const showAllBook = document.getElementById("showAllBook");
    const books = document.querySelectorAll('.books');

    if(books.length > 3){
      for(let i = 3; i < books.length; i++){
        books[i].style.display = 'none';
      }

      showLessBook.style.display = 'none';
      showAllBook.style.display = 'flex';

      showAllBook.onclick = () => {
        books.forEach(book => book.style.display = 'flex');
        showAllBook.style.display = 'none';
        showLessBook.style.display = 'flex';
      };

      showLessBook.onclick = () => {
        for(let i = 3; i < books.length; i++){
          books[i].style.display = 'none';
        }
        showAllBook.style.display = 'flex';
        showLessBook.style.display = 'none';
      };
    } else {
      showLessBook.style.display = 'none';
      showAllBook.style.display = 'none';
    }

  } else {
    otherBookByAuthorList.innerHTML = "<p>No similar books found.</p>";
  }
}


const authorCardBody = document.querySelector('.authorCard .card-body');

// Skeleton loader
function showSkeletonAuthor(count = 1) {
  authorCardBody.innerHTML = '';
  for (let i = 0; i < count; i++) {
    authorCardBody.innerHTML += `
      <div class="skeleton-author-card">
        <div class="skeleton skeleton-author-img"></div>
        <div class="skeleton skeleton-author-name"></div>
        <div class="skeleton skeleton-author-profession"></div>
        <div class="skeleton skeleton-author-desc"></div>
      </div>
    `;
  }
}

// Cache
function getCachedAuthor(authorNames) {
  const cached = localStorage.getItem(`author_${authorNames}`);
  if (!cached) return null;
  const { data, expiry } = JSON.parse(cached);
  if (Date.now() > expiry) {
    localStorage.removeItem(`author_${authorNames}`);
    return null;
  }
  return data;
}

function setCachedAuthor(authorNames, data) {
  localStorage.setItem(`author_${authorNames}`, JSON.stringify({
    data,
    expiry: Date.now() + 1000 * 60 * 30 // 30 mins
  }));
}

// Fetch & render
async function loadAuthorInfo(authorNames) {
  if (!authorNames || authorNames.length === 0) return;

  const joinedNames = authorNames.join(',');
  const cached = getCachedAuthor(joinedNames);
  if (cached) return renderAuthorInfo(cached);

  showSkeletonAuthor(authorNames.length);

  try {
    const res = await fetch(`https://thebooksourcings.onrender.com/api/aboutAuthor/${encodeURIComponent(joinedNames)}`);
    if (!res.ok) throw new Error('Network response not ok');
    const { authors } = await res.json();

    setCachedAuthor(joinedNames, authors);
    renderAuthorInfo(authors);
  } catch (err) {
    console.error(err);
    authorCardBody.innerHTML = '<p>Failed to load author info. Please try again.</p>';
  }
}

// Render
// Helper: convert Wikidata image filename to Wikimedia Commons URL
function getWikidataImageUrl(filename) {
  if (!filename) return 'assets/img/dog.png'; // fallback image
  const encoded = encodeURIComponent(filename.replace(/ /g, '_'));
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encoded}`;
}

// Render author info
function renderAuthorInfo(authors) {
  authorCardBody.innerHTML = ''; // clear previous content

  if (!authors || authors.length === 0) {
    authorCardBody.innerHTML = '<p>No author info available.</p>';
    return;
  }

  authors.forEach((author, idx) => {
    const wikiId = author.wikidataId || '';
    const name = author.name || 'Unknown Author';
    const profession = author.profession || '';
    const description = author.description || 'No description available';
    const imgUrl = getWikidataImageUrl(author.photo);

    const html = `
      <div class="aboutAuthor">
        <img src="${imgUrl}" class="aboutPf" alt="${name}">
        <div class="authorInfo">
          <p class="authorName">${name}</p>
          <p class="authorProfession">${profession}</p>
          <p class="aboutAuthorDes">${description}</p>
        </div>
      </div>
      
      <p style='padding-top:10px'><a href="aboutAuthor.html?wikiId=${wikiId}">Know more details</a></p>
      
      ${idx < authors.length - 1 ? '<hr>' : ''}
    `;

    authorCardBody.insertAdjacentHTML('beforeend', html);
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
