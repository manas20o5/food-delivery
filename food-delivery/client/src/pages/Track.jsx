import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import L from "leaflet";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import { api } from "../api.js";
import { connectSocket } from "../socket.js";
import { useAuth } from "../auth.jsx";
import { Badge, Timeline } from "../components/Status.jsx";

const pin = (emoji) =>
  L.divIcon({ className: "pin", html: `<span>${emoji}</span>`, iconSize: [36, 36], iconAnchor: [18, 18] });
const ICONS = { shop: pin("🍽️"), home: pin("🏠"), rider: pin("🛵") };

// Straight-line distance in km
function km(a, b) {
  const R = 6371, rad = (x) => (x * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function Fit({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points.length) map.fitBounds(points.map((p) => [p.lat, p.lng]), { padding: [50, 50], maxZoom: 16 });
  }, [points.length]); // eslint-disable-line
  return null;
}

export default function Track() {
  const { id } = useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [rider, setRider] = useState(null);
  const [error, setError] = useState("");
  const [sharing, setSharing] = useState("");
  const socketRef = useRef(null);
  const stopRef = useRef(null);

  const load = () =>
    api(`/orders/${id}`).then((o) => { setOrder(o); if (o.riderLocation?.lat) setRider(o.riderLocation); }).catch((e) => setError(e.message));

  // Open one socket for this page
  useEffect(() => {
    load();
    const s = connectSocket();
    socketRef.current = s;
    s.on("statusChanged", ({ status }) => { setOrder((o) => (o ? { ...o, status } : o)); load(); });
    s.on("locationChanged", ({ lat, lng }) => setRider({ lat, lng }));
    return () => { stopRef.current?.(); s.disconnect(); };
  }, [id]); // eslint-disable-line

  // Join the order room (again once a rider is assigned)
  const partnerId = order?.deliveryPartner?._id;
  useEffect(() => {
    if (order) socketRef.current?.emit("joinOrder", id, (r) => r?.riderLocation?.lat && setRider(r.riderLocation));
  }, [order?._id, partnerId]); // eslint-disable-line

  const shop = order?.restaurant?.location;
  const home = order?.dropLocation;
  const points = useMemo(() => [shop, home].filter(Boolean), [shop?.lat, home?.lat]); // eslint-disable-line
  const live = order && ["PICKED_UP", "OUT_FOR_DELIVERY"].includes(order.status);
  const isMyDelivery = user.role === "delivery" && partnerId === user.id;

  // ----- Rider tools: real GPS or a simulated ride -----
  const send = (lat, lng) => { socketRef.current.emit("locationUpdate", { orderId: id, lat, lng }); setRider({ lat, lng }); };
  const stop = () => { stopRef.current?.(); stopRef.current = null; setSharing(""); };
  const startGps = () => {
    stop();
    const w = navigator.geolocation.watchPosition((p) => send(p.coords.latitude, p.coords.longitude), (e) => setError(e.message), { enableHighAccuracy: true });
    stopRef.current = () => navigator.geolocation.clearWatch(w);
    setSharing("gps");
  };
  const startSim = () => {
    stop();
    let step = 0;
    const steps = 40;
    const t = setInterval(() => {
      step++;
      const f = Math.min(step / steps, 1);
      send(shop.lat + (home.lat - shop.lat) * f, shop.lng + (home.lng - shop.lng) * f);
      if (f === 1) stop();
    }, 1000);
    stopRef.current = () => clearInterval(t);
    setSharing("sim");
  };

  if (error && !order) return <p className="error">{error}</p>;
  if (!order) return <p className="muted">Loading order...</p>;

  const eta = rider && home ? Math.max(1, Math.round((km(rider, home) / 25) * 60)) : null;

  return (
    <div className="split track">
      <section>
        <div className="mapbox">
          <MapContainer center={[shop.lat, shop.lng]} zoom={13} scrollWheelZoom>
            <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Fit points={points} />
            <Marker position={[shop.lat, shop.lng]} icon={ICONS.shop}><Popup>{order.restaurant.name}</Popup></Marker>
            <Marker position={[home.lat, home.lng]} icon={ICONS.home}><Popup>Delivery address</Popup></Marker>
            <Polyline positions={[[shop.lat, shop.lng], [home.lat, home.lng]]} pathOptions={{ color: "#9aa5bd", dashArray: "6 8" }} />
            {rider && <Marker position={[rider.lat, rider.lng]} icon={ICONS.rider}><Popup>Delivery partner</Popup></Marker>}
          </MapContainer>
        </div>
        {isMyDelivery && live && (
          <div className="card tools">
            <strong>Share location with the customer</strong>
            <div className="actions">
              <button className="primary" onClick={startGps} disabled={sharing === "gps"}>Use my GPS</button>
              <button className="ghost" onClick={startSim} disabled={sharing === "sim"}>Simulate a ride</button>
              {sharing && <button className="ghost" onClick={stop}>Stop</button>}
            </div>
            {error && <p className="error">{error}</p>}
          </div>
        )}
      </section>

      <aside className="card">
        <h2>{order.restaurant.name}</h2>
        <Badge status={order.status} />
        {live && eta && <p className="eta">About {eta} min away</p>}
        {live && !rider && <p className="muted">Waiting for the rider's first location update...</p>}
        {order.deliveryPartner && <p className="muted">Rider: {order.deliveryPartner.name}</p>}
        <Timeline status={order.status} />
        <p className="line total"><span>{order.items.map((i) => `${i.qty} x ${i.name}`).join(", ")}</span><span>Rs. {order.total}</span></p>
      </aside>
    </div>
  );
}
