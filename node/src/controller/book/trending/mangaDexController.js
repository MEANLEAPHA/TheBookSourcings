// const { fetchJson } = require('../../../util/apiClient');
// async function getMangaDexTrending() {
//   const url = "https://api.mangadex.org/manga?limit=20&order[followedCount]=desc&contentRating[]=safe&includes[]=cover_art&includes[]=author";
//   const data = await fetchJson(url);
  
//   if (!data?.data) return [];
  
//   return data.data.map(manga => {
//     let cover = null;
//     if (manga.relationships) {
//       const coverRel = manga.relationships.find(r => r.type === 'cover_art');
//       if (coverRel?.attributes?.fileName) {
//         cover = `https://uploads.mangadex.org/covers/${manga.id}/${coverRel.attributes.fileName}`;
//       }
//     }
  
//     let authors = ["Unknown"];
//     if (manga.relationships) {
//       const authorRels = manga.relationships.filter(r => r.type === 'author');
//       authors = authorRels.map(r => r.attributes?.name).filter(name => name);
//     }
    
//     const title = manga.attributes?.title?.en || 
//                  manga.attributes?.title?.['ja-ro'] || 
//                  Object.values(manga.attributes?.title || {})[0] || 
//                  'Unknown Title';
    
//     return {
//       source: "mangadex",
//       bookId: manga.id,
//       title: title,
//       authors: authors,
//       cover: cover
//     };
//   });
// }

// module.exports = {getMangaDexTrending};
const { fetchJson } = require('../../../util/apiClient');
async function getMangaDexTrending() {
  const url = "https://api.mangadex.org/manga?limit=20&order[followedCount]=desc&contentRating[]=safe&includes[]=cover_art&includes[]=author";
  const data = await fetchJson(url);
  
  if (!data?.data) return [];
  
  return data.data.map(manga => {
    let coverUrl = null;
    if (manga.relationships) {
      const coverRel = manga.relationships.find(r => r.type === 'cover_art');
      if (coverRel?.attributes?.fileName) {
        coverUrl = `https://uploads.mangadex.org/covers/${manga.id}/${coverRel.attributes.fileName}`;
      }
    }
    
    // ADD THIS LINE - Use the same proxy as filter
    const cover = getCoverUrl(coverUrl, manga.id);
    
    let authors = ["Unknown"];
    if (manga.relationships) {
      const authorRels = manga.relationships.filter(r => r.type === 'author');
      authors = authorRels.map(r => r.attributes?.name).filter(name => name);
    }
    
    const title = manga.attributes?.title?.en || 
                 manga.attributes?.title?.['ja-ro'] || 
                 Object.values(manga.attributes?.title || {})[0] || 
                 'Unknown Title';
    
    return {
      source: "mangadex",
      bookId: manga.id,
      title: title,
      authors: authors,
      cover: cover // Use the proxied URL
    };
  });
}
module.exports = {getMangaDexTrending};