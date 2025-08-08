import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { isUnauthorizedError } from "@/lib/authUtils";
import Header from "@/components/Header";
import TasksSection from "@/components/TasksSection";
import QuickJournalEntry from "@/components/QuickJournalEntry";
import FocusArea from "@/components/FocusArea";
import ActiveGoals from "@/components/ActiveGoals";
import ProgressStats from "@/components/ProgressStats";
import MobileNav from "@/components/MobileNav";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

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

  if (isLoading || isDashboardLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const { tasks = [], goals = [], dashboardContent, stats = {} } = dashboardData || {};

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-primary-50 to-success-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Good morning! 🌅
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {dashboardContent?.dailyQuote || "Welcome back to your growth journey!"}
            </p>
            <div className="flex items-center space-x-4 text-sm">
              <span className="bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 px-3 py-1 rounded-full">
                <i className="fas fa-calendar-day mr-1"></i>
                Today
              </span>
              {stats.streak > 0 && (
                <span className="bg-success-100 dark:bg-success-900 text-success-700 dark:text-success-300 px-3 py-1 rounded-full">
                  <i className="fas fa-fire mr-1"></i>
                  {stats.streak} day streak
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">
            <TasksSection tasks={tasks} />
            <QuickJournalEntry />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <FocusArea focusArea={dashboardContent?.focusArea} />
            <ActiveGoals goals={goals} />
            <ProgressStats stats={stats} />
          </div>
        </div>
      </div>

      <MobileNav />
    </div>
  );
}
