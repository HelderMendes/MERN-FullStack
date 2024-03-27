const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bycript = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator');
const User = require('../../model/User');

// @route       POST api/users
// @desc        Register User
// @access      Public
router.post(
  '/',
  [
    check('name', 'Name is required').notEmpty(),
    check('email', 'Please enter valed email').isEmail(),
    check(
      'password',
      'Please enter a password with 6 of more characters'
    ).isLength({ min: 6 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
      // Check if user existes
      let user = await User.findOne({ email });
      if (user) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'User already exists' }] });
      }

      // Get users gravatar
      const avatar = gravatar.url(email, {
        s: '200',
        r: 'pg',
        d: 'mm'
      });

      user = new User({
        name,
        email,
        avatar,
        password
      }); // only creates a new instance we have to call user.save to save

      // Encrypt password using bycript
      const salt = await bycript.genSalt(10);
      user.password = await bycript.hash(password, salt);
      await user.save();

      // Return jsonwebtoken (when the user registers I whant them to get l logged in right away – Thy need to have that TOKEN)
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
