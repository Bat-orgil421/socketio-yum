"use client";

import { useState, useEffect } from "react";
import Navbar from "../navbar/navber";
import { Button } from "@/components/ui/button";
import {
  X,
  ChevronDown,
  Truck,
  MapPinPlus,
  Store,
  Earth,
  Utensils,
  ShoppingCart,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { toast } from "sonner";

interface Food {
  id: number;
  name: string;
  image: string;
  price: number;
  mealType: {
    name: string;
  };
}

interface GroceryItem {
  id: number;
  name: string;
  unit: string;
  calPerUnit: string;
  image: string | null;
  price: number;
}

interface CartItem extends Food {
  quantity: number;
}

interface CartGroceryItem extends GroceryItem {
  quantity: number;
}

export default function Page() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [mealTypes, setMealTypes] = useState<string[]>([]);
  const [cuisines, setCuisines] = useState<string[]>([]);
  const [groceryItems, setGroceryItems] = useState<GroceryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [foods, setFoods] = useState<Food[]>([]);
  const [displayGrocery, setDisplayGrocery] = useState<GroceryItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<string>("home");
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [deliveryLocation, setDeliveryLocation] = useState("");

  // Accordion state for the left sidebar
  const [expandedSection, setExpandedSection] = useState<
    "meals" | "cuisine" | "grocery" | null
  >(null);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    const fetchMealTypes = async () => {
      try {
        const response = await fetch("/api/mealtypes");
        if (response.ok) {
          const data = await response.json();
          setMealTypes([...data, "Cuisine", "Grocery"]);
        } else {
          console.error("Failed to fetch meal types");
        }
      } catch (error) {
        console.error("Error fetching meal types:", error);
      }
    };

    fetchMealTypes();
  }, []);

  const handleItemClick = async (item: string) => {
    // Set the selected item (for meal types or cuisines)
    setSelectedItem(item);

    // Fetch foods for the selected meal type or cuisine
    try {
      const response = await fetch(`/api/foods?mealType=${item}`);
      if (response.ok) {
        const data = await response.json();
        setFoods(data);
      } else {
        console.error("Failed to fetch foods");
        setFoods([]);
      }
    } catch (error) {
      console.error("Error fetching foods:", error);
      setFoods([]);
    }
  };

  const addToCart = (food: Food) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === food.id);
      if (existing) {
        return prev.map((item) =>
          item.id === food.id ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }
      return [...prev, { ...food, quantity: 1 }];
    });
  };

  const removeFromCart = (foodId: number) => {
    setCart((prev) => prev.filter((item) => item.id !== foodId));
  };

  const updateQuantity = (foodId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(foodId);
    } else {
      setCart((prev) =>
        prev.map((item) => (item.id === foodId ? { ...item, quantity } : item)),
      );
    }
  };

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 p-8 relative transition-colors">
      {/* Navbar */}
      <div className="px-7 pt-6">
        <Navbar />
      </div>

      {/* Top pill navigation + right user */}
      <div className="px-7 pt-4">
        {/* Greeting + Search */}
        <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
              Explore Meals
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Discover delicious foods for every meal
            </p>
          </div>

          <div className="flex w-full max-w-xl items-center gap-2 rounded-full bg-zinc-100 dark:bg-zinc-800 px-4 py-3">
            <span className="text-zinc-400 dark:text-zinc-500">🔎</span>
            <input
              className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500 text-zinc-900 dark:text-zinc-100"
              placeholder="Search for foods and recipes"
            />
            <button className="grid h-8 w-8 place-items-center rounded-full bg-white dark:bg-zinc-700 shadow-sm cursor-pointer">
              🍽️
            </button>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="px-7 pb-8 pt-6">
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* LEFT: Meal Selection - Accordion */}
          <section className="rounded-[28px] bg-white dark:bg-zinc-900 p-6 shadow-[0_12px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_30px_rgba(0,0,0,0.3)] lg:w-[360px]">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-4">
              Filter by
            </h2>

            <div className="space-y-2">
              {/* Meal Types Section */}
              <div>
                <button
                  onClick={() =>
                    setExpandedSection(
                      expandedSection === "meals" ? null : "meals",
                    )
                  }
                  className={`w-full flex items-center justify-between px-4 py-3 transition-all rounded-lg cursor-pointer ${
                    expandedSection === "meals"
                      ? "bg-yellow-300 hover:bg-yellow-400 dark:bg-yellow-500 dark:hover:bg-yellow-600 rounded-full text-zinc-900 font-semibold"
                      : "bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100"
                  }`}
                >
                  <span className="font-medium flex items-center">
                    <Utensils className="w-5 h-5 mr-2" /> Meal Types
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${
                      expandedSection === "meals"
                        ? "rotate-180 text-zinc-900"
                        : "text-zinc-600 dark:text-zinc-400"
                    }`}
                  />
                </button>
                {expandedSection === "meals" && (
                  <div className="p-3 space-y-2 bg-transparent border-t-0">
                    {mealTypes
                      .filter(
                        (item) => item !== "Cuisine" && item !== "Grocery",
                      )
                      .map((item) => (
                        <button
                          key={item}
                          onClick={() => handleItemClick(item)}
                          className={`block w-full text-left p-2 rounded-lg text-sm transition-colors cursor-pointer ${
                            selectedItem === item
                              ? "bg-[#7B61FF] text-white"
                              : "bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100"
                          }`}
                        >
                          {item}
                        </button>
                      ))}
                  </div>
                )}
              </div>

              {/* Cuisine Section */}
              <div>
                <button
                  onClick={async () => {
                    if (expandedSection !== "cuisine") {
                      // Fetch cuisines when expanding
                      try {
                        const response = await fetch("/api/cuisines");
                        if (response.ok) {
                          const data = await response.json();
                          setCuisines(data);
                        }
                      } catch (error) {
                        console.error("Error fetching cuisines:", error);
                      }
                    }
                    setExpandedSection(
                      expandedSection === "cuisine" ? null : "cuisine",
                    );
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 transition-all rounded-lg cursor-pointer ${
                    expandedSection === "cuisine"
                      ? "bg-yellow-300 hover:bg-yellow-400 dark:bg-yellow-500 dark:hover:bg-yellow-600 rounded-full text-zinc-900 font-semibold"
                      : "bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100"
                  }`}
                >
                  <span className="font-medium flex items-center">
                    <Earth className="w-5 h-5 mr-2" /> Cuisines
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${
                      expandedSection === "cuisine"
                        ? "rotate-180 text-zinc-900"
                        : "text-zinc-600 dark:text-zinc-400"
                    }`}
                  />
                </button>
                {expandedSection === "cuisine" && (
                  <div className="p-3 space-y-2 bg-transparent border-t-0">
                    {cuisines.map((item) => (
                      <button
                        key={item}
                        onClick={() => handleItemClick(item)}
                        className={`block w-full text-left p-2 rounded-lg text-sm transition-colors cursor-pointer ${
                          selectedItem === item
                            ? "bg-[#7B61FF] text-white"
                            : "bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100"
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Grocery Section */}
              <div>
                <button
                  onClick={async () => {
                    if (expandedSection !== "grocery") {
                      // Fetch grocery items when expanding
                      try {
                        const response = await fetch("/api/grocery");
                        if (response.ok) {
                          const data = await response.json();
                          setDisplayGrocery(data);
                        }
                      } catch (error) {
                        console.error("Error fetching grocery items:", error);
                      }
                    }
                    setExpandedSection(
                      expandedSection === "grocery" ? null : "grocery",
                    );
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 transition-all rounded-lg cursor-pointer ${
                    expandedSection === "grocery"
                      ? "bg-yellow-300 hover:bg-yellow-400 dark:bg-yellow-500 dark:hover:bg-yellow-600 rounded-full text-zinc-900 font-semibold"
                      : "bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100"
                  }`}
                >
                  <span className="font-medium flex items-center">
                    <ShoppingCart className="w-5 h-5 mr-2" /> Grocery Items
                  </span>
                </button>
              </div>
            </div>
          </section>

          {/* CENTER + RIGHT */}
          <div className="flex-1">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
              {/* CENTER: Foods/Grocery Grid */}
              <div className="space-y-6">
                {expandedSection === "grocery" && (
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                    Grocery Items
                  </h2>
                )}
                {selectedItem && expandedSection !== "grocery" && (
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                    Foods for {selectedItem}
                  </h2>
                )}
                {expandedSection === "grocery" && displayGrocery.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {displayGrocery.map((item) => (
                      <div
                        key={item.id}
                        className="group bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 hover:border-green-300 hover:shadow-xl transition-all duration-300 flex flex-row items-center"
                      >
                        <img
                          src={item.image || "https://via.placeholder.com/150"}
                          alt={item.name}
                          className="w-24 h-24 object-contain bg-zinc-100 dark:bg-zinc-800 rounded-l-2xl"
                        />
                        <div className="flex-1 p-3">
                          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                            {item.name}
                          </h3>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                            {item.unit}
                          </p>
                          <div className="flex justify-between items-center mt-2">
                            <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                              ${Number(item.price).toFixed(2)}
                            </p>
                          </div>
                        </div>
                        <Button
                          className="mr-3"
                          size="sm"
                          onClick={() => {
                            setCart((prev) => {
                              const existing = prev.find(
                                (cartItem) =>
                                  (cartItem as any).groceryItemId === item.id,
                              );
                              if (existing) {
                                return prev.map((cartItem) =>
                                  (cartItem as any).groceryItemId === item.id
                                    ? {
                                        ...cartItem,
                                        quantity: cartItem.quantity + 1,
                                      }
                                    : cartItem,
                                );
                              }
                              return [
                                ...prev,
                                {
                                  ...item,
                                  groceryItemId: item.id,
                                  quantity: 1,
                                } as any,
                              ];
                            });
                          }}
                        >
                          Buy
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : expandedSection === "grocery" ? (
                  <p className="text-zinc-500 dark:text-zinc-400">
                    No grocery items available.
                  </p>
                ) : foods.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {foods.map((food) => (
                      <div
                        key={food.id}
                        className="group bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 hover:border-[#7B61FF]/30 hover:shadow-xl transition-all duration-300 flex flex-row items-center"
                      >
                        <div className="relative overflow-hidden">
                          <img
                            src={food.image}
                            alt={food.name}
                            className="w-full h-48 object-contain bg-zinc-100 dark:bg-zinc-800 transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute top-3 left-3 px-2 py-1 bg-white/90 dark:bg-zinc-800/90 rounded-full flex items-center gap-1">
                            <span className="text-yellow-500">★</span>
                            <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                              4.5
                            </span>
                          </div>
                          <button
                            onClick={() => addToCart(food)}
                            className="absolute bottom-3 right-3 w-10 h-10 bg-[#7B61FF] hover:bg-[#6a52e0] rounded-full flex items-center justify-center text-white shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300"
                          >
                            <ShoppingCart className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="p-4 flex flex-col flex-1">
                          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-[#7B61FF] transition-colors">
                            {food.name}
                          </h3>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                            {food.mealType.name}
                          </p>
                          <div className="mt-auto pt-3 flex items-center justify-between">
                            <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                              ${Number(food.price).toFixed(2)}
                            </span>
                            <Button
                              size="sm"
                              className="bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded-full px-4"
                              onClick={() => addToCart(food)}
                            >
                              <ShoppingCart className="w-4 h-4 mr-1" />
                              Add
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : selectedItem ? (
                  <p className="text-zinc-500 dark:text-zinc-400">
                    No foods found for {selectedItem}.
                  </p>
                ) : (
                  <p className="text-zinc-500 dark:text-zinc-400">
                    Select a meal type or cuisine to view foods.
                  </p>
                )}
              </div>

              {/* RIGHT: Meal Stats or Recommendations */}
              <div className="space-y-6">
                {/* Delivery Options Card */}
                <section className="rounded-[28px] bg-white dark:bg-zinc-900 p-6 shadow-[0_12px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_30px_rgba(0,0,0,0.3)]">
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                      📍 Delivery Options
                    </h3>
                    <div className="space-y-3">
                      {[
                        {
                          id: "home",
                          label: "Delivery",
                          desc: "To your address",
                        },
                        {
                          id: "pickup",
                          label: "Pickup",
                          desc: "From restaurant",
                        },
                      ].map((option) => (
                        <label
                          key={option.id}
                          className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border transition-all ${
                            selectedDelivery === option.id
                              ? "bg-[#7B61FF]/10 border-[#7B61FF] dark:bg-[#7B61FF]/20"
                              : "border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                          }`}
                        >
                          <input
                            type="radio"
                            name="delivery"
                            value={option.id}
                            checked={selectedDelivery === option.id}
                            onChange={(e) =>
                              setSelectedDelivery(e.target.value)
                            }
                            className="w-4 h-4 cursor-pointer"
                          />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                              {option.label}
                            </div>
                            <div className="text-xs text-zinc-500 dark:text-zinc-400">
                              {option.desc}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Conditional Action Buttons */}
                  {selectedDelivery === "home" &&
                    !showLocationInput &&
                    !deliveryLocation && (
                      <Button
                        className="w-full bg-[#7B61FF] hover:bg-[#6a52e0] text-white"
                        onClick={() => setShowLocationInput(true)}
                      >
                        <MapPinPlus className="mr-2 h-4 w-4" /> Add Location
                      </Button>
                    )}
                  {selectedDelivery === "home" &&
                    !showLocationInput &&
                    deliveryLocation && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                          <MapPinPlus className="h-4 w-4 text-green-600 dark:text-green-400" />
                          <span className="text-sm text-green-700 dark:text-green-300 flex-1 truncate">
                            {deliveryLocation}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => setShowLocationInput(true)}
                          >
                            Edit
                          </Button>
                        </div>
                      </div>
                    )}
                  {selectedDelivery === "home" && showLocationInput && (
                    <div className="space-y-3">
                      <div className="relative">
                        <MapPinPlus className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                        <input
                          type="text"
                          placeholder="Enter your delivery address..."
                          value={deliveryLocation}
                          onChange={(e) => setDeliveryLocation(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#7B61FF] focus:border-transparent"
                        />
                      </div>
                      {deliveryLocation && (
                        <div className="flex gap-2">
                          <Button
                            className="flex-1 bg-[#7B61FF] hover:bg-[#6a52e0] text-white"
                            onClick={() => {
                              toast.success("Location saved successfully!");
                              setShowLocationInput(false);
                            }}
                          >
                            Confirm Location
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                              setDeliveryLocation("");
                              setShowLocationInput(false);
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                  {selectedDelivery === "pickup" && (
                    <Button className="w-full bg-[#7B61FF] hover:bg-[#6a52e0] text-white">
                      <Store className="mr-2 h-4 w-4" /> Pick Branch
                    </Button>
                  )}
                </section>

                {/* Popular Meals */}
                <section className="rounded-[28px] bg-white dark:bg-zinc-900 p-6 shadow-[0_12px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_30px_rgba(0,0,0,0.3)]">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        Popular Meals
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        This week
                      </div>
                    </div>
                    <button className="grid h-8 w-8 place-items-center rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 cursor-pointer">
                      ⋯
                    </button>
                  </div>

                  <div className="mt-4 space-y-3">
                    {[
                      { name: "Breakfast Burrito", orders: 42 },
                      { name: "Grilled Chicken Salad", orders: 28 },
                      { name: "Pasta Primavera", orders: 35 },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#7B61FF]/10 dark:bg-[#7B61FF]/20 rounded-full flex items-center justify-center">
                          🍽️
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                            {item.name}
                          </div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-400">
                            {item.orders} orders
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Nutrition Tips */}
                <section className="rounded-[28px] bg-white dark:bg-zinc-900 p-6 shadow-[0_12px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_30px_rgba(0,0,0,0.3)]">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      Nutrition Tips
                    </div>
                    <button className="grid h-8 w-8 place-items-center rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 cursor-pointer">
                      💡
                    </button>
                  </div>

                  <div className="mt-4 text-xs text-zinc-600 dark:text-zinc-400">
                    Balance your plate with 50% vegetables, 25% protein, and 25%
                    whole grains for optimal nutrition.
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Cart Button */}
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

      {/* Cart Drawer */}
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent className="h-[70vh] bg-white dark:bg-zinc-900">
          <DrawerHeader className="flex flex-row items-center justify-between border-b border-zinc-200 dark:border-zinc-700 pb-4">
            <div>
              <DrawerTitle className="text-zinc-900 dark:text-zinc-100">
                Your Cart
              </DrawerTitle>
              <DrawerDescription className="text-zinc-500 dark:text-zinc-400">
                {cartCount} item{cartCount !== 1 ? "s" : ""} in your cart
              </DrawerDescription>
            </div>
            <DrawerClose className="h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700">
              <X className="h-4 w-4 text-black dark:text-zinc-100" />
            </DrawerClose>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-zinc-500 dark:text-zinc-400">
                <span className="text-4xl mb-2">
                  <ShoppingCart />
                </span>
                <p>Your cart is empty</p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-zinc-900 dark:text-zinc-100">
                      {item.name}
                    </h4>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      ${Number(item.price).toFixed(2)} each
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() =>
                          updateQuantity(item.id, item.quantity - 1)
                        }
                      >
                        -
                      </Button>
                      <span className="w-8 text-center text-zinc-900 dark:text-zinc-100">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                      >
                        +
                      </Button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                      onClick={() => removeFromCart(item.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {cart.length > 0 && (
            <DrawerFooter className="border-t border-zinc-200 dark:border-zinc-700 pt-4 space-y-4">
              {/* Total and Checkout */}
              <div>
                <div className="flex items-center justify-between mb-4 px-2">
                  <span className="font-semibold text-lg text-zinc-900 dark:text-zinc-100">
                    Total
                  </span>
                  <span className="font-bold text-xl text-[#7B61FF]">
                    ${cartTotal.toFixed(2)}
                  </span>
                </div>
                <Button
                  className="w-full bg-[#7B61FF] hover:bg-[#6a52e0]"
                  size="lg"
                  onClick={async () => {
                    if (!isLoaded || !user) {
                      alert("Please sign in to checkout");
                      return;
                    }

                    // Validate delivery location if delivery is selected
                    if (
                      selectedDelivery === "home" &&
                      !deliveryLocation.trim()
                    ) {
                      toast.error("Please enter a delivery address");
                      return;
                    }

                    try {
                      // Get the user ID from Clerk and map to database user
                      const email = user.primaryEmailAddress?.emailAddress;
                      if (!email) {
                        alert("Could not get user email");
                        return;
                      }

                      // Fetch user from our database
                      const userRes = await fetch(
                        `/api/users?email=${encodeURIComponent(email)}`,
                      );
                      if (!userRes.ok) {
                        alert("User not found");
                        return;
                      }
                      const dbUser = await userRes.json();

                      // Calculate total price
                      const totalPrice = cart.reduce(
                        (sum, item) => sum + item.price * item.quantity,
                        0,
                      );

                      // Create order with cart items
                      const items = cart.map((item) => ({
                        id: item.id,
                        name: item.name,
                        price: item.price,
                        quantity: item.quantity,
                        image: item.image,
                        // Include groceryItemId if this is a grocery item
                        groceryItemId: (item as any).groceryItemId,
                      }));

                      const orderRes = await fetch("/api/orders", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          userId: dbUser.id,
                          items: JSON.stringify(items),
                          status: "pending",
                          totalPrice: Math.round(totalPrice),
                          deliveryType: selectedDelivery,
                          deliveryAddress:
                            selectedDelivery === "home"
                              ? deliveryLocation
                              : null,
                        }),
                      });

                      if (orderRes.ok) {
                        // Clear cart and navigate
                        setCart([]);
                        setIsDrawerOpen(false);
                        toast.success("Order placed successfully! 🎉");
                      } else {
                        const errorData = await orderRes.json();
                        toast.error(errorData.error || "Failed to create order");
                      }
                    } catch (error) {
                      console.error("Checkout error:", error);
                      toast.error("An error occurred during checkout");
                    }
                  }}
                >
                  Checkout
                </Button>
              </div>
            </DrawerFooter>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}
