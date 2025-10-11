
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




const API_URL = "https://thebooksourcings.onrender.com";

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

const usernameFrom = document.querySelector(".usernameFrom");

if (username) {
  usernameFrom.textContent = username;
}

const socket = io(API_URL, { auth: { token } });

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


// ====== SOCKET LISTENERS ======
socket.on("connect", () => console.log("Connected:", socket.id));

socket.on("receive-message", (msg) => {
  if (!msg.createFormNow) msg.createFormNow = "just now";
  msg.feeling = feelingMap[msg.feeling] || msg.feeling;
  displayMessage(msg);
});
// socket.on("receive-message", (msg) => {
//   if (!msg.createFormNow) msg.createFormNow = "just now";
//   msg.feeling = feelingMap[msg.feeling] || msg.feeling;

//   const div = displayMessage(msg); // return the div inside displayMessage
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
async function loadMessages() {
  try {
    const res = await fetch(`${API_URL}/api/community/display`);
    if (!res.ok) throw new Error("Failed to fetch messages");
    const msgs = await res.json();
    msgs.forEach(displayMessage);
  } catch (err) {
    console.error("Error loading messages:", err);
  }
}
loadMessages();

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

    if (!res.ok) throw new Error("Failed to send message");

    const savedMsg = await res.json();
    savedMsg.createFormNow = "just now"; // instant display
    displayMessage(savedMsg);
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
function displayMessage(msg) {
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
      <li class='li-opt'><a class="dropdown-item edit-option"><i class="fa-solid fa-pen" style="color:green"></i> Edit</a></li>
      <li class='li-opt'><a class="dropdown-item delete-option"><i class="fa-solid fa-trash" style="color:red" ></i> Delete</a></li>
      <li class='li-opt'><a class="dropdown-item report-option"><i class="fa-solid fa-flag" style="color:orange"></i> Report</a></li>
      <li class='li-opt'><a class="dropdown-item copy-option" href="#"><i class="fa-solid fa-link" style="color:blue"></i> Copy link</a></li>
    `;
  } else {
    dropdownMenu.innerHTML = `
      <li class='li-opt'><a class="dropdown-item report-option"><i class="fa-solid fa-flag" style="color:orange"></i> Report</a></li>
      <li class='li-opt'><a class="dropdown-item copy-option" href="#"><i class="fa-solid fa-link" style="color:blue"></i> Copy link</a></li>
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

  // if (repost.repostText) {
  //   const repostText = document.createElement("p");
  //   repostText.className = "repost-text";
  //   repostText.textContent = repost.repostText;
  //   repostBody.appendChild(repostText);
  // }

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
        mediaContainer.appendChild(img);
        itemWrapper.style.setProperty("--bg-url", `url(${repost.media_url[0]})`);
      } else if (type === "video") {
        const video = document.createElement("video");
        video.src = repost.media_url[0];
        video.controls = true;
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
          mediaContainer.appendChild(img);
          blurWrapper.style.setProperty("--bg-url", `url(${url})`);
        } else if (repost.media_type[index] === "video") {
          const video = document.createElement("video");
          video.src = url;
          video.controls = true;
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
      <p><span class="post-favorite-count">${msg.favorite_count || 0}</span> favorites</p>
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
  likeBtn.innerHTML = `<i class="fa-solid fa-heart"></i> <span>Like</span>`;

  // Favorite btn
  const favBtn = document.createElement("button");
  favBtn.className = "favBtn media-btn";
  favBtn.dataset.id = msg.message_id;
  favBtn.innerHTML = `<i class="fa-solid fa-bookmark"></i> <span>Favorites<span>`;

  // Comment btn
  const commentBtn = document.createElement("button");
  commentBtn.className = "commentBtn media-btn";
  commentBtn.dataset.id = msg.message_id;
  commentBtn.innerHTML = `<i class="fa-solid fa-comment"></i> <span>Comment</span>`;
  commentBtn.onclick = () => {
    window.location.href = `commentView.html?postId=${msg.message_id}`;
  };

  // Repost btn
  const repostBtn = document.createElement("button");
  repostBtn.className = "repostBtn media-btn";
  repostBtn.dataset.id = msg.message_id;
  repostBtn.innerHTML = `<i class="fa-solid fa-share-from-square"></i> <span>Repost</span>`;

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
  const favCount = counts.querySelector(".post-favorite-count");
  loadFavInfoForMessage(msg.message_id, favIcon, favCount);
  favBtn.onclick = async () => {
     await toggleFavActivityForMessage(msg.message_id, favIcon, favCount);
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

async function loadFavInfoForMessage(messageId, favIcon, favCount){
  try{
    const res = await fetch(`${API_URL}/api/communityPostFav/status/${messageId}`,{
      headers: { "Authorization": `Bearer ${token}`}
    });

    const data = await res.json();
    favCount.textContent = data.post.favorite_count;
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
    if (!res.ok) throw new Error("Failed to toggle like");

    const data = await res.json();
    likeIcon.style.color = data.liked ? "red" : "gray";
    await loadLikeInfoForMessage(messageId, likeIcon, likeCount);
  } catch (err) {
    console.error(err);
  }
}

// toggleFav
async function toggleFavActivityForMessage(messageId, favIcon, favCount){
  try{

    const res = await fetch(`${API_URL}/api/communityPostFav/save/${messageId}`,{
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });
    if(!res.ok) throw new Error("Failed to toggle like");
    const data = await res.json();
    favIcon.style.color = data.favorited ? "orange" : "gray";
    await loadFavInfoForMessage(messageId, favIcon, favCount);
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

 // Post toast
  const postToast = new bootstrap.Toast(document.getElementById("PostToast"), { autohide: false });
  const searchBtn = document.getElementById("searchButton");

  searchBtn.addEventListener("click", () => {
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