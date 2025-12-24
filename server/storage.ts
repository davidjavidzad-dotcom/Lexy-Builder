import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { eq, and, inArray, lte } from "drizzle-orm";
import * as schema from "@shared/schema";
import type { Lawyer, InsertLawyer, Intake, InsertIntake } from "@shared/schema";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });

export interface IStorage {
  // Lawyers
  getAllLawyers(): Promise<Lawyer[]>;
  getLawyerById(id: string): Promise<Lawyer | undefined>;
  createLawyer(lawyer: InsertLawyer): Promise<Lawyer>;
  
  // Intakes
  getAllIntakes(): Promise<Intake[]>;
  getIntakeById(id: string): Promise<Intake | undefined>;
  createIntake(intake: InsertIntake): Promise<Intake>;
}

export class DatabaseStorage implements IStorage {
  // Lawyers
  async getAllLawyers(): Promise<Lawyer[]> {
    return await db.select().from(schema.lawyers);
  }

  async getLawyerById(id: string): Promise<Lawyer | undefined> {
    const result = await db.select().from(schema.lawyers).where(eq(schema.lawyers.id, id));
    return result[0];
  }

  async createLawyer(lawyer: InsertLawyer): Promise<Lawyer> {
    const result = await db.insert(schema.lawyers).values(lawyer).returning();
    return result[0];
  }

  // Intakes
  async getAllIntakes(): Promise<Intake[]> {
    return await db.select().from(schema.intakes);
  }

  async getIntakeById(id: string): Promise<Intake | undefined> {
    const result = await db.select().from(schema.intakes).where(eq(schema.intakes.id, id));
    return result[0];
  }

  async createIntake(intake: InsertIntake): Promise<Intake> {
    const result = await db.insert(schema.intakes).values(intake).returning();
    return result[0];
  }
}

export const storage = new DatabaseStorage();
