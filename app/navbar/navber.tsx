"use client";

import { useUser } from "@clerk/nextjs";
import {
  UserCircle,
  Home,
  UtensilsCrossed,
  MapPin,
  ShoppingCart,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/meal", label: "Meal", icon: UtensilsCrossed },
  { href: "/map", label: "Map", icon: MapPin },
  { href: "/grocery", label: "Grocery", icon: ShoppingCart },
];

export default function Navbar() {
  const { user, isLoaded } = useUser();
  const pathname = usePathname();

  // Safely get userName - prefer fullName, fallback to firstName, then username, then email
  const userName =
    user?.fullName ||
    user?.firstName ||
    user?.username ||
    user?.primaryEmailAddress?.emailAddress ||
    "User";

  // Check if a nav item is active
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <header className="fixed top-0 left-0 top-0 w-full z-50">
      {/* Glassmorphism container */}
      <div className="mx-4">
        <nav className="relative overflow-hidden rounded-2xl bg-background/80 dark:bg-zinc-950/80 backdrop-blur-xl border border-border/50 dark:border-zinc-800/50 shadow-lg shadow-black/5 dark:shadow-black/20">
          {/* Gradient accent line at top */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500" />

          <div className="flex items-center justify-between px-4 py-3">
            {/* User Avatar / Profile Link */}
            <Link href="/profile" className="group relative flex-shrink-0">
              <div className="relative h-11 w-11 overflow-hidden rounded-full ring-2 ring-transparent group-hover:ring-orange-500/50 transition-all duration-300 group-hover:scale-105">
                {user?.imageUrl ? (
                  <img
                    src={user.imageUrl}
                    alt={userName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-bold text-lg">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                )}
                {/* Online status indicator */}
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 ring-2 ring-white dark:ring-zinc-950" />
              </div>
              {/* Subtle glow effect */}
              <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-orange-500/20 to-amber-500/20 blur-xl" />
            </Link>

            {/* Navigation Links */}
            <div className="flex items-center gap-1 md:gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "relative group flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-300",
                      "hover:scale-105 active:scale-95",
                      active
                        ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/80 dark:hover:bg-zinc-800/80",
                    )}
                  >
                    {/* Icon with animation */}
                    <Icon
                      className={cn(
                        "h-4 w-4 transition-transform duration-300 group-hover:scale-110",
                        active
                          ? "text-white"
                          : "text-muted-foreground group-hover:text-foreground",
                      )}
                    />
                    <span
                      className={cn(
                        "text-sm font-medium hidden sm:inline-block transition-colors",
                        active ? "text-white" : "group-hover:text-foreground",
                      )}
                    >
                      {item.label}
                    </span>

                    {/* Active indicator dot */}
                    {active && (
                      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white" />
                    )}

                    {/* Hover gradient overlay */}
                    {!active && (
                      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-orange-500/10 to-amber-500/10" />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Right side - Theme Toggle & Admin */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Admin Link */}
              <Link
                href="/admin"
                className={cn(
                  "relative group flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-300",
                  "hover:scale-105 active:scale-95",
                  isActive("/admin")
                        ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25"
                        : "text-muted-foreground hover:text-foreground hover:bg-orange-50 dark:hover:bg-orange-950/30",
                )}
              >
                <Shield
                  className={cn(
                    "h-4 w-4 transition-transform duration-300 group-hover:scale-110",
                    isActive("/admin") ? "text-white" : "",
                  )}
                />

                {/* Hover gradient overlay */}
                {!isActive("/admin") && (
                  <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-orange-500/10 to-amber-500/10" />
                )}
              </Link>

              <ThemeToggle />
            </div>
          </div>
        </nav>
      </div>

      {/* Spacer to account for fixed navbar */}
      <div className="h-20" />
    </header>
  );
}
