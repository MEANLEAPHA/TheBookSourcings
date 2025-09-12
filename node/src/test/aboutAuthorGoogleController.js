const { fetchJson } = require('../../../util/apiClient');
const API_KEY = process.env.GOOGLE_BOOKS_API_KEY || "AIzaSyA4pGs-ia5mfEL6EoJEWPIL-o6KComj0xY";
async function getAuthorNameGoogleBook(req,res){
    try{
        const bookId = req.params;
        const url = `https://www.googleapis.com/books/v1/volumes/${bookId}?key=${API_KEY}`;
        const data = await fetchJson(url);

        if(!data || !data.volumeInfo){
            res.status(404).json(
                {
                    error : "No data found about this author",
                    status : 404
                }
            )
        }
        let authorName = {
            bookId: data.id || bookId,
            authorNames: data.volumeInfo.authors || []
        }

        res.json(
            {
                authorName
            }
        )

    }
    catch(err){
        console.error("getAuthorNameGoogleBook", err.message);
        res.status(505).json(
            {
                error : "Failed to fetch author data",
                status : 505
            }
        )
    }
}
module.exports = {
    getAuthorNameGoogleBook
}