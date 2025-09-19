import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema,
  insertHealthProfileSchema,
  insertHealthPlanSchema,
  insertTrackingEntrySchema,
  insertMentalWellnessEntrySchema,
  insertSymptomEntrySchema
} from "@shared/schema";
// Simple user-based auth middleware (for MVP - should be enhanced with proper Firebase token verification)
async function requireUser(req: any, res: any, next: any) {
  try {
    // For now, we'll require userId in request and ensure user exists
    const userId = req.params.userId || req.body.userId;
    console.log('RequireUser middleware - userId:', userId);
    console.log('RequireUser middleware - req.params:', req.params);
    console.log('RequireUser middleware - req.body:', req.body);
    
    if (!userId) {
      console.log('RequireUser middleware - No userId found');
      return res.status(400).json({ error: "User ID required" });
    }

    let user = await storage.getUser(userId);
    console.log('RequireUser middleware - Found user:', user);
    
    if (!user) {
      // Auto-create user if it doesn't exist (Firebase UID provided)
      // In production, this should verify the Firebase token first
      try {
        console.log('RequireUser middleware - Creating new user for userId:', userId);
        user = await storage.createUser({
          id: userId, // Firebase UID
          email: `user-${userId}@placeholder.com`, // Placeholder email
          displayName: null
        });
        console.log('RequireUser middleware - Created user:', user);
      } catch (createError) {
        console.error('RequireUser middleware - Failed to create user:', createError);
        return res.status(500).json({ error: "Failed to create user record" });
      }
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('RequireUser middleware - Error:', error);
    return res.status(500).json({ error: "Authentication error" });
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // User routes
  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(validatedData);
      res.status(201).json(user);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid user data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  // Health profile routes
  app.get("/api/health-profiles/:userId", requireUser, async (req, res) => {
    try {
      const profile = await storage.getHealthProfile(req.params.userId);
      if (!profile) {
        return res.status(404).json({ error: "Health profile not found" });
      }
      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: "Failed to get health profile" });
    }
  });

  app.post("/api/health-profiles", requireUser, async (req, res) => {
    try {
      const validatedData = insertHealthProfileSchema.parse(req.body);
      const profile = await storage.createHealthProfile(validatedData);
      res.status(201).json(profile);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid health profile data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create health profile" });
    }
  });

  app.put("/api/health-profiles/:userId", requireUser, async (req, res) => {
    try {
      const validatedData = insertHealthProfileSchema.partial().parse(req.body);
      const profile = await storage.updateHealthProfile(req.params.userId, validatedData);
      if (!profile) {
        return res.status(404).json({ error: "Health profile not found" });
      }
      res.json(profile);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid health profile data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update health profile" });
    }
  });

  // Health plans routes
  app.get("/api/health-plans/:userId", requireUser, async (req, res) => {
    try {
      const plans = await storage.getHealthPlans(req.params.userId);
      res.json(plans);
    } catch (error) {
      res.status(500).json({ error: "Failed to get health plans" });
    }
  });

  app.get("/api/health-plans/single/:id", async (req, res) => {
    try {
      const plan = await storage.getHealthPlan(req.params.id);
      if (!plan) {
        return res.status(404).json({ error: "Health plan not found" });
      }
      res.json(plan);
    } catch (error) {
      res.status(500).json({ error: "Failed to get health plan" });
    }
  });

  app.post("/api/health-plans", requireUser, async (req, res) => {
    try {
      console.log('Health plan creation request:', req.body);
      const validatedData = insertHealthPlanSchema.parse(req.body);
      console.log('Validated data:', validatedData);
      const plan = await storage.createHealthPlan(validatedData);
      console.log('Created plan:', plan);
      res.status(201).json(plan);
    } catch (error: any) {
      console.error('Health plan creation error:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid health plan data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create health plan", details: error.message });
    }
  });

  app.put("/api/health-plans/:id", requireUser, async (req, res) => {
    try {
      const validatedData = insertHealthPlanSchema.partial().parse(req.body);
      const plan = await storage.updateHealthPlan(req.params.id, validatedData);
      if (!plan) {
        return res.status(404).json({ error: "Health plan not found" });
      }
      res.json(plan);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid health plan data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update health plan" });
    }
  });

  app.delete("/api/health-plans/:id", async (req, res) => {
    try {
      // First, get the plan to check if it exists and get the owner's userId
      const plan = await storage.getHealthPlan(req.params.id);
      if (!plan) {
        return res.status(404).json({ error: "Health plan not found" });
      }
      
      // For now, allow deletion (in production, should verify Firebase token and check ownership)
      // TODO: Implement proper authorization checking that plan.userId matches authenticated user
      
      const deleted = await storage.deleteHealthPlan(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Health plan not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete health plan" });
    }
  });

  // Tracking entries routes
  app.get("/api/tracking/:userId", requireUser, async (req, res) => {
    try {
      const { type, limit } = req.query;
      const entries = await storage.getTrackingEntries(
        req.params.userId,
        type as string,
        limit ? parseInt(limit as string) : undefined
      );
      res.json(entries);
    } catch (error) {
      res.status(500).json({ error: "Failed to get tracking entries" });
    }
  });

  app.get("/api/tracking/single/:id", async (req, res) => {
    try {
      const entry = await storage.getTrackingEntry(req.params.id);
      if (!entry) {
        return res.status(404).json({ error: "Tracking entry not found" });
      }
      res.json(entry);
    } catch (error) {
      res.status(500).json({ error: "Failed to get tracking entry" });
    }
  });

  app.post("/api/tracking", requireUser, async (req, res) => {
    try {
      const validatedData = insertTrackingEntrySchema.parse(req.body);
      const entry = await storage.createTrackingEntry(validatedData);
      res.status(201).json(entry);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid tracking data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create tracking entry" });
    }
  });

  app.put("/api/tracking/:id", requireUser, async (req, res) => {
    try {
      const validatedData = insertTrackingEntrySchema.partial().parse(req.body);
      const entry = await storage.updateTrackingEntry(req.params.id, validatedData);
      if (!entry) {
        return res.status(404).json({ error: "Tracking entry not found" });
      }
      res.json(entry);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid tracking data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update tracking entry" });
    }
  });

  app.delete("/api/tracking/:id", requireUser, async (req, res) => {
    try {
      const deleted = await storage.deleteTrackingEntry(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Tracking entry not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete tracking entry" });
    }
  });

  // Mental wellness routes
  app.get("/api/mental-wellness/:userId", requireUser, async (req, res) => {
    try {
      const { limit } = req.query;
      const entries = await storage.getMentalWellnessEntries(
        req.params.userId,
        limit ? parseInt(limit as string) : undefined
      );
      res.json(entries);
    } catch (error) {
      res.status(500).json({ error: "Failed to get mental wellness entries" });
    }
  });

  app.get("/api/mental-wellness/single/:id", async (req, res) => {
    try {
      const entry = await storage.getMentalWellnessEntry(req.params.id);
      if (!entry) {
        return res.status(404).json({ error: "Mental wellness entry not found" });
      }
      res.json(entry);
    } catch (error) {
      res.status(500).json({ error: "Failed to get mental wellness entry" });
    }
  });

  app.post("/api/mental-wellness", requireUser, async (req, res) => {
    try {
      const validatedData = insertMentalWellnessEntrySchema.parse(req.body);
      const entry = await storage.createMentalWellnessEntry(validatedData);
      res.status(201).json(entry);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid mental wellness data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create mental wellness entry" });
    }
  });

  app.put("/api/mental-wellness/:id", requireUser, async (req, res) => {
    try {
      const validatedData = insertMentalWellnessEntrySchema.partial().parse(req.body);
      const entry = await storage.updateMentalWellnessEntry(req.params.id, validatedData);
      if (!entry) {
        return res.status(404).json({ error: "Mental wellness entry not found" });
      }
      res.json(entry);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid mental wellness data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update mental wellness entry" });
    }
  });

  app.delete("/api/mental-wellness/:id", requireUser, async (req, res) => {
    try {
      const deleted = await storage.deleteMentalWellnessEntry(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Mental wellness entry not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete mental wellness entry" });
    }
  });

  // Symptom entries routes
  app.get("/api/symptoms/:userId", requireUser, async (req, res) => {
    try {
      const { limit } = req.query;
      const entries = await storage.getSymptomEntries(
        req.params.userId,
        limit ? parseInt(limit as string) : undefined
      );
      res.json(entries);
    } catch (error) {
      res.status(500).json({ error: "Failed to get symptom entries" });
    }
  });

  app.get("/api/symptoms/single/:id", async (req, res) => {
    try {
      const entry = await storage.getSymptomEntry(req.params.id);
      if (!entry) {
        return res.status(404).json({ error: "Symptom entry not found" });
      }
      res.json(entry);
    } catch (error) {
      res.status(500).json({ error: "Failed to get symptom entry" });
    }
  });

  app.post("/api/symptoms", requireUser, async (req, res) => {
    try {
      const validatedData = insertSymptomEntrySchema.parse(req.body);
      const entry = await storage.createSymptomEntry(validatedData);
      res.status(201).json(entry);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid symptom data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create symptom entry" });
    }
  });

  app.put("/api/symptoms/:id", requireUser, async (req, res) => {
    try {
      const validatedData = insertSymptomEntrySchema.partial().parse(req.body);
      const entry = await storage.updateSymptomEntry(req.params.id, validatedData);
      if (!entry) {
        return res.status(404).json({ error: "Symptom entry not found" });
      }
      res.json(entry);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid symptom data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update symptom entry" });
    }
  });

  app.delete("/api/symptoms/:id", requireUser, async (req, res) => {
    try {
      const deleted = await storage.deleteSymptomEntry(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Symptom entry not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete symptom entry" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
