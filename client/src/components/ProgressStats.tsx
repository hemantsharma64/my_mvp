import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, BookOpen, Target } from "lucide-react";

interface ProgressStatsProps {
  stats: {
    tasksCompleted?: number;
    totalTasks?: number;
    journalEntries?: number;
    completionRate?: number;
    goalProgress?: number;
    streak?: number;
  };
}

export default function ProgressStats({ stats }: ProgressStatsProps) {
  const {
    tasksCompleted = 0,
    totalTasks = 0,
    journalEntries = 0,
    completionRate = 0,
    goalProgress = 0,
    streak = 0
  } = stats;

  return (
    <Card className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          This Week
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-success-100 dark:bg-success-900 p-2 rounded-lg mr-3">
                <CheckCircle className="w-4 h-4 text-success-600 dark:text-success-300" />
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Tasks Completed
              </span>
            </div>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {tasksCompleted}/{totalTasks}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-primary-100 dark:bg-primary-900 p-2 rounded-lg mr-3">
                <BookOpen className="w-4 h-4 text-primary-600 dark:text-primary-300" />
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Journal Entries
              </span>
            </div>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {journalEntries}/7
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-warning-100 dark:bg-warning-900 p-2 rounded-lg mr-3">
                <Target className="w-4 h-4 text-warning-600 dark:text-warning-300" />
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Goals Progress
              </span>
            </div>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {goalProgress > 0 ? `+${goalProgress}%` : `${goalProgress}%`}
            </span>
          </div>
          
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary-500">
                {completionRate}%
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Weekly completion rate
              </p>
            </div>
          </div>

          {streak > 0 && (
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="text-center">
                <p className="text-lg font-bold text-orange-500">
                  🔥 {streak} Day{streak !== 1 ? 's' : ''}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Journal streak
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
