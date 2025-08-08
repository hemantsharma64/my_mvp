import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Home } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Target, Plus, Edit, Trash2 } from "lucide-react";

export default function Goals() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    targetValue: "",
    unit: "",
    duration: ""
  });

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: goals = [], isLoading: isGoalsLoading } = useQuery({
    queryKey: ["/api/goals"],
    enabled: isAuthenticated,
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error as Error)) {
        return false;
      }
      return failureCount < 3;
    },
  });

  const createGoalMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/goals", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Goal created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create goal. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateGoalMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PUT", `/api/goals/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Goal updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update goal. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/goals/${id}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Goal deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete goal. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      targetValue: "",
      unit: "",
      duration: ""
    });
    setEditingGoal(null);
  };

  const handleSubmit = () => {
    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a goal title",
        variant: "destructive",
      });
      return;
    }

    const goalData = {
      title: formData.title,
      description: formData.description,
      targetValue: formData.targetValue ? parseInt(formData.targetValue) : null,
      unit: formData.unit || null,
      duration: formData.duration || null,
    };

    if (editingGoal) {
      updateGoalMutation.mutate({ id: editingGoal.id, data: goalData });
    } else {
      createGoalMutation.mutate(goalData);
    }
  };

  const handleEdit = (goal: any) => {
    setEditingGoal(goal);
    setFormData({
      title: goal.title || "",
      description: goal.description || "",
      targetValue: goal.targetValue?.toString() || "",
      unit: goal.unit || "",
      duration: goal.duration || ""
    });
    setIsDialogOpen(true);
  };

  const handleProgressUpdate = (goalId: string, newValue: number) => {
    updateGoalMutation.mutate({
      id: goalId,
      data: { currentValue: newValue }
    });
  };

  const calculateProgress = (goal: any) => {
    if (!goal.targetValue || goal.targetValue === 0) return 0;
    return Math.min(Math.round(((goal.currentValue || 0) / goal.targetValue) * 100), 100);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading goals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Simple Navigation Header */}
      <header className="border-b bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => window.location.href = '/dashboard'}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Dashboard</span>
              </Button>
              <h1 className="text-xl font-semibold text-foreground">Goals</h1>
            </div>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.href = '/dashboard'}
            >
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </div>
        </div>
      </header>
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Goals</h1>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-primary-500 hover:bg-primary-600">
                <Plus className="w-4 h-4 mr-2" />
                Add Goal
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingGoal ? "Edit Goal" : "Create New Goal"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Goal Title</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Read 24 books this year"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your goal and why it matters to you"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Target Value</Label>
                    <Input
                      type="number"
                      value={formData.targetValue}
                      onChange={(e) => setFormData(prev => ({ ...prev, targetValue: e.target.value }))}
                      placeholder="e.g., 24"
                    />
                  </div>
                  <div>
                    <Label>Unit</Label>
                    <Input
                      value={formData.unit}
                      onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                      placeholder="e.g., books, days, lessons"
                    />
                  </div>
                </div>
                <div>
                  <Label>Duration</Label>
                  <Select
                    value={formData.duration}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, duration: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                      <SelectItem value="ongoing">Ongoing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={createGoalMutation.isPending || updateGoalMutation.isPending}
                  >
                    {editingGoal ? "Update" : "Create"} Goal
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isGoalsLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading goals...</p>
          </div>
        ) : goals.length === 0 ? (
          <div className="text-center py-12">
            <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
              No goals yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Start by creating your first goal to track your progress
            </p>
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="bg-primary-500 hover:bg-primary-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Goal
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals.map((goal: any) => {
              const progress = calculateProgress(goal);
              return (
                <Card key={goal.id} className="bg-white dark:bg-gray-800">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {goal.title}
                      </h3>
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(goal)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteGoalMutation.mutate(goal.id)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {goal.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        {goal.description}
                      </p>
                    )}
                    
                    {goal.targetValue && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            Progress
                          </span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {goal.currentValue || 0}/{goal.targetValue} {goal.unit}
                          </span>
                        </div>
                        <Progress value={progress} className="mb-2" />
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {progress}% complete
                          {goal.duration && ` • ${goal.duration}`}
                        </p>
                      </div>
                    )}
                    
                    {goal.targetValue && (
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleProgressUpdate(goal.id, Math.max((goal.currentValue || 0) - 1, 0))}
                          disabled={updateGoalMutation.isPending}
                        >
                          -1
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleProgressUpdate(goal.id, (goal.currentValue || 0) + 1)}
                          disabled={updateGoalMutation.isPending}
                          className="flex-1"
                        >
                          +1 {goal.unit || ""}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
