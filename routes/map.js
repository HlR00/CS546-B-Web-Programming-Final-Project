import { Router } from 'express';
import * as businessData from '../data/businesses.js';

const router = Router();

router.get('/map', async (req, res) => {
  try {
    const tags = await businessData.getAllHolidayTags();
    return res.render('map', { title: 'Map', holidayTags: tags });
  } catch (err) {
    console.error('[routes/map] page failed:', err);
    return res.status(500).render('error', { title: 'Error', error: 'Unable to load the map.' });
  }
});

router.get('/api/businesses', async (req, res) => {
  try {
    const { neighborhood, holidayTag } = req.query;
    let businesses;
    if (holidayTag && String(holidayTag).trim()) {
      businesses = await businessData.getByHolidayTag(String(holidayTag).trim());
    } else {
      businesses = await businessData.getAllForMap(neighborhood || undefined);
    }
    res.set('Cache-Control', 'no-store');
    return res.status(200).json(businesses);
  } catch (err) {
    console.error('[routes/map] api failed:', err);
    return res.status(400).json({ error: typeof err === 'string' ? err : 'Server error' });
  }
});

export default router;
