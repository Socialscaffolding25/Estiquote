// ================================================================
// ESTIQUOTE — Push Notification + Email Manager
// Handles: SW registration, push subscription, email triggers
// ================================================================

// VAPID public key — replace with your key from vapidkeys.com
// Generate at: https://vapidkeys.com or run: npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = 'REPLACE_WITH_YOUR_VAPID_PUBLIC_KEY';

const EQNotify = {

  // ── SERVICE WORKER ─────────────────────────────────────────
  async registerSW() {
    if (!('serviceWorker' in navigator)) return null;
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      console.log('[EQNotify] SW registered:', reg.scope);
      return reg;
    } catch (err) {
      console.log('[EQNotify] SW registration failed:', err);
      return null;
    }
  },

  // ── PUSH SUBSCRIPTION ──────────────────────────────────────
  async subscribeToPush(userEmail) {
    if (!('Notification' in window)) return null;
    if (!('PushManager' in window)) return null;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    const reg = await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    if (existing) return existing;

    if (VAPID_PUBLIC_KEY === 'REPLACE_WITH_YOUR_VAPID_PUBLIC_KEY') {
      console.log('[EQNotify] VAPID key not configured — push skipped');
      return null;
    }

    try {
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      // Save subscription to Supabase via EQ if available
      if (typeof EQ !== 'undefined' && EQ.savePushSubscription) {
        await EQ.savePushSubscription(sub, userEmail);
      }

      localStorage.setItem('eq_push_sub', JSON.stringify(sub));
      console.log('[EQNotify] Push subscription created');
      return sub;
    } catch (err) {
      console.log('[EQNotify] Push subscription failed:', err);
      return null;
    }
  },

  // ── PROMPT USER TO ENABLE NOTIFICATIONS ───────────────────
  showNotificationPrompt(containerId, userEmail, opts = {}) {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') return;
    if (Notification.permission === 'denied') return;
    if (localStorage.getItem('eq_notify_dismissed')) return;

    const container = document.getElementById(containerId);
    if (!container) return;

    const banner = document.createElement('div');
    banner.style.cssText = `
      background:rgba(0,201,167,0.08);
      border:1px solid rgba(0,201,167,0.25);
      border-radius:12px;
      padding:14px 16px;
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:12px;
      flex-wrap:wrap;
      margin-bottom:16px;
    `;
    banner.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;flex:1">
        <span style="font-size:20px">🔔</span>
        <div>
          <div style="font-size:13px;font-weight:700;color:var(--text)">${opts.title || 'Get notified about your project'}</div>
          <div style="font-size:12px;color:var(--text-muted)">${opts.body || 'We\'ll alert you when material prices change or builders reply to your enquiries.'}</div>
        </div>
      </div>
      <div style="display:flex;gap:8px;flex-shrink:0">
        <button id="notify-dismiss" style="padding:7px 14px;background:transparent;border:1px solid var(--border);border-radius:6px;color:var(--text-dim);font-family:var(--sans);font-size:12px;cursor:pointer">Not now</button>
        <button id="notify-enable" style="padding:7px 16px;background:linear-gradient(135deg,var(--teal),var(--teal-light));border:none;border-radius:6px;color:var(--navy);font-family:var(--sans);font-size:12px;font-weight:700;cursor:pointer">Enable alerts</button>
      </div>`;

    container.prepend(banner);

    document.getElementById('notify-enable')?.addEventListener('click', async () => {
      banner.remove();
      await this.subscribeToPush(userEmail);
    });

    document.getElementById('notify-dismiss')?.addEventListener('click', () => {
      localStorage.setItem('eq_notify_dismissed', '1');
      banner.remove();
    });
  },

  // ── EMAIL TRIGGERS ─────────────────────────────────────────
  async sendEmail(type, to, data) {
    try {
      const res = await fetch('/.netlify/functions/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, to, data })
      });
      return res.ok;
    } catch (err) {
      console.log('[EQNotify] Email send failed:', err);
      return false;
    }
  },

  async sendWelcomeEmail(email, name) {
    return this.sendEmail('welcome', email, { name });
  },

  async sendBuilderWelcomeEmail(email, name, business) {
    return this.sendEmail('welcome_builder', email, { name, business });
  },

  async sendEnquiryToBuilder(builderEmail, builderName, enquiryData) {
    return this.sendEmail('enquiry_to_builder', builderEmail, {
      builderName, ...enquiryData
    });
  },

  async sendEnquiryConfirmation(homeownerEmail, homeownerName, builderName, business, trade) {
    return this.sendEmail('enquiry_confirmation', homeownerEmail, {
      homeownerName, builderName, business, trade
    });
  },

  async sendUpgradeConfirmation(email, name, plan) {
    return this.sendEmail('upgrade_confirmation', email, { name, plan });
  },

  // ── LOCAL NOTIFICATION (fallback when push not available) ──
  async showLocal(title, body, url = '/dashboard.html') {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    const n = new Notification(title, {
      body,
      icon: '/favicon.svg',
      tag: 'estiquote-local'
    });
    n.onclick = () => { window.focus(); window.location.href = url; n.close(); };
    setTimeout(() => n.close(), 6000);
  },

  // ── UTILITY ────────────────────────────────────────────────
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
  },

  // ── INIT ───────────────────────────────────────────────────
  async init(userEmail) {
    await this.registerSW();
    // Don't auto-prompt — wait for explicit trigger from dashboard
    console.log('[EQNotify] Initialised');
  }
};

// Auto-init with SW registration on load
document.addEventListener('DOMContentLoaded', () => EQNotify.init());
