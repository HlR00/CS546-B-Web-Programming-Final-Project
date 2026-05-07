import jwt from 'jsonwebtoken';
import User from '../models/User.js';

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

function getSecret() {
  return process.env.JWT_SECRET || 'dev_secret_do_not_use_in_prod';
}

export function signToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    getSecret(),
    { expiresIn: '7d' }
  );
}

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const parts = header.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ error: 'missing or malformed Authorization header' });
  }

  try {
    const payload = jwt.verify(parts[1], getSecret());
    const user = await User.findById(payload.id);
    if (!user) return res.status(401).json({ error: 'user no longer exists' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'invalid or expired token' });
  }
}

export function requireApiAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'admin only' });
  }
  next();
}
