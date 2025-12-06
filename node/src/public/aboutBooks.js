
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
  const div = document.querySelector(`div[data-comment-id='${comment_id}']`);
  if (div) div.querySelector(".comment-text").textContent = newComment;

});

socket.on("comment-deleted", ({ comment_id }) => {
  const div = document.querySelector(`div[data-comment-id='${comment_id}']`);
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

  

 
  // Media of comment
if (cmt.media_url && cmt.media_type) {
  const mediaWrapper = document.createElement("div");
  mediaWrapper.className = "comment-thumbnail";

 

  const itemWrapper = document.createElement("div"); 
  itemWrapper.className = "blur-wrapper";



 if (cmt.media_type === "image" && !cmt.media_url.startsWith("blob:")) {
      const img = document.createElement("img");
      img.src = cmt.media_url;
      img.className = "comment-thumbnail-img";
      mediaWrapper.appendChild(img);
      mediaWrapper.style.setProperty("--bg-url", `url(${cmt.media_url})`);
    } else if (type === "video") {
      const video = document.createElement("video");
      video.src = cmt.media_url;
      video.controls = true;
      video.muted = true;
      video.loop = true;
      video.className = "comment-thumbnail-video";
      
      itemWrapper.style.background = "rgba(0,0,0,0.8)";
      itemWrapper.appendChild(video);
      mediaWrapper.appendChild(itemWrapper);
    }
    body.appendChild(mediaWrapper);

}


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
   likeCounts.textContent = `${cmt.like_count || 0} Likes`;

   

  btnRow.appendChild(postAt);
  btnRow.appendChild(replyBtn);
  btnRow.appendChild(likeBtn);
  btnRow.appendChild(likeCounts)

 

  
  


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
  // header.appendChild(dropdownWrapper);
 
  // header.appendChild(headerRightBottom);


  // Append together
  div.appendChild(header);
  // div.appendChild(headerRightBottom);
  
  // div.appendChild(footer);

  document.getElementById("comment-container").prepend(div);

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

socket.on("receive-reply", (rpy) => {
  if (!rpy.createFormNow) rpy.createFormNow = "just now";
  displayReply(rpy);
});

socket.on("reply-updated", ({ reply_id, newReply }) => {
  const div = document.querySelector(`div[data-reply-id='${reply_id}']`);
  if (div) div.querySelector(".reply-text").textContent = newReply;
});
socket.on("reply-deleted", ({ reply_id }) => {
  const div = document.querySelector(`div[data-reply-id='${reply_id}']`);
  if (div) div.remove();
});
  

async function loadReply(parentQid) {  // parentQid can be commentQid or replyQid
  if (!parentQid) return;
  try {
    const res = await fetch(`${API_URL}/api/communityReply/dipslayAllReplys/${encodeURIComponent(parentQid)}`);
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
  profileLink.href = `aboutUser?memberId=${rpy.memberQid}`; // user name on rpy div href to their account
  profileLink.appendChild(profileImg);

  // Username link
  

  const headerRight = document.createElement("div");
  headerRight.className = "reply-header-child-right";

  const headerRightTop = document.createElement("div");
  headerRightTop.className = "reply-header-child-right-top"; // user to be flex now no need

  const headerRightBottom = document.createElement("div");
  headerRightBottom.className = "reply-header-child-right-bottom";

  

  const usernameLink = document.createElement("p");
  usernameLink.href = `aboutUser?memberId=${rpy.memberQid}`;
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
  

 
  // Media of comment
if (rpy.media_url && rpy.media_type) {
  const mediaWrapper = document.createElement("div");
  mediaWrapper.className = "reply-thumbnail";

  const itemWrapper = document.createElement("div"); 
  itemWrapper.className = "blur-wrapper";

 if (rpy.media_type === "image" && !rpy.media_url.startsWith("blob:")) {
      const img = document.createElement("img");
      img.src = msg.media_url;
      img.className = "reply-thumbnail-img";
      mediaWrapper.appendChild(img);
      mediaWrapper.style.setProperty("--bg-url", `url(${rpy.media_url})`);
    } else if (type === "video") {
      const video = document.createElement("video");
      video.src = rpy.media_url;
      video.controls = true;
      video.muted = true;
      video.loop = true;
      video.className = "reply-thumbnail-video";
      
      itemWrapper.style.background = "rgba(0,0,0,0.8)";
      itemWrapper.appendChild(video);
      mediaWrapper.appendChild(itemWrapper);
    }
  body.appendChild(mediaWrapper);
}




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
  typeOfId = rpy.replyBackTo_id ? rpy.replyBackTo_id : rpy.replyQid;
  replyBtn.innerHTML = `<i class="fa-solid fa-reply"></i>`;

  // Show ReplyToast and set typeOfId
  replyBtn.addEventListener("click", () => {
     typeOfId = rpy.replyBackTo_id || rpy.replyQid;
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
  


  div.appendChild(header);

  

  const parentFooter = findCommentFooterForParent(rpy.replyBackTo_id);

if (parentFooter) {
 
  parentFooter.appendChild(div);

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
    const res = await fetch(`${API_URL}/api/communityReplyLike/status/${replyId}`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Failed to fetch like status");

    const data = await res.json();
    likeCount.textContent = data.reply.like_count;
    likeIcon.style.color = data.userStatus.commentReplyLiked ? "red" : "gray";
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

 
// repostPost toast
  const postToast = new bootstrap.Toast(document.getElementById("rePostToast"), { autohide: false });


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
    mediaInputLabel.style.display = "block";
    repost_id = null; // clear repost mode
  };