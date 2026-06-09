import "leaflet/dist/leaflet.css";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Truck, MapPin, Phone, Clock, Gauge, Cloud,
  AlertTriangle, CheckCircle2, Circle, Loader2, Search, Navigation, RefreshCw,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGetTracking, useListActiveTracking } from "@workspace/api-client-react";
import { getGetTrackingQueryKey, getListActiveTrackingQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

/* ─── Leaflet icon fix (Vite strips asset URLs) ─── */
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

/* ─── Custom icons ─── */
const truckIcon = L.divIcon({
  className: "",
  html: `
    <div style="
      width:48px;height:48px;
      background:linear-gradient(135deg,#ff6400,#ff8c00);
      border-radius:50%;
      border:3px solid rgba(255,255,255,0.3);
      display:flex;align-items:center;justify-content:center;
      font-size:22px;
      box-shadow:0 0 0 8px rgba(255,100,0,0.2),0 4px 12px rgba(0,0,0,0.5);
      animation:pulse 2s infinite;
    ">🚛</div>
    <style>
      @keyframes pulse {
        0%,100%{box-shadow:0 0 0 8px rgba(255,100,0,0.2),0 4px 12px rgba(0,0,0,0.5)}
        50%{box-shadow:0 0 0 16px rgba(255,100,0,0.05),0 4px 12px rgba(0,0,0,0.5)}
      }
    </style>`,
  iconSize: [48, 48],
  iconAnchor: [24, 24],
  popupAnchor: [0, -28],
});

const pickupIcon = L.divIcon({
  className: "",
  html: `<div style="
    width:32px;height:32px;background:#22c55e;border-radius:50% 50% 50% 0;
    transform:rotate(-45deg);border:3px solid white;
    box-shadow:0 3px 10px rgba(0,0,0,0.4);
  "></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -34],
});

const destIcon = L.divIcon({
  className: "",
  html: `<div style="
    width:32px;height:32px;background:#ff6400;border-radius:50% 50% 50% 0;
    transform:rotate(-45deg);border:3px solid white;
    box-shadow:0 3px 10px rgba(0,0,0,0.4);
  "></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -34],
});

/* ─── Component to fly map to truck position ─── */
function MapController({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      map.setView([lat, lng], 13);
      firstRun.current = false;
    } else {
      map.panTo([lat, lng], { animate: true, duration: 1.5 });
    }
  }, [lat, lng, map]);
  return null;
}

/* ─── Status list ─── */
const STATUSES = [
  { key: "confirmed", label: "Booking Confirmed" },
  { key: "crew_assigned", label: "Crew Assigned" },
  { key: "loading", label: "Vehicle Loading" },
  { key: "on_route", label: "On Route" },
  { key: "arriving", label: "Arriving Soon" },
  { key: "completed", label: "Delivery Complete" },
];

/* ─── Geocode an address via Nominatim ─── */
async function geocode(address: string): Promise<[number, number] | null> {
  try {
    const params = new URLSearchParams({
      q: address,
      format: "json",
      countrycodes: "at",
      limit: "1",
    });
    const r = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      headers: { "User-Agent": "Carryfox.at/1.0" },
    });
    const data = await r.json();
    if (data[0]) return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
  } catch {}
  return null;
}

