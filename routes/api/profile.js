const express = require('express');
// const request = require('request');
const axios = require('axios');
const config = require('config');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');

const Profile = require('../../model/Profile');
const User = require('../../model/User');

// @route       GET api/profile/me
// @desc        Get Current Users Profile
// @access     Private
router.get('/me', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id }).populate(
      'user',
      ['name', 'avatar']
    );

    if (!profile) {
      return res.status(400).json({ msg: 'There is no Profile for this user' });

      res.json(profile);
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error – 500 We Fuck Up');
  }
});

// @route       POST api/profile
// @desc        Create or Update Users Profile
// @access     Private
router.post(
  '/',
  [
    auth,
    [
      check('status', 'Status is required').notEmpty(),
      check('skills', 'Skills is required').notEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      company,
      website,
      location,
      bio,
      status,
      githubusername,
      skills,
      youtube,
      twitter,
      facebook,
      linkedin,
      instagram
    } = req.body;

    // Buid profile object
    const profileFields = {};
    profileFields.user = req.user.id;
    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (bio) profileFields.bio = bio;
    if (status) profileFields.status = status;
    if (githubusername) profileFields.githubusername = githubusername;
    if (skills) {
      profileFields.skills = skills
        .split(',')
        .map((skill) => ' ' + skill.trim());
    }
    console.log(profileFields.skills);

    // Build social object
    profileFields.social = {};
    if (youtube) profileFields.social.youtube = youtube;
    if (twitter) profileFields.social.twitter = twitter;
    if (facebook) profileFields.social.facebook = facebook;
    if (linkedin) profileFields.social.linkedin = linkedin;
    if (instagram) profileFields.social.instagram = instagram;

    try {
      let profile = await Profile.findOne({ user: req.user.id });
      if (profile) {
        // Update (if the profile was found)
        profile = await Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true }
        );

        return res.json(profile);
      }

      // Create (if the profile was not found)
      profile = new Profile(profileFields);

      await profile.save();
      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error – 500');
    }
  }
);

// @route       GET api/profile
// @desc        Get all profiles
// @access    Public
router.get('/', async (req, res) => {
  try {
    const profiles = await Profile.find().populate('user', ['name', 'avatar']);
    res.json(profiles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('server Error');
  }
});

// @route       GET api/profile/user/:user_id
// @desc        Get all profiles by user ID
// @access    Public
router.get('/user/:user_id', async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.params.user_id
    }).populate('user', ['name', 'avatar']);

    if (!profile) return res.status(400).json({ msg: 'Profile not found' });

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    if (err.kind == 'ObjectId') {
      return res.status(400).json({ msg: 'Profile not found' });
    }
    res.status(500).send('server Error');
  }
});

// @route       DELETE api/profile/
// @desc        Delete profile, User & Posts from the user
// @access    Private
router.delete('/', auth, async (req, res) => {
  try {
    // @@@ TO DO @@@ Delete users posts

    // Delete Profile
    await Profile.findOneAndDelete({ user: req.user.id });

    // Delete User
    await User.findOneAndDelete({ _id: req.user.id });
    res.json({ msg: 'User deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('server Error');
  }
});

// @route       PUT api/profile/experience
// @desc        Add profile experience
// @access    Private
router.put(
  '/experience',
  [
    auth,
    [
      check('title', 'Title is required').notEmpty(),
      check('company', 'Company is required').notEmpty(),
      check(
        'startDate',
        'Start date is required and needs to be from the past'
      ).notEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, company, location, startDate, to, current, description } =
      req.body;
    const newExp = {
      title,
      company,
      location,
      startDate,
      to,
      current,
      description
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id }); //  {user: req.user.id} info stored in  token
      profile.experience.unshift(newExp);
      await profile.save();
      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route       DELETE api/profile/experience/:exp_id
// @desc        Delete  one experience from profile
// @access    Private
router.delete('/experience/:exp_id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });

    // Get remove index
    const removeIndex = profile.experience
      .map((item) => item.id)
      .indexOf(req.params.exp_id);
    profile.experience.splice(removeIndex, 1);
    await profile.save();
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route       PUT api/profile/education
// @desc        Add profile education
// @access    Private
router.put(
  '/education',
  [
    auth,
    [
      check('school', 'Title is required').notEmpty(),
      check('degree', 'Company is required').notEmpty(),
      check(
        'fieldofstudy',
        'Field of Study is required and needs to be from the past'
      ).notEmpty(),
      check(
        'startDate',
        'Start date is required and needs to be from the past'
      ).notEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      school,
      degree,
      fieldofstudy,
      startDate,
      to,
      current,
      description
    } = req.body;
    const newEdu = {
      school,
      degree,
      fieldofstudy,
      startDate,
      to,
      current,
      description
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id }); //  {user: req.user.id} info stored in  token
      profile.education.unshift(newEdu);
      await profile.save();
      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route       DELETE api/profile/education/:edu_id
// @desc        Delete  one education from profile
// @access    Private
router.delete('/education/:edu_id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });

    // Get remove index
    const removeIndex = profile.education
      .map((item) => item.id)
      .indexOf(req.params.edu_id);
    profile.education.splice(removeIndex, 1);
    await profile.save();
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route       GET api/profile/github/:username
// @desc        Get user ripos from GitHub
// @access    Public
router.get('/github/:username', async (req, res) => {
  try {
    const uri = encodeURI(
      `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc`
    );
    const headers = {
      'user-agent': 'node.js',
      Authorization: `token ${config.get('githubToken')}`
    };

    const gitHubResponse = await axios.get(uri, { headers });
    console.log(`Github repos from ${req.params.username} were found`);
    return res.json(gitHubResponse.data);
  } catch (err) {
    console.error(
      err.message + ` – github username ${req.params.username} was not found`
    );
    return res.status(404).send({ msg: 'No Github user found' });
  }
});

module.exports = router;
