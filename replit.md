# Worship Manager - Church Song & Setlist Management Application

## Overview

Worship Manager is a comprehensive church worship song and setlist management application designed to help worship teams organize songs, plan services, manage musicians, and track usage statistics. The application provides features for storing songs with chord notations, creating setlists with drag-and-drop reordering, chord transposition, musician scheduling, and customizable display options optimized for projection during worship services.

**Authentication:** The application uses Replit Auth (OpenID Connect) for user authentication, supporting Google, GitHub, X, Apple, and email/password login methods. All application features require authentication.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System:**
- React 18 with TypeScript for type-safe component development
- Vite as the build tool and development server with HMR (Hot Module Replacement)
- Wouter for lightweight client-side routing
- Single-page application (SPA) architecture with client-side routing

**UI Component System:**
- Shadcn/ui components based on Radix UI primitives for accessible, customizable UI elements
- Material Design principles as specified in design guidelines
- Tailwind CSS for utility-first styling with custom design tokens
- Roboto font family (regular and mono variants) for typography

**State Management:**
- TanStack Query (React Query) for server state management, caching, and data fetching
- React Hook Form with Zod validation for form state and validation
- Local React state (useState) for UI-specific state

**Key Frontend Features:**
- Drag-and-drop song reordering in setlists using @dnd-kit libraries
- Real-time chord transposition with custom chord parsing utilities
- Responsive layout with sidebar navigation
- Toast notifications for user feedback

### Backend Architecture

**Server Framework:**
- Express.js for RESTful API with TypeScript
- Node.js runtime environment
- Development mode uses Vite middleware for integrated dev experience
- Production mode serves static built assets

**API Design:**
- RESTful endpoints following standard HTTP methods (GET, POST, PUT, DELETE)
- JSON request/response format
- CRUD operations for all major entities (songs, setlists, musicians, song leaders)
- Nested resource endpoints (e.g., `/api/setlists/:id/songs`)

**Database Layer:**
- PostgreSQL as the primary relational database
- Drizzle ORM for type-safe database queries and schema management
- Neon serverless PostgreSQL driver (@neondatabase/serverless)
- Schema-first approach with migrations stored in `/migrations` directory

**Storage Abstraction:**
- IStorage interface defines data access contract
- Supports CRUD operations for all entities
- Enables future database switching without changing business logic

### Database Schema

**Authentication Tables:**

1. **users** - User accounts (Replit Auth)
   - Stores user ID (from Replit OIDC), email, name, profile image
   - Synced automatically on login via upsert operation
   - UUID primary keys

2. **sessions** - Session storage (Replit Auth)
   - Stores encrypted session data for logged-in users
   - Managed by connect-pg-simple session store
   - 7-day session TTL

**Core Tables:**

1. **songs** - Worship songs library
   - Stores title, artist, original key, lyrics with chord notation
   - Tags array for categorization
   - UUID primary keys

2. **setlists** - Service setlists
   - Links to song leader
   - Stores service date and notes
   - One-to-many relationship with songs through junction table

3. **setlist_songs** - Junction table for songs in setlists
   - Maintains song order within setlist
   - Stores transposed key if different from original
   - Cascade delete when parent setlist is removed

4. **musicians** - Band members and worship team
   - Stores name, instrument, contact information

5. **song_leaders** - Worship leaders
   - Stores name and contact information
   - Referenced by setlists

6. **setlist_musicians** - Junction table for musician assignments
   - Links musicians to specific setlists
   - Cascade delete on parent removal

7. **song_usage** - Usage tracking
   - Records when songs are used in setlists
   - Enables statistics and reporting

**Design Decisions:**
- UUID primary keys for distributed system compatibility and security
- Cascade deletes on junction tables to maintain referential integrity
- Array type for tags to avoid additional junction table complexity
- Timestamp tracking for creation dates
- Nullable foreign keys where relationships are optional

### External Dependencies

**Third-party Libraries:**

1. **UI Components:**
   - Radix UI primitives (@radix-ui/*) - Accessible, unstyled component primitives
   - cmdk - Command menu component
   - lucide-react - Icon library

2. **Form Handling:**
   - react-hook-form - Form state management
   - @hookform/resolvers - Validation resolver integration
   - zod - Schema validation
   - drizzle-zod - Zod schema generation from Drizzle schemas

3. **Data Fetching:**
   - @tanstack/react-query - Server state management

4. **Styling:**
   - tailwindcss - Utility-first CSS framework
   - class-variance-authority - Component variant management
   - clsx & tailwind-merge - Conditional class name utilities

5. **Drag and Drop:**
   - @dnd-kit/core - Core drag-and-drop functionality
   - @dnd-kit/sortable - Sortable list implementation
   - @dnd-kit/utilities - Helper utilities

6. **Date Handling:**
   - date-fns - Date formatting and manipulation

**Database & ORM:**
- @neondatabase/serverless - Neon PostgreSQL serverless driver
- drizzle-orm - Type-safe ORM
- drizzle-kit - Schema management and migrations

**Development Tools:**
- tsx - TypeScript execution for development server
- esbuild - Production build bundling
- vite - Development server and frontend build tool
- @replit/* plugins - Replit-specific development enhancements

**Rationale for Key Choices:**
- Drizzle ORM chosen for excellent TypeScript support and minimal runtime overhead
- Neon serverless PostgreSQL for scalable, serverless-compatible database hosting
- Shadcn/ui provides Material Design-aligned components while maintaining customization flexibility
- TanStack Query simplifies server state management with built-in caching and optimistic updates
- @dnd-kit offers accessible, performant drag-and-drop without external dependencies