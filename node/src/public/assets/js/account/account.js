
// --- Feeling Dictionary (global) ---
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

// Grab query parameter
const urlParams = new URLSearchParams(window.location.search);
const memberQid = urlParams.get("memberQid");


let userMemberQid = null;

function parseJwt (token) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
}
if (token) {
  const decoded = parseJwt(token);
  userMemberQid = decoded?.memberQid || null;
  
}


document.addEventListener("DOMContentLoaded", function () {
const API_URL = "https://thebooksourcings.onrender.com";
        const followHolder = document.getElementById('follow-holder');
        const completeBtn = document.createElement('button'); // if !data.authorQid && !data.ghostQid for user admin
        const editBtn = document.createElement('button'); // for user admin
        const followBtn = document.createElement('button');
        const followingBtn = document.createElement('button');

    fetch(`https://thebooksourcings.onrender.com/getFullRegisterDataByQid/${memberQid}`, {
        method: "GET",
        headers: {
            "Authorization": "Bearer " + token
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error("Network response was not ok");
        }
        return response.json();
    })
    .then(data => {
        if (!data) return;
        const userInfoDisplay = document.getElementById("user-info-display");
        const bio = document.createElement('p');
        const bioSpan = document.createElement('span');
        const quirkyTag = document.createElement('p');
        const quirkyTagI = document.createElement('i');
        const quirkyTagA = document.createElement('a');
        const occupation = document.createElement('p');
        const occupationI = document.createElement('i');
        const occupationA = document.createElement('a');
        const website = document.createElement('p');
        const websiteI = document.createElement('i');
        const websiteA = document.createElement('a');
        const memberQidp = document.createElement('p');
        const memberQidI = document.createElement('i');
        const memberQidA = document.createElement('a');
        const authorQid = document.createElement('p');
        const authorQidI = document.createElement('i');
        const authorQidA = document.createElement('a');
        const label = document.createElement('p');
        label.className = "label";
        label.textContent = 'Introduction';

        if(data.bio){
            bioSpan.id = "bio";
            bioSpan.textContent = data.bio;
            bio.appendChild(bioSpan);
        }
        if(data.playfulLabel){
            quirkyTagI.className = "fa-solid fa-tag";
            quirkyTagA.id = "quirkyTag";
            quirkyTagA.textContent = data.playfulLabel;
            quirkyTag.appendChild(quirkyTagI);
            quirkyTag.appendChild(quirkyTagA);
        }
        if(data.workRole && data.workPlace){
            occupationI.className = "fa-solid fa-suitcase";
            occupationA.id = "occupation";
            if(data.work === "student"){
                occupationA.textContent = `${data.workRole} student at ${data.workPlace}`;
            }
            else{
                occupationA.textContent = `${data.workRole} at ${data.workPlace}`;
            }
           occupation.appendChild(occupationI);
           occupation.appendChild(occupationA); 
        }
        if(data.websiteUrl){
            websiteI.className = "fa-solid fa-globe";
            websiteA.id = "website";
            websiteA.textContent = data.websiteUrl;
            websiteA.setAttribute("href", data.websiteUrl);
            website.appendChild(websiteI);
            website.appendChild(websiteA);
        }
        if(data.memberQid){
            memberQidI.className = "fa-regular fa-address-card";
            memberQidA.id = "memberQid";
            memberQidA.textContent = `Member id : ${data.memberQid}`;
            memberQidp.appendChild(memberQidI);
            memberQidp.appendChild(memberQidA);
        }
        if(data.authorQid){
            authorQidI.className = "fa-regular fa-address-card";
            authorQidA.id = "authorQid";
            authorQidA.textContent = `Author id : ${data.authorQid}`;
            authorQid.appendChild(authorQidI);
            authorQid.appendChild(authorQidA);
        }   
        userInfoDisplay.appendChild(label);
        userInfoDisplay.appendChild(bio);
        userInfoDisplay.appendChild(quirkyTag);
        userInfoDisplay.appendChild(occupation);
        userInfoDisplay.appendChild(website);
        userInfoDisplay.appendChild(memberQidp);
        userInfoDisplay.appendChild(authorQid);
        document.getElementById("username").textContent = data.username || "";
        document.getElementById("usernickname").textContent = `@${data.nickname || "noNicknameYet"}`;
        document.getElementById("userFollow").textContent = `${data.followerCount || "No followers yet"} followers`;
        document.getElementById("bannerImage").setAttribute("src", data.bannerUrl || "https://www.guardianoffshore.com.au/wp-content/themes/guardian-offshore/lib/image_resize.php?src=https://www.guardianoffshore.com.au/wp-content/themes/guardian-offshore/images/default-blog.jpg&w=800&h=225&zc=1");
        document.getElementById("bannerPreview").style.setProperty("--bg-img", `url(${data.bannerUrl || "https://www.guardianoffshore.com.au/wp-content/themes/guardian-offshore/lib/image_resize.php?src=https://www.guardianoffshore.com.au/wp-content/themes/guardian-offshore/images/default-blog.jpg&w=800&h=225&zc=1"})`);
        const profileImage = document.getElementById("profileImage");
        profileImage.setAttribute("src", data.pfUrl || "https://d1nhio0ox7pgb.cloudfront.net/_img/o_collection_png/green_dark_grey/512x512/plain/user.png");
        if (data.mood) {
            profileImage.classList.add(`mood-${data.mood}`);
        }




        const moreBtn = document.createElement('button');
        const moreBtnI = document.createElement('i');
        moreBtnI.className = "fa-solid fa-ellipsis-vertical";
        moreBtn.id = "btn-more";
        moreBtn.className = "dropdown";
        moreBtn.setAttribute("data-bs-toggle", "dropdown");
        moreBtn.setAttribute("aria-hidden", "true");

        const dropdownMenu = document.createElement('ul');
        dropdownMenu.className = "dropdown-menu";

        if(userMemberQid === data.memberQid){
            if(!data.authorQid && !data.ghostQid){
            completeBtn.id = "btn-complete";
            completeBtn.textContent = "Complete Profile";
            completeBtn.addEventListener("click", () => {
                location.href = "/accountEdit.html";
            });
            followHolder.appendChild(completeBtn);
            }
            else if(data.authorQid && data.ghostQid){
                editBtn.id = "btn-edit";
                editBtn.textContent = "Edit Profile";
                editBtn.onclick = () => location.href = "/accountEdit.html";
                followHolder.appendChild(editBtn);
            }
            const liOpt1 = document.createElement('li');
            liOpt1.className = "li-opt";
            const reportA = document.createElement('a');
            reportA.className = "dropdown-item report-option";

            const reportAI = document.createElement('i');
            reportAI.className = "fa-solid fa-flag";
            reportAI.setAttribute('aria-hidden', "true");

            const reportAS = document.createElement('span');
            reportAS.textContent = 'Report Issue';

            reportA.appendChild(reportAI);
            reportA.appendChild(reportAS);
            liOpt1.appendChild(reportA);

            const liOpt2 = document.createElement('li');
            liOpt2.className = "li-opt";
            const copyA = document.createElement('a');
            copyA.className = "dropdown-item copy-option";
            const copyAI = document.createElement('i');
            copyAI.className = "fa-solid fa-link";
            copyAI.setAttribute('aria-hidden', "true");

            const copyAS = document.createElement('span');
            copyAS.textContent = 'Copy profile link';

            copyA.appendChild(copyAI);
            copyA.appendChild(copyAS);

            liOpt2.appendChild(copyA);

            dropdownMenu.appendChild(liOpt1);
            dropdownMenu.appendChild(liOpt2);

            moreBtn.appendChild(moreBtnI);
            moreBtn.appendChild(dropdownMenu);

            followHolder.appendChild(moreBtn);
        }
        else{
            loadChannelInfo(data.memberQid);
            followBtn.id = "btn-follow";
            followBtn.innerHTML = `
              <span class="spinner-border spinner-border-sm me-1" role="status" style="display:none;color:#fd7648"></span>
              <span class="btn-text">Follow</span>
            `;


            followBtn.addEventListener("click", () => {
                toggleFollowActivity(data.memberQid)
            })

            const liOpt1 = document.createElement('li');
            liOpt1.className = "li-opt";
            const reportA = document.createElement('a');
            reportA.className = "dropdown-item report-option";

            const reportAI = document.createElement('i');
            reportAI.className = "fa-solid fa-flag";
            reportAI.setAttribute('aria-hidden', "true");

            const reportAS = document.createElement('span');
            reportAS.textContent = 'Report Issue';

            reportA.appendChild(reportAI);
            reportA.appendChild(reportAS);
            liOpt1.appendChild(reportA);

            const liOpt2 = document.createElement('li');
            liOpt2.className = "li-opt";
            const copyA = document.createElement('a');
            copyA.className = "dropdown-item copy-option";
            const copyAI = document.createElement('i');
            copyAI.className = "fa-solid fa-link";
            copyAI.setAttribute('aria-hidden', "true");

            const copyAS = document.createElement('span');
            copyAS.textContent = 'Copy profile link';

            copyA.appendChild(copyAI);
            copyA.appendChild(copyAS);

            liOpt2.appendChild(copyA);

            dropdownMenu.appendChild(liOpt1);
            dropdownMenu.appendChild(liOpt2);

            moreBtn.appendChild(moreBtnI);
            moreBtn.appendChild(dropdownMenu);

            followHolder.appendChild(followBtn);
            followHolder.appendChild(moreBtn);
            
        }

    })
    .catch(err => {
        console.error("Error fetching user:", err);
    });
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



fetch(`https://thebooksourcings.onrender.com/api/display/mutual/${memberQid}`, {
  method: "GET"
})
.then(response => {
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  return response.json();
})
.then(data => {
  if (!data || !data.mutual) return;

  const container = document.getElementById("user-connected");
  container.innerHTML = ""; // clear old content if needed

  data.mutual.forEach(friend => {
    // create anchor
    const a = document.createElement("a");
    a.href = `/account.html?memberQid=${friend.memberQid}`; 
    a.className = "user-pf-href";

    // create image
    const img = document.createElement("img");
    img.src = friend.friendPf || "https://bootdey.com/img/Content/avatar/avatar1.png";
    img.className = "user-pf";

    // create username paragraph
    const p = document.createElement("p");
    p.textContent = friend.username || friend.nickname || "Unknown";

    // assemble
    a.appendChild(img);
    a.appendChild(p);
    container.appendChild(a);
  });
})
.catch(err => {
  console.error("Error fetching mutual:", err);
});




const fetchBydiv = document.querySelector('.div-all-content-fetch');
const booksDisplay = document.getElementById('user-book-display');
const productDisplay = document.getElementById('user-product-display');
const postDisplay = document.getElementById('user-post-display');
const fimilarUserDisplay = document.getElementById('user-fimiliar-display');

const profileBtn = document.querySelectorAll('.profileBtn');
const postsBtn = document.querySelectorAll('.postsBtn');
const productBtn = document.querySelectorAll('.productBtn');
const bookBtn = document.querySelectorAll('.bookBtn');


const profileBtnLabel = document.getElementById('profileBtn');
const postsBtnLabel = document.getElementById('postsBtn');
const productBtnLabel = document.getElementById('productBtn');
const bookBtnLabel = document.getElementById('bookBtn');

 profileBtnLabel.style.backgroundColor='#fd7648';
 profileBtnLabel.style.opacity='0.7';
 bookBtnLabel.style.color='white';
  productBtnLabel.style.color='white';
  postsBtnLabel.style.color='white';
    book(memberQid);
  product(memberQid);
  loadMessages(memberQid);

 booksDisplay.style.display = 'block';
 productDisplay.style.display = 'block';
 fimilarUserDisplay.style.display = 'block';
 postDisplay.style.display = 'block';

profileBtn.forEach(btn => btn.onclick = ()=>{
  booksDisplay.style.display = 'block';
  productDisplay.style.display = 'block';
  fimilarUserDisplay.style.display = 'block';
  postDisplay.style.display = 'block';
  profileBtnLabel.style.backgroundColor='#fd7648';
  profileBtnLabel.style.opacity='0.7';
  bookBtnLabel.style.backgroundColor='none';
  bookBtnLabel.style.opacity='1';
  productBtnLabel.style.background='none';
  productBtnLabel.style.opacity='1';
  postsBtnLabel.style.backgroundColor='none';
  postsBtnLabel.style.opacity='1';
  book(memberQid);
  product(memberQid);
  loadMessages(memberQid);
});

bookBtn.forEach(btn => btn.onclick =()=>{
  profileBtnLabel.style.background='none';
  profileBtnLabel.style.opacity='1';  
  productBtnLabel.style.background='none';
  productBtnLabel.style.opacity='1';
  postsBtnLabel.style.background='none';
  postsBtnLabel.style.opacity='1';
  bookBtnLabel.style.backgroundColor='#fd7648';
  bookBtnLabel.style.opacity='0.7';
  document.querySelector('.book-label').style.display = 'none';
  booksDisplay.style.display = 'block';
  bookAll(memberQid);
  productDisplay.style.display = 'none';
  fimilarUserDisplay.style.display = 'none';
  postDisplay.style.display = 'none';
});
productBtn.forEach(btn => btn.onclick =()=>{
  profileBtnLabel.style.background='none';
  profileBtnLabel.style.opacity='1';
  productBtnLabel.style.backgroundColor='#fd7648';
  productBtnLabel.style.opacity='0.7';
  postsBtnLabel.style.background='none';
  postsBtnLabel.style.opacity='1';
  bookBtnLabel.style.background='none';
  bookBtnLabel.style.opacity='1';
  document.querySelector('.product-label').style.display = 'none';
  productDisplay.style.display = 'block';
  productAll(memberQid);
  booksDisplay.style.display = 'none';
  fimilarUserDisplay.style.display = 'none';
  postDisplay.style.display = 'none';
});
postsBtn.forEach(btn => btn.onclick =()=>{
  profileBtnLabel.style.background='none'
  profileBtnLabel.style.opacity='1';
  productBtnLabel.style.background='none';
  productBtnLabel.style.opacity='1';
  postsBtnLabel.style.backgroundColor='#fd7648';
  postsBtnLabel.style.opacity='0.7';
  bookBtnLabel.style.background='none';
  bookBtnLabel.style.opacity='1';
  document.querySelector('.post-label').style.display = 'none';
  booksDisplay.style.display = 'none';
  productDisplay.style.display = 'none';
  fimilarUserDisplay.style.display = 'none';
postDisplay.style.display = 'block';
  loadMessagesAll(memberQid);
});


async function bookAll(memberQid){
    try{
      const res = await fetch(`${API_URL}/api/books/userBookByMemberQid/${memberQid}`, {
  method: 'GET'
    });

    if (res.status === 404) {
      // User has no books
      const displayDiv = document.querySelector(".BookContent");
      displayDiv.innerHTML = `<p>User has not uploaded any book yet</p>`;
      return;
    }

    if (!res.ok) throw new Error('failed to fetch the book');


      const response = await res.json();
      const books = response.data || [];

      const displayDiv = document.querySelector(".BookContent");
      displayDiv.innerHTML = ""; 

    if (books.length === 0) {
      displayDiv.innerHTML = `<p>User has not uploaded any book yet</p>`;
      return;
    }

    books.forEach(book => {
      const cover = book.cover || "default.jpg";
      const author = book.author || "Unknown Author";
      const bookQid = book.bookQid;
      const title = book.title || "Untitled";
      const subtitle = book.subtitle ? `: ${book.subtitle}` : "";
      // const view = book.view || 0;
      // const uploadDate = book.uploaded;
      let authors = [];
      if (author) {
        if (Array.isArray(author)) {
          authors = author;
        } else {
          authors = author.split(",").map(a => a.trim());
        }
      }
    
      const card = `     
        <div class="saleBook-container">
                <div class="saleBook-cover-holder">      
                  <img src="${cover}" class="saleBook-src" >
                </div>
                <div class="card-body"> 
                  <div class="card-name">
                    <p class="saleBook-title">${title} ${subtitle}</p>
                  </div>
                  <div class="card-book-price card-book-author-holder">
                    <p class="mb-1"><span class="book-author">${authors.map(a => `${a}`).join(", ")}</span></p>
                  </div>
                    <button class="order-saleBook-btn"><a href="aboutBook.html?bookQid=${bookQid}"><i class="fa-solid fa-arrow-up"></i>View Book</a></button>
                  </div>
        </div>
      `;

      displayDiv.insertAdjacentHTML("beforeend", card);
    });

    }
    catch(err){
      console.error(err);
    }
}
async function book(memberQid){
    try{
      const res = await fetch(`${API_URL}/api/books/userBookByMemberQid/${memberQid}`, {
  method: 'GET'
    });

    if (res.status === 404) {
      // User has no books
      const displayDiv = document.querySelector(".BookContent");
      displayDiv.innerHTML = `<p>User has not uploaded any book yet</p>`;
      return;
    }

    if (!res.ok) throw new Error('failed to fetch the book');


      const response = await res.json();
      const books = response.data || [];

      const displayDiv = document.querySelector(".BookContent");
      displayDiv.innerHTML = ""; 

    if (books.length === 0) {
      displayDiv.innerHTML = `<p>User has not uploaded any book yet</p>`;
      return;
    }

    books.slice(0,6).forEach(book => {
      const cover = book.cover || "default.jpg";
      const author = book.author || "Unknown Author";
      const bookQid = book.bookQid;
      const title = book.title || "Untitled";
      const subtitle = book.subtitle ? `: ${book.subtitle}` : "";
      // const view = book.view || 0;
      // const uploadDate = book.uploaded;
      let authors = [];
      if (author) {
        if (Array.isArray(author)) {
          authors = author;
        } else {
          authors = author.split(",").map(a => a.trim());
        }
      }
    
      const card = `     
        <div class="saleBook-container">
                <div class="saleBook-cover-holder">      
                  <img src="${cover}" class="saleBook-src" >
                </div>
                <div class="card-body"> 
                  <div class="card-name">
                    <p class="saleBook-title">${title} ${subtitle}</p>
                  </div>
                  <div class="card-book-price card-book-author-holder">
                    <p class="mb-1"><span class="book-author">${authors.map(a => `${a}`).join(", ")}</span></p>
                  </div>
                    <button class="order-saleBook-btn"><a href="aboutBook.html?bookQid=${bookQid}"><i class="fa-solid fa-arrow-up"></i>View Book</a></button>
                  </div>
        </div>
      `;

      displayDiv.insertAdjacentHTML("beforeend", card);
    });

    }
    catch(err){
      console.error(err);
    }
}

async function productAll(memberQid){
   try{
      const res = await fetch(`https://thebooksourcings.onrender.com/api/shop/displayUserSaleBook/${memberQid}`, {
        method: 'GET'
      });

       const displayDiv = document.querySelector(".productContent");
    if (res.status === 404) {
      // User has no books
       
      displayDiv.innerHTML = `<p>User has not uploaded any product yet</p>`;
      return;
    }
      if(!res.ok) throw new Error('failed to fetch the book');

    
      const response = await res.json();
      const books = response.books || [];

    
      displayDiv.innerHTML = ""; 

    if (books.length === 0) {
      displayDiv.innerHTML = `<p>User has not uploaded any book yet</p>`;
      return;
    }

    books.slice(0,6).forEach(book => {

      const img = book.bookImg || (book.imgPreview?.[0] ?? "https://via.placeholder.com/150");
        const discountTag =
            book.discount_type && book.discount_price
            ? `<span class="sale-type">${book.discount_type === "percent" ? `${book.discount_price}%` : `${book.discount_price}$`}</span>`
            : `<span class="sale-type">Free</span>`;
        const saleType = //  class="badge-promotion free-type" => $saleType
            book.sale_type === "free"
            ? `class="badge-promotion free-type"`
            : book.sale_type === "discount"
            ? `class="badge-promotion discount-type"`
            : `class="badge-promotion normal-type"`;
    
      const card = `     
        <div class="saleBook-container">
                        <div class="saleBook-cover-holder">
                            <div ${saleType}>${discountTag}</div>
                            <img src="${img}" class="saleBook-src" alt="${book.title}">
                        </div>
                        <div class="card-body"> 
                            <div class="card-name">
                                <p class="saleBook-title">${book.title || "Untitled"}</p>
                            </div>
                            <div class="card-book-type">
                                <p class="book-type">${book.book_type?.toUpperCase() || "Unknown Type"}</p>
                            </div>
                            <div class="card-book-price">
                                <p class="mb-1">${book.price ? `<span class="fw-bold">$${book.price}</span>` : ""}
                                    ${book.original_price && book.original_price > book.price
                                    ? `<small class="text-decoration-line-through text-muted ms-2">$${book.original_price}</small>`
                                    : ""}
                                </p>
                            </div>
                            <button class="order-saleBook-btn"><a href="aboutSaleBook.html?bookSid=${book.bookSid}"><i class="fa-solid fa-arrow-up"></i>View Book</a></button>
                        </div>
                </div>
      `;

      displayDiv.insertAdjacentHTML("beforeend", card);
    });
   }
   catch(err){
    console.error(err);
   }
}

async function product(memberQid){
   try{
      const res = await fetch(`https://thebooksourcings.onrender.com/api/shop/displayUserSaleBook/${memberQid}`, {
        method: 'GET'
      });

       const displayDiv = document.querySelector(".productContent");
    if (res.status === 404) {
      // User has no books
       
      displayDiv.innerHTML = `<p>User has not uploaded any product yet</p>`;
      return;
    }
      if(!res.ok) throw new Error('failed to fetch the book');

    
      const response = await res.json();
      const books = response.books || [];

    
      displayDiv.innerHTML = ""; 

    if (books.length === 0) {
      displayDiv.innerHTML = `<p>User has not uploaded any book yet</p>`;
      return;
    }

    books.slice(0,6).forEach(book => {

      const img = book.bookImg || (book.imgPreview?.[0] ?? "https://via.placeholder.com/150");
        const discountTag =
            book.discount_type && book.discount_price
            ? `<span class="sale-type">${book.discount_type === "percent" ? `${book.discount_price}%` : `${book.discount_price}$`}</span>`
            : `<span class="sale-type">Free</span>`;
        const saleType = //  class="badge-promotion free-type" => $saleType
            book.sale_type === "free"
            ? `class="badge-promotion free-type"`
            : book.sale_type === "discount"
            ? `class="badge-promotion discount-type"`
            : `class="badge-promotion normal-type"`;
    
      const card = `     
        <div class="saleBook-container">
                        <div class="saleBook-cover-holder">
                            <div ${saleType}>${discountTag}</div>
                            <img src="${img}" class="saleBook-src" alt="${book.title}">
                        </div>
                        <div class="card-body"> 
                            <div class="card-name">
                                <p class="saleBook-title">${book.title || "Untitled"}</p>
                            </div>
                            <div class="card-book-type">
                                <p class="book-type">${book.book_type?.toUpperCase() || "Unknown Type"}</p>
                            </div>
                            <div class="card-book-price">
                                <p class="mb-1">${book.price ? `<span class="fw-bold">$${book.price}</span>` : ""}
                                    ${book.original_price && book.original_price > book.price
                                    ? `<small class="text-decoration-line-through text-muted ms-2">$${book.original_price}</small>`
                                    : ""}
                                </p>
                            </div>
                            <button class="order-saleBook-btn"><a href="aboutSaleBook.html?bookSid=${book.bookSid}"><i class="fa-solid fa-arrow-up"></i>View Book</a></button>
                        </div>
                </div>
      `;

      displayDiv.insertAdjacentHTML("beforeend", card);
    });
   }
   catch(err){
    console.error(err);
   }
}

// ====== DECLARATIONS ======
// Edit
let editingMessageId = null;
const editToast = new bootstrap.Toast(document.getElementById("editToast"), { autohide: false });
const editInput = document.getElementById("editMessageInput");

// Delete
let deletingMessageId = null;
const deleteToast = new bootstrap.Toast(document.getElementById("deleteToast"), { autohide: false });

// Report
let reportingTargetId = null;
const reportToast = new bootstrap.Toast(document.getElementById("reportToast"), { autohide: false });
const reportReasonInput = document.getElementById("reportReasonInput");


// repost 
let repost_id = null;

const socket = io(API_URL, { auth: { token } });
// ====== SOCKET LISTENERS ======
socket.on("connect", () => console.log("Connected:", socket.id));

socket.on("receive-message", (msg) => {
  if (!msg.createFormNow) msg.createFormNow = "just now";
  msg.feeling = feelingMap[msg.feeling] || msg.feeling;
  userPost(msg);
});
// socket.on("receive-message", (msg) => {
//   if (!msg.createFormNow) msg.createFormNow = "just now";
//   msg.feeling = feelingMap[msg.feeling] || msg.feeling;

//   const div = userPost(msg); // return the div inside userPost
//   document.getElementById("message-container").prepend(div); // new message on top
// });


socket.on("message-updated", ({ message_id, newText }) => {
  const div = document.querySelector(`div[data-id='${message_id}']`);
  if (div) div.querySelector(".post-text").textContent = newText;

});

socket.on("message-deleted", ({ message_id }) => {
  const div = document.querySelector(`div[data-id='${message_id}']`);
  if (div) div.remove();
});

// ====== LOAD ALL MESSAGES ======
async function loadMessages(memberQid) {
  try {
    const res = await fetch(`${API_URL}/api/community/display/${memberQid}`);
    if (!res.ok) throw new Error("Failed to fetch messages");
    const msgs = await res.json();
    msgs.slice(0,6).forEach(userPost);
  } catch (err) {
    console.error("Error loading messages:", err);
  }
}
async function loadMessagesAll(memberQid) {
  try {
    const res = await fetch(`${API_URL}/api/community/display/${memberQid}`);
    if (!res.ok) throw new Error("Failed to fetch messages");
    const msgs = await res.json();
    msgs.forEach(userPost);
  } catch (err) {
    console.error("Error loading messages:", err);
  }
}

// ====== SEND MESSAGE ======
const form = document.getElementById("form");
const messageInput = document.getElementById("message-input");
const mediaInput = document.getElementById("mediaInput");
const mediaInputLabel = document.getElementById("mediaInputLabel");
const mediaPreview = document.getElementById("media-preview");

let selectedFile = null;

// limit of 5 multi file upload 


mediaInput.addEventListener("change", (e) => {
  const files = Array.from(e.target.files);

  if (files.length > 5) {
    alert("You can only upload up to 5 files.");
    mediaInput.value = ""; // clear selection
    return;
  }

  // ✅ safe to proceed
  console.log("Selected files:", files);
});

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
    


// Show preview when user selects files
mediaInput.addEventListener("change", () => {
  const files = mediaInput.files; // can be multiple
  mediaPreview.innerHTML = ""; // clear previous preview

  if (!files || files.length === 0) return;

  // Loop through all selected files
  Array.from(files).forEach(file => {
    if (file.type.startsWith("image/")) {
      const img = document.createElement("img");
      img.src = URL.createObjectURL(file);
      img.style.maxWidth = "150px";
      img.style.margin = "5px";
      img.style.borderRadius = "5px";
      mediaPreview.appendChild(img);
    } else if (file.type.startsWith("video/")) {
      const video = document.createElement("video");
      video.src = URL.createObjectURL(file);
      video.controls = true;
      video.style.maxWidth = "150px";
      video.style.margin = "5px";
      video.style.borderRadius = "5px";
      mediaPreview.appendChild(video);
    }
  });
});

// Send message (text + optional multiple media)
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const text = messageInput.value.trim();
  const feeling = feelingInput.value; // hidden input
  const files = mediaInput.files; // multiple files

  if (!text && files.length === 0 && !feeling && !repost_id) return; // must have text, media, or feeling

  try {
    const formData = new FormData();
    formData.append("message", text);
    formData.append("feeling", feeling);
    formData.append("repost_id", repost_id);
    // Append all selected files
    Array.from(files).forEach(file => {
      formData.append("media", file); // "media" field matches backend
    });

    const res = await fetch(`${API_URL}/api/community/send`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` },
      body: formData
    });

    // if (!res.ok) throw new Error("Failed to send message");
    if (!res.ok) {
          if (res.status === 403) {
            showErrorToast("Unauthorized. Please log in or sign up first.");
            // setTimeout(() => {
            //   window.location.href = 'login.html';
            // }, 10000); 
          } else {
            const errorText = await res.text();
            showErrorToast("Error: " + errorText);
          }
          return;
        }
    const savedMsg = await res.json();
    savedMsg.createFormNow = "just now"; // instant display
    userPost(savedMsg);
    socket.emit("send-message", savedMsg);

    // Reset form
    messageInput.value = "";
    mediaInput.value = "";
    mediaPreview.innerHTML = "";
    feelingInput.value = "";
    selectedFile = null;
    displayFeeling.textContent = "";
    repost_id = null;
    postToast.hide();
  } catch (err) {
    console.error(err);
  }
});


// ====== DISPLAY MESSAGE ======
function userPost(msg) {
  const div = document.createElement("div");
  div.className = "post";
  div.dataset.id = msg.message_id;

  // --- POST HEADER ---
  const header = document.createElement("div");
  header.className = "post-header";

  const profileImg = document.createElement("img");
  profileImg.src = msg.profile_url || "../../assets/img/pf.jpg"; // placeholder
  profileImg.alt = "user-profile";
  profileImg.className = "userProfile";

  // Wrap profile image in link
  const profileLink = document.createElement("a");
  profileLink.href = `aboutUser?memberId=${msg.memberQid}`;
  profileLink.appendChild(profileImg);

  // Username link
  

  const headerRight = document.createElement("div");
  headerRight.className = "post-header-child-right";

  const headerRightTop = document.createElement("div");
  headerRightTop.className = "post-header-child-right-top";

  const headerRightBottom = document.createElement("div");
  headerRightBottom.className = "post-header-child-right-bottom";

  headerRight.appendChild(headerRightTop);
  headerRight.appendChild(headerRightBottom);

  const usernameLink = document.createElement("p");
  usernameLink.href = `aboutUser?memberId=${msg.memberQid}`;
  usernameLink.textContent = msg.username || "Unknown";
  usernameLink.className = "username";
  usernameLink.style.cursor = "pointer";
  usernameLink.style.margin = "0";
  headerRightTop.appendChild(usernameLink);

  if (msg.feeling) {
    const feeling = document.createElement("p");
    feeling.className = "feelingDisplay";
    feeling.textContent = "is feeling " + feelingMap[msg.feeling] || msg.feeling || "";
    headerRightTop.appendChild(feeling);
  }
  const postAt = document.createElement("p");
  postAt.className = "postAt";
  postAt.textContent = msg.createFormNow || "just now";
  headerRightBottom.appendChild(postAt);

  

  // Dropdown menu
  const dropdownWrapper = document.createElement("div");
  dropdownWrapper.className = "dropdown absolute-top-right";

  const ellipsisBtn = document.createElement("i");
  ellipsisBtn.className = "fa-solid fa-ellipsis";
  ellipsisBtn.setAttribute("data-bs-toggle", "dropdown");
  ellipsisBtn.style.cursor = "pointer";

  const dropdownMenu = document.createElement("ul");
  dropdownMenu.className = "dropdown-menu";
  if (msg.memberQid === userMemberQid) {
    dropdownMenu.innerHTML = `
      <li class='li-opt'><a class="dropdown-item edit-option"><i class="fa-solid fa-pen" ></i> Edit</a></li>
      <li class='li-opt'><a class="dropdown-item delete-option"><i class="fa-solid fa-trash"  ></i> Delete</a></li>
      <li class='li-opt'><a class="dropdown-item report-option"><i class="fa-solid fa-flag" ></i> Report</a></li>
      <li class='li-opt'><a class="dropdown-item copy-option" href="#"><i class="fa-solid fa-link" ></i> Copy link</a></li>
    `;
  } else {
    dropdownMenu.innerHTML = `
      <li class='li-opt'><a class="dropdown-item report-option"><i class="fa-solid fa-flag" ></i> Report</a></li>
      <li class='li-opt'><a class="dropdown-item copy-option" href="#"><i class="fa-solid fa-link" ></i> Copy link</a></li>
    `;
  }
  dropdownWrapper.appendChild(ellipsisBtn);
  dropdownWrapper.appendChild(dropdownMenu);

  header.appendChild(profileLink);
  header.appendChild(headerRight);
  header.appendChild(dropdownWrapper);

  // --- POST BODY ---
  const body = document.createElement("div");
  body.className = "post-body";

  // Post text with truncation
 if (msg.message) {
  const textP = document.createElement("p");
  textP.className = "post-text";

  if (msg.message.length > 250) {
    const shortText = msg.message.slice(0, 250);
    textP.textContent = shortText + "... ";

    const seeMore = document.createElement("a");
    seeMore.href = "#";
    seeMore.style.cursor = "pointer";
    seeMore.style.textDecoration = "none";
    seeMore.textContent = "see more";

    seeMore.addEventListener("click", (e) => {
      e.preventDefault();
      textP.textContent = msg.message + " ";

      const seeLess = document.createElement("a");
      seeLess.href = "#";
      seeLess.style.cursor = "pointer";
      seeLess.style.textDecoration = "none";
      seeLess.textContent = "see less";

      seeLess.addEventListener("click", (e) => {
        e.preventDefault();
        textP.textContent = shortText + "... ";
        textP.appendChild(seeMore);
      });

      textP.appendChild(seeLess);
    });

    textP.appendChild(seeMore);
  } else {
    textP.textContent = msg.message; // just show short text, no links
  }

  body.appendChild(textP);
}
else{
  const textP = document.createElement("p");
  textP.className = "post-text";
  textP.textContent = "";
  body.appendChild(textP);
}


 // --- MEDIA SECTION ---
 // --- VIDEO OBSERVER ---
// Autoplay when visible, pause when out of view
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    const video = entry.target;
    if (entry.isIntersecting) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  });
}, { threshold: 0.5 });

function observeVideo(video) {
  observer.observe(video);
}


// ================== MAIN MEDIA DISPLAY ==================
if (msg.media_url && msg.media_url.length > 0) {
  const mediaWrapper = document.createElement("div");
  mediaWrapper.className = "post-thumbnail position-relative";
  const carouselId = `carousel-${msg.message_id}`;

  if (msg.media_url.length === 1) {
    const type = msg.media_type[0];
    const itemWrapper = document.createElement("div");
    itemWrapper.className = "blur-wrapper";

    const mediaContainer = document.createElement("div");
    mediaContainer.className = "media-container";

    if (type === "image") {
      const img = document.createElement("img");
      img.src = msg.media_url[0];
      img.className = "post-thumbnail-img";
      img.style.cursor = "pointer";

      // 👇 Click to open full image in toast
      img.addEventListener("click", () => {
        showImageToast(msg.media_url[0]);
      });

      mediaContainer.appendChild(img);
      itemWrapper.style.setProperty("--bg-url", `url(${msg.media_url[0]})`);
    } else if (type === "video") {
      const video = document.createElement("video");
      video.src = msg.media_url[0];
      video.controls = true;
      video.playsInline = true; // ← very important for mobile
      video.setAttribute("webkit-playsinline", "true"); // iOS Safari
      video.muted = true;
      video.loop = true;
      video.className = "post-thumbnail-video";
      mediaContainer.appendChild(video);
      observeVideo(video);
      itemWrapper.style.background = "rgba(0,0,0,0.8)";
    }

    itemWrapper.appendChild(mediaContainer);
    mediaWrapper.appendChild(itemWrapper);
  } else {
    // --- Multiple files -> Carousel ---
    const carousel = document.createElement("div");
    carousel.className = "carousel slide";
    carousel.id = carouselId;
    carousel.setAttribute("data-bs-ride", "carousel");
    carousel.setAttribute("data-bs-interval", "8000");

    const inner = document.createElement("div");
    inner.className = "carousel-inner";

    msg.media_url.forEach((url, index) => {
      const item = document.createElement("div");
      item.className = index === 0 ? "carousel-item active" : "carousel-item";

      const blurWrapper = document.createElement("div");
      blurWrapper.className = "blur-wrapper";

      const mediaContainer = document.createElement("div");
      mediaContainer.className = "media-container";

      if (msg.media_type[index] === "image") {
        const img = document.createElement("img");
        img.src = url;
        img.className = "post-thumbnail-img";
        img.style.cursor = "pointer";

        // 👇 Click to open full image in toast
        img.addEventListener("click", () => {
          showImageToast(url);
        });

        mediaContainer.appendChild(img);
        blurWrapper.style.setProperty("--bg-url", `url(${url})`);
      } else if (msg.media_type[index] === "video") {
        const video = document.createElement("video");
        video.src = url;
        video.controls = true;
        video.playsInline = true; // ← very important for mobile
        video.setAttribute("webkit-playsinline", "true"); // iOS Safari
        video.muted = true;
        video.loop = true;
        video.className = "post-thumbnail-video";
        mediaContainer.appendChild(video);
        observeVideo(video);
        blurWrapper.style.setProperty("--bg-url", `linear-gradient(rgba(0,0,0,0.8), rgba(0,0,0,0.8))`);
      }

      blurWrapper.appendChild(mediaContainer);
      item.appendChild(blurWrapper);
      inner.appendChild(item);
    });

    carousel.appendChild(inner);
    mediaWrapper.appendChild(carousel);

    // --- Counter ---
    const counter = document.createElement("div");
    counter.className = "carousel-counter position-absolute";
    counter.textContent = `1/${msg.media_url.length}`;
    mediaWrapper.appendChild(counter);

    // Buttons
    const prevBtn = document.createElement("button");
    prevBtn.className = "carousel-control-prev";
    prevBtn.type = "button";
    prevBtn.setAttribute("data-bs-target", `#${carouselId}`);
    prevBtn.setAttribute("data-bs-slide", "prev");
    prevBtn.innerHTML = `<span class="carousel-control-prev-icon"></span>`;

    const nextBtn = document.createElement("button");
    nextBtn.className = "carousel-control-next";
    nextBtn.type = "button";
    nextBtn.setAttribute("data-bs-target", `#${carouselId}`);
    nextBtn.setAttribute("data-bs-slide", "next");
    nextBtn.innerHTML = `<span class="carousel-control-next-icon"></span>`;

    mediaWrapper.appendChild(prevBtn);
    mediaWrapper.appendChild(nextBtn);

    carousel.addEventListener("slid.bs.carousel", () => {
      const activeIndex = Array.from(inner.children).findIndex(c => c.classList.contains("active"));
      counter.textContent = `${activeIndex + 1}/${msg.media_url.length}`;
    });
  }

  body.appendChild(mediaWrapper);
}

// --- REPOST SECTION ---
if (msg.repostData) {
  const repost = msg.repostData;

  const repostWrapper = document.createElement("div");
  repostWrapper.className = "repost-wrapper"; // <-- outer container

  // --- Repost Header ---
  const repostHeader = document.createElement("div");
  repostHeader.className = "repost-header";

  const repostProfile = document.createElement("img");
  repostProfile.src = repost.profile_url || "../../assets/img/pf.jpg";
  repostProfile.alt = "repost-user";
  repostProfile.className = "repost-userProfile";

  const repostLink = document.createElement("a");
  repostLink.href = `aboutUser?memberId=${repost.memberQid}`;
  repostLink.appendChild(repostProfile);

  const repostHeaderRight = document.createElement("div");
  repostHeaderRight.className = "repost-header-right";

  const repostheaderRightTop = document.createElement("div");
  repostheaderRightTop.className = "repost-header-child-right-top";

  const repostheaderRightBottom = document.createElement("div");
  repostheaderRightBottom.className = "repost-header-child-right-bottom";

  repostHeaderRight.appendChild(repostheaderRightTop);
  repostHeaderRight.appendChild(repostheaderRightBottom);

  const repostUsername = document.createElement("p");
  repostUsername.className = "repost-username";
  repostUsername.textContent = repost.username || "Unknown";

  const repostFeeling = document.createElement("p");
  repostFeeling.className = "repost-feeling";
  if (repost.feeling)
    repostFeeling.textContent = "is feeling " + (feelingMap[repost.feeling] || repost.feeling);

  const repostTime = document.createElement("p");
  repostTime.className = "repost-time";
  repostTime.textContent = repost.createFormNow;

  repostheaderRightTop.appendChild(repostUsername);
  if (repost.feeling) repostheaderRightTop.appendChild(repostFeeling);
 
  repostheaderRightBottom.appendChild(repostTime);

  repostHeader.appendChild(repostLink);
  repostHeader.appendChild(repostHeaderRight);
  repostWrapper.appendChild(repostHeader);

  // --- Repost Body ---
  const repostBody = document.createElement("div");
  repostBody.className = "repost-body";



   if (repost.message) {
  const textP = document.createElement("p");
  textP.className = "repost-text";

  const fullText = repost.message;

  if (fullText.length > 250) {
    const shortText = fullText.slice(0, 250);

    const span = document.createElement("span");
    span.textContent = shortText + "... "; // initial short text
    textP.appendChild(span);

    const toggleLink = document.createElement("a");
    toggleLink.href = "#";
    toggleLink.textContent = "see more";
    toggleLink.style.cursor = "pointer";
    toggleLink.style.textDecoration = "none";
    textP.appendChild(toggleLink); // append link AFTER span

    toggleLink.addEventListener("click", (e) => {
      e.preventDefault();

      if (toggleLink.textContent === "see more") {
        span.textContent = fullText + " "; // show full text
        toggleLink.textContent = "see less"; // toggle link text
      } else {
        span.textContent = shortText + "... "; // show short text
        toggleLink.textContent = "see more"; // toggle link text
      }
    });

  } else {
    textP.textContent = fullText; // text shorter than 250, no link
  }

  repostBody.appendChild(textP);

} else {
  const textP = document.createElement("p");
  textP.className = "repost-text";
  textP.textContent = "";
  repostBody.appendChild(textP);
}


  // --- Repost Media Section (same logic as your original post) ---
  if (repost.media_url && repost.media_url.length > 0) {
    const repostMediaWrapper = document.createElement("div");
    repostMediaWrapper.className = "repost-thumbnail position-relative";

    const repostCarouselId = `repost-carousel-${repost.message_id}`;

    if (repost.media_url.length === 1) {
      const type = repost.media_type[0];
      const itemWrapper = document.createElement("div");
      itemWrapper.className = "repost-blur-wrapper";

      const mediaContainer = document.createElement("div");
      mediaContainer.className = "repost-media-container";

      if (type === "image") {
        const img = document.createElement("img");
        img.src = repost.media_url[0];
        img.className = "repost-img";
        img.style.cursor = "pointer";
        // 👇 Click to open full image in toast
        img.addEventListener("click", () => {
          showImageToast(repost.media_url[0]);
        });
        mediaContainer.appendChild(img);
        itemWrapper.style.setProperty("--bg-url", `url(${repost.media_url[0]})`);
      } else if (type === "video") {
        const video = document.createElement("video");
        video.src = repost.media_url[0];
        video.controls = true;
        video.playsInline = true; // ← very important for mobile
        video.setAttribute("webkit-playsinline", "true"); // iOS Safari
        video.muted = true;
        video.loop = true;
        video.className = "repost-video";
        mediaContainer.appendChild(video);
        observeVideo(video);
        itemWrapper.style.background = "rgba(0,0,0,0.8)";
      }

      itemWrapper.appendChild(mediaContainer);
      repostMediaWrapper.appendChild(itemWrapper);
    } else {
      // Multiple media (carousel)
      const carousel = document.createElement("div");
      carousel.className = "carousel slide";
      carousel.id = repostCarouselId;
      carousel.setAttribute("data-bs-ride", "carousel");
      carousel.setAttribute("data-bs-interval", "8000");

      const inner = document.createElement("div");
      inner.className = "carousel-inner";

      repost.media_url.forEach((url, index) => {
        const item = document.createElement("div");
        item.className = index === 0 ? "carousel-item active" : "carousel-item";

        const blurWrapper = document.createElement("div");
        blurWrapper.className = "repost-blur-wrapper";

        const mediaContainer = document.createElement("div");
        mediaContainer.className = "repost-media-container";

        if (repost.media_type[index] === "image") {
          const img = document.createElement("img");
          img.src = url;
          img.className = "repost-img";
          img.style.cursor = "pointer";
          mediaContainer.appendChild(img);
            // 👇 Click to open full image in toast
          img.addEventListener("click", () => {
            showImageToast(url);
          });

          blurWrapper.style.setProperty("--bg-url", `url(${url})`);
        } else if (repost.media_type[index] === "video") {
          const video = document.createElement("video");
          video.src = url;
          video.controls = true;
          video.playsInline = true; // ← very important for mobile
          video.setAttribute("webkit-playsinline", "true"); // iOS Safari
          video.muted = true;
          video.loop = true;
          video.className = "repost-video";
          mediaContainer.appendChild(video);
          observeVideo(video);
          blurWrapper.style.setProperty(
            "--bg-url",
            `linear-gradient(rgba(0,0,0,0.8), rgba(0,0,0,0.8))`
          );
        }

        blurWrapper.appendChild(mediaContainer);
        item.appendChild(blurWrapper);
        inner.appendChild(item);
      });

      carousel.appendChild(inner);
      repostMediaWrapper.appendChild(carousel);

      const counter = document.createElement("div");
      counter.className = "repost-carousel-counter position-absolute";
      counter.textContent = `1/${repost.media_url.length}`;
      repostMediaWrapper.appendChild(counter);

      const prevBtn = document.createElement("button");
      prevBtn.className = "carousel-control-prev";
      prevBtn.type = "button";
      prevBtn.setAttribute("data-bs-target", `#${repostCarouselId}`);
      prevBtn.setAttribute("data-bs-slide", "prev");
      prevBtn.innerHTML = `<span class="carousel-control-prev-icon"></span>`;

      const nextBtn = document.createElement("button");
      nextBtn.className = "carousel-control-next";
      nextBtn.type = "button";
      nextBtn.setAttribute("data-bs-target", `#${repostCarouselId}`);
      nextBtn.setAttribute("data-bs-slide", "next");
      nextBtn.innerHTML = `<span class="carousel-control-next-icon"></span>`;

      repostMediaWrapper.appendChild(prevBtn);
      repostMediaWrapper.appendChild(nextBtn);

      carousel.addEventListener("slid.bs.carousel", () => {
        const activeIndex = Array.from(inner.children).findIndex((c) =>
          c.classList.contains("active")
        );
        counter.textContent = `${activeIndex + 1}/${repost.media_url.length}`;
      });
    }

    repostBody.appendChild(repostMediaWrapper);
  }

  repostWrapper.appendChild(repostBody);
  body.appendChild(repostWrapper);
}


  // Like / comment / repost counts
  const counts = document.createElement("div");
  counts.className = "post-media-count";
  counts.innerHTML = `
    <div>
      <p><span class="post-like-count">${msg.like_count || 0}</span> Likes</p>
    </div>
    <div class="post-media-count-child-right">
      <p><span class="post-comment-count">${msg.comment_count || 0}</span> comments</p>
      <p><span class="post-repost-count">${msg.repost_count || 0}</span> reposts</p>
    </div>
  `;
  body.appendChild(counts);

  // --- BUTTONS ---
  const btnRow = document.createElement("div");
  btnRow.className = "post-media-button";

  // Like btn
  const likeBtn = document.createElement("button");
  likeBtn.className = "likeBtn media-btn";
  likeBtn.dataset.id = msg.message_id;
  likeBtn.innerHTML = `<i class="fa-solid fa-heart"></i> <span style="color: grey;">Like</span>`;

  // Favorite btn
  const favBtn = document.createElement("button");
  favBtn.className = "favBtn media-btn";
  favBtn.dataset.id = msg.message_id;
  favBtn.innerHTML = `<i class="fa-solid fa-bookmark"></i> <span style="color: grey;">Favorites<span>`;

  // Comment btn
  const commentBtn = document.createElement("button");
  commentBtn.className = "commentBtn media-btn";
  commentBtn.dataset.id = msg.message_id;
  commentBtn.innerHTML = `<i class="fa-solid fa-comment"></i> <span style="color: grey;">Comment</span>`;
  commentBtn.onclick = () => {
    window.location.href = `commentView.html?postId=${msg.message_id}`;
  };

  // Repost btn
  const repostBtn = document.createElement("button");
  repostBtn.className = "repostBtn media-btn";
  repostBtn.dataset.id = msg.message_id;
  repostBtn.innerHTML = `<i class="fa-solid fa-share-from-square"></i> <span style="color: grey;">Repost</span>`;

  repostBtn.onclick = () => {
     repost_id = msg.message_id;
     postToast.show();
     // Hide media input and preview during repost
    mediaInput.style.display = "none";
    mediaInputLabel.style.display = "none";
    mediaPreview.style.display = "none";
  }

  btnRow.appendChild(likeBtn);
  btnRow.appendChild(favBtn);
  btnRow.appendChild(commentBtn);
  btnRow.appendChild(repostBtn);

  body.appendChild(btnRow);

  // Append together
  div.appendChild(header);
  div.appendChild(body);

  // document.getElementById("message-container").prepend(div);
 
  document.getElementById("message-container").appendChild(div);


  // === Attach like toggle logic ===
  const likeIcon = likeBtn.querySelector("i");
  const likeCount = counts.querySelector(".post-like-count");
  loadLikeInfoForMessage(msg.message_id, likeIcon, likeCount);
  likeBtn.onclick = async () => {
    await toggleLikeActivityForMessage(msg.message_id, likeIcon, likeCount);
  };

  // == Attach fav toggle logic
  const favIcon = favBtn.querySelector("i");
  // const favCount = counts.querySelector(".post-favorite-count");
  loadFavInfoForMessage(msg.message_id, favIcon,);
  favBtn.onclick = async () => {
     await toggleFavActivityForMessage(msg.message_id, favIcon);
  }

  // === Dropdown click handlers ===
  dropdownMenu.querySelectorAll("a").forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      if (item.classList.contains("edit-option")) {
        editingMessageId = msg.message_id;
        editInput.value = msg.message;
        editToast.show();
      } else if (item.classList.contains("delete-option")) {
        deletingMessageId = msg.message_id;
        deleteToast.show();
      } else if (item.classList.contains("report-option")) {
        reportingTargetId = msg.message_id;
        reportToast.show();
      }
      else if (item.classList.contains("copy-option")) {
        const copyUrl = `https://thebooksourcings.onrender.com/chat/community/commentView.html?postId=${msg.message_id}`;
        // Copy to clipboard
        navigator.clipboard.writeText(copyUrl).then(() => {
          // Change text to "✅ Copied link"
          const originalText = '<i class="fa-solid fa-link" style="color:blue"></i> Copy link';
          item.textContent = "✅ Copied link";

          // Optional: revert back after 2 seconds
          setTimeout(() => {
            item.innerHTML = originalText;
          }, 10000);
        }).catch((err) => {
          console.error("Failed to copy link:", err);
        });
      }
    });
  });

  // return div; 
}


