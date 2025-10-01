const db = require("../../../../config/db");


// report post
const report =  async (req, res) =>{
    try{
   
         const memeberQid = req.user.memberQid;
         const {reasonTxt,reportTypeFrom_id} = req.body;
        
         const [result] = await db.query(
            "INSERT INTO community_post_report (memberQid, reason_text, reportTypeFrom_id) VALUES(?,?,?)",
            [memeberQid, reasonTxt, reportTypeFrom_id]
        )

        res.json(
            {
                message : 'ThankYou for your report, Our team will working on that.',
                status : true,
                reportId: result.insertId,
            }
        );
    }
    catch(err){
        console.error(err);
        res.status(500).json(
            {
                error: err.message,
                status: false
            }
        )
    }
}

const reportComment =  async (req, res) =>{
    try{
    
         const memeberQid = req.user.memberQid;
         const {reasonCommentTxt,comment_id} = req.body;
        
         const [result] = await db.query(
            "INSERT INTO community_post_comment_report (memberQid, reason_text, reportTypeFrom_id) VALUES(?,?,?)",
            [memeberQid, reasonCommentTxt, comment_id]
        )
        res.json(
            {
                message : 'ThankYou for your report, Our team will working on that.',
                status : true,
                reportId: result.insertId,
            }
        );
    }
    catch(err){
        console.error(err);
        res.status(500).json(
            {
                error: err.message,
                status: false
            }
        )
    }
}

module.exports = {
    report,
    reportComment

}