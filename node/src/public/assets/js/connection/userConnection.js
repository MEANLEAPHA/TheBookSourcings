
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


// Placeholder elements

const devNoOttherFri = document.getElementById('dev-no-otter-fri');

async function loadMutual() {
  try {
    const res = await fetch(`${API_BASE}/follow/notifications`, { headers });
    if (!res.ok) throw new Error("Failed to fetch notifications");
    const data = await res.json();

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

      if(devNoOttherFri) devNoOttherFri.style.display = "block";

      return;
    }

    // Render notifications
    data.notifications.forEach(noti => {
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
      a.appendChild(clearBtn);
    });
    // Hide placeholder when notifications exist
     if(devNoOttherFri) devNoOttherFri.style.display = "none";
  } catch (err) {
    console.error("Notification error:", err);
  }
}



setInterval(loadMutual, 20000);
document.addEventListener("DOMContentLoaded", loadMutual);
