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

window.addEventListener("scroll", () => {
  if (!hasMore) return;
  if (
    window.innerHeight + window.scrollY >=
    document.body.offsetHeight - 300
  ) {
    fetchNextBatch();
  }
});
