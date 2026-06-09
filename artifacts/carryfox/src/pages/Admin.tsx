import { useState } from "react";
import { motion } from "framer-motion";
import { LayoutDashboard, CalendarCheck, FileText, Truck, Users, BarChart3, ChevronRight, Edit2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useListBookings, useUpdateBooking, useListQuotes, useListDrivers, useListVehicles, useGetDashboardSummary } from "@workspace/api-client-react";
import { getListBookingsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const STATUS_OPTIONS = ["confirmed", "crew_assigned", "loading", "on_route", "arriving", "completed", "cancelled"];
const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  crew_assigned: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  loading: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  on_route: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  arriving: "bg-green-500/20 text-green-400 border-green-500/30",
  completed: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
};

const SERVICE_LABELS: Record<string, string> = {
  apartment_move: "Apartment Move",
  student_move: "Student Move",
  office_move: "Office Move",
  storage: "Storage",
  furniture: "Furniture",
  clearance: "Clearance",
  packing: "Packing",
  warehouse: "Warehouse",
};

type Tab = "overview" | "bookings" | "quotes" | "fleet" | "drivers" | "analytics";

function BookingsTable() {
  const { data: bookings, isLoading } = useListBookings();
  const updateBooking = useUpdateBooking();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editStatus, setEditStatus] = useState("");

  const startEdit = (id: number, status: string) => {
    setEditingId(id);
    setEditStatus(status);
  };

  const saveEdit = (id: number) => {
    updateBooking.mutate({ id, data: { status: editStatus } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() });
        setEditingId(null);
        toast({ title: "Updated", description: "Booking status updated." });
      },
      onError: () => toast({ title: "Error", description: "Failed to update.", variant: "destructive" }),
    });
  };

  if (isLoading) return <div className="h-40 animate-pulse bg-white/5 rounded-lg" />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <th className="pb-3 pr-4">#</th>
            <th className="pb-3 pr-4">Customer</th>
            <th className="pb-3 pr-4">Service</th>
            <th className="pb-3 pr-4">Date</th>
            <th className="pb-3 pr-4">Status</th>
            <th className="pb-3 pr-4">Price</th>
            <th className="pb-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {bookings?.map(b => (
            <tr key={b.id} className="hover:bg-white/5 transition-colors" data-testid={`admin-booking-row-${b.id}`}>
              <td className="py-3 pr-4 font-mono text-muted-foreground">#{b.id}</td>
              <td className="py-3 pr-4">
                <p className="font-semibold text-white">{b.customerName}</p>
                <p className="text-xs text-muted-foreground">{b.customerEmail}</p>
              </td>
              <td className="py-3 pr-4 text-muted-foreground">{SERVICE_LABELS[b.serviceType] ?? b.serviceType}</td>
              <td className="py-3 pr-4 text-muted-foreground">
                {new Date(b.scheduledDate).toLocaleDateString("de-AT")}
              </td>
              <td className="py-3 pr-4">
                {editingId === b.id ? (
                  <select
                    value={editStatus}
                    onChange={e => setEditStatus(e.target.value)}
                    className="rounded bg-card border border-white/20 text-white text-xs px-2 py-1"
                    data-testid={`select-status-${b.id}`}
                  >
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                  </select>
                ) : (
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[b.status] ?? ""}`}>
                    {b.status.replace(/_/g, " ")}
                  </span>
                )}
              </td>
              <td className="py-3 pr-4 font-bold text-primary">€{b.totalPrice}</td>
              <td className="py-3">
                {editingId === b.id ? (
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(b.id)} className="text-green-400 hover:text-green-300" data-testid={`button-save-booking-${b.id}`}><Check className="h-4 w-4" /></button>
                    <button onClick={() => setEditingId(null)} className="text-red-400 hover:text-red-300" data-testid={`button-cancel-edit-${b.id}`}><X className="h-4 w-4" /></button>
                  </div>
                ) : (
                  <button onClick={() => startEdit(b.id, b.status)} className="text-muted-foreground hover:text-primary transition-colors" data-testid={`button-edit-booking-${b.id}`}>
                    <Edit2 className="h-4 w-4" />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {(!bookings || bookings.length === 0) && (
        <div className="py-12 text-center text-muted-foreground">No bookings yet.</div>
      )}
    </div>
  );
}

function QuotesTable() {
  const { data: quotes, isLoading } = useListQuotes();
  if (isLoading) return <div className="h-40 animate-pulse bg-white/5 rounded-lg" />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <th className="pb-3 pr-4">#</th>
            <th className="pb-3 pr-4">Customer</th>
            <th className="pb-3 pr-4">Route</th>
            <th className="pb-3 pr-4">Size</th>
            <th className="pb-3 pr-4">Est. Price</th>
            <th className="pb-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {quotes?.map(q => (
            <tr key={q.id} className="hover:bg-white/5 transition-colors" data-testid={`admin-quote-row-${q.id}`}>
              <td className="py-3 pr-4 font-mono text-muted-foreground">#{q.id}</td>
              <td className="py-3 pr-4">
                <p className="font-semibold text-white">{q.customerName}</p>
                <p className="text-xs text-muted-foreground">{q.customerEmail}</p>
              </td>
              <td className="py-3 pr-4 text-muted-foreground text-xs">
                <p className="truncate max-w-[150px]">{q.pickupAddress}</p>
                <p className="truncate max-w-[150px]">→ {q.destinationAddress}</p>
              </td>
              <td className="py-3 pr-4 text-muted-foreground capitalize">{q.apartmentSize}</td>
              <td className="py-3 pr-4 font-bold text-primary">€{q.estimatedPrice}</td>
              <td className="py-3">
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[q.status] ?? "bg-gray-500/20 text-gray-400 border-gray-500/30"}`}>
                  {q.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {(!quotes || quotes.length === 0) && <div className="py-12 text-center text-muted-foreground">No quotes yet.</div>}
    </div>
  );
}

