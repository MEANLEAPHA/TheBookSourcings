const { uploadBook } = require("../../../controller/book/uploadBook/uploadBookController");
const { deleteBook } = require("../../../controller/book/uploadBook/deleteBookControoler");
const { updateBook } = require("../../../controller/book/uploadBook/updateBookController");

const {authMiddleware} = require('../../../middleware/authMiddleware');
const uploadAWS = require('../../../middleware/AWSuploadMiddleware');

const upload = (app) => {
    app.post(
    '/uploadBook',authMiddleware,uploadAWS.fields(
    [
        { name: 'bookCover', maxCount: 1 },
        { name: 'bookFile', maxCount: 1 }
    ]
  ),
    uploadBook
);
    app.delete("/deleteBook/:bookQid", authMiddleware ,deleteBook);
    app.put("/updateBook/:bookQid", authMiddleware ,updateBook);
};









module.exports = { upload };