// ====== LIKE FUNCTIONS ======
async function loadLikeInfoForMessage(messageId, likeIcon, likeCount) {
  try {
    const res = await fetch(`${API_URL}/api/communityPostLike/status/${messageId}`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Failed to fetch like status");

    const data = await res.json();
    likeCount.textContent = data.post.like_count;
    likeIcon.style.color = data.userStatus.liked ? "red" : "gray";
  } catch (err) {
    console.error(err);
  }
}

// ===== ADD tO FAVOURITES =====

async function loadFavInfoForMessage(messageId, favIcon){
  try{
    const res = await fetch(`${API_URL}/api/communityPostFav/status/${messageId}`,{
      headers: { "Authorization": `Bearer ${token}`}
    });

    const data = await res.json();
    // favCount.textContent = data.post.favorite_count;
    favIcon.style.color = data.userStatus.favorited ? "orange" : "gray";

  }
  catch(err){
    console.error(err)
  }
}

async function toggleLikeActivityForMessage(messageId, likeIcon, likeCount) {
  try {
    const res = await fetch(`${API_URL}/api/communityPostLike/like/${messageId}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    if (!res.ok) {
      if (res.status === 403) {
        showErrorToast("Unauthorized. Please log in or sign up first.");
     
      } else {
        const errorText = await res.text();
        showErrorToast("Error: " + errorText);
      }
      return;
    }

    const data = await res.json();
    likeIcon.style.color = data.liked ? "red" : "gray";
    await loadLikeInfoForMessage(messageId, likeIcon, likeCount);

  } catch (err) {
    console.error(err);
    showErrorToast("Unexpected error occurred.");
  }
}

// toggleFav
async function toggleFavActivityForMessage(messageId, favIcon ){
  try{

    const res = await fetch(`${API_URL}/api/communityPostFav/save/${messageId}`,{
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });
    // if(!res.ok) throw new Error("Failed to toggle like");
     if (!res.ok) {
      if (res.status === 403) {
        showErrorToast("Unauthorized. Please log in or sign up first.");
      } else {
        const errorText = await res.text();
        showErrorToast("Error: " + errorText);
      }
      return;
    }
    const data = await res.json();
    favIcon.style.color = data.favorited ? "orange" : "gray";
    await loadFavInfoForMessage(messageId, favIcon);
  }
  catch(err){
    console.error(err)
  }

}


// ====== EDIT  Fetch======
document.getElementById("saveEditBtn").onclick = async () => {
  const newText = editInput.value.trim();
  if (!newText || !editingMessageId) return;
  try {
    await fetch(`${API_URL}/api/community/edit`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ message_id: editingMessageId, newText })
    });
    socket.emit("edit-message", { message_id: editingMessageId, newText });
    editToast.hide();
    editingMessageId = null;
  } catch (err) {
    console.error(err);
  }
};

// ====== DELETE Fetch ======
document.getElementById("confirmDeleteBtn").onclick = async () => {
  if (!deletingMessageId) return;
  try {
    await fetch(`${API_URL}/api/community/delete`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ message_id: deletingMessageId })
    });
    socket.emit("delete-message", { message_id: deletingMessageId });
    deleteToast.hide();
    deletingMessageId = null;
  } catch (err) {
    console.error(err);
  }
};

// ====== REPORT Fetch======
document.getElementById("submitReportBtn").onclick = async () => {
  const reasonTxt = reportReasonInput.value.trim();
  if (!reasonTxt || !reportingTargetId) return;

  try {
    const res = await fetch(`${API_URL}/api/community/report`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        reasonTxt,
        reportTypeFrom_id: reportingTargetId
      })
    });

    // if (!res.ok) throw new Error("Failed to submit report");
     if (!res.ok) {
      if (res.status === 403) {
        showErrorToast("Unauthorized. Please log in or sign up first.");
      } else {
        const errorText = await res.text();
        showErrorToast("Error: " + errorText);
      }
      return;
    }

    const data = await res.json();
    alert(data.message);
    reportToast.hide();
    reportingTargetId = null;
    reportReasonInput.value = "";
  } catch (err) {
    console.error("Report error:", err);
  }
};

 // Post toast
  const postToast = new bootstrap.Toast(document.getElementById("PostToast"), { autohide: false });
  const postBtn = document.getElementById("post-btn");

  postBtn.addEventListener("click", () => {
    postToast.show();
  });

  document.getElementById("cancelPostBtn").onclick = () => {
    postToast.hide();
    messageInput.value = "";
    mediaInput.value = "";
    mediaPreview.innerHTML = "";
    feelingInput.value = "";
    selectedFile = null;
    displayFeeling.textContent = "";

    // Restore media inputs visibility
    mediaInput.style.display = "";
    mediaPreview.style.display = "";
    mediaInputLabel.style.display = "";
    repost_id = null; // clear repost mode
  };

// ====== CANCEL BUTTONS ======

// cancel edit btn
document.getElementById("cancelEditBtn").onclick = () => {
  editingMessageId = null;
  editToast.hide();
};


// cancel delete btn
document.getElementById("cancelDeleteBtn").onclick = () => {
  deletingMessageId = null;
  deleteToast.hide();
};

// cancel report btn
document.getElementById("cancelReportBtn").onclick = () => {
  reportingTargetId = null;
  reportReasonInput.value = "";
  reportToast.hide();
};

    // Cancel button
    document.getElementById("cancelFeelingBtn").onclick = () => {
      FeelingToast.hide();
      displayFeeling.textContent = "";
      feelingInput.value = "";
    };

// === Image Toast Logic ===
const imageToastWrapper = document.getElementById("imageToastWrapper");
const imgToast = document.getElementById("imgToast");
const toastImage = document.getElementById("toastImage");
const toastCloseBtn = document.getElementById("toastCloseBtn");

// Bootstrap Toast instance
const bsToast = new bootstrap.Toast(imgToast, { autohide: false });

// Show image viewer
function showImageToast(src) {
  if (!src) return;
  toastImage.src = src;
  bsToast.show();
  document.body.classList.add("toast-open");
}

function hideImageToast() {
  bsToast.hide();
  toastImage.src = "";
  document.body.classList.remove("toast-open");
}
function showErrorToast(message) {
  const toastEl = document.getElementById('errorToast');
  const toastBody = document.getElementById('errorToastBody');
  toastBody.textContent = message;

  const toast = new bootstrap.Toast(toastEl);
  toast.show();
}


// Close when clicking the ✖️ button
toastCloseBtn.addEventListener("click", hideImageToast);














// DOM END
});

