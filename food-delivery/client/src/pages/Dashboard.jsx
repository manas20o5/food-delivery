import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import { connectSocket } from "../socket.js";
import { useAuth } from "../auth.jsx";
import { Badge } from "../components/Status.jsx";

// Next action a restaurant or rider can take on an order
const NEXT = {
  restaurant: { PLACED: ["ACCEPTED", "Accept order"], ACCEPTED: ["PREPARING", "Start preparing"], PREPARING: ["READY", "Mark ready"] },
  delivery: { READY: ["PICKED_UP", "Pick up"], PICKED_UP: ["OUT_FOR_DELIVERY", "Start delivery"], OUT_FOR_DELIVERY: ["DELIVERED", "Mark delivered"] },
};

export default function Dashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState("");
  const load = () => api("/orders/mine").then(setOrders).catch((e) => setError(e.message));

  useEffect(() => {
    load();
    const socket = connectSocket();
    socket.on("newOrder", load);      // restaurants
    socket.on("orderUpdated", load);  // restaurants and riders
    return () => socket.disconnect();
  }, []);

  const move = async (id, status) => {
    setError("");
    try { await api(`/orders/${id}/status`, { method: "PATCH", body: { status } }); load(); }
    catch (e) { setError(e.message); }
  };

  if (!orders) return <p className="muted">Loading orders...</p>;
  const title = user.role === "restaurant" ? "Incoming orders" : "Deliveries";
  const next = NEXT[user.role];

  return (
    <>
      <h1>{title}</h1>
      {error && <p className="error">{error}</p>}
      {!orders.length && <p className="muted">{user.role === "restaurant" ? "New orders appear here instantly." : "Orders marked ready by restaurants appear here."}</p>}
      {orders.map((o) => (
        <div key={o._id} className="card order">
          <div>
            <h2>{o.restaurant.name} <span className="muted">for {o.customer?.name}</span></h2>
            <p className="muted">{o.items.map((i) => `${i.qty} x ${i.name}`).join(", ")}</p>
            <p>Rs. {o.total} - {o.address}</p>
          </div>
          <div className="actions">
            <Badge status={o.status} />
            {next[o.status] && (
              <button className="primary" onClick={() => move(o._id, next[o.status][0])}>{next[o.status][1]}</button>
            )}
            {user.role === "restaurant" && ["PLACED", "ACCEPTED"].includes(o.status) && (
              <button className="ghost" onClick={() => move(o._id, "CANCELLED")}>Reject</button>
            )}
            {user.role === "delivery" && o.deliveryPartner && <Link className="btn ghost" to={`/track/${o._id}`}>Open map</Link>}
          </div>
        </div>
      ))}
    </>
  );
}
