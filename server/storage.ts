import { randomUUID } from "crypto";
import { mkdir, readFile, rename, writeFile } from "fs/promises";
import { dirname, resolve } from "path";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { eq } from "drizzle-orm";
import * as schema from "@shared/schema";
import type { Lawyer, InsertLawyer, Intake, InsertIntake, UpdateIntake } from "@shared/schema";

const { Pool } = pg;

export interface IStorage {
  getAllLawyers(): Promise<Lawyer[]>;
  getLawyerById(id: string): Promise<Lawyer | undefined>;
  createLawyer(lawyer: InsertLawyer): Promise<Lawyer>;
  getAllIntakes(): Promise<Intake[]>;
  getIntakeById(id: string): Promise<Intake | undefined>;
  createIntake(intake: InsertIntake): Promise<Intake>;
  updateIntake(id: string, updates: UpdateIntake): Promise<Intake | undefined>;
}

const starterLawyers: Lawyer[] = [
  {
    id: "lawyer-sarah-jenkins",
    name: "Sarah Jenkins",
    firm: "Jenkins & Associates",
    practiceAreas: ["Corporate", "Startups", "Entity Formation"],
    states: ["CA", "NY"],
    languages: ["English", "Spanish"],
    hourlyRate: 350,
    imageUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200&h=200",
    rating: 49,
    description: "Specializing in tech startups and efficient entity formation.",
  },
  {
    id: "lawyer-david-chen",
    name: "David Chen",
    firm: "Chen Legal Group",
    practiceAreas: ["Personal Injury", "Liability"],
    states: ["CA", "TX"],
    languages: ["English", "Mandarin"],
    hourlyRate: 300,
    imageUrl: "https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&q=80&w=200&h=200",
    rating: 48,
    description: "Tenacious representation for personal injury victims.",
  },
  {
    id: "lawyer-elena-rodriguez",
    name: "Elena Rodriguez",
    firm: "Rodriguez Law",
    practiceAreas: ["Family Law", "Estate Planning"],
    states: ["FL", "NY"],
    languages: ["English", "Spanish", "Portuguese"],
    hourlyRate: 275,
    imageUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=200&h=200",
    rating: 47,
    description: "Compassionate counsel for family matters.",
  },
  {
    id: "lawyer-michael-ross",
    name: "Michael Ross",
    firm: "Pearson Specter",
    practiceAreas: ["Corporate", "Litigation"],
    states: ["NY"],
    languages: ["English"],
    hourlyRate: 500,
    imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200&h=200",
    rating: 50,
    description: "Top-tier corporate litigation and strategy.",
  },
  {
    id: "lawyer-amanda-smith",
    name: "Amanda Smith",
    firm: "Smith & Partners",
    practiceAreas: ["Personal Injury", "Medical Malpractice"],
    states: ["CA", "WA"],
    languages: ["English"],
    hourlyRate: 325,
    imageUrl: "https://images.unsplash.com/photo-1598550874175-4d7112ee751c?auto=format&fit=crop&q=80&w=200&h=200",
    rating: 46,
    description: "Dedicated to getting you the compensation you deserve.",
  },
];

type SerializedIntake = Omit<Intake, "completedAt" | "updatedAt"> & {
  completedAt: string;
  updatedAt: string;
};

type StoredData = {
  lawyers: Lawyer[];
  intakes: SerializedIntake[];
};

function serializeIntake(intake: Intake): SerializedIntake {
  return {
    ...intake,
    completedAt: intake.completedAt.toISOString(),
    updatedAt: intake.updatedAt.toISOString(),
  };
}

function deserializeIntake(intake: SerializedIntake): Intake {
  return {
    ...intake,
    completedAt: new Date(intake.completedAt),
    updatedAt: new Date(intake.updatedAt),
  };
}

export class FileStorage implements IStorage {
  private filePath = resolve(process.env.GOODLEGAL_DATA_FILE || ".local/goodlegal-data.json");
  private lawyers = new Map<string, Lawyer>();
  private intakes = new Map<string, Intake>();
  private ready: Promise<void>;

  constructor() {
    this.ready = this.load();
  }

