    document.addEventListener("DOMContentLoaded", () => {
    const filterForm = document.getElementById("filterForm");
    const BookContent = document.getElementById("BookContent");

    const closeFilter = document.querySelector('.filter-btn-collapse-close');
    const openFilter = document.querySelector('.filter-btn-collapse-open');
    window.addEventListener('resize', () => {
        if (window.innerWidth > 1024) {
           filterForm.style.display = 'flex';
        }
    })
    filterForm.style.display = 'flex';
    openFilter.style.display = 'none';
    closeFilter.addEventListener('click', ()=>{
    filterForm.style.display = 'none';
     openFilter.style.display = 'block';
     closeFilter.style.display = 'none';
   })
    openFilter.addEventListener('click', ()=>{
    filterForm.style.display = 'flex';
     openFilter.style.display = 'none';
     closeFilter.style.display = 'block';
   })


  const salePost = document.getElementById("create"); // salePost
  salePost.addEventListener("click", () => {
    window.location.href = "uploadSale.html";
  });

    // 🌐 API base (adjust path if needed)
    const API_URL = "https://thebooksourcings.onrender.com/api/shop/displaySaleBook";

    // 🧩 Fetch and display books
    async function fetchBooks(filters = {}) {
    try {
        const queryString = new URLSearchParams(filters).toString();
        const res = await fetch(`${API_URL}?${queryString}`);
        const data = await res.json();

        if (!data.Result || !data.books) {
        BookContent.innerHTML = `<p class="text-muted text-center mt-3">No books found.</p>`;
        return;
        }

        // 🎨 Render book cards
        renderBooks(data.books);
    } catch (err) {
        console.error("Error fetching books:", err);
        BookContent.innerHTML = `<p class="text-danger text-center mt-3">Failed to load books.</p>`;
    }
    }

    // 🧱 Render books in cards
    function renderBooks(books) {
    BookContent.innerHTML = books
        .map((book) => {
        const img = book.bookImg || (book.imgPreview?.[0] ?? "https://via.placeholder.com/150");
        const discountTag =
            book.discount_type && book.discount_price
            ? `<span class="sale-type">${book.discount_type === "percent" ? `${book.discount_price}%` : `${book.discount_price}$`}</span>`
            : `<span class="sale-type">Free</span>`;
        const saleType = //  class="badge-promotion free-type" => $saleType
            book.sale_type === "free"
            ? `class="badge-promotion free-type"`
            : book.sale_type === "discount"
            ? `class="badge-promotion discount-type"`
            : `class="badge-promotion normal-type"`;

        return `
                <div class="saleBook-container">
                    <div class="saleBook">
                        <div class="saleBook-cover-holder">
                            <div ${saleType}>${discountTag}</div>
                            <img src="${img}" class="saleBook-src" alt="${book.title}">
                        </div>
                        <div class="card-body"> 
                            <div class="card-name">
                                <p class="saleBook-title">${book.title || "Untitled"}</p>
                            </div>
                            <div class="card-book-type">
                                <p class="book-type">${book.book_type?.toUpperCase() || "Unknown Type"}</p>
                            </div>
                            <div class="card-book-price">
                                <p class="mb-1">${book.price ? `<span class="fw-bold">$${book.price}</span>` : ""}
                                    ${book.original_price && book.original_price > book.price
                                    ? `<small class="text-decoration-line-through text-muted ms-2">$${book.original_price}</small>`
                                    : ""}
                                </p>
                            </div>
                            <button class="order-saleBook-btn"><a href="aboutSaleBook.html?bookSid=${book.bookSid}"><i class="fa-solid fa-arrow-up"></i>View Book</a></button>
                        </div>
                    </div>
                </div>

        `;
        })
        .join("");
    }

    // 🧮 Handle form submission
    filterForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const filters = {
        minPrice: document.getElementById("priceMin").value,
        maxPrice: document.getElementById("priceMax").value,
        saleType: document.getElementById("saleType").value,
        discountType: document.getElementById("discountType").value,
        bookType: document.getElementById("bookType").value,
    };

    fetchBooks(filters);
    });

    // 🚀 Load all books on first load
    fetchBooks();
    });
 
    

    
            // <div class="col-lg-3 col-md-4 col-sm-6">
            // <div class="card h-100 shadow-sm border-0">
            //     <div class="ratio ratio-1x1">
            //     <img src="${img}" class="card-img-top rounded-top" alt="${book.title}">
            //     </div>
            //     <div class="card-body">
            //     <h6 class="fw-bold text-truncate">${book.title || "Untitled"} ${discountTag} ${saleType}</h6>
            //     <p class="text-muted small mb-1">${book.book_type?.toUpperCase() || "Unknown Type"}</p>
            //     <p class="mb-0">
            //         ${book.price ? `<span class="fw-bold text-primary">$${book.price}</span>` : ""}
            //         ${book.original_price && book.original_price > book.price
            //         ? `<small class="text-decoration-line-through text-muted ms-2">$${book.original_price}</small>`
            //         : ""}
            //     </p>
            //     <button><a href='aboutSaleBook.html?bookSid=${book.bookSid}'>View Book</a></button>
            //     </div>
            // </div>
            // </div>