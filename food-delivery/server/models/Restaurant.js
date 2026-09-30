const mongoose = require("mongoose");
const menuItem = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  veg: { type: Boolean, default: true },
});
const restaurantSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  name: { type: String, required: true },
  cuisine: String,
  address: String,
  location: { lat: Number, lng: Number },
  menu: [menuItem],
});
module.exports = mongoose.model("Restaurant", restaurantSchema);
