import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Plus } from "lucide-react";

interface ActiveGoalsProps {
  goals: any[];
}

export default function ActiveGoals({ goals }: ActiveGoalsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateGoalMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PUT", `/api/goals/${id}`, data);
    },
    onSuccess: () => {
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
        description: "Failed to update goal. Please try again.",
        variant: "destructive",
      });
    },
  });

  const calculateProgress = (goal: any) => {
    if (!goal.targetValue || goal.targetValue === 0) return 0;
    return Math.min(Math.round(((goal.currentValue || 0) / goal.targetValue) * 100), 100);
  };

  const handleProgressUpdate = (goalId: string, currentValue: number, increment: number) => {
    const newValue = Math.max(currentValue + increment, 0);
    updateGoalMutation.mutate({
      id: goalId,
      data: { currentValue: newValue }
    });
  };

  const activeGoals = goals.filter(goal => !goal.completed).slice(0, 5);

  return (
    <Card className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Active Goals
          </h3>
          <Button
            onClick={() => window.location.href = "/goals"}
            variant="ghost"
            size="sm"
            className="text-primary-500 hover:text-primary-600 text-sm font-medium"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Goal
          </Button>
        </div>
      </div>
      
      <CardContent className="p-6">
        {activeGoals.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No active goals yet
            </p>
            <Button
              onClick={() => window.location.href = "/goals"}
              variant="outline"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Goal
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {activeGoals.map((goal) => {
              const progress = calculateProgress(goal);
              const timeRemaining = goal.duration ? getTimeRemaining(goal) : null;

              return (
                <div key={goal.id}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {goal.title}
                    </h4>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {goal.currentValue || 0}/{goal.targetValue} {goal.unit}
                    </span>
                  </div>
                  {goal.targetValue && (
                    <>
                      <Progress value={progress} className="mb-2" />
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {progress}% complete
                          {timeRemaining && ` • ${timeRemaining}`}
                        </p>
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleProgressUpdate(goal.id, goal.currentValue || 0, -1)}
                            disabled={updateGoalMutation.isPending || (goal.currentValue || 0) === 0}
                            className="h-6 w-6 p-0 text-xs"
                          >
                            -
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleProgressUpdate(goal.id, goal.currentValue || 0, 1)}
                            disabled={updateGoalMutation.isPending}
                            className="h-6 w-6 p-0 text-xs"
                          >
                            +
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function getTimeRemaining(goal: any): string {
  if (!goal.duration) return '';
  
  const created = new Date(goal.createdAt);
  const now = new Date();
  
  switch (goal.duration) {
    case 'daily':
      return 'Today';
    case 'weekly':
      const weekStart = new Date(created);
      weekStart.setDate(created.getDate() - created.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      const daysLeft = Math.ceil((weekEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysLeft > 0 ? `${daysLeft} days left` : 'Week ended';
    case 'monthly':
      const monthEnd = new Date(created.getFullYear(), created.getMonth() + 1, 0);
      const monthDaysLeft = Math.ceil((monthEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return monthDaysLeft > 0 ? `${monthDaysLeft} days left` : 'Month ended';
    case 'yearly':
      const yearEnd = new Date(created.getFullYear(), 11, 31);
      const monthsLeft = Math.max(0, Math.ceil((yearEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30)));
      return monthsLeft > 0 ? `${monthsLeft} months left` : 'Year ended';
    default:
      return '';
  }
}
