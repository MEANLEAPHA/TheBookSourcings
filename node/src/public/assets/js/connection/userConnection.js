
const API_BASE = "https://thebooksourcings.onrender.com/api";
const TOKEN = localStorage.getItem("token");
const headers = {
  "Authorization": `Bearer ${TOKEN}`,
  "Content-Type": "application/json"
};



const mutualFriDev = document.querySelector(".append-fri");

// Placeholder elements (if no mutual)
const devNoOttherFri = document.getElementById('dev-no-otter-fri');

async function loadMutual() {
  try {
    const res = await fetch(`${API_BASE}/display/mutual`, { headers });
    if (!res.ok) throw new Error("Failed to fetch mutual");
    const data = await res.json();

    // Handle empty mutuals
    if (!data.mutual || data.mutual.length === 0) {
      if (devNoOttherFri) devNoOttherFri.style.display = "block";
      return;
    }

    mutualFriDev.innerHTML = "";

    data.mutual.forEach(fri => {
      const a = document.createElement("a");
      a.className = "friA";

      const pf = document.createElement("img");
      pf.className = "friA-img";

      const div4info = document.createElement("div");
      div4info.className = "friA-div4Info";

      const info = document.createElement("p");
      info.className = "friA-name";

      const nickname = document.createElement("p");
      nickname.className = "friA-nickname"; 

      pf.src = fri.friendPf || "/default-avatar.png";
      pf.alt = "Profile";

      info.textContent = fri.username;
      nickname.textContent = `@${fri.nickname}`;

      div4info.appendChild(info);
      div4info.appendChild(nickname);

      a.appendChild(pf);
      a.appendChild(div4info);

      mutualFriDev.appendChild(a);
    });

    if (devNoOttherFri) devNoOttherFri.style.display = "none";
  } catch (err) {
    console.error("Mutual display error:", err);
  }
}


setInterval(loadMutual, 20000);
document.addEventListener("DOMContentLoaded", loadMutual);
