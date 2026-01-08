const express =  require('express');
const router = express.Router();

const {authMiddleware} = require('../../../../middleware/authMiddleware');
const {getNavData, getNav} = require('../../../../controller/book/trending/feeds/navController')

router.get('/dynamic/nav', authMiddleware, getNavData);
router.get('/static/nav', getNav);



module.exports = router;