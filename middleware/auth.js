export const requireLogin = (req, res, next) => {
  if (!req.session.user) return res.redirect('/login');
  next();
};

export const requireAdmin = (req, res, next) => {
  if (!req.session.user) return res.redirect('/login');
  if (req.session.user.role !== 'admin') {
    return res.status(403).render('error', { title: 'Forbidden', error: 'Admins only.' });
  }
  next();
};
