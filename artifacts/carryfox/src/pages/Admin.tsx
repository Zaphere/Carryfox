import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity, ArrowRight,
  CircleAlert, ClipboardList, Euro, FileText, LayoutDashboard, LoaderCircle,
  MapPin, Menu, Pencil, Plus, RefreshCw, Search, ShieldCheck, Truck, Users,
  X, Star, CalendarDays, Trash2, Clock3, PackageCheck,
} from "lucide-react";
import {
  getListBookingsQueryKey, getListDriversQueryKey, getListQuotesQueryKey,
  getListVehiclesQueryKey, useCreateDriver, useCreateVehicle,
  useDeleteDriver, useDeleteVehicle, useGetDashboardSummary, useListBookings,
  useListDrivers, useListQuotes, useListVehicles, useUpdateBooking,
  useUpdateDriver, useUpdateQuote, useUpdateVehicle,
} from "@workspace/api-client-react";
import type {
  Booking, BookingUpdate, Driver, DriverInput, DriverUpdate, Quote,
  QuoteUpdate, Vehicle, VehicleInput, VehicleUpdate,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

type Page = "overview" | "bookings" | "quotes" | "drivers" | "vehicles";
type EntityDialog = { kind: "driver" | "vehicle"; record?: Driver | Vehicle } | null;

const NAV: { key: Page; name: string; icon: typeof LayoutDashboard }[] = [
  { key: "overview", name: "Overview", icon: LayoutDashboard },
  { key: "bookings", name: "Bookings", icon: ClipboardList },
  { key: "quotes", name: "Quotes", icon: FileText },
  { key: "drivers", name: "Drivers", icon: Users },
  { key: "vehicles", name: "Vehicles", icon: Truck },
];

const BOOKING_STATUSES = ["confirmed", "crew_assigned", "loading", "on_route", "arriving", "completed", "cancelled"];
const QUOTE_STATUSES = ["pending", "accepted", "booked", "cancelled"];
const DRIVER_STATUSES = ["available", "on_route", "off_duty", "break"];
const VEHICLE_STATUSES = ["available", "on_route", "maintenance", "idle"];
const SERVICE_NAMES: Record<string, string> = {
  apartment_move: "Apartment move", student_move: "Student move", office_move: "Office move",
  storage: "Storage", furniture: "Furniture", clearance: "Clearance", packing: "Packing", warehouse: "Warehouse",
};

const statusStyle: Record<string, string> = {
  confirmed: "bg-sky-50 text-sky-800 ring-sky-200",
  crew_assigned: "bg-violet-50 text-violet-800 ring-violet-200",
  loading: "bg-amber-50 text-amber-800 ring-amber-200",
  on_route: "bg-orange-50 text-orange-800 ring-orange-200",
  arriving: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  completed: "bg-stone-100 text-stone-700 ring-stone-200",
  cancelled: "bg-rose-50 text-rose-800 ring-rose-200",
  pending: "bg-amber-50 text-amber-800 ring-amber-200",
  accepted: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  booked: "bg-sky-50 text-sky-800 ring-sky-200",
  available: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  idle: "bg-stone-100 text-stone-700 ring-stone-200",
  maintenance: "bg-rose-50 text-rose-800 ring-rose-200",
  off_duty: "bg-stone-100 text-stone-700 ring-stone-200",
  break: "bg-amber-50 text-amber-800 ring-amber-200",
};

function readable(value: string) {
  return value.replace(/_/g, " ");
}

function money(value: number | null | undefined) {
  return value == null ? "—" : new Intl.NumberFormat("de-AT", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(value);
}

function dateLabel(value: string | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("de-AT", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function StatusPill({ value }: { value: string }) {
  return <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ring-1 ring-inset ${statusStyle[value] ?? "bg-stone-100 text-stone-700 ring-stone-200"}`}>{readable(value)}</span>;
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-[#e6e0d6] bg-[#fffefa] shadow-[0_2px_10px_rgba(47,49,43,.035)] ${className}`}>{children}</section>;
}

function PanelHeading({ eyebrow, title, aside }: { eyebrow?: string; title: string; aside?: React.ReactNode }) {
  return <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#eee9df] px-5 py-4 sm:px-6">
    <div>{eyebrow && <p className="mb-1 text-[10px] font-bold uppercase tracking-[.17em] text-[#999286]">{eyebrow}</p>}<h2 className="text-[16px] font-bold tracking-[-.025em] text-[#282a25]">{title}</h2></div>
    {aside}
  </div>;
}

function ActionButton({ children, onClick, variant = "primary", disabled, type = "button", testId }: {
  children: React.ReactNode; onClick?: () => void; variant?: "primary" | "quiet" | "danger"; disabled?: boolean; type?: "button" | "submit"; testId?: string;
}) {
  const variantClass = variant === "primary"
    ? "bg-[#e36a37] text-white hover:bg-[#cf592a] shadow-[0_2px_5px_rgba(190,78,35,.17)]"
    : variant === "danger" ? "border border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100"
      : "border border-[#e6e0d6] bg-[#fffefa] text-[#58584f] hover:bg-[#f7f3eb]";
  return <button type={type} onClick={onClick} disabled={disabled} data-testid={testId} className={`inline-flex min-h-9 items-center justify-center gap-2 rounded-lg px-3.5 text-[12px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-55 ${variantClass}`}>{children}</button>;
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return <label className="block space-y-1.5"><span className="block text-[11px] font-semibold text-[#626157]">{label}</span>{children}{hint && <span className="block text-[10px] text-[#9c978d]">{hint}</span>}</label>;
}

const inputClass = "min-h-10 w-full rounded-lg border border-[#e3ddd2] bg-[#fffefa] px-3 text-[13px] text-[#2b2c27] outline-none transition focus:border-[#e36a37] focus:ring-2 focus:ring-[#e36a37]/15 placeholder:text-[#aaa499]";
const selectClass = `${inputClass} capitalize`;

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return <div className="flex flex-col items-center px-6 py-14 text-center">
    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f4eee3] text-[#a7a092]"><PackageCheck className="h-5 w-5" /></div>
    <h3 className="text-sm font-semibold text-[#3d3e37]">{title}</h3><p className="mt-1 max-w-sm text-xs leading-5 text-[#898579]">{detail}</p>
  </div>;
}

function QueryState({ loading, error, retry, label }: { loading: boolean; error: boolean; retry: () => void; label: string }) {
  if (loading) return <div className="space-y-3 p-5" aria-label={`Loading ${label}`}><div className="h-4 w-1/3 animate-pulse rounded bg-[#f0ece4]" /><div className="h-10 animate-pulse rounded-lg bg-[#f6f2ea]" /><div className="h-10 animate-pulse rounded-lg bg-[#f6f2ea]" /><div className="h-10 animate-pulse rounded-lg bg-[#f6f2ea]" /></div>;
  if (error) return <div role="alert" className="flex flex-col items-center px-6 py-12 text-center"><CircleAlert className="mb-3 h-6 w-6 text-[#c75b3d]" /><p className="text-sm font-semibold text-[#3a3933]">Couldn’t load {label}</p><p className="mt-1 text-xs text-[#898579]">Check the connection and try again.</p><button onClick={retry} className="mt-4 inline-flex items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold text-[#bd5228] hover:bg-[#f9eee8]" data-testid={`button-retry-${label}`}><RefreshCw className="h-3.5 w-3.5" /> Retry</button></div>;
  return null;
}

function mutationRecovery(error: unknown, fallback: string) {
  const status = getHttpStatus(error);
  if (status === 503) return "Owner email access is not configured. Ask the platform administrator to correct the deployment setting.";
  if (status === 401) return "Your session has expired. Sign in through Carryfox, then return to this workspace.";
  if (status === 403) return "This account does not have owner access. Sign in with the configured owner account.";
  return fallback;
}

function TableSearch({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return <label className="relative block w-full sm:w-64"><Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9a958b]" /><input value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} aria-label={placeholder} className="h-9 w-full rounded-lg border border-[#e7e1d6] bg-[#fffefa] pl-9 pr-3 text-xs outline-none focus:border-[#e36a37] focus:ring-2 focus:ring-[#e36a37]/15" data-testid="input-admin-search" /></label>;
}

function DialogFrame({ title, description, onClose, children, wide = false }: { title: string; description: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#24251f]/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-5" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <motion.div role="dialog" aria-modal="true" aria-labelledby="admin-dialog-title" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl border border-[#e6e0d6] bg-[#fffefa] shadow-2xl sm:rounded-2xl ${wide ? "max-w-2xl" : "max-w-lg"}`}>
      <div className="sticky top-0 z-10 flex items-start justify-between border-b border-[#eee9df] bg-[#fffefa] px-5 py-4 sm:px-6">
        <div><h2 id="admin-dialog-title" className="text-lg font-bold tracking-tight text-[#292a25]">{title}</h2><p className="mt-1 text-xs text-[#858175]">{description}</p></div>
        <button type="button" aria-label="Close dialog" onClick={onClose} className="rounded-lg p-2 text-[#817d72] hover:bg-[#f3efe7]" data-testid="button-close-dialog"><X className="h-4 w-4" /></button>
      </div>
      {children}
    </motion.div>
  </div>;
}

function BookingEditor({ booking, drivers, vehicles, onClose, refresh }: { booking: Booking; drivers: Driver[]; vehicles: Vehicle[]; onClose: () => void; refresh: () => void }) {
  const mutation = useUpdateBooking();
  const { toast } = useToast();
  const [status, setStatus] = useState(booking.status);
  const [driverId, setDriverId] = useState(booking.driverId == null ? "" : String(booking.driverId));
  const [vehicleId, setVehicleId] = useState(booking.vehicleId == null ? "" : String(booking.vehicleId));
  const [notes, setNotes] = useState(booking.notes ?? "");
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data: BookingUpdate = { status, driverId: driverId ? Number(driverId) : null, vehicleId: vehicleId ? Number(vehicleId) : null, notes: notes || null };
    mutation.mutate({ id: booking.id, data }, {
      onSuccess: () => { refresh(); toast({ title: "Booking saved", description: `Booking #${booking.id} has been updated.` }); onClose(); },
      onError: error => toast({ title: "Couldn’t save booking", description: mutationRecovery(error, "Your changes were not saved. Try again."), variant: "destructive" }),
    });
  };
  return <DialogFrame title={`Booking #${booking.id}`} description={`${booking.customerName} · ${dateLabel(booking.scheduledDate)}`} onClose={onClose} wide>
    <form onSubmit={submit} className="space-y-5 p-5 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Booking status"><select value={status} onChange={e => setStatus(e.target.value)} className={selectClass}>{BOOKING_STATUSES.map(s => <option key={s} value={s}>{readable(s)}</option>)}</select></Field>
        <Field label="Assign driver" hint="Choose none to clear the current assignment"><select value={driverId} onChange={e => setDriverId(e.target.value)} className={selectClass}><option value="">Unassigned</option>{drivers.map(d => <option key={d.id} value={d.id}>{d.name} · {d.city}</option>)}</select></Field>
        <Field label="Assign vehicle" hint="Choose none to clear the current assignment"><select value={vehicleId} onChange={e => setVehicleId(e.target.value)} className={selectClass}><option value="">Unassigned</option>{vehicles.map(v => <option key={v.id} value={v.id}>{v.plateNumber} · {v.model}</option>)}</select></Field>
        <Field label="Internal notes"><textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} className={`${inputClass} resize-y py-2`} placeholder="Add an operations note" /></Field>
      </div>
      <div className="grid gap-3 rounded-xl bg-[#f7f4ed] p-4 text-xs text-[#69675d] sm:grid-cols-2">
        <p><span className="block text-[10px] font-bold uppercase tracking-wider text-[#a09a8d]">Collection</span>{booking.pickupAddress}</p><p><span className="block text-[10px] font-bold uppercase tracking-wider text-[#a09a8d]">Delivery</span>{booking.destinationAddress}</p>
      </div>
      <div className="flex justify-end gap-2 border-t border-[#eee9df] pt-4"><ActionButton variant="quiet" onClick={onClose}>Cancel</ActionButton><ActionButton type="submit" disabled={mutation.isPending} testId="button-save-booking">{mutation.isPending && <LoaderCircle className="h-3.5 w-3.5 animate-spin" />}Save changes</ActionButton></div>
    </form>
  </DialogFrame>;
}

function QuoteEditor({ quote, onClose, refresh }: { quote: Quote; onClose: () => void; refresh: () => void }) {
  const mutation = useUpdateQuote();
  const { toast } = useToast();
  const [status, setStatus] = useState(quote.status);
  const [notes, setNotes] = useState(quote.notes ?? "");
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data: QuoteUpdate = { status: status as QuoteUpdate["status"], notes: notes || null };
    mutation.mutate({ id: quote.id, data }, {
      onSuccess: () => { refresh(); toast({ title: "Quote updated", description: `Quote #${quote.id} has been saved.` }); onClose(); },
      onError: error => toast({ title: "Couldn’t save quote", description: mutationRecovery(error, "Your changes were not saved. Try again."), variant: "destructive" }),
    });
  };
  return <DialogFrame title={`Quote #${quote.id}`} description={`Received ${dateLabel(quote.createdAt)} · ${quote.customerName}`} onClose={onClose} wide>
    <form onSubmit={submit} className="space-y-5 p-5 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Quote status"><select value={status} onChange={e => setStatus(e.target.value)} className={selectClass}>{QUOTE_STATUSES.map(s => <option key={s} value={s}>{readable(s)}</option>)}</select></Field>
        <div className="rounded-lg bg-[#f7f4ed] px-4 py-3"><p className="text-[10px] font-bold uppercase tracking-wider text-[#9b9589]">Estimate</p><p className="mt-1 text-lg font-bold text-[#30312b]">{money(quote.estimatedPrice)}</p></div>
        <Field label="Operations notes"><textarea rows={4} value={notes} onChange={e => setNotes(e.target.value)} className={`${inputClass} resize-y py-2`} placeholder="Record follow-up or customer details" /></Field>
        <div className="space-y-3 rounded-xl border border-[#eee9df] p-4 text-xs text-[#69675d]">
          <p><span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#9b9589]">Route</span>{quote.pickupAddress}<br /><span className="text-[#b0a99c]">to</span> {quote.destinationAddress}</p>
          <p><span className="text-[#9b9589]">Home size</span> · {quote.apartmentSize} / {quote.rooms} rooms</p>
          <p><span className="text-[#9b9589]">Contact</span> · {quote.customerEmail} · {quote.customerPhone}</p>
        </div>
      </div>
      <div className="flex justify-end gap-2 border-t border-[#eee9df] pt-4"><ActionButton variant="quiet" onClick={onClose}>Cancel</ActionButton><ActionButton type="submit" disabled={mutation.isPending} testId="button-save-quote">{mutation.isPending && <LoaderCircle className="h-3.5 w-3.5 animate-spin" />}Save changes</ActionButton></div>
    </form>
  </DialogFrame>;
}

function EntityForm({ dialog, onClose, refresh }: { dialog: Exclude<EntityDialog, null>; onClose: () => void; refresh: () => void }) {
  const { toast } = useToast();
  const isDriver = dialog.kind === "driver";
  const driver = isDriver ? dialog.record as Driver | undefined : undefined;
  const vehicle = !isDriver ? dialog.record as Vehicle | undefined : undefined;
  const createDriver = useCreateDriver();
  const updateDriver = useUpdateDriver();
  const createVehicle = useCreateVehicle();
  const updateVehicle = useUpdateVehicle();
  const editing = Boolean(dialog.record);
  const pending = isDriver ? (editing ? updateDriver.isPending : createDriver.isPending) : (editing ? updateVehicle.isPending : createVehicle.isPending);
  const [driverForm, setDriverForm] = useState({
    name: driver?.name ?? "", phone: driver?.phone ?? "", email: driver?.email ?? "",
    licenseNumber: driver?.licenseNumber ?? "", city: driver?.city ?? "",
    status: driver?.status ?? "available", avatarUrl: driver?.avatarUrl ?? "",
  });
  const [vehicleForm, setVehicleForm] = useState({
    plateNumber: vehicle?.plateNumber ?? "", model: vehicle?.model ?? "", type: vehicle?.type ?? "van",
    capacity: vehicle?.capacity ?? "", status: vehicle?.status ?? "available", currentCity: vehicle?.currentCity ?? "",
    fuelLevel: vehicle?.fuelLevel ?? "", mileage: vehicle?.mileage ?? "", lastServiceDate: vehicle?.lastServiceDate?.slice(0, 10) ?? "",
  });
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isDriver) {
      const data: DriverInput = { ...driverForm, avatarUrl: driverForm.avatarUrl || null, status: driverForm.status as DriverInput["status"] };
      const callbacks = {
        onSuccess: () => { refresh(); toast({ title: editing ? "Driver updated" : "Driver added", description: `${data.name} is now in your driver register.` }); onClose(); },
        onError: (error: unknown) => toast({ title: "Couldn’t save driver", description: mutationRecovery(error, "Check the details and try again."), variant: "destructive" as const }),
      };
      if (driver) updateDriver.mutate({ id: driver.id, data: data as DriverUpdate }, callbacks);
      else createDriver.mutate({ data }, callbacks);
    } else {
      const data: VehicleInput = {
        ...vehicleForm, type: vehicleForm.type as VehicleInput["type"], status: vehicleForm.status as VehicleInput["status"],
        fuelLevel: Number(vehicleForm.fuelLevel), mileage: Number(vehicleForm.mileage),
      };
      const callbacks = {
        onSuccess: () => { refresh(); toast({ title: editing ? "Vehicle updated" : "Vehicle added", description: `${data.plateNumber} is now in your fleet register.` }); onClose(); },
        onError: (error: unknown) => toast({ title: "Couldn’t save vehicle", description: mutationRecovery(error, "Check the details and try again."), variant: "destructive" as const }),
      };
      if (vehicle) updateVehicle.mutate({ id: vehicle.id, data: data as VehicleUpdate }, callbacks);
      else createVehicle.mutate({ data }, callbacks);
    }
  };
  const setD = (key: keyof typeof driverForm, value: string) => setDriverForm(current => ({ ...current, [key]: value }));
  const setV = (key: keyof typeof vehicleForm, value: string | number) => setVehicleForm(current => ({ ...current, [key]: value }));
  return <DialogFrame title={`${editing ? "Edit" : "Add"} ${isDriver ? "driver" : "vehicle"}`} description={editing ? "Changes are saved to the operations register." : "Add a record to your live operations register."} onClose={onClose} wide>
    <form onSubmit={submit} className="space-y-5 p-5 sm:p-6">
      {isDriver ? <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name"><input required value={driverForm.name} onChange={e => setD("name", e.target.value)} className={inputClass} autoFocus /></Field>
        <Field label="Phone"><input required value={driverForm.phone} onChange={e => setD("phone", e.target.value)} className={inputClass} type="tel" /></Field>
        <Field label="Email"><input value={driverForm.email} onChange={e => setD("email", e.target.value)} className={inputClass} type="email" /></Field>
        <Field label="Licence number"><input required value={driverForm.licenseNumber} onChange={e => setD("licenseNumber", e.target.value)} className={inputClass} /></Field>
        <Field label="City"><input required value={driverForm.city} onChange={e => setD("city", e.target.value)} className={inputClass} /></Field>
        <Field label="Availability"><select value={driverForm.status} onChange={e => setD("status", e.target.value)} className={selectClass}>{DRIVER_STATUSES.map(s => <option key={s} value={s}>{readable(s)}</option>)}</select></Field>
        <Field label="Avatar image URL (optional)"><input value={driverForm.avatarUrl} onChange={e => setD("avatarUrl", e.target.value)} className={inputClass} type="url" /></Field>
      </div> : <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Registration plate"><input required value={vehicleForm.plateNumber} onChange={e => setV("plateNumber", e.target.value.toUpperCase())} className={inputClass} autoFocus /></Field>
        <Field label="Make and model"><input required value={vehicleForm.model} onChange={e => setV("model", e.target.value)} className={inputClass} /></Field>
        <Field label="Vehicle class"><select value={vehicleForm.type} onChange={e => setV("type", e.target.value)} className={selectClass}>{["van", "small_truck", "large_truck", "xl_truck"].map(s => <option key={s} value={s}>{readable(s)}</option>)}</select></Field>
        <Field label="Capacity"><input required value={vehicleForm.capacity} onChange={e => setV("capacity", e.target.value)} className={inputClass} placeholder="e.g. 3.5t" /></Field>
        <Field label="Current city"><input required value={vehicleForm.currentCity} onChange={e => setV("currentCity", e.target.value)} className={inputClass} /></Field>
        <Field label="Fleet status"><select value={vehicleForm.status} onChange={e => setV("status", e.target.value)} className={selectClass}>{VEHICLE_STATUSES.map(s => <option key={s} value={s}>{readable(s)}</option>)}</select></Field>
        <Field label="Fuel level (%)"><input min="0" max="100" required type="number" value={vehicleForm.fuelLevel} onChange={e => setV("fuelLevel", e.target.value)} className={inputClass} /></Field>
        <Field label="Odometer (km)"><input min="0" required type="number" value={vehicleForm.mileage} onChange={e => setV("mileage", e.target.value)} className={inputClass} /></Field>
        <Field label="Last service date"><input required type="date" value={vehicleForm.lastServiceDate} onChange={e => setV("lastServiceDate", e.target.value)} className={inputClass} /></Field>
      </div>}
      <div className="flex justify-end gap-2 border-t border-[#eee9df] pt-4"><ActionButton variant="quiet" onClick={onClose}>Cancel</ActionButton><ActionButton type="submit" disabled={pending} testId="button-save-entity">{pending && <LoaderCircle className="h-3.5 w-3.5 animate-spin" />}{editing ? "Save changes" : `Add ${isDriver ? "driver" : "vehicle"}`}</ActionButton></div>
    </form>
  </DialogFrame>;
}

