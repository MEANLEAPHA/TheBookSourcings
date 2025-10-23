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

      if (noti.is_mutual) {
        a.textContent = `🎉 You and ${noti.senderName} are now friends! Click to view connection.`;
        a.href = `/userConnection.html`; // link to connection page
      } else {
        a.textContent = `${noti.senderName} followed you. Click to follow back.`;
        a.href = `/userConnection.html?show=follower`;
      }

      notiDiv.appendChild(a);
    });
  } catch (err) {
    console.error("Notification error:", err);
  }
}

// Auto-refresh notifications every 15s
setInterval(loadFollowNotifications, 15000);
document.addEventListener("DOMContentLoaded", loadFollowNotifications);
