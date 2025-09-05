const { fetchJson } = require("../../../util/apiClient");

// Fetch author info from OpenLibrary + Wikidata
async function getAuthorInfo(req, res) {
  try {
    const authorNamesParam = req.params.authorNames;
    if (!authorNamesParam) return res.status(400).json({ error: 'Author names required' });

    const authorNames = authorNamesParam.split(',');

    const results = await Promise.all(authorNames.map(async (name) => {
      // 1️⃣ OpenLibrary search
      const olUrl = `https://openlibrary.org/search/authors.json?q=${encodeURIComponent(name)}`;
      const olData = await fetchJson(olUrl);

      if (!olData.docs || olData.docs.length === 0) {
        return { name, description: 'No author found', profession: '', photo: '', wikidataId: '' };
      }

      const author = olData.docs[0];
      const wikidataId = author.wikidata;

      // 2️⃣ Wikidata fetch
      let description = 'No description available';
      let profession = '';
      let photo = '';

      if (wikidataId) {
        try {
          const wdUrl = `https://www.wikidata.org/wiki/Special:EntityData/${wikidataId}.json`;
          const wdData = await fetchJson(wdUrl);
          const entity = wdData.entities[wikidataId];

          description = entity.descriptions?.en?.value || entity.labels?.en?.value || description;
          profession = entity.claims?.P106?.[0]?.mainsnak?.datavalue?.value?.id || ''; // P106 = occupation
          photo = entity.claims?.P18?.[0]?.mainsnak?.datavalue?.value || ''; // P18 = image
        } catch (err) {
          console.error('Wikidata fetch error for', name, err.message);
        }
      }

      return { name, description, profession, photo, wikidataId: wikidataId || '' };
    }));

    res.json({ authors: results });
  } catch (err) {
    console.error('getAuthorInfo error:', err.message);
    res.status(500).json({ error: 'Failed to fetch author info' });
  }
}

module.exports = { getAuthorInfo };
