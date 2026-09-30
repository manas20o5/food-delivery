const router = require("express").Router();
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { sign, protect } = require("../middleware/auth");

const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role });

router.post("/register", async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: "All fields are required" });
  if (await User.findOne({ email: email.toLowerCase() }))
    return res.status(409).json({ message: "Email already registered" });
  const user = await User.create({
    name,
    email,
    passwordHash: await bcrypt.hash(password, 10),
    role: ["customer", "restaurant", "delivery"].includes(role) ? role : "customer",
  });
  res.status(201).json({ token: sign(user), user: publicUser(user) });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: (email || "").toLowerCase() });
  if (!user || !(await bcrypt.compare(password || "", user.passwordHash)))
    return res.status(401).json({ message: "Wrong email or password" });
  res.json({ token: sign(user), user: publicUser(user) });
});

router.get("/me", protect(), (req, res) => res.json({ user: publicUser(req.user) }));

module.exports = router;
