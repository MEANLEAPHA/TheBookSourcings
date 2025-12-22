// params Url
const urlParams = new URLSearchParams(window.location.search);
const bookId = urlParams.get("bookId");
const source = detectSource(bookId);

const feelingMap = {
  happy: "😊 happy",
  sad: "😢 sad",
  angry: "😡 angry",
  blissful: "😇 blissful",
  "in love": "😍 in love",
  silly: "😜 silly",
  cool: "😎 cool",
  relaxed: "😌 relaxed",
  sleepy: "😴 sleepy",
  sick: "🤒 sick",
  loved: "🤗 loved",
  shocked: "😱 shocked",
  disappointed: "😞 disappointed",
  frustrated: "😤 frustrated",
  excited: "🤩 excited",
  festive: "🥳 festive",
  down: "😔 down",
  confused: "😕 confused",
  nervous: "😬 nervous",
  blessed: "😇 blessed",
  thankful: "🙏 thankful",
  amused: "😅 amused",
  curious: "🤓 curious",
  overwhelmed: "😩 overwhelmed",
  fantastic: "😆 fantastic",
  meh: "😶 meh",
  heartbroken: "😢 heartbroken",
  determined: "😤 determined",
  inspired: "😇 inspired",
  crazy: "😵‍💫 crazy",
  ok: "😐 OK",
  proud: "😃 proud",
  satisfied: "😋 satisfied",
  embarrassed: "😳 embarrassed",
  thoughtful: "🤔 thoughtful",
  lovely: "😍 lovely",
  miserable: "😖 miserable",
  grateful: "😇 grateful"
};
const shareBtn = document.querySelector(".shareBtn");
// ====== SEND MESSAGE ======
const forms = document.getElementById("form");
const messageInput = document.getElementById("message-input");
 // feeling toast logic
    const feelingLabel = document.getElementById('feelingLabel');
    const displayFeeling = document.getElementById("displayFeeling");
    const feelingInput = document.getElementById("feelingValue");
 
    const FeelingToast = new bootstrap.Toast(document.getElementById("FeelingToast"), { autohide: false });
    const feelingOptions = document.querySelectorAll('.feeling-option');

    // Show toast on label click
    feelingLabel.addEventListener('click', () => {
      FeelingToast.show();
    });

    // Handle click on each feeling option
    feelingOptions.forEach(option => {
      option.addEventListener("click", () => {
        const text = option.textContent;
        displayFeeling.textContent = 'Is feeling ' + text;

        // Save selected feeling (strip emoji if needed)
        feelingInput.value = text.replace(/^[^\w]+/, "").trim().toLowerCase();

        FeelingToast.hide();
      });
    });
       document.getElementById("cancelFeelingBtn").onclick = () => {
      FeelingToast.hide();
      displayFeeling.textContent = "";
      feelingInput.value = "";
    };
// Send message (text + optional multiple media)
forms.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = messageInput.value.trim();
  const feeling = feelingInput.value; // hidden input
  // ❗ require something
  if (
    !text &&
    !feeling
    && !bookId
  ) return;

  try {
    const formData = new FormData();
    formData.append("message", text);
    formData.append("feeling", feeling);
    formData.append("bookQid", bookId);
    const res = await fetch(`${API_URL}/api/community/send`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` },
      body: formData
    });

    // if (!res.ok) throw new Error("Failed to send message");
    if (!res.ok) {
          if (res.status === 403) {
            showErrorToast("Unauthorized. Please log in or sign up first.");
  
          } else {
            const errorText = await res.text();
            showErrorToast("Error: " + errorText);
          }
          return;
        }
   
    messageInput.value = "";
    displayFeeling.textContent = "";
    postToast.hide();
  } catch (err) {
    console.error(err);
  }
});
// Post toast
document.addEventListener("DOMContentLoaded", () => {
  const postToast = new bootstrap.Toast(document.getElementById("PostToast"), { autohide: false });

const shareBtn = document.querySelector(".shareBtn");
shareBtn.addEventListener("click", () => {
  postToast.show();
});

  document.getElementById("cancelPostBtn").onclick = () => {
    postToast.hide();
    messageInput.value = "";
    feelingInput.value = "";
    displayFeeling.textContent = "";
  };
});

function detectSource(bookId) {
    if (/^TB\d+S$/.test(bookId)) return "otthor";
    if (/^OL\d+(W|M|A)$/.test(bookId)) return "openlibrary";
    if (/^\d+$/.test(bookId)) return "gutenberg";
    return "google"; // fallback for Google Books
}

   // View count
    fetch(`https://thebooksourcings.onrender.com/api/bookByAuthor/viewBook/${bookId}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json"
      }
    })
    .then(res => res.json())
    .then(data => console.log(data))
    .catch(err => console.error("Error recording view:", err));

     // READ, Share, Download
    const read = document.getElementById("readBtn");
    const download = document.getElementById("downloadBtn");

    function recordActivity(type, bookId) {
      fetch(`https://thebooksourcings.onrender.com/api/bookByAuthor/${type}/${bookId}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json"
        }
      })
        .then(res => res.json())
        .then(data => console.log(`${type} recorded:`, data))
        .catch(err => console.error(`Error recording ${type} activity:`, err));
    }

    if (read) read.addEventListener("click", () => recordActivity("read", bookId));
    if (download) download.addEventListener("click", () => recordActivity("download", bookId));
    


    // favorite

    const favoriteBtn = document.getElementById('favoriteBtn');
    const favoriteIcon = document.getElementById('favoriteIcon');
  
    async function toggleActivity() {
    try {
        const res = await fetch(`https://thebooksourcings.onrender.com/api/bookByAuthor/rating/favorite/${bookId}`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`,
                    "Content-Type": "application/json"
                }
            });
            if (!res.ok) throw new Error(`Failed to toggle ${type}`);
            const data = await res.json();

                favoriteIcon.style.color = data.favorited ? "gold" : "black";
            
        } catch (err) {
            console.error(err);
        }
    }

    // Event listeners
    favoriteBtn.addEventListener('click', toggleActivity);
    