function Metric({ label, value, note, icon: Icon, accent = "orange" }: { label: string; value: string | number; note: string; icon: typeof Truck; accent?: "orange" | "green" | "blue" | "ink" }) {
  const accentClass = { orange: "bg-[#fbede5] text-[#d86332]", green: "bg-[#e7f1e8] text-[#527e58]", blue: "bg-[#e8eff1] text-[#537b83]", ink: "bg-[#edebe5] text-[#5e5e55]" }[accent];
  return <div className="relative overflow-hidden rounded-2xl border border-[#e6e0d6] bg-[#fffefa] p-4 shadow-[0_2px_10px_rgba(47,49,43,.025)] sm:p-5">
    <div className="flex items-start justify-between"><div><p className="text-[11px] font-semibold text-[#777367]">{label}</p><p className="mt-2 text-[28px] font-bold leading-none tracking-[-.045em] text-[#292a25]">{value}</p></div><span className={`flex h-9 w-9 items-center justify-center rounded-xl ${accentClass}`}><Icon className="h-4 w-4" /></span></div>
    <p className="mt-4 border-t border-[#f0ece5] pt-3 text-[10px] text-[#8c877c]">{note}</p>
  </div>;
}

function Overview({ summary, summaryLoading, summaryError, retrySummary, bookings, quotes, bookingsLoading, bookingsError, retryBookings, quotesLoading, quotesError, retryQuotes, navigate }: {
  summary?: { totalBookingsToday: number; activeVehicles: number; totalDrivers: number; totalMovesAllTime: number; totalRevenueMTD: number; pendingBookings: number; completedToday: number };
  summaryLoading: boolean; summaryError: boolean; retrySummary: () => void; bookings: Booking[]; quotes: Quote[];
  bookingsLoading: boolean; bookingsError: boolean; retryBookings: () => void; quotesLoading: boolean; quotesError: boolean; retryQuotes: () => void; navigate: (page: Page) => void;
}) {
  const recent = [...bookings].sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime()).slice(0, 5);
  const pendingQuotes = quotes.filter(q => q.status === "pending");
  if (summaryLoading) return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-[#f0ece4]" />)}</div>;
  return <div className="space-y-5">
    {summaryError ? <QueryState loading={false} error retry={retrySummary} label="overview" /> : summary ? <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Bookings today" value={summary.totalBookingsToday} note={`${summary.completedToday} completed today`} icon={CalendarDays} accent="orange" />
        <Metric label="Needs a booking" value={summary.pendingBookings} note="Bookings awaiting next step" icon={Clock3} accent="blue" />
        <Metric label="Fleet active" value={summary.activeVehicles} note="Vehicles currently on the road" icon={Truck} accent="green" />
        <Metric label="Monthly revenue" value={money(summary.totalRevenueMTD)} note="Month to date · excl. cancellations" icon={Euro} accent="ink" />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.4fr_.8fr]">
        <Panel>
          <PanelHeading eyebrow="Dispatch desk" title="Latest bookings" aside={<button onClick={() => navigate("bookings")} className="inline-flex items-center gap-1 text-xs font-semibold text-[#bc542d] hover:text-[#8f3d20]" data-testid="button-view-bookings">All bookings <ArrowRight className="h-3.5 w-3.5" /></button>} />
          {bookingsLoading || bookingsError ? <QueryState loading={bookingsLoading} error={bookingsError} retry={retryBookings} label="bookings" /> : recent.length ? <div className="divide-y divide-[#f0ece5]">{recent.map(b => <button key={b.id} onClick={() => navigate("bookings")} className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-[#fcfaf6] sm:px-6" data-testid={`overview-booking-${b.id}`}>
            <div className="min-w-0"><p className="truncate text-[13px] font-semibold text-[#383932]">{b.customerName}<span className="ml-2 font-mono text-[10px] font-medium text-[#aaa397]">#{b.id}</span></p><p className="mt-1 truncate text-[11px] text-[#888478]">{SERVICE_NAMES[b.serviceType] ?? readable(b.serviceType)} · {dateLabel(b.scheduledDate)}</p></div><StatusPill value={b.status} />
          </button>)}</div> : <EmptyState title="No bookings on file" detail="New bookings will appear here once a customer confirms a move." />}
        </Panel>
        <div className="space-y-5">
          <Panel><PanelHeading eyebrow="Work queue" title="Quotes to review" aside={<span className="rounded-full bg-[#fbede5] px-2.5 py-1 text-[11px] font-bold text-[#bd542b]">{pendingQuotes.length} pending</span>} />
            {quotesLoading || quotesError ? <QueryState loading={quotesLoading} error={quotesError} retry={retryQuotes} label="quotes" /> : <>
              {pendingQuotes.slice(0, 3).map(q => <div key={q.id} className="flex items-center justify-between gap-3 border-b border-[#f0ece5] px-5 py-3.5 last:border-0"><div className="min-w-0"><p className="truncate text-xs font-semibold text-[#393a34]">{q.customerName}</p><p className="mt-1 text-[10px] text-[#918b80]">{q.apartmentSize} · {money(q.estimatedPrice)}</p></div><StatusPill value={q.status} /></div>)}
              {!pendingQuotes.length && <EmptyState title="Queue is clear" detail="New quote requests will be listed here for review." />}
              {!!pendingQuotes.length && <button onClick={() => navigate("quotes")} className="flex w-full items-center justify-center gap-2 border-t border-[#eee9df] py-3 text-xs font-semibold text-[#bc542d] hover:bg-[#fcfaf6]" data-testid="button-review-quotes">Review quote requests <ArrowRight className="h-3.5 w-3.5" /></button>}
            </>}
          </Panel>
          <Panel className="p-5 sm:p-6"><div className="flex items-center gap-2 text-[#818073]"><Activity className="h-4 w-4" /><span className="text-[10px] font-bold uppercase tracking-[.15em]">Operations pulse</span></div><div className="mt-4 grid grid-cols-2 gap-4"><div><p className="text-2xl font-bold tracking-tight text-[#30312b]">{summary.totalDrivers}</p><p className="mt-1 text-[10px] text-[#8e897d]">Drivers in register</p></div><div><p className="text-2xl font-bold tracking-tight text-[#30312b]">{summary.totalMovesAllTime}</p><p className="mt-1 text-[10px] text-[#8e897d]">Moves all time</p></div></div><div className="mt-4 flex items-center gap-2 border-t border-[#f0ece5] pt-3 text-[10px] text-[#7e796e]"><ShieldCheck className="h-3.5 w-3.5 text-[#64886a]" /> Live figures from your operations data</div></Panel>
        </div>
      </div>
    </> : <EmptyState title="Overview unavailable" detail="There is no dashboard summary available yet." />}
  </div>;
}

