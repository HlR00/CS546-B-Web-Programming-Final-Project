import {Router} from 'express'; import {requireAdmin} from '../middleware/auth.js'; const r=Router(); r.get('/admin',requireAdmin,(q,s)=>s.render('admin/dashboard')); export default r;
