"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Navbar from "../navbar/navber";

// Types
interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  distance: number;
  price: string;
  image: string;
  address: string;
  coordinates: [number, number];
  isOpen: boolean;
  tags: string[];
}

interface UserLocation {
  lat: number;
  lng: number;
  accuracy: number;
}

// Dynamic import for Map component to avoid SSR issues
const Map = dynamic(() => import("./Map"), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] w-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center rounded-xl">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
        <p className="text-gray-600 dark:text-zinc-400">Loading map...</p>
      </div>
    </div>
  ),
});

export default function FoodMapPage() {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] =
    useState<Restaurant | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([
    47.9215, 106.9056,
  ]);
  const [mapZoom, setMapZoom] = useState(13);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("distance");
  const [viewMode, setViewMode] = useState<"map" | "list">("map");

  // Real Restaurants in Ulaanbaatar
  const mongolianRestaurants: Restaurant[] = [
    {
      id: "1",
      name: "The Bull",
      cuisine: "Bar & Restaurant",
      rating: 4.5,
      distance: 0.3,
      price: "$$",
      image:
        "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
      address: "Baga Toiruu, Ulaanbaatar",
      coordinates: [47.918, 106.9057],
      isOpen: true,
      tags: ["Popular", "Bar"],
    },
    {
      id: "2",
      name: "Modern Nomads",
      cuisine: "Mongolian Restaurant",
      rating: 4.6,
      distance: 0.5,
      price: "$",
      image:
        "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80",
      address: "Chinggis Khaan Avenue, Ulaanbaatar",
      coordinates: [47.924, 106.918],
      isOpen: false,
      tags: ["Fine Dining", "Traditional"],
    },
    {
      id: "3",
      name: "Hazara",
      cuisine: "Indian Restaurant",
      rating: 4.3,
      distance: 0.4,
      price: "$$",
      image:
        "https://images.unsplash.com/photo-1614926779318-f4f4115cee1a?auto=format&fit=crop&w=800&q=80",
      address: "Olympic Street, Ulaanbaatar",
      coordinates: [47.915, 106.91],
      isOpen: true,
      tags: ["Indian", "Curry"],
    },
    {
      id: "4",
      name: "KHAAN Sky Restaurant",
      cuisine: "Mongolian Restaurant",
      rating: 4.7,
      distance: 1.2,
      price: "$$",
      image:
        "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=800&q=80",
      address: "Peace Avenue, Ulaanbaatar",
      coordinates: [47.9205, 106.904],
      isOpen: true,
      tags: ["Sky View", "Panoramic"],
    },
  ];

  // Get user location
  useEffect(() => {
    // Always load restaurants first
    setRestaurants(mongolianRestaurants);
    setLoading(false);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };
          setUserLocation(location);
          // Auto-center map on user location when page loads
          setMapCenter([location.lat, location.lng]);
          setMapZoom(15);

          // Calculate distances
          const restaurantsWithDistance = mongolianRestaurants.map(
            (restaurant) => ({
              ...restaurant,
              distance: calculateDistance(
                location.lat,
                location.lng,
                restaurant.coordinates[0],
                restaurant.coordinates[1],
              ),
            }),
          );
          setRestaurants(restaurantsWithDistance);
        },
        (error) => {
          setError("Location permission denied. Showing Ulaanbaatar area.");
          // If location denied, center on Ulaanbaatar
          setMapCenter([47.9215, 106.9056]);
          setMapZoom(13);
        },
      );
    } else {
      setError("Geolocation not supported.");
      // If geolocation not supported, center on Ulaanbaatar
      setMapCenter([47.9215, 106.9056]);
      setMapZoom(13);
    }
  }, []);

  // Sort restaurants
  useEffect(() => {
    const sorted = [...restaurants].sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return b.rating - a.rating;
        case "distance":
          return a.distance - b.distance;
        case "price":
          const priceOrder: Record<string, number> = { $: 1, $$: 2, $$$: 3 };
          return priceOrder[a.price] - priceOrder[b.price];
        default:
          return 0;
      }
    });
    setRestaurants(sorted);
  }, [sortBy, restaurants.length]);

  // Filter restaurants
  const filteredRestaurants = restaurants.filter((restaurant) => {
    if (activeFilter === "open" && !restaurant.isOpen) return false;
    if (activeFilter === "closed" && restaurant.isOpen) return false;
    if (activeFilter === "all") return true;
    return true;
  });

  // Helper function to calculate distance
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number => {
    const R = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return Math.round(distance * 10) / 10;
  };

  const deg2rad = (deg: number): number => {
    return deg * (Math.PI / 180);
  };

  // Handle marker click
  const handleMarkerClick = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
  };

  // Handle restaurant card click
  const handleRestaurantClick = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setMapCenter(restaurant.coordinates);
    setMapZoom(15);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-zinc-950 dark:to-zinc-900 text-gray-900 dark:text-white transition-colors">
      {/* Navbar */}
      <div className="px-7 pt-6">
        <Navbar />
      </div>

      {/* Header */}
      <div className="px-7 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Food Delivery
            </h1>
            <p className="text-gray-600 dark:text-zinc-400 mt-1">
              Restaurants in Ulaanbaatar
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode("map")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === "map"
                  ? "bg-blue-500 text-white"
                  : "bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700"
              }`}
            >
              Map
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === "list"
                  ? "bg-blue-500 text-white"
                  : "bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700"
              }`}
            >
              List
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* User Location Card */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-zinc-800">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`w-3 h-3 rounded-full animate-pulse ${
                    userLocation
                      ? "bg-blue-500"
                      : "bg-gray-300 dark:bg-zinc-600"
                  }`}
                ></div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Your Location
                </h3>
              </div>

              {loading ? (
                <div className="animate-pulse space-y-3">
                  <div className="bg-gray-200 dark:bg-zinc-700 h-4 rounded w-3/4"></div>
                  <div className="bg-gray-200 dark:bg-zinc-700 h-4 rounded w-1/2"></div>
                  <div className="bg-gray-200 dark:bg-zinc-700 h-4 rounded w-2/3"></div>
                </div>
              ) : userLocation ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-zinc-400">
                    <span>📍</span>
                    <span>
                      {userLocation.lat.toFixed(6)},{" "}
                      {userLocation.lng.toFixed(6)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-zinc-500">
                    Accuracy: ±{userLocation.accuracy.toFixed(0)}m
                  </p>
                  <button
                    onClick={() => {
                      if (userLocation) {
                        setMapCenter([userLocation.lat, userLocation.lng]);
                        setMapZoom(15);
                      }
                    }}
                    className="w-full mt-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2.5 px-4 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all font-medium shadow-md"
                  >
                    Re-center Map on You
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-red-500 text-sm">{error}</p>
                  <button
                    onClick={() => {
                      // Try again
                      window.location.reload();
                    }}
                    className="w-full bg-blue-500 text-white py-2.5 px-4 rounded-lg hover:bg-blue-600 transition-all font-medium"
                  >
                    Get My Location
                  </button>
                  <p className="text-xs text-gray-500 dark:text-zinc-500 text-center">
                    Or
                  </p>
                  <button
                    onClick={() => {
                      // Set to Ulaanbaatar center
                      const ubLocation = {
                        lat: 47.9215,
                        lng: 106.9056,
                        accuracy: 0,
                      };
                      setUserLocation(ubLocation);
                      setMapCenter([ubLocation.lat, ubLocation.lng]);
                    }}
                    className="w-full bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 py-2.5 px-4 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-700 transition-all font-medium"
                  >
                    Use Ulaanbaatar Center
                  </button>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-zinc-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Filters
              </h3>

              {/* Status Filters */}
              <div className="space-y-3 mb-4">
                <p className="text-sm font-medium text-gray-700 dark:text-zinc-300">
                  Status
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: "all", label: "All" },
                    { key: "open", label: "Open" },
                    { key: "closed", label: "Closed" },
                  ].map((filter) => (
                    <button
                      key={filter.key}
                      onClick={() => setActiveFilter(filter.key)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        activeFilter === filter.key
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700"
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort Options */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700 dark:text-zinc-300">
                  Sort by
                </p>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
                >
                  <option value="distance">📍 Nearest Distance</option>
                  <option value="rating">⭐ Highest Rating</option>
                  <option value="price">💰 Lowest Price</option>
                </select>
                <p className="text-xs text-gray-500 dark:text-zinc-500">
                  {sortBy === "distance" && "Sort by distance from you"}
                  {sortBy === "rating" && "Sort by rating (high to low)"}
                  {sortBy === "price" && "Sort by price (cheap to expensive)"}
                </p>
              </div>
            </div>

            {/* Stats Card */}
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-6 shadow-lg text-white">
              <h3 className="text-lg font-semibold mb-4">Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-blue-100">Total</span>
                  <span className="font-bold text-xl">
                    {filteredRestaurants.length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-100">Open</span>
                  <span className="font-bold text-xl">
                    {filteredRestaurants.filter((r) => r.isOpen).length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-100">Avg Rating</span>
                  <span className="font-bold text-xl">
                    ⭐{" "}
                    {filteredRestaurants.length > 0
                      ? (
                          filteredRestaurants.reduce(
                            (a, b) => a + b.rating,
                            0,
                          ) / filteredRestaurants.length
                        ).toFixed(1)
                      : "N/A"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {viewMode === "map" ? (
              /* Map View */
              <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg border border-gray-100 dark:border-zinc-800 overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Map - Ulaanbaatar
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-zinc-400 mt-1">
                      {filteredRestaurants.length} restaurants
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-medium">
                      {filteredRestaurants.filter((r) => r.isOpen).length} Open
                    </span>
                    <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-sm font-medium">
                      {filteredRestaurants.filter((r) => !r.isOpen).length}{" "}
                      Closed
                    </span>
                  </div>
                </div>

                <Map
                  userLocation={userLocation}
                  restaurants={filteredRestaurants}
                  mapCenter={mapCenter}
                  mapZoom={mapZoom}
                  onMarkerClick={handleMarkerClick}
                />
              </div>
            ) : (
              /* List View */
              <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg border border-gray-100 dark:border-zinc-800">
                <div className="p-6 border-b border-gray-100 dark:border-zinc-800">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    All Restaurants
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-zinc-400 mt-1">
                    {filteredRestaurants.length} places
                  </p>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto">
                  {filteredRestaurants.map((restaurant) => (
                    <div
                      key={restaurant.id}
                      onClick={() => handleRestaurantClick(restaurant)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${
                        selectedRestaurant?.id === restaurant.id
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-100 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:border-gray-200 dark:hover:border-zinc-600"
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 shadow-md">
                          <img
                            src={restaurant.image}
                            alt={restaurant.name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-gray-900 dark:text-white truncate">
                              {restaurant.name}
                            </h4>
                            <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded-lg">
                              <span className="text-yellow-500">⭐</span>
                              <span className="text-sm font-bold text-gray-900 dark:text-white">
                                {restaurant.rating}
                              </span>
                            </div>
                          </div>

                          <p className="text-sm text-gray-600 dark:text-zinc-400 mt-1">
                            {restaurant.cuisine}
                          </p>

                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-zinc-500">
                            <span className="flex items-center gap-1">
                              📍 {restaurant.distance} km
                            </span>
                            <span className="flex items-center gap-1">
                              💰 {restaurant.price}
                            </span>
                          </div>

                          <div className="flex items-center justify-between mt-2">
                            <div className="flex flex-wrap gap-1">
                              {restaurant.tags.slice(0, 2).map((tag) => (
                                <span
                                  key={tag}
                                  className="px-2 py-0.5 bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-zinc-300 text-xs rounded-full"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>

                            <div
                              className={`px-2 py-1 rounded-full text-xs font-bold ${
                                restaurant.isOpen
                                  ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                                  : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                              }`}
                            >
                              {restaurant.isOpen ? "Open" : "Closed"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Selected Restaurant Details */}
            {selectedRestaurant && (
              <div className="mt-6 bg-white dark:bg-zinc-900 rounded-2xl shadow-lg border border-gray-100 dark:border-zinc-800 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <img
                      src={selectedRestaurant.image}
                      alt={selectedRestaurant.name}
                      className="w-24 h-24 rounded-xl object-cover shadow-md"
                    />
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {selectedRestaurant.name}
                      </h3>
                      <p className="text-gray-600 dark:text-zinc-400">
                        {selectedRestaurant.cuisine}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-yellow-500">
                          ⭐ {selectedRestaurant.rating}
                        </span>
                        <span className="text-gray-400 dark:text-zinc-600">
                          •
                        </span>
                        <span className="text-gray-600 dark:text-zinc-400">
                          {selectedRestaurant.distance} km
                        </span>
                        <span className="text-gray-400 dark:text-zinc-600">
                          •
                        </span>
                        <span className="text-gray-600 dark:text-zinc-400">
                          {selectedRestaurant.price}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-zinc-500 mt-1">
                        📍 {selectedRestaurant.address}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedRestaurant(null)}
                    className="text-gray-400 dark:text-zinc-600 hover:text-gray-600 dark:hover:text-zinc-400 text-2xl"
                  >
                    ×
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  {selectedRestaurant.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex gap-3 mt-6">
                  <button className="flex-1 bg-blue-500 text-white py-3 px-4 rounded-xl font-bold hover:bg-blue-600 transition-all">
                    Order
                  </button>
                  <button className="flex-1 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 py-3 px-4 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-zinc-700 transition-all">
                    Call
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
