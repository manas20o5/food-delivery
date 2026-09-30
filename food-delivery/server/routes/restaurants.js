const router = require("express").Router();
const Restaurant = require("../models/Restaurant");

router.get("/", async (_req, res) => {
  res.json(await Restaurant.find().select("-menu"));
});

router.get("/:id", async (req, res) => {
  const r = await Restaurant.findById(req.params.id);
  if (!r) return res.status(404).json({ message: "Restaurant not found" });
  res.json(r);
});

module.exports = router;