function Bookings({ drivers, vehicles, onEdit }: { drivers: Driver[]; vehicles: Vehicle[]; onEdit: (booking: Booking) => void }) {
  const query = useListBookings();
  const [search, setSearch] = useState("");
  const rows = useMemo(() => (query.data ?? []).filter(b => `${b.customerName} ${b.customerEmail} ${b.pickupAddress} ${b.destinationAddress} ${b.id}`.toLowerCase().includes(search.toLowerCase())), [query.data, search]);
  return <Panel><PanelHeading eyebrow="Move coordination" title="Bookings" aside={<TableSearch value={search} onChange={setSearch} placeholder="Search bookings" />} />
    <QueryState loading={query.isLoading} error={query.isError} retry={() => query.refetch()} label="bookings" />
    {!query.isLoading && !query.isError && rows.length > 0 && <div className="overflow-x-auto"><table className="w-full min-w-[860px] text-left">
      <thead><tr className="border-b border-[#eee9df] text-[9px] font-bold uppercase tracking-[.13em] text-[#9a9488]"><th className="px-5 py-3 sm:px-6">Customer / route</th><th className="px-4 py-3">Move date</th><th className="px-4 py-3">Crew & vehicle</th><th className="px-4 py-3">Value</th><th className="px-4 py-3">Status</th><th className="px-5 py-3 sm:px-6"><span className="sr-only">Actions</span></th></tr></thead>
      <tbody className="divide-y divide-[#f0ece5]">{rows.map(b => {
        const driver = drivers.find(d => d.id === b.driverId); const vehicle = vehicles.find(v => v.id === b.vehicleId);
        return <tr key={b.id} className="transition-colors hover:bg-[#fcfaf6]" data-testid={`admin-booking-row-${b.id}`}>
          <td className="max-w-[280px] px-5 py-4 sm:px-6"><p className="text-[12px] font-semibold text-[#373832]">{b.customerName} <span className="ml-1 font-mono text-[10px] font-normal text-[#aaa397]">#{b.id}</span></p><p className="mt-1 truncate text-[10px] text-[#898478]">{b.pickupAddress} <span className="px-1 text-[#c1baad]">→</span>{b.destinationAddress}</p><p className="mt-1 text-[10px] text-[#aaa397]">{SERVICE_NAMES[b.serviceType] ?? readable(b.serviceType)} · {b.customerEmail}</p></td>
          <td className="px-4 py-4 text-[11px] text-[#65645b]">{dateLabel(b.scheduledDate)}</td>
          <td className="px-4 py-4"><p className="text-[11px] text-[#55564f]">{driver?.name ?? <span className="text-[#aaa397]">Unassigned</span>}</p><p className="mt-1 font-mono text-[10px] text-[#989286]">{vehicle?.plateNumber ?? "No vehicle"}</p></td>
          <td className="px-4 py-4 text-[12px] font-bold text-[#3e4039]">{money(b.totalPrice)}</td><td className="px-4 py-4"><StatusPill value={b.status} /></td>
          <td className="px-5 py-4 text-right sm:px-6"><button onClick={() => onEdit(b)} aria-label={`Edit booking ${b.id}`} className="rounded-lg p-2 text-[#7e796e] hover:bg-[#f1ece2] hover:text-[#bd542d]" data-testid={`button-edit-booking-${b.id}`}><Pencil className="h-3.5 w-3.5" /></button></td>
        </tr>;
      })}</tbody></table></div>}
    {!query.isLoading && !query.isError && !rows.length && <EmptyState title={search ? "No matching bookings" : "No bookings on file"} detail={search ? "Try another customer name, address, email or booking number." : "Confirmed customer moves will appear here."} />}
  </Panel>;
}

