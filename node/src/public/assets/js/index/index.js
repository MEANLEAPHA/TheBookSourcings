
let feedSeed = Number(sessionStorage.getItem("feed_seed"));

if (!feedSeed) {
  feedSeed = Math.floor(Math.random() * 1_000_000);
  sessionStorage.setItem("feed_seed", feedSeed);
}


let cursor = 0;
let isLoading = false;
// Example: when page first loads
window.addEventListener('load', () => {
  feedSeed++;   // increment seed to get a new random feed
  cursor = 0;   // reset scroll
  fetchNextBatch();
});

// Or, if you have a refresh button:
document.getElementById('refreshFeedBtn').addEventListener('click', () => {
  feedSeed++;
  cursor = 0;
  container.innerHTML = ''; // clear old books if you want
  fetchNextBatch();
});

const container = document.getElementById("BookContent");


async function fetchNextBatch() {
  if (isLoading) return;
  isLoading = true;

  renderSkeletons(3);

  const res = await fetch(
    `https://thebooksourcings.onrender.com/api/trending?seed=${feedSeed}&cursor=${cursor}`
  );
  const result = await res.json();

  removeSkeletons();
  renderBooks(result.data);

  cursor = result.nextCursor;
  isLoading = false;
}
function removeSkeletons() {
  document.querySelectorAll('.skeleton-card').forEach(skeleton => skeleton.remove());
}

// 1️⃣ Render skeletons immediately
// function renderSkeletons(count = 6) {
//   container.innerHTML = "";
//   for (let i = 0; i < count; i++) {
//     container.insertAdjacentHTML(
//       "beforeend",
//       `<div class="skeleton-card"></div>`
//     );
//   }
// }

// // 2️⃣ Render books
// function renderBooks(books) {
//   container.innerHTML = "";

//   if (!books.length) {
//     container.innerHTML = "<p>No trending books found.</p>";
//     return;
//   }

//   books.forEach(book => {
//     const cover = book.cover || "default.jpg";
//     const author = book.authors?.length ? book.authors.join(", ") : "No Data";
//     const source = book.source || "No Data";
//     const bookId = book.bookId || book.bookQid;

//     const card = `
//       <div class="Book-card">
//         <a href="aboutBook.html?bookId=${bookId}">
//           <div class="thumbnail">
//             <img src="${cover}" class="bookCovers">
//           </div>
//           <div class="Book-info">
//             <div class="title">${book.title || "Untitled"}</div>
//             <div class="byAuthor">${author}</div>
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

  books.forEach(book => {
    const cover = book.cover || "default.jpg";
    const author = book.authors?.length ? book.authors.join(", ") : "No Data";
    const source = book.source || "No Data";
    const bookId = book.bookId || book.bookQid;

    const card = `
      <div class="Book-card">
        <a href="aboutBook.html?bookId=${bookId}">
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

// 3️⃣ Fetch trending books
async function fetchTrendingBooks() {
  renderSkeletons(); // 👈 instant UI feedback

  try {
    const res = await fetch("https://thebooksourcings.onrender.com/api/trending");
    const result = await res.json();

    // 🔥 NOW backend already mixes data
    const books = result.data || [];

    renderBooks(books);

  } catch (err) {
    console.error(err);
    container.innerHTML = "<p>Failed to load books.</p>";
  }
}



// Load on page
fetchTrendingBooks();

window.addEventListener("scroll", () => {
  if (
    window.innerHeight + window.scrollY >=
    document.body.offsetHeight - 300
  ) {
    fetchNextBatch();
  }
});
