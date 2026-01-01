import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

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
            {activities.length} {activities.length === 1 ? "activity" : "activities"}
          </span>
        </div>

        {activities.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No activities found.</p>
            <Button
              variant="link"
              onClick={() => navigate("/")}
              className="mt-2"
            >
              Go to Dashboard to upload activities
            </Button>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.map((activity) => (
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
