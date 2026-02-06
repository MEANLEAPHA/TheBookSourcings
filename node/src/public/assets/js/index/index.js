// const container = document.getElementById("BookContent");
// let feedSeed = Number(sessionStorage.getItem("feed_seed"));

// if (!feedSeed) {
//   feedSeed = Math.floor(Math.random() * 1_000_000);
//   sessionStorage.setItem("feed_seed", feedSeed);
// }

// let hasMore = true;
// let cursor = 0;
// let isLoading = false;
// let feedMode = 'home'; // 'home' | 'genre' | 'author'


// window.addEventListener('load', () => {
//   feedMode = 'home';
//   const newSeed = Math.floor(Math.random() * 1_000_000);

//   sessionStorage.setItem("feed_seed", newSeed);
//   feedSeed = newSeed;

//   cursor = 0;
//   isLoading = false;
//   hasMore = true;
//   container.innerHTML = "";

//   fetchNextBatch();
// });

// async function fetchNextBatch() {
//   if (feedMode !== 'home') return; 
//   if (isLoading || !hasMore) return;
//   isLoading = true;

//   renderSkeletons(3);

//   try {
//     const res = await fetch(
//       `https://thebooksourcings.onrender.com/api/trending?seed=${feedSeed}&cursor=${cursor}`
//     );
//     const result = await res.json();

//     removeSkeletons();

//     if (!result.data || result.data.length === 0) {
//       hasMore = false;   // 🛑 feed ends here
//       isLoading = false;
//       return;
//     }

//     renderBooks(result.data);
//     cursor = result.nextCursor;

//   } catch (err) {
//     console.error(err);
//     removeSkeletons();
//   }

//   isLoading = false;
// }

// function removeSkeletons() {
//   const skeletons = document.querySelectorAll('.skeleton-card');
//   if (!skeletons.length) return;
//   skeletons.forEach(el => el.remove());
// }


// function renderSkeletons(count = 6) {
//   for (let i = 0; i < count; i++) {
//     container.insertAdjacentHTML(
//       "beforeend",
//       `<div class="skeleton-card"></div>`
//     );
//   }
// }

// function renderBooks(books) {
//   if (!books.length) {
//     if (!container.innerHTML) container.innerHTML = "<p>No trending books found.</p>";
//     return;
//   }

//   books.forEach((book, index)  => {
//     const position = cursor + index;
//     const cover = book.cover || "default.jpg";
//      // Handle authors - make sure it's an array before using .join()
//     let authorsDisplay = "No Data";
    
//     if (book.authors) {
//       if (Array.isArray(book.authors)) {
//         authorsDisplay = book.authors.join(", ");
//       } else if (typeof book.authors === 'string') {
//         authorsDisplay = book.authors;
//       }
//     }
//     // const author = book.authors?.length ? book.authors.join(", ") : "No Data";
//     const source = book.source || "No Data";
//     const bookId = book.bookId || book.bookQid;

//     const card = `
//       <div class="Book-card">
//         <a href="aboutBook.html?bookId=${bookId}&position=${position}">
//           <div class="thumbnail">
//             <img src="${cover}" class="bookCovers">
//           </div>
//           <div class="Book-info">
//             <div class="title">${book.title || "Untitled"}</div>
//             <div class="byAuthor">${authorsDisplay}</div>
//             <div class="channel">
//               <div class="channel-name">${source}</div>
//             </div>
//           </div>
//         </a>
//       </div>
//     `;

//     container.insertAdjacentHTML("beforeend", card);
//   });
// }

// async function loadSmartNav() {
//   const token = localStorage.getItem('token');
//   let url = 'https://thebooksourcings.onrender.com/api/static/nav';

//   if (token) {
//     // Try dynamic first
//     const test = await fetch('https://thebooksourcings.onrender.com/api/dynamic/nav', {
//       headers: { Authorization: `Bearer ${token}` }
//     });
//     const json = await test.json();

//     if (json.success && (json.genres?.length >= 5 || json.authors?.length >= 3)) {
//       renderDynamicNav(json);
//       return;
//     }
//   }

//   // Fallback to static
//   const res = await fetch(url);
//   const data = await res.json();
//   renderStaticNav(data);
// }

