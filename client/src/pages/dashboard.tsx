import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Circle, Clock, Target, BookOpen, Calendar, Quote, Flame, TrendingUp, PenTool, LogOut } from "lucide-react";

export default function Dashboard() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to access the dashboard",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: dashboardData, isLoading: isDashboardLoading } = useQuery({
    queryKey: ["/api/dashboard"],
    enabled: isAuthenticated,
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error as Error)) {
        return false;
      }
      return failureCount < 3;
    },
  });

  const { data: todayJournal } = useQuery({
    queryKey: ["/api/journals", new Date().toISOString().split('T')[0]],
    enabled: isAuthenticated,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Logged out",
        description: "See you tomorrow!",
      });
    },
  });

  const toggleTaskMutation = useMutation({
    mutationFn: async ({ taskId, completed }: { taskId: string; completed: boolean }) => {
      const response = await apiRequest("PUT", `/api/tasks/${taskId}`, { completed });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
  });

  if (isLoading || isDashboardLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const { 
    tasks = [], 
    goals = [], 
    dashboardContent = { dailyQuote: '', focusArea: '' }, 
    stats = { journalStreak: 0, taskStreak: 0, totalJournals: 0, totalCompletedTasks: 0 } 
  } = (dashboardData as any) || {};
  const completedTasks = tasks.filter((t: any) => t.completed);
  const hasJournalToday = !!(todayJournal as any)?.content;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold text-foreground">Daily Growth Tracker</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">
                Welcome, {(user as any)?.firstName || (user as any)?.email?.split('@')[0] || 'there'}!
              </span>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Daily Quote & Focus Area */}
        <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200/50">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Quote className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <blockquote className="text-lg font-medium text-foreground mb-2">
                  "{dashboardContent.dailyQuote || 'The way to get started is to quit talking and begin doing. - Walt Disney'}"
                </blockquote>
                <p className="text-muted-foreground">
                  <strong>Today's Focus:</strong> {dashboardContent.focusArea || 'Focus on taking small, consistent actions that align with your goals.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Tasks Section */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    <span>Today's Tasks</span>
                  </CardTitle>
                  <Badge variant="secondary">
                    {completedTasks.length}/{tasks.length} completed
                  </Badge>
                </div>
                <Progress value={(completedTasks.length / tasks.length) * 100} className="mt-2" />
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {tasks.map((task: any) => (
                    <div 
                      key={task.id} 
                      className={`flex items-start space-x-3 p-4 rounded-lg border transition-all ${
                        task.completed 
                          ? 'bg-green-50 dark:bg-green-950/20 border-green-200/50' 
                          : 'bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-900'
                      }`}
                    >
                      <button
                        onClick={() => toggleTaskMutation.mutate({ 
                          taskId: task.id, 
                          completed: !task.completed 
                        })}
                        className="flex-shrink-0 mt-0.5"
                      >
                        {task.completed ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <Circle className="h-5 w-5 text-gray-400 hover:text-primary" />
                        )}
                      </button>
                      <div className="flex-1">
                        <h4 className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                          {task.title}
                        </h4>
                        <p className={`text-sm ${task.completed ? 'line-through text-muted-foreground' : 'text-muted-foreground'} mt-1`}>
                          {task.description}
                        </p>
                        <div className="flex items-center space-x-3 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {task.category}
                          </Badge>
                          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{task.timeEstimate} min</span>
                          </div>
                          {task.priority === 'high' && (
                            <Badge variant="destructive" className="text-xs">High Priority</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {tasks.length === 0 && (
                    <div className="text-center py-8">
                      <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No tasks generated yet. Check back after midnight!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Journal Entry Reminder */}
            {!hasJournalToday && (
              <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-2 text-orange-800 dark:text-orange-200">
                    <PenTool className="h-5 w-5" />
                    <span>Journal Entry</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-orange-700 dark:text-orange-300 mb-4">
                    You haven't written today's journal yet. Reflecting on your day helps the AI create better tasks for tomorrow!
                  </p>
                  <Button 
                    className="w-full" 
                    onClick={() => window.location.href = '/journal'}
                  >
                    Add Today's Journal
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Goals Progress */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-primary" />
                  <span>Goals Progress</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {goals.slice(0, 3).map((goal: any) => (
                    <div key={goal.id} className="space-y-2">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium text-foreground text-sm">{goal.title}</h4>
                        <span className="text-xs text-muted-foreground">
                          {goal.progress || 0}%
                        </span>
                      </div>
                      <Progress value={goal.progress || 0} className="h-2" />
                    </div>
                  ))}
                  
                  {goals.length === 0 && (
                    <div className="text-center py-4">
                      <Target className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No goals set yet</p>
                      <Button variant="outline" size="sm" className="mt-2" onClick={() => window.location.href = '/goals'}>
                        Set Goals
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <span>Your Progress</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {stats.journalStreak > 0 && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <BookOpen className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium">Journal Streak</span>
                      </div>
                      <Badge variant="secondary" className="flex items-center space-x-1">
                        <Flame className="h-3 w-3" />
                        <span>{stats.journalStreak} days</span>
                      </Badge>
                    </div>
                  )}
                  
                  {stats.taskStreak > 0 && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">Task Streak</span>
                      </div>
                      <Badge variant="secondary" className="flex items-center space-x-1">
                        <Flame className="h-3 w-3" />
                        <span>{stats.taskStreak} days</span>
                      </Badge>
                    </div>
                  )}
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Entries</span>
                    <span className="text-sm font-bold">{stats.totalJournals || 0}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Tasks Completed</span>
                    <span className="text-sm font-bold">{stats.totalCompletedTasks || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