  private async load(): Promise<void> {
    try {
      const raw = await readFile(this.filePath, "utf-8");
      const parsed = JSON.parse(raw) as StoredData;
      this.lawyers = new Map((parsed.lawyers || starterLawyers).map((lawyer) => [lawyer.id, lawyer]));
      this.intakes = new Map((parsed.intakes || []).map((intake) => {
        const deserialized = deserializeIntake(intake);
        return [deserialized.id, deserialized];
      }));
    } catch {
      this.lawyers = new Map(starterLawyers.map((lawyer) => [lawyer.id, lawyer]));
      this.intakes = new Map();
      await this.persist();
    }
  }

  private async persist(): Promise<void> {
    const payload: StoredData = {
      lawyers: Array.from(this.lawyers.values()),
      intakes: Array.from(this.intakes.values()).map(serializeIntake),
    };
    await mkdir(dirname(this.filePath), { recursive: true });
    const tempPath = `${this.filePath}.${process.pid}.${randomUUID()}.tmp`;
    await writeFile(tempPath, JSON.stringify(payload, null, 2));
    await rename(tempPath, this.filePath);
  }

  async getAllLawyers(): Promise<Lawyer[]> {
    await this.ready;
    return Array.from(this.lawyers.values());
  }

  async getLawyerById(id: string): Promise<Lawyer | undefined> {
    await this.ready;
    return this.lawyers.get(id);
  }

  async createLawyer(lawyer: InsertLawyer): Promise<Lawyer> {
    await this.ready;
    const created: Lawyer = {
      id: randomUUID(),
      ...lawyer,
    };
    this.lawyers.set(created.id, created);
    await this.persist();
    return created;
  }

  async getAllIntakes(): Promise<Intake[]> {
    await this.ready;
    return Array.from(this.intakes.values()).sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async getIntakeById(id: string): Promise<Intake | undefined> {
    await this.ready;
    return this.intakes.get(id);
  }

  async createIntake(intake: InsertIntake): Promise<Intake> {
    await this.ready;
    const now = new Date();
    const created: Intake = {
      id: randomUUID(),
      completedAt: now,
      updatedAt: now,
      workflowId: intake.workflowId,
      workflowTitle: intake.workflowTitle,
      data: intake.data,
      status: intake.status || "new",
      notes: intake.notes || "",
      assignedLawyerId: intake.assignedLawyerId || null,
    };
    this.intakes.set(created.id, created);
    await this.persist();
    return created;
  }

  async updateIntake(id: string, updates: UpdateIntake): Promise<Intake | undefined> {
    await this.ready;
    const existing = this.intakes.get(id);
    if (!existing) return undefined;

    const updated: Intake = {
      ...existing,
      ...updates,
      assignedLawyerId: updates.assignedLawyerId === undefined ? existing.assignedLawyerId : updates.assignedLawyerId,
      updatedAt: new Date(),
    };
    this.intakes.set(id, updated);
    await this.persist();
    return updated;
  }
}

export class DatabaseStorage implements IStorage {
  private pool;
  private db;
  private ready: Promise<void>;
  private initError: unknown;

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString });
    this.db = drizzle(this.pool, { schema });
    this.ready = this.initialize().catch((error) => {
      this.initError = error;
      console.error("Database initialization failed. Falling back when possible.", error);
    });
  }

  private async initialize(): Promise<void> {
    await this.pool.query(`create extension if not exists "pgcrypto"`);
    await this.pool.query(`
      create table if not exists lawyers (
        id varchar primary key default gen_random_uuid(),
        name text not null,
        firm text not null,
        practice_areas text[] not null,
        states text[] not null,
        languages text[] not null,
        hourly_rate integer not null,
        image_url text not null,
        rating integer not null,
        description text not null
      )
    `);
    await this.pool.query(`
      create table if not exists intakes (
        id varchar primary key default gen_random_uuid(),
        workflow_id text not null,
        workflow_title text not null,
        data jsonb not null,
        status text not null default 'new',
        notes text not null default '',
        assigned_lawyer_id text,
        completed_at timestamp not null default now(),
        updated_at timestamp not null default now()
      )
    `);
    await this.pool.query(`alter table intakes add column if not exists status text not null default 'new'`);
    await this.pool.query(`alter table intakes add column if not exists notes text not null default ''`);
    await this.pool.query(`alter table intakes add column if not exists assigned_lawyer_id text`);
    await this.pool.query(`alter table intakes add column if not exists updated_at timestamp not null default now()`);

    const seeded = await this.pool.query(`select count(*)::int as count from lawyers`);
    if ((seeded.rows[0]?.count || 0) === 0) {
      for (const lawyer of starterLawyers) {
        await this.pool.query(
          `
            insert into lawyers
              (id, name, firm, practice_areas, states, languages, hourly_rate, image_url, rating, description)
            values
              ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          `,
          [
            lawyer.id,
            lawyer.name,
            lawyer.firm,
            lawyer.practiceAreas,
            lawyer.states,
            lawyer.languages,
            lawyer.hourlyRate,
            lawyer.imageUrl,
            lawyer.rating,
            lawyer.description,
          ],
        );
      }
    }
  }

  private async ensureReady(): Promise<void> {
    await this.ready;
    if (this.initError) {
      throw this.initError;
    }
  }

  async getAllLawyers(): Promise<Lawyer[]> {
    await this.ensureReady();
    return await this.db.select().from(schema.lawyers);
  }

  async getLawyerById(id: string): Promise<Lawyer | undefined> {
    await this.ensureReady();
    const result = await this.db.select().from(schema.lawyers).where(eq(schema.lawyers.id, id));
    return result[0];
  }

  async createLawyer(lawyer: InsertLawyer): Promise<Lawyer> {
    await this.ensureReady();
    const result = await this.db.insert(schema.lawyers).values(lawyer).returning();
    return result[0];
  }

  async getAllIntakes(): Promise<Intake[]> {
    await this.ensureReady();
    return await this.db.select().from(schema.intakes);
  }

  async getIntakeById(id: string): Promise<Intake | undefined> {
    await this.ensureReady();
    const result = await this.db.select().from(schema.intakes).where(eq(schema.intakes.id, id));
    return result[0];
  }

  async createIntake(intake: InsertIntake): Promise<Intake> {
    await this.ensureReady();
    const result = await this.db.insert(schema.intakes).values(intake).returning();
    return result[0];
  }

  async updateIntake(id: string, updates: UpdateIntake): Promise<Intake | undefined> {
    await this.ensureReady();
    const result = await this.db
      .update(schema.intakes)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(schema.intakes.id, id))
      .returning();
    return result[0];
  }
}

