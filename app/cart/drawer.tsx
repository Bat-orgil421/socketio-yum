import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { useEffect, useState } from "react";
import { ShoppingCart, X } from "lucide-react";
import { useUser } from "@clerk/nextjs";
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
  image?: string;
  price: number;
}

interface CartItem extends Food {
  quantity: number;
  type: "food";
}

interface GroceryCartItem extends GroceryItem {
  quantity: number;
  type: "grocery";
}

type CartItemType = CartItem | GroceryCartItem;

interface CartDrawerProps {
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
  cart: CartItemType[];
  setCart: React.Dispatch<React.SetStateAction<CartItemType[]>>;
}

export default function CartDrawer({
  isDrawerOpen,
  setIsDrawerOpen,
  cart,
  setCart,
}: CartDrawerProps) {
  const { user, isLoaded } = useUser();

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const removeFromCart = (foodId: number) => {
    setCart((prev) =>
      prev.filter((item) => !(item.type === "food" && item.id === foodId)),
    );
  };

  const updateQuantity = (foodId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(foodId);
    } else {
      setCart((prev) =>
        prev.map((item) =>
          item.type === "food" && item.id === foodId
            ? { ...item, quantity }
            : item,
        ),
      );
    }
  };

  return (
    <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
      <DrawerContent className="h-[70vh]">
        <DrawerHeader className="flex flex-row items-center justify-between border-b pb-4">
          <div>
            <DrawerTitle>Your Cart</DrawerTitle>
            <DrawerDescription>
              {cartCount} item{cartCount !== 1 ? "s" : ""} in your cart
            </DrawerDescription>
          </div>
          <DrawerClose className="h-8 w-8 rounded-full bg-zinc-100 flex items-center justify-center hover:bg-zinc-200">
            <X className="h-4 w-4" />
          </DrawerClose>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-zinc-500">
              <span className="text-4xl mb-2">
                <ShoppingCart />
              </span>
              <p>Your cart is empty</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={`${item.type}-${item.id}`}
                className="flex items-center gap-4 p-3 bg-zinc-50 rounded-xl"
              >
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-16 h-16 bg-green-50 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🥬</span>
                  </div>
                )}
                <div className="flex-1">
                  <h4 className="font-medium text-zinc-900">{item.name}</h4>
                  <p className="text-sm text-zinc-500">
                    ${Number(item.price).toFixed(2)}{" "}
                    {item.type === "grocery" ? `per ${item.unit}` : "each"}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      -
                    </Button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      +
                    </Button>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
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
          <DrawerFooter className="border-t pt-4">
            <div className="flex items-center justify-between mb-4 px-2">
              <span className="font-semibold text-lg">Total</span>
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

                  // Create order with cart items
                  const items = cart.map((item) => ({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    image: item.image,
                  }));

                  const orderRes = await fetch("/api/orders", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      userId: dbUser.id,
                      items: JSON.stringify(items),
                      status: "pending",
                    }),
                  });

                  if (orderRes.ok) {
                    // Clear cart and close drawer
                    setCart([]);
                    setIsDrawerOpen(false);
                    toast.success("Order placed successfully! 🎉");
                  } else {
                    toast.error("Failed to create order");
                  }
                } catch (error) {
                  console.error("Checkout error:", error);
                  toast.error("An error occurred during checkout");
                }
              }}
            >
              Checkout
            </Button>
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  );
}