const API_URL = "https://thebooksourcings.onrender.com";
const socket = io(API_URL, { auth: { token } });

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
  const res = await fetch(`https://thebooksourcings.onrender.com/api/aboutBook/${source}/${bookId}`);
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

    document.querySelector("#channelPf").src = book.pfUrl;
    document.querySelector("#channelName").textContent = book.username;
    document.querySelector(".followCount").textContent = `${book.followerCount} Followers`;

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


    const readA = document.querySelector("#read-href");
    const downloadA = document.querySelector("#download-href");

    if (book.read) {
      readA.href = book.read;
    } else {
      readA.removeAttribute("href");
      if (book.source === "Open Library") {
        readBtn.addEventListener("click", (e) => {
          e.preventDefault();
          showToast("❌ This book is not available to read.");
        });
      }
    }

    if (book.download) {
      downloadA.href = book.download;
    } else {
      downloadA.removeAttribute("href");
      if (data.source === "Open Library") {
        downloadA.addEventListener("click", (e) => {
          e.preventDefault();
          showToast("❌ This book is not available for download.");
        });
      }
    }

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
                    toggleFollowActivity(data.channel)
                })
                followHolder.appendChild(followBtn);
    }


  const authorNames = Array.isArray(book.authors) ? book.authors : [book.authors || 'William Shakespeare'];
  const authorQids = Array.isArray(book.authorIds) ? book.authorIds : [book.authorIds];
// other book by author
    const firstAuthor = Array.isArray(book.authors)
    ? (book.authors[0] || "") 
    : (book.authors || "");
    const authorNameToUse = (firstAuthor && String(firstAuthor).trim()) ? firstAuthor : "William Shakespeare";

  if(book.authorIds){
    loadAuthorInfoByQids(authorQids); // for otthor user
    loadOtherBookByAuthorQid(authorQids); // otthor
  }
  else{
    loadAuthorInfo(authorNames); // for googlebook, gutenberg and openlibrary
    loadOtherBookByAuthor(authorNameToUse);// googlebook, openlibrary, gutenberg
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
    let bio = '';
     if(author.work === "worker"){
    bio = `${username} is a ${author.workRole} at ${author.workPlace}. ${author.bio}`;
    }
    else{
     bio = `${username} is a ${author.workRole} student at ${author.workPlace}. ${author.bio}`;
    }

    const html = `
      <a href="aboutAuthor.html?memberQId=${memberQId}">
        <div class="aboutAuthor">
          <img src="${author.pfUrl}" class="aboutPf" alt="${username}">
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
    otherBookByAuthorList.innerHTML = "<p>No other books found.</p>";
  }
}


// othe book by author qid
function showSkeletonOtherBookByQid(count = 1) {
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

// ---------------- CACHE ----------------
function getCachedOtherBookByQid(authorQid) {
  const cached = localStorage.getItem(`author_${authorQid}`);
  if (!cached) return null;

  const { data, expiry } = JSON.parse(cached);
  if (Date.now() > expiry) {
    localStorage.removeItem(`author_${authorQid}`);
    return null;
  }
  return data;
}

function setCachedOtherBookByQid(authorQid, data) {
  localStorage.setItem(`author_${authorQid}`, JSON.stringify({
    data,
    expiry: Date.now() + 1000 * 60 * 30 // 30 mins
  }));
}

// ---------------- FETCH ----------------
async function loadOtherBookByAuthorQid(authorQid) {
  if (!authorQid || authorQid.length === 0) return;

  const joinedQid = authorQid.join(',');
  const cached = getCachedOtherBookByQid(joinedQid);

  if (cached) {
    return renderOtherBookByQid(cached);
  }

  showSkeletonOtherBookByQid(4);

  try {
    const res = await fetch(`https://thebooksourcings.onrender.com/api/bookByAuthor/ByQid/${encodeURIComponent(joinedQid)}`);
    if (!res.ok) throw new Error("Network response not ok");

    const { authors } = await res.json(); // backend returns { authors: [...] }

    setCachedOtherBookByQid(joinedQid, authors);
    renderOtherBookByQid(authors);

  } catch (err) {
    console.error("Load books by author QID error:", err);
    otherBookByAuthorList.innerHTML = "<p>Failed to load books.</p>";
  }
}

// ---------------- RENDER ----------------
function renderOtherBookByQid(authors) {
  otherBookByAuthorList.innerHTML = "";

  if (!authors || authors.length === 0) {
    otherBookByAuthorList.innerHTML = "<p>No other books found.</p>";
    return;
  }

  authors.forEach(book => {
    // ----------- FIX AUTHOR STRING -> ARRAY ----------
    let authorName = book.author || "Unknown Author";

    try {
      if (typeof authorName === "string" && authorName.startsWith("[")) {
        authorName = JSON.parse(authorName).join(", ");
      }
    } catch (e) {
      console.error("Author parse error:", e);
    }

    // ----------- SAFE FALLBACKS ----------
    const cover = book.bookCover || "assets/img/noCoverFound.png";
    const bookId = book.bookQid || "";
    const title = book.title || "Unknown Title";
    const subTitle = book.subTitle || "";

    // ----------- RENDER ----------
    otherBookByAuthorList.innerHTML += `
      <div class="books">
        <a href="aboutBook.html?bookId=${bookId}">
          <img src="${cover}"
               alt="${title}"
               class="bookImg lazyload"
               loading="lazy"
               onerror="this.src='assets/img/noCoverFound.png'">
        </a>

        <div class="bookInfo">
          <a href="aboutBook.html?bookId=${bookId}">
            <span id="OtherbookTitle">${title}</span>
          </a>

          <a id="OtherbookAuthor">${authorName}</a>
          <a id="OtherbookSubTitle">${subTitle}</a>
        </div>
      </div>
    `;
  });

  // ---------------- SHOW MORE / LESS ----------------
  const showLessBook = document.getElementById("showLessBook");
  const showAllBook = document.getElementById("showAllBook");
  const books = document.querySelectorAll(".books");

  if (books.length > 3) {
    for (let i = 3; i < books.length; i++) {
      books[i].style.display = "none";
    }

    showLessBook.style.display = "none";
    showAllBook.style.display = "flex";

    showAllBook.onclick = () => {
      books.forEach(b => b.style.display = "flex");
      showAllBook.style.display = "none";
      showLessBook.style.display = "flex";
    };

    showLessBook.onclick = () => {
      for (let i = 3; i < books.length; i++) {
        books[i].style.display = "none";
      }
      showLessBook.style.display = "none";
      showAllBook.style.display = "flex";
    };
  } else {
    showLessBook.style.display = "none";
    showAllBook.style.display = "none";
  }
}


