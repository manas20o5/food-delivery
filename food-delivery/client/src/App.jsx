import { Link, NavLink, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { useAuth } from "./auth.jsx";
import Auth from "./pages/Auth.jsx";
import Restaurants from "./pages/Restaurants.jsx";
import Menu from "./pages/Menu.jsx";
import Orders from "./pages/Orders.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Track from "./pages/Track.jsx";

function Guard({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const home = !user ? "/login" : user.role === "customer" ? "/" : "/dashboard";

  return (
    <>
      <header className="bar">
        <Link to={home} className="logo">Doorstep</Link>
        <nav>
          {user?.role === "customer" && (
            <>
              <NavLink to="/">Restaurants</NavLink>
              <NavLink to="/orders">My orders</NavLink>
            </>
          )}
          {user && user.role !== "customer" && <NavLink to="/dashboard">Orders</NavLink>}
          {user ? (
            <button className="ghost" onClick={() => { logout(); nav("/login"); }}>
              Log out ({user.name.split(" ")[0]})
            </button>
          ) : (
            <NavLink to="/login">Log in</NavLink>
          )}
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/login" element={<Auth />} />
          <Route path="/" element={<Guard>{user?.role === "customer" ? <Restaurants /> : <Navigate to="/dashboard" />}</Guard>} />
          <Route path="/restaurant/:id" element={<Guard><Menu /></Guard>} />
          <Route path="/orders" element={<Guard><Orders /></Guard>} />
          <Route path="/dashboard" element={<Guard><Dashboard /></Guard>} />
          <Route path="/track/:id" element={<Guard><Track /></Guard>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </>
  );
}
