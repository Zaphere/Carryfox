import { Router, type IRouter } from "express";
import { eq, desc, gte, sql } from "drizzle-orm";
import { db, bookingsTable } from "@workspace/db";
import {
  CreateBookingBody,
  GetBookingParams,
  GetBookingResponse,
  UpdateBookingParams,
  UpdateBookingBody,
  UpdateBookingResponse,
  ListBookingsResponse,
  GetRecentBookingsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/bookings", async (_req, res): Promise<void> => {
  const bookings = await db.select().from(bookingsTable).orderBy(desc(bookingsTable.createdAt));
  res.json(ListBookingsResponse.parse(bookings));
});

router.post("/bookings", async (req, res): Promise<void> => {
  const parsed = CreateBookingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [booking] = await db.insert(bookingsTable).values(parsed.data).returning();
  res.status(201).json(GetBookingResponse.parse(booking));
});

router.get("/bookings/:id", async (req, res): Promise<void> => {
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

router.patch("/bookings/:id", async (req, res): Promise<void> => {
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
