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
    const { endpoint, keys } = req.body; // body: { endpoint, keys: { p256dh, auth } }

    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return res.status(400).json({ message: 'Invalid subscription payload' });
    }

    // Upsert: avoid duplicates
    await db.query(
      `INSERT INTO push_subscriptions (memberQid, endpoint, p256dh, auth)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE p256dh = VALUES(p256dh), auth = VALUES(auth), created_at = NOW()`,
      [memberQid, endpoint, keys.p256dh, keys.auth]
    );

    res.json({ message: 'Subscribed' });
  } catch (err) {
    console.error('Subscribe error', err);
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
const sendPushToMember = async (memberQid, payloadObj) => {
  try {
    const [rows] = await db.query(`SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE memberQid = ?`, [memberQid]);
    if (!rows.length) return [];

    const results = [];
    for (const row of rows) {
      const sub = {
        endpoint: row.endpoint,
        keys: { p256dh: row.p256dh, auth: row.auth }
      };
      try {
        await webpush.sendNotification(sub, JSON.stringify(payloadObj));
        results.push({ endpoint: row.endpoint, ok: true });
      } catch (err) {
        console.error('Push send fail for', row.endpoint, err);
        // If subscription invalid (410, 404) remove it
        if (err.statusCode === 410 || err.statusCode === 404) {
          await db.query('DELETE FROM push_subscriptions WHERE endpoint = ?', [row.endpoint]);
        }
        results.push({ endpoint: row.endpoint, ok: false, error: err.message });
      }
    }
    return results;
  } catch (err) {
    console.error('sendPushToMember error', err);
    return [];
  }
};

module.exports = { subscribe, unsubscribe, sendPushToMember };
