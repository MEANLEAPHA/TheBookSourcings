const { fetchJson } = require('../../../../util/apiClient');

async function searchByAniListGenre(query, limit = 20) {
  try {
    if (!query) return [];

    const graphqlQuery = {
      query: `
        query ($search: String, $perPage: Int) {
          Page(page: 1, perPage: $perPage) {
            media(genre: $search, type: MANGA, sort: POPULARITY_DESC) {
              id
              title {
                romaji
                english
                native
              }
              coverImage {
                large
                extraLarge
              }
              genres
              staff(perPage: 1) {
                edges {
                  node {
                    name {
                      full
                    }
                  }
                }
              }
            }
          }
        }
      `,
      variables: {
        search: query,
        perPage: limit
      }
    };

    const url = 'https://graphql.anilist.co';
    
    console.log(`🔍 AniList Genre Search: ${query}`);
    
    const data = await fetchJson(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(graphqlQuery)
    });
    
    if (!data.data?.Page?.media) return [];
    
    return data.data.Page.media.map((media) => ({
      bookId: media.id.toString(),
      title: media.title.english || media.title.romaji || media.title.native || 'Unknown Title',
      cover: media.coverImage.extraLarge || media.coverImage.large,
      authors: media.staff?.edges?.[0]?.node?.name?.full ? 
               [media.staff.edges[0].node.name.full] : ["Unknown"],
      source: "anilist",
      genre: media.genres?.[0] || query
    }));
  } catch (error) {
    console.error('AniList genre search error:', error.message);
    return [];
  }
}

async function searchByAniListAuthor(query, limit = 20) {
  try {
    if (!query) return [];

    const graphqlQuery = {
      query: `
        query ($search: String, $perPage: Int) {
          Page(page: 1, perPage: $perPage) {
            staff(search: $search) {
              id
              name {
                full
              }
            }
            media(staff: $search, type: MANGA, sort: POPULARITY_DESC) {
              id
              title {
                romaji
                english
                native
              }
              coverImage {
                large
                extraLarge
              }
              genres
              staff(perPage: 1) {
                edges {
                  node {
                    name {
                      full
                    }
                  }
                }
              }
            }
          }
        }
      `,
      variables: {
        search: query,
        perPage: limit
      }
    };

    const url = 'https://graphql.anilist.co';
    
    console.log(`🔍 AniList Author Search: ${query}`);
    
    const data = await fetchJson(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(graphqlQuery)
    });
    
    if (!data.data?.Page?.media) return [];
    
    const authorName = data.data.Page.staff?.[0]?.name?.full || query;
    
    return data.data.Page.media.map((media) => ({
      bookId: media.id.toString(),
      title: media.title.english || media.title.romaji || media.title.native || 'Unknown Title',
      cover: media.coverImage.extraLarge || media.coverImage.large,
      authors: [authorName],
      source: "anilist",
      genre: media.genres?.[0] || null
    }));
  } catch (error) {
    console.error('AniList author search error:', error.message);
    return [];
  }
}

module.exports = {
  searchByAniListGenre,
  searchByAniListAuthor
};