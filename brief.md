# Weekly Mileage Tracker - Project Brief

## Overview
A Strava-inspired web application for tracking and visualizing running/activity mileage, grouped by week. Built with React, TypeScript, Tailwind CSS, and Supabase.

## Tech Stack
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Charts**: Recharts
- **Backend**: Supabase (Auth, Database, RLS)
- **Routing**: React Router DOM v6

## Database Schema

### `activities` table
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | Foreign key to auth.users |
| strava_id | text | Optional Strava activity ID |
| activity_date | timestamptz | When activity occurred |
| name | text | Activity name |
| distance_km | numeric | Distance in kilometers |
| elapsed_time | integer | Total time in seconds |
| moving_time | integer | Moving time in seconds |
| elevation_gain | numeric | Elevation in meters |
| avg_heart_rate | integer | Average HR |
| max_heart_rate | integer | Max HR |
| created_at | timestamptz | Record creation time |

### `user_roles` table
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | Foreign key to auth.users |
| role | app_role | Enum: 'admin', 'user' |
| created_at | timestamptz | Record creation time |

## RLS Policies
- Users can only view/edit/delete their own activities
- Admins can view all activities (but Dashboard filters to own data)
- Users can view their own roles; admins can manage all roles

## Key Components
- **Dashboard.tsx**: Main stats view with weekly/monthly charts (filters by user_id)
- **WeeklyChart.tsx**: Bar chart of weekly distances
- **MonthlyChart.tsx**: Monthly aggregated distances
- **StatCard.tsx**: Reusable stat display cards
- **RecentWeeks.tsx**: Recent weekly summaries
- **DateRangeFilter.tsx**: Date filtering controls

## Authentication
- Email/password auth via Supabase
- AuthContext provides: user, session, loading, signUp, signIn, signOut

## Key Decisions Made
1. Dashboard always filters by current user_id (even for admins)
2. Distance displayed in kilometers
3. Charts use muted/semi-transparent hover states
4. Tooltip text uses foreground color for readability

## Context Window Best Practice
Copy this content to **Project Settings → Manage Knowledge** for automatic context injection in future conversations, then delete this file.
