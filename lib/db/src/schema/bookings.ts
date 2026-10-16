import { pgTable, text, serial, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const bookingsTable = pgTable("bookings", {
  id: serial("id").primaryKey(),
  quoteId: integer("quote_id"),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone").notNull(),
  pickupAddress: text("pickup_address").notNull(),
  destinationAddress: text("destination_address").notNull(),
  // Coordinates captured from the address autocomplete at booking time.
  // Nullable: bookings entered manually (admin) may not have them, and
  // older rows predate the columns. Tracking falls back to geocoding.
  pickupLat: real("pickup_lat"),
  pickupLng: real("pickup_lng"),
  destinationLat: real("destination_lat"),
  destinationLng: real("destination_lng"),
  scheduledDate: timestamp("scheduled_date", { withTimezone: true }).notNull(),
  status: text("status").notNull().default("confirmed"),
  serviceType: text("service_type").notNull(),
  vehicleId: integer("vehicle_id"),
  driverId: integer("driver_id"),
  totalPrice: real("total_price").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertBookingSchema = createInsertSchema(bookingsTable).omit({ id: true, createdAt: true });
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookingsTable.$inferSelect;
