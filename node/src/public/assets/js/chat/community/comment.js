
// Get the post_id (message_id) fro url to displayPostById
const urlParams = new URLSearchParams(window.location.search);
const postId = urlParams.get("postId");

// ====== DECLARATIONS FOR POST======
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


// Global URL of TheBooksourcing
const API_URL = "https://thebooksourcings.onrender.com";

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


// Token from localStorage for using to communicate with sever by each user
 function parseJwt (token) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
}

const token = localStorage.getItem("token");
let userMemberQid = null;
let username = null;

if (token) {
  const decoded = parseJwt(token);
  userMemberQid = decoded?.memberQid || null;
  username = decoded?.username || null;
}



const socket = io(API_URL, { auth: { token } });


// ====== SOCKET LISTENERS ======
socket.on("connect", () => console.log("Connected:", socket.id));

socket.on("message-updated", ({ message_id, newText }) => {
  const div = document.querySelector(`div[data-id='${message_id}']`);
  if (div) div.querySelector(".post-text").textContent = newText;

});

socket.on("message-deleted", ({ message_id }) => {
  const div = document.querySelector(`div[data-id='${message_id}']`);
  if (div) div.remove();
});


// Fetch to load the post by id
fetch(`${API_URL}/api/communityComment/display/${postId}`)
.then(res => res.json())
.then(displayPostById)
.catch(err => {
    console.error("fetch the displayCommentById error : ", err.message)
})

function displayPostById(msg) {
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

  const usernameLink = document.createElement("a");
  usernameLink.href = `aboutUser?memberId=${msg.memberQid}`;
  usernameLink.textContent = msg.username || "Unknown";
  usernameLink.className = "username";
  usernameLink.style.cursor = "pointer";
  usernameLink.style.margin = "0";
  headerRightTop.appendChild(usernameLink);

  if (msg.feeling) {
    const feeling = document.createElement("a");
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
      <li><a class="dropdown-item edit-option" href="#">Edit</a></li>
      <li><a class="dropdown-item delete-option" href="#">Delete</a></li>
      <li><a class="dropdown-item report-option" href="#">Report</a></li>
    `;
  } else {
    dropdownMenu.innerHTML = `
      <li><a class="dropdown-item report-option" href="#">Report</a></li>
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

// --- DISPLAY MESSAGE ---
if (msg.media_url && msg.media_url.length > 0) {
  const mediaWrapper = document.createElement("div");
  mediaWrapper.className = "post-thumbnail position-relative"; // allow overlay

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
      mediaContainer.appendChild(img);

      itemWrapper.style.setProperty("--bg-url", `url(${msg.media_url[0]})`);
    } else if (type === "video") {
      const video = document.createElement("video");
      video.src = msg.media_url[0];
      video.controls = true;
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
    // --- Multiple files -> Bootstrap carousel ---
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
    mediaContainer.appendChild(img);

    // ✅ set --bg-url for blur
    blurWrapper.style.setProperty("--bg-url", `url(${url})`);
  } else if (msg.media_type[index] === "video") {
    const video = document.createElement("video");
    video.src = url;
    video.controls = true;
    video.muted = true;
    video.loop = true;
    video.className = "post-thumbnail-video";
    mediaContainer.appendChild(video);
    observeVideo(video);

    // ✅ fallback for blur: set --bg-url to a dark transparent color
    blurWrapper.style.setProperty("--bg-url", `linear-gradient(rgba(0,0,0,0.8), rgba(0,0,0,0.8))`);
  }

  blurWrapper.appendChild(mediaContainer);
  item.appendChild(blurWrapper);
  inner.appendChild(item);
});

    carousel.appendChild(inner);
    mediaWrapper.appendChild(carousel);

    // --- Modern counter ---
    const counter = document.createElement("div");
    counter.className = "carousel-counter position-absolute";
    counter.textContent = `1/${msg.media_url.length}`;
    mediaWrapper.appendChild(counter);

    // Prev/Next buttons
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

    // Update counter on slide change
    carousel.addEventListener("slid.bs.carousel", () => {
      const activeIndex = Array.from(inner.children).findIndex(c => c.classList.contains("active"));
      counter.textContent = `${activeIndex + 1}/${msg.media_url.length}`;
    });
  }

  body.appendChild(mediaWrapper);
}

  // Like / comment / repost counts
  const counts = document.createElement("div");
  counts.className = "post-media-count";
  counts.innerHTML = `
    <div>
      <p><span class="post-like-count">${msg.like_count || 0}</span> Likes</p>
    </div>
    <div class="post-media-count-child-right">
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
  likeBtn.innerHTML = `<i class="fa-solid fa-heart"></i> <span>Like</span>`;

 

  // Repost btn
  const repostBtn = document.createElement("button");
  repostBtn.className = "repostBtn media-btn";
  repostBtn.dataset.id = msg.message_id;
  repostBtn.innerHTML = `<i class="fa-solid fa-share-from-square"></i> <span>Repost</span>`;

  btnRow.appendChild(likeBtn);

  btnRow.appendChild(repostBtn);

  body.appendChild(btnRow);

  // Append together
  div.appendChild(header);
  div.appendChild(body);
  document.getElementById("message-container").prepend(div);

  // === Attach like toggle logic ===
  const likeIcon = likeBtn.querySelector("i");
  const likeCount = counts.querySelector(".post-like-count");
  loadLikeInfoForMessage(msg.message_id, likeIcon, likeCount);
  likeBtn.onclick = async () => {
    await toggleLikeActivityForMessage(msg.message_id, likeIcon, likeCount);
  };

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
    });
  });
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

async function toggleLikeActivityForMessage(messageId, likeIcon, likeCount) {
  try {
    const res = await fetch(`${API_URL}/api/communityPostLike/like/${messageId}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });
    if (!res.ok) throw new Error("Failed to toggle like");

    const data = await res.json();
    likeIcon.style.color = data.liked ? "red" : "gray";
    await loadLikeInfoForMessage(messageId, likeIcon, likeCount);
  } catch (err) {
    console.error(err);
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

    if (!res.ok) throw new Error("Failed to submit report");

    const data = await res.json();
    alert(data.message);
    reportToast.hide();
    reportingTargetId = null;
    reportReasonInput.value = "";
  } catch (err) {
    console.error("Report error:", err);
  }
};


