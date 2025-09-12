const  { fetchJson } = require('../../../util/apiClient');

async function getAuthorNameGUT(req,res){
    try{
        const bookId = req.params;
        const url = `https://gutendex.com/books/${bookId}`;
        const data = await fetchJson(url);

        if(!data || data.id){
            res.status(404).json(
                {
                    error : "No data found about this author",
                    status : 404
                }
            )
        }
        // Format authors as "First Last"
    const authorsArray = data.authors?.map(a => a.name) || [];
    const authorNames = authorsArray
      .map(name => {
        if (name.includes(",")) {
          const [last, first] = name.split(",").map(s => s.trim());
          return first && last ? `${first} ${last}` : name;
        }
        return name;
      })
      .join(", ") || "Unknown";

      let authorName = {
        bookId: data.id || bookId,
        authorNames,
      }
      res.json(
        {
            authorName
        }
      )

    }
    catch(err){
        console.error("getAuthorNameGUT", err.message);
        res.status(500).json({
            error: "Failed to fetch author name",
            status: 500
        })  
    }
}
module.exports = {
    getAuthorNameGUT
}