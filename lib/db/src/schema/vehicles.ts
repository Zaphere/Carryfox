import { pgTable, text, serial, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const vehiclesTable = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  plateNumber: text("plate_number").notNull(),
  model: text("model").notNull(),
  type: text("type").notNull(),
  capacity: text("capacity").notNull(),
  status: text("status").notNull().default("available"),
  currentCity: text("current_city").notNull(),
  currentLat: real("current_lat"),
  currentLng: real("current_lng"),
  fuelLevel: integer("fuel_level").notNull().default(100),
  mileage: integer("mileage").notNull().default(0),
  lastServiceDate: text("last_service_date").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertVehicleSchema = createInsertSchema(vehiclesTable).omit({ id: true, createdAt: true });
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type Vehicle = typeof vehiclesTable.$inferSelect;
