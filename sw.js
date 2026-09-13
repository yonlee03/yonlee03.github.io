/* Service Worker del panel personal (noticias + alineaciones + tiempo)
   Estrategia: stale-while-revalidate -> responde rápido desde caché
   y actualiza en segundo plano. Así el panel abre al instante y funciona
   sin conexión. Los HTML se regeneran cada 30 min; con la revalidación
   en segundo plano el móvil siempre acaba viendo la última versión. */
const CACHE = "panel-v1";
const NAV = ["/noticias/index.html", "/noticias/alineaciones.html", "/weather.html"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(NA)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  // Respuesta rápida desde caché + actualización en segundo plano
  e.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