export class ResilientStorage implements IStorage {
  constructor(
    private primary: IStorage,
    private fallback: IStorage,
  ) {}

  private async useFallback<T>(operation: string, action: (storage: IStorage) => Promise<T>): Promise<T> {
    try {
      return await action(this.primary);
    } catch (error) {
      console.error(`Primary storage failed during ${operation}; using fallback storage.`, error);
      return await action(this.fallback);
    }
  }

  async getAllLawyers(): Promise<Lawyer[]> {
    return await this.useFallback("getAllLawyers", (storage) => storage.getAllLawyers());
  }

  async getLawyerById(id: string): Promise<Lawyer | undefined> {
    return await this.useFallback("getLawyerById", (storage) => storage.getLawyerById(id));
  }

  async createLawyer(lawyer: InsertLawyer): Promise<Lawyer> {
    return await this.useFallback("createLawyer", (storage) => storage.createLawyer(lawyer));
  }

  async getAllIntakes(): Promise<Intake[]> {
    return await this.useFallback("getAllIntakes", (storage) => storage.getAllIntakes());
  }

  async getIntakeById(id: string): Promise<Intake | undefined> {
    return await this.useFallback("getIntakeById", (storage) => storage.getIntakeById(id));
  }

  async createIntake(intake: InsertIntake): Promise<Intake> {
    return await this.useFallback("createIntake", (storage) => storage.createIntake(intake));
  }

  async updateIntake(id: string, updates: UpdateIntake): Promise<Intake | undefined> {
    return await this.useFallback("updateIntake", (storage) => storage.updateIntake(id, updates));
  }
}

export const storage: IStorage = process.env.DATABASE_URL
  ? new ResilientStorage(new DatabaseStorage(process.env.DATABASE_URL), new FileStorage())
  : new FileStorage();
