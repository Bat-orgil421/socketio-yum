"use client";

import { useState, useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import io from "socket.io-client";
import { toast } from "sonner";

interface User {
  id: number;
  name: string;
  email: string;
  isAdmin: boolean;
}
interface OrderItem {
  id: number;
  foodId: number | null;
  groceryItemId: number | null;
  quantity: number;
  price: number;
  food: { id: number; name: string; image: string } | null;
  groceryItem: { id: number; name: string; image: string } | null;
}

interface Order {
  id: number;
  userId: number;
  user: User;
  items: OrderItem[];
  status: string;
  deliveryType: string;
  deliveryAddress: string | null;
  createdAt: string;
}

function formatOrderItems(items: OrderItem[] | undefined | null) {
  if (!items || items === null) {
    return "No items";
  }
  return items
    .map((item: OrderItem) => {
      const name = item.food?.name || item.groceryItem?.name || "Unknown";
      return `${name} x${item.quantity}`;
    })
    .join(", ");
}

function getOrderTotal(items: OrderItem[] | undefined | null) {
  if (!items || items === null) {
    return 0;
  }
  return items.reduce(
    (sum: number, item: OrderItem) => sum + item.price * item.quantity,
    0,
  );
}

export default function AdminOrderPage() {
  const { user, isLoaded } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const socketRef = useRef<ReturnType<typeof io> | null>(null);

  // Check if user is admin
  useEffect(() => {
    if (!isLoaded) return;

    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => {
        setIsAdmin(data.isAdmin);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [isLoaded]);

  // Initialize Socket.io and fetch initial data
  useEffect(() => {
    if (!isAdmin) return;

    // Fetch initial data
    const fetchData = async () => {
      try {
        const [ordersRes, usersRes] = await Promise.all([
          fetch("/api/orders"),
          fetch("/api/users/all"),
        ]);

        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          setOrders(ordersData);
        }

        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setUsers(usersData);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };

    // Initial load
    fetchData();

    // Initialize Socket.io connection for real-time table updates
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

    // Listen for new orders
    socket.on("new-order", (newOrder: Order) => {
      toast.success(`New Order #${newOrder.id}`, {
        description: `Customer: ${newOrder.user.name}`,
      });
      setOrders((prevOrders) => [newOrder, ...prevOrders]);
    });

    // Listen for order updates and refresh table
    socket.on("order-updated", (updatedOrder: Order) => {
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === updatedOrder.id ? updatedOrder : order,
        ),
      );
    });

    // Listen for order deletion and remove from table
    socket.on("order-deleted", (orderId: number) => {
      setOrders((prevOrders) =>
        prevOrders.filter((order) => order.id !== orderId),
      );
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAdmin]);

  const handleUpdateOrderStatus = async (orderId: number, status: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        const updatedOrder = await response.json();
        // Socket.io will handle the update through the "order-updated" event
        // emitted from the API route
      } else {
        toast("Failed to update order status");
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      toast("Error updating order status");
    }
  };

  const handleDeleteOrder = async (orderId: number) => {
    if (!confirm("Are you sure you want to delete this order?")) return;

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Socket.io will handle the removal through the "order-deleted" event
        // emitted from the API route
      } else {
        toast("Failed to delete order");
      }
    } catch (error) {
      console.error("Error deleting order:", error);
      toast("Error deleting order");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="bg-card rounded-lg border border-border p-8 text-center max-w-md">
          <h2 className="text-xl font-semibold text-card-foreground mb-2">
            Access Denied
          </h2>
          <p className="text-muted-foreground">
            You are not an admin. Please contact an administrator for access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Manage Orders
          </h1>
          <p className="text-muted-foreground">
            View and manage all orders. Update order status or delete orders as
            needed.
          </p>
        </div>

        {/* Orders Table */}
        <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-card-foreground">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-card-foreground">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-card-foreground">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-card-foreground">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-card-foreground">
                    Delivery
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-card-foreground">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-card-foreground">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-card-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-8 text-center text-muted-foreground"
                    >
                      No orders found
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-muted/50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-foreground">
                        #{order.id}
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground">
                        {order.user.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        <div className="line-clamp-2">
                          {formatOrderItems(order.items)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-foreground">
                        ${getOrderTotal(order.items).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            order.deliveryType === "home"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {order.deliveryType === "home"
                            ? "Delivery"
                            : "Pickup"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {order.deliveryType === "home" &&
                        order.deliveryAddress ? (
                          <span
                            className="text-xs max-w-[200px] truncate block"
                            title={order.deliveryAddress}
                          >
                            📍 {order.deliveryAddress}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            order.status === "PENDING"
                              ? "bg-yellow-100 text-yellow-700"
                              : order.status === "CONFIRMED" ||
                                order.status === "PREPARING"
                              ? "bg-blue-100 text-blue-700"
                              : order.status === "COMPLETED"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {order.status.charAt(0).toUpperCase() +
                            order.status.slice(1).toLowerCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex flex-wrap gap-1">
                          <button
                            onClick={() =>
                              handleUpdateOrderStatus(order.id, "PENDING")
                            }
                            className={`px-2 py-1 text-xs rounded-md font-medium transition-colors cursor-pointer ${
                              order.status === "PENDING"
                                ? "bg-yellow-200 text-yellow-800"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                            }`}
                          >
                            Pending
                          </button>
                          <button
                            onClick={() =>
                              handleUpdateOrderStatus(order.id, "CONFIRMED")
                            }
                            className={`px-2 py-1 text-xs rounded-md font-medium transition-colors cursor-pointer ${
                              order.status === "CONFIRMED"
                                ? "bg-blue-200 text-blue-800"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                            }`}
                          >
                            Confirmed
                          </button>
                          <button
                            onClick={() =>
                              handleUpdateOrderStatus(order.id, "PREPARING")
                            }
                            className={`px-2 py-1 text-xs rounded-md font-medium transition-colors cursor-pointer ${
                              order.status === "PREPARING"
                                ? "bg-blue-200 text-blue-800"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                            }`}
                          >
                            Preparing
                          </button>
                          <button
                            onClick={() =>
                              handleUpdateOrderStatus(order.id, "DELIVERING")
                            }
                            className={`px-2 py-1 text-xs rounded-md font-medium transition-colors ${
                              order.status === "DELIVERING"
                                ? "bg-purple-200 text-purple-800"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                            }`}
                          >
                            Delivering
                          </button>
                          <button
                            onClick={() =>
                              handleUpdateOrderStatus(order.id, "COMPLETED")
                            }
                            className={`px-2 py-1 text-xs rounded-md font-medium transition-colors ${
                              order.status === "COMPLETED"
                                ? "bg-green-200 text-green-800"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                            }`}
                          >
                            Completed
                          </button>
                          <button
                            onClick={() =>
                              handleUpdateOrderStatus(order.id, "CANCELLED")
                            }
                            className={`px-2 py-1 text-xs rounded-md font-medium transition-colors ${
                              order.status === "CANCELLED"
                                ? "bg-red-200 text-red-800"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                            }`}
                          >
                            Cancelled
                          </button>
                          <button
                            onClick={() => handleDeleteOrder(order.id)}
                            className="px-2 py-1 text-xs rounded-md font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">Total Orders</p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {orders.length}
            </p>
          </div>
          <div className="bg-card rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold text-yellow-700 mt-1">
              {orders.filter((o) => o.status === "PENDING").length}
            </p>
          </div>
          <div className="bg-card rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">Completed</p>
            <p className="text-2xl font-bold text-green-700 mt-1">
              {orders.filter((o) => o.status === "COMPLETED").length}
            </p>
          </div>
          <div className="bg-card rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">Cancelled</p>
            <p className="text-2xl font-bold text-red-700 mt-1">
              {orders.filter((o) => o.status === "CANCELLED").length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
