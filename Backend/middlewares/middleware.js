const jwt = require("jsonwebtoken");
const prisma = require("../libs/prisma");
require("dotenv").config();

const loggedOutTokens = [];

const authenticateUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];

  if (!token) {
    console.log("No token provided");
    return res.sendStatus(401);
  }

  // Check if the token is in the logged out tokens list
  if (loggedOutTokens.includes(token)) {
    console.log("Token is logged out");
    return res.status(401).json({ success: false, message: "Please log in again." });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        console.log("Token expired");
        return res.status(401).json({ success: false, message: "Token has expired." });
      }
      console.log("Token verification error:", err);
      return res.sendStatus(403);
    }

    console.log("Decoded token:", decoded);
    req.user = decoded; // Isi req.user dengan informasi yang sudah didekode dari token
    next();
  });
};

module.exports = {
  authenticateUser,
};