// ====== CANCEL BUTTONS For POST======

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



// POST COMMENT LOGICAL
// get username to display on user comment form
const usernameFromComment = document.querySelector(".usernameFromComment");
if (username) {
  usernameFromComment.textContent = username;
}

// ====== SEND Comment Declaration ======
const form = document.getElementById("form-comment");
const commentInput = document.getElementById("comment-input");
const mediaCommentInput = document.getElementById("mediaCommentInput");
const mediaCommentPreview = document.getElementById("media-comment-preview");

let selectedFile = null;

// Show preview when user selects a file
mediaCommentInput.addEventListener("change", () => {
  selectedFile = mediaCommentInput.files[0];
  mediaCommentPreview.innerHTML = ""; // clear previous preview

  if (!selectedFile) return;

  if (selectedFile.type.startsWith("image/")) {
    const img = document.createElement("img");
    img.src = URL.createObjectURL(selectedFile);
    img.style.maxWidth = "200px";
    img.style.marginTop = "5px";
    mediaCommentPreview.appendChild(img);
  } else if (selectedFile.type.startsWith("video/")) {
    const video = document.createElement("video");
    video.src = URL.createObjectURL(selectedFile);
    video.controls = true;
    video.style.maxWidth = "200px";
    video.style.marginTop = "5px";
    mediaCommentPreview.appendChild(video);
  }
});

