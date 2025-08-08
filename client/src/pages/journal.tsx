import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Home, Target } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar, BookOpen } from "lucide-react";

const moods = [
  { emoji: "😊", label: "Happy" },
  { emoji: "😐", label: "Neutral" },
  { emoji: "😔", label: "Sad" },
  { emoji: "😤", label: "Frustrated" },
  { emoji: "🎉", label: "Excited" }
];

export default function Journal() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  
  const [selectedDate, setSelectedDate] = useState(() => 
    new Date().toISOString().split('T')[0]
  );
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    mood: ""
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

  const { data: journal, isLoading: isJournalLoading } = useQuery({
    queryKey: ["/api/journals", selectedDate],
    enabled: isAuthenticated && !!selectedDate,
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error as Error)) {
        return false;
      }
      return failureCount < 3;
    },
  });

  const { data: journals = [] } = useQuery({
    queryKey: ["/api/journals"],
    enabled: isAuthenticated,
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error as Error)) {
        return false;
      }
      return failureCount < 3;
    },
  });

  // Update form when journal data changes
  useEffect(() => {
    if (journal) {
      setFormData({
        title: journal.title || "",
        content: journal.content || "",
        mood: journal.mood || ""
      });
    } else {
      setFormData({
        title: "",
        content: "",
        mood: ""
      });
    }
  }, [journal]);

  const saveJournalMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/journals", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Journal entry saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/journals"] });
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
        description: "Failed to save journal entry. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    saveJournalMutation.mutate({
      date: selectedDate,
      title: formData.title,
      content: formData.content,
      mood: formData.mood
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading journal...</p>
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
              <h1 className="text-xl font-semibold text-foreground">Journal</h1>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.href = '/dashboard'}
              >
                <Home className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.href = '/goals'}
              >
                <Target className="h-4 w-4 mr-2" />
                Goals
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Journal Entry */}
          <div className="lg:col-span-2">
            <Card className="bg-white dark:bg-gray-800 shadow-sm border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Journal Entry
                  </h1>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-gray-500" />
                    <Input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-auto"
                    />
                  </div>
                </div>
              </div>
              
              <CardContent className="p-6">
                <div className="space-y-6">
                  {/* Mood Selection */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      How are you feeling today?
                    </Label>
                    <div className="flex space-x-2">
                      {moods.map((mood) => (
                        <button
                          key={mood.emoji}
                          onClick={() => setFormData(prev => ({ ...prev, mood: mood.emoji }))}
                          className={`p-2 rounded-lg border transition-colors ${
                            formData.mood === mood.emoji
                              ? "bg-yellow-100 text-yellow-600 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-300 dark:border-yellow-700"
                              : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 border-gray-200 dark:border-gray-600"
                          }`}
                          title={mood.label}
                        >
                          {mood.emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Title */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Title
                    </Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Give your day a title..."
                      className="w-full"
                    />
                  </div>
                  
                  {/* Content */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Journal Entry
                    </Label>
                    <Textarea
                      rows={12}
                      value={formData.content}
                      onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="What happened today? What are you thinking about?"
                      className="w-full resize-none"
                    />
                  </div>
                  
                  {/* Save Button */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {saveJournalMutation.isPending ? "Saving..." : journal ? "Entry exists for this date" : "New entry"}
                    </span>
                    <Button 
                      onClick={handleSave}
                      disabled={saveJournalMutation.isPending}
                      className="bg-primary-500 hover:bg-primary-600"
                    >
                      {saveJournalMutation.isPending ? "Saving..." : "Save Entry"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Recent Entries */}
          <div>
            <Card className="bg-white dark:bg-gray-800 shadow-sm border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Recent Entries
                </h3>
              </div>
              
              <CardContent className="p-6">
                {journals.length === 0 ? (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No journal entries yet</p>
                    <p className="text-sm">Start writing to see your entries here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {journals.slice(0, 10).map((entry: any) => (
                      <div
                        key={entry.id}
                        onClick={() => setSelectedDate(entry.date)}
                        className={`cursor-pointer p-3 rounded-lg border transition-colors ${
                          selectedDate === entry.date
                            ? "border-primary-200 bg-primary-50 dark:border-primary-800 dark:bg-primary-900/20"
                            : "border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {entry.date}
                          </span>
                          {entry.mood && (
                            <span className="text-lg">{entry.mood}</span>
                          )}
                        </div>
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-1">
                          {entry.title || "Untitled"}
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                          {entry.content?.substring(0, 100) || "No content"}
                          {entry.content && entry.content.length > 100 && "..."}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
