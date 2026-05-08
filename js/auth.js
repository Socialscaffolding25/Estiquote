// ================================================================
// ESTIQUOTE — Supabase Auth & Data Layer
// js/auth.js — included on every page
// ================================================================

const SUPABASE_URL = atob('aHR0cHM6Ly93dnVsdHN4aXFqa2lzYmVpZGpjbC5zdXBhYmFzZS5jbw==');
const SUPABASE_KEY = atob('c2JfcHVibGlzaGFibGVfdTN2RUkxTDVPaDYtQ1BNTndSU09Fd19MRVpvSkxnVw==');

let _supabase = null;
function getClient() {
  if (!_supabase && typeof supabase !== 'undefined') {
    _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  }
  return _supabase;
}

const EQ = {

  async signUp(name, email, password, plan = 'free', postcode = '') {
    // Input validation (release-review: HIGH)
    name     = (name     || '').trim();
    email    = (email    || '').trim().toLowerCase();
    password = (password || '').trim();
    postcode = (postcode || '').trim().toUpperCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { success: false, error: 'invalid_email' };
    if (!password || password.length < 8) return { success: false, error: 'password_too_short' };
    if (!name || name.length < 2) return { success: false, error: 'name_required' };
    const sb = getClient();
    if (!sb) return { success: false, error: 'Supabase not loaded' };
    const { data, error } = await sb.auth.signUp({
      email, password,
      options: { data: { name, postcode, plan } }
    });
    if (error) return { success: false, error: error.message };
    if (data.user) {
      // Always create profile with 'free' plan
      // Plan upgrades only happen AFTER Stripe payment confirmed
      await sb.from('profiles').upsert({
        id: data.user.id, email, name,
        postcode: postcode.toUpperCase(), plan: 'free'
      });
    }
    return { success: true, user: data.user };
  },

  async signIn(email, password) {
    // Input sanitisation
    email    = (email    || '').trim().toLowerCase();
    password = (password || '').trim();
    if (!email || !password) return { success: false, error: 'missing_fields' };
    const sb = getClient();
    if (!sb) return { success: false, error: 'Supabase not loaded' };
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.message.toLowerCase().includes('invalid')) return { success: false, error: 'wrong_password' };
      return { success: false, error: 'no_account' };
    }
    return { success: true, user: data.user };
  },

  async signOut(redirect = true) {
    const sb = getClient();
    if (sb) await sb.auth.signOut();
    sessionStorage.removeItem('eq_user_cache');
    if (redirect) window.location.href = 'index.html';
  },

  async getUser() {
    try {
    const sb = getClient();
    if (!sb) return null;
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return null;
    let { data: profile } = await sb.from('profiles').select('*').eq('id', user.id).single();
    // If profile missing (race condition on signup), create it now
    if (!profile) {
      await sb.from('profiles').upsert({
        id: user.id, email: user.email,
        name: user.user_metadata?.name || user.email.split('@')[0],
        plan: 'free'
      });
      const { data: retried } = await sb.from('profiles').select('*').eq('id', user.id).single();
      profile = retried;
    }
    if (!profile) return null;
    const u = {
      id: user.id, email: user.email,
      name: profile.name, postcode: profile.postcode,
      plan: profile.plan || 'free',
      pro: profile.plan === 'pro' || profile.plan === 'trade',
      stripe_customer_id: profile.stripe_customer_id,
      subscription_status: profile.subscription_status
    };
    sessionStorage.setItem('eq_user_cache', JSON.stringify(u));
    return u;
    } catch(e) { console.error('getUser error:', e); return null; }
  },

  getUserSync() {
    try { return JSON.parse(sessionStorage.getItem('eq_user_cache')); } catch(e) { return null; }
  },

  isPro(user) {
    if (!user) user = this.getUserSync();
    return !!(user && (user.pro === true || user.plan === 'pro' || user.plan === 'trade'));
  },

  isTrade(user) {
    if (!user) user = this.getUserSync();
    return !!(user && user.plan === 'trade');
  },

  isLoggedIn() { return !!this.getUserSync(); },

  async upgradePlan(plan) {
    const sb = getClient();
    if (!sb) return;
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return;
    await sb.from('profiles').update({
      plan, plan_activated_at: new Date().toISOString(), subscription_status: 'active'
    }).eq('id', user.id);
    const cached = this.getUserSync();
    if (cached) {
      cached.plan = plan;
      cached.pro = plan === 'pro' || plan === 'trade';
      sessionStorage.setItem('eq_user_cache', JSON.stringify(cached));
    }
  },

  async resetPassword(email) {
    const sb = getClient();
    if (!sb) return { success: false };
    const { error } = await sb.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://estiquote.co.uk/set-password.html'
    });
    return { success: !error, error: error?.message };
  },

  async getProjects() {
    try {
    const sb = getClient();
    if (!sb) return [];
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return [];
    const { data } = await sb.from('projects')
      .select('*').eq('user_id', user.id)
      .order('created_at', { ascending: false });
    return data || [];
    } catch(e) { console.error('getProjects error:', e); return []; }
  },

  async saveProject(project) {
    const sb = getClient();
    if (!sb) return false;
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return false;
    const profile = this.getUserSync();
    const projects = await this.getProjects();
    if (!this.isPro(profile) && projects.length >= 3) return 'limit_reached';
    const { error } = await sb.from('projects').insert({
      user_id: user.id,
      trade: project.trade, region: project.region,
      quality: project.quality, area: project.area,
      estimate: project.estimate,
      estimate_low: project.estimate_low,
      estimate_high: project.estimate_high,
      per_sqm: project.per_sqm,
      contingency: project.contingency,
      extras: project.extras || []
    });
    return !error;
  },

  async deleteProject(id) {
    const sb = getClient();
    if (!sb) return;
    await sb.from('projects').delete().eq('id', id);
  },

  async checkStripeReturn() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      const plan = params.get('plan') || 'pro';
      await this.upgradePlan(plan);
      window.history.replaceState({}, '', 'dashboard.html');
      return { upgraded: true, plan };
    }
    if (params.get('canceled') === 'true') {
      window.history.replaceState({}, '', 'dashboard.html');
      return { canceled: true };
    }
    return null;
  },

  updateNav(user) {
    const navLinks  = document.querySelector('.nav-links');
    const navMobile = document.querySelector('.nav-mobile');
    if (!navLinks) return;
    if (user) {
      const initials  = (user.name || user.email || '?').split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
      const planLabel = user.plan === 'trade' ? 'TRADE' : user.plan === 'pro' ? 'PRO' : 'FREE';
      const planColor = this.isPro(user) ? '#00c9a7' : 'rgba(255,255,255,0.4)';
      const sl = navLinks.querySelector('a[href="login.html"]');
      const su = navLinks.querySelector('a[href="signup.html"]');
      if (sl) sl.outerHTML = `<a href="dashboard.html" class="nav-link" style="color:var(--teal-light);font-weight:600">Dashboard</a>`;
      if (su) su.outerHTML = `<a href="dashboard.html" style="display:flex;align-items:center;gap:8px;text-decoration:none;padding:6px 12px;background:rgba(0,201,167,0.1);border:1px solid rgba(0,201,167,0.25);border-radius:8px;"><span style="width:26px;height:26px;border-radius:50%;background:var(--teal);color:#0b1120;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;">${initials}</span><span style="font-size:12px;font-weight:700;color:${planColor};">${planLabel}</span></a>`;
      if (navMobile) {
        const ms = navMobile.querySelector('a[href="login.html"]');
        const mu = navMobile.querySelector('a[href="signup.html"],.mobile-cta');
        if (ms) ms.outerHTML = `<a href="dashboard.html">Dashboard</a>`;
        if (mu) mu.outerHTML = `<a href="dashboard.html" class="mobile-cta">My account (${planLabel})</a>`;
      }
    }
  },

  async init() {
    const sb = getClient();
    if (!sb) return;
    sb.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const user = await this.getUser();
        this.updateNav(user);
      } else {
        sessionStorage.removeItem('eq_user_cache');
        this.updateNav(null);
      }
    });
    const { data: { session } } = await sb.auth.getSession();
    if (session?.user) {
      const user = await this.getUser();
      this.updateNav(user);
    }
  }
};

document.addEventListener('DOMContentLoaded', () => EQ.init());