/* ─── Main component ─── */
export default function Track() {
  const [bookingId, setBookingId] = useState<number | null>(null);
  const [inputVal, setInputVal] = useState("");
  const queryClient = useQueryClient();
  const [pickupCoords, setPickupCoords] = useState<[number, number] | null>(null);
  const [destCoords, setDestCoords] = useState<[number, number] | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const { data: activeShipments } = useListActiveTracking();

  const { data: tracking, isLoading, error, refetch } = useGetTracking(
    bookingId ?? 0,
    {
      query: {
        enabled: !!bookingId,
        queryKey: getGetTrackingQueryKey(bookingId ?? 0),
        refetchInterval: 6000,
      },
    }
  );

  /* Live refresh ticker */
  useEffect(() => {
    if (!tracking) return;
    const t = setInterval(() => {
      refetch();
      queryClient.invalidateQueries({ queryKey: getListActiveTrackingQueryKey() });
      setLastRefresh(new Date());
    }, 6000);
    return () => clearInterval(t);
  }, [tracking, refetch, queryClient]);

  /* Geocode addresses when tracking loads */
  useEffect(() => {
    if (!tracking) return;
    setPickupCoords(null);
    setDestCoords(null);
    geocode(tracking.pickupAddress).then(c => c && setPickupCoords(c));
    geocode(tracking.destinationAddress).then(c => c && setDestCoords(c));
  }, [tracking?.pickupAddress, tracking?.destinationAddress]);

  const handleSearch = useCallback(() => {
    const id = parseInt(inputVal.trim(), 10);
    if (!isNaN(id) && id > 0) setBookingId(id);
  }, [inputVal]);

  const handleSelectShipment = useCallback((id: number) => {
    setBookingId(id);
    setInputVal(String(id));
  }, []);

  const currentStatusIdx = STATUSES.findIndex(s => s.key === tracking?.status);
  const truckPos: [number, number] | null = tracking
    ? [tracking.currentLat, tracking.currentLng]
    : null;

  /* Polyline: pickup → truck → dest (only include resolved coords) */
  const routeLine: [number, number][] = [
    pickupCoords,
    truckPos,
    destCoords,
  ].filter(Boolean) as [number, number][];

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ── */}
      <div className="py-10 px-4 md:px-6 border-b border-white/10">
        <div className="container mx-auto max-w-7xl">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm text-primary mb-4">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              REAL-TIME TRACKING
            </div>
            <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter text-white mb-3">
              Track Your<br /><span className="text-primary">Shipment.</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl">
              Live vehicle position updated every 6 seconds. Enter your booking ID or click an active shipment below.
            </p>
          </motion.div>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex gap-3 mt-6 max-w-md"
          >
            <Input
              placeholder="Booking ID (e.g. 1)"
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              className="h-12 text-base border-white/20 bg-card"
              data-testid="input-booking-id"
            />
            <Button className="h-12 px-5" onClick={handleSearch} data-testid="button-track-search">
              <Search className="h-5 w-5" />
            </Button>
          </motion.div>

          {/* Active shipments */}
          {activeShipments && activeShipments.length > 0 && (
            <div className="mt-4 flex gap-2 flex-wrap">
              {activeShipments.map(s => (
                <button
                  key={s.bookingId}
                  onClick={() => handleSelectShipment(s.bookingId)}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-all ${
                    bookingId === s.bookingId
                      ? "border-primary bg-primary/20 text-primary"
                      : "border-primary/20 bg-primary/5 text-primary/70 hover:bg-primary/15 hover:text-primary"
                  }`}
                  data-testid={`button-active-shipment-${s.bookingId}`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                  #{s.bookingId} · {s.status.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="px-4 md:px-6 py-8">
        <div className="container mx-auto max-w-7xl">

          {isLoading && (
            <div className="flex items-center justify-center gap-3 py-32 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              Fetching tracking data…
            </div>
          )}

          {error && !isLoading && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-8 text-center text-destructive">
              Booking not found. Check your booking ID.
            </div>
          )}

          {!bookingId && !isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-24 text-center border border-white/10 rounded-2xl bg-card/40"
            >
              <Truck className="h-20 w-20 text-primary/20 mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">Select an active shipment above or enter a booking ID to start tracking.</p>
            </motion.div>
          )}

          {tracking && truckPos && (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 xl:grid-cols-3 gap-6"
              >
                {/* ── Left: Map + Progress + Timeline ── */}
                <div className="xl:col-span-2 space-y-5">

                  {/* Map */}
                  <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl" style={{ height: 420 }}>
                    <MapContainer
                      center={truckPos}
                      zoom={12}
                      style={{ height: "100%", width: "100%" }}
                      zoomControl={true}
                      attributionControl={false}
                    >
                      {/* Dark tile layer */}
                      <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        subdomains="abcd"
                        maxZoom={20}
                      />

                      {/* Auto-pan to truck */}
                      <MapController lat={truckPos[0]} lng={truckPos[1]} />

                      {/* Route polyline */}
                      {routeLine.length >= 2 && (
                        <>
                          {/* Background glow */}
                          <Polyline
                            positions={routeLine}
                            pathOptions={{ color: "#ff6400", weight: 8, opacity: 0.15 }}
                          />
                          {/* Main line */}
                          <Polyline
                            positions={routeLine}
                            pathOptions={{
                              color: "#ff6400",
                              weight: 3,
                              opacity: 0.9,
                              dashArray: tracking.status === "on_route" || tracking.status === "arriving" ? undefined : "8 6",
                            }}
                          />
                        </>
                      )}

                      {/* Pickup marker */}
                      {pickupCoords && (
                        <Marker position={pickupCoords} icon={pickupIcon}>
                          <Popup className="dark-popup">
                            <div className="text-sm font-semibold">📦 Pickup</div>
                            <div className="text-xs text-gray-600 mt-0.5">{tracking.pickupAddress}</div>
                          </Popup>
                        </Marker>
                      )}

                      {/* Destination marker */}
                      {destCoords && (
                        <Marker position={destCoords} icon={destIcon}>
                          <Popup>
                            <div className="text-sm font-semibold">🏁 Destination</div>
                            <div className="text-xs text-gray-600 mt-0.5">{tracking.destinationAddress}</div>
                          </Popup>
                        </Marker>
                      )}

                      {/* Truck marker */}
                      <Marker position={truckPos} icon={truckIcon}>
                        <Popup>
                          <div className="text-sm font-semibold">🚛 {tracking.driverName}</div>
                          <div className="text-xs text-gray-600">{tracking.vehiclePlate} · {tracking.currentSpeed} km/h</div>
                        </Popup>
                      </Marker>
                    </MapContainer>
                  </div>

                  {/* Map legend + refresh indicator */}
                  <div className="flex items-center justify-between flex-wrap gap-3 text-xs text-muted-foreground px-1">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1.5">
                        <span className="h-3 w-3 rounded-full bg-green-500" /> Pickup
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="h-3 w-3 rounded-full bg-primary" /> Destination
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="h-3 w-3 rounded-full bg-primary animate-pulse" /> Live Truck
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <RefreshCw className="h-3 w-3 animate-spin text-primary/50" />
                      Updated {lastRefresh.toLocaleTimeString()}
                    </div>
                  </div>

                  {/* Route Progress Bar */}
                  <div className="rounded-xl border border-white/10 bg-card p-5">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm uppercase tracking-wider text-muted-foreground font-medium">Route Progress</span>
                      <span className="text-3xl font-black text-primary">{tracking.routeProgress}%</span>
                    </div>
                    <div className="h-3 rounded-full bg-white/10 overflow-hidden mb-3">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-primary via-orange-400 to-yellow-400"
                        initial={{ width: 0 }}
                        animate={{ width: `${tracking.routeProgress}%` }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                      />
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="h-2 w-2 rounded-full bg-green-500 shrink-0" />
                        <span className="text-xs text-muted-foreground truncate">{tracking.pickupAddress}</span>
                      </div>
                      <div className="flex items-center gap-2 min-w-0 text-right">
                        <span className="text-xs text-muted-foreground truncate">{tracking.destinationAddress}</span>
                        <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                      </div>
                    </div>
                  </div>

                  {/* Status Timeline */}
                  <div className="rounded-xl border border-white/10 bg-card p-6">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-5">Status Timeline</h3>
                    <div className="relative">
                      {/* Vertical line */}
                      <div className="absolute left-[15px] top-0 bottom-0 w-px bg-white/10" />
                      <div className="space-y-5">
                        {STATUSES.map((s, i) => {
                          const done = i < currentStatusIdx;
                          const active = i === currentStatusIdx;
                          const pending = i > currentStatusIdx;
                          return (
                            <motion.div
                              key={s.key}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.07 }}
                              className="flex items-center gap-4 relative"
                              data-testid={`status-step-${s.key}`}
                            >
                              <div className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 shrink-0 transition-all ${
                                active ? "border-primary bg-primary shadow-[0_0_12px_rgba(255,100,0,0.5)]"
                                : done ? "border-primary/50 bg-primary/10"
                                : "border-white/15 bg-background"
                              }`}>
                                {done ? <CheckCircle2 className="h-4 w-4 text-primary" /> :
                                 active ? <span className="h-2.5 w-2.5 rounded-full bg-white animate-pulse" /> :
                                 <Circle className="h-4 w-4 text-white/15" />}
                              </div>
                              <div className="flex-1">
                                <span className={`text-sm font-semibold ${
                                  active ? "text-white" : done ? "text-white/60" : "text-white/25"
                                }`}>
                                  {s.label}
                                </span>
                              </div>
                              {active && (
                                <span className="flex items-center gap-1.5 text-xs text-primary font-bold uppercase tracking-wider">
                                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-ping" />
                                  Live
                                </span>
                              )}
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Right: Driver + Live Metrics ── */}
                <div className="space-y-4">

                  {/* Driver Card */}
                  <div className="rounded-xl border border-white/10 bg-card p-5">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Your Driver</p>
                    <div className="flex items-center gap-4 mb-5">
                      <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary/40 to-primary/10 border-2 border-primary/40 flex items-center justify-center text-primary font-black text-2xl">
                        {tracking.driverName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-white text-lg leading-tight">{tracking.driverName}</p>
                        <p className="text-sm text-muted-foreground">{tracking.vehiclePlate}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          {"★★★★★".split("").map((_, i) => (
                            <span key={i} className="text-xs text-yellow-400">★</span>
                          ))}
                          <span className="text-xs text-muted-foreground ml-1">4.9</span>
                        </div>
                      </div>
                    </div>
                    <a href={`tel:${tracking.driverPhone}`}>
                      <Button variant="outline" className="w-full border-white/20 hover:bg-white/5 hover:border-white/40 h-11" data-testid="button-call-driver">
                        <Phone className="h-4 w-4 mr-2 text-primary" />
                        {tracking.driverPhone}
                      </Button>
                    </a>
                  </div>

                  {/* Live Metrics 2x2 */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: <Clock className="h-5 w-5" />, label: "ETA", value: new Date(tracking.estimatedArrival).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
                      { icon: <Navigation className="h-5 w-5" />, label: "Distance", value: `${tracking.distanceRemaining} km` },
                      { icon: <Gauge className="h-5 w-5" />, label: "Speed", value: `${tracking.currentSpeed} km/h` },
                      { icon: <Cloud className="h-5 w-5" />, label: "Weather", value: tracking.weatherCondition },
                    ].map(m => (
                      <div key={m.label} className="rounded-xl border border-white/10 bg-card p-4">
                        <div className="text-primary mb-2">{m.icon}</div>
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{m.label}</p>
                        <p className="font-bold text-white text-sm mt-0.5">{m.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Traffic Alert */}
                  <AnimatePresence>
                    {tracking.hasTrafficDelay && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 flex items-start gap-3"
                      >
                        <AlertTriangle className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-yellow-300">Traffic Delay</p>
                          <p className="text-xs text-yellow-400/70 mt-0.5">ETA has been adjusted due to congestion on the route.</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Booking info */}
                  <div className="rounded-xl border border-white/10 bg-card p-4 space-y-3">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">Booking #{bookingId}</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-500 mt-1.5 shrink-0" />
                        <p className="text-white/70 text-xs leading-relaxed">{tracking.pickupAddress}</p>
                      </div>
                      <div className="ml-1 w-px h-3 bg-white/15" />
                      <div className="flex items-start gap-2">
                        <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                        <p className="text-white/70 text-xs leading-relaxed">{tracking.destinationAddress}</p>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground border-t border-white/10 pt-3">
                      Live update · {lastRefresh.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
