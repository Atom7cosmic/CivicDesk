const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/authMiddleware');

// Safe bcrypt compare: rejects oversized passwords instantly,
// and has a hard 10s timeout so slow cloud CPUs never hang a request
function safeCompare(plaintext, hash) {
  if (!plaintext || plaintext.length > 72) {
    return Promise.resolve(false);
  }
  const comparePromise = bcrypt.compare(plaintext, hash);
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('bcrypt timeout')), 10000)
  );
  return Promise.race([comparePromise, timeoutPromise]);
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }
    if (password.length > 72) {
      return res.status(400).json({ success: false, message: 'Password must be 72 characters or fewer' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const user = new User({ name, email, password });
    await user.save();

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      data: {
        token,
        user: { _id: user._id, name: user.name, email: user.email, role: user.role }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    // ✅ Reject oversized passwords before ANY db or bcrypt work
    if (password.length > 72) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    // ✅ Use safeCompare instead of user.comparePassword()
    let isMatch;
    try {
      isMatch = await safeCompare(password, user.password);
    } catch (bcryptErr) {
      console.error('bcrypt timeout on login:', bcryptErr.message);
      return res.status(500).json({ success: false, message: 'Login timed out. Please try again.' });
    }

    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: { _id: user._id, name: user.name, email: user.email, role: user.role }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/auth/profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/auth/profile
router.patch('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, email, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name;

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Email already in use' });
      }
      user.email = email;
    }

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ success: false, message: 'Current password required' });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
      }
      if (newPassword.length > 72) {
        return res.status(400).json({ success: false, message: 'Password must be 72 characters or fewer' });
      }

      // ✅ Use safeCompare instead of user.comparePassword()
      let isMatch;
      try {
        isMatch = await safeCompare(currentPassword, user.password);
      } catch (err) {
        return res.status(500).json({ success: false, message: 'Password check timed out. Please try again.' });
      }

      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Current password is incorrect' });
      }
      user.password = newPassword;
    }

    await user.save();

    res.json({
      success: true,
      data: { _id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;