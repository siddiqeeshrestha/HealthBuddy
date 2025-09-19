import { 
  type User, 
  type InsertUser, 
  type HealthProfile, 
  type InsertHealthProfile,
  type HealthPlan,
  type InsertHealthPlan,
  type HealthPlanTarget,
  type InsertHealthPlanTarget,
  type TrackingEntry,
  type InsertTrackingEntry,
  type MentalWellnessEntry,
  type InsertMentalWellnessEntry,
  type SymptomEntry,
  type InsertSymptomEntry,
  type ChatMessage,
  type InsertChatMessage,
  type GroceryList,
  type InsertGroceryList,
  type FoodDetection,
  type InsertFoodDetection,
  users,
  healthProfiles,
  healthPlans,
  healthPlanTargets,
  trackingEntries,
  mentalWellnessEntries,
  symptomEntries,
  chatMessages,
  groceryLists,
  foodDetections
} from "@shared/schema";
import { randomUUID } from "crypto";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, desc, and, gte, lt } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Health profile methods
  getHealthProfile(userId: string): Promise<HealthProfile | undefined>;
  createHealthProfile(profile: InsertHealthProfile): Promise<HealthProfile>;
  updateHealthProfile(userId: string, profile: Partial<InsertHealthProfile>): Promise<HealthProfile | undefined>;
  
  // Health plans methods
  getHealthPlans(userId: string): Promise<HealthPlan[]>;
  getHealthPlan(id: string): Promise<HealthPlan | undefined>;
  createHealthPlan(plan: InsertHealthPlan): Promise<HealthPlan>;
  updateHealthPlan(id: string, plan: Partial<InsertHealthPlan>): Promise<HealthPlan | undefined>;
  deleteHealthPlan(id: string): Promise<boolean>;
  
  // Health plan targets methods
  getHealthPlanTargets(planId: string): Promise<HealthPlanTarget[]>;
  getHealthPlanTarget(id: string): Promise<HealthPlanTarget | undefined>;
  createHealthPlanTarget(target: InsertHealthPlanTarget): Promise<HealthPlanTarget>;
  updateHealthPlanTarget(id: string, target: Partial<InsertHealthPlanTarget>): Promise<HealthPlanTarget | undefined>;
  deleteHealthPlanTarget(id: string): Promise<boolean>;
  updateTargetProgress(id: string, currentValue: number): Promise<HealthPlanTarget | undefined>;
  
  // Tracking entries methods
  getTrackingEntries(userId: string, type?: string, limit?: number): Promise<TrackingEntry[]>;
  getTrackingEntriesByDateRange(userId: string, startDate: Date, endDate: Date): Promise<TrackingEntry[]>;
  getTrackingEntry(id: string): Promise<TrackingEntry | undefined>;
  createTrackingEntry(entry: InsertTrackingEntry): Promise<TrackingEntry>;
  updateTrackingEntry(id: string, entry: Partial<InsertTrackingEntry>): Promise<TrackingEntry | undefined>;
  deleteTrackingEntry(id: string): Promise<boolean>;
  
  // Mental wellness methods
  getMentalWellnessEntries(userId: string, limit?: number): Promise<MentalWellnessEntry[]>;
  getMentalWellnessEntry(id: string): Promise<MentalWellnessEntry | undefined>;
  createMentalWellnessEntry(entry: InsertMentalWellnessEntry): Promise<MentalWellnessEntry>;
  updateMentalWellnessEntry(id: string, entry: Partial<InsertMentalWellnessEntry>): Promise<MentalWellnessEntry | undefined>;
  deleteMentalWellnessEntry(id: string): Promise<boolean>;
  
  // Symptom entries methods
  getSymptomEntries(userId: string, limit?: number): Promise<SymptomEntry[]>;
  getSymptomEntry(id: string): Promise<SymptomEntry | undefined>;
  createSymptomEntry(entry: InsertSymptomEntry): Promise<SymptomEntry>;
  updateSymptomEntry(id: string, entry: Partial<InsertSymptomEntry>): Promise<SymptomEntry | undefined>;
  deleteSymptomEntry(id: string): Promise<boolean>;
  
  // Chat messages methods
  getChatMessages(userId: string, limit?: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  
  // Grocery lists methods
  getGroceryLists(userId: string, limit?: number): Promise<GroceryList[]>;
  getGroceryList(id: string): Promise<GroceryList | undefined>;
  createGroceryList(list: InsertGroceryList): Promise<GroceryList>;
  updateGroceryList(id: string, updates: Partial<InsertGroceryList>): Promise<GroceryList | undefined>;
  deleteGroceryList(id: string): Promise<boolean>;
  
  // Food detection methods
  getFoodDetections(userId: string, limit?: number): Promise<FoodDetection[]>;
  getFoodDetection(id: string): Promise<FoodDetection | undefined>;
  createFoodDetection(detection: InsertFoodDetection): Promise<FoodDetection>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private healthProfiles: Map<string, HealthProfile>;
  private healthPlans: Map<string, HealthPlan>;
  private healthPlanTargets: Map<string, HealthPlanTarget>;
  private trackingEntries: Map<string, TrackingEntry>;
  private mentalWellnessEntries: Map<string, MentalWellnessEntry>;
  private symptomEntries: Map<string, SymptomEntry>;
  private chatMessages: Map<string, ChatMessage>;
  private groceryLists: Map<string, GroceryList>;
  private foodDetections: Map<string, FoodDetection>;

  constructor() {
    this.users = new Map();
    this.healthProfiles = new Map();
    this.healthPlans = new Map();
    this.healthPlanTargets = new Map();
    this.trackingEntries = new Map();
    this.mentalWellnessEntries = new Map();
    this.symptomEntries = new Map();
    this.chatMessages = new Map();
    this.groceryLists = new Map();
    this.foodDetections = new Map();
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = { 
      id: insertUser.id || randomUUID(),
      email: insertUser.email,
      passwordHash: insertUser.passwordHash,
      displayName: insertUser.displayName ?? null,
      createdAt: new Date()
    };
    this.users.set(user.id, user);
    return user;
  }

  // Health profile methods
  async getHealthProfile(userId: string): Promise<HealthProfile | undefined> {
    return Array.from(this.healthProfiles.values()).find(
      (profile) => profile.userId === userId
    );
  }

  async createHealthProfile(insertProfile: InsertHealthProfile): Promise<HealthProfile> {
    const id = randomUUID();
    const profile: HealthProfile = { 
      id,
      userId: insertProfile.userId,
      age: insertProfile.age ?? null,
      height: insertProfile.height ?? null,
      weight: insertProfile.weight ?? null,
      activityLevel: insertProfile.activityLevel ?? null,
      healthGoals: insertProfile.healthGoals ?? null,
      medicalConditions: insertProfile.medicalConditions ?? null,
      medications: insertProfile.medications ?? null,
      updatedAt: new Date()
    };
    this.healthProfiles.set(id, profile);
    return profile;
  }

  async updateHealthProfile(userId: string, updates: Partial<InsertHealthProfile>): Promise<HealthProfile | undefined> {
    const existing = await this.getHealthProfile(userId);
    if (!existing) return undefined;
    
    const updated: HealthProfile = { 
      ...existing, 
      ...updates,
      updatedAt: new Date()
    };
    this.healthProfiles.set(existing.id, updated);
    return updated;
  }

  // Health plans methods
  async getHealthPlans(userId: string): Promise<HealthPlan[]> {
    return Array.from(this.healthPlans.values()).filter(
      (plan) => plan.userId === userId
    );
  }

  async getHealthPlan(id: string): Promise<HealthPlan | undefined> {
    return this.healthPlans.get(id);
  }

  async createHealthPlan(insertPlan: InsertHealthPlan): Promise<HealthPlan> {
    const id = randomUUID();
    const plan: HealthPlan = { 
      id,
      userId: insertPlan.userId,
      title: insertPlan.title,
      description: insertPlan.description ?? null,
      goalType: insertPlan.goalType,
      targetValue: insertPlan.targetValue ?? null,
      targetUnit: insertPlan.targetUnit ?? null,
      duration: insertPlan.duration ?? null,
      isActive: insertPlan.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.healthPlans.set(id, plan);
    return plan;
  }

  async updateHealthPlan(id: string, updates: Partial<InsertHealthPlan>): Promise<HealthPlan | undefined> {
    const existing = this.healthPlans.get(id);
    if (!existing) return undefined;
    
    const updated: HealthPlan = { 
      ...existing, 
      ...updates,
      updatedAt: new Date()
    };
    this.healthPlans.set(id, updated);
    return updated;
  }

  async deleteHealthPlan(id: string): Promise<boolean> {
    return this.healthPlans.delete(id);
  }

  // Health plan targets methods  
  async getHealthPlanTargets(planId: string): Promise<HealthPlanTarget[]> {
    return Array.from(this.healthPlanTargets.values())
      .filter(target => target.planId === planId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getHealthPlanTarget(id: string): Promise<HealthPlanTarget | undefined> {
    return this.healthPlanTargets.get(id);
  }

  async createHealthPlanTarget(insertTarget: InsertHealthPlanTarget): Promise<HealthPlanTarget> {
    const id = randomUUID();
    const target: HealthPlanTarget = {
      id,
      planId: insertTarget.planId,
      userId: insertTarget.userId,
      title: insertTarget.title,
      description: insertTarget.description ?? null,
      targetType: insertTarget.targetType,
      targetValue: insertTarget.targetValue,
      targetUnit: insertTarget.targetUnit,
      currentValue: insertTarget.currentValue ?? "0",
      isCompleted: insertTarget.isCompleted ?? false,
      dueDate: insertTarget.dueDate ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.healthPlanTargets.set(id, target);
    return target;
  }

  async updateHealthPlanTarget(id: string, updates: Partial<InsertHealthPlanTarget>): Promise<HealthPlanTarget | undefined> {
    const existing = this.healthPlanTargets.get(id);
    if (!existing) return undefined;
    
    const updated: HealthPlanTarget = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
    this.healthPlanTargets.set(id, updated);
    return updated;
  }

  async deleteHealthPlanTarget(id: string): Promise<boolean> {
    return this.healthPlanTargets.delete(id);
  }

  async updateTargetProgress(id: string, currentValue: number): Promise<HealthPlanTarget | undefined> {
    const target = await this.getHealthPlanTarget(id);
    if (!target) return undefined;

    const targetVal = typeof target.targetValue === 'string' ? parseFloat(target.targetValue) : target.targetValue;
    const isCompleted = currentValue >= targetVal;
    
    const updated: HealthPlanTarget = {
      ...target,
      currentValue: currentValue.toString(),
      isCompleted,
      updatedAt: new Date(),
    };
    this.healthPlanTargets.set(id, updated);
    return updated;
  }

  // Tracking entries methods
  async getTrackingEntries(userId: string, type?: string, limit = 50): Promise<TrackingEntry[]> {
    let entries = Array.from(this.trackingEntries.values()).filter(
      (entry) => entry.userId === userId
    );
    
    if (type) {
      entries = entries.filter((entry) => entry.type === type);
    }
    
    return entries
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, limit);
  }

  async getTrackingEntriesByDateRange(userId: string, startDate: Date, endDate: Date): Promise<TrackingEntry[]> {
    return Array.from(this.trackingEntries.values())
      .filter((entry) => 
        entry.userId === userId &&
        entry.date >= startDate &&
        entry.date < endDate
      )
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async getTrackingEntry(id: string): Promise<TrackingEntry | undefined> {
    return this.trackingEntries.get(id);
  }

  async createTrackingEntry(insertEntry: InsertTrackingEntry): Promise<TrackingEntry> {
    const id = randomUUID();
    const entry: TrackingEntry = { 
      id,
      userId: insertEntry.userId,
      date: insertEntry.date,
      type: insertEntry.type,
      value: insertEntry.value ?? null,
      unit: insertEntry.unit ?? null,
      notes: insertEntry.notes ?? null,
      metadata: insertEntry.metadata ?? null,
      createdAt: new Date()
    };
    this.trackingEntries.set(id, entry);
    return entry;
  }

  async updateTrackingEntry(id: string, updates: Partial<InsertTrackingEntry>): Promise<TrackingEntry | undefined> {
    const existing = this.trackingEntries.get(id);
    if (!existing) return undefined;
    
    const updated: TrackingEntry = { 
      ...existing, 
      ...updates,
    };
    this.trackingEntries.set(id, updated);
    return updated;
  }

  async deleteTrackingEntry(id: string): Promise<boolean> {
    return this.trackingEntries.delete(id);
  }

  // Mental wellness methods
  async getMentalWellnessEntries(userId: string, limit = 30): Promise<MentalWellnessEntry[]> {
    return Array.from(this.mentalWellnessEntries.values())
      .filter((entry) => entry.userId === userId)
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, limit);
  }

  async getMentalWellnessEntry(id: string): Promise<MentalWellnessEntry | undefined> {
    return this.mentalWellnessEntries.get(id);
  }

  async createMentalWellnessEntry(insertEntry: InsertMentalWellnessEntry): Promise<MentalWellnessEntry> {
    const id = randomUUID();
    const entry: MentalWellnessEntry = { 
      id,
      userId: insertEntry.userId,
      date: insertEntry.date,
      moodRating: insertEntry.moodRating ?? null,
      stressLevel: insertEntry.stressLevel ?? null,
      anxietyLevel: insertEntry.anxietyLevel ?? null,
      sleepQuality: insertEntry.sleepQuality ?? null,
      energyLevel: insertEntry.energyLevel ?? null,
      activities: insertEntry.activities ?? null,
      notes: insertEntry.notes ?? null,
      createdAt: new Date()
    };
    this.mentalWellnessEntries.set(id, entry);
    return entry;
  }

  async updateMentalWellnessEntry(id: string, updates: Partial<InsertMentalWellnessEntry>): Promise<MentalWellnessEntry | undefined> {
    const existing = this.mentalWellnessEntries.get(id);
    if (!existing) return undefined;
    
    const updated: MentalWellnessEntry = { 
      ...existing, 
      ...updates,
    };
    this.mentalWellnessEntries.set(id, updated);
    return updated;
  }

  async deleteMentalWellnessEntry(id: string): Promise<boolean> {
    return this.mentalWellnessEntries.delete(id);
  }

  // Symptom entries methods
  async getSymptomEntries(userId: string, limit = 20): Promise<SymptomEntry[]> {
    return Array.from(this.symptomEntries.values())
      .filter((entry) => entry.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async getSymptomEntry(id: string): Promise<SymptomEntry | undefined> {
    return this.symptomEntries.get(id);
  }

  async createSymptomEntry(insertEntry: InsertSymptomEntry): Promise<SymptomEntry> {
    const id = randomUUID();
    const entry: SymptomEntry = { 
      id,
      userId: insertEntry.userId,
      symptoms: insertEntry.symptoms,
      severity: insertEntry.severity ?? null,
      duration: insertEntry.duration ?? null,
      additionalInfo: insertEntry.additionalInfo ?? null,
      recommendations: insertEntry.recommendations ?? null,
      createdAt: new Date()
    };
    this.symptomEntries.set(id, entry);
    return entry;
  }

  async updateSymptomEntry(id: string, updates: Partial<InsertSymptomEntry>): Promise<SymptomEntry | undefined> {
    const existing = this.symptomEntries.get(id);
    if (!existing) return undefined;
    
    const updated: SymptomEntry = { 
      ...existing, 
      ...updates,
    };
    this.symptomEntries.set(id, updated);
    return updated;
  }

  async deleteSymptomEntry(id: string): Promise<boolean> {
    return this.symptomEntries.delete(id);
  }

  // Chat messages methods
  async getChatMessages(userId: string, limit: number = 50): Promise<ChatMessage[]> {
    const userMessages = Array.from(this.chatMessages.values())
      .filter(msg => msg.userId === userId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .slice(-limit);
    return userMessages;
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = randomUUID();
    const message: ChatMessage = { 
      id,
      userId: insertMessage.userId,
      role: insertMessage.role,
      content: insertMessage.content,
      mood: insertMessage.mood ?? null,
      suggestions: insertMessage.suggestions ?? null,
      resources: insertMessage.resources ?? null,
      createdAt: new Date()
    };
    this.chatMessages.set(id, message);
    return message;
  }

  // Grocery lists methods
  async getGroceryLists(userId: string, limit = 20): Promise<GroceryList[]> {
    return Array.from(this.groceryLists.values())
      .filter((list) => list.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  async getGroceryList(id: string): Promise<GroceryList | undefined> {
    return this.groceryLists.get(id);
  }

  async createGroceryList(insertList: InsertGroceryList): Promise<GroceryList> {
    const id = randomUUID();
    const list: GroceryList = {
      id,
      userId: insertList.userId,
      name: insertList.name,
      items: insertList.items,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.groceryLists.set(id, list);
    return list;
  }

  async updateGroceryList(id: string, updates: Partial<InsertGroceryList>): Promise<GroceryList | undefined> {
    const existing = this.groceryLists.get(id);
    if (!existing) return undefined;
    const updated: GroceryList = {
      ...existing,
      ...updates,
      updatedAt: new Date()
    };
    this.groceryLists.set(id, updated);
    return updated;
  }

  async deleteGroceryList(id: string): Promise<boolean> {
    return this.groceryLists.delete(id);
  }

  // Food detection methods
  async getFoodDetections(userId: string, limit = 10): Promise<FoodDetection[]> {
    return Array.from(this.foodDetections.values())
      .filter((detection) => detection.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  async getFoodDetection(id: string): Promise<FoodDetection | undefined> {
    return this.foodDetections.get(id);
  }

  async createFoodDetection(insertDetection: InsertFoodDetection): Promise<FoodDetection> {
    const id = randomUUID();
    const detection: FoodDetection = {
      id,
      userId: insertDetection.userId,
      imagePath: insertDetection.imagePath ?? null,
      detectedFoods: insertDetection.detectedFoods,
      totalCalories: insertDetection.totalCalories ?? null,
      healthScore: insertDetection.healthScore ?? null,
      recommendations: insertDetection.recommendations ?? null,
      createdAt: new Date()
    };
    this.foodDetections.set(id, detection);
    return detection;
  }
}

// PostgreSQL Storage implementation using Drizzle ORM
export class PostgresStorage implements IStorage {
  private db;

  constructor() {
    // Use NEON_DATABASE_URL if available, fallback to DATABASE_URL
    const dbUrl = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('NEON_DATABASE_URL or DATABASE_URL environment variable is required');
    }
    console.log('PostgresStorage - Initializing with database URL:', dbUrl ? 'Present' : 'Missing');
    const sql = neon(dbUrl);
    console.log('PostgresStorage - Neon SQL client created:', typeof sql);
    this.db = drizzle(sql);
    console.log('PostgresStorage - Drizzle client initialized');
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    try {
      console.log('PostgresStorage.getUser - Looking up user with id:', id);
      const result = await this.db.select().from(users).where(eq(users.id, id));
      console.log('PostgresStorage.getUser - Query result: Found', result.length, 'user(s)'); // Sanitized logging - no sensitive data
      return result[0];
    } catch (error) {
      console.error('PostgresStorage.getUser - Error:', error);
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await this.db.insert(users).values(insertUser).returning();
    return result[0];
  }

  // Health profile methods
  async getHealthProfile(userId: string): Promise<HealthProfile | undefined> {
    const result = await this.db.select().from(healthProfiles).where(eq(healthProfiles.userId, userId));
    return result[0];
  }

  async createHealthProfile(insertProfile: InsertHealthProfile): Promise<HealthProfile> {
    const result = await this.db.insert(healthProfiles).values(insertProfile).returning();
    return result[0];
  }

  async updateHealthProfile(userId: string, updates: Partial<InsertHealthProfile>): Promise<HealthProfile | undefined> {
    const result = await this.db.update(healthProfiles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(healthProfiles.userId, userId))
      .returning();
    return result[0];
  }

  // Health plans methods
  async getHealthPlans(userId: string): Promise<HealthPlan[]> {
    return await this.db.select().from(healthPlans)
      .where(eq(healthPlans.userId, userId))
      .orderBy(desc(healthPlans.createdAt));
  }

  async getHealthPlan(id: string): Promise<HealthPlan | undefined> {
    const result = await this.db.select().from(healthPlans).where(eq(healthPlans.id, id));
    return result[0];
  }

  async createHealthPlan(insertPlan: InsertHealthPlan): Promise<HealthPlan> {
    const result = await this.db.insert(healthPlans).values(insertPlan).returning();
    return result[0];
  }

  async updateHealthPlan(id: string, updates: Partial<InsertHealthPlan>): Promise<HealthPlan | undefined> {
    const result = await this.db.update(healthPlans)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(healthPlans.id, id))
      .returning();
    return result[0];
  }

  async deleteHealthPlan(id: string): Promise<boolean> {
    const result = await this.db.delete(healthPlans).where(eq(healthPlans.id, id));
    return result.rowCount > 0;
  }

  // Health plan targets methods
  async getHealthPlanTargets(planId: string): Promise<HealthPlanTarget[]> {
    return await this.db.select().from(healthPlanTargets)
      .where(eq(healthPlanTargets.planId, planId))
      .orderBy(desc(healthPlanTargets.createdAt));
  }

  async getHealthPlanTarget(id: string): Promise<HealthPlanTarget | undefined> {
    const result = await this.db.select().from(healthPlanTargets).where(eq(healthPlanTargets.id, id));
    return result[0];
  }

  async createHealthPlanTarget(insertTarget: InsertHealthPlanTarget): Promise<HealthPlanTarget> {
    const result = await this.db.insert(healthPlanTargets).values(insertTarget).returning();
    return result[0];
  }

  async updateHealthPlanTarget(id: string, updates: Partial<InsertHealthPlanTarget>): Promise<HealthPlanTarget | undefined> {
    const result = await this.db.update(healthPlanTargets)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(healthPlanTargets.id, id))
      .returning();
    return result[0];
  }

  async deleteHealthPlanTarget(id: string): Promise<boolean> {
    const result = await this.db.delete(healthPlanTargets).where(eq(healthPlanTargets.id, id));
    return result.rowCount > 0;
  }

  async updateTargetProgress(id: string, currentValue: number): Promise<HealthPlanTarget | undefined> {
    const target = await this.getHealthPlanTarget(id);
    if (!target) return undefined;

    const targetVal = typeof target.targetValue === 'string' ? parseFloat(target.targetValue) : target.targetValue;
    const isCompleted = currentValue >= targetVal;
    
    const result = await this.db.update(healthPlanTargets)
      .set({ 
        currentValue: currentValue.toString(), 
        isCompleted,
        updatedAt: new Date()
      })
      .where(eq(healthPlanTargets.id, id))
      .returning();
    return result[0];
  }

  // Tracking entries methods
  async getTrackingEntries(userId: string, type?: string, limit = 50): Promise<TrackingEntry[]> {
    let whereClause = eq(trackingEntries.userId, userId);
    
    if (type) {
      whereClause = and(whereClause, eq(trackingEntries.type, type))!;
    }
    
    return await this.db.select().from(trackingEntries)
      .where(whereClause)
      .orderBy(desc(trackingEntries.date))
      .limit(limit);
  }

  async getTrackingEntriesByDateRange(userId: string, startDate: Date, endDate: Date): Promise<TrackingEntry[]> {
    return await this.db.select().from(trackingEntries)
      .where(and(
        eq(trackingEntries.userId, userId),
        gte(trackingEntries.date, startDate),
        lt(trackingEntries.date, endDate)
      )!)
      .orderBy(desc(trackingEntries.date));
  }

  async getTrackingEntry(id: string): Promise<TrackingEntry | undefined> {
    const result = await this.db.select().from(trackingEntries).where(eq(trackingEntries.id, id));
    return result[0];
  }

  async createTrackingEntry(insertEntry: InsertTrackingEntry): Promise<TrackingEntry> {
    const result = await this.db.insert(trackingEntries).values(insertEntry).returning();
    return result[0];
  }

  async updateTrackingEntry(id: string, updates: Partial<InsertTrackingEntry>): Promise<TrackingEntry | undefined> {
    const result = await this.db.update(trackingEntries)
      .set(updates)
      .where(eq(trackingEntries.id, id))
      .returning();
    return result[0];
  }

  async deleteTrackingEntry(id: string): Promise<boolean> {
    const result = await this.db.delete(trackingEntries).where(eq(trackingEntries.id, id));
    return result.rowCount > 0;
  }

  // Mental wellness methods
  async getMentalWellnessEntries(userId: string, limit = 30): Promise<MentalWellnessEntry[]> {
    return await this.db.select().from(mentalWellnessEntries)
      .where(eq(mentalWellnessEntries.userId, userId))
      .orderBy(desc(mentalWellnessEntries.date))
      .limit(limit);
  }

  async getMentalWellnessEntry(id: string): Promise<MentalWellnessEntry | undefined> {
    const result = await this.db.select().from(mentalWellnessEntries).where(eq(mentalWellnessEntries.id, id));
    return result[0];
  }

  async createMentalWellnessEntry(insertEntry: InsertMentalWellnessEntry): Promise<MentalWellnessEntry> {
    const result = await this.db.insert(mentalWellnessEntries).values(insertEntry).returning();
    return result[0];
  }

  async updateMentalWellnessEntry(id: string, updates: Partial<InsertMentalWellnessEntry>): Promise<MentalWellnessEntry | undefined> {
    const result = await this.db.update(mentalWellnessEntries)
      .set(updates)
      .where(eq(mentalWellnessEntries.id, id))
      .returning();
    return result[0];
  }

  async deleteMentalWellnessEntry(id: string): Promise<boolean> {
    const result = await this.db.delete(mentalWellnessEntries).where(eq(mentalWellnessEntries.id, id));
    return result.rowCount > 0;
  }

  // Symptom entries methods
  async getSymptomEntries(userId: string, limit = 20): Promise<SymptomEntry[]> {
    return await this.db.select().from(symptomEntries)
      .where(eq(symptomEntries.userId, userId))
      .orderBy(desc(symptomEntries.createdAt))
      .limit(limit);
  }

  async getSymptomEntry(id: string): Promise<SymptomEntry | undefined> {
    const result = await this.db.select().from(symptomEntries).where(eq(symptomEntries.id, id));
    return result[0];
  }

  async createSymptomEntry(insertEntry: InsertSymptomEntry): Promise<SymptomEntry> {
    const result = await this.db.insert(symptomEntries).values(insertEntry).returning();
    return result[0];
  }

  async updateSymptomEntry(id: string, updates: Partial<InsertSymptomEntry>): Promise<SymptomEntry | undefined> {
    const result = await this.db.update(symptomEntries)
      .set(updates)
      .where(eq(symptomEntries.id, id))
      .returning();
    return result[0];
  }

  async deleteSymptomEntry(id: string): Promise<boolean> {
    const result = await this.db.delete(symptomEntries).where(eq(symptomEntries.id, id));
    return result.rowCount > 0;
  }

  // Chat messages methods
  async getChatMessages(userId: string, limit = 50): Promise<ChatMessage[]> {
    return await this.db.select().from(chatMessages)
      .where(eq(chatMessages.userId, userId))
      .orderBy(chatMessages.createdAt)
      .limit(limit);
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const result = await this.db.insert(chatMessages).values(insertMessage).returning();
    return result[0];
  }

  // Grocery lists methods
  async getGroceryLists(userId: string, limit = 20): Promise<GroceryList[]> {
    return await this.db.select().from(groceryLists)
      .where(eq(groceryLists.userId, userId))
      .orderBy(desc(groceryLists.createdAt))
      .limit(limit);
  }

  async getGroceryList(id: string): Promise<GroceryList | undefined> {
    const result = await this.db.select().from(groceryLists).where(eq(groceryLists.id, id));
    return result[0];
  }

  async createGroceryList(insertList: InsertGroceryList): Promise<GroceryList> {
    const result = await this.db.insert(groceryLists).values(insertList).returning();
    return result[0];
  }

  async updateGroceryList(id: string, updates: Partial<InsertGroceryList>): Promise<GroceryList | undefined> {
    const result = await this.db.update(groceryLists)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(groceryLists.id, id))
      .returning();
    return result[0];
  }

  async deleteGroceryList(id: string): Promise<boolean> {
    const result = await this.db.delete(groceryLists).where(eq(groceryLists.id, id));
    return result.rowCount > 0;
  }

  // Food detection methods
  async getFoodDetections(userId: string, limit = 10): Promise<FoodDetection[]> {
    return await this.db.select().from(foodDetections)
      .where(eq(foodDetections.userId, userId))
      .orderBy(desc(foodDetections.createdAt))
      .limit(limit);
  }

  async getFoodDetection(id: string): Promise<FoodDetection | undefined> {
    const result = await this.db.select().from(foodDetections).where(eq(foodDetections.id, id));
    return result[0];
  }

  async createFoodDetection(insertDetection: InsertFoodDetection): Promise<FoodDetection> {
    const result = await this.db.insert(foodDetections).values(insertDetection).returning();
    return result[0];
  }
}

// Export the storage instance - use PostgreSQL in production, MemStorage for testing
export const storage = process.env.NODE_ENV === 'development' 
  ? new PostgresStorage() 
  : new MemStorage();
