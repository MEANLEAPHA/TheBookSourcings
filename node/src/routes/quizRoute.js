const {
 createEmployee,
 updateEmployee,
 deleteEmployee,
 getEmployeeDataByide
} = require('../controller/quizController');
const {authMiddleware} = require('../middleware/authMiddleware');
const { upload } = require('../middleware/AWSuploadMiddleware'); 
const express = require("express");
const router = express.Router();

router.post('/createEmployee',
            authMiddleware,
            upload.fields([
                { name: "pfUrl", maxCount: 1 },
                { name: "bannerUrl", maxCount: 1 }
            ]),
            createEmployee);
router.put('/updateEmployee/:ide',
            authMiddleware,
            upload.fields([
                { name: "pfUrl", maxCount: 1 },
                { name: "bannerUrl", maxCount: 1 }
            ]),
            updateEmployee);
router.get('/deleteEmployee/:ide', authMiddleware, deleteEmployee);         
router.get('/getEmployeeDataByide/:ide', authMiddleware, getEmployeeDataByide);


module.exports = router;