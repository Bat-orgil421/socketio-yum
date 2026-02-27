"use client";

import { useState, useEffect } from "react";
import Navbar from "../navbar/navber";

type User = {
  id: number;
  name: string;
  email: string;
  points: number;
  streak: number;
};

type FriendsData = {
  friends: User[];
  pendingRequests: User[];
  sentRequests: User[];
};

export default function FriendsPage() {
  const [friendsData, setFriendsData] = useState<FriendsData>({
    friends: [],
    pendingRequests: [],
    sentRequests: [],
  });
  const [loading, setLoading] = useState(true);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [newFriendEmail, setNewFriendEmail] = useState("");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    fetchFriends();
  }, []);

  const fetchFriends = async () => {
    try {
      const res = await fetch("/api/friends");
      const data = await res.json();
      setFriendsData(data);
    } catch (error) {
      console.error("Error fetching friends:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverEmail: newFriendEmail }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Friend request sent!" });
        setNewFriendEmail("");
        setShowAddFriend(false);
        fetchFriends();
      } else {
        const error = await res.json();
        setMessage({
          type: "error",
          text: error.error || "Failed to send friend request",
        });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to send friend request" });
    }
  };

  const handleAcceptRequest = async (friendshipId: number) => {
    try {
      const res = await fetch(`/api/friends/${friendshipId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "accepted" }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Friend request accepted!" });
        fetchFriends();
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to accept friend request" });
    }
  };

  const handleRejectRequest = async (friendshipId: number) => {
    try {
      const res = await fetch(`/api/friends/${friendshipId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected" }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Friend request rejected" });
        fetchFriends();
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to reject friend request" });
    }
  };

  const handleRemoveFriend = async (friendshipId: number) => {
    try {
      const res = await fetch(`/api/friends/${friendshipId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Friend removed" });
        fetchFriends();
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to remove friend" });
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 p-8 text-black dark:text-white transition-colors">
      {/* Navbar */}
      <div className="px-7 pt-6">
        <Navbar />
      </div>

      <div className="px-7 pt-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            Friends
          </h1>
          <button
            onClick={() => setShowAddFriend(!showAddFriend)}
            className="px-4 py-2 bg-gradient-to-r from-emerald-400 to-teal-500 text-white rounded-full font-semibold hover:shadow-lg transition-shadow"
          >
            {showAddFriend ? "Cancel" : "Add Friend"}
          </button>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-4 p-4 rounded-lg ${
              message.type === "success"
                ? "bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200"
                : "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Add Friend Form */}
        {showAddFriend && (
          <form
            onSubmit={handleAddFriend}
            className="mb-6 p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg"
          >
            <div className="flex gap-2">
              <input
                type="email"
                value={newFriendEmail}
                onChange={(e) => setNewFriendEmail(e.target.value)}
                placeholder="Enter friend's email"
                className="flex-1 px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 outline-none focus:border-emerald-500"
                required
              />
              <button
                type="submit"
                className="px-6 py-2 bg-emerald-500 text-white rounded-lg font-semibold hover:bg-emerald-600 transition-colors"
              >
                Send Request
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
            Loading...
          </div>
        ) : (
          <div className="space-y-6">
            {/* Pending Requests */}
            {friendsData.pendingRequests.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-3 text-zinc-900 dark:text-zinc-100">
                  Pending Requests ({friendsData.pendingRequests.length})
                </h2>
                <div className="space-y-2">
                  {friendsData.pendingRequests.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white font-bold">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                            {user.name}
                          </p>
                          <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            {user.points} points • {user.streak} day streak
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAcceptRequest(user.id)}
                          className="px-3 py-1 bg-emerald-500 text-white rounded-lg text-sm font-semibold hover:bg-emerald-600 transition-colors"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleRejectRequest(user.id)}
                          className="px-3 py-1 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sent Requests */}
            {friendsData.sentRequests.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-3 text-zinc-900 dark:text-zinc-100">
                  Sent Requests ({friendsData.sentRequests.length})
                </h2>
                <div className="space-y-2">
                  {friendsData.sentRequests.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-white font-bold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {user.name}
                        </p>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                          {user.points} points • {user.streak} day streak
                        </p>
                      </div>
                      <span className="ml-auto text-sm text-amber-500 font-semibold">
                        Pending
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Friends List */}
            <div>
              <h2 className="text-xl font-semibold mb-3 text-zinc-900 dark:text-zinc-100">
                My Friends ({friendsData.friends.length})
              </h2>
              {friendsData.friends.length === 0 ? (
                <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
                  No friends yet. Add some friends to get started!
                </div>
              ) : (
                <div className="space-y-2">
                  {friendsData.friends.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                            {user.name}
                          </p>
                          <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            {user.points} points • {user.streak} day streak
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveFriend(user.id)}
                        className="px-3 py-1 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