// function renderDynamicNav(data) {
//   const bar = document.getElementById('genreBar');
//   bar.innerHTML = '';

//   data.genres.forEach(g => {
//     const btn = document.createElement('button');
//     btn.className = 'genre-btn';
//     btn.textContent = g.slug;
//     btn.onclick = () => loadFeedByGenre(g.slug);
//     bar.appendChild(btn);
//   });

//   data.authors.forEach(a => {
//     const btn = document.createElement('button');
//     btn.className = 'author-btn';
//     btn.textContent = a.name;
//     btn.onclick = () => loadFeedByAuthor(a.author_id);
//     bar.appendChild(btn);
//   });
// }

// function renderStaticNav(json) {
//   const genreBar = document.getElementById('genreBar');
//   genreBar.innerHTML = '';

//   json.genres.forEach(genre => {
//     const btn = document.createElement('button');
//     btn.className = 'genre-btn';
//     btn.textContent = genre.name;
//     btn.onclick = () => loadFeedByGenre(genre.name);
//     genreBar.appendChild(btn);
//   });
// }

// document.addEventListener('DOMContentLoaded', loadSmartNav);



// let feedCursor = 0;
// let currentMode = 'home';
// let currentValue = null;

// async function loadFeedByGenre(name) {
//   feedMode = 'genre';
//   currentValue = name;
//   feedCursor = 0;

//   document.getElementById('BookContent').innerHTML = '';
//   await loadFeed();
// }

// async function loadFeedByAuthor(authorId) {
//   feedMode = 'author';
//   currentValue = authorId;
//   feedCursor = 0;

//   document.getElementById('BookContent').innerHTML = '';
//   await loadFeed();
// }


// async function loadFeed() {
//   const params = new URLSearchParams({
//     cursor: feedCursor,
//     mode: feedMode
//   });

//   if (feedMode === 'genre') params.set('genre', currentValue);
//   if (feedMode === 'author') params.set('authorId', currentValue);

//   const res = await fetch(`https://thebooksourcings.onrender.com/api/feed?${params.toString()}`);
//   const json = await res.json();

//   if (!json.success) return;

//   renderBooks(json.data);
//   feedCursor = json.nextCursor;
// }

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
let currentValue = null; // genre name or author ID

window.addEventListener('load', () => {
  resetToHomeFeed();
  fetchNextBatch();
});

function resetToHomeFeed() {
  feedMode = 'home';
  currentValue = null;
  const newSeed = Math.floor(Math.random() * 1_000_000);
  sessionStorage.setItem("feed_seed", newSeed);
  feedSeed = newSeed;
  cursor = 0;
  isLoading = false;
  hasMore = true;
  container.innerHTML = "";
}

async function fetchNextBatch() {
  if (isLoading || !hasMore) return;
  isLoading = true;

  renderSkeletons(3);

  try {
    let url;
    
    if (feedMode === 'home') {
      // Home feed - trending with seed
      url = `https://thebooksourcings.onrender.com/api/trending?seed=${feedSeed}&cursor=${cursor}`;
    } else {
      // Genre or Author feed - using feed API
      const params = new URLSearchParams({
        cursor: cursor,
        mode: feedMode
      });
      
      if (feedMode === 'genre') params.set('genre', currentValue);
      if (feedMode === 'author') params.set('authorId', currentValue);
      
      url = `https://thebooksourcings.onrender.com/api/feed?${params.toString()}`;
    }

    console.log(`Fetching: ${url}`);
    const res = await fetch(url);
    const result = await res.json();

    removeSkeletons();

    if (!result.success || !result.data || result.data.length === 0) {
      hasMore = false;
      isLoading = false;
      return;
    }

    renderBooks(result.data);
    
    // Update cursor based on API response
    if (result.nextCursor !== undefined) {
      cursor = result.nextCursor;
    } else {
      // Fallback for trending API
      cursor += result.data.length;
    }
    
    hasMore = result.hasMore !== false;

  } catch (err) {
    console.error('Fetch error:', err);
    removeSkeletons();
  }

  isLoading = false;
}

