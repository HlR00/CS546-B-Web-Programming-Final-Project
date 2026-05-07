import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../../models/User.js';
import { signToken, requireAuth } from '../../middleware/auth.js';

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, followedCultures } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: 'firstName, lastName, email, password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'password must be at least 6 chars' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ error: 'email already in use' });

    const hashed = await bcrypt.hash(password, 8);
    const user = await User.create({
      firstName,
      lastName,
      email,
      hashedPassword: hashed,
      followedCultures: Array.isArray(followedCultures) ? followedCultures : []
    });

    const token = signToken(user);
    res.status(201).json({ user, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ error: 'invalid credentials' });

    const ok = await bcrypt.compare(password, user.hashedPassword);
    if (!ok) return res.status(401).json({ error: 'invalid credentials' });

    const token = signToken(user);
    res.json({ user, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

export default router;
