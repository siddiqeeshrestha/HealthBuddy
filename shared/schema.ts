import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, doublePrecision, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User roles enum
export const userRoleEnum = z.enum(['END_USER', 'HEALTHCARE_PROFESSIONAL', 'ADMIN']);

// Users table for custom authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name"),
  role: text("role").notNull().default('END_USER'), // END_USER, HEALTHCARE_PROFESSIONAL, ADMIN
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Health profiles store user's comprehensive health information
export const healthProfiles = pgTable("health_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  // Basic demographics
  gender: text("gender"), // male, female, other, prefer_not_to_say
  age: integer("age"),
  height: decimal("height"), // in cm
  weight: decimal("weight"), // current weight in kg (keeping existing column name)
  goalWeight: decimal("goal_weight"), // in kg
  // Activity and fitness
  activityLevel: text("activity_level"), // sedentary, light, moderate, active, very_active
  healthGoals: text("health_goals").array(), // keeping existing column name: weight_loss, muscle_gain, general_fitness, endurance, strength
  // Health information
  medicalConditions: text("medical_conditions").array(),
  allergies: text("allergies").array(),
  medications: text("medications").array(),
  dietaryPreferences: text("dietary_preferences").array(), // vegetarian, vegan, keto, paleo, gluten_free, dairy_free, etc.
  // Profile completion tracking
  profileCompletedAt: timestamp("profile_completed_at"),
  lastProfileUpdate: timestamp("last_profile_update").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Health plans for personalized recommendations
export const healthPlans = pgTable("health_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  goalType: text("goal_type").notNull(), // weight_loss, muscle_gain, general_fitness, mental_health
  targetValue: decimal("target_value"),
  targetUnit: text("target_unit"),
  duration: integer("duration"), // days
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Daily tracking entries
export const trackingEntries = pgTable("tracking_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull(),
  type: text("type").notNull(), // exercise, nutrition, water, sleep, weight, mood
  value: doublePrecision("value"),
  unit: text("unit"),
  notes: text("notes"),
  metadata: jsonb("metadata"), // for flexible data like exercise details
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Mental wellness tracking
export const mentalWellnessEntries = pgTable("mental_wellness_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull(),
  moodRating: integer("mood_rating"), // 1-10 scale
  stressLevel: integer("stress_level"), // 1-10 scale
  anxietyLevel: integer("anxiety_level"), // 1-10 scale
  sleepQuality: integer("sleep_quality"), // 1-10 scale
  energyLevel: integer("energy_level"), // 1-10 scale
  activities: text("activities").array(), // meditation, exercise, socializing, etc.
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Symptom checker entries
export const symptomEntries = pgTable("symptom_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  symptoms: text("symptoms").array().notNull(),
  severity: integer("severity"), // 1-10 scale
  duration: text("duration"), // hours, days, weeks
  additionalInfo: text("additional_info"),
  recommendations: text("recommendations"), // Keep for backward compatibility
  analysis: jsonb("analysis"), // Structured AI analysis result
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// HealthBuddy chat messages for mental wellness support
export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // 'user' or 'assistant'
  content: text("content").notNull(),
  mood: text("mood"), // detected mood from AI response
  suggestions: text("suggestions").array(), // AI suggestions
  resources: text("resources").array(), // AI resources
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas with validation
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
}).extend({
  role: userRoleEnum.optional(),
});

// Comprehensive onboarding validation schema
export const onboardingHealthProfileSchema = createInsertSchema(healthProfiles).omit({
  id: true,
  updatedAt: true,
  lastProfileUpdate: true,
  profileCompletedAt: true,
}).extend({
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']),
  age: z.coerce.number().int().min(13, "Must be at least 13 years old").max(120, "Invalid age"),
  height: z.coerce.number().min(100, "Height must be at least 100cm").max(250, "Invalid height"),
  weight: z.coerce.number().min(20, "Weight must be at least 20kg").max(500, "Invalid weight"),
  goalWeight: z.coerce.number().min(20, "Goal weight must be at least 20kg").max(500, "Invalid goal weight").optional(),
  activityLevel: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']),
  healthGoals: z.array(z.enum(['weight_loss', 'muscle_gain', 'general_fitness', 'endurance', 'strength', 'flexibility', 'stress_relief'])).min(1, "Select at least one fitness goal"),
  medicalConditions: z.array(z.string()).default([]),
  allergies: z.array(z.string()).default([]),
  medications: z.array(z.string()).default([]),
  dietaryPreferences: z.array(z.enum(['none', 'vegetarian', 'vegan', 'keto', 'paleo', 'gluten_free', 'dairy_free', 'low_carb', 'mediterranean', 'intermittent_fasting'])).default([]),
});

// Profile update schema (allows partial updates)
export const insertHealthProfileSchema = createInsertSchema(healthProfiles).omit({
  id: true,
  updatedAt: true,
}).extend({
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
  age: z.coerce.number().int().min(13).max(120).optional(),
  height: z.coerce.number().min(100).max(250).optional(),
  weight: z.coerce.number().min(20).max(500).optional(),
  goalWeight: z.coerce.number().min(20).max(500).optional(),
  activityLevel: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']).optional(),
  healthGoals: z.array(z.enum(['weight_loss', 'muscle_gain', 'general_fitness', 'endurance', 'strength', 'flexibility', 'stress_relief'])).optional(),
  medicalConditions: z.array(z.string()).optional(),
  allergies: z.array(z.string()).optional(),
  medications: z.array(z.string()).optional(),
  dietaryPreferences: z.array(z.enum(['none', 'vegetarian', 'vegan', 'keto', 'paleo', 'gluten_free', 'dairy_free', 'low_carb', 'mediterranean', 'intermittent_fasting'])).optional(),
});

export const insertHealthPlanSchema = createInsertSchema(healthPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTrackingEntrySchema = createInsertSchema(trackingEntries).omit({
  id: true,
  createdAt: true,
}).extend({
  date: z.coerce.date(),
});

export const insertMentalWellnessEntrySchema = createInsertSchema(mentalWellnessEntries).omit({
  id: true,
  createdAt: true,
}).extend({
  date: z.coerce.date(),
});

export const insertSymptomEntrySchema = createInsertSchema(symptomEntries).omit({
  id: true,
  createdAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

// Doctor search request schema
export const doctorSearchRequestSchema = z.object({
  address: z.string().min(1, "Address is required").max(500, "Address too long"),
  symptoms: z.array(z.string()).min(1, "At least one symptom is required").max(10, "Too many symptoms"),
  severity: z.number().int().min(1, "Severity must be at least 1").max(10, "Severity must be at most 10")
});

// Doctor response schema
export const doctorSchema = z.object({
  name: z.string(),
  degree: z.string(),
  specialization: z.string(),
  hospitalOrClinic: z.string(),
  address: z.string(),
  phone: z.string().optional(),
  visitingHours: z.string().optional(),
  rating: z.string().optional()
});

// Specific schema for symptom analysis request
export const symptomAnalysisRequestSchema = z.object({
  symptoms: z.array(z.string()).min(1, "At least one symptom is required"),
  severity: z.number().int().min(1).max(10),
  duration: z.enum([
    "less than 1 hour",
    "1-6 hours", 
    "6-24 hours",
    "1-3 days",
    "3-7 days", 
    "1-2 weeks",
    "2-4 weeks",
    "more than 1 month"
  ]),
  additionalInfo: z.string().optional()
});

// Specific schemas for different tracking types
export const insertCalorieLogSchema = insertTrackingEntrySchema.extend({
  type: z.literal('nutrition'),
  value: z.coerce.number().positive('Calories must be positive'),
  unit: z.literal('calories'),
  metadata: z.object({
    foodItem: z.string().optional(),
    mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']).optional(),
  }).optional(),
});

export const insertExerciseLogSchema = insertTrackingEntrySchema.extend({
  type: z.literal('exercise'),
  value: z.coerce.number().positive('Duration must be positive').optional(),
  unit: z.enum(['minutes', 'hours']).optional(),
  metadata: z.object({
    exerciseType: z.string(),
    intensity: z.enum(['low', 'moderate', 'high']).optional(),
    caloriesBurned: z.number().optional(),
  }),
});

export const insertWeightLogSchema = insertTrackingEntrySchema.extend({
  type: z.literal('weight'),
  value: z.coerce.number().positive('Weight must be positive'),
  unit: z.enum(['kg', 'lbs']),
});

export const insertWaterLogSchema = insertTrackingEntrySchema.extend({
  type: z.literal('water'),
  value: z.coerce.number().positive('Water intake must be positive'),
  unit: z.enum(['ml', 'liters', 'cups']),
});

export const insertSleepLogSchema = insertTrackingEntrySchema.extend({
  type: z.literal('sleep'),
  value: z.coerce.number().min(0).max(24, 'Sleep duration cannot exceed 24 hours'),
  unit: z.literal('hours'),
  metadata: z.object({
    bedtime: z.string().optional(),
    wakeupTime: z.string().optional(),
    quality: z.number().min(1).max(10).optional(),
  }).optional(),
});

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type HealthProfile = typeof healthProfiles.$inferSelect;
export type InsertHealthProfile = z.infer<typeof insertHealthProfileSchema>;
export type OnboardingHealthProfile = z.infer<typeof onboardingHealthProfileSchema>;

export type HealthPlan = typeof healthPlans.$inferSelect;
export type InsertHealthPlan = z.infer<typeof insertHealthPlanSchema>;

export type TrackingEntry = typeof trackingEntries.$inferSelect;
export type InsertTrackingEntry = z.infer<typeof insertTrackingEntrySchema>;

export type MentalWellnessEntry = typeof mentalWellnessEntries.$inferSelect;
export type InsertMentalWellnessEntry = z.infer<typeof insertMentalWellnessEntrySchema>;

export type SymptomEntry = typeof symptomEntries.$inferSelect;
export type InsertSymptomEntry = z.infer<typeof insertSymptomEntrySchema>;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

// Specific tracking type definitions
export type InsertCalorieLog = z.infer<typeof insertCalorieLogSchema>;
export type InsertExerciseLog = z.infer<typeof insertExerciseLogSchema>;
export type InsertWeightLog = z.infer<typeof insertWeightLogSchema>;
export type InsertWaterLog = z.infer<typeof insertWaterLogSchema>;
export type InsertSleepLog = z.infer<typeof insertSleepLogSchema>;
