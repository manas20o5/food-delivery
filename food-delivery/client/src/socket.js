import { io } from "socket.io-client";

// One authenticated connection per page that needs live data
export function connectSocket() {
  return io({ auth: { token: localStorage.getItem("token") } });
}
