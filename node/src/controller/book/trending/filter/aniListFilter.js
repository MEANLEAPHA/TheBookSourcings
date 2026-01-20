const { fetchJson } = require('../../../../util/apiClient');

async function searchByAniListGenre(query, limit = 20) {
  try {
    if (!query) return [];

    const graphqlQuery = JSON.stringify({
      query: `
        query ($genre: String, $page: Int, $perPage: Int) {
          Page(page: $page, perPage: $perPage) {
            pageInfo {
              total
              perPage
              currentPage
              lastPage
              hasNextPage
            }
            media(type: MANGA, genre: $genre, sort: POPULARITY_DESC) {
              id
              title {
                romaji
                english
                native
                userPreferred
              }
              coverImage {
                extraLarge
                large
                medium
                color
              }
              genres
              tags {
                name
              }
              staff(perPage: 1, sort: RELEVANCE) {
                edges {
                  node {
                    name {
                      full
                    }
                  }
                  role
                }
              }
            }
          }
        }
      `,
      variables: {
        genre: query,
        page: 1,
        perPage: limit
      }
    });

    const url = 'https://graphql.anilist.co';
    
    console.log(`🔍 AniList Genre Search: ${query}`);
    
    const data = await fetchJson(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: graphqlQuery
    });
    
    if (!data.data?.Page?.media) {
      console.error('AniList API returned unexpected format:', data);
      return [];
    }
    
    return data.data.Page.media.map((media) => {
      const title = media.title.english || 
                   media.title.romaji || 
                   media.title.userPreferred || 
                   media.title.native || 
                   'Unknown Title';
      
      const author = media.staff?.edges?.[0]?.node?.name?.full || 
                    media.staff?.edges?.[0]?.role || 
                    "Unknown Author";
      
      return {
        bookId: media.id.toString(),
        title: title,
        cover: media.coverImage.extraLarge || media.coverImage.large || media.coverImage.medium,
        authors: [author],
        source: "anilist",
        genre: media.genres?.[0] || query
      };
    });
  } catch (error) {
    console.error('AniList genre search error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return [];
  }
}

async function searchByAniListAuthor(query, limit = 20) {
  try {
    if (!query) return [];

    // First, search for staff (authors/artists)
    const searchQuery = JSON.stringify({
      query: `
        query ($search: String, $page: Int, $perPage: Int) {
          Page(page: $page, perPage: $perPage) {
            staff(search: $search) {
              id
              name {
                full
                native
              }
            }
          }
        }
      `,
      variables: {
        search: query,
        page: 1,
        perPage: 5
      }
    });

    const searchUrl = 'https://graphql.anilist.co';
    
    const staffData = await fetchJson(searchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: searchQuery
    });
    
    if (!staffData.data?.Page?.staff || staffData.data.Page.staff.length === 0) {
      return [];
    }
    
    const staffId = staffData.data.Page.staff[0].id;
    const authorName = staffData.data.Page.staff[0].name.full || query;
    
    // Now search for media by this staff member
    const mediaQuery = JSON.stringify({
      query: `
        query ($staffId: Int, $page: Int, $perPage: Int) {
          Page(page: $page, perPage: $perPage) {
            media(staff: $staffId, type: MANGA, sort: POPULARITY_DESC) {
              id
              title {
                romaji
                english
                native
                userPreferred
              }
              coverImage {
                extraLarge
                large
                medium
                color
              }
              genres
            }
          }
        }
      `,
      variables: {
        staffId: staffId,
        page: 1,
        perPage: limit
      }
    });
    
    console.log(`🔍 AniList Author Search: ${authorName} (ID: ${staffId})`);
    
    const mediaData = await fetchJson(searchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: mediaQuery
    });
    
    if (!mediaData.data?.Page?.media) {
      console.error('AniList API returned unexpected format:', mediaData);
      return [];
    }
    
    return mediaData.data.Page.media.map((media) => {
      const title = media.title.english || 
                   media.title.romaji || 
                   media.title.userPreferred || 
                   media.title.native || 
                   'Unknown Title';
      
      return {
        bookId: media.id.toString(),
        title: title,
        cover: media.coverImage.extraLarge || media.coverImage.large || media.coverImage.medium,
        authors: [authorName],
        source: "anilist",
        genre: media.genres?.[0] || null
      };
    });
  } catch (error) {
    console.error('AniList author search error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return [];
  }
}

module.exports = {
  searchByAniListGenre,
  searchByAniListAuthor
};