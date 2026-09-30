# Doorstep: Food Delivery with Live Order Tracking

Full-stack MERN project: React (Vite) + Express + MongoDB + Socket.IO + Leaflet maps.

## Features
- JWT login with three roles: customer, restaurant owner, delivery partner
- Browse restaurants, build a cart, place an order (prices are taken from the database, not the browser)
- Order lifecycle: PLACED, ACCEPTED, PREPARING, READY, PICKED_UP, OUT_FOR_DELIVERY, DELIVERED (or CANCELLED)
- Live status updates over WebSockets, no page refresh
- Live rider marker on a map with a simple ETA, using real GPS or a simulated ride
- Socket authentication: only the customer, the restaurant owner and the assigned rider can join an order's room

## Requirements
- Node.js 18+
- MongoDB running locally (`mongodb://127.0.0.1:27017`) or a free MongoDB Atlas URI

## Setup (in the VS Code terminal)
```bash
npm run install:all      # installs root, server and client packages
```
Edit `server/.env` if needed (already created from `.env.example`). For Atlas, replace `MONGO_URI`.

```bash
npm run seed             # demo users, 3 restaurants and menus
npm run dev              # server on :5000, client on :5173
```
Open http://localhost:5173

## Demo walkthrough (use 3 browser windows, one normal and two incognito)
Demo password for all accounts is `123456`.

1. Customer (`customer@demo.com`): open a restaurant, add items, enter an address, place the order. You land on the tracking page.
2. Restaurant (`restaurant@demo.com`): the order appears instantly. Click Accept, Start preparing, Mark ready.
3. Rider (`rider@demo.com`): click Pick up, then Start delivery, then Open map, then Simulate a ride.
4. Watch the customer window: status timeline and the moving scooter update live.

## Folder structure
```
server/
  index.js            Express app + Socket.IO (auth, rooms, location updates)
  seed.js             demo data
  models/             User, Restaurant, Order (Mongoose)
  routes/             auth, restaurants, orders (status rules per role)
  middleware/auth.js  JWT helpers
client/src/
  pages/              Auth, Restaurants, Menu, Orders, Dashboard, Track
  components/Status.jsx  badges + timeline
  api.js, socket.js, auth.jsx
```

## API summary
| Method | Route | Who |
|---|---|---|
| POST | /api/auth/register, /api/auth/login | anyone |
| GET | /api/restaurants, /api/restaurants/:id | anyone |
| POST | /api/orders | customer |
| GET | /api/orders/mine | all roles (filtered by role) |
| GET | /api/orders/:id | owner of the order |
| PATCH | /api/orders/:id/status | role-specific transitions |

Socket events: `joinOrder`, `locationUpdate` (rider to server); `statusChanged`, `locationChanged`, `newOrder`, `orderUpdated` (server to clients).

## Notes
- Geolocation in the browser works on `localhost` and HTTPS only.
- Map tiles come from OpenStreetMap, so an internet connection is needed.
- The route line on the map is a straight line. For real road routes and traffic-aware ETA, plug in a directions API (Mapbox, Google, OpenRouteService).
- Change `JWT_SECRET` before deploying anywhere public.
