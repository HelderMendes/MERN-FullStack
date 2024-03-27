const express = require('express');
const router = express.Router();
const bycript = require('bcryptjs');
const auth = require('../../middleware/auth');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator');
const User = require('../../model/User');

// @route       GET api/auth
// @desc        Test route
// @access     Public
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error – We Fuck Up');
  }
});

// @route       POST api/auth
// @desc        Authenticate user and get Token User
// @access     Public
router.post(
  '/',
  [
    check('email', 'Please enter valed email').isEmail(),
    check('password', 'Password is required').exists()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      // Check if user existes
      let user = await User.findOne({ email });
      if (!user) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'Invalid Credentials' }] });
      }

      const isMatch = await bycript.compare(password, user.password);

      if (!isMatch) {
        return res.status(400).json({ errors: { msg: 'Invalid Credentials' } });
      }

      const payload = { user: { id: user.id } };
      jwt.sign(
        payload,
        config.get('jwtSecret'),
        // { expiresIn: 3600 }, // in production
        { expiresIn: 360000 },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err) {
      console.error(err.massege);
      res.status(500).send('Server error – 500');
    }
  }
);

module.exports = router;
