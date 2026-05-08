import express from 'express';
import { requireLogin } from '../middleware/auth.js';
import { getUser, addCulture, removeCulture, addMustBuy, removeMustBuy } from '../data/users.js';

const router = express.Router();

router.get('/dashboard', requireLogin, async (req, res) => {
  const user = await getUser(req.session.user._id);
  req.session.user.role = user.role;
  res.render('profile/dashboard', { user });
});

router.post('/culture/add', requireLogin, async (req, res) => {
  const culture = typeof req.body.culture === 'string' ? req.body.culture.trim() : '';
  if (!culture) return res.redirect('/dashboard');
  if (culture.length > 100) return res.redirect('/dashboard');
  try {
    await addCulture(req.session.user._id, culture);
  } catch (e) {
    console.error('addCulture error:', e);
  }
  return res.redirect('/dashboard');
});

router.post('/culture/remove', requireLogin, async (req, res) => {
  const culture = typeof req.body.culture === 'string' ? req.body.culture.trim() : '';
  if (!culture) return res.redirect('/dashboard');
  try {
    await removeCulture(req.session.user._id, culture);
  } catch (e) {
    console.error('removeCulture error:', e);
  }
  return res.redirect('/dashboard');
});

router.post('/mustbuy/add', requireLogin, async (req, res) => {
  const item = typeof req.body.item === 'string' ? req.body.item.trim() : '';
  if (!item) return res.redirect('/dashboard');
  if (item.length > 200) return res.redirect('/dashboard');
  try {
    await addMustBuy(req.session.user._id, item);
  } catch (e) {
    console.error('addMustBuy error:', e);
  }
  return res.redirect('/dashboard');
});

router.post('/mustbuy/remove', requireLogin, async (req, res) => {
  const item = typeof req.body.item === 'string' ? req.body.item.trim() : '';
  if (!item) return res.redirect('/dashboard');
  try {
    await removeMustBuy(req.session.user._id, item);
  } catch (e) {
    console.error('removeMustBuy error:', e);
  }
  return res.redirect('/dashboard');
});

export default router;
