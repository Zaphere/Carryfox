import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, bookingsTable, vehiclesTable } from "@workspace/db";
import {
  CreateVehicleBody,
  DeleteVehicleParams,
  GetVehicleParams,
  GetVehicleResponse,
  ListVehiclesResponse,
  UpdateVehicleBody,
  UpdateVehicleParams,
} from "@workspace/api-zod";
import { requireOwner } from "../middlewares/requireOwner";

const router: IRouter = Router();

router.get("/vehicles", requireOwner, async (_req, res): Promise<void> => {
  const vehicles = await db.select().from(vehiclesTable).orderBy(vehiclesTable.model);
  res.json(ListVehiclesResponse.parse(vehicles));
});

router.post("/vehicles", requireOwner, async (req, res): Promise<void> => {
  const parsed = CreateVehicleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [vehicle] = await db
    .insert(vehiclesTable)
    .values({
      ...parsed.data,
      lastServiceDate: parsed.data.lastServiceDate.toISOString().slice(0, 10),
    })
    .returning();
  res.status(201).json(GetVehicleResponse.parse(vehicle));
});

router.get("/vehicles/:id", requireOwner, async (req, res): Promise<void> => {
  const params = GetVehicleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [vehicle] = await db.select().from(vehiclesTable).where(eq(vehiclesTable.id, params.data.id));
  if (!vehicle) {
    res.status(404).json({ error: "Vehicle not found" });
    return;
  }

  res.json(GetVehicleResponse.parse(vehicle));
});

router.patch("/vehicles/:id", requireOwner, async (req, res): Promise<void> => {
  const params = UpdateVehicleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateVehicleBody.safeParse(req.body);
  if (!parsed.success || Object.keys(parsed.data ?? {}).length === 0) {
    res.status(400).json({ error: parsed.success ? "Provide at least one field to update." : parsed.error.message });
    return;
  }

  const { lastServiceDate, ...vehicleFields } = parsed.data;
  const updateData = {
    ...vehicleFields,
    ...(lastServiceDate
      ? { lastServiceDate: lastServiceDate.toISOString().slice(0, 10) }
      : {}),
  };

  const [vehicle] = await db
    .update(vehiclesTable)
    .set(updateData)
    .where(eq(vehiclesTable.id, params.data.id))
    .returning();

  if (!vehicle) {
    res.status(404).json({ error: "Vehicle not found" });
    return;
  }

  res.json(GetVehicleResponse.parse(vehicle));
});

router.delete("/vehicles/:id", requireOwner, async (req, res): Promise<void> => {
  const params = DeleteVehicleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const assignedBooking = await db
    .select({ id: bookingsTable.id })
    .from(bookingsTable)
    .where(eq(bookingsTable.vehicleId, params.data.id))
    .limit(1);

  if (assignedBooking.length > 0) {
    res.status(409).json({ error: "This vehicle is assigned to a booking. Reassign the booking before removing the vehicle." });
    return;
  }

  const [deleted] = await db
    .delete(vehiclesTable)
    .where(eq(vehiclesTable.id, params.data.id))
    .returning({ id: vehiclesTable.id });

  if (!deleted) {
    res.status(404).json({ error: "Vehicle not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
