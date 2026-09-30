require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const Restaurant = require("./models/Restaurant");
const Order = require("./models/Order");

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await Promise.all([User.deleteMany({}), Restaurant.deleteMany({}), Order.deleteMany({})]);
  const passwordHash = await bcrypt.hash("123456", 10);
  const [, owner] = await User.create([
    { name: "Demo Customer", email: "customer@demo.com", passwordHash, role: "customer" },
    { name: "Demo Restaurant Owner", email: "restaurant@demo.com", passwordHash, role: "restaurant" },
    { name: "Demo Rider", email: "rider@demo.com", passwordHash, role: "delivery" },
  ]);
  await Restaurant.create([
    {
      owner: owner._id, name: "Spice Route Kitchen", cuisine: "North Indian",
      address: "12 Market Road", location: { lat: 12.9716, lng: 77.5946 },
      menu: [
        { name: "Paneer Butter Masala", description: "Creamy tomato gravy", price: 240, veg: true },
        { name: "Butter Chicken", description: "Slow cooked, mild spice", price: 290, veg: false },
        { name: "Garlic Naan", description: "Tandoor baked", price: 45, veg: true },
        { name: "Jeera Rice", description: "Cumin flavoured basmati", price: 120, veg: true },
      ],
    },
    {
      owner: owner._id, name: "Slice Society Pizzeria", cuisine: "Italian",
      address: "48 Lake View Street", location: { lat: 12.9784, lng: 77.6408 },
      menu: [
        { name: "Margherita", description: "Mozzarella and basil", price: 260, veg: true },
        { name: "Farmhouse", description: "Peppers, olives, mushroom", price: 340, veg: true },
        { name: "Pepperoni", description: "Double pepperoni", price: 380, veg: false },
        { name: "Garlic Bread", description: "With cheese dip", price: 130, veg: true },
      ],
    },
    {
      owner: owner._id, name: "Noodle Lane", cuisine: "Asian",
      address: "7 Station Circle", location: { lat: 12.9352, lng: 77.6245 },
      menu: [
        { name: "Veg Hakka Noodles", description: "Wok tossed", price: 180, veg: true },
        { name: "Chicken Manchurian", description: "Dry, spicy", price: 220, veg: false },
        { name: "Spring Rolls", description: "Crispy, 6 pieces", price: 150, veg: true },
      ],
    },
  ]);
  console.log("Seeded. Logins (password 123456): customer@demo.com, restaurant@demo.com, rider@demo.com");
  process.exit(0);
})();
