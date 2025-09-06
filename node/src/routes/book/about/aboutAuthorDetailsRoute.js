const express = require("express");
const router = express.Router();
const { getAuthorFullProfile } = require("../../../controller/book/about/aboutAuthorDetailsController");

// GET full author detail by Wikidata QID
router.get("/:wikiId", getAuthorFullProfile);

module.exports = router;
