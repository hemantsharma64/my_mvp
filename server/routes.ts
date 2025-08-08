import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import { aiService } from "./services/aiService";
import { insertJournalSchema, insertGoalSchema, insertTaskSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // User route is handled in auth.ts

  // Dashboard route
  app.get('/api/dashboard', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const today = new Date().toISOString().split('T')[0];
      
      // Get today's tasks
      const tasks = await storage.getTasks(userId, today);
      
      // Get active goals
      const goals = await storage.getGoals(userId);
      
      // Get today's dashboard content
      let dashboardContent = await storage.getDashboardContent(userId, today);
      
      // If no dashboard content for today, generate it
      if (!dashboardContent && tasks.length === 0) {
        try {
          const recentJournals = await storage.getRecentJournals(userId, 7);
          const aiResponse = await aiService.generateDailyTasks({
            userId,
            recentJournals,
            goals
          });
          
          // Create dashboard content
          dashboardContent = await storage.createDashboardContent({
            userId,
            date: today,
            dailyQuote: aiResponse.dailyQuote,
            focusArea: aiResponse.focusArea
          });
          
          // Create tasks
          const tasksToCreate = aiResponse.tasks.map(task => ({
            ...task,
            userId,
            date: today,
            relatedGoalId: task.relatedGoalId || null
          }));
          
          await storage.createMultipleTasks(tasksToCreate);
          
          // Get newly created tasks
          const newTasks = await storage.getTasks(userId, today);
          
          res.json({
            tasks: newTasks,
            goals,
            dashboardContent,
            stats: await getStats(userId)
          });
          return;
        } catch (aiError) {
          console.error('AI task generation failed:', aiError);
          // Continue without AI-generated content
        }
      }
      
      res.json({
        tasks,
        goals,
        dashboardContent,
        stats: await getStats(userId)
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  // Journal routes
  app.post('/api/journals', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const journalData = insertJournalSchema.parse({
        ...req.body,
        userId
      });
      
      // Check if journal exists for this date
      const existingJournal = await storage.getJournalByDate(userId, journalData.date);
      
      if (existingJournal) {
        // Update existing journal
        const updatedJournal = await storage.updateJournal(existingJournal.id, journalData);
        res.json(updatedJournal);
      } else {
        // Create new journal
        const journal = await storage.createJournal(journalData);
        res.json(journal);
      }
    } catch (error) {
      console.error("Error creating/updating journal:", error);
      res.status(400).json({ message: "Failed to save journal entry" });
    }
  });

  app.get('/api/journals', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const journals = await storage.getJournals(userId);
      res.json(journals);
    } catch (error) {
      console.error("Error fetching journals:", error);
      res.status(500).json({ message: "Failed to fetch journals" });
    }
  });

  app.get('/api/journals/:date', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { date } = req.params;
      const journal = await storage.getJournalByDate(userId, date);
      res.json(journal || null);
    } catch (error) {
      console.error("Error fetching journal by date:", error);
      res.status(500).json({ message: "Failed to fetch journal" });
    }
  });

  // Goal routes
  app.post('/api/goals', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const goalData = insertGoalSchema.parse({
        ...req.body,
        userId
      });
      
      const goal = await storage.createGoal(goalData);
      res.json(goal);
    } catch (error) {
      console.error("Error creating goal:", error);
      res.status(400).json({ message: "Failed to create goal" });
    }
  });

  app.get('/api/goals', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const goals = await storage.getGoals(userId);
      res.json(goals);
    } catch (error) {
      console.error("Error fetching goals:", error);
      res.status(500).json({ message: "Failed to fetch goals" });
    }
  });

  app.put('/api/goals/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const goalData = req.body;
      
      const goal = await storage.updateGoal(id, goalData);
      res.json(goal);
    } catch (error) {
      console.error("Error updating goal:", error);
      res.status(400).json({ message: "Failed to update goal" });
    }
  });

  app.delete('/api/goals/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteGoal(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting goal:", error);
      res.status(500).json({ message: "Failed to delete goal" });
    }
  });

  // Task routes
  app.get('/api/tasks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { date } = req.query;
      const tasks = await storage.getTasks(userId, date as string);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.put('/api/tasks/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const taskData = req.body;
      
      const task = await storage.updateTask(id, taskData);
      res.json(task);
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(400).json({ message: "Failed to update task" });
    }
  });

  // Manual task generation
  app.post('/api/generate-tasks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const today = new Date().toISOString().split('T')[0];
      
      console.log('Manual task generation requested for user:', userId);
      
      // Get recent journals and goals
      const recentJournals = await storage.getRecentJournals(userId, 7);
      const goals = await storage.getGoals(userId);
      
      // Generate AI response
      const aiResponse = await aiService.generateDailyTasks({
        userId,
        recentJournals,
        goals
      });
      
      // Delete existing tasks for today
      const existingTasks = await storage.getTasks(userId, today);
      for (const task of existingTasks) {
        await storage.deleteTask(task.id);
      }
      
      // Create new tasks
      const tasksToCreate = aiResponse.tasks.map(task => ({
        ...task,
        userId,
        date: today,
        relatedGoalId: task.relatedGoalId || null
      }));
      
      const createdTasks = await storage.createMultipleTasks(tasksToCreate);
      
      // Update or create dashboard content
      let dashboardContent = await storage.getDashboardContent(userId, today);
      if (dashboardContent) {
        dashboardContent = await storage.updateDashboardContent(dashboardContent.id, {
          dailyQuote: aiResponse.dailyQuote,
          focusArea: aiResponse.focusArea
        });
      } else {
        dashboardContent = await storage.createDashboardContent({
          userId,
          date: today,
          dailyQuote: aiResponse.dailyQuote,
          focusArea: aiResponse.focusArea
        });
      }
      
      console.log(`Generated ${createdTasks.length} tasks for user ${userId}`);
      
      res.json({
        tasks: createdTasks,
        dashboardContent,
        message: `Generated ${createdTasks.length} new tasks for today`
      });
    } catch (error) {
      console.error("Error generating tasks:", error);
      res.status(500).json({ message: "Failed to generate tasks. Please try again." });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

async function getStats(userId: string) {
  try {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 7);
    
    // Get all user's data for stats calculation
    const allTasks = await storage.getTasks(userId);
    const allJournals = await storage.getJournals(userId);
    const goals = await storage.getGoals(userId);
    
    // Calculate weekly stats
    const weekStartStr = weekStart.toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];
    
    const weeklyTasks = allTasks.filter(task => 
      task.date >= weekStartStr && task.date <= todayStr
    );
    const weeklyJournals = allJournals.filter(journal =>
      journal.date >= weekStartStr && journal.date <= todayStr
    );
    
    const completedTasks = weeklyTasks.filter(task => task.completed).length;
    const totalTasks = weeklyTasks.length;
    const journalEntries = weeklyJournals.length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    // Calculate goal progress
    const goalsWithProgress = goals.filter(goal => goal.currentValue && goal.targetValue);
    const avgGoalProgress = goalsWithProgress.length > 0 
      ? Math.round(goalsWithProgress.reduce((sum, goal) => 
          sum + ((goal.currentValue || 0) / (goal.targetValue || 1)), 0) / goalsWithProgress.length * 100)
      : 0;

    // Calculate journal streak
    let streak = 0;
    const sortedJournals = allJournals.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const currentDate = new Date();
    
    for (let i = 0; i < sortedJournals.length; i++) {
      const journalDate = new Date(sortedJournals[i].date);
      const daysDiff = Math.floor((currentDate.getTime() - journalDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === i) {
        streak++;
      } else {
        break;
      }
    }
    
    return {
      tasksCompleted: completedTasks,
      totalTasks,
      journalEntries,
      completionRate,
      goalProgress: avgGoalProgress,
      streak
    };
  } catch (error) {
    console.error('Error calculating stats:', error);
    return {
      tasksCompleted: 0,
      totalTasks: 0,
      journalEntries: 0,
      completionRate: 0,
      goalProgress: 0,
      streak: 0
    };
  }
}
