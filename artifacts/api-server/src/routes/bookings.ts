import { Router, type IRouter } from "express";
import { eq, desc, gte, sql } from "drizzle-orm";
import { db, bookingsTable } from "@workspace/db";
import {
  CreateBookingBody,
  DeleteBookingParams,
  GetBookingParams,
  GetBookingResponse,
  UpdateBookingParams,
  UpdateBookingBody,
  UpdateBookingResponse,
  ListBookingsResponse,
  GetRecentBookingsResponse,
} from "@workspace/api-zod";
import { requireOwner } from "../middlewares/requireOwner";

const router: IRouter = Router();

// Best-effort server-side geocoding for bookings created without coordinates
// (admin manual entry, hand-typed addresses). Failure just stores null — the
// tracking page geocodes client-side as a fallback.
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const params = new URLSearchParams({ q: address, format: "json", limit: "1" });
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${NOMINATIM_URL}?${params}`, {
      headers: { "User-Agent": "Carryfox.at/1.0 (info@carryfox.at)" },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (!data[0]) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

router.get("/bookings", requireOwner, async (_req, res): Promise<void> => {
  const bookings = await db.select().from(bookingsTable).orderBy(desc(bookingsTable.createdAt));
  res.json(ListBookingsResponse.parse(bookings));
});

router.post("/bookings", async (req, res): Promise<void> => {
  const parsed = CreateBookingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const data = parsed.data;
  // Fill in any missing coordinates so the tracking map always has a real
  // route. Skip geocoding when the client already sent coordinates.
  const [pickup, destination] = await Promise.all([
    data.pickupLat == null ? geocodeAddress(data.pickupAddress) : Promise.resolve(null),
    data.destinationLat == null ? geocodeAddress(data.destinationAddress) : Promise.resolve(null),
  ]);

  const [booking] = await db
    .insert(bookingsTable)
    .values({
      ...data,
      pickupLat: data.pickupLat ?? pickup?.lat ?? null,
      pickupLng: data.pickupLng ?? pickup?.lng ?? null,
      destinationLat: data.destinationLat ?? destination?.lat ?? null,
      destinationLng: data.destinationLng ?? destination?.lng ?? null,
    })
    .returning();
  res.status(201).json(GetBookingResponse.parse(booking));
});

router.get("/bookings/:id", requireOwner, async (req, res): Promise<void> => {
  const params = GetBookingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, params.data.id));
  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  res.json(GetBookingResponse.parse(booking));
});

router.patch("/bookings/:id", requireOwner, async (req, res): Promise<void> => {
  const params = UpdateBookingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateBookingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [booking] = await db
    .update(bookingsTable)
    .set(parsed.data)
    .where(eq(bookingsTable.id, params.data.id))
    .returning();

  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  res.json(UpdateBookingResponse.parse(booking));
});

router.delete("/bookings/:id", requireOwner, async (req, res): Promise<void> => {
  const params = DeleteBookingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(bookingsTable)
    .where(eq(bookingsTable.id, params.data.id))
    .returning({ id: bookingsTable.id });

  if (!deleted) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  res.sendStatus(204);
});

export { router as bookingsRouter };

// Recent bookings handler (used by dashboard)
export async function getRecentBookingsData() {
  const bookings = await db
    .select()
    .from(bookingsTable)
    .orderBy(desc(bookingsTable.createdAt))
    .limit(10);
  return GetRecentBookingsResponse.parse(bookings);
}

export default router;
