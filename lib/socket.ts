import { Server as IOServer } from "socket.io";

export function getIO(): IOServer {
  const globalIo = (global as any).io as IOServer | undefined;
  if (!globalIo) {
    throw new Error("Socket.io not initialized. Make sure you're using the custom server.js");
  }
  return globalIo;
}