function Quotes({ onEdit }: { onEdit: (quote: Quote) => void }) {
  const query = useListQuotes();
  const [search, setSearch] = useState("");
  const rows = useMemo(() => (query.data ?? []).filter(q => `${q.customerName} ${q.customerEmail} ${q.pickupAddress} ${q.destinationAddress} ${q.id}`.toLowerCase().includes(search.toLowerCase())), [query.data, search]);
  return <Panel><PanelHeading eyebrow="Customer requests" title="Quote requests" aside={<TableSearch value={search} onChange={setSearch} placeholder="Search quote requests" />} />
    <QueryState loading={query.isLoading} error={query.isError} retry={() => query.refetch()} label="quotes" />
    {!query.isLoading && !query.isError && rows.length > 0 && <div className="overflow-x-auto"><table className="w-full min-w-[790px] text-left">
      <thead><tr className="border-b border-[#eee9df] text-[9px] font-bold uppercase tracking-[.13em] text-[#9a9488]"><th className="px-5 py-3 sm:px-6">Customer / route</th><th className="px-4 py-3">Move size</th><th className="px-4 py-3">Estimate</th><th className="px-4 py-3">Received</th><th className="px-4 py-3">Status</th><th className="px-5 py-3 sm:px-6"><span className="sr-only">Actions</span></th></tr></thead>
      <tbody className="divide-y divide-[#f0ece5]">{rows.map(q => <tr key={q.id} className="transition-colors hover:bg-[#fcfaf6]" data-testid={`admin-quote-row-${q.id}`}>
        <td className="max-w-[290px] px-5 py-4 sm:px-6"><p className="text-[12px] font-semibold text-[#373832]">{q.customerName} <span className="ml-1 font-mono text-[10px] font-normal text-[#aaa397]">#{q.id}</span></p><p className="mt-1 truncate text-[10px] text-[#898478]">{q.pickupAddress}<span className="px-1 text-[#c1baad]">→</span>{q.destinationAddress}</p><p className="mt-1 text-[10px] text-[#aaa397]">{q.customerEmail} · {q.customerPhone}</p></td>
        <td className="px-4 py-4 text-[11px] capitalize text-[#65645b]">{q.apartmentSize}<span className="mt-1 block text-[10px] text-[#aaa397]">{q.rooms} rooms</span></td><td className="px-4 py-4 text-[12px] font-bold text-[#3e4039]">{money(q.estimatedPrice)}</td><td className="px-4 py-4 text-[11px] text-[#65645b]">{dateLabel(q.createdAt)}</td><td className="px-4 py-4"><StatusPill value={q.status} /></td><td className="px-5 py-4 text-right sm:px-6"><button onClick={() => onEdit(q)} aria-label={`Edit quote ${q.id}`} className="rounded-lg p-2 text-[#7e796e] hover:bg-[#f1ece2] hover:text-[#bd542d]" data-testid={`button-edit-quote-${q.id}`}><Pencil className="h-3.5 w-3.5" /></button></td>
      </tr>)}</tbody></table></div>}
    {!query.isLoading && !query.isError && !rows.length && <EmptyState title={search ? "No matching quote requests" : "No quote requests"} detail={search ? "Try a different customer name, route or email address." : "Customer quote requests will appear here."} />}
  </Panel>;
}