function FleetTable() {
  const { data: vehicles, isLoading } = useListVehicles();
  const VEHICLE_STATUS_COLORS: Record<string, string> = {
    available: "text-green-400",
    on_route: "text-orange-400",
    maintenance: "text-yellow-400",
    idle: "text-gray-400",
  };
  if (isLoading) return <div className="h-40 animate-pulse bg-white/5 rounded-lg" />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <th className="pb-3 pr-4">Plate</th>
            <th className="pb-3 pr-4">Model</th>
            <th className="pb-3 pr-4">Type</th>
            <th className="pb-3 pr-4">Capacity</th>
            <th className="pb-3 pr-4">City</th>
            <th className="pb-3 pr-4">Fuel</th>
            <th className="pb-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {vehicles?.map(v => (
            <tr key={v.id} className="hover:bg-white/5 transition-colors" data-testid={`admin-vehicle-row-${v.id}`}>
              <td className="py-3 pr-4 font-mono font-bold text-white">{v.plateNumber}</td>
              <td className="py-3 pr-4 text-muted-foreground">{v.model}</td>
              <td className="py-3 pr-4 text-muted-foreground capitalize">{v.type.replace(/_/g, " ")}</td>
              <td className="py-3 pr-4 text-muted-foreground">{v.capacity}</td>
              <td className="py-3 pr-4 text-muted-foreground">{v.currentCity}</td>
              <td className="py-3 pr-4">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-16 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${v.fuelLevel}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{v.fuelLevel}%</span>
                </div>
              </td>
              <td className={`py-3 font-semibold capitalize text-sm ${VEHICLE_STATUS_COLORS[v.status] ?? "text-muted-foreground"}`}>
                {v.status.replace(/_/g, " ")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DriversTable() {
  const { data: drivers, isLoading } = useListDrivers();
  const DRIVER_STATUS_COLORS: Record<string, string> = {
    available: "text-green-400",
    on_route: "text-orange-400",
    off_duty: "text-gray-400",
    break: "text-yellow-400",
  };
  if (isLoading) return <div className="h-40 animate-pulse bg-white/5 rounded-lg" />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <th className="pb-3 pr-4">Name</th>
            <th className="pb-3 pr-4">Phone</th>
            <th className="pb-3 pr-4">City</th>
            <th className="pb-3 pr-4">Rating</th>
            <th className="pb-3 pr-4">Moves</th>
            <th className="pb-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {drivers?.map(d => (
            <tr key={d.id} className="hover:bg-white/5 transition-colors" data-testid={`admin-driver-row-${d.id}`}>
              <td className="py-3 pr-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">{d.name.charAt(0)}</div>
                  <div>
                    <p className="font-semibold text-white">{d.name}</p>
                    <p className="text-xs text-muted-foreground">{d.email}</p>
                  </div>
                </div>
              </td>
              <td className="py-3 pr-4 text-muted-foreground">{d.phone}</td>
              <td className="py-3 pr-4 text-muted-foreground">{d.city}</td>
              <td className="py-3 pr-4 text-yellow-400 font-bold">{d.rating}</td>
              <td className="py-3 pr-4 text-white font-bold">{d.totalMoves}</td>
              <td className={`py-3 font-semibold capitalize ${DRIVER_STATUS_COLORS[d.status] ?? "text-muted-foreground"}`}>
                {d.status.replace(/_/g, " ")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Admin() {
  const [activeTab, setActiveTab] = useState<Tab>("bookings");
  const { data: summary } = useGetDashboardSummary();

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Overview", icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: "bookings", label: "Bookings", icon: <CalendarCheck className="h-4 w-4" /> },
    { id: "quotes", label: "Quotes", icon: <FileText className="h-4 w-4" /> },
    { id: "fleet", label: "Fleet", icon: <Truck className="h-4 w-4" /> },
    { id: "drivers", label: "Drivers", icon: <Users className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r border-white/10 bg-card/50 p-6 hidden md:flex flex-col">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Control Panel</p>
          <h2 className="text-xl font-black text-white uppercase tracking-tight">Admin</h2>
        </div>
        <nav className="space-y-1 flex-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${activeTab === tab.id ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-white/5 hover:text-white"}`}
              data-testid={`admin-tab-${tab.id}`}
            >
              {tab.icon}
              {tab.label}
              {activeTab === tab.id && <ChevronRight className="h-4 w-4 ml-auto" />}
            </button>
          ))}
        </nav>
        <div className="border-t border-white/10 pt-4">
          <div className="rounded-lg bg-primary/10 border border-primary/20 p-3">
            <p className="text-xs text-muted-foreground">Revenue MTD</p>
            <p className="text-xl font-black text-primary">€{summary?.totalRevenueMTD?.toFixed(0) ?? "–"}</p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 p-6 md:p-10 overflow-x-hidden">
        {/* Mobile tab selector */}
        <div className="md:hidden flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition-all ${activeTab === tab.id ? "bg-primary text-white" : "bg-card text-muted-foreground border border-white/10"}`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="mb-6">
            <h1 className="text-3xl font-black uppercase tracking-tighter text-white">
              {tabs.find(t => t.id === activeTab)?.label}
            </h1>
          </div>

          <div className="rounded-xl border border-white/10 bg-card p-6">
            {activeTab === "overview" && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: "Total Moves", value: summary?.totalMovesAllTime ?? 0 },
                  { label: "Completed Today", value: summary?.completedToday ?? 0 },
                  { label: "Pending Bookings", value: summary?.pendingBookings ?? 0 },
                  { label: "Active Vehicles", value: summary?.activeVehicles ?? 0 },
                  { label: "Total Drivers", value: summary?.totalDrivers ?? 0 },
                  { label: "Avg ETA (min)", value: summary?.avgEtaMinutes ?? 0 },
                ].map(m => (
                  <div key={m.label} className="rounded-lg border border-white/10 bg-background/50 p-4">
                    <p className="text-3xl font-black text-primary">{m.value}</p>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mt-1">{m.label}</p>
                  </div>
                ))}
              </div>
            )}
            {activeTab === "bookings" && <BookingsTable />}
            {activeTab === "quotes" && <QuotesTable />}
            {activeTab === "fleet" && <FleetTable />}
            {activeTab === "drivers" && <DriversTable />}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
