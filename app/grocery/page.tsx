"use client";

import { useEffect, useState } from "react";
import Navbar from "../navbar/navber";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Leaf, ShoppingCart, Flame, DollarSign } from "lucide-react";
import { Drawer } from "@/components/ui/drawer";
import CartDrawer from "../cart/drawer";

interface GroceryItem {
  id: number;
  name: string;
  unit: string;
  calPerUnit: string;
  image?: string;
  price: number;
}

interface Food {
  id: number;
  name: string;
  image: string;
  price: number;
  mealType: {
    name: string;
  };
}

interface CartItem extends Food {
  quantity: number;
  type: "food";
}

interface GroceryCartItem {
  id: number;
  name: string;
  unit: string;
  image?: string;
  price: number;
  quantity: number;
  type: "grocery";
}

type CartItemType = CartItem | GroceryCartItem;

export default function GroceryPage() {
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItemType[]>([]);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        // Normalize cart items to ensure they have the correct type
        const normalizedItems = parsed.map((item: any) => ({
          ...item,
          type: item.type || "food", // Default to "food" for backward compatibility
        }));
        setCart(normalizedItems);
      } catch (e) {
        console.error("Failed to parse cart from localStorage", e);
      }
    }
  }, []);

  const addToCart = (item: GroceryItem) => {
    setCart((prev) => {
      const existing = prev.find(
        (i) => i.type === "grocery" && i.id === item.id,
      );
      if (existing) {
        return prev.map((i) =>
          i.type === "grocery" && i.id === item.id
            ? { ...i, quantity: i.quantity + 1 }
            : i,
        );
      }
      return [...prev, { ...item, quantity: 1, type: "grocery" as const }];
    });
  };

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await fetch("/api/grocery");
        const data = await response.json();
        setItems(data);
      } catch (error) {
        console.error("Error fetching grocery items:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-zinc-50/50 dark:bg-zinc-950 pt-20">
      <Navbar />
      <div className="container mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="flex items-center gap-4 mb-10">
          <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-2xl">
            <Leaf className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
              Fresh Groceries
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1">
              Premium quality ingredients for your healthy meals
            </p>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="border-zinc-200 dark:border-zinc-800">
                <Skeleton className="w-full h-48 rounded-t-xl" />
                <CardHeader className="pb-3">
                  <Skeleton className="h-6 w-3/4" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item) => (
              <Card
                key={item.id}
                className="group cursor-pointer border-zinc-200 dark:border-zinc-800 hover:border-green-200 dark:hover:border-green-800 hover:shadow-lg dark:hover:shadow-green-900/20 transition-all duration-300 overflow-hidden bg-white dark:bg-zinc-900"
              >
                {/* Image Section */}
                <div className="relative">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-48 bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                      <Leaf className="w-16 h-16 text-green-200 dark:text-green-800" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-white/90 dark:bg-zinc-800/90 text-zinc-900 dark:text-zinc-100 hover:bg-white dark:hover:bg-zinc-700">
                      <Flame className="w-3 h-3 mr-1" />
                      {item.calPerUnit}
                    </Badge>
                  </div>
                </div>

                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-green-700 dark:group-hover:text-green-400 transition-colors">
                    {item.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Unit Badge */}
                  <Badge
                    variant="secondary"
                    className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/50"
                  >
                    <Leaf className="w-3 h-3 mr-1" />
                    {item.unit}
                  </Badge>

                  {/* Price & Action */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                        {Number(item.price).toFixed(2)}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      className="bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 transition-colors"
                      onClick={() => addToCart(item)}
                    >
                      <ShoppingCart className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      <Button
        className="fixed bottom-8 right-8 h-14 w-14 rounded-full shadow-lg bg-[#7B61FF] hover:bg-[#6a52e0] z-50"
        size="icon"
        onClick={() => setIsDrawerOpen(true)}
      >
        <div className="relative">
          <span className="text-lg">
            <ShoppingCart />
          </span>
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </div>
      </Button>

      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <CartDrawer
          isDrawerOpen={isDrawerOpen}
          setIsDrawerOpen={setIsDrawerOpen}
          cart={cart}
          setCart={setCart}
        />
      </Drawer>
    </div>
  );
}
