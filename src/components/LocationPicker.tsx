'use client';

import { useEffect, useRef, useState } from 'react';

interface Props {
  initialLat?: number | null;
  initialLng?: number | null;
  onChange: (lat: number, lng: number) => void;
}

export default function LocationPicker({ initialLat, initialLng, onChange }: Props) {
  const mapRef  = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !mapRef.current) return;

    let map: import('leaflet').Map;
    let marker: import('leaflet').Marker;

    (async () => {
      const L = (await import('leaflet')).default;

      // Fix default icon paths (broken in webpack/turbopack bundlers)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const defaultLat = initialLat ?? 20.5937;
      const defaultLng = initialLng ?? 78.9629; // centre of India

      map = L.map(mapRef.current!).setView([defaultLat, defaultLng], initialLat ? 15 : 5);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);

      if (initialLat && initialLng) {
        marker = L.marker([initialLat, initialLng], { draggable: true }).addTo(map);
        marker.on('dragend', () => {
          const { lat, lng } = marker.getLatLng();
          onChange(lat, lng);
        });
      }

      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        if (marker) {
          marker.setLatLng([lat, lng]);
        } else {
          marker = L.marker([lat, lng], { draggable: true }).addTo(map);
          marker.on('dragend', () => {
            const { lat: mLat, lng: mLng } = marker.getLatLng();
            onChange(mLat, mLng);
          });
        }
        onChange(lat, lng);
      });
    })();

    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (map as any)?.remove();
    };
  }, [mounted]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!mounted) {
    return <div className="h-64 rounded-xl bg-bg-muted animate-pulse" />;
  }

  return (
    <>
      {/* Load Leaflet CSS from CDN to avoid bundle issues */}
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div ref={mapRef} className="h-64 rounded-xl border border-border-light" style={{ zIndex: 0 }} />
      <p className="text-xs text-text-light mt-1">
        Click the map to pin your store location. Drag the pin to adjust.
      </p>
    </>
  );
}
