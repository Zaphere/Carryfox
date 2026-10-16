import { Router, type IRouter } from "express";
import { desc, eq, inArray, sql } from "drizzle-orm";
import { db, bookingsTable, driversTable, vehiclesTable } from "@workspace/db";
import {
  GetTrackingParams,
  GetTrackingResponse,
  ListActiveTrackingResponse,
  LookupBookingsQueryParams,
  LookupBookingsResponse,
} from "@workspace/api-zod";
import { requireOwner } from "../middlewares/requireOwner";

const router: IRouter = Router();

const AUSTRIAN_CITIES: Record<string, { lat: number; lng: number }> = {
  Vienna: { lat: 48.2082, lng: 16.3738 },
  Graz: { lat: 47.0707, lng: 15.4395 },
  Salzburg: { lat: 47.8095, lng: 13.055 },
  Linz: { lat: 48.3064, lng: 14.2858 },
  Innsbruck: { lat: 47.2692, lng: 11.4041 },
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function buildTrackingInfo(booking: typeof bookingsTable.$inferSelect, driver: typeof driversTable.$inferSelect | null, vehicle: typeof vehiclesTable.$inferSelect | null) {
  const statusProgress: Record<string, number> = {
    confirmed: 5,
    crew_assigned: 15,
    loading: 30,
    on_route: 60,
    arriving: 85,
    completed: 100,
    cancelled: 0,
  };

  const progress = statusProgress[booking.status] ?? 50;

  // Route coordinates captured at booking time (from address autocomplete).
  const pickup = booking.pickupLat != null && booking.pickupLng != null
    ? { lat: booking.pickupLat, lng: booking.pickupLng }
    : null;
  const destination = booking.destinationLat != null && booking.destinationLng != null
    ? { lat: booking.destinationLat, lng: booking.destinationLng }
    : null;

  let currentLat: number;
  let currentLng: number;
  if (pickup && destination) {
    // Simulated truck sits ON the route: interpolate pickup → destination by
    // status progress, with a tiny jitter (~100-200 m) so refreshes look alive.
    const t = Math.min(1, Math.max(0, progress / 100));
    currentLat = lerp(pickup.lat, destination.lat, t) + (Math.random() - 0.5) * 0.002;
    currentLng = lerp(pickup.lng, destination.lng, t) + (Math.random() - 0.5) * 0.002;
  } else {
    // No stored coordinates (manual/admin bookings, legacy rows): fall back to
    // the vehicle's city so a position still renders.
    const city = vehicle?.currentCity ?? "Vienna";
    const fallback = AUSTRIAN_CITIES[city] ?? AUSTRIAN_CITIES["Vienna"];
    currentLat = (vehicle?.currentLat ?? fallback.lat) + (Math.random() - 0.5) * 0.05;
    currentLng = (vehicle?.currentLng ?? fallback.lng) + (Math.random() - 0.5) * 0.05;
  }

  const weatherConditions = ["Clear", "Partly Cloudy", "Overcast", "Light Rain"];
  const weather = weatherConditions[Math.floor(Math.random() * weatherConditions.length)];

  // ETA derived from progress so it always matches the truck's position.
  const minutesRemaining = Math.round((100 - progress) * 1.2);
  const eta = new Date(Date.now() + minutesRemaining * 60 * 1000);

  const distanceRemaining = Math.max(0, Math.round((100 - progress) * 0.5 * 10) / 10);
  const speed = booking.status === "on_route" ? Math.round(40 + Math.random() * 50) : booking.status === "arriving" ? Math.round(20 + Math.random() * 20) : 0;

  return {
    bookingId: booking.id,
    status: booking.status,
    driverName: driver?.name ?? "Unassigned",
    driverPhone: driver?.phone ?? "+43 000 000 0000",
    vehiclePlate: vehicle?.plateNumber ?? "W-XXX-00",
    pickupAddress: booking.pickupAddress,
    destinationAddress: booking.destinationAddress,
    estimatedArrival: eta.toISOString(),
    distanceRemaining,
    currentSpeed: speed,
    currentLat,
    currentLng,
    routeProgress: progress,
    weatherCondition: weather,
    hasTrafficDelay: Math.random() < 0.2,
    updatedAt: new Date().toISOString(),
    pickupLat: pickup?.lat ?? null,
    pickupLng: pickup?.lng ?? null,
    destinationLat: destination?.lat ?? null,
    destinationLng: destination?.lng ?? null,
  };
}

router.get("/tracking/active", requireOwner, async (_req, res): Promise<void> => {
  const activeStatuses = ["crew_assigned", "loading", "on_route", "arriving"];
  const bookings = await db
    .select()
    .from(bookingsTable)
    .where(inArray(bookingsTable.status, activeStatuses));

  const results = await Promise.all(
    bookings.map(async (booking) => {
      const [driver] = booking.driverId
        ? await db.select().from(driversTable).where(eq(driversTable.id, booking.driverId))
        : [null];
      const [vehicle] = booking.vehicleId
        ? await db.select().from(vehiclesTable).where(eq(vehiclesTable.id, booking.vehicleId))
        : [null];
      return buildTrackingInfo(booking, driver ?? null, vehicle ?? null);
    })
  );

  res.json(ListActiveTrackingResponse.parse(results));
});

// Recovery for lost tracking references: search by the email and/or phone
// supplied at booking time — at least one is required; when both are given,
// both must match. Must be registered BEFORE /tracking/:bookingId, otherwise
// "lookup" is parsed as a booking ID.
router.get("/tracking/lookup", async (req, res): Promise<void> => {
  const query = LookupBookingsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const email = (query.data.email ?? "").trim();
  const phone = (query.data.phone ?? "").trim();
  if (!email && !phone) {
    res.status(400).json({ error: "Provide an email, a phone number, or both" });
    return;
  }

  // Candidates: filter server-side by email when given (cheap); for a
  // phone-only search, take the most recent bookings and filter below.
  const candidates = email
    ? await db
        .select()
        .from(bookingsTable)
        .where(sql`lower(${bookingsTable.customerEmail}) = lower(${email})`)
        .orderBy(desc(bookingsTable.createdAt))
        .limit(50)
    : await db
        .select()
        .from(bookingsTable)
        .orderBy(desc(bookingsTable.createdAt))
        .limit(200);

  // Phone is compared on normalized digits so "+43 660 123 4567",
  // "0660 1234567" and "6601234567" all still match.
  const normalizePhone = (raw: string): string => {
    let d = raw.replace(/\D/g, "");
    if (d.startsWith("00")) d = d.slice(2); // international prefix
    if (d.startsWith("43") && d.length >= 10) d = d.slice(2); // Austrian country code
    if (d.startsWith("0")) d = d.slice(1); // national trunk prefix
    return d;
  };
  const wanted = phone ? normalizePhone(phone) : null;
  const phoneMatches = (actualRaw: string): boolean => {
    if (wanted == null) return true; // no phone given — don't filter on it
    const actual = normalizePhone(actualRaw);
    if (!actual) return false;
    return actual === wanted || actual.endsWith(wanted) || wanted.endsWith(actual);
  };

  // Email candidates were already matched in SQL (case-insensitive); when
  // only a phone was given, the filter above is the sole matcher.
  const matches = candidates.filter((row) => phoneMatches(row.customerPhone));

  res.json(
    LookupBookingsResponse.parse(
      matches.slice(0, 10).map((row) => ({
        bookingId: row.id,
        status: row.status,
        pickupAddress: row.pickupAddress,
        destinationAddress: row.destinationAddress,
        scheduledDate: row.scheduledDate,
        serviceType: row.serviceType,
        createdAt: row.createdAt,
      })),
    ),
  );
});

router.get("/tracking/:bookingId", async (req, res): Promise<void> => {
  const params = GetTrackingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [booking] = await db
    .select()
    .from(bookingsTable)
    .where(eq(bookingsTable.id, params.data.bookingId));

  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  const [driver] = booking.driverId
    ? await db.select().from(driversTable).where(eq(driversTable.id, booking.driverId))
    : [null];
  const [vehicle] = booking.vehicleId
    ? await db.select().from(vehiclesTable).where(eq(vehiclesTable.id, booking.vehicleId))
    : [null];

  res.json(GetTrackingResponse.parse(buildTrackingInfo(booking, driver ?? null, vehicle ?? null)));
});

export default router;
