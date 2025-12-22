import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { WeekData } from "@/lib/parseActivities";
import { useState } from "react";

interface WeeklyChartProps {
  weeks: WeekData[];
  visibleWeeks?: number;
}

export function WeeklyChart({ weeks, visibleWeeks = 52 }: WeeklyChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  
  // Show last N weeks
  const displayWeeks = weeks.slice(-visibleWeeks).map((w, index) => ({
    ...w,
    shortLabel: w.weekStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
    index,
  }));

  const maxKm = Math.max(...displayWeeks.map(w => w.totalKm));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as WeekData & { shortLabel: string };
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-foreground mb-1">{data.weekLabel}</p>
          <p className="text-lg font-display font-bold text-primary">
            {data.totalKm.toFixed(1)} km
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {data.activityCount} {data.activityCount === 1 ? 'activity' : 'activities'}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-card rounded-lg p-6 shadow-card border border-border/50 animate-slide-up" style={{ animationDelay: '200ms' }}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-display font-bold text-foreground">Weekly Mileage</h2>
        <span className="text-sm text-muted-foreground">Last {displayWeeks.length} weeks</span>
      </div>
      
      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={displayWeeks}
            margin={{ top: 20, right: 20, left: 0, bottom: 60 }}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <XAxis 
              dataKey="shortLabel" 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              angle={-45}
              textAnchor="end"
              height={60}
              interval={Math.floor(displayWeeks.length / 12)}
            />
            <YAxis 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value} km`}
              width={60}
            />
            <Tooltip 
              content={<CustomTooltip />}
              cursor={{ fill: 'hsl(var(--muted) / 0.3)' }}
            />
            <Bar 
              dataKey="totalKm" 
              radius={[4, 4, 0, 0]}
              onMouseEnter={(_, index) => setHoveredIndex(index)}
            >
              {displayWeeks.map((entry, index) => (
                <Cell 
                  key={entry.weekLabel}
                  fill={hoveredIndex === index 
                    ? 'hsl(var(--strava-coral-glow))' 
                    : `hsl(var(--primary) / ${0.4 + (entry.totalKm / maxKm) * 0.6})`
                  }
                  style={{ transition: 'fill 0.2s ease' }}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
