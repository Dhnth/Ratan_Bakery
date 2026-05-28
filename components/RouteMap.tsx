"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface RouteMapProps {
  storeLocation: { lat: number; lng: number; address: string };
  customerLocation: { lat: number; lng: number; address: string };
  distance: number;
}

export default function RouteMap({
  storeLocation,
  customerLocation,
  distance,
}: RouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const routeLayerRef = useRef<L.Layer | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!mapRef.current) return;

    // Cleanup existing map
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }
    // Clear markers
    markersRef.current = [];

    // Create map centered between store and customer
    const bounds = L.latLngBounds(
      [storeLocation.lat, storeLocation.lng],
      [customerLocation.lat, customerLocation.lng],
    );

    const map = L.map(mapRef.current).fitBounds(bounds, { padding: [50, 50] });
    mapInstanceRef.current = map;

    const mapContainer = mapRef.current;
    if (mapContainer) {
      mapContainer.style.zIndex = "1";
    }

    // Add tile layer
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors',
        subdomains: "abcd",
        maxZoom: 19,
        minZoom: 8,
      },
    ).addTo(map);

    // Custom store icon
    const storeIcon = L.divIcon({
      html: `<div class="w-8 h-8 bg-[#823b18] text-white rounded-full flex items-center justify-center shadow-lg"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2h-5v-7H9v7H4a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></div>`,
      className: "custom-div-icon",
      iconSize: [32, 32],
      popupAnchor: [0, -16],
    });

    // Custom customer icon
    const customerIcon = L.divIcon({
      html: `<div class="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-lg"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg></div>`,
      className: "custom-div-icon",
      iconSize: [32, 32],
      popupAnchor: [0, -16],
    });

    // Add markers
    const storeMarker = L.marker([storeLocation.lat, storeLocation.lng], {
      icon: storeIcon,
    })
      .addTo(map)
      .bindPopup(
        `<strong>🍞 Ratan Bakery</strong><br/>${storeLocation.address.substring(0, 50)}...`,
      );

    const customerMarker = L.marker(
      [customerLocation.lat, customerLocation.lng],
      { icon: customerIcon },
    )
      .addTo(map)
      .bindPopup(
        `<strong>📍 Lokasi Anda</strong><br/>${customerLocation.address.substring(0, 50)}...`,
      );

    markersRef.current = [storeMarker, customerMarker];

    // Draw route line using OSRM API
    const fetchRoute = async () => {
      if (!mapInstanceRef.current) return;

      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${storeLocation.lng},${storeLocation.lat};${customerLocation.lng},${customerLocation.lat}?overview=full&geometries=geojson`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.routes && data.routes[0] && mapInstanceRef.current) {
          const route = data.routes[0];
          const geometry = route.geometry;

          // Hapus route layer lama jika ada
          if (routeLayerRef.current && mapInstanceRef.current) {
            mapInstanceRef.current.removeLayer(routeLayerRef.current);
          }

          // Gambar garis rute
          const routeLayer = L.geoJSON(geometry, {
            style: {
              color: "#823b18",
              weight: 4,
              opacity: 0.7,
            },
          }).addTo(mapInstanceRef.current);

          routeLayerRef.current = routeLayer;
        } else {
          // Fallback: garis lurus
          if (mapInstanceRef.current) {
            const straightLine = L.polyline(
              [
                [storeLocation.lat, storeLocation.lng],
                [customerLocation.lat, customerLocation.lng],
              ],
              { color: "#823b18", weight: 3, opacity: 0.7, dashArray: "8, 8" },
            ).addTo(mapInstanceRef.current);
            routeLayerRef.current = straightLine;
          }
        }
      } catch (error) {
        console.error("Error fetching route:", error);
        // Fallback: garis lurus
        if (mapInstanceRef.current) {
          try {
            const straightLine = L.polyline(
              [
                [storeLocation.lat, storeLocation.lng],
                [customerLocation.lat, customerLocation.lng],
              ],
              { color: "#823b18", weight: 3, opacity: 0.7, dashArray: "8, 8" },
            ).addTo(mapInstanceRef.current);
            routeLayerRef.current = straightLine;
          } catch (e) {
            console.error("Error adding fallback line:", e);
          }
        }
      }
    };

    fetchRoute();

    return () => {
      if (routeLayerRef.current && mapInstanceRef.current) {
        try {
          mapInstanceRef.current.removeLayer(routeLayerRef.current);
        } catch (e) {
          console.error("Error removing route layer:", e);
        }
        routeLayerRef.current = null;
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [storeLocation, customerLocation]);

  return (
    <div className="space-y-2">
      <div
        ref={mapRef}
        className="w-full h-80 rounded-xl overflow-hidden shadow-sm border border-[#dac1b8]/20"
      />
      <div className="flex justify-between items-center text-xs text-[#54433c]">
        <span>📍 Toko: {storeLocation.address.substring(0, 30)}...</span>
        <span className="font-semibold text-[#823b18]">
          Jarak: {distance} km
        </span>
      </div>
    </div>
  );
}
