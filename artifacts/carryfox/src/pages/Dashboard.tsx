import { motion } from "framer-motion";
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area, Legend,
} from "recharts";
import { Truck, Users, Clock, Star, TrendingUp, Package, CheckCircle2, Euro, ArrowUpRight } from "lucide-react";
import {
  useGetDashboardSummary, useGetFleetStatus, useGetDashboardAnalytics,
  useGetRecentBookings, useListActiveTracking,
} from "@workspace/api-client-react";
import { useTheme } from "@/lib/theme";

const SERVICE_LABELS: Record<string, string> = {
  apartment_move: "Apartment",
  student_move:   "Student",
  office_move:    "Office",
  storage:        "Storage",
  furniture:      "Furniture",
  clearance:      "Clearance",
  packing:        "Packing",
  warehouse:      "Warehouse",
};

const STATUS_COLORS: Record<string, string> = {
  confirmed:     "#3b82f6",
  crew_assigned: "#a855f7",
  loading:       "#f59e0b",
  on_route:      "#ff6400",
  arriving:      "#22c55e",
  completed:     "#6b7280",
  cancelled:     "#ef4444",
};

const CHART_COLORS = ["#ff6400", "#ff8c42", "#ffb07c", "#ffd4b3", "#ffe9d6", "#e0e0e0", "#aaaaaa", "#777777"];

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted/60 ${className}`} />;
}

export default function Dashboard() {
  const { data: summary }        = useGetDashboardSummary();
  const { data: fleetStatus }    = useGetFleetStatus();
  const { data: analytics }      = useGetDashboardAnalytics();
  const { data: recentBookings } = useGetRecentBookings();
  const { data: activeTracking } = useListActiveTracking();
  const { theme } = useTheme();

  const dark = theme === "dark";
  const gridColor  = dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)";
  const axisColor  = dark ? "rgba(255,255,255,0.3)"  : "rgba(0,0,0,0.35)";
  const tooltipBg  = dark ? "hsl(0 0% 6%)"           : "hsl(0 0% 100%)";
  const tooltipBorder = dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";
  const tooltipLabel  = dark ? "white"                 : "#111";

  const metricCards = [
    { label: "Bookings Today",     value: summary?.totalBookingsToday ?? 0,  icon: <Package className="h-5 w-5" />, suffix: "",     color: "text-blue-400"   },
    { label: "Active Vehicles",    value: summary?.activeVehicles ?? 0,      icon: <Truck   className="h-5 w-5" />, suffix: "",     color: "text-orange-400" },
    { label: "Total Drivers",      value: summary?.totalDrivers ?? 0,        icon: <Users   className="h-5 w-5" />, suffix: "",     color: "text-purple-400" },
    { label: "Avg ETA",            value: summary?.avgEtaMinutes ?? 0,       icon: <Clock   className="h-5 w-5" />, suffix: " min", color: "text-yellow-400" },
    { label: "Satisfaction",       value: summary?.customerSatisfaction ?? 0,icon: <Star    className="h-5 w-5" />, suffix: "/5",   color: "text-green-400"  },
    { label: "Total Moves",        value: summary?.totalMovesAllTime ?? 0,   icon: <TrendingUp className="h-5 w-5" />, suffix: "+", color: "text-primary"    },
  ];

  return (
    <div className="min-h-screen bg-background py-10 px-4 md:px-6">
      <div className="container mx-auto max-w-7xl">

        {/* ── Header ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm text-primary mb-4">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            LIVE OPERATIONS
          </div>
          <h1 className="text-5xl font-black uppercase tracking-tighter text-foreground">
            Operations<br /><span className="text-primary">Dashboard.</span>
          </h1>
        </motion.div>

        {/* ── Revenue MTD Hero Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-6 relative rounded-2xl overflow-hidden border border-primary/30 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6 shadow-[0_0_60px_rgba(255,90,0,0.1)]"
        >
          {/* Animated glow */}
          <motion.div
            className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-primary/20 blur-[80px] pointer-events-none"
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 5, repeat: Infinity }}
          />
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-primary text-xs uppercase tracking-widest font-semibold mb-2">
              <Euro className="h-4 w-4" />
              Revenue — Month to Date
            </div>
            <div className="text-6xl md:text-7xl font-black text-primary tracking-tighter">
              €{(summary?.totalRevenueMTD ?? 0).toLocaleString("de-AT", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
            <p className="text-muted-foreground mt-2 text-sm">
              From <span className="text-foreground font-semibold">{(summary?.pendingBookings ?? 0) + (summary?.completedToday ?? 0)}</span> active & completed bookings this month
            </p>
          </div>
          <div className="relative z-10 flex flex-wrap gap-4">
            {[
              { label: "Completed Today", value: summary?.completedToday ?? 0, icon: <CheckCircle2 className="h-4 w-4" /> },
              { label: "Pending",         value: summary?.pendingBookings ?? 0, icon: <Package     className="h-4 w-4" /> },
            ].map(m => (
              <div key={m.label} className="rounded-xl border border-primary/20 bg-primary/10 px-6 py-4 min-w-[130px]">
                <div className="flex items-center gap-2 text-primary text-xs font-semibold mb-1">
                  {m.icon} {m.label}
                </div>
                <p className="text-3xl font-black text-foreground">{m.value}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Metric Cards Grid ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {metricCards.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 + 0.1 }}
              className="rounded-xl border border-border bg-card p-5 hover:border-primary/30 transition-colors"
              data-testid={`metric-${m.label.toLowerCase().replace(/ /g, "-")}`}
            >
              <div className={`${m.color} mb-2`}>{m.icon}</div>
              <p className="text-2xl font-black text-foreground">
                {m.value}{m.suffix}
              </p>
              <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wide">{m.label}</p>
            </motion.div>
          ))}
        </div>

        {/* ── Charts Row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

          {/* Monthly Revenue + Bookings */}
          <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold uppercase tracking-wider text-foreground">Monthly Revenue & Bookings</h3>
              <span className="flex items-center gap-1.5 text-xs text-primary font-semibold">
                <ArrowUpRight className="h-3.5 w-3.5" /> Last 6 months
              </span>
            </div>
            {analytics ? (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={analytics.monthly}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#ff6400" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ff6400" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="label" stroke={axisColor} tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="left"  stroke={axisColor} tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" stroke={axisColor} tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: "10px" }}
                    labelStyle={{ color: tooltipLabel, fontWeight: "bold" }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, color: axisColor }} />
                  <Area yAxisId="right" type="monotone" dataKey="revenue" fill="url(#revGrad)" stroke="#ff6400" strokeWidth={2} name="Revenue (€)" dot={false} />
                  <Bar  yAxisId="left"  dataKey="bookings" fill="rgba(255,100,0,0.25)" radius={[4,4,0,0]} name="Bookings" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <Skeleton className="h-60" />
            )}
          </div>

          {/* Fleet Status */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="text-lg font-bold uppercase tracking-wider text-foreground mb-6">Fleet Status</h3>
            {fleetStatus ? (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Available",   value: fleetStatus.available   },
                        { name: "On Route",    value: fleetStatus.onRoute     },
                        { name: "Maintenance", value: fleetStatus.maintenance },
                        { name: "Idle",        value: fleetStatus.idle        },
                      ]}
                      cx="50%" cy="50%"
                      innerRadius={50} outerRadius={72}
                      dataKey="value"
                      paddingAngle={3}
                    >
                      {CHART_COLORS.map((color, i) => <Cell key={i} fill={color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: "8px" }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2.5 mt-4">
                  {[
                    { label: "Available",   value: fleetStatus.available,   color: "#ff6400" },
                    { label: "On Route",    value: fleetStatus.onRoute,     color: "#ff8c42" },
                    { label: "Maintenance", value: fleetStatus.maintenance, color: "#ffb07c" },
                    { label: "Idle",        value: fleetStatus.idle,        color: "#6b7280" },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-muted-foreground">{item.label}</span>
                      </div>
                      <span className="font-bold text-foreground">{item.value}</span>
                    </div>
                  ))}
                  <div className="border-t border-border pt-2 flex justify-between text-sm font-bold">
                    <span className="text-muted-foreground">Total Fleet</span>
                    <span className="text-foreground">{fleetStatus.total}</span>
                  </div>
                </div>
              </>
            ) : (
              <Skeleton className="h-60" />
            )}
          </div>
        </div>

        {/* ── Bottom Row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Active Shipments */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold uppercase tracking-wider text-foreground">Active Shipments</h3>
              <span className="flex items-center gap-1.5 text-xs text-primary font-semibold">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                LIVE
              </span>
            </div>
            {activeTracking && activeTracking.length > 0 ? (
              <div className="space-y-3">
                {activeTracking.slice(0, 5).map(t => (
                  <div key={t.bookingId} className="flex items-center justify-between rounded-xl border border-border bg-muted/30 p-3.5 hover:border-primary/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                        <Truck className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">Booking #{t.bookingId}</p>
                        <p className="text-xs text-muted-foreground">{t.driverName} · {t.vehiclePlate}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-primary capitalize">{t.status.replace(/_/g, " ")}</p>
                      <div className="h-1.5 w-16 rounded-full bg-muted mt-1 overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${t.routeProgress}%` }} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{t.routeProgress}%</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Truck className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <p>No active shipments right now.</p>
              </div>
            )}
          </div>

          {/* Recent Bookings */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="text-lg font-bold uppercase tracking-wider text-foreground mb-6">Recent Bookings</h3>
            {recentBookings && recentBookings.length > 0 ? (
              <div className="space-y-3">
                {recentBookings.slice(0, 6).map(b => (
                  <div key={b.id} className="flex items-center justify-between py-2 border-b border-border last:border-0" data-testid={`booking-row-${b.id}`}>
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: STATUS_COLORS[b.status] ?? "#6b7280" }} />
                      <div>
                        <p className="text-sm font-semibold text-foreground">{b.customerName}</p>
                        <p className="text-xs text-muted-foreground">{SERVICE_LABELS[b.serviceType] ?? b.serviceType}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-primary">€{b.totalPrice}</p>
                      <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground capitalize">
                        {b.status.replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Package className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <p>No recent bookings.</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Service Mix Chart ── */}
        {analytics && analytics.bookingsByService && (
          <div className="mt-6 rounded-xl border border-border bg-card p-6">
            <h3 className="text-lg font-bold uppercase tracking-wider text-foreground mb-6">Bookings by Service Type</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={analytics.bookingsByService.map(b => ({ name: SERVICE_LABELS[b.service] ?? b.service, count: b.count }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="name" stroke={axisColor} tick={{ fontSize: 12 }} />
                <YAxis stroke={axisColor} tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: "10px" }}
                  labelStyle={{ color: tooltipLabel, fontWeight: "bold" }}
                />
                <Bar dataKey="count" name="Bookings" radius={[6,6,0,0]}>
                  {analytics.bookingsByService.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

      </div>
    </div>
  );
}
