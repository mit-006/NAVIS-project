import React, { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { useDemoMode } from '../demo/DemoModeContext';

const villageIcon = L.divIcon({
  className: '',
  html: `<div style="width:22px;height:22px;background:#E11D48;border:3px solid white;border-radius:50%;box-shadow:0 0 14px rgba(225,29,72,0.7);animation:pulse-demo 1.5s infinite;display:flex;align-items:center;justify-content:center"><div style="width:8px;height:8px;background:white;border-radius:50%"></div></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

const siteIcon = L.divIcon({
  className: '',
  html: `<div style="width:20px;height:20px;background:#13E83A;border:3px solid white;border-radius:50%;box-shadow:0 0 10px rgba(19,232,58,0.5);display:flex;align-items:center;justify-content:center"><div style="width:6px;height:6px;background:white;border-radius:50%"></div></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const altSiteIcon = L.divIcon({
  className: '',
  html: `<div style="width:16px;height:16px;background:#F0B01A;border:2px solid white;border-radius:50%;box-shadow:0 0 8px rgba(240,176,26,0.4)"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

export default function DemoMapOverlay() {
  const map = useMap();
  const {
    demoMode, simulating, currentStep, activeVillageIndex,
    activeSiteIndex, showRoute, showFinalPlan,
    villages, sites, routes,
  } = useDemoMode();

  const markersRef = useRef([]);
  const routeLinesRef = useRef([]);
  const animatedRouteRef = useRef(null);

  useEffect(() => {
    return () => {
      markersRef.current.forEach(m => map.removeLayer(m));
      routeLinesRef.current.forEach(l => map.removeLayer(l));
      if (animatedRouteRef.current) map.removeLayer(animatedRouteRef.current);
      markersRef.current = [];
      routeLinesRef.current = [];
      animatedRouteRef.current = null;
    };
  }, [map]);

  useEffect(() => {
    markersRef.current.forEach(m => map.removeLayer(m));
    routeLinesRef.current.forEach(l => map.removeLayer(l));
    if (animatedRouteRef.current) {
      map.removeLayer(animatedRouteRef.current);
      animatedRouteRef.current = null;
    }
    markersRef.current = [];
    routeLinesRef.current = [];

    if (!demoMode) return;

    if (currentStep >= 3 && activeVillageIndex === -1) {
      const bounds = [];
      villages.forEach(v => {
        const marker = L.marker([v.lat, v.lng], { icon: villageIcon })
          .addTo(map)
          .bindPopup(`<div style="font-family:system-ui;min-width:140px"><p style="font-weight:700;font-size:11px;color:#E11D48;margin:0">⚠️ ${v.name}</p><p style="font-size:9px;color:#64748b;margin:2px 0">SIMULATED — Pop: ${v.population.toLocaleString()}</p></div>`);
        markersRef.current.push(marker);
        bounds.push([v.lat, v.lng]);
      });
      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 13, animate: true });
      }
    }

    if (activeVillageIndex >= 0) {
      const allPts = [];

      villages.slice(0, activeVillageIndex + 1).forEach((v, i) => {
        const marker = L.marker([v.lat, v.lng], { icon: villageIcon })
          .addTo(map)
          .bindPopup(`<div style="font-family:system-ui;min-width:140px"><p style="font-weight:700;font-size:11px;color:#E11D48;margin:0">⚠️ ${v.name}</p><p style="font-size:9px;color:#64748b;margin:2px 0">SIMULATED — Pop: ${v.population.toLocaleString()}</p></div>`);
        markersRef.current.push(marker);
        allPts.push([v.lat, v.lng]);
      });

      if (activeSiteIndex >= 0) {
        sites.forEach((s, i) => {
          const icon = i === activeSiteIndex ? siteIcon : altSiteIcon;
          const marker = L.marker([s.lat, s.lng], { icon })
            .addTo(map)
            .bindPopup(`<div style="font-family:system-ui;min-width:140px"><p style="font-weight:700;font-size:11px;color:#13E83A;margin:0">🏠 ${s.name}</p><p style="font-size:9px;color:#64748b;margin:2px 0">Capacity: ${s.capacity.toLocaleString()}</p></div>`);
          markersRef.current.push(marker);
          allPts.push([s.lat, s.lng]);
        });
      }

      if (showRoute) {
        routes.forEach((route, i) => {
          if (i > activeVillageIndex) return;
          const polyline = L.polyline(route.polyline, {
            color: '#0221B7',
            weight: 4,
            opacity: 0.85,
            dashArray: '10, 8',
            className: 'demo-route-animated',
          }).addTo(map);
          polyline.bindPopup(`<div style="font-family:system-ui"><p style="font-weight:700;font-size:10px;color:#0221B7;margin:0">🛣️ SIMULATED ROUTE</p><p style="font-size:9px;color:#64748b;margin:2px 0">~${route.distanceKm} km · ~${route.travelTimeMin} min</p></div>`);
          routeLinesRef.current.push(polyline);
          allPts.push(...route.polyline);
        });
      }

      if (allPts.length > 0) {
        const bounds = L.latLngBounds(allPts);
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 13, animate: true, duration: 0.8 });
      }
    }
  }, [demoMode, currentStep, activeVillageIndex, activeSiteIndex, showRoute, showFinalPlan, villages, sites, routes, map]);

  return null;
}