// Infinite scroll
let scrollTimeout;
window.addEventListener('scroll', () => {
  if (scrollTimeout) clearTimeout(scrollTimeout);
  
  scrollTimeout = setTimeout(() => {
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
    
    // Load more when 80% scrolled
    if (scrollTop + clientHeight >= scrollHeight * 0.8) {
      fetchNextBatch();
    }
  }, 100);
});

function removeSkeletons() {
  const skeletons = document.querySelectorAll('.skeleton-card');
  if (!skeletons.length) return;
  skeletons.forEach(el => el.remove());
}

function renderSkeletons(count = 3) {
  for (let i = 0; i < count; i++) {
    container.insertAdjacentHTML(
      "beforeend",
      `<div class="skeleton-card"></div>`
    );
  }
}

function renderBooks(books) {
  if (!books || books.length === 0) {
    if (!container.innerHTML) {
      container.innerHTML = "<p>No books found.</p>";
    }
    return;
  }

  books.forEach((book, index) => {
    const position = cursor + index;
    const cover = book.cover || "default.jpg";
    
    // Handle authors
    let authorsDisplay = "No Data";
    if (book.authors) {
      if (Array.isArray(book.authors)) {
        authorsDisplay = book.authors.join(", ");
      } else if (typeof book.authors === 'string') {
        authorsDisplay = book.authors;
      }
    }
    
    const source = book.source || "No Data";
    const bookId = book.bookId || book.bookQid;

    const card = `
      <div class="Book-card">
        <a href="aboutBook.html?bookId=${bookId}&position=${position}">
          <div class="thumbnail">
            <img src="${cover}" class="bookCovers" alt="${book.title || 'Book cover'}">
          </div>
          <div class="Book-info">
            <div class="title">${book.title || "Untitled"}</div>
            <div class="byAuthor">${authorsDisplay}</div>
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

// Navigation functions
async function loadSmartNav() {
  const token = localStorage.getItem('token');
  let url = 'https://thebooksourcings.onrender.com/api/static/nav';

  if (token) {
    try {
      const test = await fetch('https://thebooksourcings.onrender.com/api/dynamic/nav', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await test.json();

      if (json.success && (json.genres?.length >= 5 || json.authors?.length >= 3)) {
        renderDynamicNav(json);
        return;
      }
    } catch (err) {
      console.error('Dynamic nav failed:', err);
    }
  }

  // Fallback to static
  try {
    const res = await fetch(url);
    const data = await res.json();
    renderStaticNav(data);
  } catch (err) {
    console.error('Static nav failed:', err);
  }
}

function renderDynamicNav(data) {
  const bar = document.getElementById('genreBar');
  bar.innerHTML = '';

  // Add genres
  if (data.genres) {
    data.genres.forEach(g => {
      const btn = document.createElement('button');
      btn.className = 'genre-btn';
      btn.textContent = g.slug || g.name;
      btn.onclick = () => loadFeedByGenre(g.slug || g.name);
      bar.appendChild(btn);
    });
  }

  // Add authors
  if (data.authors) {
    data.authors.forEach(a => {
      const btn = document.createElement('button');
      btn.className = 'author-btn';
      btn.textContent = a.name;
      btn.onclick = () => loadFeedByAuthor(a.author_id);
      bar.appendChild(btn);
    });
  }
}

function renderStaticNav(json) {
  const genreBar = document.getElementById('genreBar');
  genreBar.innerHTML = '';

  if (json.genres) {
    json.genres.forEach(genre => {
      const btn = document.createElement('button');
      btn.className = 'genre-btn';
      btn.textContent = genre.name;
      btn.onclick = () => loadFeedByGenre(genre.name);
      genreBar.appendChild(btn);
    });
  }
}

async function loadFeedByGenre(name) {
  feedMode = 'genre';
  currentValue = name;
  cursor = 0;
  hasMore = true;
  
  container.innerHTML = '';
  await fetchNextBatch();
}

async function loadFeedByAuthor(authorId) {
  feedMode = 'author';
  currentValue = authorId;
  cursor = 0;
  hasMore = true;
  
  container.innerHTML = '';
  await fetchNextBatch();
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadSmartNav();
  
  // Home button functionality
  const homeBtn = document.getElementById('homeBtn');
  if (homeBtn) {
    homeBtn.addEventListener('click', () => {
      resetToHomeFeed();
      fetchNextBatch();
    });
  }
});