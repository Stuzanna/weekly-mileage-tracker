# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A weekly mileage tracking application for running activities. Users can upload Strava CSV exports to visualize running statistics, weekly/monthly trends, and activity data. Built with React, TypeScript, Vite, and Supabase.

## Development Commands

```bash
# Install dependencies
npm i

# Start development server (runs on port 8080)
npm run dev

# Build for production
npm run build

# Build in development mode
npm run build:dev

# Lint code
npm run lint

# Preview production build
npm run preview
```

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite with SWC plugin
- **Styling**: Tailwind CSS + shadcn/ui components
- **Backend**: Supabase (PostgreSQL with Row Level Security)
- **State Management**: React Context (AuthContext) + TanStack Query
- **Routing**: React Router v6
- **Charts**: Recharts
- **Date Handling**: date-fns

## Architecture Overview

### Authentication Flow

Authentication is managed through Supabase Auth with a global AuthContext:

1. `AuthContext` (`src/contexts/AuthContext.tsx`) wraps the entire app in `App.tsx`
2. Provides `user`, `session`, `loading`, `signUp`, `signIn`, `signOut` to all components
3. Auto-assigns roles on signup via database trigger (`handle_new_user_role`)
4. Index page (`src/pages/Index.tsx`) redirects unauthenticated users to `/auth`

### Data Flow

1. **CSV Upload**: User uploads Strava CSV → parsed by `parseActivities.ts` → saved to Supabase `activities` table
2. **Data Loading**: On mount, Dashboard fetches all activities from Supabase for authenticated user
3. **Processing**: Activities are grouped by week, filtered by date range, and aggregated for statistics
4. **Visualization**: Processed data flows to chart components (WeeklyChart, MonthlyChart, RecentWeeks)

### Database Schema

Two main tables with Row Level Security (RLS):

**activities**: Stores running activity data
- Unique constraint on `(user_id, strava_id)`
- Users can only access their own activities (admins can see all)
- Indexed on `user_id`, `activity_date`, and composite `(user_id, activity_date)`

**user_roles**: Manages user permissions
- Enum type `app_role`: 'admin' | 'user'
- Auto-assigned via trigger when users sign up
- Admin emails defined in `database-setup/add-admin-users.sql`

See `database-setup/setup.sql` for full schema and RLS policies.

### Key Directories

- `src/components/`: React components
  - `ui/`: shadcn/ui component library (auto-generated, modify with caution)
  - `Dashboard.tsx`: Main app component containing state and layout
  - Chart components: `WeeklyChart`, `MonthlyChart`, `RecentWeeks`
- `src/contexts/`: React contexts (currently only AuthContext)
- `src/integrations/supabase/`: Supabase client and auto-generated TypeScript types
- `src/lib/`: Utility functions
  - `parseActivities.ts`: CSV parsing and data aggregation logic
- `src/pages/`: Route-level page components
- `database-setup/`: Database migration scripts and setup instructions

### Component Architecture

**Dashboard Component** (`src/components/Dashboard.tsx`):
- Central state container for all activities, date filters, and presets
- Uses `useMemo` to derive filtered data and statistics
- Handles CSV file upload and Supabase synchronization
- Renders empty state when no activities exist

**Data Processing Pipeline**:
1. Raw activities stored in state
2. Filtered by date range (start/end dates or presets like "3m", "6m", "ytd")
3. Grouped into weeks via `groupByWeek()`
4. Aggregated into stats via `calculateStats()`
5. Passed down to visualization components

### Path Aliases

The project uses `@/` as an alias for `src/`:
```typescript
import { Dashboard } from "@/components/Dashboard"
import { supabase } from "@/integrations/supabase/client"
```

## Environment Variables

Required in `.env`:
```
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-key
```

## Database Setup

For local development or new deployments:

1. Set up Supabase project
2. Run `database-setup/setup.sql` as a migration
3. Update admin email in the script or in `database-setup/add-admin-users.sql`
4. Configure environment variables

Note: The database schema uses Supabase-specific syntax but reference scripts are provided for adaptation to other databases.

## Important Patterns

### CSV Parsing
The CSV parser in `parseActivities.ts` handles multi-line quoted fields and expects Strava export format. It filters for "Run" activities only and converts distance from meters to kilometers.

### Date Range Filtering
- Presets: "3m", "6m", "ytd" (year-to-date), "1y", "all"
- Custom date ranges clear the active preset
- Week grouping uses Monday as week start
- All dates are filtered inclusively (end date includes full day)

### Supabase Integration
- Client configured with persistent sessions in localStorage
- Auto-refresh tokens enabled
- Type-safe database schema in `src/integrations/supabase/types.ts`
- Activity upserts use `(user_id, strava_id)` conflict resolution

### shadcn/ui Components
Components in `src/components/ui/` are auto-generated by shadcn. When adding new components, use the shadcn CLI rather than manually creating files.