// Send message (text + optional media)
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const text = commentInput.value.trim();

  if (!text && !selectedFile ) return; // must have text or media

  try {
    const formData = new FormData();
    formData.append("commentText", text);
    formData.append("postId", postId);
    if (selectedFile) formData.append("media", selectedFile);

    const res = await fetch(`${API_URL}/api/communityComment/comment`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` },
      body: formData
    });

    if (!res.ok) throw new Error("Failed to send message");

    const savedCmt = await res.json();
    savedCmt.createFormNow = "just now"; // instant display
    displayComment(savedCmt);
    socket.emit("send-comment", savedCmt);

    // Reset form
    commentInput.value = "";
    mediaCommentInput.value = "";
    mediaCommentPreview.innerHTML = "";
    selectedFile = null;
    commentToast.hide();
  } catch (err) {
    console.error(err);
  }
});



 


// ====== DECLARATIONS FOR Comment======
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


socket.on("receive-comment", (cmt) => {
  if (!cmt.createFormNow) cmt.createFormNow = "just now";
  displayComment(cmt);
});

socket.on("comment-updated", ({ comment_id, newComment }) => {
  const div = document.querySelector(`div[data-id='${comment_id}']`);
  if (div) div.querySelector(".comment-text").textContent = newComment;

});

socket.on("comment-deleted", ({ comment_id }) => {
  const div = document.querySelector(`div[data-id='${comment_id}']`);
  if (div) div.remove();
});
    
    

// ====== LOAD ALL Comment ======
async function loadComment() {
  try {
    const res = await fetch(`${API_URL}/api/communityComment/dipslayAllComments/${postId}`);
    if (!res.ok) throw new Error("Failed to fetch messages");
    const cmts = await res.json();
    cmts.forEach(displayComment);
  } catch (err) {
    console.error("Error loading messages:", err);
  }
}
loadComment();


// ====== DISPLAY Comment ======
function displayComment(cmt) {
  const div = document.createElement("div");
  div.className = "comment"; // div of comment
  div.dataset.id = cmt.comment_id;

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

  // Username link
  

  const headerRight = document.createElement("div");
  headerRight.className = "comment-header-child-right";

  const headerRightTop = document.createElement("div");
  headerRightTop.className = "comment-header-child-right-top"; // user to be flex now no need

  const headerRightBottom = document.createElement("div");
  headerRightBottom.className = "comment-header-child-right-bottom";

  headerRight.appendChild(headerRightTop);
  headerRight.appendChild(headerRightBottom);

  const usernameLink = document.createElement("a");
  usernameLink.href = `aboutUser?memberId=${cmt.memberQid}`;
  usernameLink.textContent = cmt.username || "Unknown";
  usernameLink.className = "username";
  headerRightTop.appendChild(usernameLink);

  
  const postAt = document.createElement("p");
  postAt.className = "postAt";
  postAt.textContent = cmt.createFormNow || "just now";
  headerRightBottom.appendChild(postAt);

  

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

  header.appendChild(profileLink);
  header.appendChild(headerRight);
  header.appendChild(dropdownWrapper);

  // --- Comment BODY ---
  const body = document.createElement("div");
  body.className = "comment-body";

  const footer = document.createElement("div");
  footer.className = "comment-reply-footer";

  // const showReply = document.createElement("p");
  // showReply.textContent = "Show Reply";
  // const unShowReply = document.createElement("p");
  // unShowReply.textContent = "Hide Reply";
  // unShowReply.style.display = "none";

  // showReply.addEventListener("click", () => {
  //   footer.style.display = "block";
  //   showReply.style.display = "none";
  //   unShowReply.style.display = "block";
  // });

  // unShowReply.addEventListener("click", () => {
  //   footer.style.display = "none";
  //   showReply.style.display = "block";
  //   unShowReply.style.display = "none";
  // });
  
  

  // Post text with truncation
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

    body.appendChild(textP);
  }
  else{
    const textP = document.createElement("p");
    textP.className = "comment-text";
    textP.textContent = "";
    body.appendChild(textP);
  }

 
  // Media of comment
if (cmt.media_url && cmt.media_type) {
  const mediaWrapper = document.createElement("div");
  mediaWrapper.className = "comment-thumbnail";

  // Only apply blur background for images
  if (cmt.media_type === "image" && !cmt.media_url.startsWith("blob:")) {
    mediaWrapper.style.setProperty("--bg-url", `url(${cmt.media_url})`);
  }

  const mediaEl = document.createElement(cmt.media_type === "image" ? "img" : "video");
  mediaEl.className = "comment-thumbnail-img";
  mediaEl.src = cmt.media_url;

  if (cmt.media_type === "video") mediaEl.controls = true;

  mediaWrapper.appendChild(mediaEl);
  body.appendChild(mediaWrapper);
}


  // Like / comment / repost counts
  const counts = document.createElement("div");
  counts.className = "comment-media-count";
  counts.innerHTML = `
    <div>
      <p><span class="comment-like-count">${cmt.like_count || 0}</span> Likes</p>
    </div>
    <div class="post-media-count-child-right">
      <p><span class="comment-reply-count">${cmt.reply_count || 0}</span> reply</p>
     
    </div>
  `;
  body.appendChild(counts);

  // --- BUTTONS ---
  const btnRow = document.createElement("div");
  btnRow.className = "comment-media-button";

  // Like btn
  const likeBtn = document.createElement("button");
  likeBtn.className = "likeCmtBtn media-btn";
  likeBtn.dataset.id = cmt.comment_id;
  likeBtn.innerHTML = `<i class="fa-solid fa-heart"></i> <span>Like</span>`;

  // ===========reply logic will work at home today=====

// ===== Reply Btn =====
  const replyBtn = document.createElement("button");
  replyBtn.className = "replyBtn media-btn";
  replyBtn.dataset.id = cmt.commentQid; // pass commentQid
  replyBtn.innerHTML = `<i class="fa-solid fa-reply"></i> <span>Reply</span>`;

  // Show ReplyToast and set typeOfId
  replyBtn.addEventListener("click", () => {
    typeOfId = cmt.commentQid; // set global typeOfId for formReply
    ReplyToast.show();
  });

  btnRow.appendChild(replyBtn);

 

  btnRow.appendChild(likeBtn);
  // btnRow.appendChild(commentBtn); maybe this turn to reply then there will be another fect oad and also two more like logic ...
 

  body.appendChild(btnRow);





  // Append together
  div.appendChild(header);
  div.appendChild(body);

  div.appendChild(footer);
  // if (cmt.reply_count !== 0) {
  //   div.appendChild(footer);
  //   div.appendChild(showReply);
  //   div.appendChild(unShowReply);

  
  //   footer.style.display = "none";
  //   unShowReply.style.display = "none";

 
  //   showReply.addEventListener("click", () => {
  //     footer.style.display = "block";
  //     unShowReply.style.display = "block";
  //     showReply.style.display = "none";
  //   });

  
  //   unShowReply.addEventListener("click", () => {
  //     footer.style.display = "none";
  //     unShowReply.style.display = "none";
  //     showReply.style.display = "block";
  //   });
  // }


  document.getElementById("comment-container").prepend(div);

  // === Attach like toggle logic ===
  const likeIcon = likeBtn.querySelector("i");
  const likeCount = counts.querySelector(".comment-like-count");
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
    const res = await fetch(`${API_URL}/api/communityCommentLike/status/${commentId}`, {
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
    const res = await fetch(`${API_URL}/api/communityCommentLike/like/${commentId}`, {
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


// ====== EDIT  Comment Fetch======
document.getElementById("saveEditCommentBtn").onclick = async () => {
  const newComment = editCommentInput.value.trim();
  if (!newComment || !editingCommentId) return;
  try {
    await fetch(`${API_URL}/api/communityComment/edit/comment`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ comment_id: editingCommentId, newComment })
    });
    socket.emit("edit-comment", { comment_id: editingCommentId, newComment });
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
    await fetch(`${API_URL}/api/communityComment/delete/comment`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ comment_id: deletingCommentId })
    });
    socket.emit("delete-comment", { comment_id: deletingCommentId });
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
    const res = await fetch(`${API_URL}/api/community/reportComment`, {
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



 // comment toast
  const commentToast = new bootstrap.Toast(document.getElementById("commentToast"), { autohide: false });
  const commentBtn = document.getElementById("commentButton");

  commentBtn.addEventListener("click", () => {
    commentToast.show();
  });

 


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

// cancel comment btn 
 document.getElementById("cancelCommentBtn").onclick = () => {
    commentToast.hide();
    commentInput.value = "";
    mediaCommentInput.value = "";
    mediaCommentPreview.innerHTML = "";
    selectedFile = null;
  };

  

// Reply  LOGICAL
// get username to display on user comment form
const usernameFromReply = document.querySelector(".usernameFromReply");
if (username) {
  usernameFromReply.textContent = username;
}

// ====== SEND Comment Declaration ======
const formReply = document.getElementById("form-Reply");
const ReplyInput = document.getElementById("Reply-input");
const mediaReplyInput = document.getElementById("mediaReplyInput");
const mediaReplyPreview = document.getElementById("media-Reply-preview");

let selectedReplyFile = null;

// Show preview when user selects a file
mediaReplyInput.addEventListener("change", () => {
  selectedReplyFile = mediaReplyInput.files[0];
  mediaReplyPreview.innerHTML = ""; // clear previous preview

  if (!selectedReplyFile) return;

  if (selectedReplyFile.type.startsWith("image/")) {
    const img = document.createElement("img");
    img.src = URL.createObjectURL(selectedReplyFile);
    img.style.maxWidth = "200px";
    img.style.marginTop = "5px";
    mediaReplyPreview.appendChild(img);
  } else if (selectedReplyFile.type.startsWith("video/")) {
    const video = document.createElement("video");
    video.src = URL.createObjectURL(selectedReplyFile);
    video.controls = true;
    video.style.maxWidth = "200px";
    video.style.marginTop = "5px";
    mediaReplyPreview.appendChild(video);
  }
});

// Send message (text + optional media)
formReply.addEventListener("submit", async (e) => {
  e.preventDefault();

  const text = ReplyInput.value.trim();

  if (!text && !selectedReplyFile ) return; // must have text or media

  try {
    const formData = new FormData();
    formData.append("replyText", text);
    formData.append("typeOfId", typeOfId);  // this will accept the commentQid or replyQid when ever the click the reply 
    if (selectedReplyFile) formData.append("media", selectedReplyFile);

    const res = await fetch(`${API_URL}/api/communityReply/Reply`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` },
      body: formData
    });

    if (!res.ok) throw new Error("Failed to send reply");

    const savedReply = await res.json();
    savedReply.createFormNow = "just now"; // instant display
    displayReply(savedReply);
    socket.emit("send-reply", savedReply);

    // Reset form
    ReplyInput.value = "";
    mediaReplyInput.value = "";
    mediaReplyPreview.innerHTML = "";
    selectedReplyFile = null;
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


