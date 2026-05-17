"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";

// Definisi tipe untuk Leaflet (tanpa any)
type LeafletMap = {
  setView: (latlng: [number, number], zoom: number) => LeafletMap;
  on: (event: string, fn: () => void) => void;
  remove: () => void;
};

type LeafletMarker = {
  addTo: (map: LeafletMap) => LeafletMarker;
  bindPopup: (html: string) => LeafletMarker;
  openPopup: () => LeafletMarker;
};

// Koordinat Ratan Bakery yang benar
const LATITUDE = -7.3942708;
const LONGITUDE = 108.6052462;
const ZOOM_LEVEL = 17;

const MapComponent = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    // Pastikan hanya berjalan di client-side
    if (typeof window === "undefined") return;

    const initMap = async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      // Perbaiki ikon marker Leaflet
      const DefaultIcon = L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });
      L.Marker.prototype.options.icon = DefaultIcon;

      if (mapRef.current && !mapInstanceRef.current) {
        const map = L.map(mapRef.current).setView([LATITUDE, LONGITUDE], ZOOM_LEVEL);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);

        // Popup HTML dengan tombol Google Maps
        const popupHtml = `
          <div class="text-center min-w-[200px]">
            <strong class="text-[#823b18] text-base">🍞 Ratan Bakery</strong><br/>
            <span class="text-xs text-gray-600">JJ44+73X, Kujangsari, Kec. Langensari</span><br/>
            <span class="text-xs text-gray-600">Kota Banjar, Jawa Barat 46324</span>
            <hr class="my-2 border-gray-200" />
            <a 
              href="https://www.google.com/maps/place/RatanBakery/@-7.3942708,108.6052462,17z/data=!4m6!3m5!1s0x2e65894d92c95221:0x890f8d9e41e1c214!8m2!3d-7.3942708!4d108.6052462!16s%2Fg%2F11h4n8wcm4?entry=ttu&g_ep=EgoyMDI2MDUxMy4wIKXMDSoASAFQAw%3D%3D" 
              target="_blank" 
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline"
            >
              📍 Buka di Google Maps →
            </a>
          </div>
        `;

        L.marker([LATITUDE, LONGITUDE] as [number, number])
          .addTo(map)
          .bindPopup(popupHtml)
          .openPopup();

        mapInstanceRef.current = map as unknown as LeafletMap;
      }
    };

    initMap();

    // Cleanup: hapus map saat komponen unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden">
      <div ref={mapRef} className="w-full h-full" style={{ minHeight: "300px" }} />
      {/* Tombol floating Google Maps */}
      <a
        href="https://www.google.com/maps/place/RatanBakery/@-7.3942708,108.6052462,17z"
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-3 right-3 z-[1000] bg-white/90 backdrop-blur-sm text-[#823b18] text-xs font-semibold px-3 py-1.5 rounded-full shadow-md hover:bg-white hover:shadow-lg transition-all flex items-center gap-1 border border-[#dac1b8]/30"
      >
        <span className="text-sm">🗺️</span> Buka Google Maps
      </a>
    </div>
  );
};

const Map = dynamic(() => Promise.resolve(MapComponent), { ssr: false });
export default Map;