const CACHE_NAME = 'yubot-model-cache-v3'

const YUBOT_MODEL_URLS = [
  '/models/yubot/stream/stage-01-face-v3.glb',
  '/models/yubot/stream/stage-02-head-shell-v3.glb',
  '/models/yubot/stream/stage-03-upper-body-v3.glb',
  '/models/yubot/stream/stage-04-arms-v3.glb',
  '/models/yubot/stream/stage-05-lower-body-v3.glb',
  '/models/yubot/stream/stage-06-legs-v3.glb',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(YUBOT_MODEL_URLS)),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith('yubot-model-cache-') && key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      ),
    ),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url)

  if (!YUBOT_MODEL_URLS.includes(requestUrl.pathname)) {
    return
  }

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(event.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse

        return fetch(event.request).then((networkResponse) => {
          cache.put(event.request, networkResponse.clone())
          return networkResponse
        })
      }),
    ),
  )
})
