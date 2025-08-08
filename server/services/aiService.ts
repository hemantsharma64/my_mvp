interface TaskGenerationRequest {
  userId: string;
  recentJournals: any[];
  goals: any[];
}

interface GeneratedTask {
  title: string;
  description: string;
  category: string;
  timeEstimate: number;
  priority: string;
  relatedGoalId?: string;
}

interface AIResponse {
  tasks: GeneratedTask[];
  dailyQuote: string;
  focusArea: string;
}

export class AIService {
  private apiKey: string;
  private baseUrl: string = 'https://openrouter.ai/api/v1';

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || '';
    if (!this.apiKey) {
      console.warn('OPENROUTER_API_KEY not found. AI features will be disabled.');
    }
  }

  async generateDailyTasks(request: TaskGenerationRequest): Promise<AIResponse> {
    if (!this.apiKey) {
      throw new Error('AI service not configured. Please set OPENROUTER_API_KEY.');
    }

    try {
      const prompt = this.buildPrompt(request);
      
      console.log('Generating tasks for user:', request.userId);
      console.log('Prompt:', prompt.substring(0, 200) + '...');

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.VERCEL_URL || 'https://daily-growth-tracker.vercel.app',
          'X-Title': 'Daily Growth Tracker'
        },
        body: JSON.stringify({
          model: 'gryphe/mythomist-7b:free',
          messages: [
            {
              role: 'system',
              content: 'You are a personal development coach AI that helps users achieve continuous improvement through daily tasks, reflection, and goal-oriented activities. Always respond with valid JSON in the exact format requested.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenRouter API error:', response.status, errorText);
        throw new Error(`AI service error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) {
        throw new Error('No content received from AI service');
      }

      console.log('AI Response:', content);

      const aiResponse = JSON.parse(content);
      
      // Validate response structure
      if (!aiResponse.tasks || !Array.isArray(aiResponse.tasks)) {
        throw new Error('Invalid AI response format: tasks array missing');
      }

      return aiResponse;

    } catch (error) {
      console.error('AI service error:', error);
      
      // Return fallback tasks if AI fails
      return this.getFallbackResponse();
    }
  }

  private buildPrompt(request: TaskGenerationRequest): string {
    const { recentJournals, goals } = request;
    
    const journalSummary = recentJournals.length > 0 
      ? recentJournals.map(j => `${j.date}: ${j.title || 'Untitled'} - ${j.content?.substring(0, 100) || 'No content'}...`).join('\n')
      : 'No recent journal entries available.';
    
    const goalsSummary = goals.length > 0
      ? goals.map(g => `"${g.title}" - ${g.description || 'No description'} (${g.currentValue || 0}/${g.targetValue || 'unlimited'} ${g.unit || 'units'})`).join('\n')
      : 'No active goals set.';

    return `
Based on the user's recent journal entries and goals, generate 5-7 personalized daily tasks that will help them grow and make progress. Also provide a motivational quote and focus area for today.

Recent Journal Entries:
${journalSummary}

Current Goals:
${goalsSummary}

Please respond with valid JSON in this exact format:
{
  "tasks": [
    {
      "title": "Task title (concise and actionable)",
      "description": "Detailed description of what to do and why",
      "category": "Category (Productivity, Wellness, Learning, Planning, Mindfulness, etc.)",
      "timeEstimate": 15,
      "priority": "medium",
      "relatedGoalId": null
    }
  ],
  "dailyQuote": "An inspiring and relevant motivational quote",
  "focusArea": "A brief description of what the user should focus on today based on their journals and goals"
}

Requirements:
- Generate 5-7 tasks total
- Time estimates should be between 5-45 minutes
- Mix of different categories (productivity, wellness, learning, etc.)
- Tasks should be specific and actionable
- Consider the user's recent journal content and active goals
- Priority can be "low", "medium", or "high"
- Only set relatedGoalId if a task directly relates to completing a specific goal
- Daily quote should be motivational and relevant to personal growth
- Focus area should be 1-2 sentences about the day's theme or priority

Make the tasks personal and relevant based on the journal entries and goals provided.
`;
  }

  private getFallbackResponse(): AIResponse {
    return {
      tasks: [
        {
          title: "Write down 3 things you're grateful for",
          description: "Practice gratitude by reflecting on positive aspects of your day and life",
          category: "Mindfulness",
          timeEstimate: 5,
          priority: "medium"
        },
        {
          title: "Review and organize digital workspace",
          description: "Clean up desktop files, organize folders, and update task management tools",
          category: "Productivity", 
          timeEstimate: 25,
          priority: "medium"
        },
        {
          title: "Read for 15 minutes",
          description: "Continue reading your current book or explore a new article on a topic of interest",
          category: "Learning",
          timeEstimate: 15,
          priority: "medium"
        },
        {
          title: "Take a 10-minute walk",
          description: "Get some fresh air and light exercise to boost energy and mood",
          category: "Wellness",
          timeEstimate: 10,
          priority: "low"
        },
        {
          title: "Plan tomorrow's priorities",
          description: "Review schedule and identify top 3 priorities for tomorrow",
          category: "Planning",
          timeEstimate: 10,
          priority: "high"
        }
      ],
      dailyQuote: "The way to get started is to quit talking and begin doing. - Walt Disney",
      focusArea: "Focus on taking small, consistent actions that align with your personal growth goals."
    };
  }
}

export const aiService = new AIService();
