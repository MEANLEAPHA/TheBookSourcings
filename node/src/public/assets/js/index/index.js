const container = document.getElementById("BookContent");
let feedSeed = Number(sessionStorage.getItem("feed_seed"));

if (!feedSeed) {
  feedSeed = Math.floor(Math.random() * 1_000_000);
  sessionStorage.setItem("feed_seed", feedSeed);
}

let hasMore = true;
let cursor = 0;
let isLoading = false;


window.addEventListener('load', () => {
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

async function loadNavGenres() {
  try {
    const res = await fetch('https://thebooksourcings.onrender.com/api/static/nav', {
      headers: {
        Authorization: localStorage.getItem('token')
          ? `Bearer ${localStorage.getItem('token')}`
          : ''
      }
    });

    const json = await res.json();
    if (!json.success) return;

    const genreBar = document.getElementById('genreBar');
    genreBar.innerHTML = '';

    json.genres.forEach((genre, index) => {
      const btn = document.createElement('button');
      btn.className = 'genre-btn';
      if (index === 0) btn.classList.add('active');

      btn.textContent = genre.name;
      btn.dataset.slug = genre.slug;

      btn.addEventListener('click', () => {
        document
          .querySelectorAll('.genre-btn')
          .forEach(b => b.classList.remove('active'));

        btn.classList.add('active');

        // NEXT STEP (locked)
        loadFeedByGenre(genre.slug);
      });

      genreBar.appendChild(btn);
    });

  } catch (err) {
    console.error('Nav load error', err);
  }
}

document.addEventListener('DOMContentLoaded', loadNavGenres);



let feedCursor = 0;
let currentMode = 'home';
let currentValue = null;

async function loadFeedByGenre(slug) {
  currentMode = 'genre';
  currentValue = slug;
  feedCursor = 0;

  document.getElementById('BookContent').innerHTML = '';
  await loadFeed();
}

async function loadFeed() {
  const params = new URLSearchParams({
    cursor: feedCursor,
    mode: currentMode
  });

  if (currentMode === 'genre') params.set('genre', currentValue);
  if (currentMode === 'author') params.set('authorId', currentValue);

  const res = await fetch(`/api/feed?${params.toString()}`);
  const json = await res.json();

  if (!json.success) return;

  renderBooks(json.data);
  feedCursor = json.nextCursor;
}


// let feedCursor = 0;
// let currentMode = 'genre';
// let currentSlug = null;


// // i don't have any feed container declare yet
// async function loadFeedByGenre(slug) {
//   currentSlug = slug;
//   feedCursor = 0;
//   feedContainer.innerHTML = '';

//   await loadMoreFeed();
// }

// async function loadMoreFeed() {
//   let url = '';

//   if (currentMode === 'genre') {
//     url = `https://thebooksourcings.onrender.com/api/feed/genre/${currentSlug}?cursor=${feedCursor}`;
//   } else {
//     url = `https://thebooksourcings.onrender.com/api/feed?cursor=${feedCursor}`;
//   }

//   const res = await fetch(url);
//   const json = await res.json();

//   if (!json.success) return;

//   renderBooks(json.data);
//   feedCursor = json.nextCursor;
// }


// window.addEventListener("scroll", () => {
//   if (!hasMore) return;
//   if (
//     window.innerHeight + window.scrollY >=
//     document.body.offsetHeight - 300
//   ) {
//     fetchNextBatch();
//   }
// });
