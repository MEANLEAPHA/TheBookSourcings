const API_BASE = "https://thebooksourcings.onrender.com/api";
const TOKEN = localStorage.getItem("token");
const headers = {
  "Authorization": `Bearer ${TOKEN}`,
  "Content-Type": "application/json"
};

// Load global notifications
async function loadFollowNotifications() {
  try {
    const res = await fetch(`${API_BASE}/follow/notifications`, { headers });
    if (!res.ok) throw new Error("Failed to fetch notifications");
    const data = await res.json();

    const notiDiv = document.querySelector(".notiUpdate");
    if (!notiDiv) return; // no noti container found, skip

    notiDiv.innerHTML = "";

    data.notifications.forEach(noti => {
      const a = document.createElement("a");

      if (noti.type === 'follow') {
          const isFollowBack = noti.message.includes('followed you back');
          a.textContent = noti.message;
          a.href = isFollowBack ? '/chatRoom.html' : '/userConnection.html';
      }
      else if(noti.type === 'order'){
        a.textContent = noti.message;
        a.href = `/chatRoom.html`;
      }
      else{
        a.textContent = noti.message;
        a.href = `/chatRoom.html`; // not yet just test
      }

      notiDiv.appendChild(a);
    });
  } catch (err) {
    console.error("Notification error:", err);
  }
}

// Auto-refresh notifications every 15s
setInterval(loadFollowNotifications, 20000);
document.addEventListener("DOMContentLoaded", loadFollowNotifications);
