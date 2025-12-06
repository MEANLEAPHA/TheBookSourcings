// function parseJwt (token) {
//   try {
//     return JSON.parse(atob(token.split('.')[1]));
//   } catch (e) {
//     return null;
//   }
// }

// const token = localStorage.getItem("token");
// let userMemberQid = null;
// let username = null;

// if (token) {
//   const decoded = parseJwt(token);
//   userMemberQid = decoded?.memberQid || null;
//   username = decoded?.username || null;
// }


// redirect the source
function detectSource(bookId) {
    if (/^TB\d+S$/.test(bookId)) return "otthor";
    if (/^OL\d+(W|M|A)$/.test(bookId)) return "openlibrary";
    if (/^\d+$/.test(bookId)) return "gutenberg";
    return "google"; // fallback for Google Books
}

// params Url
const urlParams = new URLSearchParams(window.location.search);
const bookId = urlParams.get("bookId");
const source = detectSource(bookId);


//declare all the div to append
const bookInfoBody = document.getElementById('book-info-tb');
const followHolder = document.getElementById('follow-holder'); //follow-btn
const otherBookByAuthorList = document.querySelector(".otherBookByAuthor");
const similarLists = document.querySelector(".similarBookDiv");
const authorCardBody = document.querySelector('.author-append');


//  Description + Read more / Read less
  const descriptionEl = document.getElementById('description');
  const seemore = document.getElementById('seemore');
  const seeless = document.getElementById('seeless');


// create btn
const followBtn = document.createElement('button');
const followingBtn = document.createElement('button');

async function loadBookInfo() {
  const res = await fetch(`https://thebooksourcings.onrender.com/api/loadBooksInfo/${source}/${bookId}`);
  if (!res.ok) throw new Error("Failed to fetch Load Book Info");

  const data = await res.json();
  const book = data.book || data;

  // Define all fields here for clean control
  const fields = [
    { key: "title",        label: "Title",          id: "titleBook" },
    { key: "subtitle",     label: "Sub-title",      id: "subTitle" },
    { key: "authors",      label: "Author",         id: "authorSurname" },
    { key: "categories",   label: "Category",       id: "Category" },
    { key: "genre",        label: "Genre",          id: "genre" },
    { key: "language",     label: "Language",       id: "language" },
    { key: "page",         label: "Page",           id: "pageCount" },
    { key: "ISBN_10",      label: "ISBN-10",        id: "ISBN10" },
    { key: "ISBN_13",      label: "ISBN-13",        id: "ISBN13" },
    { key: "publishDate",  label: "Published Date", id: "publishData" },
    { key: "publisher",    label: "Publisher",      id: "publisher" }
  ];

  fields.forEach(field => {
    if (!book[field.key]) return; // Skip if value not found

    const tr = document.createElement("tr");
    tr.className = "tr";

    const th = document.createElement("td");
    th.textContent = field.label;

    const td = document.createElement("td");
    td.id = field.id;
    td.textContent = book[field.key];

    tr.appendChild(th);
    tr.appendChild(td);

    bookInfoBody.appendChild(tr);
  });

    document.querySelector(".BookUrl").src = book.cover;
    document.querySelector(".title").textContent = book.title;

    // Description
    const fullText = book.description || "No description available.";
    if (fullText.length > 1000) {
        const shortText = fullText.slice(0, 1000) + "......";
        descriptionEl.innerText = shortText;
        seemore.style.display = "block";
        seeless.style.display = "none";

        seemore.onclick = () => {
        descriptionEl.innerText = fullText;
        seemore.style.display = "none";
        seeless.style.display = "block";
        };
        seeless.onclick = () => {
        descriptionEl.innerText = shortText;
        seemore.style.display = "block";
        seeless.style.display = "none";
        };
    } else {
        descriptionEl.innerText = fullText;
        seemore.style.display = "none";
        seeless.style.display = "none";
    };


    // other book by author
    const firstAuthor = Array.isArray(book.authors)
    ? (book.authors[0] || "") 
    : (book.authors || "");
    const authorNameToUse = (firstAuthor && String(firstAuthor).trim()) ? firstAuthor : "William Shakespeare";
    
    loadOtherBookByAuthor(authorNameToUse);

    // similar book

    const firstCategory = Array.isArray(book.categories)
    ? (book.categories[0] || "")
    : (book.categories || "");
    const categoryToUse = (firstCategory && String(firstCategory).trim()) ? firstCategory : "fiction";

    // call the loader with that category
    loadSimilarBooks(categoryToUse);


    // follow logic
    if(userMemberQid === book.channel){
        followHolder.style.display = 'none';
    }
    else{
        loadChannelInfo(data.channel);
                followBtn.id = "btn-follow";
                followBtn.innerHTML = `
                <span class="spinner-border spinner-border-sm me-1" role="status" style="display:none;color:#fd7648"></span>
                <span class="btn-text">Follow</span>
                `;
                followBtn.addEventListener("click", () => {
                    toggleFollowActivity(data.memberQid)
                })
                followHolder.appendChild(followBtn);
    }


  const authorNames = Array.isArray(book.authors) ? book.authors : [book.authors || 'William Shakespeare'];
  const authorQids = Array.isArray(book.authorIds) ? book.authorIds : [book.authorIds];

  if(authorQids){
    loadAuthorInfoByQids(authorQids); // for otthor user
  }
  else{
    loadAuthorInfo(authorNames); // for googlebook, gutenberg and openlibrary
  }


}

