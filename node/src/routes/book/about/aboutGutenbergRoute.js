const expreess = require("express");
const router = expreess.Router();

const {getBookById} = require('../../../controller/book/about/aboutGutenbergController');

router.get("/:bookId", getBookById);

module.exports = router;