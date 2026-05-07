import 'dotenv/config';
import express   from 'express';
import exphbs    from 'express-handlebars';
import session   from 'express-session';
import { fileURLToPath } from 'url';
import path      from 'path';

import { connect as mongooseConnect } from './db.js';

import mapRoutes        from './routes/map.js';
import seasonalRoutes   from './routes/seasonal.js';
import businessRoutes   from './routes/businesses.js';
import authRoutes       from './routes/auth.js';
import profileRoutes    from './routes/profile.js';
import adminRoutes      from './routes/admin.js';

import apiAuth          from './routes/api/auth.js';
import apiUsers         from './routes/api/users.js';
import apiBusinesses    from './routes/api/businesses.js';
import apiProducts      from './routes/api/products.js';
import apiReviews       from './routes/api/reviews.js';
import apiQuestions     from './routes/api/questions.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function buildApp() {
  const app = express();

  app.engine('handlebars', exphbs.engine({
    defaultLayout: 'main',
    helpers: {
      eq: (a, b) => a === b,
    }
  }));
  app.set('view engine', 'handlebars');
  app.set('views', path.join(__dirname, 'views'));

  app.use('/public', express.static(path.join(__dirname, 'public')));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(session({
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: false,
  }));

  /* ---- Inject session user & isAdmin into every template ---- */
  app.use((req, res, next) => {
    res.locals.user    = req.session.user || null;
    res.locals.isAdmin = req.session.user?.role === 'admin';
    next();
  });

  /* ---- REST API (JWT-authed, JSON) ---- */
  app.use('/api/v1/auth', apiAuth);
  app.use('/api/v1/users', apiUsers);
  app.use('/api/v1/businesses', apiBusinesses);
  app.use('/api/v1/businesses/:businessId/products', apiProducts);
  app.use('/api/v1/businesses/:businessId/reviews', apiReviews);
  app.use('/api/v1/businesses/:businessId/questions', apiQuestions);

  /* ---- HTML routes (session-authed) ---- */
  app.use('/', mapRoutes);
  app.use('/', seasonalRoutes);
  app.use('/', businessRoutes);
  app.use('/', authRoutes);
  app.use('/', profileRoutes);
  app.use('/', adminRoutes);

  app.get('/', (req, res) => {
    if (req.session.user) return res.redirect('/dashboard');
    return res.redirect('/login');
  });

  /* ---- 404 handler ---- */
  app.use((req, res) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'not found', path: req.path });
    }
    res.status(404).render('error', {
      title: 'Page Not Found',
      error: 'The page you are looking for does not exist or has been moved.',
      statusCode: '404',
    });
  });

  /* ---- Global error handler ---- */
  app.use((err, req, res, next) => {
    console.error(err);
    const status = err.status || 500;
    if (req.path.startsWith('/api/')) {
      return res.status(status).json({ error: err.message || 'server error' });
    }
    res.status(status).render('error', {
      title:      status === 403 ? 'Access Denied'    : 'Something Went Wrong',
      error:      status === 403 ? 'You don\'t have permission to view this page.' : 'An unexpected error occurred. Please try again.',
      statusCode: String(status),
    });
  });

  return app;
}

const PORT = process.env.PORT || 3000;
const isDirectRun = import.meta.url === `file://${process.argv[1]}`;

if (isDirectRun) {
  (async () => {
    try {
      await mongooseConnect();
      const app = buildApp();
      app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
    } catch (err) {
      console.error('failed to start:', err);
      process.exit(1);
    }
  })();
}