// load book info
loadBookInfo();




//------- form rate and review logic --------

// ====== Form Declaration======
const form = document.getElementById("form-review");
const commentInput = document.getElementById("review-input");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const text = commentInput.value.trim();
  if (!text) return;

  try {
    const payload = {
      bookQid: bookId,
      review_text: text,
      rate_star: currentRateStar // ✅ ALWAYS CORRECT NOW
    };

    const res = await fetch(`${API_URL}/api/bookByAuthor/rating`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error("Failed to review");

    const savedCmt = await res.json();

    displayComment(savedCmt);
    socket.emit("send-review", savedCmt);

    commentInput.value = "";

  } catch (err) {
    console.error(err);
  }
});



// ====== DECLARATIONS FOR review======
// Edit
let editingCommentId = null;
const editCommentToast = new bootstrap.Toast(document.getElementById("editCommentToast"), { autohide: false });
const editCommentInput = document.getElementById("editCommentInput");

// Delete
let deletingCommentId = null;
const deleteCommentToast = new bootstrap.Toast(document.getElementById("deleteCommentToast"), { autohide: false });

// Report
let reportingTargetCommentId = null;
const reportCommentToast = new bootstrap.Toast(document.getElementById("reportCommentToast"), { autohide: false });
const reportReasonCommentInput = document.getElementById("reportReasonCommentInput");



// ====== SOCKET LISTENERS FOR COMMENT ======
socket.on("connect", () => console.log("Connected:", socket.id));

socket.on("receive-review", (cmt) => {
  if (!cmt.createFormNow) cmt.createFormNow = "just now";
  displayComment(cmt);
});

socket.on("review-updated", ({ comment_id, newComment }) => {
  const div = document.querySelector(`div[data-comment-id='${comment_id}']`);
  if (div) div.querySelector(".comment-text").textContent = newComment;

});

socket.on("review-deleted", ({ comment_id }) => {
  const div = document.querySelector(`div[data-comment-id='${comment_id}']`);
  if (div) div.remove();
});
    
    

// ====== LOAD ALL Review ======
async function loadComment() {
  try {
    const res = await fetch(`${API_URL}/api/bookByAuthor/rating/displayAll/${bookId}`);
    if (!res.ok) throw new Error("Failed to fetch messages");
    const comments = await res.json();
    comments.forEach(displayComment);
  } catch (err) {
    console.error("Error loading review:", err);
  }
}
loadComment();


