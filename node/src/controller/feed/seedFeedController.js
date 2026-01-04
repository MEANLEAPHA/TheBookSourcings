async function buildSeededFeed(seed) {
  const limit = 50;

  let cached = feedCache.get(seed);

  if (!cached || Date.now() > cached.expiry) {
    const [google, gutenberg, openLibrary, otthor] =
      await Promise.all([
        getGoogleTrending().catch(() => []),
        getGutenbergTrending().catch(() => []),
        getOpenLibraryTrending().catch(() => []),
        getOtthorTrending().catch(() => [])
      ]);

    const mixed = mixBooksSeeded(
      [...google, ...gutenberg, ...openLibrary, ...otthor],
      seed
    );

    cached = {
      data: mixed,
      expiry: Date.now() + 1000 * 60 * 5
    };

    feedCache.set(seed, cached);
  }

  return cached.data;
}
