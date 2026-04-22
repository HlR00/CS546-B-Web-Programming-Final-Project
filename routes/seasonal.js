import { Router } from 'express';
import * as businessData from '../data/businesses.js';

const router = Router();

/* Photo + subtitle for each known holiday tag */
const HOLIDAY_META = {
  'Lunar New Year':    { photo: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=600&h=400&fit=crop&auto=format', subtitle: 'Chinese & Korean Spring Festival', grad: 'h-grad-lunar' },
  'Mid-Autumn':        { photo: 'https://images.unsplash.com/photo-1593001872095-7d5b3868dd20?w=600&h=400&fit=crop&auto=format', subtitle: 'Moon Festival & Mooncakes', grad: 'h-grad-lunar' },
  'Diwali':            { photo: 'https://images.unsplash.com/photo-1604928141064-207cea6f571f?w=600&h=400&fit=crop&auto=format', subtitle: 'Festival of Lights', grad: 'h-grad-diwali' },
  'Holi':              { photo: 'https://images.unsplash.com/photo-1585337130119-ae1f33b09ba1?w=600&h=400&fit=crop&auto=format', subtitle: 'Festival of Colors', grad: 'h-grad-diwali' },
  'Ramadan':           { photo: 'https://images.unsplash.com/photo-1610462275440-8eef19a5f17b?w=600&h=400&fit=crop&auto=format', subtitle: 'Iftar & Suhoor traditions', grad: 'h-grad-ramadan' },
  'Eid':               { photo: 'https://images.unsplash.com/photo-1609151354429-a8d1b562a3b8?w=600&h=400&fit=crop&auto=format', subtitle: 'Eid al-Fitr & Eid al-Adha', grad: 'h-grad-ramadan' },
  'Passover':          { photo: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop&auto=format', subtitle: 'Pesach Seder traditions', grad: 'h-grad-passover' },
  'Hanukkah':          { photo: 'https://images.unsplash.com/photo-1607344645866-009c320b3a8b?w=600&h=400&fit=crop&auto=format', subtitle: 'Festival of Lights', grad: 'h-grad-passover' },
  'Rosh Hashanah':     { photo: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&h=400&fit=crop&auto=format', subtitle: 'Jewish New Year', grad: 'h-grad-passover' },
  'Chuseok':           { photo: 'https://images.unsplash.com/photo-1583224964978-2257b8a3d6f6?w=600&h=400&fit=crop&auto=format', subtitle: 'Korean Autumn Harvest', grad: 'h-grad-lunar' },
  'Nowruz':            { photo: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&h=400&fit=crop&auto=format', subtitle: 'Persian New Year', grad: 'h-grad-diwali' },
  'Día de los Muertos':{ photo: 'https://images.unsplash.com/photo-1573848526886-8b6310a3e694?w=600&h=400&fit=crop&auto=format', subtitle: 'Day of the Dead', grad: 'h-grad-diwali' },
  'Las Posadas':       { photo: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&h=400&fit=crop&auto=format', subtitle: 'Mexican Christmas tradition', grad: 'h-grad-default' },
  'Christmas':         { photo: 'https://images.unsplash.com/photo-1543589077-47d81606c1bf?w=600&h=400&fit=crop&auto=format', subtitle: 'Holiday Season traditions', grad: 'h-grad-passover' },
  'Carnival':          { photo: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600&h=400&fit=crop&auto=format', subtitle: 'Caribbean Carnival festival', grad: 'h-grad-default' },
  'Pohela Boishakh':   { photo: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&h=400&fit=crop&auto=format', subtitle: 'Bengali New Year', grad: 'h-grad-default' },
  'Ethiopian Christmas (Genna)':        { photo: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=600&h=400&fit=crop&auto=format', subtitle: 'Ethiopian Orthodox Christmas', grad: 'h-grad-default' },
  'Ethiopian New Year (Enkutatash)':    { photo: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=600&h=400&fit=crop&auto=format', subtitle: 'Ethiopian New Year', grad: 'h-grad-default' },
  'Fiesta':            { photo: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&h=400&fit=crop&auto=format', subtitle: 'Filipino Fiesta celebration', grad: 'h-grad-default' },
  'Dragon Boat':       { photo: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&h=400&fit=crop&auto=format', subtitle: 'Dragon Boat Festival', grad: 'h-grad-lunar' },
};

const DEFAULT_META = { photo: null, subtitle: 'Cultural food traditions', grad: 'h-grad-default' };

/* ---- landing page --------------------------------- */
router.get('/seasonal', async (req, res) => {
  try {
    const tags = await businessData.getAllHolidayTags();
    const holidayTags = tags.map((name) => ({ name, ...(HOLIDAY_META[name] || DEFAULT_META) }));
    return res.render('seasonal-index', { title: 'Seasonal Tracker', holidayTags });
  } catch (err) {
    console.error('[routes/seasonal] landing failed:', err);
    return res.status(500).render('error', { title: 'Error', error: 'Unable to load the seasonal tracker.' });
  }
});

/* ---- server-rendered results ---------------------- */
router.get('/seasonal/:holidayTag', async (req, res) => {
  try {
    const tag = String(req.params.holidayTag || '').trim();
    if (!tag) return res.status(400).render('error', { title: 'Error', error: 'Please choose a holiday.' });

    const businesses = await businessData.getByHolidayTag(tag);
    const meta = HOLIDAY_META[tag] || DEFAULT_META;

    return res.render('seasonal', {
      title:      `Seasonal Tracker · ${tag}`,
      holidayTag: tag,
      subtitle:   meta.subtitle,
      businesses,
      hasResults: businesses.length > 0
    });
  } catch (err) {
    console.error('[routes/seasonal] results failed:', err);
    return res.status(500).render('error', { title: 'Error', error: 'Unable to load seasonal results.' });
  }
});

/* ---- JSON feed ------------------------------------ */
router.get('/api/seasonal/:holidayTag', async (req, res) => {
  try {
    const tag = String(req.params.holidayTag || '').trim();
    if (!tag) return res.status(400).json({ error: 'holidayTag required' });
    const businesses = await businessData.getByHolidayTag(tag);
    res.set('Cache-Control', 'no-store');
    return res.status(200).json(businesses);
  } catch (err) {
    console.error('[routes/seasonal] api failed:', err);
    return res.status(400).json({ error: typeof err === 'string' ? err : 'Server error' });
  }
});

export default router;
