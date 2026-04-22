
import express   from 'express';
import exphbs    from 'express-handlebars';
import { fileURLToPath } from 'url';
import path      from 'path';

import mapRoutes      from './routes/map.js';
import seasonalRoutes from './routes/seasonal.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.engine('handlebars', exphbs.engine({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/', mapRoutes);
app.use('/', seasonalRoutes);

app.get('/', (req, res) => res.redirect('/map'));

app.use((req, res) => {
  res.status(404).render('error', { title: 'Not Found', error: 'Page not found.' });
});

app.listen(3000, () => console.log('http://localhost:3000'));
