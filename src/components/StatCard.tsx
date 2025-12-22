import { ReactNode } from "react";

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  subValue?: string;
  delay?: number;
}

export function StatCard({ icon, label, value, subValue, delay = 0 }: StatCardProps) {
  return (
    <div 
      className="bg-card rounded-lg p-5 shadow-card border border-border/50 hover:border-primary/30 transition-all duration-300 animate-slide-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start gap-4">
        <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-muted-foreground text-sm font-medium mb-1">{label}</p>
          <p className="text-2xl font-display font-bold text-foreground tracking-tight">
            {value}
          </p>
          {subValue && (
            <p className="text-sm text-muted-foreground mt-1">{subValue}</p>
          )}
        </div>
      </div>
    </div>
  );
}
