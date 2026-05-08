import { Router } from 'express';
import { registerUser, loginUser } from '../data/users.js';

const router = Router();

/* ---- Route-level validation helper ---- */
const isValidEmail = (email) =>
  typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

router.get('/register', (req, res) => res.render('auth/register'));

router.post('/register', async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  if (!firstName || firstName.trim() === '')
    return res.render('auth/register', { error: 'First name is required.' });
  if (!lastName || lastName.trim() === '')
    return res.render('auth/register', { error: 'Last name is required.' });
  if (!email || !isValidEmail(email))
    return res.render('auth/register', { error: 'A valid email address is required.' });
  if (!password || password.length < 8)
    return res.render('auth/register', { error: 'Password must be at least 8 characters.' });

  try {
    await registerUser(firstName, lastName, email, password);
    return res.redirect('/login');
  } catch (e) {
    return res.render('auth/register', { error: e });
  }
});

router.get('/login', (req, res) => res.render('auth/login'));

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !isValidEmail(email))
    return res.render('auth/login', { error: 'A valid email address is required.' });
  if (!password || password.trim() === '')
    return res.render('auth/login', { error: 'Password is required.' });

  try {
    const u = await loginUser(email, password);
    req.session.user = { _id: u._id.toString(), firstName: u.firstName, role: u.role };
    return res.redirect('/dashboard');
  } catch (e) {
    return res.render('auth/login', { error: e });
  }
});

router.get('/logout', (req, res) => req.session.destroy(() => res.redirect('/login')));

export default router;
