const {fetchJson} = require('../../../util/apiClient');

async function getAuthorNameOpenLibrary(req,res){
    try{
        const bookId = req.params;
        const url = `https://openlibrary.org/works/${bookId}.json`;
        const workData = await fetchJson(url);

        if(!data || !data.results){
            res.status(404).json(
                {
                    error : "No data found about this author",
                    status : 404
                }
            )
        }
        const authorNames = await Promise.all(
            (workData.authors || []).map(async (a) => {
                const authorData = await fetchJson(`https://openlibrary.org${a.author.key}.json`);
                return authorData.name || "Unknown";
            })
        );

        let authorName = {
            bookId: workData.key || bookId,
            authorNames
        }

        res.json(
            {
                authorName
            }
        )
    }
    catch(err){
        console.error("getAuthorNameOpenLibrary", err.message);
        jes.status(505).json({
            error : "Failed to fetch the author data",
            status : 505
        })

    }

}
module.exports = {
    getAuthorNameOpenLibrary
}