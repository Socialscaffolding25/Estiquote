// netlify/functions/stripe-webhook.js
// Handles Stripe payment events and updates Supabase plan automatically

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL     = process.env.SUPABASE_URL;
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

// Map Stripe price IDs to Estiquote plan names
// UPDATE THESE with your real Stripe Price IDs from the dashboard
const PRICE_TO_PLAN = {
  // Test mode price IDs — replace with live price IDs when you go live
  'price_homeowner_pro':      'pro',
  'price_homeowner_trade':    'trade',
  'price_builder_listed':     'builder_listed',
  'price_builder_featured':   'builder_featured',
  'price_builder_pro':        'builder_pro',
};

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE);
  let stripeEvent;

  try {
    // Verify webhook signature if secret is set
    if (STRIPE_WEBHOOK_SECRET && event.headers['stripe-signature']) {
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      stripeEvent = stripe.webhooks.constructEvent(
        event.body,
        event.headers['stripe-signature'],
        STRIPE_WEBHOOK_SECRET
      );
    } else {
      stripeEvent = JSON.parse(event.body);
    }
  } catch (err) {
    console.error('Webhook signature failed:', err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  const data = stripeEvent.data.object;

  try {
    switch (stripeEvent.type) {

      case 'checkout.session.completed':
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const email = data.customer_email || data.metadata?.email;
        const customerId = data.customer;
        const subscriptionId = data.id || data.subscription;

        // Determine plan from price ID
        const priceId = data.items?.data?.[0]?.price?.id ||
                        data.plan?.id ||
                        data.metadata?.plan;
        const plan = PRICE_TO_PLAN[priceId] || data.metadata?.plan || 'pro';

        if (email || customerId) {
          // Find user by email or stripe customer ID
          let query = sb.from('profiles');
          if (email) {
            query = query.eq('email', email);
          } else {
            query = query.eq('stripe_customer_id', customerId);
          }

          const { data: profiles } = await query.select('id').single();

          if (profiles?.id) {
            // Option A: payment = verified for builder plans
            const isBuilderPlan = ['builder_listed','builder_featured','builder_pro'].includes(plan);
            const updatePayload = {
              plan,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              subscription_status: 'active',
              plan_activated_at: new Date().toISOString(),
            };
            // Builder plans get verified=true on payment (active subscription = verified identity)
            if (isBuilderPlan) {
              updatePayload.verified = true;
              updatePayload.verified_at = new Date().toISOString();
              updatePayload.verified_method = 'payment';
            }
            await sb.from('builders').update(updatePayload).eq('id', profiles.id);
            // Also update profiles table
            await sb.from('profiles').update(updatePayload).eq('id', profiles.id);

            console.log(`✓ Plan upgraded to ${plan} for ${email || customerId}${isBuilderPlan ? ' (verified)' : ''}`);
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        // Subscription cancelled — downgrade to free
        const customerId = data.customer;

        const { data: profiles } = await sb.from('profiles')
          .select('id').eq('stripe_customer_id', customerId).single();

        if (profiles?.id) {
          await sb.from('profiles').update({
            plan: 'free',
            subscription_status: 'cancelled',
            stripe_subscription_id: null,
            verified: false,
            verified_method: null
          }).eq('id', profiles.id);
          // Also clear from builders table
          await sb.from('builders').update({
            plan: 'free',
            subscription_status: 'cancelled',
            verified: false,
          }).eq('id', profiles.id).maybeSingle();

          console.log(`✓ Plan downgraded to free for customer ${customerId}`);
        }
        break;
      }

      case 'invoice.payment_failed': {
        // Payment failed — mark subscription as past_due
        const customerId = data.customer;

        const { data: profiles } = await sb.from('profiles')
          .select('id').eq('stripe_customer_id', customerId).single();

        if (profiles?.id) {
          await sb.from('profiles').update({
            subscription_status: 'past_due'
          }).eq('id', profiles.id);
        }
        break;
      }
    }

    return { statusCode: 200, body: JSON.stringify({ received: true }) };

  } catch (err) {
    console.error('Webhook handler error:', err);
    return { statusCode: 500, body: `Handler error: ${err.message}` };
  }
};
