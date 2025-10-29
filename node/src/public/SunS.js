// client push helper (paste inside your frontend main script)
const VAPID_PUBLIC_KEY_URL = "/api/notification/vapidPublicKey";
const SUBSCRIBE_URL = "/api/notification/subscribe";
const UNSUBSCRIBE_URL = "/api/notification/unsubscribe";

async function registerServiceWorkerAndSubscribe() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.warn("Push not supported in this browser.");
    return null;
  }

  try {
    const reg = await navigator.serviceWorker.register("/service-worker.js");
    console.log("✅ Service Worker registered:", reg);

    // ensure permission
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("Notification permission not granted");
      return null;
    }

    // fetch VAPID public key
    const res = await fetch(VAPID_PUBLIC_KEY_URL, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    });
    const { publicKey } = await res.json();
    const applicationServerKey = urlBase64ToUint8Array(publicKey);

    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey
    });

    // send subscription to server
    await fetch(SUBSCRIBE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify({
        endpoint: subscription.endpoint,
        keys: subscription.toJSON().keys
      })
    });

    console.log("✅ Subscribed for push:", subscription.endpoint);
    return subscription;
  } catch (err) {
    console.error("Subscribe failed:", err);
    return null;
  }
}

async function unsubscribePush() {
  try {
    const reg = await navigator.serviceWorker.ready;
    const subscription = await reg.pushManager.getSubscription();
    if (subscription) {
      // send server to delete
      await fetch(UNSUBSCRIBE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ endpoint: subscription.endpoint })
      });
      await subscription.unsubscribe();
      console.log("✅ Unsubscribed from push");
    }
  } catch (err) {
    console.error("Unsubscribe failed:", err);
  }
}

// helper: convert VAPID public key
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) arr[i] = raw.charCodeAt(i);
  return arr;
}

// --- Button click event ---
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("enableNotif");
  if (btn) {
    btn.addEventListener("click", registerServiceWorkerAndSubscribe);
  }
});