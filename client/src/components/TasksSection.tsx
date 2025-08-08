import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RotateCcw, Clock, Tag } from "lucide-react";

interface TasksSectionProps {
  tasks: any[];
}

export default function TasksSection({ tasks }: TasksSectionProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PUT", `/api/tasks/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
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
        description: "Failed to update task. Please try again.",
        variant: "destructive",
      });
    },
  });

  const generateTasksMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/generate-tasks", {});
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "New tasks generated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
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
        description: "Failed to generate new tasks. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleTaskToggle = (taskId: string, completed: boolean) => {
    updateTaskMutation.mutate({
      id: taskId,
      data: { completed }
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300';
      case 'low':
        return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300';
      default:
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300';
    }
  };

  const getStatusColor = (completed: boolean) => {
    return completed
      ? 'bg-success-100 dark:bg-success-900 text-success-700 dark:text-success-300'
      : 'bg-warning-100 dark:bg-warning-900 text-warning-700 dark:text-warning-300';
  };

  const completedTasks = tasks.filter(task => task.completed).length;

  return (
    <Card className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Today's Growth Tasks
          </h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {completedTasks} of {tasks.length} completed
            </span>
            <Button
              onClick={() => generateTasksMutation.mutate()}
              disabled={generateTasksMutation.isPending}
              className="bg-primary-500 hover:bg-primary-600 text-white px-3 py-1 rounded-lg text-sm transition-colors"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              {generateTasksMutation.isPending ? "Generating..." : "Generate New"}
            </Button>
          </div>
        </div>
      </div>
      
      <CardContent className="p-6">
        {tasks.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No tasks for today. Generate some tasks to get started!
            </p>
            <Button
              onClick={() => generateTasksMutation.mutate()}
              disabled={generateTasksMutation.isPending}
              className="bg-primary-500 hover:bg-primary-600"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              {generateTasksMutation.isPending ? "Generating..." : "Generate Tasks"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`flex items-start space-x-3 p-4 rounded-lg ${
                  task.completed
                    ? "bg-gray-50 dark:bg-gray-700/50"
                    : "border-2 border-dashed border-primary-200 dark:border-primary-800"
                }`}
              >
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={(checked) => handleTaskToggle(task.id, checked as boolean)}
                  disabled={updateTaskMutation.isPending}
                  className="mt-1"
                />
                <div className="flex-1">
                  <h4 className={`font-medium text-gray-900 dark:text-white ${
                    task.completed ? "line-through opacity-60" : ""
                  }`}>
                    {task.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {task.description}
                  </p>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {task.timeEstimate} minutes
                    </span>
                    <span className="flex items-center">
                      <Tag className="w-3 h-3 mr-1" />
                      {task.category}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs ${getPriorityColor(task.priority)}`}>
                      {task.priority} priority
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(task.completed)}`}>
                      {task.completed ? "Completed" : "Pending"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
