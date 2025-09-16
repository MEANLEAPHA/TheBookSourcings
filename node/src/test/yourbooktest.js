async function yourBooks() {
  try {
    const res = await fetch("https://thebooksourcings.onrender.com/api/getMyBooks/notableWork", {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("token")}` // JWT token
      }
    });

    if (!res.ok) throw new Error("Network response not ok");
    const books = await res.json(); // Direct array

    const tbody = document.getElementById("tbody");
    tbody.innerHTML = ""; // Clear old content

    if (books.length === 0) {
      tbody.innerHTML = `<p>You haven't uploaded any books yet.</p>`;
      return;
    }

    books.forEach(book => {
      const cover = book.bookCover || "default.jpg";
      const author = book.author || "Unknown Author";
      const bookId = book.bookQid; // ✅ use your DB's bookQid
      const title = book.title || "Untitled";
      const viewCount = book.viewCount || null;
      const shareCount = book.shareCount || null;
      const readCount = book.readCount || null;
      const downloadCount = book.downloadCount || null;
      const likeCount = book.likeCount || null;
      const createAt = new Date(book.UploadAt).toLocaleDateString() || "No Data";
      const card = `     <tr>
                <td><img src="${cover}" width="60px" height="90px" id="imgCover"></td>
                <td>
                    <div id="titleTd">
                        <div class="tdC">${title}</div>
                        <div class="rowTdc">
                            <div><i class="fa-brands fa-readme "></i> <span>${readCount}</span></div>
                            <div><i class="fa-solid fa-eye "></i> <span>${viewCount}</span></div>
                            <div><i class="fa-solid fa-file-arrow-down "></i> <span>${downloadCount}</span></div>
                            <div><i class="fa-solid fa-share "></i> <span>${shareCount}</span></div>

                        </div>
                    </div>
                </td>
                <td id="readTd"><div class="tdCs">${readCount}</div></td>
                <td id="viewTd"><div class="tdCs">${viewCount}</div></td>
                <td id="downloadTd"><div class="tdCs">${downloadCount}</div></td>
                <td id="shareTd"><div class="tdCs">${shareCount}</div></td>
                <td >
                    <div id="actionTd">
                    <button><a href='update.html?bookQid=${bookId}'><i class="fa-solid fa-pen-to-square" ></i></a> </button>
                    <button onclick="deleteBook('${bookId}')"><a><i class="fa-solid fa-trash"></i></a></button>
                    </div>
                </td>
            </tr>`;

     

      tbody.insertAdjacentHTML("beforeend", card);
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
     <!-- <tr>
                                    <td><img src="https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" width="60px" height="90px" id="imgCover"></td>
                                    <td>
                                        <div id="titleTd">
                                            <div class="tdC">Same as ever more inivc and heh </div>
                                            <div class="rowTdc">
                                                <div><i class="fa-brands fa-readme "></i> <span>123</span></div>
                                                <div><i class="fa-solid fa-eye "></i> <span>432</span></div>
                                                <div><i class="fa-solid fa-file-arrow-down "></i> <span>665</span></div>
                                                <div><i class="fa-solid fa-share "></i> <span>244</span></div>

                                            </div>
                                        </div>
                                    </td>
                                    <td id="readTd"><div class="tdCs">98</div></td>
                                    <td id="viewTd"><div class="tdCs">345</div></td>
                                    <td id="downloadTd"><div class="tdCs">223</div></td>
                                    <td id="shareTd"><div class="tdCs">987</div></td>
                                    <td >
                                        <div id="actionTd">
                                        <button><a href="#"><i class="fa-solid fa-pen-to-square" ></i></a> </button>
                                        <button><a href="#"><i class="fa-solid fa-trash"></i></a></button>
                                        </div>
                                    </td>
                                </tr> -->