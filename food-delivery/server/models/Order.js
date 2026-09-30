const mongoose = require("mongoose");
const STATUSES = ["PLACED", "ACCEPTED", "PREPARING", "READY", "PICKED_UP", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"];
const orderSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true },
    deliveryPartner: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    items: [{ name: String, price: Number, qty: Number }],
    total: Number,
    status: { type: String, enum: STATUSES, default: "PLACED" },
    address: String,
    dropLocation: { lat: Number, lng: Number },
    riderLocation: { lat: Number, lng: Number, updatedAt: Date },
    history: [{ status: String, at: { type: Date, default: Date.now } }],
  },
  { timestamps: true }
);
module.exports = mongoose.model("Order", orderSchema);
module.exports.STATUSES = STATUSES;
