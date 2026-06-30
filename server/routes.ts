import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { insertLawyerSchema, insertIntakeSchema, updateIntakeSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { requireAdmin } from "./auth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get("/api/health", async (_req, res) => {
    try {
      const [lawyers, intakes] = await Promise.all([
        storage.getAllLawyers(),
        storage.getAllIntakes(),
      ]);
      res.json({
        ok: true,
        databaseConfigured: Boolean(process.env.DATABASE_URL),
        lawyers: lawyers.length,
        intakes: intakes.length,
      });
    } catch (error) {
      console.error("Health check failed:", error);
      res.status(500).json({
        ok: false,
        databaseConfigured: Boolean(process.env.DATABASE_URL),
      });
    }
  });
  
  // Lawyers API
  app.get("/api/lawyers", async (req, res) => {
    try {
      const lawyers = await storage.getAllLawyers();
      // Convert rating from integer to decimal for frontend
      const formattedLawyers = lawyers.map(l => ({
        ...l,
        rating: l.rating / 10
      }));
      res.json(formattedLawyers);
    } catch (error) {
      console.error("Error fetching lawyers:", error);
      res.status(500).json({ error: "Failed to fetch lawyers" });
    }
  });

  app.get("/api/lawyers/:id", async (req, res) => {
    try {
      const lawyer = await storage.getLawyerById(req.params.id);
      if (!lawyer) {
        return res.status(404).json({ error: "Lawyer not found" });
      }
      res.json({ ...lawyer, rating: lawyer.rating / 10 });
    } catch (error) {
      console.error("Error fetching lawyer:", error);
      res.status(500).json({ error: "Failed to fetch lawyer" });
    }
  });

  app.post("/api/lawyers", requireAdmin, async (req, res) => {
    try {
      const validated = insertLawyerSchema.parse(req.body);
      const lawyer = await storage.createLawyer(validated);
      res.status(201).json({ ...lawyer, rating: lawyer.rating / 10 });
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: fromZodError(error).toString() });
      }
      console.error("Error creating lawyer:", error);
      res.status(500).json({ error: "Failed to create lawyer" });
    }
  });

  // Intakes API
  app.get("/api/intakes", requireAdmin, async (req, res) => {
    try {
      const intakes = await storage.getAllIntakes();
      res.json(intakes);
    } catch (error) {
      console.error("Error fetching intakes:", error);
      res.status(500).json({ error: "Failed to fetch intakes" });
    }
  });

  app.get("/api/intakes/:id", requireAdmin, async (req, res) => {
    try {
      const intake = await storage.getIntakeById(req.params.id);
      if (!intake) {
        return res.status(404).json({ error: "Intake not found" });
      }
      res.json(intake);
    } catch (error) {
      console.error("Error fetching intake:", error);
      res.status(500).json({ error: "Failed to fetch intake" });
    }
  });

  app.post("/api/intakes", async (req, res) => {
    try {
      const validated = insertIntakeSchema.parse(req.body);
      const intake = await storage.createIntake(validated);
      res.status(201).json(intake);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: fromZodError(error).toString() });
      }
      console.error("Error creating intake:", error);
      res.status(500).json({ error: "Failed to create intake" });
    }
  });

  app.post("/api/intakes/:id/consult-request", async (req, res) => {
    try {
      const lawyerId = typeof req.body?.lawyerId === "string" ? req.body.lawyerId : "";
      if (!lawyerId) {
        return res.status(400).json({ error: "lawyerId is required" });
      }

      const lawyer = await storage.getLawyerById(lawyerId);
      const intake = await storage.getIntakeById(req.params.id);

      if (!lawyer || !intake) {
        return res.status(404).json({ error: "Intake or lawyer not found" });
      }

      const updated = await storage.updateIntake(req.params.id, {
        status: "matched",
        assignedLawyerId: lawyer.id,
        notes: `Requested consult with ${lawyer.name} at ${lawyer.firm}.`,
      });

      res.json(updated);
    } catch (error) {
      console.error("Error requesting consult:", error);
      res.status(500).json({ error: "Failed to request consult" });
    }
  });

  app.patch("/api/intakes/:id", requireAdmin, async (req, res) => {
    try {
      const validated = updateIntakeSchema.parse(req.body);
      const intake = await storage.updateIntake(req.params.id, validated);
      if (!intake) {
        return res.status(404).json({ error: "Intake not found" });
      }
      res.json(intake);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: fromZodError(error).toString() });
      }
      console.error("Error updating intake:", error);
      res.status(500).json({ error: "Failed to update intake" });
    }
  });

  return httpServer;
}
