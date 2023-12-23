const jwt = require("jsonwebtoken");
const verifyToken = (req, res, next) => {
  const token = req.header("auth-token");
  const refreshToken = req.header("refresh-token");

  if (!token) return res.status(401).json("Access denied!");

  jwt.verify(token, process.env.SECRET, (err, user) => {
    if (err) {
      // Token expired, try using refresh token
      jwt.verify(refreshToken, process.env.REFRESH, (refreshErr, refreshUser) => {
        if (refreshErr) {
          return res.status(403).json("Token and refresh token are not valid!");
        }

        const newAccessToken = jwt.sign(
          { _id: refreshUser._id, username: refreshUser.username },
          process.env.SECRET,
          { expiresIn: "1h" }
        );

        req.user = refreshUser;
        req.newAccessToken = newAccessToken;
        next();
      });
    } else {
      // Access token is valid
      req.user = user;
      next();
    }
  });
  };
  module.exports = verifyToken;