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
    const authors = authorsArray
      .map(name => {
        if (name.includes(",")) {
          const [last, first] = name.split(",").map(s => s.trim());
          return first && last ? `${first} ${last}` : name;
        }
        return name;
      })
      .join(", ") || "Unknown";

    // Base book (from Gutenberg)
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

    
    // --- Try Google Books if still missing ---
    if (book.title) {
      const googleUrl = `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(
        book.title
      )}+inauthor:${encodeURIComponent(authors.split(",")[0])}`;

      const gData = await fetchJson(googleUrl);

      if (gData?.items?.length > 0) {
        const gBook = gData.items[0].volumeInfo;
        book = {
          ...book,
          subtitle: book.subtitle !== "No data" ? book.subtitle : gBook.subtitle || "No data",
          page: book.page !== "No data" ? book.page : gBook.pageCount || "No data",
          ISBN_10: book.ISBN_10 !== "No data" ? book.ISBN_10 : gBook.industryIdentifiers?.find(i => i.type === "ISBN_10")?.identifier || "No data",
          ISBN_13: book.ISBN_13 !== "No data" ? book.ISBN_13 : gBook.industryIdentifiers?.find(i => i.type === "ISBN_13")?.identifier || "No data",
          publishDate: book.publishDate !== "No data" ? book.publishDate : gBook.publishedDate || "No data",
          publisher: book.publisher !== "No data" ? book.publisher : gBook.publisher || "No data",
        };
      }
    }

    // --- Fetch Similar Books (from all 3 sources) ---
    let similarBooks = [];

    if (book.categories.length) {
      const category = encodeURIComponent(book.categories[0]);

      // OpenLibrary by subject
      const olSimilar = await fetchJson(`https://openlibrary.org/subjects/${category.toLowerCase()}.json?limit=5`);
      if (olSimilar?.works) {
        similarBooks.push(
          ...olSimilar.works.map(w => ({
            title: w.title,
            author: w.authors?.[0]?.name || "Unknown",
            source: "OpenLibrary",
          }))
        );
      }

      // Google Books by subject
      const gSimilar = await fetchJson(`https://www.googleapis.com/books/v1/volumes?q=subject:${category}&maxResults=5`);
      if (gSimilar?.items) {
        similarBooks.push(
          ...gSimilar.items.map(item => ({
            title: item.volumeInfo?.title || "No title",
            author: item.volumeInfo?.authors?.[0] || "Unknown",
            source: "Google Books",
          }))
        );
      }

      // Gutenberg by topic
      const gutSimilar = await fetchJson(`https://gutendex.com/books?topic=${category}&page=1`);
      if (gutSimilar?.results) {
        similarBooks.push(
          ...gutSimilar.results.slice(0, 5).map(b => ({
            title: b.title,
            author: b.authors?.[0]?.name || "Unknown",
            source: "Project Gutenberg",
          }))
        );
      }
    }

    res.json({ ...book, similarBooks });
  } catch (err) {
    console.error("aboutGutenbergController.js Error:", err.message);
    res.status(500).json({
      error: "Failed to fetch the book details",
      status: false,
    });
  }
}

module.exports = { getGutenbergBookById };
