import "leaflet/dist/leaflet.css";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Truck, MapPin, Phone, Clock, Gauge, Cloud,
  AlertTriangle, CheckCircle2, Circle, Loader2, Search, Navigation, RefreshCw, Mail,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGetTracking, useListActiveTracking, useLookupBookings } from "@workspace/api-client-react";
import { getGetTrackingQueryKey, getListActiveTrackingQueryKey, getLookupBookingsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useT } from "@/lib/i18n";

/* ─── Leaflet icon fix ─── */
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

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
      animation:truck-pulse 2s infinite;
    ">🚛</div>
    <style>
      @keyframes truck-pulse {
        0%,100%{box-shadow:0 0 0 8px rgba(255,100,0,0.2),0 4px 12px rgba(0,0,0,0.5)}
        50%{box-shadow:0 0 0 16px rgba(255,100,0,0.05),0 4px 12px rgba(0,0,0,0.5)}
      }
    </style>`,
  iconSize:    [48, 48],
  iconAnchor:  [24, 24],
  popupAnchor: [0, -28],
});

const pickupIcon = L.divIcon({
  className: "",
  html: `<div style="
    width:32px;height:32px;background:#22c55e;border-radius:50% 50% 50% 0;
    transform:rotate(-45deg);border:3px solid white;
    box-shadow:0 3px 10px rgba(0,0,0,0.4);
  "></div>`,
  iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -34],
});

const destIcon = L.divIcon({
  className: "",
  html: `<div style="
    width:32px;height:32px;background:#ff6400;border-radius:50% 50% 50% 0;
    transform:rotate(-45deg);border:3px solid white;
    box-shadow:0 3px 10px rgba(0,0,0,0.4);
  "></div>`,
  iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -34],
});

function FitBounds({ points, triggerKey }: { points: [number, number][]; triggerKey: string }) {
  const map = useMap();
  const lastKey = useRef<string | null>(null);
  useEffect(() => {
    if (points.length === 0) return;
    // Fit once per booking/route change — jittered truck updates must not
    // keep re-zooming the map.
    if (lastKey.current === triggerKey) return;
    lastKey.current = triggerKey;
    if (points.length === 1) {
      map.setView(points[0], 13);
    } else {
      map.fitBounds(L.latLngBounds(points), { padding: [60, 60], maxZoom: 15 });
    }
  }, [points, triggerKey, map]);
  return null;
}

const STATUS_KEYS = ["confirmed", "crew_assigned", "loading", "on_route", "arriving", "completed"];

async function geocode(address: string): Promise<[number, number] | null> {
  try {
    // No country restriction: manually entered addresses may be anywhere.
    const params = new URLSearchParams({ q: address, format: "json", limit: "1" });
    const r = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      headers: { "User-Agent": "Carryfox.at/1.0" },
    });
    const data = await r.json();
    if (data[0]) return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
  } catch {}
  return null;
}

