
const API_BASE = "https://thebooksourcings.onrender.com/api";
const TOKEN = localStorage.getItem("token");
const headers = {
  "Authorization": `Bearer ${TOKEN}`,
  "Content-Type": "application/json"
};

const notiDevConnection = document.querySelector(".notiUpdateConnection");
const notiDevSystem = document.querySelector(".notiUpdateSystem");
const notiDevMarket = document.querySelector(".notiUpdateMarket");
const notiDevConnectionSpan = document.querySelector(".notiUpdateConnection-span");
const notiDevSystemSpan = document.querySelector(".notiUpdateSystem-span");
const notiDevMarketSpan = document.querySelector(".notiUpdateMarket-span");
const clearAll = document.getElementById("btn-clear-noti");

// Placeholder elements

const devNoOtterNoti = document.getElementById('dev-no-otter-noti');

async function loadFollowNotifications() {
  try {
    const res = await fetch(`${API_BASE}/follow/notifications`, { headers });
    if (!res.ok) throw new Error("Failed to fetch notifications");
    const data = await res.json();

    // Clear containers safely
    [notiDevConnection, notiDevSystem, notiDevMarket].forEach(dev => {
      if (dev) dev.innerHTML = "";
    });

    // Handle empty notifications
    if (!data.notifications || data.notifications.length === 0) {
      [
        { dev: notiDevConnection, span: notiDevConnectionSpan },
        { dev: notiDevSystem, span: notiDevSystemSpan },
        { dev: notiDevMarket, span: notiDevMarketSpan }
      ].forEach(({ dev, span }) => {
        if (dev) dev.style.display = "none";   // hide container
        if (span) span.style.display = "none"; // hide span
      });

      // Hide clear all button
      if (clearAll) clearAll.style.display = "none";

      // Show placeholder

      if(devNoOtterNoti) devNoOtterNoti.style.display = "block";

      return;
    }

    // Render notifications
    data.notifications.forEach(noti => {
      const div = document.createElement("div");
      div.className = "notiList";
      const a = document.createElement("a");
      a.className = "notiA";
      const pf = document.createElement("img");
      pf.className = "notiA-img";
      const div4message = document.createElement("div");
      div4message.className = "notiA-div4message";
      const message = document.createElement("p");
      message.className = "notiA-message";
      const date = document.createElement("span");
      date.className = "notiA-date";
      const clearBtn = document.createElement("button");

      pf.src = noti.senderPf || "/default-avatar.png";
      pf.alt = "Profile";

      message.textContent = noti.message;
      date.textContent = noti.datetime;

      clearBtn.className = "clearById";
      clearBtn.textContent = "clear";
      clearBtn.dataset.id = noti.id;

      div4message.appendChild(message);
      div4message.appendChild(date);

      a.appendChild(pf);
      a.appendChild(div4message);
      div.appendChild(a)
      div.appendChild(clearBtn);

      if (noti.type === "follow") {
        const isFollowBack = noti.message.includes("followed you back");
        a.href = isFollowBack ? "/chatRoom.html" : "/userConnection.html";
        notiDevConnection?.appendChild(a);
      } else if (noti.type === "order") {
        a.href = "/chatRoom.html";
        notiDevMarket?.appendChild(a);
      } else {
        a.href = "/chatRoom.html";
        notiDevSystem?.appendChild(a);
      }

      clearBtn.addEventListener("click", async (e) => {
        try {
          const id = e.target.dataset.id;
          const res = await fetch(`${API_BASE}/follow/notifications/clear/${id}`, {
            method: "DELETE",
            headers
          });
          if (!res.ok) throw new Error("Failed to clear notification");
          loadFollowNotifications();
        } catch (err) {
          console.error("Notification clear error:", err);
        }
      });
    });

    // Show spans if notifications exist
    [notiDevConnectionSpan, notiDevSystemSpan, notiDevMarketSpan].forEach(span => {
      if (span) span.style.display = "inline";
    });

    // Show clear all button only if notifications exist
    if (clearAll) clearAll.style.display = "inline";

    // Hide placeholder when notifications exist
     if(devNoOtterNoti) devNoOtterNoti.style.display = "none";


  } catch (err) {
    console.error("Notification error:", err);
  }
}

// Clear all notifications
clearAll?.addEventListener("click", async (e) => {
  try {
    e.preventDefault();
    const res = await fetch(`${API_BASE}/follow/notifications/clearAll`, {
      method: "DELETE",
      headers
    });
    if (!res.ok) throw new Error("Failed to clear all notifications");
    loadFollowNotifications();
  } catch (err) {
    console.error("Notification clear all error:", err);
  }
});

setInterval(loadFollowNotifications, 20000);
document.addEventListener("DOMContentLoaded", loadFollowNotifications);
