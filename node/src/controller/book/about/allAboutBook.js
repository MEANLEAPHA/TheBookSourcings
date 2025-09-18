
const {getGoogleBookById} = require("./aboutGoogleController")
const {getOpenLibraryBookById} = require("./aboutOpenLibraryController")
const {getGutenbergBookById} = require("./aboutGutenbergController")
const {getTheBookSourcingById} = require("./aboutThebooksourcingController")



 async function allAboutBook(req, res){
  const { source, bookId } = req.params;
  try {
            const allowedSources = ["google", "openlibrary", "gutenberg", "thebooksourcing"];
        if (!allowedSources.includes(source.toLowerCase())) {
        return res.status(400).json({ error: "Unknown source" });
        }

    switch (source.toLowerCase()) {
      case "thebooksourcing":
        return await getTheBookSourcingById(req, res);
      case "google":
        return await getGoogleBookById(req, res);
      case "openlibrary":
        return await getOpenLibraryBookById(req, res);
      case "gutenberg":
        return await getGutenbergBookById(req, res);
      default:
        return res.status(400).json({ error: "Unknown source" });
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch book" });
  }
};


module.exports = {allAboutBook};

