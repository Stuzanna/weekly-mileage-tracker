import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Loader2, Search, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Activity {
  id: string;
  name: string;
  activity_date: string;
  distance_km: number;
  moving_time: number;
  elapsed_time: number;
  elevation_gain: number | null;
  avg_heart_rate: number | null;
  max_heart_rate: number | null;
}

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  }
  return `${minutes}m ${secs}s`;
};

const Activities = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Filter states
  const [searchName, setSearchName] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [minDistance, setMinDistance] = useState("");
  const [maxDistance, setMaxDistance] = useState("");

  const filteredActivities = useMemo(() => {
    return activities.filter((activity) => {
      // Name filter
      if (searchName && !activity.name.toLowerCase().includes(searchName.toLowerCase())) {
        return false;
      }

      // Date range filter
      const activityDate = new Date(activity.activity_date);
      if (startDate && activityDate < startDate) {
        return false;
      }
      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        if (activityDate > endOfDay) {
          return false;
        }
      }

      // Distance filter
      if (minDistance && activity.distance_km < parseFloat(minDistance)) {
        return false;
      }
      if (maxDistance && activity.distance_km > parseFloat(maxDistance)) {
        return false;
      }

      return true;
    });
  }, [activities, searchName, startDate, endDate, minDistance, maxDistance]);

  const clearFilters = () => {
    setSearchName("");
    setStartDate(undefined);
    setEndDate(undefined);
    setMinDistance("");
    setMaxDistance("");
  };

  const hasActiveFilters = searchName || startDate || endDate || minDistance || maxDistance;

  const handleDelete = async (id: string, name: string) => {
    const { error } = await supabase.from("activities").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete activity",
        variant: "destructive",
      });
    } else {
      setActivities((prev) => prev.filter((a) => a.id !== id));
      toast({
        title: "Deleted",
        description: `"${name}" has been removed`,
      });
    }
  };
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchActivities = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .order("activity_date", { ascending: false });

      if (error) {
        console.error("Error fetching activities:", error);
      } else {
        setActivities(data || []);
      }
      setLoading(false);
    };

    if (user) {
      fetchActivities();
    }
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <h1 className="text-2xl font-bold text-foreground">All Activities</h1>
          </div>
          <span className="text-sm text-muted-foreground">
            {filteredActivities.length} of {activities.length} {activities.length === 1 ? "activity" : "activities"}
          </span>
        </div>

        {/* Filters */}
        <div className="mb-6 p-4 rounded-lg border bg-card">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search by name */}
            <div className="space-y-2">
              <Label htmlFor="search-name">Search Name</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search-name"
                  placeholder="Activity name..."
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Start date */}
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "MMM d, yyyy") : "From..."}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* End date */}
            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "MMM d, yyyy") : "To..."}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Min distance */}
            <div className="space-y-2">
              <Label htmlFor="min-distance">Min Distance (km)</Label>
              <Input
                id="min-distance"
                type="number"
                placeholder="0"
                value={minDistance}
                onChange={(e) => setMinDistance(e.target.value)}
                min="0"
                step="0.1"
              />
            </div>

            {/* Max distance */}
            <div className="space-y-2">
              <Label htmlFor="max-distance">Max Distance (km)</Label>
              <Input
                id="max-distance"
                type="number"
                placeholder="100"
                value={maxDistance}
                onChange={(e) => setMaxDistance(e.target.value)}
                min="0"
                step="0.1"
              />
            </div>
          </div>

          {hasActiveFilters && (
            <div className="mt-4 flex justify-end">
              <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-2">
                <X className="h-4 w-4" />
                Clear Filters
              </Button>
            </div>
          )}
        </div>

        {filteredActivities.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {hasActiveFilters ? "No activities match your filters." : "No activities found."}
            </p>
            {hasActiveFilters ? (
              <Button variant="link" onClick={clearFilters} className="mt-2">
                Clear filters
              </Button>
            ) : (
              <Button variant="link" onClick={() => navigate("/")} className="mt-2">
                Go to Dashboard to upload activities
              </Button>
            )}
          </div>
        ) : (
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Distance</TableHead>
                  <TableHead className="text-right">Duration</TableHead>
                  <TableHead className="text-right">Elevation</TableHead>
                  <TableHead className="text-right">Avg HR</TableHead>
                  <TableHead className="text-right">Max HR</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredActivities.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell className="font-medium">
                      {format(new Date(activity.activity_date), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>{activity.name}</TableCell>
                    <TableCell className="text-right">
                      {activity.distance_km.toFixed(2)} km
                    </TableCell>
                    <TableCell className="text-right">
                      {formatDuration(activity.moving_time)}
                    </TableCell>
                    <TableCell className="text-right">
                      {activity.elevation_gain !== null
                        ? `${Math.round(activity.elevation_gain)} m`
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {activity.avg_heart_rate !== null
                        ? `${activity.avg_heart_rate} bpm`
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {activity.max_heart_rate !== null
                        ? `${activity.max_heart_rate} bpm`
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Activity</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{activity.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(activity.id, activity.name)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Activities;
