import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth.jsx";

export default function Auth() {
  const { login, register } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "customer" });
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const u = mode === "login" ? await login(form.email, form.password) : await register(form);
      nav(u.role === "customer" ? "/" : "/dashboard");
    } catch (err) {
      setError(err.message);
    }
  };
  const quick = (email) => setForm({ ...form, email, password: "123456" });

  return (
    <div className="card narrow">
      <h1>{mode === "login" ? "Log in" : "Create your account"}</h1>
      <form onSubmit={submit}>
        {mode === "register" && (
          <>
            <label>Name<input value={form.name} onChange={set("name")} required /></label>
            <label>I am a
              <select value={form.role} onChange={set("role")}>
                <option value="customer">Customer</option>
                <option value="restaurant">Restaurant owner</option>
                <option value="delivery">Delivery partner</option>
              </select>
            </label>
          </>
        )}
        <label>Email<input type="email" value={form.email} onChange={set("email")} required /></label>
        <label>Password<input type="password" value={form.password} onChange={set("password")} required /></label>
        {error && <p className="error">{error}</p>}
        <button className="primary">{mode === "login" ? "Log in" : "Sign up"}</button>
      </form>
      <button className="link" onClick={() => setMode(mode === "login" ? "register" : "login")}>
        {mode === "login" ? "New here? Create an account" : "Have an account? Log in"}
      </button>
      {mode === "login" && (
        <div className="demo">
          <p className="muted">Demo accounts (password 123456). Tap to fill:</p>
          <button className="chip" onClick={() => quick("customer@demo.com")}>Customer</button>
          <button className="chip" onClick={() => quick("restaurant@demo.com")}>Restaurant</button>
          <button className="chip" onClick={() => quick("rider@demo.com")}>Rider</button>
        </div>
      )}
    </div>
  );
}
