import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Save } from "lucide-react";

const moods = [
  { emoji: "😊", label: "Happy" },
  { emoji: "😐", label: "Neutral" },
  { emoji: "😔", label: "Sad" },
  { emoji: "😤", label: "Frustrated" },
  { emoji: "🎉", label: "Excited" }
];

export default function QuickJournalEntry() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split('T')[0];
  
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    mood: ""
  });

  const { data: todayJournal } = useQuery({
    queryKey: ["/api/journals", today],
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error as Error)) {
        return false;
      }
      return failureCount < 3;
    },
  });

  // Update form when journal data changes
  useEffect(() => {
    if (todayJournal) {
      setFormData({
        title: todayJournal.title || "",
        content: todayJournal.content || "",
        mood: todayJournal.mood || ""
      });
    }
  }, [todayJournal]);

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
      date: today,
      title: formData.title,
      content: formData.content,
      mood: formData.mood
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Today's Journal Entry
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>
      
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Mood Selection */}
          <div>
            <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              How are you feeling today?
            </Label>
            <div className="flex space-x-2">
              {moods.map((mood) => (
                <button
                  key={mood.emoji}
                  onClick={() => handleInputChange('mood', mood.emoji)}
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
            <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title
            </Label>
            <Input
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Give your day a title..."
              className="w-full"
            />
          </div>
          
          {/* Content */}
          <div>
            <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Journal Entry
            </Label>
            <Textarea
              rows={6}
              value={formData.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              placeholder="What happened today? What are you thinking about?"
              className="w-full resize-none"
            />
          </div>
          
          {/* Save Button */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {saveJournalMutation.isPending 
                ? "Saving..." 
                : todayJournal 
                  ? "Entry exists for today" 
                  : "New entry"
              }
            </span>
            <Button 
              onClick={handleSave}
              disabled={saveJournalMutation.isPending}
              className="bg-primary-500 hover:bg-primary-600 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              {saveJournalMutation.isPending ? "Saving..." : "Save Entry"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