socket.on("receive-reply", (rpy) => {
  if (!rpy.createFormNow) rpy.createFormNow = "just now";
  displayReply(rpy);
});

// socket.on("receive-reply", (rpy) => {
//   if (!rpy.createFormNow) rpy.createFormNow = "just now";
//   displayReply(rpy);

//   // Find parent comment/reply
//   const parent = document.querySelector(`div[data-id='${rpy.replyBackTo_id}']`);
//   if (parent) {
//     const showBtn = parent.querySelector(".show-reply-btn");
//     const unShowBtn = parent.querySelector(".unshow-reply-btn");
//     const footer = parent.querySelector(".comment-reply-footer");

//     // Increment reply_count on the button
//     let current = parseInt(showBtn.dataset.count || "0", 10);
//     current++;
//     showBtn.dataset.count = current;
//     showBtn.textContent = `Show ${current} replies`;

//     // Make sure toggle buttons are visible
//     if (showBtn.style.display === "none" && footer.style.display === "none") {
//       showBtn.style.display = "block";
//     }
//   }
// });


socket.on("reply-updated", ({ reply_id, newReply }) => {
  const div = document.querySelector(`div[data-id='${reply_id}']`);
  if (div) div.querySelector(".reply-text").textContent = newReply;

});

// socket.on("reply-deleted", ({ reply_id }) => {
//   const div = document.querySelector(`div[data-id='${reply_id}']`);
//   if (div) {
//     // Find parent before removing
//     const parent = div.closest(".comment, .reply");
//     if (parent) {
//       const showBtn = parent.querySelector(".show-reply-btn");
//       let current = parseInt(showBtn.dataset.count || "0", 10);
//       current = Math.max(current - 1, 0);
//       showBtn.dataset.count = current;
//       showBtn.textContent = current > 0 ? `Show ${current} replies` : "";
//       if (current === 0) showBtn.style.display = "none";
//     }
//     div.remove();
//   }
// });


