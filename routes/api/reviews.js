import express from 'express';
import Business from '../../models/Business.js';
import { requireAuth } from '../../middleware/auth.js';

const router = express.Router({ mergeParams: true });

router.post('/', requireAuth, async (req, res) => {
  const { rating, comment } = req.body;
  const ratingNum = Number(rating);
  if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return res.status(400).json({ error: 'rating must be an integer 1-5' });
  }

  const biz = await Business.findById(req.params.businessId);
  if (!biz) return res.status(404).json({ error: 'business not found' });

  biz.reviews.push({
    userId: req.user._id,
    rating: ratingNum,
    comment: comment || ''
  });
  await biz.save();
  const review = biz.reviews[biz.reviews.length - 1];
  res.status(201).json({ review });
});

router.delete('/:reviewId', requireAuth, async (req, res) => {
  const biz = await Business.findById(req.params.businessId);
  if (!biz) return res.status(404).json({ error: 'business not found' });

  const review = biz.reviews.id(req.params.reviewId);
  if (!review) return res.status(404).json({ error: 'review not found' });

  if (review.userId !== req.user._id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'not your review' });
  }
  review.deleteOne();
  await biz.save();
  res.json({ ok: true });
});

router.get('/summary', async (req, res) => {
  const biz = await Business.findById(req.params.businessId);
  if (!biz) return res.status(404).json({ error: 'business not found' });

  if (biz.reviews.length === 0) {
    return res.json({ count: 0, average: null });
  }

  const total = biz.reviews.reduce((s, r) => s + r.rating, 0);
  res.json({
    count: biz.reviews.length,
    average: Math.round((total / biz.reviews.length) * 10) / 10
  });
});

export default router;
