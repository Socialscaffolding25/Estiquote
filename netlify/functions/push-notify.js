// ================================================================
// ESTIQUOTE — Web Push Notification Function
// Sends push notifications to subscribed users
// Requires: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_EMAIL env vars
// Generate keys at: https://vapidkeys.com
// ================================================================

const webpush = require('web-push');

const VAPID_PUBLIC  = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
const VAPID_EMAIL   = process.env.VAPID_EMAIL || 'mailto:hello@estiquote.co.uk';

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE);
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
    return {
      statusCode: 200,
      body: JSON.stringify({ skipped: true, reason: 'VAPID keys not configured' })
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  const { subscription, payload } = body;
  if (!subscription || !payload) {
    return { statusCode: 400, body: 'Missing subscription or payload' };
  }

  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };
  } catch (err) {
    // 410 = subscription expired/invalid — client should remove it
    if (err.statusCode === 410) {
      return { statusCode: 410, body: JSON.stringify({ expired: true }) };
    }
    console.error('[push-notify] Error:', err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: err.message })
    };
  }
};
