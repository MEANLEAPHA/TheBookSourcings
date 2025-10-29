// controllers/pushController.js
const webpush = require('web-push');
const db = require('../../config/db'); // adjust path

// configure web-push
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Save subscription sent from browser
const subscribe = async (req, res) => {
  try {
    const memberQid = req.user.memberQid;
    const { endpoint, keys } = req.body;

    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return res.status(400).json({ message: 'Invalid subscription payload' });
    }

    console.log("📩 Received subscription:", {
      memberQid,
      endpoint,
      keys
    });

    // ✅ Insert new or update existing (no duplicates)
    await db.query(
      `INSERT INTO push_subscriptions (memberQid, endpoint, p256dh, auth)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
         p256dh = VALUES(p256dh), 
         auth = VALUES(auth), 
         updated_at = NOW()`,
      [memberQid, endpoint, keys.p256dh, keys.auth]
    );

    res.json({ message: 'Subscribed successfully' });
  } catch (err) {
    console.error('❌ Subscribe error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};


const unsubscribe = async (req, res) => {
  try {
    const memberQid = req.user.memberQid;
    const { endpoint } = req.body;
    if (!endpoint) return res.status(400).json({ message: 'Missing endpoint' });

    await db.query(`DELETE FROM push_subscriptions WHERE memberQid = ? AND endpoint = ?`, [memberQid, endpoint]);
    res.json({ message: 'Unsubscribed' });
  } catch (err) {
    console.error('Unsubscribe error', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// send notifications to all subscriptions for a specific memberQid
async function sendPushToMember(memberQid, payload) {
  const [subs] = await db.query(
    "SELECT * FROM push_subscriptions WHERE memberQid = ?",
    [memberQid]
  );

  if (!subs.length) return [];

  const results = [];

  for (const sub of subs) {
    const pushSub = {
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.p256dh,
        auth: sub.auth,
      },
    };

    try {
      await webpush.sendNotification(pushSub, JSON.stringify(payload));
      results.push({ endpoint: sub.endpoint, ok: true });
    } catch (err) {
      console.error("❌ Push send fail for", sub.endpoint, err);

      // 🔥 If subscription expired or invalid -> delete it
      if (err.statusCode === 410 || err.statusCode === 404) {
        await db.query("DELETE FROM push_subscriptions WHERE endpoint = ?", [sub.endpoint]);
        console.log("🗑️ Removed expired subscription:", sub.endpoint);
      }

      results.push({
        endpoint: sub.endpoint,
        ok: false,
        error: err.body || err.message,
      });
    }
  }

  return results;
}
// const sendPushToMember = async (memberQid, payloadObj) => {
//   try {
//     const [rows] = await db.query(`SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE memberQid = ?`, [memberQid]);
//     if (!rows.length) return [];

//     const results = [];
//     for (const row of rows) {
//       const sub = {
//         endpoint: row.endpoint,
//         keys: { p256dh: row.p256dh, auth: row.auth }
//       };
//       try {
//         await webpush.sendNotification(sub, JSON.stringify(payloadObj));
//         results.push({ endpoint: row.endpoint, ok: true });
//       } catch (err) {
//         console.error('Push send fail for', row.endpoint, err);
//         // If subscription invalid (410, 404) remove it
//         if (err.statusCode === 410 || err.statusCode === 404) {
//           await db.query('DELETE FROM push_subscriptions WHERE endpoint = ?', [row.endpoint]);
//         }
//         results.push({ endpoint: row.endpoint, ok: false, error: err.message });
//       }
//     }
//     return results;
//   } catch (err) {
//     console.error('sendPushToMember error', err);
//     return [];
//   }
// };

module.exports = { subscribe, unsubscribe, sendPushToMember };
