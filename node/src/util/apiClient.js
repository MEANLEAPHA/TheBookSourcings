// apiClient.js
// No need to import node-fetch in Node 18+ because fetch is built-in

// Define the async utility function
async function fetchJson(url) {
  try {
    const res = await fetch(url); // Node's native fetch
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("❌ Fetch error:", err.message);
    return null;
  }
}

// Export the function using CommonJS
module.exports = {
  fetchJson
};