socket.on("reply-deleted", ({ reply_id }) => {
  const div = document.querySelector(`div[data-id='${reply_id}']`);
  if (div) div.remove();
});
    
    

// ====== LOAD ALL Reply 
// 
async function loadReply(parentQid) {  //
  try {
    const res = await fetch(`${API_URL}/api/communityReply/dipslayAllReplys/${parentQid}`);
    if (!res.ok) throw new Error("Failed to fetch Reply");
    const replies = await res.json();
    replies.forEach(displayReply);
  } catch (err) {
    console.error("Error loading replies:", err);
  }
}
// async function loadReply(parentId) {
//   try {
//     const res = await fetch(`${API_URL}/api/communityReply/dipslayAllReplys/${parentId}`);
//     if (!res.ok) throw new Error("Failed to fetch replies");
//     const replies = await res.json();

//     replies.forEach(rpy => displayReply(rpy));
//   } catch (err) {
//     console.error(err);
//   }
// }






// async function loadReply() {
//   try {
//     const res = await fetch(`${API_URL}/api/communityReply/dipslayAllReplys/${postId}`);
//     if (!res.ok) throw new Error("Failed to fetch Reply");
//     const cmts = await res.json();
//     cmts.forEach(displayReply);
//   } catch (err) {
//     console.error("Error loading messages:", err);
//   }
// }
// loadReply();


