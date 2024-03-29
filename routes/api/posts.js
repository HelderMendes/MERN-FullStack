const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');
const User = require('../../model/User');
const Post = require('../../model/Post');

const checkObjectId = require('../../middleware/checkObjectId');

// @route       POST  api/posts
// @desc        Create a Post
// @access     Private
router.post(
  '/',
  [auth, [check('text', 'Text is required').notEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select('-password');
      const newPost = new Post({
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id
      });
      const post = await newPost.save();
      res.json(post);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error – This Time(500), We fuck It Up! ');
    }
  }
);

// @route           GET  api/posts
// @desc            Get all Posts (profiles are Public but Post are Private)
// @access        Private
router.get('/', auth, async (req, res) => {
  try {
    const posts = await Post.find().sort({ date: -1 });
    res.json(posts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error – This Time(500), We fuck It Up! ');
  }
});

// @route           GET  api/posts/:id
// @desc            Get post by Id
// @access        Private
router.get('/:id', auth, checkObjectId('id'), async (req, res) => {
  // router.get('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: 'Post not found' });
    }

    res.json(post);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error – This Time(500), We fuck It Up! ');
  }
});

// @route           DELET  api/posts/:id
// @desc            Delete a post
// @access        Private
router.delete('/:id', auth, checkObjectId('id'), async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: 'Post not found with this ID' });
    }

    // Check User (is the user the same user from the post?)
    if (post.user.toString() !== req.user.id) {
      console.log(
        `The comparation don't match ${post.user.toString()} ≠ ${req.user.id}`
      );
      return res.status(401).json({ msg: 'User not authorized' });
    }

    // Delete Post
    // await post.remove();
    await Post.findOneAndDelete({ _id: req.params.id });

    res.json({ msg: 'Post was removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error – This Time(500), We fuck It Up! ');
  }
});

module.exports = router;
