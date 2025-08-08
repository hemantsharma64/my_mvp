# Daily Growth Tracker

## Overview

Daily Growth Tracker is a full-stack personal development application designed to help users achieve continuous improvement through daily reflection and AI-powered task generation. The application combines journaling, goal management, and intelligent task creation to support users' personal growth journey with a "1% better every day" philosophy.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client-side application is built with React 18 and TypeScript, utilizing a modern component-based architecture:

- **UI Framework**: Shadcn/ui components built on Radix UI primitives for accessibility and consistency
- **Styling**: Tailwind CSS with dark/light theme support and CSS variables for customization
- **State Management**: TanStack Query (React Query v5) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation for type-safe form handling
- **Build Tool**: Vite with hot reload for fast development experience

### Backend Architecture
The server-side follows a RESTful API design pattern:

- **Runtime**: Node.js with TypeScript and ES modules
- **Framework**: Express.js with middleware-based request handling
- **Database Layer**: Drizzle ORM providing type-safe database operations
- **Authentication**: Replit OIDC integration with Passport.js for secure user management
- **Session Management**: PostgreSQL-backed sessions using connect-pg-simple
- **AI Integration**: OpenRouter API with GPT-3.5 Turbo for intelligent task generation

### Database Design
PostgreSQL database with carefully designed schemas:

- **Users**: Stores Replit authentication data (id, email, name, avatar)
- **Journals**: Daily journal entries with date, title, content, and mood tracking
- **Goals**: Personal goals with progress tracking and completion status
- **Tasks**: AI-generated daily tasks with categories, priorities, and time estimates
- **Dashboard Content**: Daily motivational quotes and focus areas
- **Sessions**: Secure session storage for authentication

### Core Features Implementation
- **Daily Journaling**: Rich text entries with mood tracking and date-based organization
- **Goal Management**: CRUD operations for personal goals with progress visualization
- **AI Task Generation**: Automated daily task creation based on journal history and active goals
- **Dashboard**: Unified view combining tasks, goals, statistics, and daily inspiration
- **Progress Tracking**: Statistics calculation for streaks, completion rates, and goal progress

### Authentication & Security
- **Replit OIDC**: Secure authentication using Replit's OAuth implementation
- **Session Management**: Server-side sessions stored in PostgreSQL with configurable TTL
- **Route Protection**: Middleware-based authentication checks on API endpoints
- **Error Handling**: Comprehensive error handling with user-friendly messages

## External Dependencies

### Core Infrastructure
- **Neon Database**: Serverless PostgreSQL database hosting
- **Replit OIDC**: Authentication service integration

### AI Services
- **OpenRouter API**: AI model access for task generation using GPT-3.5 Turbo

### UI Component Libraries
- **Radix UI**: Accessible, unstyled UI primitives for complex components
- **Shadcn/ui**: Pre-built component library built on Radix UI
- **Lucide React**: Icon library for consistent iconography

### Development Tools
- **Drizzle Kit**: Database migrations and schema management
- **TypeScript**: Type safety across the entire application
- **ESLint/Prettier**: Code quality and formatting tools
- **Vite**: Build tool with development server and hot reload

### Session & Data Management
- **connect-pg-simple**: PostgreSQL session store for Express sessions
- **TanStack Query**: Async state management and caching for React