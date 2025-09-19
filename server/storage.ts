import { 
  type User, 
  type InsertUser, 
  type HealthProfile, 
  type InsertHealthProfile,
  type HealthPlan,
  type InsertHealthPlan,
  type TrackingEntry,
  type InsertTrackingEntry,
  type MentalWellnessEntry,
  type InsertMentalWellnessEntry,
  type SymptomEntry,
  type InsertSymptomEntry
} from "@shared/schema";
import { randomUUID } from "crypto";

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
  
  // Tracking entries methods
  getTrackingEntries(userId: string, type?: string, limit?: number): Promise<TrackingEntry[]>;
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
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private healthProfiles: Map<string, HealthProfile>;
  private healthPlans: Map<string, HealthPlan>;
  private trackingEntries: Map<string, TrackingEntry>;
  private mentalWellnessEntries: Map<string, MentalWellnessEntry>;
  private symptomEntries: Map<string, SymptomEntry>;

  constructor() {
    this.users = new Map();
    this.healthProfiles = new Map();
    this.healthPlans = new Map();
    this.trackingEntries = new Map();
    this.mentalWellnessEntries = new Map();
    this.symptomEntries = new Map();
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
    // For Firebase users, ID must come from Firebase UID
    const user: User = { 
      id: insertUser.id, // Firebase UID required
      email: insertUser.email,
      displayName: insertUser.displayName ?? null,
      photoURL: insertUser.photoURL ?? null,
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
      isActive: insertPlan.isActive ?? null,
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
}

export const storage = new MemStorage();