// ====== DISPLAY Comment ======
function displayComment(cmt) {
  const div = document.createElement("div");
  div.className = "comment"; 
  div.dataset.id = cmt.commentQid;
  div.dataset.commentId = cmt.comment_id;

  // --- comment header HEADER ---
  const header = document.createElement("div");
  header.className = "comment-header"; // div header of comment

  const profileImg = document.createElement("img");
  profileImg.src = cmt.profile_url || "../../assets/img/pf.jpg"; // placeholder
  profileImg.alt = "user-profile-cmt";
  profileImg.className = "userCommentProfile"; // user Pf on cmt div

  // Wrap profile image in link
  const profileLink = document.createElement("a");
  profileLink.href = `aboutUser?memberId=${cmt.memberQid}`; // user name on cmt div href to their account
  profileLink.appendChild(profileImg);


const starDiv = document.createElement("div");
starDiv.className = "star-ratingx";

const starNum = Math.max(0, Math.min(5, Number(cmt.rate_star) || 0));
for (let i = 1; i <= 5; i++) {
  const star = document.createElement("i");
  star.classList.add("fa-star");

  if (i <= starNum) {
    star.classList.add("fa-solid");
    star.style.color = "#FFD700"; // optional gold
  } else {
    star.classList.add("fa-regular");
    star.style.color = "#ccc"; // optional grey
  }

  starDiv.appendChild(star);
}

  // Username link
  const headerRight = document.createElement("div");
  headerRight.className = "comment-header-child-right";

  const headerRightTop = document.createElement("div");
  headerRightTop.className = "comment-header-child-right-top"; // user to be flex now no need

  const headerRightBottom = document.createElement("div");
  headerRightBottom.className = "comment-header-child-right-bottom";

 

  const usernameLink = document.createElement("p");
  usernameLink.href = `aboutUser?memberId=${cmt.memberQid}`;
  usernameLink.textContent = cmt.username || "Unknown";
  usernameLink.className = "usernameComment";


  headerRightTop.appendChild(usernameLink);
  headerRightBottom.appendChild(starDiv);

  if (cmt.comment) {
    const textP = document.createElement("p");
    textP.className = "comment-text";

    if (cmt.comment.length > 250) {
      const shortText = cmt.comment.slice(0, 250);
      textP.textContent = shortText + "... ";

      const seeMore = document.createElement("a");
      seeMore.href = "#";
      seeMore.textContent = "see more";
      seeMore.addEventListener("click", (e) => {
        e.preventDefault();
        textP.textContent = cmt.comment; // show full text
      });

      textP.appendChild(seeMore);
    } else {
      textP.textContent = cmt.comment;
    }

    headerRightBottom.appendChild(textP);
  }
  else{
    const textP = document.createElement("p");
    textP.className = "comment-text";
    textP.textContent = "";
    headerRightBottom.appendChild(textP);
  }

  // Dropdown menu
  const dropdownWrapper = document.createElement("div");
  dropdownWrapper.className = "dropdown  comment-dropdown";

  const ellipsisBtn = document.createElement("i");
  ellipsisBtn.className = "fa-solid fa-ellipsis";
  ellipsisBtn.setAttribute("data-bs-toggle", "dropdown");
  ellipsisBtn.style.cursor = "pointer";

  const dropdownMenu = document.createElement("ul");
  dropdownMenu.className = "dropdown-menu";
  if (cmt.memberQid === userMemberQid) {
    dropdownMenu.innerHTML = `
      <li><a class="dropdown-item edit-option-comment" href="#">Edit</a></li>
      <li><a class="dropdown-item delete-option-comment" href="#">Delete</a></li>
      <li><a class="dropdown-item report-option-comment" href="#">Report</a></li>
    `;
  } else {
    dropdownMenu.innerHTML = `
      <li><a class="dropdown-item report-option" href="#">Report</a></li>
    `;
  }
  dropdownWrapper.appendChild(ellipsisBtn);
  dropdownWrapper.appendChild(dropdownMenu);

 

  // --- Comment BODY ---
  const body = document.createElement("div");
  body.className = "comment-body";

  const footerDiv = document.createElement("div");
  footerDiv.className = "comment-reply-footer-div";

  // --- Footer section (hidden by default) ---
  const footer = document.createElement("div");
  footer.className = "comment-reply-footer";

  // Toggle reply buttons
  const showReply = document.createElement("p");
  showReply.className = "show-reply-toggle";
  showReply.textContent = `--- Show ${cmt.reply_count} Reply`;

  const unShowReply = document.createElement("p");
  unShowReply.className = "hide-reply-toggle";
  unShowReply.textContent = "--- Hide Reply";
  unShowReply.style.display = "none";

  // Attach toggle listeners
  showReply.addEventListener("click", () => {
    footer.style.display = "block";
    showReply.style.display = "none";
    unShowReply.style.display = "inline";
  });

  unShowReply.addEventListener("click", () => {
    footer.style.display = "none";
    showReply.style.display = "inline";
    unShowReply.style.display = "none";
  });
    
  // --- Append the toggle controls before the footer ---
const toggleWrapper = document.createElement("div");
toggleWrapper.className = "comment-reply-toggle-wrapper";
toggleWrapper.appendChild(showReply);
toggleWrapper.appendChild(unShowReply);

  


  const actionRow = document.createElement('div');
  actionRow.className = "comment-action-row";

  // --- BUTTONS ---
  const btnRow = document.createElement("div");
  btnRow.className = "comment-media-button";

  // Like btn
  const likeBtn = document.createElement("button");
  likeBtn.className = "likeCmtBtn media-btn-comment";
  likeBtn.dataset.id = cmt.comment_id;
  likeBtn.innerHTML = `<i class="fa-solid fa-heart"></i>`;

  // ===========reply logic will work at home today=====

// ===== Reply Btn =====
  const replyBtn = document.createElement("button");
  replyBtn.className = "replyBtn media-btn-comment";
  replyBtn.dataset.id = cmt.commentQid; // pass commentQid
  replyBtn.innerHTML = `<i class="fa-solid fa-reply"></i>`;

  // Show ReplyToast and set typeOfId
  replyBtn.addEventListener("click", () => {
    typeOfId = cmt.commentQid; // set global typeOfId for formReply
    ReplyToast.show();
  });

   const postAt = document.createElement("div");
   postAt.className = "commentAt";
   postAt.textContent = cmt.createFormNow || "Just now";

   const likeCounts = document.createElement("div");
   likeCounts.className = "comment-like-count";
   likeCounts.textContent = `${cmt.like_count || 0}`;

  btnRow.appendChild(postAt);
  btnRow.appendChild(replyBtn);
  btnRow.appendChild(likeBtn);
  btnRow.appendChild(likeCounts)
  // btnRow.appendChild(commentBtn); maybe this turn to reply then there will be another fect oad and also two more like logic ...
  actionRow.appendChild(btnRow);
  // actionRow.appendChild(counts);
  footerDiv.appendChild(actionRow);

  headerRightBottom.appendChild(body);
  if(cmt.reply_count !== 0){
    footerDiv.appendChild(toggleWrapper);
    footerDiv.appendChild(footer);
  }
  
  headerRightBottom.appendChild(footerDiv);
  headerRight.appendChild(headerRightTop);
  headerRight.appendChild(headerRightBottom);
  headerRight.appendChild(dropdownWrapper);
  header.appendChild(profileLink);
  header.appendChild(headerRight);

  // Append together
  div.appendChild(header);

  document.getElementById("review-container").prepend(div);

  // === Attach like toggle logic ===
  const likeIcon = likeBtn.querySelector("i");
  // const likeCount = counts.querySelector(".comment-like-count");
  const likeCount = likeCounts;
  loadLikeInfoForComment(cmt.comment_id, likeIcon, likeCount);
  likeBtn.onclick = async () => {
    await toggleLikeActivityForComment(cmt.comment_id, likeIcon, likeCount);
  };

  // === Dropdown click handlers ===
  dropdownMenu.querySelectorAll("a").forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      if (item.classList.contains("edit-option-comment")) {
        editingCommentId = cmt.comment_id;
        editCommentInput.value = cmt.comment;
        editCommentToast.show();
      } else if (item.classList.contains("delete-option-comment")) {
        deletingCommentId = cmt.comment_id;
        deleteCommentToast.show();
      } else if (item.classList.contains("report-option-comment")) {
        reportingTargetCommentId = cmt.comment_id;
        reportCommentToast.show();
      }
    });
  });
  // Fetch replies for a comment

   loadReply(cmt.commentQid);

}

