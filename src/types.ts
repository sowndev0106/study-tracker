export type SubjectType = 'aws' | 'golang' | 'leetcode' | string

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
}

export interface WeeklyTarget {
  id: string
  subject: SubjectType
  name: string
  targetSessionsPerWeek: number
  minDurationMinutes?: number
  color: string
  iconName?: 'cloud' | 'code' | 'cpu' | 'terminal' | 'book' | 'star'
}

export interface AppDataExport {
  version: string
  exportedAt: string
  targets: WeeklyTarget[]
  records: StudyRecord[]
}

export interface WeekProgressSummary {
  weekStart: string // YYYY-MM-DD
  weekEnd: string // YYYY-MM-DD
  weekNumber: number
  targets: {
    target: WeeklyTarget
    currentSessions: number
    targetSessions: number
    totalMinutes: number
    isCompleted: boolean
    records: StudyRecord[]
  }[]
  totalMinutes: number
  totalSessions: number
}
