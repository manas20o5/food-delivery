const jwt = require("jsonwebtoken");
const User = require("../models/User");

const sign = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });

async function userFromToken(token) {
  const payload = jwt.verify(token, process.env.JWT_SECRET);
  return User.findById(payload.id).select("-passwordHash");
}

const protect = (...roles) => async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: "Login required" });
    const user = await userFromToken(token);
    if (!user) return res.status(401).json({ message: "User not found" });
    if (roles.length && !roles.includes(user.role))
      return res.status(403).json({ message: "Not allowed for your role" });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports = { sign, protect, userFromToken };
