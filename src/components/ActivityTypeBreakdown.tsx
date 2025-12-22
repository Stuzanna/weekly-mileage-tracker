import { Activity } from "lucide-react";

interface ActivityTypeBreakdownProps {
  typeBreakdown: Record<string, number>;
}

const typeColors: Record<string, string> = {
  Run: 'bg-primary',
  Ride: 'bg-blue-500',
  Swim: 'bg-cyan-500',
  Walk: 'bg-green-500',
  Hike: 'bg-emerald-500',
  Workout: 'bg-purple-500',
  WeightTraining: 'bg-violet-500',
  Yoga: 'bg-pink-500',
};

export function ActivityTypeBreakdown({ typeBreakdown }: ActivityTypeBreakdownProps) {
  const entries = Object.entries(typeBreakdown).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((sum, [, km]) => sum + km, 0);
  
  return (
    <div className="bg-card rounded-lg p-6 shadow-card border border-border/50 animate-slide-up" style={{ animationDelay: '300ms' }}>
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          <Activity className="w-5 h-5" />
        </div>
        <h2 className="text-lg font-display font-bold text-foreground">By Activity Type</h2>
      </div>
      
      <div className="space-y-4">
        {entries.map(([type, km]) => {
          const percentage = (km / total) * 100;
          const colorClass = typeColors[type] || 'bg-muted-foreground';
          
          return (
            <div key={type}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-foreground">{type}</span>
                <span className="text-sm text-muted-foreground">
                  {km.toFixed(1)} km ({percentage.toFixed(0)}%)
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full ${colorClass} rounded-full transition-all duration-700 ease-out`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
