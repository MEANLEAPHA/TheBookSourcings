const db = require("../../../config/db");
const dayjs = require("dayjs");
const relativeTime = require("dayjs/plugin/relativeTime");

dayjs.extend(relativeTime);

async function getOtthorTrending (){
    const [books] = await db.query(
        `
        SELECT 
            b.bookQid,
            b.title,
            b.author,
            b.bookCover,
            b.UploadAt,
            b.ViewCount,
            u.username,
            u.pfUrl
            FROM b.uploadBook
            JOIN ON b.memberQid = u.memberQid
            ORDER BY b.UploadAt DESC
        `

    )
    if(books.length === 0 || !books){
        return []
    }

    return books.map(book => ({
        bookId: book.bookQid,
        title: book.title,
        author: book.author,
        cover: book.bookCover,
        upload_at: dayjs(book.UploadAt).fromNow(),
        view_count: book.ViewCount,
        source: book.username,
        channel_url: book.pfUrl
    }))

}

module.exports = { getOtthorTrending };