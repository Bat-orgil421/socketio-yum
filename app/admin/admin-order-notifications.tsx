"use client";

import { useEffect, useRef } from "react";
import io from "socket.io-client";
import { toast } from "sonner";

interface Order {
  id: number;
  userId: number;
  user: {
    id: number;
    name: string;
    email: string;
    isAdmin: boolean;
  };
  status: string;
  createdAt: string;
}

export function AdminOrderNotifications() {
  const socketRef = useRef<ReturnType<typeof io> | null>(null);

  useEffect(() => {
    // Initialize Socket.io connection
    const socket = io("http://localhost:3000", {
      path: "/api/socket/io",
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    // Join the admin-orders room
    socket.emit("join-admin-orders");

    // Listen for new orders across all admin pages
    socket.on("new-order", (newOrder: Order) => {
      toast.success(`New Order #${newOrder.id}`, {
        description: `Customer: ${newOrder.user.name}`,
      });
    });

    // Listen for order updates
    socket.on("order-updated", (updatedOrder: Order) => {
      console.log(`Order #${updatedOrder.id} Updated`, {
        description: `Status: ${updatedOrder.status}`,
      });
    });

    // Listen for order deletion
    socket.on("order-deleted", (orderId: number) => {
      toast.info(`Order #${orderId} Deleted`, {
        description: "This order has been removed.",
      });
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  return null;
}