// ====== LIKE FUNCTIONS FOR COMMENT ======
async function loadLikeInfoForComment(commentId, likeIcon, likeCount) {
  try {
    const res = await fetch(`${API_URL}/api/bookByAuthor/rating/status/${commentId}`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Failed to fetch like status");

    const data = await res.json();
    likeCount.textContent = data.comment.like_count;
    likeIcon.style.color = data.userStatus.liked ? "red" : "gray";
  } catch (err) {
    console.error(err);
  }
}

async function toggleLikeActivityForComment(commentId, likeIcon, likeCount) {
  try {
    const res = await fetch(`${API_URL}/api/bookByAuthor/rating/like/${commentId}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });
    if (!res.ok) throw new Error("Failed to toggle like");

    const data = await res.json();
    likeIcon.style.color = data.liked ? "red" : "gray";
    await loadLikeInfoForComment(commentId, likeIcon, likeCount);
  } catch (err) {
    console.error(err);
  }
}


// ====== EDIT review=====
document.getElementById("saveEditCommentBtn").onclick = async () => {
  const newComment = editCommentInput.value.trim();
  if (!newComment || !editingCommentId) return;
  try {
    await fetch(`${API_URL}/api/bookByAuthor/rating/edit`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ comment_id: editingCommentId, newComment }) // need new_rate_star
    });
    socket.emit("edit-review", { comment_id: editingCommentId, newComment });  // need new_rate_star
    editCommentToast.hide();
    editingCommentId = null;
  } catch (err) {
    console.error(err);
  }
};

// ====== DELETE Fetch ======
document.getElementById("confirmDeleteCommentBtn").onclick = async () => {
  if (!deletingCommentId) return;
  try {
    await fetch(`${API_URL}/api/bookByAuthor/rating/delete`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ comment_id: deletingCommentId })
    });
    socket.emit("delete-review", { comment_id: deletingCommentId });
    deleteCommentToast.hide();
    deletingCommentId = null;
  } catch (err) {
    console.error(err);
  }
};

// ====== REPORT Comment Fetch======
document.getElementById("submitReportCommentBtn").onclick = async () => {
  const reasonCommentTxt = reportReasonCommentInput.value.trim();
  if (!reasonCommentTxt || !reportingTargetCommentId) return;

  try {
    const res = await fetch(`${API_URL}/api/bookByAuthor/rating/report`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        reasonCommentTxt,
        comment_id: reportingTargetCommentId
      })
    });

    if (!res.ok) throw new Error("Failed to submit report");

    const data = await res.json();
    alert(data.message); // the session display messgae back if succucess use for future not alert
    reportCommentToast.hide();
    reportingTargetCommentId = null;
    reportReasonCommentInput.value = "";
  } catch (err) {
    console.error("Report error:", err);
  }
};

// ====== CANCEL BUTTONS COMMENT ======
// cancel edit btn
document.getElementById("cancelEditCommentBtn").onclick = () => {
  editingCommentId = null;
  editCommentToast.hide();
};


// cancel delete btn
document.getElementById("cancelDeleteCommentBtn").onclick = () => {
  deletingCommentId = null;
  deleteCommentToast.hide();
};

// cancel report btn
document.getElementById("cancelReportCommentBtn").onclick = () => {
  reportingTargetCommentId = null;
  reportReasonCommentInput.value = "";
  reportCommentToast.hide();
};

 
// ======Reply  LOGICAL========

// get username to display on user comment form
const usernameFromReply = document.querySelector(".usernameFromReply");
if (username) {
  usernameFromReply.textContent = username;
}

// ====== SEND Comment Declaration ======
const formReply = document.getElementById("form-Reply");
const ReplyInput = document.getElementById("Reply-input");


// Send message (text + optional media)
formReply.addEventListener("submit", async (e) => {
  e.preventDefault();

  const text = ReplyInput.value.trim();

  if (!text) return; // must have text or media

  try {
    const reply = {
      replyText: text,
      typeOfId: typeOfId
    }
     // this will accept the commentQid or replyQid when ever the click the reply 
    const res = await fetch(`${API_URL}/api/bookByAuthor/rating/reply`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
       },
      body: JSON.stringify(reply)
    });
    if (!res.ok) throw new Error("Failed to send reply");
    const savedReply = await res.json();
    savedReply.createFormNow = "just now"; // instant display
    displayReply(savedReply);
    socket.emit("send-reply-review", savedReply);

    // Reset form
    ReplyInput.value = "";
    showReplyTo(null); // remove mention label
    typeOfId = null;// Reset the typeOfId so next reply doesn’t accidentally target the old comment/reply
    ReplyToast.hide();
  } catch (err) {
    console.error(err);
  }
});

// ====== DECLARATIONS FOR Reply======
// Edit
let editingReplyId = null;
const editReplyToast = new bootstrap.Toast(document.getElementById("editReplyToast"), { autohide: false });
const editReplyInput = document.getElementById("editReplyInput");

// Delete
let deletingReplyId = null;
const deleteReplyToast = new bootstrap.Toast(document.getElementById("deleteReplyToast"), { autohide: false });

// Report
let reportingTargetReplyId = null;
const reportReplyToast = new bootstrap.Toast(document.getElementById("reportReplyToast"), { autohide: false });
const reportReasonReplyInput = document.getElementById("reportReasonReplyInput");

// ====== SOCKET LISTENERS FOR Reply ======

socket.on("receive-reply-review", (rpy) => {
  if (!rpy.createFormNow) rpy.createFormNow = "just now";
  displayReply(rpy);
});

socket.on("reply-review-updated", ({ reply_id, newReply }) => {
  const div = document.querySelector(`div[data-reply-id='${reply_id}']`);
  if (div) div.querySelector(".reply-text").textContent = newReply;
});
socket.on("reply-deleted-review", ({ reply_id }) => {
  const div = document.querySelector(`div[data-reply-id='${reply_id}']`);
  if (div) div.remove();
});
  

async function loadReply(parentQid) {  // parentQid can be commentQid or replyQid
  if (!parentQid) return;
  try {
    const res = await fetch(`${API_URL}/api/bookByAuthor/rating/reply/dipslayAll/${encodeURIComponent(parentQid)}`);
    if (!res.ok) throw new Error("Failed to fetch Reply");
    const replies = await res.json();
    replies.forEach(displayReply);
  } catch (err) {
    console.error("Error loading replies:", err);
  }
}

// ====== DISPLAY Reply======
function displayReply(rpy) {
  const div = document.createElement("div");
  div.className = "reply"; // div of comment
  div.dataset.id = rpy.replyQid;
  div.dataset.replyId = rpy.reply_id;

  // --- comment header HEADER ---
  const header = document.createElement("div");
  header.className = "reply-header"; // div header of comment

  const profileImg = document.createElement("img");
  profileImg.src = rpy.profile_url || "../../assets/img/pf.jpg"; // placeholder
  profileImg.alt = "user-profile-rpy";
  profileImg.className = "userReplyProfile"; // user Pf on rpy div

  // Wrap profile image in link
  const profileLink = document.createElement("a");
  profileLink.href = `account?memberId=${rpy.memberQid}`; // user name on rpy div href to their account
  profileLink.appendChild(profileImg);

  // Username link
  

  const headerRight = document.createElement("div");
  headerRight.className = "reply-header-child-right";

  const headerRightTop = document.createElement("div");
  headerRightTop.className = "reply-header-child-right-top"; // user to be flex now no need

  const headerRightBottom = document.createElement("div");
  headerRightBottom.className = "reply-header-child-right-bottom";

  

  const usernameLink = document.createElement("p");
  usernameLink.href = `account?memberId=${rpy.memberQid}`;
  usernameLink.textContent = rpy.username || "Unknown";
  usernameLink.className = "usernameReply";
  headerRightTop.appendChild(usernameLink);

  if (rpy.reply) {
  const textP = document.createElement("p");
  textP.className = "reply-text";

  // If this reply is directed to someone (mention)
  if (rpy.replyToUsername) {
    const mention = document.createElement("span");
    mention.className = "mention";
    mention.textContent = `@${rpy.replyToUsername} `;
    mention.style.color = "#648dff"; // optional: match your theme
    mention.style.fontWeight = "500";
    textP.appendChild(mention);
  }

  // Handle long text
  if (rpy.reply.length > 250) {
    const shortText = rpy.reply.slice(0, 250);
    const textNode = document.createTextNode(shortText + "... ");
    textP.appendChild(textNode);

    const seeMore = document.createElement("a");
    seeMore.href = "#";
    seeMore.textContent = "see more";
    seeMore.style.color = "#007bff";
    seeMore.addEventListener("click", (e) => {
      e.preventDefault();
      textP.innerHTML = ""; // clear and re-render with mention + full text

      if (rpy.replyToUsername) {
        const mention = document.createElement("span");
        mention.className = "mention";
        mention.textContent = `@${rpy.replyToUsername} `;
        mention.style.color = "#648dff";
        mention.style.fontWeight = "500";
        textP.appendChild(mention);
      }

      const fullTextNode = document.createTextNode(rpy.reply);
      textP.appendChild(fullTextNode);
    });

    textP.appendChild(seeMore);
  } else {
    const textNode = document.createTextNode(rpy.reply);
    textP.appendChild(textNode);
  }

  headerRightBottom.appendChild(textP);
} else {
  const textP = document.createElement("p");
  textP.className = "reply-text";
  textP.textContent = "";
  
  headerRightBottom.appendChild(textP);
}

  // Dropdown menu
  const dropdownWrapper = document.createElement("div");
  dropdownWrapper.className = "dropdown reply-dropdown";

  const ellipsisBtn = document.createElement("i");
  ellipsisBtn.className = "fa-solid fa-ellipsis";
  ellipsisBtn.setAttribute("data-bs-toggle", "dropdown");
  ellipsisBtn.style.cursor = "pointer";

  const dropdownMenu = document.createElement("ul");
  dropdownMenu.className = "dropdown-menu";
  if (rpy.memberQid === userMemberQid) {
    dropdownMenu.innerHTML = `
      <li><a class="dropdown-item edit-option-reply" href="#">Edit</a></li>
      <li><a class="dropdown-item delete-option-reply" href="#">Delete</a></li>
      <li><a class="dropdown-item report-option-reply" href="#">Report</a></li>
    `;
  } else {
    dropdownMenu.innerHTML = `
      <li><a class="dropdown-item report-option-reply" href="#">Report</a></li>
    `;
  }
  dropdownWrapper.appendChild(ellipsisBtn);
  dropdownWrapper.appendChild(dropdownMenu);

 

  // ---reply BODY ---
  const body = document.createElement("div");
  body.className = "reply-body";

   const footerDiv = document.createElement("div");
  footerDiv.className = "reply-reply-footer-div";
  
  const actionRow = document.createElement("div");
  actionRow.className = "reply-action-row";

  // --- BUTTONS ---
  const btnRow = document.createElement("div");
  btnRow.className = "reply-media-button";

  // Like btn
  const likeBtn = document.createElement("button");
  likeBtn.className = "likerpyBtn media-btn-reply";
  likeBtn.dataset.id = rpy.reply_id;
  likeBtn.innerHTML = `<i class="fa-solid fa-heart"></i> `;

  // ===========reply logic will work at home today=====

// ===== Reply Btn =====
  const replyBtn = document.createElement("button");
  replyBtn.className = "replyBtn media-btn-reply";
  typeOfId = rpy.replyQid;
  replyBtn.innerHTML = `<i class="fa-solid fa-reply"></i>`;

  // Show ReplyToast and set typeOfId
  replyBtn.addEventListener("click", () => {
     typeOfId =  rpy.replyQid;
      const username = rpy.username;
      showReplyTo(username); // show the @username label visually
      ReplyInput.focus();
      ReplyToast.show();
  });

    const postAt = document.createElement("div");
   postAt.className = "replyAt";
   postAt.textContent = rpy.createFormNow || "Just now";

   const likeCounts = document.createElement("div");
   likeCounts.className = "reply-like-count";
   likeCounts.textContent = `${rpy.like_count || 0} Likes`;


  btnRow.appendChild(postAt);
  btnRow.appendChild(replyBtn);
  btnRow.appendChild(likeBtn);
  btnRow.appendChild(likeCounts);

  actionRow.appendChild(btnRow);
  // actionRow.appendChild(counts);
  footerDiv.appendChild(actionRow);
  headerRightBottom.appendChild(body);
  headerRightBottom.appendChild(footerDiv);
  headerRight.appendChild(headerRightTop);
  headerRight.appendChild(headerRightBottom);
  headerRight.appendChild(dropdownWrapper);
 
  header.appendChild(profileLink);
  header.appendChild(headerRight);
  

  // Append together
  div.appendChild(header);
 
  const parentFooter = findCommentFooterForParent(rpy.replyBackTo_id);

if (parentFooter) {
  // Append the reply into the parent's footer
  parentFooter.appendChild(div);

  // Only show the footer if the user already toggled "Show Reply"
  // Otherwise, keep it hidden by default
  if (parentFooter.style.display !== "block") {
    parentFooter.style.display = "none";
  }

} else {
  console.warn(
    `[loadReply] No parent footer found for replyBackTo_id: ${rpy.replyBackTo_id}. Using fallback.`
  );

  const fallback = document.querySelector(".comment-reply-footer");
  if (fallback) {
    fallback.appendChild(div);
    if (fallback.style.display !== "block") {
      fallback.style.display = "none";
    }
  }
}



  // === Attach like toggle logic ===
  const likeIcon = likeBtn.querySelector("i");
  // const likeCount = counts.querySelector(".reply-like-count");
   const likeCount = likeCounts;
  loadLikeInfoForReply(rpy.reply_id, likeIcon, likeCount);
  likeBtn.onclick = async () => {
    await toggleLikeActivityForReply(rpy.reply_id, likeIcon, likeCount);
  };

  // === Dropdown click handlers ===
  dropdownMenu.querySelectorAll("a").forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      if (item.classList.contains("edit-option-reply")) {
        editingReplyId = rpy.reply_id;
        editReplyInput.value = rpy.reply;
        editReplyToast.show();
      } else if (item.classList.contains("delete-option-reply")) {
        deletingReplyId = rpy.reply_id;
        deleteReplyToast.show();
      } else if (item.classList.contains("report-option-reply")) {
        reportingTargetReplyId = rpy.reply_id;
        reportReplyToast.show();
      }
    });
  });
  // Fetch replies for a reply (nested)
loadReply(rpy.replyQid);
}


function showReplyTo(username) {
  const replyLabel = document.getElementById("replyingToLabel");
  if (username) {
    replyLabel.textContent = `Replying to @${username}`;
    replyLabel.style.display = "block";
  } else {
    replyLabel.style.display = "none";
  }
}

function findCommentFooterForParent(replyBackToId) {
  if (!replyBackToId) return null;

  // First try to find a comment with that ID
  let parentEl = document.querySelector(`div[data-id='${replyBackToId}']`);

  // If not found, check if it is a reply
  if (!parentEl && replyBackToId.startsWith("REP")) {
    parentEl = document.querySelector(`div[data-id='${replyBackToId}']`);
  }

  if (parentEl) {
    // If parentEl is a comment, return its footer
    const footerIfComment = parentEl.querySelector('.comment-reply-footer');
    if (footerIfComment) return footerIfComment;

    // If parentEl is a reply, return the closest comment's footer
    const commentAncestor = parentEl.closest('.comment');
    if (commentAncestor) return commentAncestor.querySelector('.comment-reply-footer');
  }

  return null;
}

// ====== LIKE FUNCTIONS FOR COMMENT ======
async function loadLikeInfoForReply(replyId, likeIcon, likeCount) {
  try {
    const res = await fetch(`${API_URL}/api/bookByAuthor/rating/reply/status/${replyId}`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Failed to fetch like status");

    const data = await res.json();
    likeCount.textContent = data.reply.like_count;
    likeIcon.style.color = data.userStatus.liked ? "red" : "gray";
  } catch (err) {
    console.error(err);
  }
}

async function toggleLikeActivityForReply(replyId, likeIcon, likeCount) {
  try {
    const res = await fetch(`${API_URL}/api/bookByAuthor/rating/reply/like/${replyId}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });
    if (!res.ok) throw new Error("Failed to toggle like");

    const data = await res.json();
    likeIcon.style.color = data.liked  ? "red" : "gray";
    await loadLikeInfoForReply(replyId, likeIcon, likeCount);
  } catch (err) {
    console.error(err);
  }
}


