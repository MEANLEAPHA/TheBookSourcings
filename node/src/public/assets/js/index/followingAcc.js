// const allFollowing = document.getElementById("allFollowing");
// const showLessFollow = document.getElementById("showLessFollow");
// const showMoreFollow = document.getElementById("showMoreFollow");
// const followingChild = document.querySelectorAll('.followingChild');
// if(followingChild.length > 3){
//     for(let i =3 ; i < followingChild.length; i++ ){
//         followingChild[i].style.display = 'none';
//     }
//     allFollowing.style.display = 'none';
//     showLessFollow.style.display = 'none';
//     showMoreFollow.style.display = 'flex';
//     showMoreFollow.addEventListener('click', ()=>{
//       followingChild.forEach(child => child.style.display = 'flex')
//       allFollowing.style.display = 'flex';
//       showMoreFollow.style.display = 'none';
//       showLessFollow.style.display = 'flex';
//     })
//     showLessFollow.addEventListener('click', ()=>{
//       for(let i =3 ; i < followingChild.length; i++ ){
//           followingChild[i].style.display = 'none';
        
//       }
//       allFollowing.style.display = 'none';
//         showMoreFollow.style.display = 'flex';
//         showLessFollow.style.display = 'none';
//     })
// }
// else{
// allFollowing.style.display = 'none';
// showLessFollow.style.display = 'none';
// showMoreFollow.style.display = 'none';
// }

const displayUserFollowingContainer = document.querySelector('.displayUserFollowing');
const allFollowing = document.getElementById("allFollowing");
const showLessFollow = document.getElementById("showLessFollow");
const showMoreFollow = document.getElementById("showMoreFollow");

// Fetch following list
const fetchUserFollowing = async () => {
  try {
    const res = await fetch("https://thebooksourcings.onrender.com/api/displayUserFollowing", {
      method: "GET",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}` 
       }
    });

    if (res.status === 401) {
      // Guest / not logged in
      displayUserFollowingContainer.innerHTML = "";
      allFollowing.style.display = "none";
      showLessFollow.style.display = "none";
      showMoreFollow.style.display = "none";

      const msgDiv = document.createElement("div");
      msgDiv.textContent = "Please login or sign up";
      msgDiv.style.color = "red";
      msgDiv.style.fontWeight = "bold";
      displayUserFollowingContainer.appendChild(msgDiv);
      return;
    }

    const data = await res.json();
    if (!data.status || !data.dfollowing || data.dfollowing.length === 0) {
      displayUserFollowingContainer.innerHTML = "<p>No following found</p>";
      return;
    }

    // Clear old content
    displayUserFollowingContainer.innerHTML = "";

    // Create followingChild elements
    data.dfollowing.forEach(user => {
      const childDiv = document.createElement("div");
      childDiv.className = "followingChild";

      const img = document.createElement("img");
      img.className = "followingPf";
      img.src = user.pfUrl || "default.png"; // fallback image

      const name = document.createElement("p");
      name.className = "followingName";
      name.textContent = user.username;

      childDiv.appendChild(img);
      childDiv.appendChild(name);
      displayUserFollowingContainer.appendChild(childDiv);
    });

    // Apply show more/less logic
    const followingChild = document.querySelectorAll('.followingChild');
    if (followingChild.length > 3) {
      for (let i = 3; i < followingChild.length; i++) {
        followingChild[i].style.display = 'none';
      }
      allFollowing.style.display = 'none';
      showLessFollow.style.display = 'none';
      showMoreFollow.style.display = 'flex';

      showMoreFollow.onclick = () => {
        followingChild.forEach(child => child.style.display = 'flex');
        allFollowing.style.display = 'flex';
        showMoreFollow.style.display = 'none';
        showLessFollow.style.display = 'flex';
      };

      showLessFollow.onclick = () => {
        for (let i = 3; i < followingChild.length; i++) {
          followingChild[i].style.display = 'none';
        }
        allFollowing.style.display = 'none';
        showMoreFollow.style.display = 'flex';
        showLessFollow.style.display = 'none';
      };
    } else {
      allFollowing.style.display = 'none';
      showLessFollow.style.display = 'none';
      showMoreFollow.style.display = 'none';
    }

  } catch (err) {
    console.error(err);
    displayUserFollowingContainer.innerHTML = "<p>Error loading following list</p>";
  }
};

// Call on page load
fetchUserFollowing();
