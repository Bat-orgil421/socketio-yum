"use client";

import {
  Home,
  Van,
  Utensils,
  ShoppingBasket,
  MapPin,
  User,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  {
    title: "order",
    href: "/admin/order",
    icon: Van,
  },
  {
    title: "Create",
    href: "/admin/createitems",
    icon: Utensils,
  },
  {
    title: "Admins",
    href: "/admin/admins",
    icon: ShoppingBasket,
  },
  {
    title: "Back to dashboard",
    href: "/home",
    icon: Home,
  }
];

export function AppSidebar({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-card border-r border-border transition-all duration-300 ease-in-out",
        open ? "w-64" : "w-16",
      )}
    >
      {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-border px-4 gap-4">
          <Link href="/home" className="flex items-center gap-3">
            <span className="text-xl font-bold text-foreground">yum</span>
          </Link>
          <button
            onClick={onToggle}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted transition-colors"
          >
            {open ? (
              <ChevronLeft className="h-5 w-5" />
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
          </button>
        </div>

      {/* Navigation */}
      <nav className="mt-6 px-3">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {open && <span>{item.title}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom section - Admin link */}
      <div className="absolute bottom-6 left-0 right-0 px-3">
        <Link
          href="/admin"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
            pathname.startsWith("/admin")
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          <User className="h-5 w-5 shrink-0" />
          {open && <span>Admin</span>}
        </Link>
      </div>
    </aside>
  );
}
