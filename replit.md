# replit.md

## Overview

This is a real-time multiplayer "Choose the Number" game where two players race to click numbers 1-99 in sequential order. The first player to click the current target number scores a point. The application uses a React frontend with Express backend and PostgreSQL database.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, using Vite as the build tool
- **Routing**: Wouter for client-side routing (lightweight alternative to React Router)
- **State Management**: TanStack React Query for server state management and caching
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Animations**: Framer Motion for game animations

### Backend Architecture
- **Framework**: Express.js running on Node.js with TypeScript
- **Build System**: esbuild for production server bundling, Vite for client bundling
- **API Design**: RESTful endpoints defined in `shared/routes.ts` with Zod schemas for validation
- **Development**: Hot module replacement via Vite dev server proxied through Express

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Schema**: Single `games` table storing game state including:
  - Player IDs and scores
  - Game status (waiting/playing/finished)
  - Number positions (randomized per game)
  - Tracking which player claimed each number
- **Migrations**: Drizzle Kit for schema management (`npm run db:push`)

### Game Logic
- Matchmaking: Players join a waiting game or create new one (atomic update prevents race conditions)
- Real-time updates: Client polls game state every 500ms during active games
- Click handling: Server validates number is correct target and assigns point to first clicker

### Project Structure
```
client/           # React frontend
  src/
    components/ui/  # shadcn/ui components
    pages/          # Route components (Home, Game)
    hooks/          # Custom React hooks
    lib/            # Utilities (queryClient, utils)
server/           # Express backend
  index.ts        # Server entry point
  routes.ts       # API route handlers
  storage.ts      # Database operations
  db.ts           # Database connection
shared/           # Shared types and schemas
  schema.ts       # Drizzle schema + Zod validations
  routes.ts       # API route definitions
```

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable
- **Drizzle ORM**: Type-safe database queries and schema management
- **connect-pg-simple**: PostgreSQL session store (available but sessions not currently used)

### Third-Party Libraries
- **@tanstack/react-query**: Server state management
- **Zod**: Runtime schema validation for API requests/responses
- **Radix UI**: Accessible UI primitives (via shadcn/ui)
- **Framer Motion**: Animation library for game interactions
- **Lucide React**: Icon library

### Development Tools
- **Vite**: Frontend build tool with HMR
- **esbuild**: Fast production bundling for server
- **TypeScript**: Type checking across full stack
- **Tailwind CSS**: Utility-first styling

### Replit-Specific
- **@replit/vite-plugin-runtime-error-modal**: Error overlay in development
- **@replit/vite-plugin-cartographer**: Development tooling
- **@replit/vite-plugin-dev-banner**: Development banner