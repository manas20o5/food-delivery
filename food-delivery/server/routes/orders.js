const router = require("express").Router();
const Order = require("../models/Order");
const Restaurant = require("../models/Restaurant");
const { protect } = require("../middleware/auth");

const populate = (q) =>
  q.populate("restaurant", "name address location").populate("customer", "name").populate("deliveryPartner", "name");

// Who may move an order from one status to the next
const RESTAURANT_FLOW = { PLACED: "ACCEPTED", ACCEPTED: "PREPARING", PREPARING: "READY" };
const DELIVERY_FLOW = { READY: "PICKED_UP", PICKED_UP: "OUT_FOR_DELIVERY", OUT_FOR_DELIVERY: "DELIVERED" };

async function canView(user, order) {
  if (user.role === "customer") return String(order.customer._id || order.customer) === String(user._id);
  if (user.role === "delivery") {
    const p = order.deliveryPartner && (order.deliveryPartner._id || order.deliveryPartner);
    return !p || String(p) === String(user._id);
  }
  const r = await Restaurant.findById(order.restaurant._id || order.restaurant);
  return r && String(r.owner) === String(user._id);
}

// Place order
router.post("/", protect("customer"), async (req, res) => {
  const { restaurantId, items, address, dropLocation } = req.body;
  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });
  if (!items?.length) return res.status(400).json({ message: "Cart is empty" });

  // Prices always come from the database, never from the client
  const lines = [];
  for (const it of items) {
    const m = restaurant.menu.id(it.itemId);
    if (m && it.qty > 0) lines.push({ name: m.name, price: m.price, qty: it.qty });
  }
  if (!lines.length) return res.status(400).json({ message: "No valid items" });
  const total = lines.reduce((s, l) => s + l.price * l.qty, 0);

  const order = await Order.create({
    customer: req.user._id,
    restaurant: restaurant._id,
    items: lines,
    total,
    address: address || "Not provided",
    dropLocation: dropLocation || { lat: restaurant.location.lat + 0.02, lng: restaurant.location.lng + 0.02 },
    history: [{ status: "PLACED" }],
  });
  const full = await populate(Order.findById(order._id));
  req.app.get("io").to(`restaurant_${restaurant._id}`).emit("newOrder", full);
  res.status(201).json(full);
});

// Orders visible to the logged-in user
router.get("/mine", protect(), async (req, res) => {
  let filter;
  if (req.user.role === "customer") filter = { customer: req.user._id };
  else if (req.user.role === "restaurant") {
    const ids = (await Restaurant.find({ owner: req.user._id })).map((r) => r._id);
    filter = { restaurant: { $in: ids } };
  } else {
    filter = { $or: [{ deliveryPartner: req.user._id }, { status: "READY", deliveryPartner: null }] };
  }
  res.json(await populate(Order.find(filter).sort({ createdAt: -1 })));
});

router.get("/:id", protect(), async (req, res) => {
  const order = await populate(Order.findById(req.params.id));
  if (!order) return res.status(404).json({ message: "Order not found" });
  if (!(await canView(req.user, order))) return res.status(403).json({ message: "Not your order" });
  res.json(order);
});

// Change status
router.patch("/:id/status", protect(), async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: "Order not found" });
  const { status } = req.body;
  const role = req.user.role;
  let allowed = false;

  if (role === "customer") {
    allowed = String(order.customer) === String(req.user._id) && status === "CANCELLED" && order.status === "PLACED";
  } else if (role === "restaurant") {
    const r = await Restaurant.findById(order.restaurant);
    const mine = r && String(r.owner) === String(req.user._id);
    allowed = mine && (RESTAURANT_FLOW[order.status] === status ||
      (status === "CANCELLED" && ["PLACED", "ACCEPTED"].includes(order.status)));
  } else if (role === "delivery") {
    const free = !order.deliveryPartner;
    const mine = String(order.deliveryPartner) === String(req.user._id);
    allowed = DELIVERY_FLOW[order.status] === status && (mine || (free && order.status === "READY"));
    if (allowed && free) order.deliveryPartner = req.user._id;
  }
  if (!allowed) return res.status(400).json({ message: `Cannot change ${order.status} to ${status}` });

  order.status = status;
  order.history.push({ status });
  await order.save();
  const full = await populate(Order.findById(order._id));

  const io = req.app.get("io");
  io.to(`order_${order._id}`).emit("statusChanged", { orderId: order._id, status });
  io.to(`restaurant_${order.restaurant}`).emit("orderUpdated", full);
  if (status === "READY") io.to("riders").emit("orderUpdated", full);
  res.json(full);
});

module.exports = router;
