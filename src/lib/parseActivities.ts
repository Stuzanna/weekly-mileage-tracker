export interface Activity {
  id: string;
  date: Date;
  name: string;
  type: string;
  distanceKm: number;
  elapsedTime: number;
  movingTime: number;
  elevationGain: number;
  avgHeartRate: number | null;
  maxHeartRate: number | null;
}

export interface WeekData {
  weekStart: Date;
  weekEnd: Date;
  weekLabel: string;
  totalKm: number;
  activities: Activity[];
  activityCount: number;
}

function parseDate(dateStr: string): Date {
  // Format: "27 Oct 2019, 11:02:43"
  const months: Record<string, number> = {
    'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
    'Jul': 6, 'Aug': 7, 'Sept': 8, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
  };
  
  const match = dateStr.match(/(\d+)\s+(\w+)\s+(\d{4}),?\s*(\d{1,2}):(\d{2}):?(\d{2})?/);
  if (!match) return new Date(dateStr);
  
  const [, day, monthStr, year, hours, minutes, seconds = '0'] = match;
  const month = months[monthStr] ?? 0;
  
  return new Date(
    parseInt(year),
    month,
    parseInt(day),
    parseInt(hours),
    parseInt(minutes),
    parseInt(seconds)
  );
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekEnd(weekStart: Date): Date {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}

function formatWeekLabel(weekStart: Date): string {
  const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  const endDate = new Date(weekStart);
  endDate.setDate(endDate.getDate() + 6);
  
  const startStr = weekStart.toLocaleDateString('en-GB', options);
  const endStr = endDate.toLocaleDateString('en-GB', options);
  const year = weekStart.getFullYear();
  
  return `${startStr} - ${endStr} '${year.toString().slice(2)}`;
}

export function parseCSV(csvText: string): Activity[] {
  const lines = csvText.split('\n');
  const headers = lines[0].split(',');
  
  // Find column indices
  const idIdx = headers.findIndex(h => h.includes('Activity ID'));
  const dateIdx = headers.findIndex(h => h.includes('Activity Date'));
  const nameIdx = headers.findIndex(h => h.includes('Activity Name'));
  const typeIdx = headers.findIndex(h => h.includes('Activity Type'));
  
  // Distance column (18th column based on the data structure, in meters)
  const distanceIdx = 17; // The detailed Distance column in meters
  const elapsedTimeIdx = 15;
  const movingTimeIdx = 16;
  const elevationIdx = 20;
  const avgHRIdx = 31;
  const maxHRIdx = 30;
  
  const activities: Activity[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    // Parse CSV properly handling quoted fields
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    
    const distanceMeters = parseFloat(values[distanceIdx]) || 0;
    const distanceKm = distanceMeters / 1000;
    
    if (distanceKm <= 0) continue; // Skip activities with no distance
    
    activities.push({
      id: values[idIdx] || String(i),
      date: parseDate(values[dateIdx] || ''),
      name: values[nameIdx] || 'Unknown Activity',
      type: values[typeIdx] || 'Unknown',
      distanceKm,
      elapsedTime: parseFloat(values[elapsedTimeIdx]) || 0,
      movingTime: parseFloat(values[movingTimeIdx]) || 0,
      elevationGain: parseFloat(values[elevationIdx]) || 0,
      avgHeartRate: parseFloat(values[avgHRIdx]) || null,
      maxHeartRate: parseFloat(values[maxHRIdx]) || null,
    });
  }
  
  return activities.sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function groupByWeek(activities: Activity[]): WeekData[] {
  const weekMap = new Map<string, WeekData>();
  
  for (const activity of activities) {
    const weekStart = getWeekStart(activity.date);
    const key = weekStart.toISOString();
    
    if (!weekMap.has(key)) {
      weekMap.set(key, {
        weekStart,
        weekEnd: getWeekEnd(weekStart),
        weekLabel: formatWeekLabel(weekStart),
        totalKm: 0,
        activities: [],
        activityCount: 0,
      });
    }
    
    const week = weekMap.get(key)!;
    week.totalKm += activity.distanceKm;
    week.activities.push(activity);
    week.activityCount++;
  }
  
  return Array.from(weekMap.values()).sort(
    (a, b) => a.weekStart.getTime() - b.weekStart.getTime()
  );
}

export function calculateStats(activities: Activity[], weeks: WeekData[]) {
  const totalKm = activities.reduce((sum, a) => sum + a.distanceKm, 0);
  const avgPerWeek = weeks.length > 0 ? totalKm / weeks.length : 0;
  const maxWeek = weeks.reduce((max, w) => w.totalKm > max.totalKm ? w : max, weeks[0]);
  const totalActivities = activities.length;
  const avgPerActivity = totalActivities > 0 ? totalKm / totalActivities : 0;
  
  // Activity type breakdown
  const typeBreakdown = activities.reduce((acc, a) => {
    acc[a.type] = (acc[a.type] || 0) + a.distanceKm;
    return acc;
  }, {} as Record<string, number>);
  
  return {
    totalKm,
    avgPerWeek,
    maxWeek,
    totalActivities,
    avgPerActivity,
    typeBreakdown,
    weekCount: weeks.length,
  };
}
