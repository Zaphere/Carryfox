import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, quotesTable } from "@workspace/db";
import {
  CreateQuoteBody,
  GetQuoteParams,
  GetQuoteResponse,
  ListQuotesResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function calculateQuote(data: {
  rooms: number;
  floorPickup: number;
  floorDestination: number;
  hasElevator: boolean;
  needsStorage: boolean;
  needsPacking: boolean;
  needsAssembly: boolean;
  urgencyLevel: string;
  apartmentSize: string;
}) {
  let base = 200;
  base += data.rooms * 80;
  if (!data.hasElevator) {
    base += (data.floorPickup + data.floorDestination) * 30;
  }
  if (data.needsStorage) base += 150;
  if (data.needsPacking) base += 120;
  if (data.needsAssembly) base += 80;
  if (data.urgencyLevel === "express") base *= 1.3;
  if (data.urgencyLevel === "emergency") base *= 1.6;

  let truckSize = "van";
  if (data.rooms >= 4) truckSize = "xl_truck";
  else if (data.rooms >= 3) truckSize = "large_truck";
  else if (data.rooms >= 2) truckSize = "small_truck";

  const crew = data.rooms >= 4 ? 4 : data.rooms >= 2 ? 3 : 2;

  return { estimatedPrice: Math.round(base), estimatedTruckSize: truckSize, estimatedCrew: crew };
}

router.get("/quotes", async (_req, res): Promise<void> => {
  const quotes = await db.select().from(quotesTable).orderBy(desc(quotesTable.createdAt));
  res.json(ListQuotesResponse.parse(quotes));
});

router.post("/quotes", async (req, res): Promise<void> => {
  const parsed = CreateQuoteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const calc = calculateQuote(parsed.data);
  const [quote] = await db
    .insert(quotesTable)
    .values({ ...parsed.data, ...calc })
    .returning();

  res.status(201).json(GetQuoteResponse.parse(quote));
});

router.get("/quotes/:id", async (req, res): Promise<void> => {
  const params = GetQuoteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [quote] = await db.select().from(quotesTable).where(eq(quotesTable.id, params.data.id));
  if (!quote) {
    res.status(404).json({ error: "Quote not found" });
    return;
  }

  res.json(GetQuoteResponse.parse(quote));
});

export default router;
