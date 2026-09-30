import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";

export default function Restaurants() {
  const [list, setList] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { api("/restaurants").then(setList).catch((e) => setError(e.message)); }, []);

  if (error) return <p className="error">{error}</p>;
  if (!list) return <p className="muted">Loading restaurants...</p>;
  if (!list.length) return <p className="muted">No restaurants yet. Run <code>npm run seed</code> to add demo data.</p>;

  return (
    <>
      <h1>Hungry? Pick a kitchen.</h1>
      <div className="grid">
        {list.map((r) => (
          <Link key={r._id} to={`/restaurant/${r._id}`} className="card rest">
            <h2>{r.name}</h2>
            <p>{r.cuisine}</p>
            <p className="muted">{r.address}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
