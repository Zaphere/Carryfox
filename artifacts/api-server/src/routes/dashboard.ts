import { Router, type IRouter } from "express";
import { desc, eq, sql, gte, and, ne } from "drizzle-orm";
import { db, bookingsTable, vehiclesTable, driversTable } from "@workspace/db";
import {
  GetDashboardSummaryResponse,
  GetFleetStatusResponse,
  GetDashboardAnalyticsResponse,
  GetRecentBookingsResponse,
} from "@workspace/api-zod";
import { requireOwner } from "../middlewares/requireOwner";

const router: IRouter = Router();

router.get("/dashboard/summary", requireOwner, async (_req, res): Promise<void> => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [totalToday] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(bookingsTable)
    .where(gte(bookingsTable.createdAt, todayStart));

  const [activeVehicles] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(vehiclesTable)
    .where(eq(vehiclesTable.status, "on_route"));

  const [totalDrivers] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(driversTable);

  const [pending] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(bookingsTable)
    .where(eq(bookingsTable.status, "confirmed"));

  const [completedToday] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(bookingsTable)
    .where(and(eq(bookingsTable.status, "completed"), gte(bookingsTable.scheduledDate, todayStart)));

  const [totalAll] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(bookingsTable)
    .where(eq(bookingsTable.status, "completed"));

  // Booked value MTD: count non-cancelled bookings created this month.
  const [revMTD] = await db
    .select({ total: sql<number>`coalesce(sum(total_price), 0)::float` })
    .from(bookingsTable)
    .where(
      and(
        gte(bookingsTable.createdAt, monthStart),
        ne(bookingsTable.status, "cancelled")
      )
    );

  const summary = {
    totalBookingsToday:   totalToday?.count ?? 0,
    activeVehicles:       activeVehicles?.count ?? 0,
    totalDrivers:         totalDrivers?.count ?? 0,
    totalMovesAllTime:    totalAll?.count ?? 0,
    totalRevenueMTD:      revMTD?.total ?? 0,
    pendingBookings:      pending?.count ?? 0,
    completedToday:       completedToday?.count ?? 0,
  };

  res.json(GetDashboardSummaryResponse.parse(summary));
});

router.get("/dashboard/recent-bookings", requireOwner, async (_req, res): Promise<void> => {
  const bookings = await db
    .select()
    .from(bookingsTable)
    .orderBy(desc(bookingsTable.createdAt))
    .limit(10);
  res.json(GetRecentBookingsResponse.parse(bookings));
});

router.get("/dashboard/fleet-status", requireOwner, async (_req, res): Promise<void> => {
  const [available]   = await db.select({ count: sql<number>`count(*)::int` }).from(vehiclesTable).where(eq(vehiclesTable.status, "available"));
  const [onRoute]     = await db.select({ count: sql<number>`count(*)::int` }).from(vehiclesTable).where(eq(vehiclesTable.status, "on_route"));
  const [maintenance] = await db.select({ count: sql<number>`count(*)::int` }).from(vehiclesTable).where(eq(vehiclesTable.status, "maintenance"));
  const [idle]        = await db.select({ count: sql<number>`count(*)::int` }).from(vehiclesTable).where(eq(vehiclesTable.status, "idle"));
  const [total]       = await db.select({ count: sql<number>`count(*)::int` }).from(vehiclesTable);

  res.json(GetFleetStatusResponse.parse({
    available:   available?.count ?? 0,
    onRoute:     onRoute?.count ?? 0,
    maintenance: maintenance?.count ?? 0,
    idle:        idle?.count ?? 0,
    total:       total?.count ?? 0,
  }));
});

router.get("/dashboard/analytics", requireOwner, async (_req, res): Promise<void> => {
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const now    = new Date();
  const monthly = [];

  for (let i = 5; i >= 0; i--) {
    const d     = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const nextD = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const [row] = await db
      .select({
        count:   sql<number>`count(*)::int`,
        revenue: sql<number>`coalesce(sum(total_price), 0)::float`,
      })
      .from(bookingsTable)
      .where(
        and(
          gte(bookingsTable.createdAt, d),
          sql`created_at < ${nextD}`,
          ne(bookingsTable.status, "cancelled")
        )
      );

    monthly.push({
      label:    MONTHS[d.getMonth()],
      bookings: row?.count ?? 0,
      revenue:  row?.revenue ?? 0,
    });
  }

  const serviceTypes = ["apartment_move", "student_move", "office_move", "storage", "furniture", "clearance", "packing", "warehouse"];
  const bookingsByService = await Promise.all(
    serviceTypes.map(async (st) => {
      const [row] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(bookingsTable)
        .where(eq(bookingsTable.serviceType, st));
      return { service: st, count: row?.count ?? 0 };
    })
  );

  res.json(GetDashboardAnalyticsResponse.parse({ monthly, bookingsByService }));
});

export default router;
