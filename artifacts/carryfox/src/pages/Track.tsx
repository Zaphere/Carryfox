import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Truck, MapPin, Phone, Clock, Gauge, Cloud, AlertTriangle, CheckCircle2, Circle, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGetTracking, useListActiveTracking } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetTrackingQueryKey, getListActiveTrackingQueryKey } from "@workspace/api-client-react";

const STATUSES = [
  { key: "confirmed", label: "Booking Confirmed" },
  { key: "crew_assigned", label: "Crew Assigned" },
  { key: "loading", label: "Vehicle Loading" },
  { key: "on_route", label: "On Route" },
  { key: "arriving", label: "Arriving Soon" },
  { key: "completed", label: "Delivery Complete" },
];

const AUSTRIAN_CITIES = [
  { name: "Vienna", x: 78, y: 38 },
  { name: "Graz", x: 65, y: 65 },
  { name: "Salzburg", x: 35, y: 42 },
  { name: "Linz", x: 48, y: 28 },
  { name: "Innsbruck", x: 18, y: 55 },
];

function AustriaMap({ lat, lng, status }: { lat: number; lng: number; status: string }) {
  const [truckPos, setTruckPos] = useState({ x: 65, y: 38 });
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const latRange = { min: 46.4, max: 49.0 };
    const lngRange = { min: 9.5, max: 17.2 };
    const x = ((lng - lngRange.min) / (lngRange.max - lngRange.min)) * 100;
    const y = ((latRange.max - lat) / (latRange.max - latRange.min)) * 100;
    setTruckPos({ x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) });
    return () => cancelAnimationFrame(frameRef.current);
  }, [lat, lng]);

  return (
    <div className="relative w-full aspect-[2/1] rounded-xl border border-white/10 bg-card overflow-hidden">
      <svg viewBox="0 0 100 60" className="w-full h-full">
        {/* Austria outline - simplified */}
        <path
          d="M 8 35 Q 12 20 20 18 L 32 15 Q 38 12 45 14 L 55 12 Q 65 10 72 14 L 82 16 Q 90 20 94 28 L 96 35 Q 94 45 88 48 L 78 52 Q 70 58 60 56 L 50 58 Q 40 60 35 55 L 25 50 Q 15 48 10 42 Z"
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="0.5"
          className="drop-shadow-lg"
        />
        {/* Grid lines */}
        {[20, 40, 60, 80].map(x => (
          <line key={x} x1={x} y1="0" x2={x} y2="60" stroke="rgba(255,255,255,0.03)" strokeWidth="0.3" />
        ))}
        {[20, 40].map(y => (
          <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="rgba(255,255,255,0.03)" strokeWidth="0.3" />
        ))}
        {/* City dots */}
        {AUSTRIAN_CITIES.map(city => (
          <g key={city.name}>
            <circle cx={city.x} cy={city.y} r="1.5" fill="rgba(255,100,0,0.4)" />
            <circle cx={city.x} cy={city.y} r="0.8" fill="#ff6400" />
            <text x={city.x + 2} y={city.y + 1} fontSize="2.5" fill="rgba(255,255,255,0.5)" className="select-none">{city.name}</text>
          </g>
        ))}
        {/* Animated route line */}
        {status !== "confirmed" && status !== "completed" && (
          <line
            x1="35" y1="42"
            x2={truckPos.x}
            y2={truckPos.y}
            stroke="rgba(255,100,0,0.3)"
            strokeWidth="0.5"
            strokeDasharray="2 1"
          />
        )}
        {/* Truck icon */}
        {(status === "on_route" || status === "arriving" || status === "loading" || status === "crew_assigned") && (
          <g transform={`translate(${truckPos.x - 3}, ${truckPos.y - 3})`}>
            <circle cx="3" cy="3" r="5" fill="rgba(255,100,0,0.2)" className="animate-ping" />
            <circle cx="3" cy="3" r="3" fill="#ff6400" />
            <text x="1.2" y="4.2" fontSize="3" fill="white">🚛</text>
          </g>
        )}
      </svg>
      <div className="absolute bottom-3 right-3 text-xs text-muted-foreground">Austria — Live Fleet View</div>
    </div>
  );
}

