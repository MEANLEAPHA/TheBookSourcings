const { fetchJson } = require("../../../util/apiClient");

async function getGutenbergBookById(req, res) {
  try {
    const { bookId } = req.params;
    const url = `https://gutendex.com/books/${bookId}`;
    const data = await fetchJson(url);

    if (!data || !data.id) {
      return res.status(404).json({ error: "No data about this Book" });
    }

    const book = {
      source: "Project Gutenberg",
      bookId: data.id || null,
      title: data.title || null,
      subtitle: null, // Gutenberg does not provide a subtitle
      authors: data.authors?.map(a => a.name) || [],
      description: data.summaries?.[0] || "No Date", // usually missing in Gutendex
      cover: data.formats?.["image/jpeg"] || "No Date",
      categories: data.subjects || [],
      language: data.languages?.[0] || "No Date",
      page: "No Date", // Gutenberg doesn’t provide page count
      ISBN_10: "No Date", // not available in Gutenberg
      ISBN_13: "No Date", // not available in Gutenberg
      publishDate: data?.copyright ? data?.copyright : "No Date", // Gutendex rarely has real date
      publisher: "No Date", // default since publisher info not in API
    };

    res.json(book);
  } catch (err) {
    console.error("aboutGutenbergController.js Error:", err.message);
    res.status(500).json({
      error: "Failed to fetch the Book From aboutGutenbergController.js",
      status: false,
    });
  }
}

module.exports = { getGutenbergBookById };
