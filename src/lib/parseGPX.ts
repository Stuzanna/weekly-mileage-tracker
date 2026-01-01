import gpxParser from "gpxparser";
import { Activity } from "./parseActivities";

export interface GPXParseResult {
  activity: Activity;
  error?: undefined;
}

export interface GPXParseError {
  activity?: undefined;
  error: string;
}

export type GPXResult = GPXParseResult | GPXParseError;

export function parseGPX(gpxText: string, fileName: string): GPXResult {
  try {
    const gpx = new gpxParser();
    gpx.parse(gpxText);

    if (!gpx.tracks || gpx.tracks.length === 0) {
      return { error: "No tracks found in GPX file" };
    }

    const track = gpx.tracks[0];
    const points = track.points;

    if (!points || points.length < 2) {
      return { error: "Track has insufficient points" };
    }

    // Get start and end times
    const startTime = points[0].time ? new Date(points[0].time) : new Date();
    const endTime = points[points.length - 1].time 
      ? new Date(points[points.length - 1].time) 
      : startTime;

    // Calculate elapsed time in seconds
    const elapsedTime = Math.round((endTime.getTime() - startTime.getTime()) / 1000);

    // Distance in km (gpxparser provides distance in meters via track.distance.total)
    const distanceKm = track.distance.total / 1000;

    // Elevation gain (gpxparser provides this via track.elevation.pos)
    const elevationGain = track.elevation?.pos || 0;

    // Generate a unique ID based on timestamp and filename
    const uniqueId = `gpx-${startTime.getTime()}-${fileName.replace(/[^a-zA-Z0-9]/g, '')}`;

    // Use track name or derive from filename
    const name = track.name || fileName.replace(/\.gpx$/i, '') || "GPX Run";

    const activity: Activity = {
      id: uniqueId,
      date: startTime,
      name,
      type: "Run",
      distanceKm,
      elapsedTime,
      movingTime: elapsedTime, // GPX doesn't distinguish moving vs stopped
      elevationGain,
      avgHeartRate: null, // GPX typically doesn't include HR data
      maxHeartRate: null,
    };

    return { activity };
  } catch (err) {
    console.error("GPX parsing error:", err);
    return { error: "Invalid GPX file format" };
  }
}