function Drivers({ onEdit }: { onEdit: (driver?: Driver) => void }) {
  const query = useListDrivers(); const queryClient = useQueryClient(); const remove = useDeleteDriver(); const { toast } = useToast();
  const [search, setSearch] = useState("");
  const rows = useMemo(() => (query.data ?? []).filter(d => `${d.name} ${d.city} ${d.email} ${d.phone}`.toLowerCase().includes(search.toLowerCase())), [query.data, search]);
  const del = (driver: Driver) => {
    if (!window.confirm(`Remove ${driver.name} from the driver register?`)) return;
    remove.mutate({ id: driver.id }, { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListDriversQueryKey() }); toast({ title: "Driver removed", description: `${driver.name} has been removed from the register.` }); }, onError: error => toast({ title: "Couldn’t remove driver", description: mutationRecovery(error, "This driver may still be assigned to a booking."), variant: "destructive" }) });
  };
  return <Panel><PanelHeading eyebrow="People & availability" title="Drivers" aside={<div className="flex w-full flex-wrap gap-2 sm:w-auto"><TableSearch value={search} onChange={setSearch} placeholder="Search drivers" /><ActionButton onClick={() => onEdit()}><Plus className="h-3.5 w-3.5" />Add driver</ActionButton></div>} />
    <QueryState loading={query.isLoading} error={query.isError} retry={() => query.refetch()} label="drivers" />
    {!query.isLoading && !query.isError && rows.length > 0 && <div className="overflow-x-auto"><table className="w-full min-w-[730px] text-left"><thead><tr className="border-b border-[#eee9df] text-[9px] font-bold uppercase tracking-[.13em] text-[#9a9488]"><th className="px-5 py-3 sm:px-6">Driver</th><th className="px-4 py-3">Contact</th><th className="px-4 py-3">Location</th><th className="px-4 py-3">Experience</th><th className="px-4 py-3">Availability</th><th className="px-5 py-3 sm:px-6"><span className="sr-only">Actions</span></th></tr></thead>
      <tbody className="divide-y divide-[#f0ece5]">{rows.map(d => <tr key={d.id} className="transition-colors hover:bg-[#fcfaf6]" data-testid={`admin-driver-row-${d.id}`}>
        <td className="px-5 py-4 sm:px-6"><div className="flex items-center gap-3">{d.avatarUrl ? <img src={d.avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" /> : <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f7e9dd] text-xs font-bold text-[#b45c36]">{d.name.split(/\s+/).map(part => part[0]).slice(0, 2).join("").toUpperCase()}</span>}<div><p className="text-[12px] font-semibold text-[#373832]">{d.name}</p><p className="mt-1 text-[10px] text-[#aaa397]">Licence {d.licenseNumber}</p></div></div></td>
        <td className="px-4 py-4"><p className="text-[11px] text-[#56574f]">{d.phone}</p><p className="mt-1 text-[10px] text-[#989286]">{d.email}</p></td><td className="px-4 py-4 text-[11px] text-[#65645b]">{d.city}</td>
        <td className="px-4 py-4"><div className="flex items-center gap-1 text-[11px] font-semibold text-[#5b584e]"><Star className="h-3 w-3 fill-[#e5a24f] text-[#e5a24f]" />{d.rating}</div><p className="mt-1 text-[10px] text-[#989286]">{d.totalMoves} moves</p></td><td className="px-4 py-4"><StatusPill value={d.status} /></td>
        <td className="px-5 py-4 text-right sm:px-6"><div className="flex justify-end gap-1"><button onClick={() => onEdit(d)} aria-label={`Edit ${d.name}`} className="rounded-lg p-2 text-[#7e796e] hover:bg-[#f1ece2] hover:text-[#bd542d]" data-testid={`button-edit-driver-${d.id}`}><Pencil className="h-3.5 w-3.5" /></button><button onClick={() => del(d)} disabled={remove.isPending} aria-label={`Remove ${d.name}`} className="rounded-lg p-2 text-[#9b9287] hover:bg-rose-50 hover:text-rose-700" data-testid={`button-delete-driver-${d.id}`}><Trash2 className="h-3.5 w-3.5" /></button></div></td>
      </tr>)}</tbody></table></div>}
    {!query.isLoading && !query.isError && !rows.length && <EmptyState title={search ? "No matching drivers" : "No drivers in the register"} detail={search ? "Try another name, city or contact detail." : "Add your first driver to manage crew assignments."} />}
    {remove.isPending && <p role="status" className="px-5 pb-3 text-[11px] text-[#8b8579]">Removing driver…</p>}
  </Panel>;
}

