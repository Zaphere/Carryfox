import { pgTable, text, serial, timestamp, integer, real, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const quotesTable = pgTable("quotes", {
  id: serial("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone").notNull(),
  pickupAddress: text("pickup_address").notNull(),
  destinationAddress: text("destination_address").notNull(),
  apartmentSize: text("apartment_size").notNull(),
  rooms: integer("rooms").notNull(),
  floorPickup: integer("floor_pickup").notNull().default(0),
  floorDestination: integer("floor_destination").notNull().default(0),
  hasElevator: boolean("has_elevator").notNull().default(false),
  needsStorage: boolean("needs_storage").notNull().default(false),
  needsPacking: boolean("needs_packing").notNull().default(false),
  needsAssembly: boolean("needs_assembly").notNull().default(false),
  urgencyLevel: text("urgency_level").notNull().default("standard"),
  estimatedPrice: real("estimated_price").notNull().default(0),
  estimatedTruckSize: text("estimated_truck_size").notNull().default("small_truck"),
  estimatedCrew: integer("estimated_crew").notNull().default(2),
  status: text("status").notNull().default("pending"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertQuoteSchema = createInsertSchema(quotesTable).omit({ id: true, createdAt: true });
export type InsertQuote = z.infer<typeof insertQuoteSchema>;
export type Quote = typeof quotesTable.$inferSelect;
