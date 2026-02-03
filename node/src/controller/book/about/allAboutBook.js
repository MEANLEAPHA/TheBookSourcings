// const {getGoogleBookById} = require("./aboutGoogleController")
// const {getOpenLibraryBookById} = require("./aboutOpenLibraryController")
// const {getGutenbergBookById} = require("./aboutGutenbergController")
// const {getOtthorById} = require("./aboutOtthorController")
//  async function allAboutBook(req, res){
//   const { source, bookId } = req.params;
//   try {
//             const allowedSources = ["google", "openlibrary", "gutenberg", "otthor"];
//         if (!allowedSources.includes(source.toLowerCase())) {
//         return res.status(400).json({ error: "Unknown source" });
//         }
//     switch (source.toLowerCase()) {
//       case "otthor":
//         return await getOtthorById(req, res);
//       case "google":
//         return await getGoogleBookById(req, res);
//       case "openlibrary":
//         return await getOpenLibraryBookById(req, res);
//       case "gutenberg":
//         return await getGutenbergBookById(req, res);
//       default:
//         return res.status(400).json({ error: "Unknown source" });
//     }
//   } catch (err) {
//     res.status(500).json({ error: "Failed to fetch book" });
//   }
// };
// module.exports = {allAboutBook};

const {getOpenLibraryBookById} = require("./aboutOpenLibraryController")
const {getGutenbergBookById} = require("./aboutGutenbergController")
const {getOtthorById} = require("./aboutOtthorController")
const {getMangaDexBookById} = require("./aboutMangaDexController")
const {getInternetArchiveBookById} = require("./aboutInternetArchiveController")

async function allAboutBook(req, res){
  const { source, bookId } = req.params;
  try {
    const allowedSources = ["openlibrary", "gutenberg", "otthor", "mangadex", "internetarchive"];
    if (!allowedSources.includes(source.toLowerCase())) {
      return res.status(400).json({ error: "Unknown source" });
    }

    switch (source.toLowerCase()) {
      case "otthor":
        return await getOtthorById(req, res);
      case "openlibrary":
        return await getOpenLibraryBookById(req, res);
      case "gutenberg":
        return await getGutenbergBookById(req, res);
      case "mangadex":
        return await getMangaDexBookById(req, res);
      case "internetarchive":
        return await getInternetArchiveBookById(req, res);
      default:
        return res.status(400).json({ error: "Unknown source" });
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch book" });
  }
};

module.exports = {allAboutBook};