// ====== EDIT  Comment Fetch======
document.getElementById("saveEditReplyBtn").onclick = async () => {
  const newReply = editReplyInput.value.trim();
  if (!newReply || !editingReplyId) return;
  try {
    await fetch(`${API_URL}/api/bookByAuthor/rating/reply/edit`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ reply_id: editingReplyId, newReply })
    });
    socket.emit("edit-reply-review", { reply_id: editingReplyId, newReply });
    editReplyToast.hide();
    editingReplyId = null;
  } catch (err) {
    console.error(err);
  }
};

// ====== DELETE Fetch ======
document.getElementById("confirmDeleteReplyBtn").onclick = async () => {
  if (!deletingReplyId) return;
  try {
    await fetch(`${API_URL}/api/bookByAuthor/rating/reply/delete`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ reply_id: deletingReplyId })
    });
    socket.emit("delete-reply-review", { reply_id: deletingReplyId });
    deleteReplyToast.hide();
    deletingReplyId = null;
  } catch (err) {
    console.error(err);
  }
};

// ====== REPORT CReply Fetch======
document.getElementById("submitReportReplyBtn").onclick = async () => {
  const reasonReplyTxt = reportReasonReplyInput.value.trim();
  if (!reasonReplyTxt || !reportingTargetReplyId) return;

  try {
    const res = await fetch(`${API_URL}/api/bookByAuthor/rating/reply/report`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        reasonReplyTxt,
        reply_id: reportingTargetReplyId
      })
    });

    if (!res.ok) throw new Error("Failed to submit reply report");

    const data = await res.json();
    alert(data.message); // the session display messgae back if succucess use for future not alert
    reportReplyToast.hide();
    reportingTargetReplyId = null;
    reportReasonReplyInput.value = "";
  } catch (err) {
    console.error("Report error:", err);
  }
};


 // Reply toast
  const ReplyToast = new bootstrap.Toast(document.getElementById("ReplyToast"), { autohide: false });
  
