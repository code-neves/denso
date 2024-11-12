self.addEventListener('install', event => {
    console.log('Service Worker installing...');
    event.waitUntil(
      caches.open('v1').then(cache => {
        console.log('Caching assets');
        return cache.addAll([
          '/',
          '/index.html',
          '/style.css',
          '/script.js',
          '/assets/icons/icon-192x192.png',
          '/assets/icons/icon-512x512.png'
        ]);
      }).catch(error => {
        console.error('Error caching assets: ', error);
      })
    );
  });
  
  self.addEventListener('fetch', event => {
    event.respondWith(
      caches.match(event.request).then(response => {
        if (response) {
          console.log('Serving from cache: ', event.request.url);
          return response;
        }
        console.log('Fetching from network: ', event.request.url);
        return fetch(event.request);
      }).catch(error => {
        console.error('Error in fetch handler: ', error);
      })
    );
  });
  