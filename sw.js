// Memory Link — Service Worker
// 앱 전체를 캐시해서 오프라인에서도 동작
const CACHE = 'memory-link-v2';
const ASSETS = [
  './index.html',
  './manifest.json'
];

// 설치 시 핵심 파일 캐시
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// 구버전 캐시 정리
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

// 요청 처리 — 캐시 우선, 실패하면 네트워크
self.addEventListener('fetch', function(e) {
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      if (cached) return cached;
      return fetch(e.request).then(function(response) {
        // 성공한 응답은 캐시에 저장
        if (response && response.status === 200) {
          var clone = response.clone();
          caches.open(CACHE).then(function(cache) {
            cache.put(e.request, clone);
          });
        }
        return response;
      }).catch(function() {
        // 완전 오프라인 상태에서는 index.html 반환
        return caches.match('./index.html');
      });
    })
  );
});
