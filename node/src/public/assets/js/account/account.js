// Grab query parameter
const urlParams = new URLSearchParams(window.location.search);
const memberQid = urlParams.get("memberQid");

const userInfoDisplay = document.getElementById("user-info-display");
// Run when DOM is ready
document.addEventListener("DOMContentLoaded", function () {
    fetch(`https://thebooksourcings.onrender.com/getFullRegisterDataByQid/${memberQid}`, {
        method: "GET",
        headers: {
            "Authorization": "Bearer " + localStorage.getItem("token")
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
        // document.getElementById("bio").textContent = data.bio || "";
        // document.getElementById("website").textContent = data.websiteUrl || "";
        // document.getElementById("website").setAttribute("href", data.websiteUrl || "");
        // document.getElementById("quirkyTag").textContent = data.playfulLabel || "";
        // document.getElementById("occupation").textContent = `${data.workRole} at ${data.workPlace}` || "";
        // document.getElementById("memberQid").textContent = data.memberQid || "";
        // document.getElementById("authorQid").textContent = data.authorQid || "";

        // Update images
        document.getElementById("bannerImage").setAttribute("src", data.bannerUrl || "");
        document.getElementById("bannerPreview").style.setProperty("--bg-img", `url(${data.bannerUrl || ""})`);

        const profileImage = document.getElementById("profileImage");
        profileImage.setAttribute("src", data.pfUrl || "");
        if (data.mood) {
            profileImage.classList.add(`mood-${data.mood}`);
        }
    })
    .catch(err => {
        console.error("Error fetching user:", err);
    });
});
