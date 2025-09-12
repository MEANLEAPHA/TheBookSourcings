// apiClient.js
// Works in Node 18+ without node-fetch

async function fetchJson(url) {
  try {
    const res = await fetch(url, {
      headers: {
        "Accept": "application/sparql+json",
        // REQUIRED by Wikidata — identify your app and provide contact info
        "User-Agent": "TheBookSourcings/1.0 (https://thebooksourcings.onrender.com; contact@thebooksourcings.com)"
      }
    });
    if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
    return await res.json();
  } catch (err) {
    console.error("❌ Fetch error:", err.message);
    return null;
  }
}

module.exports = { fetchJson };
