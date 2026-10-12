import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, bookingsTable, driversTable } from "@workspace/db";
import {
  CreateDriverBody,
  DeleteDriverParams,
  GetDriverParams,
  GetDriverResponse,
  ListDriversResponse,
  UpdateDriverBody,
  UpdateDriverParams,
} from "@workspace/api-zod";
import { requireOwner } from "../middlewares/requireOwner";

const router: IRouter = Router();

router.get("/drivers", requireOwner, async (_req, res): Promise<void> => {
  const drivers = await db.select().from(driversTable).orderBy(driversTable.name);
  res.json(ListDriversResponse.parse(drivers));
});

router.post("/drivers", requireOwner, async (req, res): Promise<void> => {
  const parsed = CreateDriverBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [driver] = await db.insert(driversTable).values(parsed.data).returning();
  res.status(201).json(GetDriverResponse.parse(driver));
});

router.get("/drivers/:id", requireOwner, async (req, res): Promise<void> => {
  const params = GetDriverParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [driver] = await db.select().from(driversTable).where(eq(driversTable.id, params.data.id));
  if (!driver) {
    res.status(404).json({ error: "Driver not found" });
    return;
  }

  res.json(GetDriverResponse.parse(driver));
});

router.patch("/drivers/:id", requireOwner, async (req, res): Promise<void> => {
  const params = UpdateDriverParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateDriverBody.safeParse(req.body);
  if (!parsed.success || Object.keys(parsed.data ?? {}).length === 0) {
    res.status(400).json({ error: parsed.success ? "Provide at least one field to update." : parsed.error.message });
    return;
  }

  const [driver] = await db
    .update(driversTable)
    .set(parsed.data)
    .where(eq(driversTable.id, params.data.id))
    .returning();

  if (!driver) {
    res.status(404).json({ error: "Driver not found" });
    return;
  }

  res.json(GetDriverResponse.parse(driver));
});

router.delete("/drivers/:id", requireOwner, async (req, res): Promise<void> => {
  const params = DeleteDriverParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const assignedBooking = await db
    .select({ id: bookingsTable.id })
    .from(bookingsTable)
    .where(eq(bookingsTable.driverId, params.data.id))
    .limit(1);

  if (assignedBooking.length > 0) {
    res.status(409).json({ error: "This driver is assigned to a booking. Reassign the booking before removing the driver." });
    return;
  }

  const [deleted] = await db
    .delete(driversTable)
    .where(eq(driversTable.id, params.data.id))
    .returning({ id: driversTable.id });

  if (!deleted) {
    res.status(404).json({ error: "Driver not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
