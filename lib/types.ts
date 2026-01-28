// Shared TypeScript types for Scatterplot Platform

export type UserRole = 'RBT' | 'BCBA' | 'ADMIN';

export type IntervalValue = 'ind' | 'err' | 'skip' | '';

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Client with behaviors loaded
export interface ClientWithBehaviors {
  id: string;
  name: string;
  identifier: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  archivedAt: Date | null;
  behaviors: BehaviorSummary[];
}

export interface BehaviorSummary {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  archivedAt: Date | null;
}

// Session with intervals for data entry
export interface SessionWithIntervals {
  id: string;
  clientId: string;
  sessionDate: Date;
  userId: string;
  notes: string | null;
  intervals: IntervalData[];
}

export interface IntervalData {
  id: string;
  behaviorId: string;
  intervalIndex: number;
  value: IntervalValue;
}

// Form data for creating/updating
export interface CreateClientInput {
  name: string;
  identifier?: string;
  notes?: string;
}

export interface CreateBehaviorInput {
  clientId: string;
  name: string;
  description?: string;
  color?: string;
}

export interface CreateSessionInput {
  clientId: string;
  sessionDate: string; // ISO date string
  notes?: string;
}

export interface UpdateIntervalsInput {
  sessionId: string;
  intervals: {
    behaviorId: string;
    intervalIndex: number;
    value: IntervalValue;
  }[];
}

// Report types
export interface TrendDataPoint {
  date: string;
  indCount: number;
  errCount: number;
  skipCount: number;
  totalObserved: number;
}

export interface HeatmapDataPoint {
  intervalIndex: number;
  count: number;
  dayOfWeek: number;
}

// Time utilities
export const INTERVALS_PER_DAY = 96;
export const MINUTES_PER_INTERVAL = 15;

export function intervalIndexToTime(index: number): string {
  const totalMinutes = index * MINUTES_PER_INTERVAL;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const period = hours < 12 ? 'AM' : 'PM';
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

export function timeToIntervalIndex(hours: number, minutes: number): number {
  const totalMinutes = hours * 60 + minutes;
  return Math.floor(totalMinutes / MINUTES_PER_INTERVAL);
}
