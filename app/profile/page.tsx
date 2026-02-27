"use client";

import { useState, useEffect, useRef } from "react";
import Navbar from "../navbar/navber";
import { useUser, SignOutButton } from "@clerk/nextjs";

type UserData = {
  name: string;
  email: string;
  username?: string | null;
};

export default function Page() {
  const { user, isLoaded } = useUser();
  const [userName, setUserName] = useState("User");
  const [username, setUsername] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [showPfpDialog, setShowPfpDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [editingDisplayName, setEditingDisplayName] = useState(false);
  const [displayNameInput, setDisplayNameInput] = useState("");
  const [updatingDisplayName, setUpdatingDisplayName] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isLoaded && user) {
      const email = user.primaryEmailAddress?.emailAddress || "";
      setUserEmail(email);
      setUserName(user.fullName || user.firstName || "User");
      fetchUserData(email);
    } else if (isLoaded && !user) {
      setLoading(false);
    }
  }, [isLoaded, user]);

  const fetchUserData = async (email: string) => {
    try {
      const response = await fetch(
        `/api/users?email=${encodeURIComponent(email)}`,
      );
      if (response.ok) {
        const data: UserData = await response.json();
        setUserName(data.name);
        setUsername(data.username || null);
        setDisplayNameInput(data.name);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDisplayName = async () => {
    if (!displayNameInput.trim()) return;

    setUpdatingDisplayName(true);
    try {
      const response = await fetch("/api/users", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: displayNameInput.trim() }),
      });

      if (response.ok) {
        const data: UserData = await response.json();
        setUserName(data.name);
        setEditingDisplayName(false);
      } else {
        console.error("Failed to update display name");
      }
    } catch (error) {
      console.error("Error updating display name:", error);
    } finally {
      setUpdatingDisplayName(false);
    }
  };

  const handleCancelEdit = () => {
    setDisplayNameInput(userName);
    setEditingDisplayName(false);
  };

  const handlePfpClick = () => {
    setShowPfpDialog(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!user || !previewImage) return;

    setUploading(true);
    try {
      // Convert base64 to blob
      const response = await fetch(previewImage);
      const blob = await response.blob();
      const file = new File([blob], "profile.jpg", { type: "image/jpeg" });

      // Upload to Clerk
      await user.setProfileImage({ file });

      // Close dialog and reset
      setShowPfpDialog(false);
      setPreviewImage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Error uploading profile picture:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setShowPfpDialog(false);
    setPreviewImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 dark:text-white p-8">
      <div className="px-7 pt-6">
        <Navbar />
      </div>

      <div className="flex justify-center pt-8">
        <div className="mt-4 flex flex-col gap-8 lg:max-w-4xl w-full max-w-2xl">
          {/* Profile Header - Centered */}
          <div className="flex flex-col items-center text-center gap-6">
            <div className="relative">
              <button
                onClick={handlePfpClick}
                className="relative group cursor-pointer"
              >
                {user?.imageUrl ? (
                  <img
                    src={user.imageUrl}
                    alt={userName}
                    className="h-24 w-24 rounded-full object-cover border-4 border-white dark:border-zinc-800 shadow-lg group-hover:opacity-80 transition-opacity"
                  />
                ) : (
                  <div className="h-24 w-24 rounded-full bg-[#FFD54A] flex items-center justify-center text-3xl font-bold text-zinc-900 group-hover:opacity-80 transition-opacity">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-black/50 rounded-full h-24 w-24 flex items-center justify-center">
                    <span className="text-white text-2xl">📷</span>
                  </div>
                </div>
              </button>
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white">
                {loading ? "Loading..." : userName}
              </h1>
              <p className="text-sm text-zinc-500 mt-1">
                {loading ? "Loading..." : userEmail}
              </p>
            </div>
          </div>

          {/* Profile Sections - Centered */}
          <div className="grid grid-cols-1 gap-6">
            {/* Personal Information */}
            <section className="rounded-[28px] bg-white dark:bg-zinc-900  p-6 shadow-[0_12px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_30px_rgba(0,0,0,0.3)]">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                  Personal Information
                </h3>
                <button className="grid h-8 w-8 place-items-center rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700">
                  ✏️
                </button>
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    value={username || "Not set"}
                    readOnly
                    className="w-full rounded-lg border dark:bg-zinc-800 dark:border-zinc-500 dark:text-white border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none text-zinc-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">
                    Display name
                  </label>
                  {editingDisplayName ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={displayNameInput}
                        onChange={(e) => setDisplayNameInput(e.target.value)}
                        className="flex-1 rounded-lg border dark:bg-zinc-800 dark:border-zinc-500 dark:text-white border-zinc-200 bg-white px-4 py-3 text-sm outline-none text-zinc-900 focus:border-[#FFD54A]"
                        autoFocus
                      />
                      <button
                        onClick={handleUpdateDisplayName}
                        disabled={
                          updatingDisplayName || !displayNameInput.trim()
                        }
                        className="px-4 py-3 rounded-lg bg-[#FFD54A] text-zinc-900 text-sm font-medium hover:bg-[#FFC938] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {updatingDisplayName ? "Saving..." : "Save"}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        disabled={updatingDisplayName}
                        className="px-4 py-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={userName}
                        readOnly
                        className="flex-1 rounded-lg border dark:bg-zinc-800 dark:border-zinc-500 dark:text-white border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none text-zinc-900"
                      />
                      <button
                        onClick={() => setEditingDisplayName(true)}
                        className="px-4 py-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-700"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Activity Stats */}
            <section className="rounded-[28px] bg-white dark:bg-zinc-900 p-6 shadow-[0_12px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_30px_rgba(0,0,0,0.3)]">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                  Activity Stats
                </h3>
                <button className="grid h-8 w-8 place-items-center rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700">
                  📊
                </button>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-lime-50 dark:bg-lime-950/40 p-4">
                  <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Active Days
                  </div>
                  <div className="mt-2 text-lg font-extrabold text-zinc-900 dark:text-white">
                    24
                  </div>
                  <div className="text-[10px] text-zinc-500 dark:text-zinc-400">
                    this month
                  </div>
                </div>
                <div className="rounded-2xl bg-sky-50 dark:bg-sky-950/40 p-4">
                  <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Total Activities
                  </div>
                  <div className="mt-2 text-lg font-extrabold text-zinc-900 dark:text-white">
                    156
                  </div>
                  <div className="text-[10px] text-zinc-500 dark:text-zinc-400">
                    all time
                  </div>
                </div>
                <div className="rounded-2xl bg-purple-50 dark:bg-purple-950/40 p-4">
                  <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Streak
                  </div>
                  <div className="mt-2 text-lg font-extrabold text-zinc-900 dark:text-white">
                    7 days
                  </div>
                  <div className="text-[10px] text-zinc-500 dark:text-zinc-400">
                    keep it up!
                  </div>
                </div>
                <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/40 p-4">
                  <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Completed
                  </div>
                  <div className="mt-2 text-lg font-extrabold text-zinc-900 dark:text-white">
                    89%
                  </div>
                  <div className="text-[10px] text-zinc-500 dark:text-zinc-400">
                    success rate
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Sign Out Button */}
          <div className="pt-4">
            <SignOutButton>
              <button className="w-full rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/60">
                Sign Out
              </button>
            </SignOutButton>
          </div>
        </div>
      </div>

      {/* Profile Picture Dialog */}
      {showPfpDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4 text-center">
              Change Profile Picture
            </h2>

            {/* Image Preview Container */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative w-full aspect-square rounded-2xl bg-zinc-100 dark:bg-zinc-800 border-2 border-dashed border-zinc-300 dark:border-zinc-600 flex items-center justify-center cursor-pointer hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors overflow-hidden"
            >
              {previewImage ? (
                <img
                  src={previewImage}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-3 text-zinc-500 dark:text-zinc-400">
                  <span className="text-5xl">📷</span>
                  <p className="text-sm font-medium">
                    Click to select an image
                  </p>
                  <p className="text-xs">from your device</p>
                </div>
              )}
            </div>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCancel}
                disabled={uploading}
                className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-3 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!previewImage || uploading}
                className="flex-1 rounded-xl bg-[#FFD54A] px-4 py-3 text-sm font-medium text-zinc-900 hover:bg-[#FFC938] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? "Uploading..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