function Vehicles({ onEdit }: { onEdit: (vehicle?: Vehicle) => void }) {
  const query = useListVehicles(); const queryClient = useQueryClient(); const remove = useDeleteVehicle(); const { toast } = useToast();
  const [search, setSearch] = useState("");
  const rows = useMemo(() => (query.data ?? []).filter(v => `${v.plateNumber} ${v.model} ${v.currentCity} ${v.type}`.toLowerCase().includes(search.toLowerCase())), [query.data, search]);
  const del = (vehicle: Vehicle) => {
    if (!window.confirm(`Remove vehicle ${vehicle.plateNumber} from the fleet?`)) return;
    remove.mutate({ id: vehicle.id }, { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListVehiclesQueryKey() }); toast({ title: "Vehicle removed", description: `${vehicle.plateNumber} has been removed from the fleet.` }); }, onError: error => toast({ title: "Couldn’t remove vehicle", description: mutationRecovery(error, "This vehicle may still be assigned to a booking."), variant: "destructive" }) });
  };
  return <Panel><PanelHeading eyebrow="Fleet register" title="Vehicles" aside={<div className="flex w-full flex-wrap gap-2 sm:w-auto"><TableSearch value={search} onChange={setSearch} placeholder="Search vehicles" /><ActionButton onClick={() => onEdit()}><Plus className="h-3.5 w-3.5" />Add vehicle</ActionButton></div>} />
    <QueryState loading={query.isLoading} error={query.isError} retry={() => query.refetch()} label="vehicles" />
    {!query.isLoading && !query.isError && rows.length > 0 && <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left"><thead><tr className="border-b border-[#eee9df] text-[9px] font-bold uppercase tracking-[.13em] text-[#9a9488]"><th className="px-5 py-3 sm:px-6">Vehicle</th><th className="px-4 py-3">Class / capacity</th><th className="px-4 py-3">Location</th><th className="px-4 py-3">Fuel</th><th className="px-4 py-3">Service</th><th className="px-4 py-3">Status</th><th className="px-5 py-3 sm:px-6"><span className="sr-only">Actions</span></th></tr></thead>
      <tbody className="divide-y divide-[#f0ece5]">{rows.map(v => <tr key={v.id} className="transition-colors hover:bg-[#fcfaf6]" data-testid={`admin-vehicle-row-${v.id}`}>
        <td className="px-5 py-4 sm:px-6"><p className="font-mono text-[12px] font-bold tracking-wide text-[#373832]">{v.plateNumber}</p><p className="mt-1 text-[10px] text-[#989286]">{v.model}</p></td><td className="px-4 py-4 text-[11px] capitalize text-[#65645b]">{readable(v.type)}<p className="mt-1 text-[10px] text-[#989286]">{v.capacity} · {Number(v.mileage).toLocaleString("de-AT")} km</p></td>
        <td className="px-4 py-4 text-[11px] text-[#65645b]"><span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3 text-[#b2a99a]" />{v.currentCity}</span></td>
        <td className="px-4 py-4"><div className="flex items-center gap-2"><div className="h-1.5 w-14 overflow-hidden rounded-full bg-[#ece7dd]"><div className={`h-full rounded-full ${v.fuelLevel < 20 ? "bg-[#ca6848]" : "bg-[#789171]"}`} style={{ width: `${Math.max(0, Math.min(100, v.fuelLevel))}%` }} /></div><span className="text-[10px] tabular-nums text-[#6b695f]">{v.fuelLevel}%</span></div></td><td className="px-4 py-4 text-[10px] text-[#6f6b61]">{dateLabel(v.lastServiceDate)}</td><td className="px-4 py-4"><StatusPill value={v.status} /></td>
        <td className="px-5 py-4 text-right sm:px-6"><div className="flex justify-end gap-1"><button onClick={() => onEdit(v)} aria-label={`Edit ${v.plateNumber}`} className="rounded-lg p-2 text-[#7e796e] hover:bg-[#f1ece2] hover:text-[#bd542d]" data-testid={`button-edit-vehicle-${v.id}`}><Pencil className="h-3.5 w-3.5" /></button><button onClick={() => del(v)} disabled={remove.isPending} aria-label={`Remove ${v.plateNumber}`} className="rounded-lg p-2 text-[#9b9287] hover:bg-rose-50 hover:text-rose-700" data-testid={`button-delete-vehicle-${v.id}`}><Trash2 className="h-3.5 w-3.5" /></button></div></td>
      </tr>)}</tbody></table></div>}
    {!query.isLoading && !query.isError && !rows.length && <EmptyState title={search ? "No matching vehicles" : "No vehicles in the fleet"} detail={search ? "Try another plate, model, vehicle class or city." : "Add your first vehicle to begin managing fleet availability."} />}
    {remove.isPending && <p role="status" className="px-5 pb-3 text-[11px] text-[#8b8579]">Removing vehicle…</p>}
  </Panel>;
}

function getHttpStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null || !("status" in error)) return undefined;
  const status = (error as { status?: unknown }).status;
  return typeof status === "number" ? status : undefined;
}

