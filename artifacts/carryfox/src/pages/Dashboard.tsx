import { motion } from "framer-motion";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Truck, Users, Clock, Star, TrendingUp, Package, CheckCircle2, AlertCircle } from "lucide-react";
import { useGetDashboardSummary, useGetFleetStatus, useGetDashboardAnalytics, useGetRecentBookings, useListActiveTracking } from "@workspace/api-client-react";

const SERVICE_LABELS: Record<string, string> = {
  apartment_move: "Apartment",
  student_move: "Student",
  office_move: "Office",
  storage: "Storage",
  furniture: "Furniture",
  clearance: "Clearance",
  packing: "Packing",
  warehouse: "Warehouse",
};

const STATUS_COLORS: Record<string, string> = {
  confirmed: "#3b82f6",
  crew_assigned: "#a855f7",
  loading: "#f59e0b",
  on_route: "#ff6400",
  arriving: "#22c55e",
  completed: "#6b7280",
  cancelled: "#ef4444",
};

const CHART_COLORS = ["#ff6400", "#ff8c42", "#ffb07c", "#ffd4b3", "#ffe9d6", "#fff4ee", "#e0e0e0", "#aaaaaa"];

function CountUp({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {prefix}{value}{suffix}
    </motion.span>
  );
}

export default function Dashboard() {
  const { data: summary } = useGetDashboardSummary();
  const { data: fleetStatus } = useGetFleetStatus();
  const { data: analytics } = useGetDashboardAnalytics();
  const { data: recentBookings } = useGetRecentBookings();
  const { data: activeTracking } = useListActiveTracking();

  const metricCards = [
    { label: "Bookings Today", value: summary?.totalBookingsToday ?? 0, icon: <Package className="h-6 w-6" />, suffix: "" },
    { label: "Active Vehicles", value: summary?.activeVehicles ?? 0, icon: <Truck className="h-6 w-6" />, suffix: "" },
    { label: "Total Drivers", value: summary?.totalDrivers ?? 0, icon: <Users className="h-6 w-6" />, suffix: "" },
    { label: "Avg ETA", value: summary?.avgEtaMinutes ?? 0, icon: <Clock className="h-6 w-6" />, suffix: " min" },
    { label: "Satisfaction", value: summary?.customerSatisfaction ?? 0, icon: <Star className="h-6 w-6" />, suffix: "/5" },
    { label: "Total Moves", value: summary?.totalMovesAllTime ?? 0, icon: <TrendingUp className="h-6 w-6" />, suffix: "+" },
  ];

  return (
    <div className="min-h-screen bg-background py-10 px-4 md:px-6">
      <div className="container mx-auto max-w-7xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm text-primary mb-4">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            LIVE OPERATIONS
          </div>
          <h1 className="text-5xl font-black uppercase tracking-tighter text-white">
            Operations<br /><span className="text-primary">Dashboard.</span>
          </h1>
        </motion.div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {metricCards.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl border border-white/10 bg-card p-5"
              data-testid={`metric-${m.label.toLowerCase().replace(/ /g, "-")}`}
            >
              <div className="text-primary mb-2">{m.icon}</div>
              <p className="text-2xl font-black text-white">
                <CountUp value={m.value} suffix={m.suffix} />
              </p>
              <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wide">{m.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Revenue Chart */}
          <div className="lg:col-span-2 rounded-xl border border-white/10 bg-card p-6">
            <h3 className="text-lg font-bold uppercase tracking-wider mb-6">Monthly Bookings & Revenue</h3>
            {analytics ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={analytics.monthly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="label" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="left" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(0 0% 6%)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}
                    labelStyle={{ color: "white" }}
                  />
                  <Bar yAxisId="left" dataKey="bookings" fill="#ff6400" radius={[4, 4, 0, 0]} name="Bookings" />
                  <Bar yAxisId="right" dataKey="revenue" fill="rgba(255,100,0,0.3)" radius={[4, 4, 0, 0]} name="Revenue (€)" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-60 animate-pulse bg-white/5 rounded-lg" />
            )}
          </div>

          {/* Fleet Status */}
          <div className="rounded-xl border border-white/10 bg-card p-6">
            <h3 className="text-lg font-bold uppercase tracking-wider mb-6">Fleet Status</h3>
            {fleetStatus ? (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={[
                      { name: "Available", value: fleetStatus.available },
                      { name: "On Route", value: fleetStatus.onRoute },
                      { name: "Maintenance", value: fleetStatus.maintenance },
                      { name: "Idle", value: fleetStatus.idle },
                    ]} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value">
                      {CHART_COLORS.map((color, i) => <Cell key={i} fill={color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "hsl(0 0% 6%)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-2">
                  {[
                    { label: "Available", value: fleetStatus.available, color: "#ff6400" },
                    { label: "On Route", value: fleetStatus.onRoute, color: "#ff8c42" },
                    { label: "Maintenance", value: fleetStatus.maintenance, color: "#ffb07c" },
                    { label: "Idle", value: fleetStatus.idle, color: "#6b7280" },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-muted-foreground">{item.label}</span>
                      </div>
                      <span className="font-bold text-white">{item.value}</span>
                    </div>
                  ))}
                  <div className="border-t border-white/10 pt-2 flex justify-between text-sm font-bold">
                    <span className="text-muted-foreground">Total Fleet</span>
                    <span className="text-white">{fleetStatus.total}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-60 animate-pulse bg-white/5 rounded-lg" />
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Shipments */}
          <div className="rounded-xl border border-white/10 bg-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold uppercase tracking-wider">Active Shipments</h3>
              <span className="flex items-center gap-1.5 text-xs text-primary">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                LIVE
              </span>
            </div>
            {activeTracking && activeTracking.length > 0 ? (
              <div className="space-y-3">
                {activeTracking.slice(0, 5).map(t => (
                  <div key={t.bookingId} className="flex items-center justify-between rounded-lg border border-white/10 bg-background/50 p-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <Truck className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">Booking #{t.bookingId}</p>
                        <p className="text-xs text-muted-foreground">{t.driverName} · {t.vehiclePlate}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-primary capitalize">{t.status.replace(/_/g, " ")}</p>
                      <p className="text-xs text-muted-foreground">{t.routeProgress}%</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground">No active shipments right now.</div>
            )}
          </div>

          {/* Recent Bookings */}
          <div className="rounded-xl border border-white/10 bg-card p-6">
            <h3 className="text-lg font-bold uppercase tracking-wider mb-6">Recent Bookings</h3>
            {recentBookings && recentBookings.length > 0 ? (
              <div className="space-y-3">
                {recentBookings.slice(0, 6).map(b => (
                  <div key={b.id} className="flex items-center justify-between" data-testid={`booking-row-${b.id}`}>
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[b.status] ?? "#6b7280" }} />
                      <div>
                        <p className="text-sm font-semibold text-white">{b.customerName}</p>
                        <p className="text-xs text-muted-foreground">{SERVICE_LABELS[b.serviceType] ?? b.serviceType}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary">€{b.totalPrice}</p>
                      <p className="text-xs text-muted-foreground capitalize">{b.status.replace(/_/g, " ")}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground">No recent bookings.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
