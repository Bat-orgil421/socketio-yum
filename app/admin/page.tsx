"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Handbag, User } from "lucide-react";

interface User {
  id: number;
  name: string;
  email: string;
  isAdmin: boolean;
}

interface Order {
  id: number;
  userId: number;
  user: User;
  items: string;
  status: string;
  createdAt: string;
}

export default function AdminPage() {
  const { user, isLoaded } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

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

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
      fetchOrders();
    }
  }, [isAdmin]);

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
          <h2 className="text-xl font-semibold text-card-foreground mb-2">Access Denied</h2>
          <p className="text-muted-foreground">
            You are not an admin. Please contact an administrator for access.
          </p>
        </div>
      </div>
    );
  }

  const fetchUsers = async () => {
    const res = await fetch("/api/users/all");
    const data = await res.json();
    setUsers(data);
  };

  const fetchOrders = async () => {
    const res = await fetch("/api/orders");
    const data = await res.json();
    setOrders(data);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">
            Select an option from the sidebar to manage your admin tasks.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">
                  Total Users
                </p>
                <p className="text-3xl font-bold text-foreground mt-2">
                  {users.length}
                </p>
              </div>
              <div className="bg-primary/10 rounded-lg p-3">
                <User className="w-8 h-8 text-primary" />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">
                  Total Orders
                </p>
                <p className="text-3xl font-bold text-foreground mt-2">
                  {orders.length}
                </p>
              </div>
              <div className="bg-primary/10 rounded-lg p-3">
                <Handbag className="w-8 h-8 text-primary" />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">
                  Admin Users
                </p>
                <p className="text-3xl font-bold text-foreground mt-2">
                  {users.filter((u) => u.isAdmin).length}
                </p>
              </div>
              <div className="bg-primary/10 rounded-lg p-3">
                <svg
                  className="w-8 h-8 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Welcome Message */}
        <div className="mt-8 bg-card rounded-lg border border-border p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-card-foreground mb-2">
            Welcome to Admin Panel
          </h2>
          <p className="text-muted-foreground">
            Use the navigation sidebar to access user management, order
            management, and other admin features. You can create new items,
            manage cuisines and meal types, or view detailed order information.
          </p>
        </div>
      </div>
    </div>
  );
}
