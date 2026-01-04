import { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { subMonths, startOfYear } from "date-fns";
import { parseCSV, groupByWeek, calculateStats, Activity, WeekData } from "@/lib/parseActivities";
import { parseGPX } from "@/lib/parseGPX";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "./StatCard";
import { WeeklyChart } from "./WeeklyChart";
import { MonthlyChart } from "./MonthlyChart";
import { RecentWeeks } from "./RecentWeeks";
import { DateRangeFilter } from "./DateRangeFilter";
import { MapPin, Calendar, Trophy, Zap, Flame, Upload, LogOut, Plus, List, Shield } from "lucide-react";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";

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
  const { user, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [allActivities, setAllActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePreset, setActivePreset] = useState<PresetKey>("3m");
  const [startDate, setStartDate] = useState<Date | undefined>(() => getPresetDates("3m").start);
  const [endDate, setEndDate] = useState<Date | undefined>(() => getPresetDates("3m").end);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const gpxFileInputRef = useRef<HTMLInputElement>(null);

  // Load activities from Supabase on mount
  useEffect(() => {
    const loadActivities = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .eq("user_id", user.id)
        .order("activity_date", { ascending: true });
      
      if (error) {
        console.error("Error loading activities:", error);
        toast({ title: "Error loading activities", variant: "destructive" });
      } else if (data && data.length > 0) {
        const activities: Activity[] = data.map(row => ({
          id: row.strava_id,
          date: new Date(row.activity_date),
          name: row.name,
          type: "Run",
          distanceKm: Number(row.distance_km),
          elapsedTime: row.elapsed_time,
          movingTime: row.moving_time,
          elevationGain: row.elevation_gain ? Number(row.elevation_gain) : 0,
          avgHeartRate: row.avg_heart_rate ?? null,
          maxHeartRate: row.max_heart_rate ?? null,
        }));
        setAllActivities(activities);
      }
      setLoading(false);
    };
    
    loadActivities();
  }, [user, toast]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    
    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const csvText = e.target?.result as string;
      const parsedActivities = parseCSV(csvText);
      
      // Save to Supabase
      const rows = parsedActivities.map(a => ({
        user_id: user.id,
        strava_id: `${a.date.toISOString()}-${a.name}`,
        activity_date: a.date.toISOString(),
        name: a.name,
        distance_km: a.distanceKm,
        elapsed_time: a.elapsedTime,
        moving_time: a.movingTime,
        elevation_gain: a.elevationGain ?? null,
        avg_heart_rate: a.avgHeartRate ?? null,
        max_heart_rate: a.maxHeartRate ?? null,
      }));
      
      const { error } = await supabase
        .from("activities")
        .upsert(rows, { onConflict: "user_id,strava_id" });
      
      if (error) {
        console.error("Error saving activities:", error);
        toast({ title: "Error saving activities", variant: "destructive" });
      } else {
        toast({ title: `Saved ${parsedActivities.length} activities` });
      }
      
      setAllActivities(parsedActivities);
      setLoading(false);
    };
    reader.readAsText(file);
  };

  const handleGPXUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const gpxText = e.target?.result as string;
      const result = parseGPX(gpxText, file.name);

      if (result.error) {
        toast({ title: result.error, variant: "destructive" });
        setLoading(false);
        return;
      }

      const activity = result.activity;

      // Save to Supabase
      const row = {
        user_id: user.id,
        strava_id: activity.id,
        activity_date: activity.date.toISOString(),
        name: activity.name,
        distance_km: activity.distanceKm,
        elapsed_time: activity.elapsedTime,
        moving_time: activity.movingTime,
        elevation_gain: activity.elevationGain ?? null,
        avg_heart_rate: activity.avgHeartRate ?? null,
        max_heart_rate: activity.maxHeartRate ?? null,
      };

      const { error } = await supabase
        .from("activities")
        .upsert([row], { onConflict: "user_id,strava_id" });

      if (error) {
        console.error("Error saving activity:", error);
        toast({ title: "Error saving activity", variant: "destructive" });
      } else {
        toast({ title: `Added: ${activity.name}` });
        // Add to activities and re-sort
        setAllActivities(prev => 
          [...prev, activity].sort((a, b) => a.date.getTime() - b.date.getTime())
        );
      }
      setLoading(false);
    };
    reader.readAsText(file);
    // Reset input so same file can be re-uploaded
    event.target.value = '';
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary animate-pulse">
          <Flame className="w-12 h-12" />
        </div>
      </div>
    );
  }

  if (allActivities.length === 0) {
    return (
      <div className="min-h-screen bg-background bg-gradient-glow flex flex-col">
        <header className="p-4 flex justify-end items-center gap-3">
          <span className="text-sm text-muted-foreground">{user?.email}</span>
          <Button variant="ghost" size="sm" onClick={signOut} className="gap-2">
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign out</span>
          </Button>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-6">
            <div className="p-4 rounded-full bg-gradient-coral shadow-coral mx-auto w-fit">
              <Flame className="w-12 h-12 text-primary-foreground" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-display font-bold text-foreground">Activity Dashboard</h1>
              <p className="text-muted-foreground">Upload your activity data to get started</p>
            </div>
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <input
                ref={gpxFileInputRef}
                type="file"
                accept=".gpx"
                onChange={handleGPXUpload}
                className="hidden"
              />
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  size="lg"
                  className="gap-2"
                >
                  <Upload className="w-5 h-5" />
                  Upload CSV
                </Button>
                <Button
                  onClick={() => gpxFileInputRef.current?.click()}
                  size="lg"
                  variant="outline"
                  className="gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Upload Run
                </Button>
              </div>
              <p className="text-xs text-muted-foreground/70">
                Bulk import via CSV or add a single .gpx file
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background bg-gradient-glow">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-coral shadow-coral">
                <Flame className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-display font-bold text-foreground">Activity Dashboard</h1>
                <p className="text-sm text-muted-foreground">Your weekly mileage at a glance</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input
                ref={gpxFileInputRef}
                type="file"
                accept=".gpx"
                onChange={handleGPXUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => gpxFileInputRef.current?.click()}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Upload Run</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/activities")}
                className="gap-2"
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">All Activities</span>
              </Button>
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/admin")}
                  className="gap-2"
                >
                  <Shield className="w-4 h-4" />
                  <span className="hidden sm:inline">Admin</span>
                </Button>
              )}
              <span className="text-sm text-muted-foreground hidden sm:block">{user?.email}</span>
              <Button variant="ghost" size="sm" onClick={signOut} className="gap-2">
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign out</span>
              </Button>
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
          <WeeklyChart weeks={weeks} visibleWeeks={activePreset === "all" ? weeks.length : Math.min(weeks.length, 52)} />
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