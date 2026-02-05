const { fetchJson } = require('../../../util/apiClient');
async function getInternetArchiveTrending() {
  const url = "https://archive.org/advancedsearch.php?q=mediatype:texts&output=json&rows=20&sort[]=week+desc&fl[]=identifier,title,creator,avg_rating,week";
  const data = await fetchJson(url);
  
  if (!data?.response?.docs) return [];
  
  return data.response.docs.map(doc => ({
    source: "internetarchive",
    bookId: doc.identifier,
    title: doc.title || "Unknown Title",
    authors: doc.creator ? (Array.isArray(doc.creator) ? doc.creator : [doc.creator]) : ["Unknown"],
    cover: `https://archive.org/services/img/${doc.identifier}`,
    viewsThisWeek: doc.week || 0
  }));
}

module.exports = {getInternetArchiveTrending};
