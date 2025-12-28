// async function fetchTrendingBooks() {
//   try {
//     const res = await fetch('https://thebooksourcings.onrender.com/api/trending');
//     const result = await res.json();

//     // ✅ Flatten all sources into one array
//     const books = [
//       ...(result.data.google || []),
//       ...(result.data.gutenberg || []),
//       ...(result.data.openLibrary || []),
//       ...(result.data.otthor || [])
//     ];

//     const container = document.getElementById('BookContent');
//     container.innerHTML = ''; // Clear old content

//     if (books.length === 0) {
//       container.innerHTML = `<p>No trending books found right now.</p>`;
//       return;
//     }

//     books.forEach(book => {
//       // ✅ Get cover
//       const cover = book.cover || "default.jpg";
//       // ✅ Get authors
//       const author = book.authors && book.authors.length ? book.authors.join(", ") : "No Data";
//       // ✅ Get source
//       const source = book.source || "No Data";

//       // get boook id
//       const bookId = book.bookId;



//       // ✅ Build HTML
//       const card = `
//         <div class="Book-card">
//           <a href='aboutBook.html?bookId=${bookId}'>
//             <div class="thumbnail">
//               <img src="${cover}" class="bookCovers">
//             </div>
//             <div class="Book-info">
//               <div class="title">${book.title || "Untitled"}</div>
//               <div class="byAuthor">${author}</div>
//               <div class="meta">1.2M views · 3 days ago</div>
//               <div class="channel">
//                 <div class="avatar"></div>
//                 <div class="channel-name">${source}</div>
//               </div>
             
//             </div>
//           </a>
//         </div>
//       `;

//       container.insertAdjacentHTML('beforeend', card);
//     });
//   } catch (err) {
//     console.error("Error fetching trending books:", err);
//   }
// }


// // Load on page
// fetchTrendingBooks();

const container = document.getElementById("BookContent");

// 1️⃣ Render skeletons immediately
function renderSkeletons(count = 6) {
  container.innerHTML = "";
  for (let i = 0; i < count; i++) {
    container.insertAdjacentHTML(
      "beforeend",
      `<div class="skeleton-card"></div>`
    );
  }
}

// 2️⃣ Render books
function renderBooks(books) {
  container.innerHTML = "";

  if (!books.length) {
    container.innerHTML = "<p>No trending books found.</p>";
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
