import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import { Badge } from "../components/Status.jsx";

export default function Orders() {
  const [orders, setOrders] = useState(null);
  const load = () => api("/orders/mine").then(setOrders);
  useEffect(() => { load(); }, []);

  const cancel = async (id) => { await api(`/orders/${id}/status`, { method: "PATCH", body: { status: "CANCELLED" } }); load(); };

  if (!orders) return <p className="muted">Loading orders...</p>;
  if (!orders.length) return <p className="muted">No orders yet. Pick a restaurant to place your first one.</p>;

  return (
    <>
      <h1>My orders</h1>
      {orders.map((o) => (
        <div key={o._id} className="card order">
          <div>
            <h2>{o.restaurant.name}</h2>
            <p className="muted">{o.items.map((i) => `${i.qty} x ${i.name}`).join(", ")}</p>
            <p>Rs. {o.total} - {new Date(o.createdAt).toLocaleString()}</p>
          </div>
          <div className="actions">
            <Badge status={o.status} />
            <Link className="primary btn" to={`/track/${o._id}`}>Track</Link>
            {o.status === "PLACED" && <button className="ghost" onClick={() => cancel(o._id)}>Cancel</button>}
          </div>
        </div>
      ))}
    </>
  );
}
