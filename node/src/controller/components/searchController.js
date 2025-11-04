const db = require('../../config/db');


const searchBar = async (req,res) =>{
    try{
        const {q} = req.params;
        if(!q) return res.json([]);

        const [rows] = await db.query(
            "SELECT * from users WHERE username LIKE ? LIMIT 8",
            [`%${q}%`]
        );
        // if(rows.length===0) return res.status(404).json({message: "No data related found!"});
        return res.json(rows || []);
    }
    catch(err){
        console.error(err);
        res.status(505).json(
            {
                error: err.message
            }
        )
    };
}

module.exports = {searchBar};

