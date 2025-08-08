import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  date,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - required for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull().unique(),
  password: varchar("password").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Journal entries
export const journals = pgTable("journals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  title: text("title"),
  content: text("content"),
  mood: varchar("mood"), // emoji or mood identifier
  createdAt: timestamp("created_at").defaultNow(),
});

// Personal goals
export const goals = pgTable("goals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  targetValue: integer("target_value"),
  currentValue: integer("current_value").default(0),
  unit: varchar("unit"), // e.g., "books", "days", "lessons"
  duration: varchar("duration"), // e.g., "monthly", "yearly"
  completed: boolean("completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// AI-generated tasks
export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  category: varchar("category"), // e.g., "Productivity", "Wellness", "Learning"
  timeEstimate: integer("time_estimate"), // in minutes
  priority: varchar("priority").default("medium"), // low, medium, high
  completed: boolean("completed").default(false),
  relatedGoalId: varchar("related_goal_id").references(() => goals.id),
  generatedAt: timestamp("generated_at").defaultNow(),
});

// Daily dashboard content (quotes, focus areas)
export const dashboardContent = pgTable("dashboard_content", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  dailyQuote: text("daily_quote"),
  focusArea: text("focus_area"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  journals: many(journals),
  goals: many(goals),
  tasks: many(tasks),
  dashboardContent: many(dashboardContent),
}));

export const journalsRelations = relations(journals, ({ one }) => ({
  user: one(users, {
    fields: [journals.userId],
    references: [users.id],
  }),
}));

export const goalsRelations = relations(goals, ({ one, many }) => ({
  user: one(users, {
    fields: [goals.userId],
    references: [users.id],
  }),
  tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  user: one(users, {
    fields: [tasks.userId],
    references: [users.id],
  }),
  relatedGoal: one(goals, {
    fields: [tasks.relatedGoalId],
    references: [goals.id],
  }),
}));

export const dashboardContentRelations = relations(dashboardContent, ({ one }) => ({
  user: one(users, {
    fields: [dashboardContent.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertJournalSchema = createInsertSchema(journals).omit({
  id: true,
  createdAt: true,
});

export const insertGoalSchema = createInsertSchema(goals).omit({
  id: true,
  createdAt: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  generatedAt: true,
});

export const insertDashboardContentSchema = createInsertSchema(dashboardContent).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Journal = typeof journals.$inferSelect;
export type InsertJournal = z.infer<typeof insertJournalSchema>;
export type Goal = typeof goals.$inferSelect;
export type InsertGoal = z.infer<typeof insertGoalSchema>;
export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type DashboardContent = typeof dashboardContent.$inferSelect;
export type InsertDashboardContent = z.infer<typeof insertDashboardContentSchema>;
