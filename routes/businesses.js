import { Router } from 'express';
import * as businessData from '../data/businesses.js';

const router = Router();

router.get('/businesses/:id', async (req, res) => {
  try {
    const business = await businessData.getById(req.params.id);
    return res.render('business-detail', { title: business.name, business });
  } catch (err) {
    return res.status(404).render('error', { title: 'Not Found', error: 'Business not found.' });
  }
});

export default router;
