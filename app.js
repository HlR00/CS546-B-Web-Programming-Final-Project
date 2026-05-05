import express   from 'express';
import exphbs    from 'express-handlebars';
import session   from 'express-session';
import { fileURLToPath } from 'url';
import path      from 'path';

import mapRoutes        from './routes/map.js';
import seasonalRoutes   from './routes/seasonal.js';
import businessRoutes   from './routes/businesses.js';
import authRoutes       from './routes/auth.js';
import profileRoutes    from './routes/profile.js';
import adminRoutes      from './routes/admin.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
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
app.use(session({ secret: 'secret', resave: false, saveUninitialized: false }));

/* ---- Inject session user & isAdmin into every template ---- */
app.use((req, res, next) => {
  res.locals.user    = req.session.user || null;
  res.locals.isAdmin = req.session.user?.role === 'admin';
  next();
});

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
  res.status(status).render('error', {
    title:      status === 403 ? 'Access Denied'    : 'Something Went Wrong',
    error:      status === 403 ? 'You don\'t have permission to view this page.' : 'An unexpected error occurred. Please try again.',
    statusCode: String(status),
  });
});

app.listen(3000, () => console.log('http://localhost:3000'));
