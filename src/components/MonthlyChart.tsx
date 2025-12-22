import { Activity as ActivityType } from "@/lib/parseActivities";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Calendar } from "lucide-react";

interface MonthlyChartProps {
  activities: ActivityType[];
}

interface MonthData {
  month: string;
  monthLabel: string;
  totalKm: number;
}

function groupByMonth(activities: ActivityType[]): MonthData[] {
  const monthMap = new Map<string, MonthData>();
  
  for (const activity of activities) {
    const year = activity.date.getFullYear();
    const month = activity.date.getMonth();
    const key = `${year}-${String(month).padStart(2, '0')}`;
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthLabel = `${monthNames[month]} '${String(year).slice(2)}`;
    
    if (!monthMap.has(key)) {
      monthMap.set(key, {
        month: key,
        monthLabel,
        totalKm: 0,
      });
    }
    
    monthMap.get(key)!.totalKm += activity.distanceKm;
  }
  
  return Array.from(monthMap.values()).sort((a, b) => a.month.localeCompare(b.month));
}

export function MonthlyChart({ activities }: MonthlyChartProps) {
  const monthData = groupByMonth(activities);
  const maxKm = Math.max(...monthData.map(m => m.totalKm), 0);
  
  return (
    <div className="bg-card rounded-lg p-6 shadow-card border border-border/50 animate-slide-up" style={{ animationDelay: '300ms' }}>
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          <Calendar className="w-5 h-5" />
        </div>
        <h2 className="text-lg font-display font-bold text-foreground">Monthly Distance</h2>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={monthData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <XAxis 
              dataKey="monthLabel" 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              tickLine={{ stroke: 'hsl(var(--border))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              interval={Math.floor(monthData.length / 8)}
            />
            <YAxis 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              tickLine={{ stroke: 'hsl(var(--border))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickFormatter={(value) => `${value}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
              formatter={(value: number) => [`${value.toFixed(1)} km`, 'Distance']}
            />
            <Bar dataKey="totalKm" radius={[4, 4, 0, 0]}>
              {monthData.map((entry, index) => (
                <Cell 
                  key={entry.month}
                  fill={entry.totalKm === maxKm 
                    ? 'hsl(var(--primary))' 
                    : 'hsl(var(--primary) / 0.6)'
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}