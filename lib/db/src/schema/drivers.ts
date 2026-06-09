import { pgTable, text, serial, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const driversTable = pgTable("drivers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  licenseNumber: text("license_number").notNull(),
  status: text("status").notNull().default("available"),
  rating: real("rating").notNull().default(4.8),
  totalMoves: integer("total_moves").notNull().default(0),
  city: text("city").notNull(),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertDriverSchema = createInsertSchema(driversTable).omit({ id: true, createdAt: true });
export type InsertDriver = z.infer<typeof insertDriverSchema>;
export type Driver = typeof driversTable.$inferSelect;
