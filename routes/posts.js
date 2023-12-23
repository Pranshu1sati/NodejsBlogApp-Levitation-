const router = require("express").Router();
const User = require("../models/User");
const verifyToken = require("../middleware/verifytoken");
const Post = require("../models/Post");
const { check, validationResult } = require("express-validator");

//CREATE POST
router.post("/",verifyToken,[
  // Implement input validation and sanitation 
  check('title').trim().isLength({ min: 1 }).escape(),
  check('desc').trim().isLength({ min: 1 }).escape(),
  check('photo').optional().trim().escape(),
  check('username').trim().isLength({ min: 1 }).escape(),
  check('categories').optional().isArray().escape(),
], async (req, res) => {
  const newPost = new Post(req.body);
  try {
    const savedPost = await newPost.save();
    res.status(200).json(savedPost);
  } catch (err) {
    res.status(500).json(err);
  }
});

//UPDATE POST
router.put("/:id",verifyToken,[
  // Implement input validation and sanitation
  check('title').optional().trim().isLength({ min: 1 }).escape(),
  check('desc').optional().trim().isLength({ min: 1 }).escape(),
  check('photo').optional().trim().escape(),
  check('username').optional().trim().isLength({ min: 1 }).escape(),
  check('categories').optional().isArray().escape(),
], async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (post.username === req.body.username) {
      try {
        const updatedPost = await Post.findByIdAndUpdate(
          req.params.id,
          {
            $set: req.body,
          },
          { new: true }
        );
        res.status(200).json(updatedPost);
      } catch (err) {
        res.status(500).json(err);
      }
    } else {
      res.status(401).json("You can update only your post!");
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

//DELETE POST
router.delete("/:id",verifyToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (post.username === req.body.username) {
      try {
        await post.delete();
        res.status(200).json("Post has been deleted...");
      } catch (err) {
        res.status(500).json(err);
      }
    } else {
      res.status(401).json("You can delete only your post!");
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

//GET POST
router.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    res.status(200).json(post);
  } catch (err) {
    res.status(500).json(err);
  }
});

//GET ALL POSTS
router.get("/", async (req, res) => {
  const username = req.query.user;
  const catName = req.query.cat;
  try {
    let posts;
    if (username) {
      posts = await Post.find({ username }).sort({ createdAt: 'desc'}).exec();
    } else if (catName) {
      posts = await Post.find({
        categories: {
          $in: [catName],
        },
      }).sort({ createdAt: -1 }).exec();;
    } else {
      posts = await Post.find().sort({ createdAt: -1 }).exec();
    }
    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
