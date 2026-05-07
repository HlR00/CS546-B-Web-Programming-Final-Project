export const requireLogin = (req, res, next) => {
  if (!req.session.user) return res.redirect('/login');
  next();
};

export const requireAdmin = (req, res, next) => {
  if (!req.session.user) return res.redirect('/login');
  if (req.session.user.role !== 'admin') {
    return res.status(403).render('error', {
      title: 'Access Denied',
      error: 'This area is restricted to administrators only.',
      statusCode: '403',
    });
  }
  next();
};
