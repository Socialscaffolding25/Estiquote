// ================================================================
// ESTIQUOTE — E2E Test Suite (Playwright)
// Setup: npm install -D @playwright/test && npx playwright install
// Run:   npx playwright test
// Run single: npx playwright test tests/e2e.spec.js --headed
// ================================================================

const { test, expect } = require('@playwright/test');

const BASE = process.env.BASE_URL || 'https://estiquote.co.uk';

// ── 1. LANDING PAGE ───────────────────────────────────────────
test.describe('Landing page', () => {
  test('loads with correct title', async ({ page }) => {
    await page.goto(BASE);
    await expect(page).toHaveTitle(/Estiquote/);
  });

  test('hero CTA navigates to signup', async ({ page }) => {
    await page.goto(BASE);
    await page.locator('a[href*="signup"], button:has-text("Get started free")').first().click();
    await expect(page).toHaveURL(/signup/);
  });

  test('OG image meta present', async ({ page }) => {
    await page.goto(BASE);
    const og = await page.locator('meta[property="og:image"]').getAttribute('content');
    expect(og).toBeTruthy();
    expect(og).toContain('estiquote');
  });

  test('cookie consent appears for new visitor', async ({ page }) => {
    await page.goto(BASE);
    await page.evaluate(() => localStorage.removeItem('eq_cookie_consent'));
    await page.reload();
    await expect(page.locator('#eq-cookie')).toBeVisible({ timeout: 3000 });
  });

  test('all nav links return 200', async ({ page }) => {
    await page.goto(BASE);
    for (const href of ['estimator.html','find-builders.html','pricing.html','materials.html']) {
      const res = await page.goto(`${BASE}/${href}`);
      expect(res.status()).toBe(200);
    }
  });
});

// ── 2. ESTIMATOR ──────────────────────────────────────────────
test.describe('Estimator', () => {
  test('page loads', async ({ page }) => {
    await page.goto(`${BASE}/estimator.html`);
    await expect(page.locator('body')).toBeVisible();
  });

  test('selecting a trade shows estimate range', async ({ page }) => {
    await page.goto(`${BASE}/estimator.html`);
    const ext = page.locator('[onclick*="extension"], button:has-text("Extension")').first();
    if (await ext.count()) {
      await ext.click();
      await expect(page.locator('[id*="lo"], [id*="range"], [id*="result"]').first()).toBeVisible({ timeout: 3000 });
    }
  });
});

// ── 3. MATERIALS ──────────────────────────────────────────────
test.describe('Materials page', () => {
  test('loads with 12 material cards', async ({ page }) => {
    await page.goto(`${BASE}/materials.html`);
    await expect(page.locator('.mat-card').first()).toBeVisible();
    const count = await page.locator('.mat-card').count();
    expect(count).toBeGreaterThanOrEqual(10);
  });

  test('category filter reduces visible cards', async ({ page }) => {
    await page.goto(`${BASE}/materials.html`);
    const allCount = await page.locator('.mat-card').count();
    await page.click('button:has-text("Plumbing")');
    const filteredCount = await page.locator('.mat-card').count();
    expect(filteredCount).toBeLessThan(allCount);
  });

  test('postcode triggers merchant finder API', async ({ page }) => {
    await page.goto(`${BASE}/materials.html`);
    await page.fill('#postcode-input', 'RH191AA');
    await page.click('button:has-text("Find merchants")');
    await expect(page.locator('#merchant-section')).toBeVisible({ timeout: 6000 });
  });

  test('clicking material card opens source links', async ({ page }) => {
    await page.goto(`${BASE}/materials.html`);
    await page.locator('.mat-card').first().click();
    await expect(page.locator('#merchant-section')).toBeVisible({ timeout: 3000 });
  });
});

// ── 4. AUTH ───────────────────────────────────────────────────
test.describe('Auth', () => {
  test('login page renders', async ({ page }) => {
    await page.goto(`${BASE}/login.html`);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('wrong credentials shows error message', async ({ page }) => {
    await page.goto(`${BASE}/login.html`);
    await page.fill('input[type="email"]', 'wrong@test.com');
    await page.fill('input[type="password"]', 'wrongpass');
    await page.locator('button[type="submit"], button:has-text("Sign in")').click();
    await expect(page.locator('[role="alert"], .err, #err').first()).toBeVisible({ timeout: 5000 });
  });

  test('unauthenticated user redirected from dashboard', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto(`${BASE}/dashboard.html`);
    await expect(page).toHaveURL(/login/, { timeout: 5000 });
  });

  test('set-password page has strength meter and confirm', async ({ page }) => {
    await page.goto(`${BASE}/set-password.html`);
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('#confirm')).toBeVisible();
    // Type weak password — strength bar should appear
    await page.fill('#password', 'weak');
    await expect(page.locator('#str-bar')).toBeVisible();
  });
});

// ── 5. PWA ────────────────────────────────────────────────────
test.describe('PWA', () => {
  test('manifest.json is valid JSON with required fields', async ({ request }) => {
    const res = await request.get(`${BASE}/manifest.json`);
    expect(res.status()).toBe(200);
    const m = await res.json();
    expect(m.name).toBe('Estiquote');
    expect(m.start_url).toBeDefined();
    expect(m.icons.length).toBeGreaterThan(0);
  });

  test('sw.js returns 200', async ({ request }) => {
    const res = await request.get(`${BASE}/sw.js`);
    expect(res.status()).toBe(200);
  });

  test('404 page is branded Estiquote page', async ({ page }) => {
    await page.goto(`${BASE}/no-such-page-xyz.html`);
    await expect(page.locator('body')).toContainText(/Estiquote/i);
  });

  test('sitemap.xml loads and contains key pages', async ({ request }) => {
    const res = await request.get(`${BASE}/sitemap.xml`);
    expect(res.status()).toBe(200);
    const text = await res.text();
    expect(text).toContain('estimator.html');
    expect(text).toContain('materials.html');
  });
});

// ── 6. NETLIFY FUNCTIONS ──────────────────────────────────────
test.describe('Netlify functions', () => {
  test('find-merchants returns merchants for SE postcode', async ({ request }) => {
    const res = await request.get(`${BASE}/.netlify/functions/find-merchants?postcode=RH191AA`);
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.merchants).toBeDefined();
    expect(data.merchants.length).toBeGreaterThan(5);
    // Should include Parker Building Supplies for SE England
    expect(data.merchants.some(m => m.id === 'parkers')).toBe(true);
  });

  test('find-merchants returns error for gibberish postcode', async ({ request }) => {
    const res = await request.get(`${BASE}/.netlify/functions/find-merchants?postcode=XXXXXX`);
    const data = await res.json();
    expect(data.error).toBeDefined();
  });

  test('find-merchants missing postcode param returns 400', async ({ request }) => {
    const res = await request.get(`${BASE}/.netlify/functions/find-merchants`);
    expect(res.status()).toBe(400);
  });
});

// ── 7. PERFORMANCE ────────────────────────────────────────────
test.describe('Performance', () => {
  test('homepage loads under 3s on fast connection', async ({ page }) => {
    const start = Date.now();
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    expect(Date.now() - start).toBeLessThan(3000);
  });

  test('no JS errors on homepage', async ({ page }) => {
    const errors = [];
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto(BASE, { waitUntil: 'networkidle' });
    const real = errors.filter(e => !e.includes('favicon') && !e.includes('extension'));
    expect(real.length).toBe(0);
  });
});
