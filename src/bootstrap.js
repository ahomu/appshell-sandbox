import UniversalRouter from 'universal-router';
import to from 'await-to-js';
import fragmentsConfig from './config/fragments';
import './config/vendors';

const router = new UniversalRouter(fragmentsConfig.map((fragmentConfig) => {
  return {
    path: fragmentConfig.path,
    async action() {
      const [err, fragmentContent] = await to(
        import(/* webpackChunkName: "[request]" */ `./fragments/${fragmentConfig.name}/index`)
      );
      if (err) throw err;
      return {
        content: fragmentContent.default,
        config: fragmentConfig,
      };
    }
  };
}));

function updateMetaElements({title, description}) {
  document.title = title;
  document.querySelector('meta[name="description"]').content = description;
  document.querySelector('meta[name="twitter:title"]').content = title;
  document.querySelector('meta[name="twitter:description"]').content = description;
  document.querySelector('meta[property="og:title"]').content = title;
  document.querySelector('meta[property="og:description"]').content = description;
}

async function resolvePage(path) {
  const [err, fragment] = await to(router.resolve(path));
  if (err) {
    console.error(err);
  }
  document.getElementById('container').innerHTML = fragment.content;
  updateMetaElements(fragment.config)
}

(function bootstrap() {

  resolvePage(location.pathname);

  window.addEventListener('click', function(event) {
    if (event.target.tagName === 'A') {
      history.pushState({}, event.target.textContent, event.target.href);
      resolvePage(location.pathname);
    }
    event.preventDefault();
  }, true);

  window.addEventListener('popstate', function() {
    resolvePage(location.pathname);
  });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          registration.addEventListener('updatefound', (e) => {
            console.info('updatefound', e);
          });
          return navigator.serviceWorker.ready;
        })
        .then(function(registration) {
          return registration.update();
        })
        .then(function() {
          console.info('service worker update checked');
        })
        .catch(function(e) {
          console.info('service worker update failed');
        });
    });
  }
})();
