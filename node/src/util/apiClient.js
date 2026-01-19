async function fetchJson(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`API error: ${res.status} ${res.statusText}`);
    }
    return await res.json();
  } catch (err) {
    console.error("❌ Fetch error:", err.message);
    throw err; // Re-throw the error
  }
}

module.exports = {
  fetchJson
};
// async function fetchJson(url) {
//   try {
//     const res = await fetch(url); // Node's native fetch
//     if (!res.ok) throw new Error(`API error: ${res.status}`);
//     return await res.json();
//   } catch (err) {
//     console.error("❌ Fetch error:", err.message);
//     return null;
//   }
// }

// module.exports = {
//   fetchJson
// };
