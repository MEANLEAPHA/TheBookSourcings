const {searchBar} = require('../../controller/components/searchController')
const express = require('express');
const router = express.Router();

router.get("/search", searchBar);

module.exports = router;