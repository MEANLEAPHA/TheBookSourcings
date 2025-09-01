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
            bookId: w.key.replace("/works/", ""),
            cover: w.covers?.[0] ? `https://covers.openlibrary.org/b/id/${w.covers[0]}-L.jpg` : null,
            author: w.authors?.[0]?.name || "Unknown",
            source: "Open Library",
          }))
        );
      }

      // Google Books by subject
      const gSimilar = await fetchJson(`https://www.googleapis.com/books/v1/volumes?q=subject:${category}&maxResults=5`);
      if (gSimilar?.items) {
        similarBooks.push(
          ...gSimilar.items.map(item => ({
            title: item.volumeInfo?.title || "No title",
            bookId: item.id,
            cover: item.volumeInfo?.imageLinks?.thumbnail || null,
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
            bookId: b.id,
            cover: b.formats?.["image/jpeg"] || null,
            author: b.authors?.[0]?.name || "Unknown",
            source: "Project Gutenberg",
          }))
        );
      }
    }