// ====== CANCEL BUTTONS Reply ======

// edit btn
document.getElementById("cancelEditReplyBtn").onclick = () => {
  editingReplyId = null;
  editReplyToast.hide();
};

// delete btn
document.getElementById("cancelDeleteReplyBtn").onclick = () => {
  deletingReplyId = null;
  deleteReplyToast.hide();
};

// report btn (reply review)
document.getElementById("cancelReportReplyBtn").onclick = () => {
  reportingTargetReplyId = null;
  reportReasonReplyInput.value = "";
  reportReplyToast.hide();
};

// upload btn (reply review form)
 document.getElementById("cancelReplyBtn").onclick = () => {
    ReplyToast.hide();
    ReplyInput.value = "";
  };



const starLabels = document.querySelectorAll(".star-rating label");
let currentRateStar = 0; 

const ratinglabel = document.getElementById("rating-label");
const i = document.createElement("i");
i.textContent = "Rate this book";
const i2 = document.createElement("i");
const ie = document.createElement("i");
ie.className = "fa-solid fa-pen-clip";
const a = document.createElement("a");
a.textContent = "Write a review";
a.href = "#review-input";
i2.appendChild(ie);
i2.appendChild(a);

async function loadPreviousRating() {
  if (!token) return;

  try {
    const res = await fetch(
      `${API_URL}/api/bookByAuthor/rating/getUserRating/${bookId}`,
      {
        headers: { "Authorization": `Bearer ${token}` }
      }
    );

    const data = await res.json();

    currentRateStar = Number(data.rate_star) || 0; // ✅ FIX HERE

    if(currentRateStar === 0){
      ratinglabel.appendChild(i);
    }
    else
    {
      ratinglabel.appendChild(i2);
    }
    highlightStars(currentRateStar);

  } catch (err) {
    console.error(err);
  }
}


