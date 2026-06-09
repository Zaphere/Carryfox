import { Router, type IRouter } from "express";
import { eq, inArray } from "drizzle-orm";
import { db, bookingsTable, driversTable, vehiclesTable } from "@workspace/db";
import {
  GetTrackingParams,
  GetTrackingResponse,
  ListActiveTrackingResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const AUSTRIAN_CITIES: Record<string, { lat: number; lng: number }> = {
  Vienna: { lat: 48.2082, lng: 16.3738 },
  Graz: { lat: 47.0707, lng: 15.4395 },
  Salzburg: { lat: 47.8095, lng: 13.055 },
  Linz: { lat: 48.3064, lng: 14.2858 },
  Innsbruck: { lat: 47.2692, lng: 11.4041 },
};

function buildTrackingInfo(booking: typeof bookingsTable.$inferSelect, driver: typeof driversTable.$inferSelect | null, vehicle: typeof vehiclesTable.$inferSelect | null) {
  const city = vehicle?.currentCity ?? "Vienna";
  const coords = AUSTRIAN_CITIES[city] ?? AUSTRIAN_CITIES["Vienna"];
  const jitterLat = (Math.random() - 0.5) * 0.05;
  const jitterLng = (Math.random() - 0.5) * 0.05;

  const statusProgress: Record<string, number> = {
    confirmed: 5,
    crew_assigned: 15,
    loading: 30,
    on_route: 60,
    arriving: 85,
    completed: 100,
    cancelled: 0,
  };

  const weatherConditions = ["Clear", "Partly Cloudy", "Overcast", "Light Rain"];
  const weather = weatherConditions[Math.floor(Math.random() * weatherConditions.length)];

  const eta = new Date(Date.now() + Math.random() * 90 * 60 * 1000);

  const progress = statusProgress[booking.status] ?? 50;
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
    currentLat: (vehicle?.currentLat ?? coords.lat) + jitterLat,
    currentLng: (vehicle?.currentLng ?? coords.lng) + jitterLng,
    routeProgress: progress,
    weatherCondition: weather,
    hasTrafficDelay: Math.random() < 0.2,
    updatedAt: new Date().toISOString(),
  };
}

router.get("/tracking/active", async (_req, res): Promise<void> => {
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
