import path from 'path';
import express from 'express';
import compression from 'compression';
import expressHandlebars from 'express-handlebars';
import UniversalRouter from 'universal-router';
import fragmentsConfig from './config/fragments.js';

const app = express();
const router = new UniversalRouter(fragmentsConfig.map(fragment => {
  const action = () => fragment;
  return Object.assign({action}, fragment);
}));

function setHeaders(res, file) {
  if (file.endsWith('sw.js')) {
    // Disable caching so that ServiceWorker updates are detected immediately.
    // max-age affects registration.update()
    res.setHeader('Cache-Control', 'max-age=0, no-cache');
  } else {
    res.setHeader('Cache-Control', 'max-age=3600');
  }
}

function handleError(req, res, error) {
  console.log(`${error.statusCode}: ${error.message}`, req.url);
  res.sendStatus(error.statusCode);
}

if (process.env.NODE_ENV === 'production') {
  // prerender (for crawler) / temporary disabled...waiting for Headless Chrome.
  // app.use(require('prerender-node'));

  // HTTPS redirection
  app.set('trust proxy', true);
  app.use((req, res, next) => {
    if (req.secure) {
      next();
      return;
    }
    res.redirect(301, `https://${req.hostname}${req.url}`);
  });
}

// static files
app.use(compression());
app.use('/', express.static('dist/public', {
  index: false,
  setHeaders
}));

// handlebars
app.engine('.hbs', expressHandlebars({extname: '.hbs'}));
app.set('view engine', '.hbs');
app.set('views', path.join(__dirname, './views'));

// health check
app.get('/_ah/health', (req, res, next) => res.send('ok'));

// app-shell HTML
app.get('/app-shell', (req, res, next) => res.render('index'));

// any document
app.use((req, res) => {
  // TODO add route specific data?
  router.resolve(req.url).then(fragment => {
    res.render('index', {
      fragment,
      polyfillRequired: req.get('User-Agent').indexOf('PhantomJS') !== -1,
    });
  }).catch((err) => {
    handleError(req, res, err);
  });
});

console.log('listening to localhost:8080');
app.listen(8080);
