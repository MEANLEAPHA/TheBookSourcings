const container = document.getElementById("BookContent");
let feedSeed = Number(sessionStorage.getItem("feed_seed"));

if (!feedSeed) {
  feedSeed = Math.floor(Math.random() * 1_000_000);
  sessionStorage.setItem("feed_seed", feedSeed);
}

let hasMore = true;
let cursor = 0;
let isLoading = false;
let feedMode = 'home'; // 'home' | 'genre' | 'author'


window.addEventListener('load', () => {
  feedMode = 'home';
  const newSeed = Math.floor(Math.random() * 1_000_000);

  sessionStorage.setItem("feed_seed", newSeed);
  feedSeed = newSeed;

  cursor = 0;
  isLoading = false;
  hasMore = true;
  container.innerHTML = "";

  fetchNextBatch();
});

async function fetchNextBatch() {
  if (feedMode !== 'home') return; 
  if (isLoading || !hasMore) return;
  isLoading = true;

  renderSkeletons(3);

  try {
    const res = await fetch(
      `https://thebooksourcings.onrender.com/api/trending?seed=${feedSeed}&cursor=${cursor}`
    );
    const result = await res.json();

    removeSkeletons();

    if (!result.data || result.data.length === 0) {
      hasMore = false;   // 🛑 feed ends here
      isLoading = false;
      return;
    }

    renderBooks(result.data);
    cursor = result.nextCursor;

  } catch (err) {
    console.error(err);
    removeSkeletons();
  }

  isLoading = false;
}

function removeSkeletons() {
  const skeletons = document.querySelectorAll('.skeleton-card');
  if (!skeletons.length) return;
  skeletons.forEach(el => el.remove());
}


function renderSkeletons(count = 6) {
  for (let i = 0; i < count; i++) {
    container.insertAdjacentHTML(
      "beforeend",
      `<div class="skeleton-card"></div>`
    );
  }
}

function renderBooks(books) {
  if (!books.length) {
    if (!container.innerHTML) container.innerHTML = "<p>No trending books found.</p>";
    return;
  }

  books.forEach((book, index)  => {
    const position = cursor + index;
    const cover = book.cover || "default.jpg";
    const author = book.authors?.length ? book.authors.join(", ") : "No Data";
    const source = book.source || "No Data";
    const bookId = book.bookId || book.bookQid;

    const card = `
      <div class="Book-card">
        <a href="aboutBook.html?bookId=${bookId}&position=${position}">
          <div class="thumbnail">
            <img src="${cover}" class="bookCovers">
          </div>
          <div class="Book-info">
            <div class="title">${book.title || "Untitled"}</div>
            <div class="byAuthor">${author}</div>
            <div class="channel">
              <div class="channel-name">${source}</div>
            </div>
          </div>
        </a>
      </div>
    `;

    container.insertAdjacentHTML("beforeend", card);
  });
}

async function loadSmartNav() {
  const token = localStorage.getItem('token');
  let url = 'https://thebooksourcings.onrender.com/api/static/nav';

  if (token) {
    // Try dynamic first
    const test = await fetch('https://thebooksourcings.onrender.com/api/dynamic/nav', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const json = await test.json();

    if (json.success && (json.genres?.length >= 5 || json.authors?.length >= 3)) {
      renderDynamicNav(json);
      return;
    }
  }

  // Fallback to static
  const res = await fetch(url);
  const data = await res.json();
  renderStaticNav(data);
}

function renderDynamicNav(data) {
  const bar = document.getElementById('genreBar');
  bar.innerHTML = '';

  data.genres.forEach(g => {
    const btn = document.createElement('button');
    btn.className = 'genre-btn';
    btn.textContent = g.name;
    btn.onclick = () => loadFeedByGenre(g.slug);
    bar.appendChild(btn);
  });

  data.authors.forEach(a => {
    const btn = document.createElement('button');
    btn.className = 'author-btn';
    btn.textContent = a.name;
    btn.onclick = () => loadFeedByAuthor(a.author_id);
    bar.appendChild(btn);
  });
}

function renderStaticNav(json) {
  const genreBar = document.getElementById('genreBar');
  genreBar.innerHTML = '';

  json.genres.forEach(genre => {
    const btn = document.createElement('button');
    btn.className = 'genre-btn';
    btn.textContent = genre.name;
    btn.onclick = () => loadFeedByGenre(genre.slug);
    genreBar.appendChild(btn);
  });
}

document.addEventListener('DOMContentLoaded', loadSmartNav);



let feedCursor = 0;
let currentMode = 'home';
let currentValue = null;

async function loadFeedByGenre(slug) {
  feedMode = 'genre';
  currentValue = slug;
  feedCursor = 0;

  document.getElementById('BookContent').innerHTML = '';
  await loadFeed();
}

async function loadFeedByAuthor(authorId) {
  feedMode = 'author';
  currentValue = authorId;
  feedCursor = 0;

  document.getElementById('BookContent').innerHTML = '';
  await loadFeed();
}


async function loadFeed() {
  const params = new URLSearchParams({
    cursor: feedCursor,
    mode: feedMode
  });

  if (feedMode === 'genre') params.set('genre', currentValue);
  if (feedMode === 'author') params.set('authorId', currentValue);

  const res = await fetch(`https://thebooksourcings.onrender.com/api/feed?${params.toString()}`);
  const json = await res.json();

  if (!json.success) return;

  renderBooks(json.data);
  feedCursor = json.nextCursor;
}

