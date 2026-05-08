import { Router } from 'express';
import * as businessData from '../data/businesses.js';
import { requireLogin } from '../middleware/auth.js';

const router = Router();

router.get('/businesses/:id', async (req, res) => {
  try {
    const business = await businessData.getById(req.params.id);

    const products = (business.products || []).map((p) => {
      const reports = p.stockReports || [];
      const latest  = reports[reports.length - 1];
      return {
        ...p,
        inStock:      latest ? latest.inStock : null,
        lastReported: latest ? latest.reportedAt : null,
        reportCount:  reports.length,
      };
    });

    const success = req.session.flash_success || null;
    const error   = req.session.flash_error   || null;
    delete req.session.flash_success;
    delete req.session.flash_error;

    return res.render('business-detail', {
      title: business.name,
      business: { ...business, products },
      success,
      error,
    });
  } catch (err) {
    return res.status(404).render('error', {
      title: 'Not Found',
      error: 'Business not found.',
      statusCode: '404',
    });
  }
});

router.post('/businesses/:id/reviews', requireLogin, async (req, res) => {
  const { id } = req.params;
  const { rating, comment } = req.body;

  try {
    if (!rating || !comment || comment.trim() === '') throw 'Rating and comment are required.';
    await businessData.addReview(id, req.session.user._id, rating, comment.trim());
    req.session.flash_success = 'Your review was posted!';
  } catch (err) {
    req.session.flash_error = typeof err === 'string' ? err : 'Could not save review.';
  }

  return res.redirect(`/businesses/${id}#reviews`);
});

router.post('/businesses/:id/questions', requireLogin, async (req, res) => {
  const { id } = req.params;
  const { questionText } = req.body;

  try {
    if (!questionText || questionText.trim() === '') throw 'Question text is required.';
    await businessData.addQuestion(id, req.session.user._id, questionText.trim());
    req.session.flash_success = 'Your question was posted!';
  } catch (err) {
    req.session.flash_error = typeof err === 'string' ? err : 'Could not save question.';
  }

  return res.redirect(`/businesses/${id}#qa`);
});

router.post('/businesses/:id/questions/:qid/answers', requireLogin, async (req, res) => {
  const { id, qid } = req.params;
  const { answerText } = req.body;

  try {
    if (!answerText || answerText.trim() === '') throw 'Answer text is required.';
    await businessData.addAnswer(id, qid, req.session.user._id, answerText.trim());
    req.session.flash_success = 'Your answer was posted!';
  } catch (err) {
    req.session.flash_error = typeof err === 'string' ? err : 'Could not save answer.';
  }

  return res.redirect(`/businesses/${id}#qa`);
});

router.post('/api/businesses/:id/products/:pid/stock', requireLogin, async (req, res) => {
  const { id, pid } = req.params;
  const { inStock }  = req.body;

  if (typeof inStock === 'undefined') {
    return res.status(400).json({ error: 'inStock is required' });
  }

  try {
    const report = await businessData.addStockReport(
      id, pid, req.session.user._id,
      inStock === true || inStock === 'true'
    );
    return res.json({ ok: true, report });
  } catch (err) {
    return res.status(400).json({ error: typeof err === 'string' ? err : 'Could not save report.' });
  }
});

export default router;
