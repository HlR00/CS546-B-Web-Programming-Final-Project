import express from 'express';
import Business from '../../models/Business.js';
import { requireAuth, requireApiAdmin } from '../../middleware/auth.js';

const router = express.Router({ mergeParams: true });

router.post('/', requireAuth, requireApiAdmin, async (req, res) => {
  const { name, description, culture } = req.body;
  if (!name) return res.status(400).json({ error: 'product name required' });

  const biz = await Business.findById(req.params.businessId);
  if (!biz) return res.status(404).json({ error: 'business not found' });

  biz.products.push({ name, description, culture });
  await biz.save();
  const added = biz.products[biz.products.length - 1];
  res.status(201).json({ product: added });
});

router.put('/:productId', requireAuth, requireApiAdmin, async (req, res) => {
  const biz = await Business.findById(req.params.businessId);
  if (!biz) return res.status(404).json({ error: 'business not found' });

  const p = biz.products.id(req.params.productId);
  if (!p) return res.status(404).json({ error: 'product not found' });

  for (const k of ['name', 'description', 'culture']) {
    if (k in req.body) p[k] = req.body[k];
  }
  await biz.save();
  res.json({ product: p });
});

router.delete('/:productId', requireAuth, requireApiAdmin, async (req, res) => {
  const biz = await Business.findById(req.params.businessId);
  if (!biz) return res.status(404).json({ error: 'business not found' });

  const p = biz.products.id(req.params.productId);
  if (!p) return res.status(404).json({ error: 'product not found' });
  p.deleteOne();
  await biz.save();
  res.json({ ok: true });
});

router.post('/:productId/stock-report', requireAuth, async (req, res) => {
  const { inStock } = req.body;
  if (typeof inStock !== 'boolean') {
    return res.status(400).json({ error: 'inStock must be true/false' });
  }

  const biz = await Business.findById(req.params.businessId);
  if (!biz) return res.status(404).json({ error: 'business not found' });

  const p = biz.products.id(req.params.productId);
  if (!p) return res.status(404).json({ error: 'product not found' });

  p.stockReports.push({ userId: req.user._id, inStock, reportedAt: new Date() });
  await biz.save();
  res.status(201).json({ product: p });
});

router.get('/:productId/stock', async (req, res) => {
  const biz = await Business.findById(req.params.businessId);
  if (!biz) return res.status(404).json({ error: 'business not found' });
  const p = biz.products.id(req.params.productId);
  if (!p) return res.status(404).json({ error: 'product not found' });

  if (p.stockReports.length === 0) {
    return res.json({ inStock: null, reports: 0 });
  }

  const sorted = [...p.stockReports].sort(
    (a, b) => new Date(b.reportedAt) - new Date(a.reportedAt)
  );
  res.json({
    inStock: sorted[0].inStock,
    lastReportedAt: sorted[0].reportedAt,
    reports: p.stockReports.length
  });
});

export default router;
