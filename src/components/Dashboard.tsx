import { useEffect, useState, useMemo } from "react";
import { subMonths, startOfYear } from "date-fns";
import { parseCSV, groupByWeek, calculateStats, Activity, WeekData } from "@/lib/parseActivities";
import { StatCard } from "./StatCard";
import { WeeklyChart } from "./WeeklyChart";
import { MonthlyChart } from "./MonthlyChart";
import { RecentWeeks } from "./RecentWeeks";
import { DateRangeFilter } from "./DateRangeFilter";
import { MapPin, Calendar, Trophy, Zap, Flame } from "lucide-react";
import activitiesCSV from "@/data/activities.csv?raw";

type PresetKey = "3m" | "6m" | "ytd" | "1y" | "all";

function getPresetDates(preset: PresetKey): { start: Date | undefined; end: Date | undefined } {
  const now = new Date();
  switch (preset) {
    case "3m":
      return { start: subMonths(now, 3), end: now };
    case "6m":
      return { start: subMonths(now, 6), end: now };
    case "ytd":
      return { start: startOfYear(now), end: now };
    case "1y":
      return { start: subMonths(now, 12), end: now };
    case "all":
      return { start: undefined, end: undefined };
  }
}

export function Dashboard() {
  const [allActivities, setAllActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePreset, setActivePreset] = useState<PresetKey>("3m");
  const [startDate, setStartDate] = useState<Date | undefined>(() => getPresetDates("3m").start);
  const [endDate, setEndDate] = useState<Date | undefined>(() => getPresetDates("3m").end);

  useEffect(() => {
    const parsedActivities = parseCSV(activitiesCSV);
    setAllActivities(parsedActivities);
    setLoading(false);
  }, []);

  const handlePresetChange = (preset: PresetKey) => {
    setActivePreset(preset);
    const { start, end } = getPresetDates(preset);
    setStartDate(start);
    setEndDate(end);
  };

  const handleStartDateChange = (date: Date | undefined) => {
    setStartDate(date);
    setActivePreset(null as any);
  };

  const handleEndDateChange = (date: Date | undefined) => {
    setEndDate(date);
    setActivePreset(null as any);
  };

  const { filteredActivities, weeks, stats, minDate, maxDate } = useMemo(() => {
    let filtered = allActivities;
    
    if (startDate) {
      filtered = filtered.filter(a => a.date >= startDate);
    }
    if (endDate) {
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      filtered = filtered.filter(a => a.date <= endOfDay);
    }
    
    const groupedWeeks = groupByWeek(filtered);
    const calculatedStats = calculateStats(filtered, groupedWeeks);
    
    const min = allActivities.length > 0 ? allActivities[0].date : undefined;
    const max = allActivities.length > 0 ? allActivities[allActivities.length - 1].date : undefined;
    
    return {
      filteredActivities: filtered,
      weeks: groupedWeeks,
      stats: calculatedStats,
      minDate: min,
      maxDate: max,
    };
  }, [allActivities, startDate, endDate]);

  const handleClearFilter = () => {
    setActivePreset("all");
    setStartDate(undefined);
    setEndDate(undefined);
  };

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
        {/* Date Range Filter */}
        <div className="mb-6">
          <DateRangeFilter
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={handleStartDateChange}
            onEndDateChange={handleEndDateChange}
            onClear={handleClearFilter}
            activePreset={activePreset}
            onPresetChange={handlePresetChange}
            minDate={minDate}
            maxDate={maxDate}
          />
        </div>

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
            value={`${stats.maxWeek?.totalKm.toFixed(1) || 0} km`}
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
          <MonthlyChart activities={filteredActivities} />
          <RecentWeeks weeks={weeks} />
        </div>
      </main>
    </div>
  );
}