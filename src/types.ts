export type SubjectType = 'aws' | 'golang' | 'leetcode' | string

export type TimeOfDay = 'morning' | 'evening' | 'afternoon'

export interface StudyRecord {
  id: string
  date: string // YYYY-MM-DD
  subject: SubjectType
  subjectName: string
  durationMinutes: number
  title: string
  notes: string
  completed: boolean
  createdAt: string
  updatedAt: string
  timeOfDay?: TimeOfDay
  startTime?: string // Optional specific time e.g. "08:30" or "20:00"
}

export interface WeeklyTarget {
  id: string
  subject: SubjectType
  name: string
  targetSessionsPerWeek: number
  targetHoursPerWeek: number // Hours goal for this subject per week (e.g. 2.0)
  minDurationMinutes?: number
  color: string
  iconName?: 'cloud' | 'code' | 'cpu' | 'terminal' | 'book' | 'star'
}

export interface WeeklyGoalSettings {
  totalHoursTarget: number // Total hours goal for the whole week (e.g. 6.0)
  targets: WeeklyTarget[]
}

export interface AppDataExport {
  version: string
  exportedAt: string
  totalHoursTarget?: number
  targets: WeeklyTarget[]
  records: StudyRecord[]
}

export interface WeekProgressSummary {
  weekStart: string // YYYY-MM-DD
  weekEnd: string // YYYY-MM-DD
  weekNumber: number
  totalMinutes: number
  totalHours: number
  totalHoursTarget: number
  isTotalHoursCompleted: boolean
  totalSessions: number
  targets: {
    target: WeeklyTarget
    currentSessions: number
    targetSessions: number
    totalMinutes: number
    actualHours: number
    targetHours: number
    isSessionsCompleted: boolean
    isHoursCompleted: boolean
    isCompleted: boolean
    pct?: number
    records: StudyRecord[]
  }[]
}
