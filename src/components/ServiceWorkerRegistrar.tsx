'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        // Ask the browser to re-check sw.js on every load, and again when the tab
        // regains focus. Without this a device can sit on an old worker (and so an
        // old cached app) for up to 24h after a deploy.
        registration.update().catch(() => {});

        const onFocus = () => registration.update().catch(() => {});
        window.addEventListener('focus', onFocus);

        // A new worker took over (skipWaiting + clients.claim): reload once so the
        // page isn't left running the previous build's assets.
        let reloading = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (reloading) return;
          reloading = true;
          window.location.reload();
        });

        return () => window.removeEventListener('focus', onFocus);
      })
      .catch(console.error);
  }, []);

  return null;
}