// ====== DISPLAY Reply======
function displayReply(rpy) {
  const div = document.createElement("div");
  div.className = "reply"; // div of comment
  div.dataset.id = rpy.reply_id;

  // --- comment header HEADER ---
  const header = document.createElement("div");
  header.className = "reply-header"; // div header of comment

  const profileImg = document.createElement("img");
  profileImg.src = rpy.profile_url || "../../assets/img/pf.jpg"; // placeholder
  profileImg.alt = "user-profile-rpy";
  profileImg.className = "userReplyProfile"; // user Pf on rpy div

  // Wrap profile image in link
  const profileLink = document.createElement("a");
  profileLink.href = `aboutUser?memberId=${rpy.memberQid}`; // user name on rpy div href to their account
  profileLink.appendChild(profileImg);

  // Username link
  

  const headerRight = document.createElement("div");
  headerRight.className = "reply-header-child-right";

  const headerRightTop = document.createElement("div");
  headerRightTop.className = "reply-header-child-right-top"; // user to be flex now no need

  const headerRightBottom = document.createElement("div");
  headerRightBottom.className = "reply-header-child-right-bottom";

  headerRight.appendChild(headerRightTop);
  headerRight.appendChild(headerRightBottom);

  const usernameLink = document.createElement("a");
  usernameLink.href = `aboutUser?memberId=${rpy.memberQid}`;
  usernameLink.textContent = rpy.username || "Unknown";
  usernameLink.className = "username";
  headerRightTop.appendChild(usernameLink);

  
  const replyAt = document.createElement("p");
  replyAt.className = "replyAt";
  replyAt.textContent = rpy.createFormNow || "just now";
  headerRightBottom.appendChild(replyAt);

  

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

  header.appendChild(profileLink);
  header.appendChild(headerRight);
  header.appendChild(dropdownWrapper);

  // ---reply BODY ---
  const body = document.createElement("div");
  body.className = "reply-body";

  // reply text with truncation
  if (rpy.reply) {
    const textP = document.createElement("p");
    textP.className = "reply-text";

    if (rpy.reply.length > 250) {
      const shortText = rpy.reply.slice(0, 250);
      textP.textContent = shortText + "... ";

      const seeMore = document.createElement("a");
      seeMore.href = "#";
      seeMore.textContent = "see more";
      seeMore.addEventListener("click", (e) => {
        e.preventDefault();
        textP.textContent = rpy.reply; // show full text
      });

      textP.appendChild(seeMore);
    } else {
      textP.textContent = rpy.reply;
    }

    body.appendChild(textP);
  }
  else{
    const textP = document.createElement("p");
    textP.className = "reply-text";
    textP.textContent = "";
    body.appendChild(textP);
  }

 
  // Media of comment
if (rpy.media_url && rpy.media_type) {
  const mediaWrapper = document.createElement("div");
  mediaWrapper.className = "reply-thumbnail";

  // Only apply blur background for images
  if (rpy.media_type === "image" && !rpy.media_url.startsWith("blob:")) {
    mediaWrapper.style.setProperty("--bg-url", `url(${rpy.media_url})`);
  }

  const mediaEl = document.createElement(rpy.media_type === "image" ? "img" : "video");
  mediaEl.className = "reply-thumbnail-img";
  mediaEl.src = rpy.media_url;

  if (rpy.media_type === "video") mediaEl.controls = true;

  mediaWrapper.appendChild(mediaEl);
  body.appendChild(mediaWrapper);
}


  // Like / comment / repost counts
  const counts = document.createElement("div");
  counts.className = "reply-media-count";
  counts.innerHTML = `
    <div>
      <p><span class="reply-like-count">${rpy.like_count || 0}</span> Likes</p>
    </div>
    <div class="post-media-count-child-right">
      <p><span class="reply-reply-count">${rpy.reply_count || 0}</span> reply</p>
     
    </div>
  `;
  body.appendChild(counts);

  // --- BUTTONS ---
  const btnRow = document.createElement("div");
  btnRow.className = "reply-media-button";

  // Like btn
  const likeBtn = document.createElement("button");
  likeBtn.className = "likerpyBtn media-btn";
  likeBtn.dataset.id = rpy.reply_id;
  likeBtn.innerHTML = `<i class="fa-solid fa-heart"></i> <span>Like</span>`;

  // ===========reply logic will work at home today=====

// ===== Reply Btn =====
  const replyBtn = document.createElement("button");
  replyBtn.className = "replyBtn media-btn";
  replyBtn.dataset.id = rpy.replyQid; // pass replyQid
  replyBtn.innerHTML = `<i class="fa-solid fa-reply"></i> <span>Reply</span>`;

  // Show ReplyToast and set typeOfId
  replyBtn.addEventListener("click", () => {
    typeOfId = rpy.replyQid; // set global typeOfId for formReply
    ReplyToast.show();
  });

  btnRow.appendChild(replyBtn);

 

  btnRow.appendChild(likeBtn);
  // btnRow.appendChild(commentBtn); maybe this turn to reply then there will be another fect oad and also two more like logic ...
 

  body.appendChild(btnRow);

  // Append together
  div.appendChild(header);
  div.appendChild(body);
  

// Find the correct footer to append this reply
// let parentFooter;
// if (rpy.replyBackTo_id.startsWith("COMM")) {
//   parentFooter = document.querySelector(`div[data-id='${rpy.replyBackTo_id}'] .comment-reply-footer`);
// } else if (rpy.replyBackTo_id.startsWith("REP")) {
//   parentFooter = document.querySelector(`div[data-id='${rpy.replyBackTo_id}'] .comment-reply-footer`);
// }


// if (parentFooter) {
//   parentFooter.appendChild(div);
//   parentFooter.style.display = "block"; // make sure visible
// }
document.querySelector('.comment-reply-footer').appendChild(div);
//  parentFooter.appendChild(div);
  // === Attach like toggle logic ===
  const likeIcon = likeBtn.querySelector("i");
  const likeCount = counts.querySelector(".reply-like-count");
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



// ====== LIKE FUNCTIONS FOR COMMENT ======
async function loadLikeInfoForReply(replyId, likeIcon, likeCount) {
  try {
    const res = await fetch(`${API_URL}/api/communityReplyLike/status/${replyId}`, {
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
    const res = await fetch(`${API_URL}/api/communityReplyLike/like/${replyId}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });
    if (!res.ok) throw new Error("Failed to toggle like");

    const data = await res.json();
    likeIcon.style.color = data.liked ? "red" : "gray";
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
    await fetch(`${API_URL}/api/communityReply/edit/reply`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ reply_id: editingReplyId, newReply })
    });
    socket.emit("edit-reply", { reply_id: editingReplyId, newReply });
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
    await fetch(`${API_URL}/api/communityReply/delete/reply`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ reply_id: deletingReplyId })
    });
    socket.emit("delete-reply", { reply_id: deletingReplyId });
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
    const res = await fetch(`${API_URL}/api/community/reportReply`, {
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
  // const ReplyBtn = document.getElementById("ReplyButton");

  // ReplyBtn.addEventListener("click", () => {
  //   ReplyToast.show();
  // });

 


// ====== CANCEL BUTTONS Reply ======
// cancel edit btn
document.getElementById("cancelEditReplyBtn").onclick = () => {
  editingReplyId = null;
  editReplyToast.hide();
};


// cancel delete btn
document.getElementById("cancelDeleteReplyBtn").onclick = () => {
  deletingReplyId = null;
  deleteReplyToast.hide();
};

// cancel report btn
document.getElementById("cancelReportReplyBtn").onclick = () => {
  reportingTargetReplyId = null;
  reportReasonReplyInput.value = "";
  reportReplyToast.hide();
};

// cancel Reply btn 
 document.getElementById("cancelReplyBtn").onclick = () => {
    ReplyToast.hide();
    ReplyInput.value = "";
    mediaReplyInput.value = "";
    mediaReplyPreview.innerHTML = "";
    selectedReplyFile = null;
  };