const { fetchJson } = require("../../../util/apiClient");

async function getGutenbergBookById(req, res) {
  try {
    const { bookId } = req.params;
    const url = `https://gutendex.com/books/${bookId}`;
    const data = await fetchJson(url);

    if (!data || !data.id) {
      return res.status(404).json({ error: "No data about this Book" });
    }

    // Format authors as "First Last"
    const authorsArray = data.authors?.map(a => a.name) || [];
    const authors = authorsArray.map(name => {
        if (name.includes(",")) {
          const [last, first] = name.split(",").map(s => s.trim());
          return first && last ? `${first} ${last}` : name;
        }
        return name;
      })
      .join(", ") || "Unknown";

    // Start with Gutenberg data
    let book = {
      source: "Project Gutenberg",
      bookId: data.id || null,
      title: data.title || null,
      subtitle: null, 
      authors,
      description: data.summaries?.[0] || "No data",
      cover: data.formats?.["image/jpeg"] || "No data",
      categories: data.subjects || [],
      language: data.languages?.[0] || "No data",
      page: "No data", 
      ISBN_10: "No data",
      ISBN_13: "No data",
      publishDate: data?.copyright || "No data",
      publisher: "No data",
      read: data.formats?.["text/html"] || "No data",
      download: data.formats?.["application/epub+zip"] || "No data",
    };

    // --- Try OpenLibrary if missing info ---
    if (book.title && authors !== "Unknown") {
      const openLibUrl = `https://openlibrary.org/search.json?title=${encodeURIComponent(
        book.title
      )}&author=${encodeURIComponent(authors.split(",")[0])}`;

      const olData = await fetchJson(openLibUrl);

      if (olData?.docs?.length > 0) {
        const olBook = olData.docs[0]; // pick first result

        // Fill missing fields only
        book = {
          ...book,
          subtitle: book.subtitle || olBook.subtitle || "No data",
          page: book.page !== "No data" ? book.page : olBook.number_of_pages_median || "No data",
          ISBN_10: book.ISBN_10 !== "No data" ? book.ISBN_10 : (olBook.isbn?.find(i => i.length === 10) || "No data"),
          ISBN_13: book.ISBN_13 !== "No data" ? book.ISBN_13 : (olBook.isbn?.find(i => i.length === 13) || "No data"),
          publishDate: book.publishDate !== "No data" ? book.publishDate : olBook.first_publish_year || "No data",
          publisher: book.publisher !== "No data" ? book.publisher : olBook.publisher?.[0] || "No data",
        };
      }
    }

    res.json(book);
  } catch (err) {
    console.error("aboutGutenbergController.js Error:", err.message);
    res.status(500).json({
      error: "Failed to fetch the book from Gutenberg",
      status: false,
    });
  }
}

module.exports = { getGutenbergBookById };
