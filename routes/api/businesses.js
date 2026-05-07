import express from 'express';
import Business from '../../models/Business.js';
import { requireAuth, requireApiAdmin } from '../../middleware/auth.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const { category, neighborhood, q, near, radius } = req.query;
  const filter = {};
  if (category) filter.category = category;
  if (neighborhood) filter.neighborhood = neighborhood;
  if (q) filter.name = { $regex: q, $options: 'i' };

  if (near) {
    const [lng, lat] = near.split(',').map(Number);
    if (isNaN(lng) || isNaN(lat)) {
      return res.status(400).json({ error: 'near must be "lng,lat"' });
    }
    filter.location = {
      $near: {
        $geometry: { type: 'Point', coordinates: [lng, lat] },
        $maxDistance: parseInt(radius || '2000', 10)
      }
    };
  }

  const businesses = await Business.find(filter).limit(200);
  res.json({ count: businesses.length, businesses });
});

router.get('/:id', async (req, res) => {
  const biz = await Business.findById(req.params.id);
  if (!biz) return res.status(404).json({ error: 'business not found' });
  res.json({ business: biz });
});

router.post('/', requireAuth, requireApiAdmin, async (req, res) => {
  try {
    const biz = await Business.create(req.body);
    res.status(201).json({ business: biz });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', requireAuth, requireApiAdmin, async (req, res) => {
  const blocked = ['products', 'reviews', 'questions'];
  for (const k of blocked) delete req.body[k];

  const biz = await Business.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!biz) return res.status(404).json({ error: 'business not found' });
  res.json({ business: biz });
});

router.delete('/:id', requireAuth, requireApiAdmin, async (req, res) => {
  const biz = await Business.findByIdAndDelete(req.params.id);
  if (!biz) return res.status(404).json({ error: 'business not found' });
  res.json({ ok: true });
});

export default router;
