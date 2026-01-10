// utils/rankFeed.js
function rankFeed(feed, options = {}) {
  const {
    now = Date.now(),
    interestBoost = 1.5,
    trendingBoost = 1.2,
    freshnessHalfLifeHours = 72,
    randomness = 0.08
  } = options;

  return feed
    .map(item => {
      let score = 1;

      // 🔹 Interest
      if (item._interest) score *= interestBoost;

      // 🔹 Trending
      if (item._trending) score *= trendingBoost;

      // 🔹 Freshness decay
      if (item.publishedAt) {
        const ageHours =
          (now - new Date(item.publishedAt).getTime()) / 36e5;
        const freshness =
          Math.pow(0.5, ageHours / freshnessHalfLifeHours);
        score *= freshness;
      }

      // 🔹 Controlled randomness
      score *= 1 + (Math.random() * randomness);

      return { ...item, _rankScore: score };
    })
    .sort((a, b) => b._rankScore - a._rankScore);
}

module.exports = { rankFeed };
