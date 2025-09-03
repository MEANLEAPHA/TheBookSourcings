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
      description: data.summaries?.[0] || null,
      cover: data.formats?.["image/jpeg"] || null,
      categories: data.subjects?data.subjects.map(cat => cat.replace("--", ", ").replace(" -- ", ", ").replace(" --", ", ").replace("-- ", ", ")) : [],
      language: data.languages?.[0] || null,
      page: null,
      ISBN_10: null,
      ISBN_13: null,
      publishDate: data?.copyright || null,
      publisher: null,
      read: data.formats?.["text/html"] || null,
      download: data.formats?.["application/epub+zip"] || null,
    };

    



    res.json({ book});
  } catch (err) {
    console.error("aboutGutenbergController.js Error:", err.message);
    res.status(500).json({
      error: "Failed to fetch the book details",
      status: false,
    });
  }
}

module.exports = { getGutenbergBookById };
