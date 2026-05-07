import express from 'express';
import User from '../../models/User.js';
import Business from '../../models/Business.js';
import { requireAuth } from '../../middleware/auth.js';

const router = express.Router();

function isSelfOrAdmin(req, targetId) {
  return req.user._id === targetId || req.user.role === 'admin';
}

router.get('/:id', requireAuth, async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'user not found' });
  res.json({ user });
});

router.put('/:id', requireAuth, async (req, res) => {
  if (!isSelfOrAdmin(req, req.params.id)) {
    return res.status(403).json({ error: 'not allowed' });
  }

  const allowed = ['firstName', 'lastName', 'followedCultures'];
  const update = {};
  for (const k of allowed) {
    if (k in req.body) update[k] = req.body[k];
  }

  const user = await User.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!user) return res.status(404).json({ error: 'user not found' });
  res.json({ user });
});

router.post('/:id/follow', requireAuth, async (req, res) => {
  if (!isSelfOrAdmin(req, req.params.id)) return res.status(403).json({ error: 'not allowed' });
  const { culture } = req.body;
  if (!culture) return res.status(400).json({ error: 'culture is required' });

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { $addToSet: { followedCultures: culture } },
    { new: true }
  );
  if (!user) return res.status(404).json({ error: 'user not found' });
  res.json({ user });
});

router.delete('/:id/follow/:culture', requireAuth, async (req, res) => {
  if (!isSelfOrAdmin(req, req.params.id)) return res.status(403).json({ error: 'not allowed' });

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { $pull: { followedCultures: req.params.culture } },
    { new: true }
  );
  if (!user) return res.status(404).json({ error: 'user not found' });
  res.json({ user });
});

router.post('/:id/must-buy/:productId', requireAuth, async (req, res) => {
  if (!isSelfOrAdmin(req, req.params.id)) return res.status(403).json({ error: 'not allowed' });

  const exists = await Business.exists({ 'products._id': req.params.productId });
  if (!exists) return res.status(404).json({ error: 'product not found' });

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { $addToSet: { mustBuyList: req.params.productId } },
    { new: true }
  );
  if (!user) return res.status(404).json({ error: 'user not found' });
  res.json({ user });
});

router.delete('/:id/must-buy/:productId', requireAuth, async (req, res) => {
  if (!isSelfOrAdmin(req, req.params.id)) return res.status(403).json({ error: 'not allowed' });

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { $pull: { mustBuyList: req.params.productId } },
    { new: true }
  );
  if (!user) return res.status(404).json({ error: 'user not found' });
  res.json({ user });
});

router.get('/:id/dashboard', requireAuth, async (req, res) => {
  if (!isSelfOrAdmin(req, req.params.id)) return res.status(403).json({ error: 'not allowed' });

  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'user not found' });

  const cultureBusinesses = user.followedCultures.length
    ? await Business.find({ category: { $in: user.followedCultures } })
    : [];

  const mustBuyProducts = [];
  if (user.mustBuyList.length) {
    const biz = await Business.find({ 'products._id': { $in: user.mustBuyList } });
    for (const b of biz) {
      for (const p of b.products) {
        if (user.mustBuyList.includes(p._id)) {
          mustBuyProducts.push({
            product: p,
            businessId: b._id,
            businessName: b.name
          });
        }
      }
    }
  }

  res.json({
    followedCultures: user.followedCultures,
    cultureBusinesses,
    mustBuyProducts
  });
});

export default router;
