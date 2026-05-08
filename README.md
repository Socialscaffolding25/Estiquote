# Estiquote — Deployment Checklist

## ✅ Code complete — manual actions required before going live

### CRITICAL (do these first)
- [ ] Set 8 Netlify environment variables (Site config → Environment variables)
      SUPABASE_URL = https://wvultsxiqjkisbeidjcl.supabase.co
      SUPABASE_SERVICE_KEY = sb_secret_y6LTrgfgEr4zj5P20GYKxg_8qrX8nC3
      STRIPE_SECRET_KEY = [from Stripe dashboard — live mode]
      STRIPE_WEBHOOK_SECRET = [from Stripe webhook config]
      RESEND_API_KEY = [from resend.com]
      VAPID_PUBLIC_KEY = [from vapidkeys.com]
      VAPID_PRIVATE_KEY = [from vapidkeys.com]
      VAPID_EMAIL = mailto:estiquoteofficial@gmail.com

- [ ] Run supabase-builder-schema.sql in Supabase SQL Editor
- [ ] Run supabase-verification-migration.sql (after first real builders sign up)
- [ ] Add https://estiquote.co.uk/set-password.html to Supabase
      Auth → URL Configuration → Redirect URLs
- [ ] Switch Stripe to LIVE mode
      Open js/stripe-links.js → replace all test_ URLs with live payment links
- [ ] Add custom domain estiquote.co.uk in Netlify → Domain management
- [ ] Set up Stripe webhook in Stripe dashboard
      Endpoint: https://estiquote.co.uk/.netlify/functions/stripe-webhook
      Events: checkout.session.completed, customer.subscription.deleted

### HIGH (do within first week)
- [ ] Generate VAPID keys at vapidkeys.com → add to Netlify env vars
- [ ] Set up Resend account → verify estiquote.co.uk domain
- [ ] Sign up to Plausible.io → add estiquote.co.uk as a site (free trial)
- [ ] Upgrade Netlify to Pro ($19/mo) to avoid free tier limits
- [ ] Seed 10+ builders via WhatsApp to Hartwood contacts

### ONGOING
- [ ] Monthly: update material prices in materials.html
- [ ] Monthly: review builder enquiries in admin.html
- [ ] Weekly: check Netlify function logs for errors

## Tech stack
- Frontend: Vanilla HTML/CSS/JS (19 pages)
- Database: Supabase (PostgreSQL)
- Auth: Supabase Auth
- Payments: Stripe Payment Links
- Email: Resend
- Push: Web Push (VAPID)
- Hosting: Netlify (static + functions)
- Analytics: Plausible
- Maps: Leaflet.js + OpenStreetMap

## Deploy process
1. Download zip from Claude
2. Unzip → open estiquote-deploy folder
3. Go to github.com/Socialscaffolding25/Estiquote
4. Add file → Upload files → Cmd+A all files → drag in
5. Commit with version message
6. Netlify auto-deploys in ~30 seconds
NEVER upload the zip file itself — always unzip first.
