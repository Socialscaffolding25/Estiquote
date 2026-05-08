// ================================================================
// STRIPE PAYMENT LINKS
// ================================================================
// ⚠ CURRENTLY IN TEST MODE — ALL LINKS START WITH test_
//
// TO SWITCH TO LIVE MODE:
// 1. Go to Stripe Dashboard → Payment Links
// 2. Create live versions of each link (switch from Test to Live mode top-right)
// 3. Replace each test_ URL below with the live buy.stripe.com URL
// 4. The demo banner will disappear automatically once test_ is removed
// ================================================================

// ============================================================
// ESTIQUOTE — STRIPE PAYMENT LINKS
// ============================================================
// Replace each URL below with your real Stripe Payment Link
// after creating them in your Stripe dashboard.
//
// How to create:
// 1. dashboard.stripe.com → Payment Links → + New
// 2. Set product name, price, billing period
// 3. Copy the link and paste below
//
// Stripe Payment Links look like: https://buy.stripe.com/abc123
// ============================================================

const STRIPE_LINKS = {

  // HOMEOWNER PLANS
  homeowner_pro:    'https://buy.stripe.com/test_7sYdRa1tm8pe8g49xb9MY00',
  // Estiquote Pro — £9.99/month

  homeowner_trade:  'https://buy.stripe.com/test_bJedRa8VObBq67W6kZ9MY02',
  // Estiquote Trade — £29/month

  // BUILDER PLANS
  builder_listed:   'https://buy.stripe.com/test_8x2cN63Bu6h68g4aBf9MY01',
  // Builder Listed — £29/month

  builder_featured: 'https://buy.stripe.com/test_3cI9AUeg80WMcwk4cR9MY03',
  // Builder Featured — £59/month

  builder_pro:      'https://buy.stripe.com/test_3cIeVe1tmaxmeEsbFj9MY04',
  // Builder Pro — £99/month

};

// Central function — call this from any button
// email param pre-fills the Stripe checkout page
function goToStripe(plan, email) {
  let url = STRIPE_LINKS[plan];
  if (!url || url.includes('REPLACE')) {
    alert('Payment system launching soon.\nEmail estiquoteofficial@gmail.com to get early access.');
    return;
  }

  // Build return URL — Stripe redirects here after payment
  const base = window.location.origin;
  const planParam = plan.replace('homeowner_', '').replace('builder_', 'builder_');
  const successUrl = encodeURIComponent(base + '/dashboard.html?success=true&plan=' + planParam);

  // Append params
  const sep = url.includes('?') ? '&' : '?';
  if (email) url += sep + 'prefilled_email=' + encodeURIComponent(email);

  // Note: Stripe Payment Links support ?success_url= param
  // This tells Stripe where to redirect after payment
  const finalUrl = url + (email ? '&' : sep) + 'success_url=' + successUrl;

  window.location.href = finalUrl;
}
