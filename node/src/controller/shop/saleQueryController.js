const db = require("../../config/db");

const displayBooksForSale = async (req, res) => {
  try {
    // 🧩 Step 1: Read query params (filters)
    const {
      minPrice,
      maxPrice,
      saleType, // normal, discount, free
      bookType, // ebook, paper
      discountType,
      quality,
      sortBy,       // optional: e.g. 'price_asc', 'price_desc', 'newest'
      limit = 20,   // pagination (default 20 items)
      offset = 0
    } = req.query;

    let sql = `SELECT 
        bookSid, memberQid, vendor_email, title, description, 
        original_price, price, discount_type, discount_price, 
        sale_type, book_type, imgPreview, bookImg, qty, quality, contact, website, 
        created_at
      FROM bookForsale
      WHERE 1=1`;
    const params = [];

    if (minPrice) {
      sql += " AND price >= ?";
      params.push(Number(minPrice));
    }

    if (maxPrice) {
      sql += " AND price <= ?";
      params.push(Number(maxPrice));
    }

    if (saleType) {
      sql += " AND sale_type = ?";
      params.push(saleType);
    }

    if (bookType) {
      sql += " AND book_type = ?";
      params.push(bookType);
    }
    
    if (discountType) {
      sql += " AND discount_type = ?";
      params.push(discountType);
    }

    if (quality) {
      sql += " AND quality = ?";
      params.push(quality);
    }


    if (sortBy) {
      switch (sortBy) {
        case "price_asc":
          sql += " ORDER BY price ASC";
          break;
        case "price_desc":
          sql += " ORDER BY price DESC";
          break;
        case "newest":
          sql += " ORDER BY created_at DESC";
          break;
        case "oldest":
          sql += " ORDER BY created_at ASC";
          break;
        default:
          sql += " ORDER BY created_at DESC";
      }
    } else {
      sql += " ORDER BY created_at DESC";
    }

    // 📄 Step 5: Pagination
    sql += " LIMIT ? OFFSET ?";
    params.push(Number(limit), Number(offset));

    // 🚀 Step 6: Run query
    const [rows] = await db.query(sql, params);

    // 🧩 Step 7: Parse preview images
    const books = rows.map((book) => ({
      ...book,
      imgPreview: book.imgPreview ? JSON.parse(book.imgPreview) : []
    }));

    // ✅ Step 8: Send response
    res.json({
      message: "Books fetched successfully",
      Result: "True",
      count: books.length,
      books
    });

  } catch (error) {
    console.error("displayBooksForSale.js Error:", error);
    res.status(500).json({
      message: "Internal Server Error",
      error: error.message
    });
  }
};

const displayBooksBySidForSale = async (req,res) =>{
  try{
    const bookSid = req.params;

    const [rows] = await db.query(
      `SELECT * FROM bookForsale WHERE bookSid = ?`,
      [bookSid]
    )

    if(rows.length === 0){
      return  res.status(404).json(
        {
          message : 'Book not found or unauthorized'
        }
      )
    }
    res.json(rows[0]);
  }
  catch(error){
    console.error(error);
     res.status(500).json({
      message: "Internal Server Error",
      error: error.message
    });
  }
}


const getMySaleBook = async () => {
  try{
    const memberQid = req.user.memeberQid;

    const [rows] = await db.query(
      "SELECT * FORM bookForsale WHERE memberQid = ?",
      [memberQid]
    )

    if(rows.length === 0){
      return res.status(404).json(
        {
          message : 'no book found or unauthorized'
        }
      )
    }
    res.status(200).json(
      { message: "Books retrieved successfully.", books: rows }
    );
  }
  catch(error){
    console.error(error);
    res.status(500).json({
      message: "Internal Server Error",
      error: error.message
    });
  }
}

module.exports = { displayBooksForSale, displayBooksBySidForSale, getMySaleBook };