function AccessRecovery({ status, retry }: { status: 401 | 403 | 503; retry: () => void }) {
  const content = status === 503
    ? {
      heading: "Owner access isn’t configured",
      detail: "Carryfox is missing the owner email configuration required for the operations workspace. Records are withheld until owner access can be verified.",
      action: "Ask the platform administrator to configure the owner email for this deployment, then retry.",
    }
    : status === 401
      ? {
        heading: "Sign in to continue",
        detail: "Your session has expired or you are signed out. The admin workspace requires an authenticated account.",
        action: "Sign in through Carryfox’s existing sign-in flow, then return to /admin.",
      }
      : {
        heading: "This account doesn’t have owner access",
        detail: "You are signed in, but this account is not the configured Carryfox owner. Operational records remain protected.",
        action: "Sign out and use the configured owner account. If you are the owner, ask the platform administrator to verify the owner email setting.",
      };
  return <main className="flex min-h-[100dvh] items-center justify-center bg-[#f5f2eb] px-5 py-10">
    <section role="alert" className="w-full max-w-lg rounded-2xl border border-[#e6e0d6] bg-[#fffefa] p-6 shadow-[0_8px_30px_rgba(47,49,43,.07)] sm:p-8">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#fbede5] text-[#bc542d]"><ShieldCheck className="h-5 w-5" /></span>
      <p className="mt-5 text-[10px] font-bold uppercase tracking-[.17em] text-[#a09a8e]">Carryfox · Operations</p>
      <h1 className="mt-2 text-2xl font-bold tracking-[-.04em] text-[#292a25]">{content.heading}</h1>
      <p className="mt-3 text-sm leading-6 text-[#706c61]">{content.detail}</p>
      <div className="mt-5 rounded-xl border border-[#eee9df] bg-[#f8f5ef] p-4"><p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#a09a8e]">How to get access</p><p className="mt-2 text-xs leading-5 text-[#5f5d54]">{content.action}</p></div>
      <div className="mt-5"><ActionButton onClick={retry} variant="quiet" testId="button-retry-admin-access"><RefreshCw className="h-3.5 w-3.5" />Retry access</ActionButton></div>
    </section>
  </main>;
}

