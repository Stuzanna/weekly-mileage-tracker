import { WeekData } from "@/lib/parseActivities";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface RecentWeeksProps {
  weeks: WeekData[];
}

export function RecentWeeks({ weeks }: RecentWeeksProps) {
  const recentWeeks = weeks.slice(-8).reverse();
  
  return (
    <div className="bg-card rounded-lg p-6 shadow-card border border-border/50 animate-slide-up" style={{ animationDelay: '400ms' }}>
      <h2 className="text-lg font-display font-bold text-foreground mb-5">Recent Weeks</h2>
      
      <div className="space-y-3">
        {recentWeeks.map((week, index) => {
          const prevWeek = recentWeeks[index + 1];
          const change = prevWeek ? week.totalKm - prevWeek.totalKm : 0;
          const changePercent = prevWeek && prevWeek.totalKm > 0 
            ? (change / prevWeek.totalKm) * 100 
            : 0;
          
          return (
            <div 
              key={week.weekLabel}
              className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{week.weekLabel}</p>
                <p className="text-xs text-muted-foreground">
                  {week.activityCount} {week.activityCount === 1 ? 'activity' : 'activities'}
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-lg font-display font-bold text-foreground">
                  {week.totalKm.toFixed(1)} km
                </span>
                
                {index < recentWeeks.length - 1 && (
                  <div className={`flex items-center gap-1 text-xs ${
                    change > 0 ? 'text-strava-success' : change < 0 ? 'text-destructive' : 'text-muted-foreground'
                  }`}>
                    {change > 0 ? (
                      <TrendingUp className="w-3.5 h-3.5" />
                    ) : change < 0 ? (
                      <TrendingDown className="w-3.5 h-3.5" />
                    ) : (
                      <Minus className="w-3.5 h-3.5" />
                    )}
                    <span>{Math.abs(changePercent).toFixed(0)}%</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
