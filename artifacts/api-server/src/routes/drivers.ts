import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, driversTable } from "@workspace/db";
import {
  GetDriverParams,
  GetDriverResponse,
  ListDriversResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/drivers", async (_req, res): Promise<void> => {
  const drivers = await db.select().from(driversTable).orderBy(driversTable.name);
  res.json(ListDriversResponse.parse(drivers));
});

router.get("/drivers/:id", async (req, res): Promise<void> => {
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

export default router;
