# Welcome to your Lovable project

## Project Overview

A weekly mileage tracking application for running activities. Users can upload Strava CSV exports to visualize running statistics, weekly/monthly trends, and activity data. Built with React, TypeScript, Vite, and Supabase.

![home](/img/home.png)

## Project info

See '/database-setup' for information on how to prepare a back-end for storage.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

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

## Deployment

Deployed on Vercel, uses the `production` branch at time of writing. Check the project environment settings for actual configuration.

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite with SWC plugin
- **Styling**: Tailwind CSS + shadcn/ui components
- **Backend**: Supabase (PostgreSQL with Row Level Security)
- **State Management**: React Context (AuthContext) + TanStack Query
- **Routing**: React Router v6
- **Charts**: Recharts
- **Date Handling**: date-fns
