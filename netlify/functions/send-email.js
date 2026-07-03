// ================================================================
// ESTIQUOTE — Resend Email Function
// Handles: welcome emails, enquiry confirmations, builder alerts,
//          material price alerts, upgrade confirmations, estimate summaries
// Requires: RESEND_API_KEY env var in Netlify
// ================================================================

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = 'Estiquote <hello@estiquote.co.uk>';
const REPLY_TO = 'estiquoteofficial@gmail.com';

// ── EMAIL TEMPLATES ───────────────────────────────────────────

function baseTemplate(content) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<style>
  body { margin:0; padding:0; background:#f4f6f9; font-family:'Instrument Sans',Helvetica,Arial,sans-serif; }
  .wrap { max-width:580px; margin:0 auto; padding:32px 16px; }
  .card { background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 2px 20px rgba(0,0,0,0.06); }
  .header { background:#0b1120; padding:28px 32px; }
  .logo { font-size:22px; font-weight:800; color:#ffffff; letter-spacing:-0.5px; }
  .logo span { color:#00c9a7; }
  .body { padding:32px; }
  .h1 { font-size:22px; font-weight:800; color:#0b1120; margin:0 0 12px; line-height:1.2; }
  .p { font-size:14px; color:#555; line-height:1.7; margin:0 0 16px; }
  .btn { display:inline-block; padding:13px 28px; background:#00c9a7; border-radius:8px; color:#0b1120; font-weight:700; font-size:14px; text-decoration:none; }
  .divider { height:1px; background:#f0f0f0; margin:24px 0; }
  .highlight { background:#f0fdf9; border-left:3px solid #00c9a7; padding:14px 18px; border-radius:0 8px 8px 0; margin:16px 0; }
  .highlight p { margin:0; font-size:13px; color:#0b1120; }
  .footer { padding:24px 32px; background:#f9fafb; }
  .footer p { font-size:11px; color:#aaa; margin:0; line-height:1.6; }
  .footer a { color:#00c9a7; text-decoration:none; }
  .stat-row { display:flex; gap:16px; margin:16px 0; }
  .stat { flex:1; background:#f9fafb; border-radius:8px; padding:12px; text-align:center; }
  .stat-val { font-size:20px; font-weight:800; color:#0b1120; }
  .stat-label { font-size:11px; color:#888; margin-top:2px; }
</style>
</head>
<body>
<div class="wrap">
  <div class="card">
    <div class="header">
      <div class="logo">Esti<span>quote</span></div>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      <p>© 2026 Estiquote Ltd · <a href="https://estiquote.co.uk">estiquote.co.uk</a><br>
      All cost estimates are indicative only and do not constitute a quote or contract.<br>
      <a href="https://estiquote.co.uk/privacy.html">Privacy policy</a> · 
      <a href="https://estiquote.co.uk/terms.html">Terms</a></p>
    </div>
  </div>
</div>
</body>
</html>`;
}

const templates = {

  welcome: ({ name }) => ({
    subject: `Welcome to Estiquote, ${name} 👋`,
    html: baseTemplate(`
      <h1 class="h1">You now know the number before you call anyone.</h1>
      <p class="p">Hi ${name}, welcome to Estiquote. You've just joined the smartest homeowners in the UK — the ones who run a cost estimate before they speak to a single builder.</p>
      <div class="highlight">
        <p>The average homeowner overpays by <strong>£8,400</strong> on home improvement projects. You won't be one of them.</p>
      </div>
      <p class="p">Here's what to do next:</p>
      <p class="p">
        <strong>1.</strong> Run your first estimate — pick a trade, your region, and spec level. Takes 90 seconds.<br>
        <strong>2.</strong> Save it to your dashboard — you can track and compare estimates over time.<br>
        <strong>3.</strong> Find a builder — when you're ready, contact local builders who can see you've done your homework.
      </p>
      <a href="https://estiquote.co.uk/estimator.html" class="btn">Run my first estimate →</a>
      <div class="divider"></div>
      <p class="p" style="font-size:13px;color:#888">Questions? Just reply to this email — we read everything.</p>
    `)
  }),

  estimate_summary: ({ trade, context, estimate, perSqm, extras }) => ({
    subject: `Your Estiquote estimate — ${trade || 'your project'} · ${estimate}`,
    html: baseTemplate(`
      <h1 class="h1">Here's the number you asked for.</h1>
      <p class="p">You ran a cost estimate on Estiquote${trade ? ` for a ${String(trade).toLowerCase()} project` : ''}. We've saved the details below so you have it to hand when you're talking to builders.</p>
      <div class="highlight">
        ${context ? `<p style="font-size:12px;color:#888;margin-bottom:4px">${context}</p>` : ''}
        <p style="font-size:22px;font-weight:800;color:#0b1120;margin:4px 0 0">${estimate}</p>
        ${perSqm ? `<p style="font-size:12px;color:#888;margin-top:4px">${perSqm}</p>` : ''}
      </div>
      ${extras ? `<p class="p" style="font-size:13px;color:#888">Extras included in this estimate: ${extras}</p>` : ''}
      <p class="p">Use this as your benchmark when comparing quotes. As a rule of thumb, be curious about any quote more than 20% above or below this range — ask the builder to explain the difference.</p>
      <a href="https://estiquote.co.uk/estimator.html" class="btn">Run another estimate →</a>
      <div class="divider"></div>
      <p class="p" style="font-size:13px;color:#888">Want to save estimates permanently, export a PDF, or track material prices over time? <a href="https://estiquote.co.uk/signup.html" style="color:#00c9a7">Create a free account →</a></p>
    `)
  }),

  welcome_builder: ({ name, business }) => ({
    subject: `Your Estiquote builder profile is live — ${business}`,
    html: baseTemplate(`
      <h1 class="h1">You're live on Estiquote.</h1>
      <p class="p">Hi ${name}, your ${business} profile is now active. Every homeowner who contacts you has already run a cost estimate and confirmed their budget — no more cold leads, no more wasted quoting visits.</p>
      <div class="highlight">
        <p><strong>What happens next:</strong> When a homeowner in your area runs an estimate for your trade and then searches for builders, your profile appears. They contact you directly — not you and three competitors.</p>
      </div>
      <p class="p">To get more enquiries:</p>
      <p class="p">
        <strong>1.</strong> Complete your profile — add portfolio photos and accreditations.<br>
        <strong>2.</strong> Respond quickly — homeowners who get a reply within 2 hours convert at 4× the rate.<br>
        <strong>3.</strong> Ask satisfied clients for a review — even one verified review increases enquiries significantly.
      </p>
      <a href="https://estiquote.co.uk/dashboard.html" class="btn">Go to my dashboard →</a>
    `)
  }),

  enquiry_to_builder: ({ builderName, homeownerName, trade, location, budget, message, projectSize }) => ({
    subject: `New enquiry: ${trade} project in ${location} — budget ${budget}`,
    html: baseTemplate(`
      <h1 class="h1">New budget-qualified enquiry</h1>
      <p class="p">Hi ${builderName}, you have a new enquiry from a homeowner who has already confirmed their project budget via Estiquote.</p>
      <div class="highlight">
        <p><strong>This is an exclusive lead</strong> — it has not been sent to any other builder.</p>
      </div>
      <div class="divider"></div>
      <p class="p"><strong>Project details</strong></p>
      <p class="p">
        <strong>Trade:</strong> ${trade}<br>
        <strong>Location:</strong> ${location}<br>
        ${projectSize ? `<strong>Size:</strong> ${projectSize}<br>` : ''}
        <strong>Confirmed budget:</strong> <span style="color:#00c9a7;font-weight:700">${budget}</span><br>
        <strong>From:</strong> ${homeownerName}
      </p>
      ${message ? `<div class="highlight"><p><strong>Their message:</strong><br>${message}</p></div>` : ''}
      <div class="divider"></div>
      <p class="p" style="font-size:13px;color:#888">Builders who respond within 2 hours convert at 4× the rate. Reply directly to ${homeownerName} or visit your dashboard.</p>
      <a href="https://estiquote.co.uk/dashboard.html" class="btn">View in dashboard →</a>
    `)
  }),

  enquiry_confirmation: ({ homeownerName, builderName, business, trade }) => ({
    subject: `Your enquiry to ${business} has been sent`,
    html: baseTemplate(`
      <h1 class="h1">Enquiry sent to ${business}</h1>
      <p class="p">Hi ${homeownerName}, your enquiry has been sent directly to ${builderName} at ${business}. They know your project type and confirmed budget — expect a response within 24 hours.</p>
      <div class="highlight">
        <p><strong>What happens next:</strong> ${builderName} will contact you directly via email or phone to arrange a site visit and provide a formal quote.</p>
      </div>
      <p class="p"><strong>Tips for getting the best quote:</strong></p>
      <p class="p">
        ✓ Have your Estiquote estimate handy — it's a great benchmark for comparing quotes<br>
        ✓ Ask for a written, itemised quote — not just a total figure<br>
        ✓ Check their insurance and relevant accreditations before signing anything<br>
        ✓ Never pay more than 10% upfront
      </p>
      <a href="https://estiquote.co.uk/estimator.html" class="btn">Run another estimate →</a>
    `)
  }),

  upgrade_confirmation: ({ name, plan }) => ({
    subject: `You're now on Estiquote ${plan} — welcome`,
    html: baseTemplate(`
      <h1 class="h1">You're upgraded. Let's get to work.</h1>
      <p class="p">Hi ${name}, your Estiquote ${plan} plan is now active. Here's everything that's just unlocked for you:</p>
      <p class="p">
        ✓ <strong>Unlimited saved projects</strong> — track as many estimates as you need<br>
        ✓ <strong>PDF export</strong> — professional estimate documents for builders and architects<br>
        ✓ <strong>Full material price tracker</strong> — monitor timber, steel, bricks and 7 more<br>
        ✓ <strong>Line-item cost breakdown</strong> — see exactly where your money goes<br>
        ✓ <strong>Quote comparison tool</strong> — upload quotes and compare against your estimate<br>
        ✓ <strong>Monthly price alerts</strong> — we'll email you when material costs move
      </p>
      <a href="https://estiquote.co.uk/dashboard.html" class="btn">Go to my dashboard →</a>
      <div class="divider"></div>
      <p class="p" style="font-size:13px;color:#888">You can cancel any time from Settings in your dashboard. No lock-in, no questions asked.</p>
    `)
  }),

  material_alert: ({ name, movements }) => ({
    subject: `UK material price update — ${new Date().toLocaleDateString('en-GB', {month:'long', year:'numeric'})}`,
    html: baseTemplate(`
      <h1 class="h1">UK construction material prices — ${new Date().toLocaleDateString('en-GB', {month:'long', year:'numeric'})}</h1>
      <p class="p">Hi ${name}, here's your monthly material price update. These movements affect your Estiquote estimates.</p>
      <div class="divider"></div>
      ${movements.map(m => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #f0f0f0;">
          <span style="font-size:14px;color:#333;">${m.material}</span>
          <span style="font-size:14px;font-weight:700;color:${m.change > 0 ? '#ef4444' : '#00c9a7'}">
            ${m.change > 0 ? '▲' : '▼'} ${Math.abs(m.change)}%
          </span>
        </div>`).join('')}
      <div class="divider"></div>
      <p class="p">Your saved estimates have been automatically updated to reflect current pricing.</p>
      <a href="https://estiquote.co.uk/dashboard.html" class="btn">View my estimates →</a>
    `)
  }),

  win_back: ({ name = 'there' } = {}) => ({
    subject: 'We miss you — 30% off Estiquote Pro',
    html: baseTemplate(`
      <h1 class="h1">Come back to Estiquote</h1>
      <p class="p">Hi ${name}, your account is still here. Use code <strong>COMEBACK30</strong> for 30% off your first 3 months.</p>
      <a href="https://estiquote.co.uk/pricing.html" class="btn">Claim 30% off →</a>
      <div class="divider"></div>
      <p class="p" style="font-size:12px;color:#888">Offer expires in 7 days.</p>
    `)
  }),

  promo_offer: ({ name = 'there' } = {}) => ({
    subject: 'Your Estiquote trial — upgrade now and save',
    html: baseTemplate(`
      <h1 class="h1">Upgrade to Pro</h1>
      <p class="p">Hi ${name}, upgrade from your free account and lock in your rate.</p>
      <div class="highlight">
        <p><strong>Pro — £9.99/month</strong> — full material tracker, saved estimates, PDF export and quote comparison.</p>
      </div>
      <a href="https://estiquote.co.uk/pricing.html" class="btn">Upgrade now →</a>
      <div class="divider"></div>
      <p class="p" style="font-size:12px;color:#888">Cancel anytime. No lock-in.</p>
    `)
  })
};

// ── SEND VIA RESEND ───────────────────────────────────────────
async function sendEmail(to, template, data) {
  if (!RESEND_API_KEY) {
    console.log('[send-email] No RESEND_API_KEY — email skipped');
    return { skipped: true };
  }

  const { subject, html } = template(data);

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      reply_to: REPLY_TO,
      to: Array.isArray(to) ? to : [to],
      subject,
      html
    })
  });

  const result = await res.json();
  if (!res.ok) throw new Error(result.message || 'Resend error');
  return result;
}

// ── NETLIFY HANDLER ───────────────────────────────────────────
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  const { type, to, data } = body;

  if (!type || !to) {
    return { statusCode: 400, body: 'Missing type or to' };
  }

  const template = templates[type];
  if (!template) {
    return { statusCode: 400, body: `Unknown email type: ${type}` };
  }

    try {
    const result = await sendEmail(to, template, data || {});
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, ...result })
    };
  } catch (err) {
    console.error('[send-email] Error:', err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: err.message })
    };
  }
};