// ⭐ Highlight stars (UI function)
function highlightStars(starCount) {
  starLabels.forEach(label => {
    const icon = label.querySelector("i");
    const value = Number(label.querySelector("input").value);

    if (value <= starCount) {
      icon.classList.add("active");
      icon.classList.replace("fa-regular", "fa-solid");
    } else {
      icon.classList.remove("active");
      icon.classList.replace("fa-solid", "fa-regular");
    }
  });
}


starLabels.forEach(label => {
  label.addEventListener("click", async () => {
    const selectedStar = Number(label.querySelector("input").value);

    currentRateStar = selectedStar; // ✅ UPDATE GLOBAL

    await fetch(`${API_URL}/api/bookByAuthor/rating/star`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        bookQid: bookId,
        rate_star: selectedStar
      })
    });

    highlightStars(selectedStar);
  });
});



loadPreviousRating();



// sum rate


function renderStars(containerId, rating) {
  const el = document.getElementById(containerId);
  el.innerHTML = "";

  for (let i = 1; i <= 5; i++) {
    const star = document.createElement("i");

    if (rating >= i) {
      star.className = "fa-solid fa-star";
    } else if (rating >= i - 0.5) {
      star.className = "fa-solid fa-star-half-stroke";
    } else {
      star.className = "fa-regular fa-star";
    }

    star.style.color = "#FFD700";
    el.appendChild(star);
  }
}


async function loadRatingSummary() {
  const res = await fetch(`${API_URL}/api/bookByAuthor/rating/summary/${bookId}`);
  const data = await res.json();

  // ⭐ Average
  document.getElementById("average-text").innerText = data.average;
  renderStars("average-stars", parseFloat(data.average));

  // 📊 Progress bars
  document.querySelectorAll(".progress-div").forEach(div => {
    const star = Number(div.dataset.star);
    const count = data.stars[star] || 0;
    const percent = data.total
      ? Math.round((count / data.total) * 100)
      : 0;

    const bar = div.querySelector(".progress-bar");
    const text = div.querySelector(".star-text");

    // Animate
    requestAnimationFrame(() => {
      bar.style.width = percent + "%";
    });

    text.innerText = `${count} (${percent}%)`;
  });
}
loadRatingSummary();



// popularity append
async function loadPopularity() {
  const res = await fetch(`${API_URL}/api/bookByAuthor/rating/popularity/${bookId}`);
  const data = await res.json();

  const container = document.querySelector(".popularity-container");
  container.innerHTML = "";

  createPopularityBlock(container, {
    total: data.total_read,
    users: data.users_read,
    text: "People read this book"
  });

  createPopularityBlock(container, {
    total: data.total_favorite,
    users: data.users_favorite,
    text: "People add Favorite"
  });

  createPopularityBlock(container, {
    total: data.total_download,
    users: data.users_download,
    text: "People download this book"
  });

  createPopularityBlock(container, {
    total: data.total_review,
    users: data.users_review,
    text: "People review this book"
  });

  createPopularityBlock(container, {
    total: data.total_rate,
    users: data.users_rate,
    text: "People rate this book"
  });


}
function createPopularityBlock(container, { total, users, text }) {
  if (!total || total === 0) return; // ❌ don't render empty blocks

  const wrapper = document.createElement("div");
  wrapper.className = "read-count count";

  const imageStack = document.createElement("div");
  imageStack.className = "image-stack";

  users.slice(0, 3).forEach((user, index) => {
    const img = document.createElement("img");
    img.className = `img img${index + 1}`;
    img.src = user.pfUrl || "/assets/img/default-user.png";
    img.alt = "user";
    imageStack.appendChild(img);
  });

  const textDiv = document.createElement("div");
  textDiv.className = "list-count";
  textDiv.innerHTML = `<span>${total}</span> ${text}`;

  wrapper.appendChild(imageStack);
  wrapper.appendChild(textDiv);

  container.appendChild(wrapper);
}
loadPopularity();
