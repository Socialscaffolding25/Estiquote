# Estiquote App Store metadata

## App identity

- Name: Estiquote
- Bundle ID: `uk.estiquote.app`
- Version: 1.0
- Primary category: Utilities
- Secondary category: Productivity
- Availability: all App Store countries where Apple makes the selected products available
- Primary language: English (UK)

## Subtitle

Home renovation cost guide

## Promotional text

Country-aware home-project cost guidance, material benchmarks and quote comparison - built for expensive decisions you do not want to guess.

## Description

Know the number before you call anyone.

Estiquote gives homeowners and trades a clear starting point for home-project costs. Choose the country, local area type, project, size and finish to create an indicative planning range in local currency. Extension and new-build scopes are separated, and relevant extra allowances scale with project size.

FREE

- One saved top-line estimate
- Eight project categories
- Country and local-area adjustment
- Material guide preview

PROJECT PASS

A one-time Apple in-app purchase for one active homeowner project at a time.

- Numbered, project-specific schedule of works
- Labour, material and preliminaries values that reconcile to the planning midpoint
- Recommended contingency
- Complete country-aware material guide
- Shareable project PDF
- No recurring homeowner charge

TRADE

A monthly Apple subscription for people who estimate repeatedly.

- Unlimited saved projects
- Adjustable markup and client totals
- Optional business logo on client PDF reports
- Written quote comparison
- Client-ready PDF reports
- Everything included with Project Pass

Estiquote supports all 175 countries and regions in Apple's current App Store availability list. The selected market changes currency, planning value and construction units: US projects use square feet and supported US material quantities, while the UK and most other markets use metric units. Country conversion uses bundled World Bank economy-wide purchasing-power data applied to Estiquote's UK guide baseline, with bundled local-currency fallbacks where purchasing-power data is unavailable. It works offline, is not a live construction index or supplier feed, and local pack sizes and trade conventions can differ. The app labels its market source and recommends obtaining at least three detailed written quotes.

No account is required in this version. Projects, contractor quote entries and the optional Trade business logo are stored locally on the iPhone.

## Keywords

estimate,builder,construction,remodel,extension,materials,budget,contractor,trade,property,boq

The subtitle is 26 bytes and the keyword field is 94 bytes. The description and promotional text are also within Apple's current App Store Connect limits. The keyword field deliberately avoids repeating words already present in the app name or subtitle.

## URLs required before submission

- Marketing URL: `https://estiquote.co.uk/`
- Support URL: `https://estiquote.co.uk/support.html`
- Privacy policy URL: `https://estiquote.co.uk/privacy.html`
- Terms URL: `https://estiquote.co.uk/terms.html`

The static source for all four pages is present in this repository. The domain and `estiquoteofficial@gmail.com` support mailbox must be live before submission.

## In-app purchases

### Project Pass

- Product ID: `uk.estiquote.projectpass`
- Type: Non-Consumable
- Reference name: Estiquote Project Pass
- UK target price: GBP 9.99
- Customer display name: Project Pass
- Customer description: Full estimate, materials & PDF for 1 project

### Trade

- Product ID: `uk.estiquote.trade.monthly`
- Type: Auto-Renewable Subscription
- Duration: 1 month
- Reference name: Estiquote Trade Monthly
- Subscription group: Estiquote Trade
- UK target price: GBP 19.99 per month
- Customer display name: Estiquote Trade
- Customer description: Unlimited projects, markup, quotes and PDFs

Use Apple's storefront price equalisation when configuring other countries. Review local purchasing power and tax-inclusive display prices before making every storefront available.

The customer-facing names are within Apple's 30-character limit and both customer descriptions are within the 45-character in-app-purchase limit.

## App privacy preparation

The current build:

- does not require an Estiquote account;
- stores project data, written quote entries, markups and country preference locally;
- uses a bundled, offline country-pricing snapshot and does not send the selected country to a market-data provider;
- uses StoreKit for purchase and entitlement verification;
- includes no advertising SDK or behavioural analytics SDK.

Confirm the final App Privacy answers against Apple's current definitions and the signed production build.

## Age rating preparation

No user-generated public content, gambling, violence, medical treatment, unrestricted web access or mature material is present. Complete the current App Store Connect age-rating questionnaire using the production build.
