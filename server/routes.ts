import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import { 
  insertUserSchema,
  insertHealthProfileSchema,
  onboardingHealthProfileSchema,
  insertHealthPlanSchema,
  insertTrackingEntrySchema,
  insertMentalWellnessEntrySchema,
  insertSymptomEntrySchema,
  symptomAnalysisRequestSchema,
  insertCalorieLogSchema,
  insertExerciseLogSchema,
  insertWeightLogSchema,
  insertWaterLogSchema,
  insertSleepLogSchema,
  type User
} from "@shared/schema";
import { analyzeSymptoms, generateHealthPlan, generateMentalWellnessResponse } from "./utils/openai";
import { generateTokenPair, verifyToken, extractTokenFromHeader, type JWTPayload } from "./utils/jwt";

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}
// JWT-based authentication middleware
async function requireUser(req: any, res: any, next: any) {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    console.log('RequireUser middleware - Token:', token ? 'Present' : 'Missing');
    
    if (!token) {
      return res.status(401).json({ error: "Authorization token required" });
    }

    // Verify JWT token and extract payload
    const payload: JWTPayload = verifyToken(token);
    console.log('RequireUser middleware - Token verified for user:', payload.userId);
    
    // Ensure it's an access token
    if (payload.type !== 'access') {
      return res.status(401).json({ error: "Invalid token type" });
    }

    // Get full user data from database
    const user = await storage.getUser(payload.userId);
    console.log('RequireUser middleware - Found user:', user ? 'Yes' : 'No');
    
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    req.user = user;
    next();
  } catch (error: any) {
    console.error('RequireUser middleware - Error:', error.message);
    if (error.message === 'Token expired') {
      return res.status(401).json({ error: "Token expired" });
    } else if (error.message === 'Invalid token') {
      return res.status(401).json({ error: "Invalid token" });
    }
    return res.status(500).json({ error: "Authentication error" });
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, displayName } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "User already exists with this email" });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      const user = await storage.createUser({
        email,
        passwordHash,
        displayName: displayName || null,
        role: 'END_USER' // Default role
      });

      // Generate secure JWT tokens
      const { accessToken, refreshToken } = generateTokenPair(user);

      // Return user without password hash
      const { passwordHash: _, ...userWithoutPassword } = user;
      res.status(201).json({ 
        user: userWithoutPassword,
        accessToken,
        refreshToken
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Failed to register user" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Verify password
      const passwordMatch = await bcrypt.compare(password, user.passwordHash);
      if (!passwordMatch) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Generate secure JWT tokens
      const { accessToken, refreshToken } = generateTokenPair(user);

      // Return user without password hash
      const { passwordHash: _, ...userWithoutPassword } = user;
      res.json({ 
        user: userWithoutPassword, 
        accessToken,
        refreshToken
      });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Failed to login" });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    // For now, just return success (client will handle token removal)
    res.json({ message: "Logged out successfully" });
  });

  app.post("/api/auth/refresh", async (req, res) => {
    try {
      const token = extractTokenFromHeader(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "Refresh token required" });
      }

      // Verify refresh token
      const payload = verifyToken(token);
      
      // Ensure it's a refresh token
      if (payload.type !== 'refresh') {
        return res.status(401).json({ error: "Invalid token type" });
      }

      // Get current user data
      const user = await storage.getUser(payload.userId);
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      // Generate new access token
      const accessToken = generateAccessToken(user);
      
      res.json({ accessToken });
    } catch (error: any) {
      console.error("Token refresh error:", error.message);
      if (error.message === 'Token expired') {
        return res.status(401).json({ error: "Refresh token expired" });
      } else if (error.message === 'Invalid token') {
        return res.status(401).json({ error: "Invalid refresh token" });
      }
      res.status(500).json({ error: "Failed to refresh token" });
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    try {
      const token = extractTokenFromHeader(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No token provided" });
      }

      // Verify JWT token
      const payload = verifyToken(token);
      
      // Ensure it's an access token
      if (payload.type !== 'access') {
        return res.status(401).json({ error: "Invalid token type" });
      }

      // Get current user data
      const user = await storage.getUser(payload.userId);
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      const { passwordHash: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error: any) {
      console.error("Auth check error:", error.message);
      if (error.message === 'Token expired') {
        return res.status(401).json({ error: "Token expired" });
      } else if (error.message === 'Invalid token') {
        return res.status(401).json({ error: "Invalid token" });
      }
      res.status(500).json({ error: "Failed to verify authentication" });
    }
  });

  // User routes
  app.get("/api/users/:id", requireUser, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      // Enforce ownership - users can only access their own user data
      if (req.params.id !== req.user.id) {
        return res.status(403).json({ error: "Access denied - can only access your own user data" });
      }
      
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      // Never expose password hash to client
      const { passwordHash, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  // REMOVED: Insecure user creation route - use /api/auth/register instead
  // This route was removed due to critical security vulnerabilities:
  // 1. Allowed unauthenticated arbitrary role assignment (including ADMIN)
  // 2. Accepted raw passwordHash without proper hashing
  // 3. Bypassed secure registration flow
  // Use /api/auth/register for secure user creation

  // Health profile routes
  app.get("/api/health-profiles/:userId", requireUser, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      // Enforce ownership - users can only access their own profiles
      if (req.params.userId !== req.user.id) {
        return res.status(403).json({ error: "Access denied - can only access your own profile" });
      }
      
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
      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      // Enforce ownership - override any client-supplied userId
      const profileData = {
        ...req.body,
        userId: req.user.id, // Always use authenticated user's ID
      };
      
      const validatedData = insertHealthProfileSchema.parse(profileData);
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
      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      // Enforce ownership - users can only update their own profiles
      if (req.params.userId !== req.user.id) {
        return res.status(403).json({ error: "Access denied - can only update your own profile" });
      }
      
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

  // Health profile onboarding routes
  app.post("/api/health-profile/onboarding", requireUser, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      // Validate onboarding data using comprehensive schema
      const validatedData = onboardingHealthProfileSchema.parse({
        ...req.body,
        userId: req.user.id,
      });

      // Create profile with completion timestamp
      const profileData = {
        ...validatedData,
        profileCompletedAt: new Date(),
        lastProfileUpdate: new Date(),
      };

      const profile = await storage.createHealthProfile(profileData);
      res.status(201).json(profile);
    } catch (error: any) {
      console.error('Onboarding profile creation error:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          error: "Invalid profile data", 
          details: error.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`)
        });
      }
      res.status(500).json({ error: "Failed to create health profile", details: error.message });
    }
  });

  // Check if user has completed onboarding
  app.get("/api/health-profile/onboarding-status", requireUser, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const profile = await storage.getHealthProfile(req.user.id);
      
      const onboardingStatus = {
        hasCompletedOnboarding: profile && profile.profileCompletedAt !== null,
        needsWeeklyUpdate: false,
        lastUpdateDays: 0,
        profile: profile
      };

      // Check if user needs weekly update
      if (profile && profile.lastProfileUpdate) {
        const daysSinceUpdate = Math.floor(
          (Date.now() - new Date(profile.lastProfileUpdate).getTime()) / (1000 * 60 * 60 * 24)
        );
        onboardingStatus.needsWeeklyUpdate = daysSinceUpdate >= 7;
        onboardingStatus.lastUpdateDays = daysSinceUpdate;
      }

      res.json(onboardingStatus);
    } catch (error) {
      console.error('Onboarding status check error:', error);
      res.status(500).json({ error: "Failed to check onboarding status" });
    }
  });

  // Update profile with weekly update timestamp
  app.put("/api/health-profile/weekly-update", requireUser, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const validatedData = insertHealthProfileSchema.parse({
        ...req.body,
        userId: req.user.id,
        lastProfileUpdate: new Date(),
      });

      const profile = await storage.updateHealthProfile(req.user.id, validatedData);
      if (!profile) {
        return res.status(404).json({ error: "Health profile not found" });
      }
      res.json(profile);
    } catch (error: any) {
      console.error('Weekly profile update error:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          error: "Invalid profile data", 
          details: error.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`)
        });
      }
      res.status(500).json({ error: "Failed to update health profile" });
    }
  });

  // Tracking routes
  app.get("/api/tracking/today", requireUser, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const entries = await storage.getTrackingEntriesByDateRange(req.user.id, today, tomorrow);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ error: "Failed to get today's tracking entries" });
    }
  });

  app.post("/api/tracking/calories", requireUser, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      const requestData = {
        ...req.body,
        userId: req.user.id,
        date: req.body.date || new Date().toISOString().split('T')[0],
        type: 'nutrition',
        unit: 'calories',
        metadata: {
          foodItem: req.body.foodItem,
          mealType: req.body.mealType,
        }
      };
      
      const validatedData = insertCalorieLogSchema.parse(requestData);
      const entry = await storage.createTrackingEntry(validatedData);
      res.status(201).json(entry);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid calorie data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create calorie entry" });
    }
  });

  app.post("/api/tracking/exercise", requireUser, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      const requestData = {
        ...req.body,
        userId: req.user.id,
        date: req.body.date || new Date().toISOString().split('T')[0],
        type: 'exercise',
        value: req.body.duration,
        unit: req.body.unit || 'minutes',
        metadata: {
          exerciseType: req.body.exerciseType,
          intensity: req.body.intensity,
          caloriesBurned: req.body.caloriesBurned,
        }
      };
      
      const validatedData = insertExerciseLogSchema.parse(requestData);
      const entry = await storage.createTrackingEntry(validatedData);
      res.status(201).json(entry);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid exercise data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create exercise entry" });
    }
  });

  app.post("/api/tracking/weight", requireUser, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      const requestData = {
        ...req.body,
        userId: req.user.id,
        date: req.body.date || new Date().toISOString().split('T')[0],
        type: 'weight',
      };
      
      const validatedData = insertWeightLogSchema.parse(requestData);
      const entry = await storage.createTrackingEntry(validatedData);
      res.status(201).json(entry);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid weight data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create weight entry" });
    }
  });

  app.post("/api/tracking/water", requireUser, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      const requestData = {
        ...req.body,
        userId: req.user.id,
        date: req.body.date || new Date().toISOString().split('T')[0],
        type: 'water',
      };
      
      const validatedData = insertWaterLogSchema.parse(requestData);
      const entry = await storage.createTrackingEntry(validatedData);
      res.status(201).json(entry);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid water data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create water entry" });
    }
  });

  app.post("/api/tracking/sleep", requireUser, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      const requestData = {
        ...req.body,
        userId: req.user.id,
        date: req.body.date || new Date().toISOString().split('T')[0],
        type: 'sleep',
        unit: 'hours',
        metadata: {
          bedtime: req.body.bedtime,
          wakeupTime: req.body.wakeupTime,
          quality: req.body.quality,
        }
      };
      
      const validatedData = insertSleepLogSchema.parse(requestData);
      const entry = await storage.createTrackingEntry(validatedData);
      res.status(201).json(entry);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid sleep data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create sleep entry" });
    }
  });

  app.get("/api/mental-wellness/recent", requireUser, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      const entries = await storage.getMentalWellnessEntries(req.user.id, 10);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ error: "Failed to get mental wellness entries" });
    }
  });

  app.post("/api/mental-wellness", requireUser, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      const requestData = {
        ...req.body,
        userId: req.user.id,
      };
      
      const validatedData = insertMentalWellnessEntrySchema.parse(requestData);
      const entry = await storage.createMentalWellnessEntry(validatedData);
      res.status(201).json(entry);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid mental wellness data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create mental wellness entry" });
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
      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      console.log('Health plan creation request:', req.body);
      console.log('Authenticated user:', req.user.id);
      
      // Add userId from authenticated user
      const requestData = {
        ...req.body,
        userId: req.user.id
      };
      
      const validatedData = insertHealthPlanSchema.parse(requestData);
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

  // AI-powered symptom analysis route
  app.post("/api/symptoms/analyze", requireUser, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      // Validate request data using Zod schema
      const validatedRequest = symptomAnalysisRequestSchema.parse(req.body);
      const { symptoms, severity, duration, additionalInfo } = validatedRequest;

      // Get user's health profile for context
      const healthProfile = await storage.getHealthProfile(req.user.id);
      
      // Analyze symptoms using AI
      const analysis = await analyzeSymptoms(
        symptoms,
        severity,
        duration,
        additionalInfo,
        healthProfile?.age || undefined,
        // Note: we don't have gender in health profile yet, could be added later
        undefined
      );

      // Save the symptom entry with structured AI analysis
      const symptomEntryData = {
        userId: req.user.id,
        symptoms,
        severity,
        duration,
        additionalInfo: additionalInfo || null,
        recommendations: JSON.stringify(analysis), // Keep for backward compatibility
        analysis: analysis // Store structured analysis
      };

      const validatedData = insertSymptomEntrySchema.parse(symptomEntryData);
      const entry = await storage.createSymptomEntry(validatedData);

      res.status(201).json({
        entry,
        analysis
      });
    } catch (error: any) {
      console.error('AI symptom analysis error:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          error: "Invalid request data", 
          details: error.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`)
        });
      }
      res.status(500).json({ error: "Failed to analyze symptoms", details: error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
