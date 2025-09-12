// authorRoutes.js
const express = require("express");
const { findAuthorsWithProfession } = require("../../../controller/book/about/similarAuthorController");

const router = express.Router();

// Example: GET /authors/similar/Q937/businessman
router.get("/:professionQid", findAuthorsWithProfession);

module.exports = router;
