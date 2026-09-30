require("dotenv").config();
require("express-async-errors");
const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const { userFromToken } = require("./middleware/auth");
const Order = require("./models/Order");
const Restaurant = require("./models/Restaurant");

const app = express();
const server = http.createServer(app);
const origin = process.env.CLIENT_ORIGIN || "http://localhost:5173";
const io = new Server(server, { cors: { origin } });
app.set("io", io);

app.use(cors({ origin }));
app.use(express.json());
app.use("/api/auth", require("./routes/auth"));
app.use("/api/restaurants", require("./routes/restaurants"));
app.use("/api/orders", require("./routes/orders"));
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// Catch async errors so a bad request never crashes the server
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: "Server error" });
});

// ---------- Socket.IO ----------
// Every socket must present a valid JWT
io.use(async (socket, next) => {
  try {
    const user = await userFromToken(socket.handshake.auth?.token);
    if (!user) return next(new Error("Unauthorized"));
    socket.user = user;
    next();
  } catch {
    next(new Error("Unauthorized"));
  }
});

io.on("connection", (socket) => {
  const user = socket.user;
  if (user.role === "delivery") socket.join("riders");
  if (user.role === "restaurant") {
    Restaurant.find({ owner: user._id }).then((list) =>
      list.forEach((r) => socket.join(`restaurant_${r._id}`))
    );
  }

  // Only people connected to an order may listen to it
  socket.on("joinOrder", async (orderId, ack) => {
    try {
      const order = await Order.findById(orderId);
      if (!order) return ack?.({ ok: false });
      const isCustomer = String(order.customer) === String(user._id);
      const isRider = String(order.deliveryPartner) === String(user._id);
      let isOwner = false;
      if (user.role === "restaurant") {
        const r = await Restaurant.findById(order.restaurant);
        isOwner = r && String(r.owner) === String(user._id);
      }
      if (!(isCustomer || isRider || isOwner)) return ack?.({ ok: false, message: "Forbidden" });
      socket.join(`order_${orderId}`);
      ack?.({ ok: true, riderLocation: order.riderLocation });
    } catch {
      ack?.({ ok: false });
    }
  });

  // Rider sends GPS position; only the assigned rider is accepted
  socket.on("locationUpdate", async ({ orderId, lat, lng }) => {
    if (user.role !== "delivery" || typeof lat !== "number" || typeof lng !== "number") return;
    const order = await Order.findOneAndUpdate(
      { _id: orderId, deliveryPartner: user._id, status: { $in: ["PICKED_UP", "OUT_FOR_DELIVERY"] } },
      { riderLocation: { lat, lng, updatedAt: new Date() } }
    );
    if (order) io.to(`order_${orderId}`).emit("locationChanged", { orderId, lat, lng });
  });
});

const PORT = process.env.PORT || 5000;
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`)))
  .catch((e) => {
    console.error("MongoDB connection failed:", e.message);
    process.exit(1);
  });
