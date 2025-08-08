import { Card, CardContent } from "@/components/ui/card";
import { Target } from "lucide-react";

interface FocusAreaProps {
  focusArea?: string;
}

export default function FocusArea({ focusArea }: FocusAreaProps) {
  return (
    <Card className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <CardContent className="p-6">
        <div className="flex items-center mb-4">
          <div className="bg-primary-100 dark:bg-primary-900 p-2 rounded-lg mr-3">
            <Target className="w-5 h-5 text-primary-600 dark:text-primary-300" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Today's Focus
          </h3>
        </div>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
          {focusArea || "Focus on taking small, consistent actions that align with your personal growth goals."}
        </p>
      </CardContent>
    </Card>
  );
}
