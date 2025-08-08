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
          model: 'openai/gpt-3.5-turbo',
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
    
    // Sort journals by date (newest first) and categorize by recency
    const now = new Date();
    const recentEntries = recentJournals.filter(j => {
      const days = Math.floor((now.getTime() - new Date(j.date).getTime()) / (1000 * 60 * 60 * 24));
      return days <= 7;
    });
    const mediumEntries = recentJournals.filter(j => {
      const days = Math.floor((now.getTime() - new Date(j.date).getTime()) / (1000 * 60 * 60 * 24));
      return days > 7 && days <= 30;
    });
    
    const recentJournalSummary = recentEntries.length > 0 
      ? recentEntries.map(j => `Date: ${j.date}\nContent: ${j.content || 'No content'}`).join('\n\n')
      : 'No recent journal entries (last 7 days).';
    
    const mediumJournalSummary = mediumEntries.length > 0
      ? mediumEntries.slice(0, 3).map(j => `${j.date}: ${(j.content || '').substring(0, 100)}...`).join('\n')
      : 'No medium-term journal entries (8-30 days ago).';
    
    const goalsSummary = goals.length > 0
      ? goals.map(g => `Goal: ${g.title}\nDuration: ${g.duration || 'Not specified'}\nProgress: ${g.progress || 0}%\nDescription: ${g.description || 'No description'}`).join('\n\n')
      : 'No active goals set.';

    return `
You are a life coach. Create 5-7 tasks for tomorrow based on this information:

RECENT JOURNALS (Most Important - Last 7 days):
${recentJournalSummary}

USER GOALS:
${goalsSummary}

MEDIUM TERM JOURNALS (8-30 days ago):
${mediumJournalSummary}

Rules:
1. Create 5-7 specific tasks for tomorrow
2. Focus mostly on recent journals (last 7 days) and user goals
3. Each task should take 10-45 minutes
4. Include tasks that help achieve the user's goals
5. Make tasks actionable and specific

Return JSON format:
{
  "tasks": [
    {
      "title": "Task title",
      "description": "What exactly to do",
      "category": "health|learning|productivity|wellness",
      "timeEstimate": "20 minutes",
      "relatedGoalId": "goalId if related to a goal",
      "priority": "high|medium|low"
    }
  ],
  "dailyQuote": "Motivational quote for tomorrow",
  "focusArea": "Main area to focus on tomorrow"
}

Weight Distribution:
- Recent journals (1-7 days): 40% importance
- User goals: 40% importance  
- Medium journals (8-30 days): 15% importance
- Old journals (30+ days): 5% importance

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
