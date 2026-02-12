// util/deduplicate.js
function deduplicateBooks(books) {
  const seen = new Set();
  const unique = [];
  
  for (const book of books) {
    if (!book?.title) continue;
    
    const titleKey = book.title.toLowerCase().trim();
    const authorKey = book.authors?.[0]?.toLowerCase().trim() || 'unknown';
    const sourceKey = book.source || 'unknown';
    const uniqueKey = `${titleKey}|${authorKey}|${sourceKey}`;
    
    if (!seen.has(uniqueKey)) {
      seen.add(uniqueKey);
      unique.push(book);
    }
  }
  
  return unique;
}

module.exports = { deduplicateBooks };