export default function Admin() {
  const [activePage, setActivePage] = useState<Page>("overview");
  const [dialog, setDialog] = useState<EntityDialog>(null);
  const [bookingToEdit, setBookingToEdit] = useState<Booking | null>(null);
  const [quoteToEdit, setQuoteToEdit] = useState<Quote | null>(null);
  const [mobileNav, setMobileNav] = useState(false);
  const queryClient = useQueryClient();
  const summaryQuery = useGetDashboardSummary();
  const bookingQuery = useListBookings();
  const quoteQuery = useListQuotes();
  const driverQuery = useListDrivers();
  const vehicleQuery = useListVehicles();
  const accessStatus = [summaryQuery.error, bookingQuery.error, quoteQuery.error, driverQuery.error, vehicleQuery.error]
    .map(getHttpStatus)
    .find((status): status is 401 | 403 | 503 => status === 503 || status === 401 || status === 403);
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListQuotesQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListDriversQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListVehiclesQueryKey() });
  };
  const counts: Partial<Record<Page, number>> = {
    bookings: bookingQuery.data?.length,
    quotes: quoteQuery.data?.filter(q => q.status === "pending").length,
    drivers: driverQuery.data?.length,
    vehicles: vehicleQuery.data?.length,
  };
  const pageInfo = NAV.find(item => item.key === activePage)!;
  const selectPage = (page: Page) => { setActivePage(page); setMobileNav(false); };
  const setDriverDialog = (record?: Driver) => setDialog({ kind: "driver", record });
  const setVehicleDialog = (record?: Vehicle) => setDialog({ kind: "vehicle", record });
  const retryAll = () => {
    summaryQuery.refetch();
    bookingQuery.refetch();
    quoteQuery.refetch();
    driverQuery.refetch();
    vehicleQuery.refetch();
  };

  if (accessStatus) return <AccessRecovery status={accessStatus} retry={retryAll} />;

  return <div className="min-h-[100dvh] bg-[#f5f2eb] text-[#292a25]">
    <div className="mx-auto flex min-h-[100dvh] max-w-[1680px]">
      <aside className="hidden w-[248px] shrink-0 flex-col border-r border-[#e7e1d6] bg-[#fbf9f4] px-4 py-6 md:flex">
        <div className="mb-9 px-3"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e36a37] text-white shadow-sm"><Truck className="h-[18px] w-[18px]" /></div><div><p className="text-[16px] font-extrabold tracking-[-.055em] text-[#292a25]">carryfox</p><p className="text-[9px] font-semibold uppercase tracking-[.17em] text-[#989286]">Operations</p></div></div></div>
        <p className="mb-2 px-3 text-[9px] font-bold uppercase tracking-[.18em] text-[#aaa397]">Workspace</p>
        <nav aria-label="Admin navigation" className="space-y-1">{NAV.map(item => {
          const Icon = item.icon; const active = item.key === activePage;
          return <button key={item.key} onClick={() => selectPage(item.key)} aria-current={active ? "page" : undefined} className={`group flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-[12px] font-semibold transition-colors ${active ? "bg-[#f8e9df] text-[#b74c25]" : "text-[#777468] hover:bg-[#f2eee6] hover:text-[#393a34]"}`} data-testid={`admin-tab-${item.key}`}><Icon className="h-4 w-4" /><span>{item.name}</span>{counts[item.key] != null && <span className={`ml-auto font-mono text-[10px] ${active ? "text-[#b74c25]" : "text-[#a19b8f]"}`}>{counts[item.key]}</span>}</button>;
        })}</nav>
        <div className="mt-auto space-y-3 px-1">
          <div className="rounded-xl border border-[#ead6c7] bg-[#fbefe6] p-4"><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.11em] text-[#b9572e]"><Euro className="h-3.5 w-3.5" />Booked value · month to date</div>{summaryQuery.isLoading ? <div className="mt-3 h-7 w-24 animate-pulse rounded bg-[#eedfd4]" /> : summaryQuery.data ? <><p className="mt-2 text-[22px] font-bold tracking-[-.05em] text-[#703c27]">{money(summaryQuery.data.totalRevenueMTD)}</p><p className="mt-1 text-[9px] text-[#947f70]">Non-cancelled bookings created this month</p></> : <button onClick={() => summaryQuery.refetch()} className="mt-2 text-[10px] font-semibold text-[#a14b2a]">Retry summary</button>}</div>
          <div className="flex items-center justify-between px-3 text-[9px] text-[#a19b8e]"><span>Carryfox · Austria</span><span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-[#79a279]" />Live data</span></div>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-4 pb-10 pt-4 sm:px-6 lg:px-10 lg:pt-8">
        <header className="mb-7 flex items-center justify-between gap-3 border-b border-[#e7e1d6] pb-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileNav(current => !current)} aria-label="Toggle navigation" aria-expanded={mobileNav} className="rounded-lg border border-[#e4ded3] bg-[#fffefa] p-2 text-[#5a594f] md:hidden" data-testid="button-mobile-navigation"><Menu className="h-4 w-4" /></button>
            <div><p className="text-[9px] font-bold uppercase tracking-[.18em] text-[#a19b8e]">Carryfox / Operations</p><h1 className="mt-1 text-[21px] font-bold tracking-[-.045em] text-[#292a25] sm:text-[25px]">{pageInfo.name}</h1></div>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-[#e6e0d6] bg-[#fffefa] px-3 py-2 text-[10px] font-medium text-[#79766b] sm:flex"><span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#8eaa83] opacity-50" /><span className="relative inline-flex h-2 w-2 rounded-full bg-[#73936a]" /></span>Data synced</div>
        </header>
        {mobileNav && <nav aria-label="Admin navigation" className="mb-5 grid grid-cols-2 gap-2 rounded-xl border border-[#e7e1d6] bg-[#fffefa] p-2 md:hidden">{NAV.map(item => { const Icon = item.icon; return <button key={item.key} onClick={() => selectPage(item.key)} className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-semibold ${activePage === item.key ? "bg-[#f8e9df] text-[#b74c25]" : "text-[#777468] hover:bg-[#f6f2ea]"}`} data-testid={`mobile-admin-tab-${item.key}`}><Icon className="h-4 w-4" />{item.name}{counts[item.key] != null && <span className="ml-auto font-mono text-[10px]">{counts[item.key]}</span>}</button>; })}</nav>}
        <motion.div key={activePage} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .2 }}>
          {activePage === "overview" && <Overview summary={summaryQuery.data} summaryLoading={summaryQuery.isLoading} summaryError={summaryQuery.isError} retrySummary={() => summaryQuery.refetch()} bookings={bookingQuery.data ?? []} quotes={quoteQuery.data ?? []} bookingsLoading={bookingQuery.isLoading} bookingsError={bookingQuery.isError} retryBookings={() => bookingQuery.refetch()} quotesLoading={quoteQuery.isLoading} quotesError={quoteQuery.isError} retryQuotes={() => quoteQuery.refetch()} navigate={selectPage} />}
          {activePage === "bookings" && <Bookings drivers={driverQuery.data ?? []} vehicles={vehicleQuery.data ?? []} onEdit={setBookingToEdit} />}
          {activePage === "quotes" && <Quotes onEdit={setQuoteToEdit} />}
          {activePage === "drivers" && <Drivers onEdit={setDriverDialog} />}
          {activePage === "vehicles" && <Vehicles onEdit={setVehicleDialog} />}
        </motion.div>
        <footer className="mt-7 flex items-center justify-between border-t border-[#e7e1d6] pt-4 text-[9px] text-[#aaa397]"><span>Carryfox operations desk</span><span>All amounts in EUR · Dates in local Austrian time</span></footer>
      </main>
    </div>
    {bookingToEdit && <BookingEditor key={bookingToEdit.id} booking={bookingToEdit} drivers={driverQuery.data ?? []} vehicles={vehicleQuery.data ?? []} onClose={() => setBookingToEdit(null)} refresh={refresh} />}
    {quoteToEdit && <QuoteEditor key={quoteToEdit.id} quote={quoteToEdit} onClose={() => setQuoteToEdit(null)} refresh={refresh} />}
    {dialog && <EntityForm key={`${dialog.kind}-${dialog.record?.id ?? "new"}`} dialog={dialog} onClose={() => setDialog(null)} refresh={refresh} />}
  </div>;
}