export default function Track() {
  const [bookingId, setBookingId]     = useState<number | null>(null);
  const [inputVal, setInputVal]       = useState("");
  const queryClient                   = useQueryClient();
  const [pickupCoords, setPickupCoords] = useState<[number, number] | null>(null);
  const [destCoords, setDestCoords]   = useState<[number, number] | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  // "Find my booking" recovery — lookup by the email + phone used at booking.
  const [showLookup, setShowLookup]   = useState(false);
  const [lookupEmail, setLookupEmail] = useState("");
  const [lookupPhone, setLookupPhone] = useState("");
  const [lookupQuery, setLookupQuery] = useState<{ email: string; phone: string } | null>(null);
  const { t }    = useT();
  const tr = t.track;

  // Deep link: /track?id=42 (from the booking success screen) auto-loads.
  useEffect(() => {
    const idParam = new URLSearchParams(window.location.search).get("id");
    if (!idParam) return;
    const id = parseInt(idParam, 10);
    if (!isNaN(id) && id > 0) {
      setBookingId(id);
      setInputVal(String(id));
    }
  }, []);

  const STATUSES = STATUS_KEYS.map((key, i) => ({ key, label: tr.statusLabels[i] }));

  const { data: activeShipments }                              = useListActiveTracking();
  const { data: tracking, isLoading, error, refetch } = useGetTracking(
    bookingId ?? 0,
    { query: { enabled: !!bookingId, queryKey: getGetTrackingQueryKey(bookingId ?? 0), refetchInterval: 6000 } }
  );
  const lookupParams = {
    email: lookupQuery?.email || undefined,
    phone: lookupQuery?.phone || undefined,
  };
  const { data: lookupResults, isFetching: lookupFetching, error: lookupError } = useLookupBookings(
    lookupParams,
    { query: { enabled: !!lookupQuery, queryKey: getLookupBookingsQueryKey(lookupParams) } },
  );

  useEffect(() => {
    if (!tracking) return;
    const interval = setInterval(() => {
      refetch();
      queryClient.invalidateQueries({ queryKey: getListActiveTrackingQueryKey() });
      setLastRefresh(new Date());
    }, 6000);
    return () => clearInterval(interval);
  }, [tracking, refetch, queryClient]);

  // Prefer coordinates stored at booking time (instant, no external service);
  // fall back to Nominatim geocoding for manual/admin-entered addresses.
  useEffect(() => {
    if (!tracking) return;
    setPickupCoords(null);
    setDestCoords(null);
    if (tracking.pickupLat != null && tracking.pickupLng != null) {
      setPickupCoords([tracking.pickupLat, tracking.pickupLng]);
    } else {
      geocode(tracking.pickupAddress).then(c => c && setPickupCoords(c));
    }
    if (tracking.destinationLat != null && tracking.destinationLng != null) {
      setDestCoords([tracking.destinationLat, tracking.destinationLng]);
    } else {
      geocode(tracking.destinationAddress).then(c => c && setDestCoords(c));
    }
  }, [tracking?.pickupAddress, tracking?.destinationAddress, tracking?.pickupLat, tracking?.pickupLng, tracking?.destinationLat, tracking?.destinationLng]);

  const handleSearch = useCallback(() => {
    const id = parseInt(inputVal.trim(), 10);
    if (!isNaN(id) && id > 0) setBookingId(id);
  }, [inputVal]);

  const handleSelectShipment = useCallback((id: number) => {
    setBookingId(id);
    setInputVal(String(id));
  }, []);

  const handleLookup = useCallback(() => {
    const email = lookupEmail.trim();
    const phone = lookupPhone.trim();
    // Either field is enough — search by email, phone, or both.
    if (email || phone) setLookupQuery({ email, phone });
  }, [lookupEmail, lookupPhone]);

  const lookupReady = lookupEmail.trim().length > 0 || lookupPhone.trim().length > 0;

  const currentStatusIdx = STATUSES.findIndex(s => s.key === tracking?.status);
  // Truck display position: prefer the server's (interpolated along stored
  // route coords). Bookings saved before coordinates existed fall back to
  // client-side interpolation between the geocoded endpoints so the truck
  // still sits on the route instead of at a default city centre.
  const truckPos: [number, number] | null = (() => {
    if (!tracking) return null;
    const serverHasRoute = tracking.pickupLat != null && tracking.destinationLat != null;
    if (!serverHasRoute && pickupCoords && destCoords) {
      const t = Math.min(1, Math.max(0, tracking.routeProgress / 100));
      return [
        pickupCoords[0] + (destCoords[0] - pickupCoords[0]) * t + (Math.random() - 0.5) * 0.002,
        pickupCoords[1] + (destCoords[1] - pickupCoords[1]) * t + (Math.random() - 0.5) * 0.002,
      ];
    }
    return [tracking.currentLat, tracking.currentLng];
  })();
  const routeLine: [number, number][] = [pickupCoords, truckPos, destCoords].filter(Boolean) as [number, number][];
  const fitTrigger = `${tracking?.bookingId ?? "none"}:${pickupCoords ? 1 : 0}${destCoords ? 1 : 0}`;

  // Keyless raster tiles — CARTO's basemap CDN now requires an API key and
  // returns an "API KEY REQUIRED" placeholder tile without one. OSM's standard
  // tile server works keyless (fine for dev/testing under their usage policy).
  const mapTile = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

  return (
    <div className="min-h-screen bg-background">

      {/* ── Header ── */}
      <div className="py-10 px-4 md:px-6 border-b border-border">
        <div className="container mx-auto max-w-7xl">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm text-primary mb-4">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              {tr.badge}
            </div>
            <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter text-foreground mb-3">
              {tr.h1a}<br /><span className="text-primary">{tr.h1b}</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl">{tr.sub}</p>
          </motion.div>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex gap-3 mt-6 max-w-md"
          >
            <Input
              placeholder={tr.searchPlaceholder}
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              className="h-12 text-base border-border bg-card"
              data-testid="input-booking-id"
            />
            <Button className="h-12 px-5" onClick={handleSearch} data-testid="button-track-search">
              <Search className="h-5 w-5" />
            </Button>
          </motion.div>

          {/* Lost your reference? Recover it with booking details */}
          <div className="mt-3 max-w-md">
            <button
              type="button"
              onClick={() => setShowLookup(v => !v)}
              className="text-xs text-primary hover:underline"
              data-testid="button-toggle-lookup"
            >
              {showLookup ? "Hide lookup" : "Lost your reference? Find it with your email or phone"}
            </button>
            {showLookup && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 rounded-xl border border-border bg-card p-4 space-y-3"
              >
                <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" /> Find my booking
                </div>
                <Input
                  type="email"
                  placeholder="Email you booked with (optional)"
                  value={lookupEmail}
                  onChange={e => setLookupEmail(e.target.value)}
                  className="h-10 border-border bg-background"
                  data-testid="input-lookup-email"
                />
                <Input
                  type="tel"
                  placeholder="Phone you booked with (optional)"
                  value={lookupPhone}
                  onChange={e => setLookupPhone(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleLookup()}
                  className="h-10 border-border bg-background"
                  data-testid="input-lookup-phone"
                />
                <Button className="w-full h-10" onClick={handleLookup} disabled={lookupFetching || !lookupReady} data-testid="button-lookup-search">
                  {lookupFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Search className="h-4 w-4 mr-2" /> Find my bookings</>}
                </Button>
                {!lookupReady && (
                  <p className="text-[11px] text-muted-foreground">Enter your email or phone — whichever you still have — to search.</p>
                )}
                {lookupError && (
                  <p className="text-xs text-destructive">Lookup failed — please try again.</p>
                )}
                {!lookupFetching && lookupResults && lookupResults.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No bookings found. Check the details match what you entered when booking.
                  </p>
                )}
                {lookupResults && lookupResults.length > 0 && (
                  <div className="space-y-2">
                    {lookupResults.map(r => (
                      <button
                        key={r.bookingId}
                        onClick={() => handleSelectShipment(r.bookingId)}
                        className="w-full text-left rounded-lg border border-primary/30 bg-primary/5 p-3 transition-colors hover:bg-primary/10"
                        data-testid={`button-lookup-result-${r.bookingId}`}
                      >
                        <div className="flex justify-between items-center gap-2">
                          <span className="font-bold text-primary">#{r.bookingId}</span>
                          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{r.status.replace(/_/g, " ")}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 truncate">{r.pickupAddress} → {r.destinationAddress}</p>
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Active shipments chips */}
          {activeShipments && activeShipments.length > 0 && (
            <div className="mt-4">
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">{tr.activeLabel}</p>
              <div className="flex gap-2 flex-wrap">
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
              {tr.loading}
            </div>
          )}

          {error && !isLoading && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-8 text-center text-destructive space-y-2">
              <p>Booking not found. Please check your booking reference.</p>
              <button
                type="button"
                onClick={() => setShowLookup(true)}
                className="text-sm underline text-destructive/80 hover:text-destructive"
                data-testid="button-error-open-lookup"
              >
                Lost your reference? Find it with your email or phone
              </button>
            </div>
          )}

          {!bookingId && !isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-24 text-center border border-border rounded-2xl bg-card/50"
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <Truck className="h-20 w-20 text-primary/25 mx-auto mb-4" />
              </motion.div>
              <p className="text-foreground text-xl font-bold mb-2">{tr.noBooking}</p>
              <p className="text-muted-foreground text-sm mb-6">
                Enter your booking reference above — or use the email or phone finder if you've lost it.
              </p>
              {activeShipments && activeShipments.length > 0 && (
                <div className="flex gap-2 flex-wrap justify-center">
                  {activeShipments.slice(0, 3).map(s => (
                    <button
                      key={s.bookingId}
                      onClick={() => handleSelectShipment(s.bookingId)}
                      className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-2 text-sm text-primary font-semibold transition-all hover:bg-primary/20"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                      Track #{s.bookingId}
                    </button>
                  ))}
                </div>
              )}
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
                  <div className="rounded-2xl overflow-hidden border border-border shadow-lg" style={{ height: 420 }}>
                    <MapContainer
                      center={truckPos}
                      zoom={12}
                      style={{ height: "100%", width: "100%" }}
                      zoomControl={true}
                      attributionControl={true}
                    >
                      <TileLayer
                        url={mapTile}
                        maxZoom={19}
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      />
                      <FitBounds points={routeLine} triggerKey={fitTrigger} />
                      {routeLine.length >= 2 && (
                        <>
                          <Polyline positions={routeLine} pathOptions={{ color: "#ff6400", weight: 8, opacity: 0.15 }} />
                          <Polyline
                            positions={routeLine}
                            pathOptions={{
                              color: "#ff6400", weight: 3, opacity: 0.9,
                              dashArray: tracking.status === "on_route" || tracking.status === "arriving" ? undefined : "8 6",
                            }}
                          />
                        </>
                      )}
                      {pickupCoords && (
                        <Marker position={pickupCoords} icon={pickupIcon}>
                          <Popup>
                            <div className="text-sm font-semibold">📦 {tr.mapLegend.pickup}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">{tracking.pickupAddress}</div>
                          </Popup>
                        </Marker>
                      )}
                      {destCoords && (
                        <Marker position={destCoords} icon={destIcon}>
                          <Popup>
                            <div className="text-sm font-semibold">🏁 {tr.mapLegend.destination}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">{tracking.destinationAddress}</div>
                          </Popup>
                        </Marker>
                      )}
                      <Marker position={truckPos} icon={truckIcon}>
                        <Popup>
                          <div className="text-sm font-semibold">🚛 {tracking.driverName}</div>
                          <div className="text-xs text-muted-foreground">{tracking.vehiclePlate} · {tracking.currentSpeed} km/h</div>
                        </Popup>
                      </Marker>
                    </MapContainer>
                  </div>

                  {/* Map legend + refresh */}
                  <div className="flex items-center justify-between flex-wrap gap-3 text-xs text-muted-foreground px-1">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-green-500" /> {tr.mapLegend.pickup}</span>
                      <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-primary" /> {tr.mapLegend.destination}</span>
                      <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-primary animate-pulse" /> {tr.mapLegend.truck}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <RefreshCw className="h-3 w-3 animate-spin text-primary/50" />
                      {tr.liveUpdate} {lastRefresh.toLocaleTimeString()}
                    </div>
                  </div>

                  {/* Route Progress Bar */}
                  <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm uppercase tracking-wider text-muted-foreground font-medium">{tr.progress}</span>
                      <span className="text-3xl font-black text-primary">{tracking.routeProgress}%</span>
                    </div>
                    <div className="h-3 rounded-full bg-muted overflow-hidden mb-3">
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
                  <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-5">{tr.timeline}</h3>
                    <div className="relative">
                      <div className="absolute left-[15px] top-0 bottom-0 w-px bg-border" />
                      <div className="space-y-5">
                        {STATUSES.map((s, i) => {
                          const done   = i < currentStatusIdx;
                          const active = i === currentStatusIdx;
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
                                : "border-border bg-background"
                              }`}>
                                {done   ? <CheckCircle2 className="h-4 w-4 text-primary" /> :
                                 active ? <span className="h-2.5 w-2.5 rounded-full bg-white animate-pulse" /> :
                                          <Circle className="h-4 w-4 text-muted-foreground/40" />}
                              </div>
                              <div className="flex-1">
                                <span className={`text-sm font-semibold ${active ? "text-foreground" : done ? "text-foreground/60" : "text-muted-foreground/40"}`}>
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
                  <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4">{tr.driver}</p>
                    <div className="flex items-center gap-4 mb-5">
                      <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary/40 to-primary/10 border-2 border-primary/40 flex items-center justify-center text-primary font-black text-2xl">
                        {tracking.driverName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-foreground text-lg leading-tight">{tracking.driverName}</p>
                        <p className="text-sm text-muted-foreground">{tracking.vehiclePlate}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          {"★★★★★".split("").map((_, i) => <span key={i} className="text-xs text-yellow-400">★</span>)}
                          <span className="text-xs text-muted-foreground ml-1">4.9</span>
                        </div>
                      </div>
                    </div>
                    <a href={`tel:${tracking.driverPhone}`}>
                      <Button variant="outline" className="w-full border-border hover:bg-muted h-11" data-testid="button-call-driver">
                        <Phone className="h-4 w-4 mr-2 text-primary" />
                        {tracking.driverPhone}
                      </Button>
                    </a>
                  </div>

                  {/* Live Metrics 2×2 */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: <Clock      className="h-5 w-5" />, label: tr.metrics.eta,      value: new Date(tracking.estimatedArrival).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
                      { icon: <Navigation className="h-5 w-5" />, label: tr.metrics.distance,  value: `${tracking.distanceRemaining} km` },
                      { icon: <Gauge      className="h-5 w-5" />, label: tr.metrics.speed,     value: `${tracking.currentSpeed} km/h` },
                      { icon: <Cloud      className="h-5 w-5" />, label: tr.metrics.weather,   value: tracking.weatherCondition },
                    ].map(m => (
                      <div key={m.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                        <div className="text-primary mb-2">{m.icon}</div>
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{m.label}</p>
                        <p className="font-bold text-foreground text-sm mt-0.5">{m.value}</p>
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
                        <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-yellow-600 dark:text-yellow-300">{tr.trafficTitle}</p>
                          <p className="text-xs text-yellow-600/70 dark:text-yellow-400/70 mt-0.5">{tr.trafficSub}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Booking Info */}
                  <div className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-sm">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">{tr.bookingRef} #{bookingId}</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                        <span className="text-muted-foreground text-xs">{tracking.pickupAddress}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span className="text-muted-foreground text-xs">{tracking.destinationAddress}</span>
                      </div>
                    </div>
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
