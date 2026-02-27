"use client";

import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default icon issue with react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

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

interface MapProps {
  userLocation: UserLocation | null;
  restaurants: Restaurant[];
  mapCenter: [number, number];
  mapZoom: number;
  onMarkerClick: (restaurant: Restaurant) => void;
}

// Component to update map view when props change
function MapUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  
  return null;
}

export default function Map({ userLocation, restaurants, mapCenter, mapZoom, onMarkerClick }: MapProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <div className="h-[600px] w-full bg-gray-100 flex items-center justify-center">Loading map...</div>;
  }

  return (
    <div className="h-[600px] w-full rounded-xl overflow-hidden">
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        scrollWheelZoom={true}
      >
        <MapUpdater center={mapCenter} zoom={mapZoom} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* User Location Marker */}
        {userLocation && (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
          >
            <Popup>
              <div className="p-2 text-center">
                <p className="font-bold text-blue-600">📍 Your Location</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Restaurant Markers */}
        {restaurants.map((restaurant) => (
          <Marker
            key={restaurant.id}
            position={restaurant.coordinates}
            eventHandlers={{
              click: () => onMarkerClick(restaurant)
            }}
          >
            <Popup>
              <div className="p-2 min-w-[200px]">
                <div className="flex items-center gap-2 mb-2">
                  <img
                    src={restaurant.image}
                    alt={restaurant.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div>
                    <h4 className="font-bold text-gray-900">{restaurant.name}</h4>
                    <p className="text-sm text-gray-600">{restaurant.cuisine}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-yellow-500">⭐ {restaurant.rating}</span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-600">{restaurant.distance} km</span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-600">{restaurant.price}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{restaurant.address}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {restaurant.tags.slice(0, 2).map(tag => (
                    <span key={tag} className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
