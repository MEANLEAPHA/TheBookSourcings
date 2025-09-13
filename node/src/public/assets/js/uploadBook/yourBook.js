async function yourBooks() {
  try {
    const res = await fetch("https://thebooksourcings.onrender.com/api/getMyBooks/notableWork", {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("token")}` // JWT token
      }
    });

    if (!res.ok) throw new Error("Network response not ok");
    const books = await res.json(); // Direct array

    const container = document.getElementById("BookContent");
    container.innerHTML = ""; // Clear old content

    if (books.length === 0) {
      container.innerHTML = `<p>You haven't uploaded any books yet.</p>`;
      return;
    }

    books.forEach(book => {
      const cover = book.bookCover || "default.jpg";
      const author = book.author || "Unknown Author";
      const bookId = book.bookQid; // ✅ use your DB's bookQid
      const title = book.title || "Untitled";
      const createAt = new Date(book.UploadAt).toLocaleDateString() || "No Data";
      const card = `
        <div class="Book-card">
          <a href='aboutBook.html?bookQid=${bookId}'>
            <div class="thumbnail">
              <img src="${cover}" class="bookCovers">
            </div>
            <div class="Book-info">
              <div class="title">${title}</div>
              <div class="byAuthor">${author}</div>
              <div class="meta">Uploaded on ${createAt}</div>
              <div class="channel">
                <div class="channel-name">My Library</div>
              </div>
            </div>
          </a>

          <div>
            <a href='update.html?bookQid=${bookId}'><button class="updateBook">Edit</button></a>
            <button onclick="deleteBook('${bookId}')" >Delete</button>
          </div>
        </div>
      `;

      container.insertAdjacentHTML("beforeend", card);
    });
  } catch (err) {
    console.error("Error fetching my books:", err);
  }
}

// Load on page
yourBooks();
function deleteBook(id){
    $.ajax({                                                                                                            
        url: 'https://thebooksourcings.onrender.com/api/getMyBooks/deleteBook/' + id,
        method: 'DELETE',
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('token')  // ← Token added here
        },
        success: function(response) {
            console.log(response);
            window.location.reload();
        },
        error: function(xhr, status, error) {
            alert('Error deleting Task: ' + error);
        }
    });         
}