import express from 'express';
import Business from '../../models/Business.js';
import { requireAuth } from '../../middleware/auth.js';

const router = express.Router({ mergeParams: true });

router.post('/', requireAuth, async (req, res) => {
  const { questionText } = req.body;
  if (!questionText || !questionText.trim()) {
    return res.status(400).json({ error: 'questionText required' });
  }

  const biz = await Business.findById(req.params.businessId);
  if (!biz) return res.status(404).json({ error: 'business not found' });

  biz.questions.push({
    userId: req.user._id,
    questionText: questionText.trim()
  });
  await biz.save();
  const q = biz.questions[biz.questions.length - 1];
  res.status(201).json({ question: q });
});

router.post('/:questionId/answers', requireAuth, async (req, res) => {
  const { answerText } = req.body;
  if (!answerText || !answerText.trim()) {
    return res.status(400).json({ error: 'answerText required' });
  }

  const biz = await Business.findById(req.params.businessId);
  if (!biz) return res.status(404).json({ error: 'business not found' });

  const q = biz.questions.id(req.params.questionId);
  if (!q) return res.status(404).json({ error: 'question not found' });

  q.answers.push({
    userId: req.user._id,
    answerText: answerText.trim()
  });
  await biz.save();
  const a = q.answers[q.answers.length - 1];
  res.status(201).json({ answer: a });
});

router.delete('/:questionId', requireAuth, async (req, res) => {
  const biz = await Business.findById(req.params.businessId);
  if (!biz) return res.status(404).json({ error: 'business not found' });

  const q = biz.questions.id(req.params.questionId);
  if (!q) return res.status(404).json({ error: 'question not found' });

  if (q.userId !== req.user._id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'not your question' });
  }
  q.deleteOne();
  await biz.save();
  res.json({ ok: true });
});

export default router;
