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
      .join(", ");

    const book = {
      source: "Project Gutenberg",
      bookId: data.id || null,
      title: data.title || null,
      subtitle: null, // Gutenberg does not provide a subtitle
      authors: authors || "Unknown",
      description: data.summaries?.[0] || "No data",
      cover: data.formats?.["image/jpeg"] || "No data",
      categories: data.subjects || [],
      language: data.languages?.[0] || "No data",
      page: "No data", // Gutenberg doesn’t provide page count
      ISBN_10: "No data", // not available in Gutenberg
      ISBN_13: "No data", // not available in Gutenberg
      publishDate: data?.copyright || "No data",
      publisher: "No data",
      read: data.formats?.["text/html"] || "No data",
      download: data.formats?.["application/epub+zip"] || "No data",
    };

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
