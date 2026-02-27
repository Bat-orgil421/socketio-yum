"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";

interface User {
  id: number;
  name: string;
  email: string;
  isAdmin: boolean;
}

export default function Admins() {
  const { user, isLoaded } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);

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
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    const res = await fetch("/api/users/all");
    const data = await res.json();
    setUsers(data);
  };

  const handleSetAdmin = async (userId: number, isAdmin: boolean) => {
    await fetch(`/api/users/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAdmin }),
    });
    fetchUsers();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Manage Admins</h1>
          <p className="text-muted-foreground">
            View and manage admin access for users. You can promote or demote users to/from admin status.
          </p>
        </div>

        {/* Users Table */}
        <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-card-foreground">ID</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-card-foreground">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-card-foreground">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-card-foreground">Admin Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-card-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 text-sm text-foreground">{user.id}</td>
                      <td className="px-6 py-4 text-sm text-foreground font-medium">{user.name}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{user.email}</td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.isAdmin
                              ? "bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {user.isAdmin ? "Admin" : "User"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => handleSetAdmin(user.id, !user.isAdmin)}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                            user.isAdmin
                              ? "bg-red-100 text-red-700 hover:bg-red-200"
                              : "bg-green-100 text-green-700 hover:bg-green-200"
                          }`}
                        >
                          {user.isAdmin ? "Remove Admin" : "Make Admin"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-6 flex gap-4">
          <div className="flex-1 bg-card rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">Total Users</p>
            <p className="text-2xl font-bold text-foreground mt-1">{users.length}</p>
          </div>
          <div className="flex-1 bg-card rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">Admin Users</p>
            <p className="text-2xl font-bold text-foreground mt-1">{users.filter(u => u.isAdmin).length}</p>
          </div>
          <div className="flex-1 bg-card rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">Regular Users</p>
            <p className="text-2xl font-bold text-foreground mt-1">{users.filter(u => !u.isAdmin).length}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
