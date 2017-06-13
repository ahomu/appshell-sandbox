importScripts('workbox-sw.v1.0.1.js');

const workbox = new self.WorkboxSW({
  skipWaiting: true
});
self.workbox.logLevel = self.workbox.LOG_LEVEL.verbose;
workbox.precache([]); /* placeholder */
workbox.router.registerNavigationRoute('/app-shell', {
  whitelist: [/^\/$/, /^\/foo\/?$/, /^\/bar\/?$/] // TODO auto configuration from config/fragments.
});
