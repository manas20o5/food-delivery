import { createContext, useContext, useState } from "react";
import { api } from "./api.js";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("user") || "null"));

  const finish = ({ token, user }) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setUser(user);
    return user;
  };
  const login = async (email, password) => finish(await api("/auth/login", { method: "POST", body: { email, password } }));
  const register = async (form) => finish(await api("/auth/register", { method: "POST", body: form }));
  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  return <AuthCtx.Provider value={{ user, login, register, logout }}>{children}</AuthCtx.Provider>;
}
