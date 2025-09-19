import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for custom authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Health profiles store user's basic health information
export const healthProfiles = pgTable("health_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  age: integer("age"),
  height: decimal("height"), // in cm
  weight: decimal("weight"), // in kg
  activityLevel: text("activity_level"), // sedentary, light, moderate, active, very_active
  healthGoals: text("health_goals").array(),
  medicalConditions: text("medical_conditions").array(),
  medications: text("medications").array(),
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
  value: decimal("value"),
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
  recommendations: text("recommendations"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas with validation
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
});

export const insertHealthProfileSchema = createInsertSchema(healthProfiles).omit({
  id: true,
  updatedAt: true,
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

export type HealthPlan = typeof healthPlans.$inferSelect;
export type InsertHealthPlan = z.infer<typeof insertHealthPlanSchema>;

export type TrackingEntry = typeof trackingEntries.$inferSelect;
export type InsertTrackingEntry = z.infer<typeof insertTrackingEntrySchema>;

export type MentalWellnessEntry = typeof mentalWellnessEntries.$inferSelect;
export type InsertMentalWellnessEntry = z.infer<typeof insertMentalWellnessEntrySchema>;

export type SymptomEntry = typeof symptomEntries.$inferSelect;
export type InsertSymptomEntry = z.infer<typeof insertSymptomEntrySchema>;

// Specific tracking type definitions
export type InsertCalorieLog = z.infer<typeof insertCalorieLogSchema>;
export type InsertExerciseLog = z.infer<typeof insertExerciseLogSchema>;
export type InsertWeightLog = z.infer<typeof insertWeightLogSchema>;
export type InsertWaterLog = z.infer<typeof insertWaterLogSchema>;
export type InsertSleepLog = z.infer<typeof insertSleepLogSchema>;
