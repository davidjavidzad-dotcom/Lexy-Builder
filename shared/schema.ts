import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Lawyers table
export const lawyers = pgTable("lawyers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  firm: text("firm").notNull(),
  practiceAreas: text("practice_areas").array().notNull(),
  states: text("states").array().notNull(),
  languages: text("languages").array().notNull(),
  hourlyRate: integer("hourly_rate").notNull(),
  imageUrl: text("image_url").notNull(),
  rating: integer("rating").notNull(), // Store as integer (e.g., 49 for 4.9)
  description: text("description").notNull(),
});

export const insertLawyerSchema = createInsertSchema(lawyers).omit({ id: true });
export type InsertLawyer = z.infer<typeof insertLawyerSchema>;
export type Lawyer = typeof lawyers.$inferSelect;

// Workflow intakes table - stores completed workflow submissions
export const intakes = pgTable("intakes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workflowId: text("workflow_id").notNull(),
  workflowTitle: text("workflow_title").notNull(),
  data: jsonb("data").notNull(), // Store all answers as JSON
  completedAt: timestamp("completed_at").notNull().defaultNow(),
});

export const insertIntakeSchema = createInsertSchema(intakes).omit({ id: true, completedAt: true });
export type InsertIntake = z.infer<typeof insertIntakeSchema>;
export type Intake = typeof intakes.$inferSelect;
