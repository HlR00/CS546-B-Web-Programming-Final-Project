import { Router } from 'express';
import { registerUser, loginUser, generateResetToken, resetPassword } from '../data/users.js';

const r = Router();

r.get('/register', (q, s) => s.render('auth/register'));
r.post('/register', async (q, s) => {
  try {
    await registerUser(q.body.firstName, q.body.lastName, q.body.email, q.body.password);
    s.redirect('/login');
  } catch (e) {
    s.render('auth/register', { error: e });
  }
});

r.get('/login', (q, s) => s.render('auth/login'));
r.post('/login', async (q, s) => {
  try {
    const u = await loginUser(q.body.email, q.body.password);
    q.session.user = { _id: u._id.toString(), firstName: u.firstName, role: u.role };
    s.redirect('/dashboard');
  } catch (e) {
    s.render('auth/login', { error: e });
  }
});

r.get('/logout', (q, s) => q.session.destroy(() => s.redirect('/login')));

r.get('/forgot-password', (q, s) => s.render('auth/forgot-password'));
r.post('/forgot-password', async (q, s) => {
  try {
    const token = await generateResetToken(q.body.email);
    const resetLink = `http://localhost:3000/reset-password/${token}`;
    console.log(`[Password Reset] ${resetLink}`);
    s.render('auth/forgot-password', {
      message: 'Reset link generated! Click the link below to reset your password:',
      resetLink
    });
  } catch (e) {
    s.render('auth/forgot-password', { error: String(e) });
  }
});

r.get('/reset-password/:token', (q, s) => {
  s.render('auth/reset-password', { token: q.params.token });
});
r.post('/reset-password/:token', async (q, s) => {
  try {
    await resetPassword(q.params.token, q.body.newPassword);
    s.redirect('/login');
  } catch (e) {
    s.render('auth/reset-password', { token: q.params.token, error: String(e) });
  }
});

export default r;
