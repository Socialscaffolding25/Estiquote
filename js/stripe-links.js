// ============================================================
// ESTIQUOTE — STRIPE PAYMENT LINKS (LIVE MODE)
// Updated: May 2026
// ============================================================

const STRIPE_LINKS = {
  homeowner_pro:     'https://buy.stripe.com/5kQbIU9UwgRT3R2fOG8og00',
  homeowner_trade:   'https://buy.stripe.com/5kQ28k8Qs7hj87i7ia8og01',
  builder_listed:    'https://buy.stripe.com/28E6oA0jW7hjgDOdGy8og02',
  builder_featured:  'https://buy.stripe.com/dRmeV6d6IatvevGdGy8og03',
  builder_pro:       'https://buy.stripe.com/3cI9AMeaM0SVcnydGy8og04',
};

function goToStripe(plan, email = '') {
  const url = STRIPE_LINKS[plan];
  if (!url) { console.warn('Unknown Stripe plan:', plan); return; }
  const fullUrl = email ? url + '?prefilled_email=' + encodeURIComponent(email) : url;
  window.location.href = fullUrl;
}
