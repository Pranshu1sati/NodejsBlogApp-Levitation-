const express = require("express");
const User = require("../models/User");
const bcrypt = require("bcrypt");
const router = express.Router();
const dotenv = require('dotenv')
const jwt = require('jsonwebtoken')
const { validationResult, check } = require('express-validator');
const rateLimit = require('express-rate-limit');
//REGISTER

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many login attempts, please try again later.',
});

router.post("/register",
[
  // Implement input validation and sanitation using express-validator
  check('username').trim().isLength({ min: 3 }).escape(),
  check('email').trim().isLength({ min: 3 }).escape(),
  check('password').trim().isLength({ min: 3 }).escape(),
],
 async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPass = await bcrypt.hash(req.body.password, salt);
    const newUser = new User({
      username: req.body.username,
      email: req.body.email,
      password: hashedPass,
    });

    const user = await newUser.save();
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json(err);
  }
});

// LOGIN


router.post("/login", loginLimiter,[
  // Implement input validation and sanitation using express-validator
  check('username').trim().isLength({ min: 3 }).escape(),
  check('password').trim().isLength({ min: 3 }).escape(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    console.log(process.env.SECRET)
    const user = await User.findOne({ username: req.body.username });
    if (!user) {
      return res.status(400).json("Wrong credentials!");
    }

    const validated = await bcrypt.compare(req.body.password, user.password);
    if (!validated) {
      return res.status(400).json("Wrong credentials!");
    }

    const token = jwt.sign({ _id: user._id, username: user.username }, process.env.SECRET, {
      // expiresIn: "0.05m", // Token expires in 1 hour
      expiresIn:"1h",
    });
    const refreshToken = jwt.sign({ _id: user._id, username: user.username }, process.env.REFRESH,{
      expiresIn: "2d",
    })

    res.status(200).json({ token,refreshToken, userId: user._id });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

const refreshTokenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many refresh-token requests, please try again later.',
});



//refresh token
router.post("/refresh-token", refreshTokenLimiter, async (req, res) => {
  const refreshToken = req.body.refreshToken;

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH);
    const user = await User.findById(decoded._id);

    if (!user || user.refresh_token !== refreshToken) {
      return res.status(403).json("Invalid refresh token");
    }

    const newAccessToken = jwt.sign({ _id: user._id, username: user.username }, process.env.SECRET, {
      expiresIn: "1h", // New access token expires in 1 hour
    });

    res.status(200).json({ token: newAccessToken, userId: user._id });
  } catch (err) {
    console.error(err.message);
    res.status(403).json("Invalid refresh token");
  }
});

module.exports = router;