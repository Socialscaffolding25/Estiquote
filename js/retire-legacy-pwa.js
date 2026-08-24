// Estiquote is now an iPhone app with a static marketing site. Remove the
// superseded web-app worker and its cached app shell after the new site ships.
(async () => {
  if ("serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
  }

  if ("caches" in window) {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
  }
})().catch(() => {
  // Cache cleanup must never prevent the marketing site from loading.
});