export default function Track() {
  const [bookingId, setBookingId] = useState<number | null>(null);
  const [inputVal, setInputVal] = useState("");
  const [simProgress, setSimProgress] = useState(0);
  const queryClient = useQueryClient();

  const { data: activeShipments } = useListActiveTracking();
  const { data: tracking, isLoading, error } = useGetTracking(
    bookingId ?? 0,
    { query: { enabled: !!bookingId, queryKey: getGetTrackingQueryKey(bookingId ?? 0) } }
  );

  // Simulate live updates every 5s
  useEffect(() => {
    if (!tracking) return;
    const interval = setInterval(() => {
      setSimProgress(p => Math.min(100, p + 2));
      queryClient.invalidateQueries({ queryKey: getListActiveTrackingQueryKey() });
    }, 5000);
    return () => clearInterval(interval);
  }, [tracking, queryClient]);

  const handleSearch = () => {
    const id = parseInt(inputVal.trim(), 10);
    if (!isNaN(id) && id > 0) setBookingId(id);
  };

  const currentStatusIdx = STATUSES.findIndex(s => s.key === tracking?.status);
  const displayProgress = tracking ? Math.max(tracking.routeProgress, simProgress) : 0;

  return (
    <div className="min-h-screen bg-background py-12 px-4 md:px-6">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm text-primary mb-4">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            REAL-TIME TRACKING
          </div>
          <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter text-white mb-3">
            Track Your<br /><span className="text-primary">Shipment.</span>
          </h1>
          <p className="text-muted-foreground text-lg">Enter your booking ID to get live vehicle tracking.</p>
        </motion.div>

        {/* Search Bar */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex gap-3 mb-10 max-w-lg">
          <Input
            placeholder="Enter Booking ID (e.g. 1)"
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            className="h-14 text-lg border-white/20 bg-card"
            data-testid="input-booking-id"
          />
          <Button size="lg" className="h-14 px-6" onClick={handleSearch} data-testid="button-track-search">
            <Search className="h-5 w-5" />
          </Button>
        </motion.div>

        {/* Active shipments quick-select */}
        {activeShipments && activeShipments.length > 0 && !bookingId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-10">
            <p className="text-sm text-muted-foreground mb-3 uppercase tracking-wider">Active Shipments — Click to Track</p>
            <div className="flex gap-3 flex-wrap">
              {activeShipments.map(s => (
                <button
                  key={s.bookingId}
                  onClick={() => { setBookingId(s.bookingId); setInputVal(String(s.bookingId)); }}
                  className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-2 text-sm text-primary hover:bg-primary/20 transition-colors"
                  data-testid={`button-active-shipment-${s.bookingId}`}
                >
                  <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  Booking #{s.bookingId} — {s.status.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {isLoading && (
          <div className="flex items-center gap-3 text-muted-foreground py-20 justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            Fetching tracking data...
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-center text-destructive">
            Booking not found. Please check your booking ID.
          </div>
        )}

        {tracking && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {/* Map */}
              <div className="lg:col-span-2 space-y-6">
                <AustriaMap lat={tracking.currentLat} lng={tracking.currentLng} status={tracking.status} />

                {/* Route progress */}
                <div className="rounded-xl border border-white/10 bg-card p-6">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm uppercase tracking-wider text-muted-foreground">Route Progress</span>
                    <span className="text-2xl font-black text-primary">{displayProgress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-orange-400"
                      initial={{ width: 0 }}
                      animate={{ width: `${displayProgress}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span className="truncate max-w-[40%]">{tracking.pickupAddress}</span>
                    <span className="truncate max-w-[40%] text-right">{tracking.destinationAddress}</span>
                  </div>
                </div>

                {/* Status Timeline */}
                <div className="rounded-xl border border-white/10 bg-card p-6">
                  <h3 className="text-lg font-bold mb-6 uppercase tracking-wider">Status Timeline</h3>
                  <div className="space-y-4">
                    {STATUSES.map((s, i) => {
                      const done = i <= currentStatusIdx;
                      const active = i === currentStatusIdx;
                      return (
                        <motion.div
                          key={s.key}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.06 }}
                          className="flex items-center gap-4"
                          data-testid={`status-step-${s.key}`}
                        >
                          <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 shrink-0 ${active ? "border-primary bg-primary/20" : done ? "border-primary/60 bg-primary/10" : "border-white/20 bg-white/5"}`}>
                            {done && !active ? <CheckCircle2 className="h-4 w-4 text-primary" /> :
                             active ? <span className="h-2 w-2 rounded-full bg-primary animate-pulse" /> :
                             <Circle className="h-4 w-4 text-white/20" />}
                          </div>
                          <span className={`text-sm font-medium ${active ? "text-primary" : done ? "text-white/70" : "text-white/30"}`}>
                            {s.label}
                          </span>
                          {active && <span className="ml-auto text-xs text-primary animate-pulse font-semibold uppercase">LIVE</span>}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Driver & Metrics Panel */}
              <div className="space-y-4">
                {/* Driver card */}
                <div className="rounded-xl border border-white/10 bg-card p-6">
                  <h3 className="text-sm uppercase tracking-wider text-muted-foreground mb-4">Driver</h3>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-12 w-12 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-lg">
                      {tracking.driverName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-white">{tracking.driverName}</p>
                      <p className="text-sm text-muted-foreground">{tracking.vehiclePlate}</p>
                    </div>
                  </div>
                  <a href={`tel:${tracking.driverPhone}`}>
                    <Button variant="outline" className="w-full border-white/20 hover:bg-white/5" data-testid="button-call-driver">
                      <Phone className="h-4 w-4 mr-2" />
                      {tracking.driverPhone}
                    </Button>
                  </a>
                </div>

                {/* Live metrics */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-white/10 bg-card p-4">
                    <Clock className="h-5 w-5 text-primary mb-2" />
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">ETA</p>
                    <p className="font-bold text-white text-sm">
                      {new Date(tracking.estimatedArrival).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-card p-4">
                    <MapPin className="h-5 w-5 text-primary mb-2" />
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Distance</p>
                    <p className="font-bold text-white text-sm">{tracking.distanceRemaining} km</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-card p-4">
                    <Gauge className="h-5 w-5 text-primary mb-2" />
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Speed</p>
                    <p className="font-bold text-white text-sm">{tracking.currentSpeed} km/h</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-card p-4">
                    <Cloud className="h-5 w-5 text-primary mb-2" />
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Weather</p>
                    <p className="font-bold text-white text-sm">{tracking.weatherCondition}</p>
                  </div>
                </div>

                {tracking.hasTrafficDelay && (
                  <motion.div
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 flex items-center gap-3"
                  >
                    <AlertTriangle className="h-5 w-5 text-yellow-400 shrink-0" />
                    <p className="text-sm text-yellow-300">Traffic delay detected. ETA updated.</p>
                  </motion.div>
                )}

                <div className="rounded-xl border border-white/10 bg-card p-4 text-xs text-muted-foreground">
                  Last updated: {new Date(tracking.updatedAt).toLocaleTimeString()}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        )}

        {!tracking && !isLoading && !bookingId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-20 text-center border border-white/10 rounded-xl bg-card/50"
          >
            <Truck className="h-16 w-16 text-primary/30 mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">Enter a booking ID above or select an active shipment to track.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
