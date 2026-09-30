import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api.js";

export default function Menu() {
  const { id } = useParams();
  const nav = useNavigate();
  const [rest, setRest] = useState(null);
  const [cart, setCart] = useState({});
  const [address, setAddress] = useState("");
  const [drop, setDrop] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => { api(`/restaurants/${id}`).then(setRest).catch((e) => setError(e.message)); }, [id]);
  if (!rest) return <p className={error ? "error" : "muted"}>{error || "Loading menu..."}</p>;

  const change = (itemId, d) => setCart((c) => ({ ...c, [itemId]: Math.max(0, (c[itemId] || 0) + d) }));
  const lines = rest.menu.filter((m) => cart[m._id] > 0);
  const total = lines.reduce((s, m) => s + m.price * cart[m._id], 0);

  const useMyLocation = () =>
    navigator.geolocation.getCurrentPosition(
      (p) => setDrop({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => setError("Location blocked. The order will use a demo drop point near the restaurant.")
    );

  const place = async () => {
    setError("");
    try {
      const order = await api("/orders", {
        method: "POST",
        body: {
          restaurantId: id,
          address,
          dropLocation: drop || undefined,
          items: lines.map((m) => ({ itemId: m._id, qty: cart[m._id] })),
        },
      });
      nav(`/track/${order._id}`);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="split">
      <section>
        <h1>{rest.name}</h1>
        <p className="muted">{rest.cuisine} - {rest.address}</p>
        {rest.menu.map((m) => (
          <div key={m._id} className="row">
            <div>
              <strong><span className={`dot ${m.veg ? "veg" : "nonveg"}`} />{m.name}</strong>
              <p className="muted">{m.description}</p>
              <p>Rs. {m.price}</p>
            </div>
            <div className="qty">
              <button onClick={() => change(m._id, -1)}>-</button>
              <span>{cart[m._id] || 0}</span>
              <button onClick={() => change(m._id, 1)}>+</button>
            </div>
          </div>
        ))}
      </section>

      <aside className="card">
        <h2>Your order</h2>
        {!lines.length && <p className="muted">Add items from the menu.</p>}
        {lines.map((m) => (
          <p key={m._id} className="line"><span>{cart[m._id]} x {m.name}</span><span>Rs. {m.price * cart[m._id]}</span></p>
        ))}
        <p className="line total"><span>Total</span><span>Rs. {total}</span></p>
        <label>Delivery address<textarea rows="2" value={address} onChange={(e) => setAddress(e.target.value)} /></label>
        <button className="ghost" onClick={useMyLocation}>{drop ? "Location saved" : "Use my current location"}</button>
        {error && <p className="error">{error}</p>}
        <button className="primary" disabled={!lines.length || !address.trim()} onClick={place}>Place order</button>
      </aside>
    </div>
  );
}
