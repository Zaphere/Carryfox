import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, vehiclesTable } from "@workspace/db";
import {
  GetVehicleParams,
  GetVehicleResponse,
  ListVehiclesResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/vehicles", async (_req, res): Promise<void> => {
  const vehicles = await db.select().from(vehiclesTable).orderBy(vehiclesTable.model);
  res.json(ListVehiclesResponse.parse(vehicles));
});

router.get("/vehicles/:id", async (req, res): Promise<void> => {
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

export default router;
