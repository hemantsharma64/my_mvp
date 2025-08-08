import {
  users,
  journals,
  goals,
  tasks,
  dashboardContent,
  type User,
  type UpsertUser,
  type Journal,
  type InsertJournal,
  type Goal,
  type InsertGoal,
  type Task,
  type InsertTask,
  type DashboardContent,
  type InsertDashboardContent,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, gte, lte } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Journal operations
  createJournal(journal: InsertJournal): Promise<Journal>;
  getJournals(userId: string): Promise<Journal[]>;
  getJournalByDate(userId: string, date: string): Promise<Journal | undefined>;
  updateJournal(id: string, journal: Partial<InsertJournal>): Promise<Journal>;
  getRecentJournals(userId: string, days: number): Promise<Journal[]>;

  // Goal operations
  createGoal(goal: InsertGoal): Promise<Goal>;
  getGoals(userId: string): Promise<Goal[]>;
  updateGoal(id: string, goal: Partial<InsertGoal>): Promise<Goal>;
  deleteGoal(id: string): Promise<void>;

  // Task operations
  createTask(task: InsertTask): Promise<Task>;
  getTasks(userId: string, date?: string): Promise<Task[]>;
  updateTask(id: string, task: Partial<InsertTask>): Promise<Task>;
  deleteTask(id: string): Promise<void>;
  createMultipleTasks(tasks: InsertTask[]): Promise<Task[]>;

  // Dashboard content operations
  createDashboardContent(content: InsertDashboardContent): Promise<DashboardContent>;
  getDashboardContent(userId: string, date: string): Promise<DashboardContent | undefined>;
  updateDashboardContent(id: string, content: Partial<InsertDashboardContent>): Promise<DashboardContent>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Journal operations
  async createJournal(journal: InsertJournal): Promise<Journal> {
    const [newJournal] = await db.insert(journals).values(journal).returning();
    return newJournal;
  }

  async getJournals(userId: string): Promise<Journal[]> {
    return await db
      .select()
      .from(journals)
      .where(eq(journals.userId, userId))
      .orderBy(desc(journals.date));
  }

  async getJournalByDate(userId: string, date: string): Promise<Journal | undefined> {
    const [journal] = await db
      .select()
      .from(journals)
      .where(and(eq(journals.userId, userId), eq(journals.date, date)));
    return journal;
  }

  async updateJournal(id: string, journal: Partial<InsertJournal>): Promise<Journal> {
    const [updatedJournal] = await db
      .update(journals)
      .set(journal)
      .where(eq(journals.id, id))
      .returning();
    return updatedJournal;
  }

  async getRecentJournals(userId: string, days: number): Promise<Journal[]> {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);
    
    return await db
      .select()
      .from(journals)
      .where(
        and(
          eq(journals.userId, userId),
          gte(journals.date, sinceDate.toISOString().split('T')[0])
        )
      )
      .orderBy(desc(journals.date));
  }

  // Goal operations
  async createGoal(goal: InsertGoal): Promise<Goal> {
    const [newGoal] = await db.insert(goals).values(goal).returning();
    return newGoal;
  }

  async getGoals(userId: string): Promise<Goal[]> {
    return await db
      .select()
      .from(goals)
      .where(eq(goals.userId, userId))
      .orderBy(desc(goals.createdAt));
  }

  async updateGoal(id: string, goal: Partial<InsertGoal>): Promise<Goal> {
    const [updatedGoal] = await db
      .update(goals)
      .set(goal)
      .where(eq(goals.id, id))
      .returning();
    return updatedGoal;
  }

  async deleteGoal(id: string): Promise<void> {
    await db.delete(goals).where(eq(goals.id, id));
  }

  // Task operations
  async createTask(task: InsertTask): Promise<Task> {
    const [newTask] = await db.insert(tasks).values(task).returning();
    return newTask;
  }

  async getTasks(userId: string, date?: string): Promise<Task[]> {
    const conditions = [eq(tasks.userId, userId)];
    if (date) {
      conditions.push(eq(tasks.date, date));
    }

    return await db
      .select()
      .from(tasks)
      .where(and(...conditions))
      .orderBy(desc(tasks.generatedAt));
  }

  async updateTask(id: string, task: Partial<InsertTask>): Promise<Task> {
    const [updatedTask] = await db
      .update(tasks)
      .set(task)
      .where(eq(tasks.id, id))
      .returning();
    return updatedTask;
  }

  async deleteTask(id: string): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  async createMultipleTasks(taskList: InsertTask[]): Promise<Task[]> {
    return await db.insert(tasks).values(taskList).returning();
  }

  // Dashboard content operations
  async createDashboardContent(content: InsertDashboardContent): Promise<DashboardContent> {
    const [newContent] = await db.insert(dashboardContent).values(content).returning();
    return newContent;
  }

  async getDashboardContent(userId: string, date: string): Promise<DashboardContent | undefined> {
    const [content] = await db
      .select()
      .from(dashboardContent)
      .where(and(eq(dashboardContent.userId, userId), eq(dashboardContent.date, date)));
    return content;
  }

  async updateDashboardContent(id: string, content: Partial<InsertDashboardContent>): Promise<DashboardContent> {
    const [updatedContent] = await db
      .update(dashboardContent)
      .set(content)
      .where(eq(dashboardContent.id, id))
      .returning();
    return updatedContent;
  }
}

export const storage = new DatabaseStorage();