// ===========================
// Load Channel Info
// ===========================
async function loadChannelInfo(followedQid) {
  try {
    const res = await fetch(`https://thebooksourcings.onrender.com/api/followStatus/${followedQid}`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Failed to fetch follow status");

    const data = await res.json();

    // Cleanup
    if (followHolder.contains(followingBtn)) followHolder.removeChild(followingBtn);
    const oldFriendBtn = document.getElementById("btn-friend");
    if (oldFriendBtn) followHolder.removeChild(oldFriendBtn);

    // FRIEND CASE
    if (data.userStatus.is_mutual === 1) {
      followBtn.style.display = "none";

      const btnFriend = document.createElement("button");
      btnFriend.id = "btn-friend";
      btnFriend.className = "btn btn-success";
      btnFriend.textContent = "Friends";

      followHolder.insertBefore(btnFriend, followBtn);
    }

    // FOLLOWING CASE
    else if (data.userStatus.followed === 1) {
      followBtn.style.display = "inline-block";

      followBtn.innerHTML = `
        <span class="spinner-border spinner-border-sm me-1" role="status" style="display:none;#fd7648"></span>
        <span class="btn-text">Unfollow</span>
      `;

      followingBtn.id = "btn-following";
      followingBtn.textContent = "Following";

      followHolder.insertBefore(followingBtn, followBtn);
    }

    // NOT FOLLOWING
    else {
      followBtn.style.display = "inline-block";

      followBtn.innerHTML = `
        <span class="spinner-border spinner-border-sm me-1" role="status" style="display:none;#fd7648"></span>
        <span class="btn-text">Follow</span>
      `;
    }

  } catch (err) {
    console.error(err);
  }
}



// ===========================
// Toggle Follow Activity
// ===========================
async function toggleFollowActivity(followedQid) {
  try {
    // ENABLE SPINNER
    const spinner = followBtn.querySelector(".spinner-border");
    const textHolder = followBtn.querySelector(".btn-text");
    spinner.style.display = "inline-block";
    textHolder.style.opacity = "0.4";

    const res = await fetch(`https://thebooksourcings.onrender.com/api/channel/follow/${followedQid}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });
    if (!res.ok) throw new Error(`Failed to toggle follow`);

    const data = await res.json();

    // Remove old state
    if (followHolder.contains(followingBtn)) followHolder.removeChild(followingBtn);
    const oldFriendBtn = document.getElementById("btn-friend");
    if (oldFriendBtn) followHolder.removeChild(oldFriendBtn);

    // FRIEND CASE
    if (data.userStatus?.is_mutual === 1 || data.is_mutual === 1) {
      followBtn.style.display = "none";

      const btnFriend = document.createElement("button");
      btnFriend.id = "btn-friend";
      btnFriend.className = "btn btn-success";
      btnFriend.textContent = "Friends";

      followHolder.insertBefore(btnFriend, followBtn);
    }

    // FOLLOWING CASE
    else if (data.userStatus?.followed === 1 || data.followed === 1) {
      followBtn.innerHTML = `
        <span class="spinner-border spinner-border-sm me-1" role="status" style="display:none;#fd7648"></span>
        <span class="btn-text">Unfollow</span>
      `;
      followBtn.style.display = "inline-block";

      followingBtn.id = "btn-following";
      followingBtn.textContent = "Following";
      followHolder.insertBefore(followingBtn, followBtn);
    }

    // NOT FOLLOWING
    else {
      followBtn.innerHTML = `
        <span class="spinner-border spinner-border-sm me-1" role="status" style="display:none;#fd7648"></span>
        <span class="btn-text">Follow</span>
      `;
      followBtn.style.display = "inline-block";
    }

    // REFRESH SERVER STATE
    await loadChannelInfo(followedQid);

  } catch (err) {
    console.error(err);
  } finally {
    // DISABLE SPINNER ALWAYS
    const spinner = followBtn.querySelector(".spinner-border");
    const textHolder = followBtn.querySelector(".btn-text");
    spinner.style.display = "none";
    textHolder.style.opacity = "1";
  }
}


// --- Skeleton Loader (3 placeholders) for otherBookByAuthor---
function showSkeletonOBBA(count = 3){
    otherBookByAuthorList.innerHTML = "";
    for(let j=0 ; j<count ; j++){
      otherBookByAuthorList.innerHTML +=`
        <div class="skeleton-books">
          <div class="skeleton skeleton-bookImg"></div>
          <div class="skeleton-info">
            <div class="skeleton skeleton-title"></div>
            <div class="skeleton skeleton-author"></div>
          </div>
      </div>
      `;
    }
}



// --- Cache helper OBBA---
function getCachedSimilarOBBA(authors) {
  const cached = localStorage.getItem(`name_${authors}`);
  if (!cached) return null;

  const { data, expiry } = JSON.parse(cached);
  if (Date.now() > expiry) {
    localStorage.removeItem(`name_${authors}`);
    return null;
  }
  return data;
}



// set CachedSimilarOBBA 
function setCachedSimilarOBBA(authors, data) {
  localStorage.setItem(
    `name_${authors}`,
    JSON.stringify({
      data,
      expiry: Date.now() + 1000 * 60 * 30 // cache 30 mins
    })
  );
}
// --- Fetch & Render --- obba
async function loadOtherBookByAuthor(authorName){
   const cached = getCachedSimilarOBBA(authorName);
   if(cached){
      renderSimilarOBBA(cached);
      return;
   }
   // show skeleton
   showSkeletonOBBA();
   try{
      const res = await fetch(`https://thebooksourcings.onrender.com/api/bookByAuthor/${encodeURIComponent(authorName)}`);
      if (!res.ok) throw new Error("Network response not ok");

      const { results } = await res.json();
      setCachedSimilarOBBA(authorName, results);

      renderSimilarOBBA(results);
   }
   catch(err){
      console.error(err);
      // only show message if results are truly empty or error
      otherBookByAuthorList.innerHTML = "<p>Failed to load book. Please try again.</p>";
   }
}
// renderSimilarOBBA
function renderSimilarOBBA(author){
  otherBookByAuthorList.innerHTML = "";

  if(author.length > 0){
    author.forEach(book => {
      otherBookByAuthorList.innerHTML += `
        <div class="books">
          <a href='aboutBook.html?bookId=${book.bookId}'>
              <img src="${book.cover || 'assets/img/noCoverFound.png'}" 
                   alt="${book.title}" 
                   class="bookImg lazyload" 
                   loading="lazy" 
                   onerror="this.src='assets/img/noCoverFound.png'">
              <div class="bookInfo">
                  <a id="OtherbookTitle">${book.title}</a>
                  <a id="OtherbookSubTitle">${book.author}</a>
              </div>
          </a>
        </div>
      `;
    });

    // ✅ Show more / Show less logic
    const showLessBook = document.getElementById("showLessBook");
    const showAllBook = document.getElementById("showAllBook");
    const books = document.querySelectorAll('.books');

    if(books.length > 3){
      for(let i = 3; i < books.length; i++){
        books[i].style.display = 'none';
      }

      showLessBook.style.display = 'none';
      showAllBook.style.display = 'flex';

      showAllBook.onclick = () => {
        books.forEach(book => book.style.display = 'flex');
        showAllBook.style.display = 'none';
        showLessBook.style.display = 'flex';
      };

      showLessBook.onclick = () => {
        for(let i = 3; i < books.length; i++){
          books[i].style.display = 'none';
        }
        showAllBook.style.display = 'flex';
        showLessBook.style.display = 'none';
      };
    } else {
      showLessBook.style.display = 'none';
      showAllBook.style.display = 'none';
    }

  } else {
    otherBookByAuthorList.innerHTML = "<p>No similar books found.</p>";
  }
}


// --- Skeleton Loader (5 placeholders) for similarBook---
function showSkeletons(count = 5) {
  similarLists.innerHTML = "";
  for (let i = 0; i < count; i++) {
    similarLists.innerHTML += `
      <div class="swiper-slide skeleton-slide">
        <div class="skeleton skeleton-img"></div>
        <div class="skeleton skeleton-text"></div>
        <div class="skeleton skeleton-text short"></div>
      </div>
    `;
  }
}


// --- Cache helper ---
function getCachedSimilar(category) {
  const cached = localStorage.getItem(`similar_${category}`);
  if (!cached) return null;

  const { data, expiry } = JSON.parse(cached);
  if (Date.now() > expiry) {
    localStorage.removeItem(`similar_${category}`);
    return null;
  }
  return data;
}

function setCachedSimilar(category, data) {
  localStorage.setItem(
    `similar_${category}`,
    JSON.stringify({
      data,
      expiry: Date.now() + 1000 * 60 * 30 // cache 30 mins
    })
  );
}



// --- Fetch & Render ---
async function loadSimilarBooks(category) {
  // 1. Check cache first
  const cached = getCachedSimilar(category);
  if (cached) {
    renderSimilar(cached);
    return;
  }

  // 2. Show skeletons
  showSkeletons();

  try {
    const res = await fetch(`https://thebooksourcings.onrender.com/api/similar/${encodeURIComponent(category)}`);
    const { results } = await res.json();

    // Save in cache
    setCachedSimilar(category, results);

    // Render
    renderSimilar(results);
  } catch (err) {
    console.error(err);
    similarLists.innerHTML = "<p>Failed to load similar books.</p>";
  }
}




// renderSimilar
function renderSimilar(similarBooks) {
  similarLists.innerHTML = "";

  if (similarBooks.length > 0) {
    similarBooks.forEach(bk => {
      similarLists.innerHTML += `
        <a href='aboutBook.html?bookId=${bk.bookId}'>
            <div class="sm-div">
                    <img src="${bk.cover || 'assets/img/noCoverFound.png'}" class="sm-BookCover lazyload" loading="lazy" alt="${bk.title}"
                    <div class="bookInfo">
                      <div class="sm-BookTitle">${bk.title}</div>
                      <div class="sm-BookAuthor">${bk.author}</div>
                    </div>
            </div>
        </a>
      `;
    });
  } else {
    similarLists.innerHTML = "<p>No similar books found.</p>";
  }
  
}



//author card

// Skeleton loader
function showSkeletonAuthor(count = 1) {
  authorCardBody.innerHTML = '';
  for (let i = 0; i < count; i++) {
    authorCardBody.innerHTML += `
      <div class="skeleton-author-card">
        <div class="skeleton skeleton-author-img"></div>
        <div class="skeleton skeleton-author-name"></div>
        <div class="skeleton skeleton-author-profession"></div>
        <div class="skeleton skeleton-author-desc"></div>
      </div>
    `;
  }
}

// Cache
function getCachedAuthor(authorNames) {
  const cached = localStorage.getItem(`author_${authorNames}`);
  if (!cached) return null;
  const { data, expiry } = JSON.parse(cached);
  if (Date.now() > expiry) {
    localStorage.removeItem(`author_${authorNames}`);
    return null;
  }
  return data;
}

function setCachedAuthor(authorNames, data) {
  localStorage.setItem(`author_${authorNames}`, JSON.stringify({
    data,
    expiry: Date.now() + 1000 * 60 * 30 // 30 mins
  }));
}

// Fetch & render
async function loadAuthorInfo(authorNames) {
  if (!authorNames || authorNames.length === 0) return;

  const joinedNames = authorNames.join(',');
  const cached = getCachedAuthor(joinedNames);
  if (cached) return renderAuthorInfo(cached);
  
  showSkeletonAuthor(authorNames.length);

  try {
    const res = await fetch(`https://thebooksourcings.onrender.com/api/aboutAuthor/${encodeURIComponent(joinedNames)}`);
    if (!res.ok) throw new Error('Network response not ok');
    const { authors } = await res.json();

    setCachedAuthor(joinedNames, authors);
    renderAuthorInfo(authors);
  } catch (err) {
    console.error(err);
    authorCardBody.innerHTML = '<p>Failed to load author info. Please try again.</p>';
  }
}

// Render
// Helper: convert Wikidata image filename to Wikimedia Commons URL
function getWikidataImageUrl(filename) {
  if (!filename) return 'assets/img/dog.png'; // fallback image
  const encoded = encodeURIComponent(filename.replace(/ /g, '_'));
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encoded}`;
}

// Render author info
function renderAuthorInfo(authors) {
  authorCardBody.innerHTML = ''; // clear previous content

  if (!authors || authors.length === 0) {
    authorCardBody.innerHTML = '<p>No author info available.</p>';
    return;
  }

  authors.forEach((author, idx) => {
    const wikiId = author.wikidataId || '';
    const name = author.name || 'Unknown Author';
    const profession = author.profession || '';
    const description = author.description || 'No description available';
    const imgUrl = getWikidataImageUrl(author.photo);

    const html = `
      <a href="aboutAuthor.html?wikiId=${wikiId}">
        <div class="aboutAuthor">
          <img src="${imgUrl}" class="aboutPf" alt="${name}">
          <div class="authorInfo">
            <p class="authorName">${name}</p>
            <p class="authorProfession">${profession}</p>
            <p class="aboutAuthorDes">${description}</p>
          </div>
        </div>
      </a>
      ${idx < authors.length - 1 ? '<hr>' : ''}
    `;

    authorCardBody.insertAdjacentHTML('beforeend', html);
  });
}



//author card by qid

// Skeleton loader
function showSkeletonAuthorByQid(count = 1) {
  authorCardBody.innerHTML = '';
  for (let i = 0; i < count; i++) {
    authorCardBody.innerHTML += `
      <div class="skeleton-author-card">
        <div class="skeleton skeleton-author-img"></div>
        <div class="skeleton skeleton-author-name"></div>
        <div class="skeleton skeleton-author-profession"></div>
        <div class="skeleton skeleton-author-desc"></div>
      </div>
    `;
  }
}

// Cache
function getCachedAuthorByQid(authorQid) {
  const cached = localStorage.getItem(`author_${authorQid}`);
  if (!cached) return null;
  const { data, expiry } = JSON.parse(cached);
  if (Date.now() > expiry) {
    localStorage.removeItem(`author_${authorQid}`);
    return null;
  }
  return data;
}

function setCachedAuthorByQid(authorQid, data) {
  localStorage.setItem(`author_${authorQid}`, JSON.stringify({
    data,
    expiry: Date.now() + 1000 * 60 * 30 // 30 mins
  }));
}

// Fetch & render
async function loadAuthorInfoByQids(authorQid) {
  if (!authorQid || authorQid.length === 0) return;

  const joinedQid = authorQid.join(',');
  const cached = getCachedAuthorByQid(joinedQid);
  if (cached) return renderAuthorInfoByQid(cached);
  
  showSkeletonAuthorByQid(authorQid.length);

  try {
    const res = await fetch(`https://thebooksourcings.onrender.com/api/aboutAuthor/ByQid/${encodeURIComponent(joinedQid)}`);
    if (!res.ok) throw new Error('Network response not ok');
    const { authors } = await res.json();

    setCachedAuthorByQid(joinedQid, authors);
    renderAuthorInfoByQid(authors);
  } catch (err) {
    console.error(err);
    authorCardBody.innerHTML = '<p>Failed to load author info. Please try again.</p>';
  }
}


// Render author info
function renderAuthorInfoByQid(authors) {
  authorCardBody.innerHTML = ''; // clear previous content

  if (!authors || authors.length === 0) {
    authorCardBody.innerHTML = '<p>No author info available.</p>';
    return;
  }

  authors.forEach((author, idx) => {
    const memberQId = author.memberQid || '';
    const username = author.username || 'Unknown Author';
    const bio = '';
     if(author.work === "worker"){
    bio = `${username} is a ${author.workRole} at ${author.workPlace}. ${author.bio}`;
    }
    else{
     bio = `${username} is a ${author.workRole} student at ${author.workPlace}. ${author.bio}`;
    }

    const html = `
      <a href="aboutAuthor.html?memberQId=${memberQId}">
        <div class="aboutAuthor">
          <img src="${pfUrl}" class="aboutPf" alt="${username}">
          <div class="authorInfo">
            <p class="authorName">${username}</p>
            <p class="authorProfession">5 Books - ${author.followerCount} Followers</p>
            <p class="aboutAuthorDes">${bio}</p>
          </div>
        </div>
      </a>
      ${idx < authors.length - 1 ? '<hr>' : ''}
    `;

    authorCardBody.insertAdjacentHTML('beforeend', html);
  });
}


loadBookInfo();
