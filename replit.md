# Overview

HealthBuddy is a modern health companion web application built with React and Express. The application provides users with personalized health plans, daily tracking capabilities, AI-powered mental wellness support, and symptom checking features. It combines a React frontend with an Express backend, using Firebase for authentication and PostgreSQL with Drizzle ORM for data persistence.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Routing**: Wouter for client-side routing with protected routes for authenticated users
- **UI Components**: Shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming and a neutral color palette with teal accent
- **State Management**: React Query (TanStack Query) for server state management and React Context for authentication state
- **Form Handling**: React Hook Form with Zod validation for type-safe form schemas

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Development Server**: Custom Vite integration for hot module replacement in development
- **API Design**: RESTful API structure with `/api` prefix for all backend routes
- **Error Handling**: Centralized error handling middleware with proper HTTP status codes
- **Storage Interface**: Abstracted storage layer with in-memory implementation for development

## Authentication System
- **Provider**: Firebase Authentication with email/password strategy
- **Session Management**: Firebase handles token management and session persistence
- **Route Protection**: React-based protected routes that redirect unauthenticated users
- **User Context**: React Context API for managing authentication state across the application

## Database Design
- **Database**: PostgreSQL configured for production deployment
- **ORM**: Drizzle ORM with TypeScript-first schema definitions
- **Schema Location**: Shared schema definitions in `shared/schema.ts` for type safety across frontend and backend
- **Migrations**: Drizzle Kit for database migrations and schema management
- **Development Storage**: In-memory storage implementation for rapid development and testing

## Build and Deployment
- **Development**: Concurrent frontend (Vite dev server) and backend (tsx with hot reload)
- **Production Build**: Vite builds the frontend to `dist/public`, esbuild bundles the backend to `dist/index.js`
- **Static Assets**: Express serves the built frontend in production with proper fallback routing

# External Dependencies

## Core Framework Dependencies
- **React Ecosystem**: React 18 with TypeScript, React Router alternative (Wouter), React Query for data fetching
- **Backend Framework**: Express.js with TypeScript support via tsx runtime
- **Build Tools**: Vite for frontend bundling, esbuild for backend bundling

## Authentication Service
- **Firebase**: Complete authentication solution including user management, email/password auth, and session handling
- **Configuration**: Environment variables for Firebase project credentials

## Database Services
- **PostgreSQL**: Primary database for production (configured via DATABASE_URL environment variable)
- **Neon Database**: Serverless PostgreSQL driver for optimized cloud database connections
- **Drizzle ORM**: Type-safe database operations with automatic TypeScript inference

## UI and Styling Libraries
- **Shadcn/ui**: Comprehensive component library built on Radix UI primitives
- **Radix UI**: Headless UI components for accessibility and keyboard navigation
- **Tailwind CSS**: Utility-first CSS framework with custom design system
- **Lucide React**: Icon library for consistent iconography

## Development Tools
- **Replit Integration**: Custom Vite plugins for Replit-specific development features
- **Type Safety**: Comprehensive TypeScript configuration with strict mode enabled
- **Code Quality**: ESLint-compatible setup with TypeScript path mapping