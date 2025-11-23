// Grab query parameter
const urlParams = new URLSearchParams(window.location.search);
const memberQid = urlParams.get("memberQid");
 function parseJwt (token) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
}
const token = localStorage.getItem("token");
let userMemberQid = null;


if (token) {
  const decoded = parseJwt(token);
  userMemberQid = decoded?.memberQid || null;
  
}

// Run when DOM is ready
document.addEventListener("DOMContentLoaded", function () {

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
        const memberQid = document.createElement('p');
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
            memberQid.appendChild(memberQidI);
            memberQid.appendChild(memberQidA);
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
        userInfoDisplay.appendChild(memberQid);
        userInfoDisplay.appendChild(authorQid);
        document.getElementById("username").textContent = data.username || "";
        document.getElementById("usernickname").textContent = `@${data.nickname || "noNicknameYet"}`;
        document.getElementById("userFollow").textContent = `${data.followerCount || "No followers yet"} followers`;
        document.getElementById("bannerImage").setAttribute("src", data.bannerUrl || "");
        document.getElementById("bannerPreview").style.setProperty("--bg-img", `url(${data.bannerUrl || ""})`);
        const profileImage = document.getElementById("profileImage");
        profileImage.setAttribute("src", data.pfUrl || "");
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
        // moreBtn.appendChild(moreBtnI);
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
            followBtn.textContent = "Follow";
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


async function loadChannelInfo(followedQid) {
  try {
    const res = await fetch(`https://thebooksourcings.onrender.com/api/followStatus/${followedQid}`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    if (!res.ok) throw new Error("Failed to fetch follow status");

    const data = await res.json();

    if(data.userStatus.followed === 1){
        followingBtn.id = "btn-following";
        followingBtn.textContent = "Following";
        followHolder.appendChild(followingBtn); 
    }
    followBtn.textContent = data.userStatus.followed ? "unFollow" : "Follow";
  } catch (err) {
    console.error(err);
  }
}

async function toggleFollowActivity(followedQid) {
  try {
    const res = await fetch(`https://thebooksourcings.onrender.com/api/channel/follow/${followedQid}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });
    if (!res.ok) throw new Error(`Failed to toggle follow`);

    const data = await res.json();

  

    followBtn.textContent = data.followed ? "unFollow" : "Follow";

    // Safer: re-fetch updated count instead of manual increment
    await loadChannelInfo(followedQid);

  } catch (err) {
    console.error(err);
  }
}



});

