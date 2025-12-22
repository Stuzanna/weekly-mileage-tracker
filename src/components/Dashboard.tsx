import { useEffect, useState } from "react";
import { parseCSV, groupByWeek, calculateStats, Activity, WeekData } from "@/lib/parseActivities";
import { StatCard } from "./StatCard";
import { WeeklyChart } from "./WeeklyChart";
import { ActivityTypeBreakdown } from "./ActivityTypeBreakdown";
import { RecentWeeks } from "./RecentWeeks";
import { MapPin, Calendar, Trophy, Zap, Flame } from "lucide-react";
import activitiesCSV from "@/data/activities.csv?raw";

export function Dashboard() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [weeks, setWeeks] = useState<WeekData[]>([]);
  const [stats, setStats] = useState<ReturnType<typeof calculateStats> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const parsedActivities = parseCSV(activitiesCSV);
    const groupedWeeks = groupByWeek(parsedActivities);
    const calculatedStats = calculateStats(parsedActivities, groupedWeeks);
    
    setActivities(parsedActivities);
    setWeeks(groupedWeeks);
    setStats(calculatedStats);
    setLoading(false);
  }, []);

  if (loading || !stats) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary animate-pulse">
          <Flame className="w-12 h-12" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background bg-gradient-glow">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-coral shadow-coral">
              <Flame className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-foreground">Activity Dashboard</h1>
              <p className="text-sm text-muted-foreground">Your weekly mileage at a glance</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<MapPin className="w-5 h-5" />}
            label="Total Distance"
            value={`${stats.totalKm.toFixed(0)} km`}
            subValue={`${stats.totalActivities} activities`}
            delay={0}
          />
          <StatCard
            icon={<Calendar className="w-5 h-5" />}
            label="Weekly Average"
            value={`${stats.avgPerWeek.toFixed(1)} km`}
            subValue={`Across ${stats.weekCount} weeks`}
            delay={50}
          />
          <StatCard
            icon={<Trophy className="w-5 h-5" />}
            label="Best Week"
            value={`${stats.maxWeek?.totalKm.toFixed(1)} km`}
            subValue={stats.maxWeek?.weekLabel}
            delay={100}
          />
          <StatCard
            icon={<Zap className="w-5 h-5" />}
            label="Avg per Activity"
            value={`${stats.avgPerActivity.toFixed(1)} km`}
            delay={150}
          />
        </div>

        {/* Chart */}
        <div className="mb-8">
          <WeeklyChart weeks={weeks} />
        </div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ActivityTypeBreakdown typeBreakdown={stats.typeBreakdown} />
          <RecentWeeks weeks={weeks} />
        </div>
      </main>
    </div>
  );
}
